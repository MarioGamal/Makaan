import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { AnonymousSubject } from '../models/anonymous-subject.entity';

import {
  hashProtectedToken,
  newOpaqueToken,
  protectedTokenMatches,
  SessionCookieSettings,
} from './session.service';

const ANONYMOUS_COOKIE_BASENAME = 'makaan-anonymous';
const ANONYMOUS_CSRF_COOKIE_BASENAME = 'makaan-anonymous-csrf';

export interface IssuedAnonymousSubject {
  subject: AnonymousSubject;
  subjectToken: string;
  csrfToken: string;
}

@Injectable()
export class AnonymousSubjectService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AnonymousSubject)
    private readonly subjectRepository: Repository<AnonymousSubject>,
  ) {}

  cookieName(): string {
    return this.isProduction()
      ? `__Host-${ANONYMOUS_COOKIE_BASENAME}`
      : ANONYMOUS_COOKIE_BASENAME;
  }

  csrfCookieName(): string {
    return this.isProduction()
      ? `__Host-${ANONYMOUS_CSRF_COOKIE_BASENAME}`
      : ANONYMOUS_CSRF_COOKIE_BASENAME;
  }

  subjectCookieSettings(): SessionCookieSettings {
    return {
      httpOnly: true,
      secure: this.configService.get<string>('COOKIE_SECURE') === 'true',
      sameSite: 'lax',
      path: '/',
      maxAge: this.lifetimeMs(),
    };
  }

  csrfCookieSettings(): SessionCookieSettings {
    return { ...this.subjectCookieSettings(), httpOnly: false };
  }

  async issue(now = new Date()): Promise<IssuedAnonymousSubject> {
    const subjectToken = newOpaqueToken();
    const csrfToken = newOpaqueToken();
    const subject = this.subjectRepository.create({
      tokenHash: this.hashSubjectToken(subjectToken),
      csrfHash: this.hashCsrfToken(csrfToken),
      lastSeenAt: now,
      expiresAt: new Date(now.getTime() + this.lifetimeMs()),
      revokedAt: null,
    });

    return {
      subject: await this.subjectRepository.save(subject),
      subjectToken,
      csrfToken,
    };
  }

  async authenticate(
    rawToken: string | undefined,
    now = new Date(),
  ): Promise<AnonymousSubject> {
    if (!rawToken) {
      throw new UnauthorizedException('anonymous_subject_invalid');
    }

    const subject = await this.findByRawToken(rawToken);
    if (
      !subject ||
      subject.revokedAt ||
      (subject.expiresAt && subject.expiresAt.getTime() <= now.getTime())
    ) {
      throw new UnauthorizedException('anonymous_subject_invalid');
    }

    subject.lastSeenAt = now;
    await this.subjectRepository.update(subject.id, { lastSeenAt: now });
    return subject;
  }

  async issueOrRotateCsrf(
    rawToken: string | undefined,
    now = new Date(),
  ): Promise<IssuedAnonymousSubject> {
    if (!rawToken) {
      return this.issue(now);
    }

    try {
      const subject = await this.authenticate(rawToken, now);
      const csrfToken = newOpaqueToken();
      subject.csrfHash = this.hashCsrfToken(csrfToken);
      await this.subjectRepository.update(subject.id, {
        csrfHash: subject.csrfHash,
      });
      return { subject, subjectToken: rawToken, csrfToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return this.issue(now);
      }
      throw error;
    }
  }

  csrfMatches(
    subject: AnonymousSubject,
    rawCsrfToken: string | undefined,
  ): boolean {
    return protectedTokenMatches(
      subject.csrfHash,
      rawCsrfToken,
      this.configService.getOrThrow<string>('CSRF_TOKEN_PEPPER'),
    );
  }

  async revoke(rawToken: string | undefined, now = new Date()): Promise<void> {
    if (!rawToken) {
      return;
    }
    await this.subjectRepository.update(
      { tokenHash: this.hashSubjectToken(rawToken), revokedAt: IsNull() },
      { revokedAt: now },
    );
  }

  private async findByRawToken(
    rawToken: string,
  ): Promise<AnonymousSubject | null> {
    return this.subjectRepository
      .createQueryBuilder('subject')
      .addSelect(['subject.tokenHash', 'subject.csrfHash'])
      .where('subject.token_hash = :tokenHash', {
        tokenHash: this.hashSubjectToken(rawToken),
      })
      .getOne();
  }

  private hashSubjectToken(token: string): string {
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

  private lifetimeMs(): number {
    return (
      this.configService.getOrThrow<number>('SELLER_SESSION_ABSOLUTE_HOURS') *
      60 *
      60 *
      1000
    );
  }

  private isProduction(): boolean {
    return this.configService.get<string>('APP_MODE') === 'production';
  }
}
