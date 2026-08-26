import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

import { UserType } from '@makaan/shared/constants/enums';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';

import { AuthSession, AuthSessionScope } from '../models/auth-session.entity';
import { User, UserStatus } from '../models/user.entity';

const TOKEN_BYTES = 32;

export const SESSION_COOKIE_BASENAMES = {
  [AuthSessionScope.SELLER]: 'makaan-seller',
  [AuthSessionScope.ADMIN]: 'makaan-admin',
} as const;

export const SESSION_CSRF_COOKIE_BASENAMES = {
  [AuthSessionScope.SELLER]: 'makaan-seller-csrf',
  [AuthSessionScope.ADMIN]: 'makaan-admin-csrf',
} as const;

export interface IssuedSession {
  session: AuthSession;
  sessionToken: string;
  csrfToken: string;
}

export interface SessionCookieSettings {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  path: '/';
  maxAge: number;
}

export function hashProtectedToken(token: string, pepper: string): string {
  return createHmac('sha256', pepper).update(token).digest('hex');
}

export function newOpaqueToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

export function protectedTokenMatches(
  storedHash: string,
  rawToken: string | undefined,
  pepper: string,
): boolean {
  if (!rawToken) {
    return false;
  }
  const candidate = Buffer.from(hashProtectedToken(rawToken, pepper), 'utf8');
  const stored = Buffer.from(storedHash, 'utf8');
  return (
    stored.length === candidate.length && timingSafeEqual(stored, candidate)
  );
}

@Injectable()
export class SessionService {
  constructor(
    private readonly configService: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(AuthSession)
    private readonly sessionRepository: Repository<AuthSession>,
  ) {}

  cookieName(scope: AuthSessionScope): string {
    return this.isProduction()
      ? `__Host-${SESSION_COOKIE_BASENAMES[scope]}`
      : SESSION_COOKIE_BASENAMES[scope];
  }

  csrfCookieName(scope: AuthSessionScope): string {
    return this.isProduction()
      ? `__Host-${SESSION_CSRF_COOKIE_BASENAMES[scope]}`
      : SESSION_CSRF_COOKIE_BASENAMES[scope];
  }

  sessionCookieSettings(scope: AuthSessionScope): SessionCookieSettings {
    return {
      httpOnly: true,
      secure: this.configService.get<string>('COOKIE_SECURE') === 'true',
      sameSite: 'lax',
      path: '/',
      maxAge: this.absoluteLifetimeMs(scope),
    };
  }

  csrfCookieSettings(scope: AuthSessionScope): SessionCookieSettings {
    return { ...this.sessionCookieSettings(scope), httpOnly: false };
  }

  async issue(
    user: Pick<User, 'id' | 'userType' | 'status'>,
    scope: AuthSessionScope,
    context: { ipPrefixHash?: string; userAgentHash?: string } = {},
    now = new Date(),
  ): Promise<IssuedSession> {
    this.assertEligibleUser(user, scope);
    const sessionToken = newOpaqueToken();
    const csrfToken = newOpaqueToken();
    const idleExpiresAt = new Date(now.getTime() + this.idleLifetimeMs(scope));
    const absoluteExpiresAt = new Date(
      now.getTime() + this.absoluteLifetimeMs(scope),
    );

    const session = this.sessionRepository.create({
      userId: user.id,
      sessionScope: scope,
      roleAtIssue: user.userType,
      tokenHash: this.hashSessionToken(sessionToken),
      csrfHash: this.hashCsrfToken(csrfToken),
      lastSeenAt: now,
      idleExpiresAt,
      absoluteExpiresAt,
      revokedAt: null,
      revocationReason: null,
      rotatedFromId: null,
      ipPrefixHash: context.ipPrefixHash ?? null,
      userAgentHash: context.userAgentHash ?? null,
    });

    return {
      session: await this.sessionRepository.save(session),
      sessionToken,
      csrfToken,
    };
  }

  async authenticate(
    rawToken: string | undefined,
    scope: AuthSessionScope,
    now = new Date(),
  ): Promise<AuthSession> {
    if (!rawToken) {
      throw new UnauthorizedException('session_invalid');
    }

    const session = await this.findByRawToken(rawToken);
    if (!session || session.sessionScope !== scope) {
      throw new UnauthorizedException('session_invalid');
    }

    const expectedRole =
      scope === AuthSessionScope.ADMIN ? UserType.ADMIN : UserType.SELLER;
    const invalid =
      session.revokedAt !== null ||
      session.idleExpiresAt.getTime() <= now.getTime() ||
      session.absoluteExpiresAt.getTime() <= now.getTime() ||
      session.user.status !== UserStatus.ACTIVE ||
      session.user.userType !== expectedRole ||
      session.roleAtIssue !== expectedRole;
    if (invalid) {
      if (!session.revokedAt) {
        await this.sessionRepository.update(session.id, {
          revokedAt: now,
          revocationReason: 'session_no_longer_eligible',
        });
      }
      throw new UnauthorizedException('session_invalid');
    }

    const idleExpiresAt = new Date(
      Math.min(
        now.getTime() + this.idleLifetimeMs(scope),
        session.absoluteExpiresAt.getTime(),
      ),
    );
    await this.sessionRepository.update(session.id, {
      lastSeenAt: now,
      idleExpiresAt,
    });
    session.lastSeenAt = now;
    session.idleExpiresAt = idleExpiresAt;
    return session;
  }

  async rotateCsrf(sessionId: string): Promise<string> {
    const csrfToken = newOpaqueToken();
    const result = await this.sessionRepository.update(
      { id: sessionId, revokedAt: IsNull() },
      { csrfHash: this.hashCsrfToken(csrfToken) },
    );
    if (result.affected !== 1) {
      throw new UnauthorizedException('session_invalid');
    }
    return csrfToken;
  }

  async rotate(
    sessionId: string,
    reason = 'rotated',
    now = new Date(),
  ): Promise<IssuedSession> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(AuthSession);
      const current = await repository
        .createQueryBuilder('session')
        .setLock('pessimistic_write')
        .leftJoinAndSelect('session.user', 'user')
        .where('session.id = :sessionId', { sessionId })
        .getOne();
      if (
        !current ||
        current.revokedAt ||
        current.idleExpiresAt.getTime() <= now.getTime() ||
        current.absoluteExpiresAt.getTime() <= now.getTime()
      ) {
        throw new UnauthorizedException('session_invalid');
      }
      this.assertEligibleUser(current.user, current.sessionScope);

      current.revokedAt = now;
      current.revocationReason = reason;
      await repository.save(current);

      const sessionToken = newOpaqueToken();
      const csrfToken = newOpaqueToken();
      const replacement = repository.create({
        userId: current.userId,
        sessionScope: current.sessionScope,
        roleAtIssue: current.roleAtIssue,
        tokenHash: this.hashSessionToken(sessionToken),
        csrfHash: this.hashCsrfToken(csrfToken),
        lastSeenAt: now,
        idleExpiresAt: new Date(
          now.getTime() + this.idleLifetimeMs(current.sessionScope),
        ),
        absoluteExpiresAt: new Date(
          now.getTime() + this.absoluteLifetimeMs(current.sessionScope),
        ),
        revokedAt: null,
        revocationReason: null,
        rotatedFromId: current.id,
        ipPrefixHash: current.ipPrefixHash,
        userAgentHash: current.userAgentHash,
      });

      return {
        session: await repository.save(replacement),
        sessionToken,
        csrfToken,
      };
    });
  }

  async revokeByToken(
    rawToken: string | undefined,
    scope: AuthSessionScope,
    reason = 'logout',
    now = new Date(),
  ): Promise<void> {
    if (!rawToken) {
      return;
    }
    await this.sessionRepository.update(
      {
        tokenHash: this.hashSessionToken(rawToken),
        sessionScope: scope,
        revokedAt: IsNull(),
      },
      { revokedAt: now, revocationReason: reason },
    );
  }

  async revokeAllForUser(
    userId: string,
    reason: string,
    now = new Date(),
  ): Promise<void> {
    await this.sessionRepository.update(
      { userId, revokedAt: IsNull() },
      { revokedAt: now, revocationReason: reason },
    );
  }

  csrfMatches(session: AuthSession, rawCsrfToken: string | undefined): boolean {
    return protectedTokenMatches(
      session.csrfHash,
      rawCsrfToken,
      this.configService.getOrThrow<string>('CSRF_TOKEN_PEPPER'),
    );
  }

  private async findByRawToken(rawToken: string): Promise<AuthSession | null> {
    return this.sessionRepository
      .createQueryBuilder('session')
      .addSelect(['session.tokenHash', 'session.csrfHash'])
      .leftJoinAndSelect('session.user', 'user')
      .where('session.token_hash = :tokenHash', {
        tokenHash: this.hashSessionToken(rawToken),
      })
      .getOne();
  }

  private hashSessionToken(token: string): string {
    return hashProtectedToken(
      token,
      this.configService.getOrThrow<string>('SESSION_TOKEN_PEPPER'),
    );
  }

  private hashCsrfToken(token: string): string {
    return hashProtectedToken(
      token,
      this.configService.getOrThrow<string>('CSRF_TOKEN_PEPPER'),
    );
  }

  private absoluteLifetimeMs(scope: AuthSessionScope): number {
    const name =
      scope === AuthSessionScope.ADMIN
        ? 'ADMIN_SESSION_ABSOLUTE_HOURS'
        : 'SELLER_SESSION_ABSOLUTE_HOURS';
    return this.configService.getOrThrow<number>(name) * 60 * 60 * 1000;
  }

  private idleLifetimeMs(scope: AuthSessionScope): number {
    const name =
      scope === AuthSessionScope.ADMIN
        ? 'ADMIN_SESSION_IDLE_MINUTES'
        : 'SELLER_SESSION_IDLE_MINUTES';
    return this.configService.getOrThrow<number>(name) * 60 * 1000;
  }

  private assertEligibleUser(
    user: Pick<User, 'userType' | 'status'>,
    scope: AuthSessionScope,
  ): void {
    const expectedRole =
      scope === AuthSessionScope.ADMIN ? UserType.ADMIN : UserType.SELLER;
    if (user.status !== UserStatus.ACTIVE || user.userType !== expectedRole) {
      throw new UnauthorizedException('session_invalid');
    }
  }

  private isProduction(): boolean {
    return ['demo', 'production'].includes(
      this.configService.get<string>('APP_MODE') ?? '',
    );
  }
}
