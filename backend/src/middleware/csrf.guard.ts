import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { AnonymousSubject } from '../models/anonymous-subject.entity';
import { AuthSession, AuthSessionScope } from '../models/auth-session.entity';
import { AnonymousSubjectService } from '../services/anonymous-subject.service';
import { SessionService } from '../services/session.service';

export type CsrfScope = AuthSessionScope | 'anonymous';
export const CSRF_SCOPE_METADATA = 'makaan:csrf-scope';

export const RequireCsrfScope = (scope: CsrfScope) =>
  SetMetadata(CSRF_SCOPE_METADATA, scope);

export interface CsrfRequest extends Request {
  makaanSession?: AuthSession;
  makaanAnonymousSubject?: AnonymousSubject;
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
    private readonly anonymousSubjectService: AnonymousSubjectService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<CsrfRequest>();
    if (SAFE_METHODS.has(request.method.toUpperCase())) {
      return true;
    }

    const scope = this.reflector.getAllAndOverride<CsrfScope>(
      CSRF_SCOPE_METADATA,
      [context.getHandler(), context.getClass()],
    );
    if (!scope) {
      throw new ForbiddenException('csrf_scope_not_declared');
    }
    this.assertAllowedOrigin(request.headers.origin);

    const headerToken = request.headers['x-csrf-token'];
    if (typeof headerToken !== 'string' || !headerToken) {
      throw new ForbiddenException('csrf_invalid');
    }

    if (scope === 'anonymous') {
      const subjectToken = request.cookies?.[
        this.anonymousSubjectService.cookieName()
      ] as string | undefined;
      const cookieToken = request.cookies?.[
        this.anonymousSubjectService.csrfCookieName()
      ] as string | undefined;
      if (!subjectToken || cookieToken !== headerToken) {
        throw new ForbiddenException('csrf_invalid');
      }
      const subject =
        await this.anonymousSubjectService.authenticate(subjectToken);
      if (!this.anonymousSubjectService.csrfMatches(subject, headerToken)) {
        throw new ForbiddenException('csrf_invalid');
      }
      request.makaanAnonymousSubject = subject;
      return true;
    }

    const session = request.makaanSession;
    const cookieToken = request.cookies?.[
      this.sessionService.csrfCookieName(scope)
    ] as string | undefined;
    if (
      !session ||
      session.sessionScope !== scope ||
      cookieToken !== headerToken ||
      !this.sessionService.csrfMatches(session, headerToken)
    ) {
      throw new ForbiddenException('csrf_invalid');
    }
    return true;
  }

  private assertAllowedOrigin(origin: string | undefined): void {
    const allowedOrigins = (
      this.configService.get<string>('ALLOWED_ORIGINS') ?? ''
    )
      .split(',')
      .map((allowed) => allowed.trim())
      .filter(Boolean);
    if (!origin || !allowedOrigins.includes(origin)) {
      throw new ForbiddenException('origin_invalid');
    }
  }
}
