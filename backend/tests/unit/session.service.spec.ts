import { describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { UserType } from '@makaan/shared/constants/enums';
import { DataSource, Repository } from 'typeorm';

import {
  AuthSession,
  AuthSessionScope,
} from '../../src/models/auth-session.entity';
import { UserStatus } from '../../src/models/user.entity';
import {
  protectedTokenMatches,
  SessionService,
} from '../../src/services/session.service';

const settings = (
  overrides: Record<string, string | number> = {},
): ConfigService => {
  const values: Record<string, string | number> = {
    APP_MODE: 'test',
    COOKIE_SECURE: 'false',
    SESSION_TOKEN_PEPPER: 'session-pepper',
    CSRF_TOKEN_PEPPER: 'csrf-pepper',
    SELLER_SESSION_IDLE_MINUTES: 60,
    SELLER_SESSION_ABSOLUTE_HOURS: 24,
    ADMIN_SESSION_IDLE_MINUTES: 15,
    ADMIN_SESSION_ABSOLUTE_HOURS: 8,
    ...overrides,
  };
  return {
    get: jest.fn((key: string) => values[key]),
    getOrThrow: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
};

function sessionRepository(
  found: AuthSession | null = null,
  affected = 1,
): Repository<AuthSession> & {
  update: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
} {
  const query = {
    addSelect: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(async () => found),
  };
  const create = jest.fn((input: Partial<AuthSession>) => ({
    id: 'session-1',
    ...input,
  }));
  const save = jest.fn(async (session: AuthSession) => session);
  const update = jest.fn(async () => ({ affected }));
  return {
    create,
    save,
    update,
    createQueryBuilder: jest.fn(() => query),
  } as unknown as Repository<AuthSession> & {
    update: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
}

function service(
  repository = sessionRepository(),
  config = settings(),
): SessionService {
  return new SessionService(
    config,
    { transaction: jest.fn() } as unknown as DataSource,
    repository,
  );
}

describe('SessionService', () => {
  it('uses host-only secure production cookie names and non-host local cookie names', () => {
    const production = service(
      sessionRepository(),
      settings({ APP_MODE: 'production', COOKIE_SECURE: 'true' }),
    );
    const local = service();

    expect(production.cookieName(AuthSessionScope.ADMIN)).toBe(
      '__Host-makaan-admin',
    );
    expect(production.csrfCookieName(AuthSessionScope.SELLER)).toBe(
      '__Host-makaan-seller-csrf',
    );
    expect(
      production.sessionCookieSettings(AuthSessionScope.ADMIN),
    ).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
    expect(local.cookieName(AuthSessionScope.SELLER)).toBe('makaan-seller');
    expect(local.csrfCookieSettings(AuthSessionScope.SELLER).httpOnly).toBe(
      false,
    );
  });

  it('issues opaque credentials while persisting hashes only', async () => {
    const repository = sessionRepository();
    const result = await service(repository).issue(
      { id: 'user-1', userType: UserType.SELLER, status: UserStatus.ACTIVE },
      AuthSessionScope.SELLER,
      {},
      new Date('2026-01-01T00:00:00Z'),
    );
    const persisted = repository.save.mock.calls[0]?.[0] as AuthSession;

    expect(result.sessionToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(result.csrfToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(persisted.tokenHash).not.toBe(result.sessionToken);
    expect(persisted.csrfHash).not.toBe(result.csrfToken);
    expect(JSON.stringify(persisted)).not.toContain(result.sessionToken);
    expect(JSON.stringify(persisted)).not.toContain(result.csrfToken);
    expect(persisted.absoluteExpiresAt.toISOString()).toBe(
      '2026-01-02T00:00:00.000Z',
    );
  });

  it('rejects incompatible roles, blocked users, expired sessions, and revoked sessions', async () => {
    await expect(
      service().issue(
        { id: 'buyer', userType: UserType.BUYER, status: UserStatus.ACTIVE },
        AuthSessionScope.SELLER,
      ),
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      service().issue(
        {
          id: 'blocked',
          userType: UserType.SELLER,
          status: UserStatus.BLOCKED,
        },
        AuthSessionScope.SELLER,
      ),
    ).rejects.toMatchObject({ status: 401 });

    const expired = {
      id: 'expired',
      sessionScope: AuthSessionScope.SELLER,
      roleAtIssue: UserType.SELLER,
      revokedAt: null,
      idleExpiresAt: new Date('2026-01-01T00:00:00Z'),
      absoluteExpiresAt: new Date('2026-01-02T00:00:00Z'),
      user: { status: UserStatus.ACTIVE, userType: UserType.SELLER },
    } as AuthSession;
    const repo = sessionRepository(expired);
    await expect(
      service(repo).authenticate(
        'opaque',
        AuthSessionScope.SELLER,
        new Date('2026-01-03T00:00:00Z'),
      ),
    ).rejects.toMatchObject({ status: 401 });
    expect(repo.update).toHaveBeenCalledWith(
      'expired',
      expect.objectContaining({
        revocationReason: 'session_no_longer_eligible',
      }),
    );

    const revoked = {
      ...expired,
      revokedAt: new Date('2025-12-31T00:00:00Z'),
    } as AuthSession;
    await expect(
      service(sessionRepository(revoked)).authenticate(
        'opaque',
        AuthSessionScope.SELLER,
      ),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('uses timing-safe CSRF matching and rejects rotation when no active session is affected', async () => {
    const repository = sessionRepository(null, 0);
    const sessionService = service(repository);
    const csrf = 'csrf-value';
    const session = {
      csrfHash: require('node:crypto')
        .createHmac('sha256', 'csrf-pepper')
        .update(csrf)
        .digest('hex'),
    } as AuthSession;

    expect(sessionService.csrfMatches(session, csrf)).toBe(true);
    expect(sessionService.csrfMatches(session, 'different')).toBe(false);
    expect(
      protectedTokenMatches(session.csrfHash, undefined, 'csrf-pepper'),
    ).toBe(false);
    await expect(sessionService.rotateCsrf('missing')).rejects.toMatchObject({
      status: 401,
    });
  });

  it('refuses to rotate an expired session', async () => {
    const expired = {
      id: 'expired',
      sessionScope: AuthSessionScope.SELLER,
      roleAtIssue: UserType.SELLER,
      revokedAt: null,
      idleExpiresAt: new Date('2026-01-01T00:00:00Z'),
      absoluteExpiresAt: new Date('2026-01-02T00:00:00Z'),
      user: { status: UserStatus.ACTIVE, userType: UserType.SELLER },
    } as AuthSession;
    const query = {
      setLock: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(async () => expired),
    };
    const repository = {
      createQueryBuilder: jest.fn(() => query),
    } as unknown as Repository<AuthSession>;
    const dataSource = {
      transaction: jest.fn(
        async (
          work: (manager: {
            getRepository: () => Repository<AuthSession>;
          }) => Promise<unknown>,
        ) => work({ getRepository: () => repository }),
      ),
    } as unknown as DataSource;
    const sessionService = new SessionService(
      settings(),
      dataSource,
      sessionRepository(),
    );

    await expect(
      sessionService.rotate(
        'expired',
        'rotated',
        new Date('2026-01-03T00:00:00Z'),
      ),
    ).rejects.toMatchObject({ status: 401 });
  });
});
