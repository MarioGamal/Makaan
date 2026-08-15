import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { AuthSession, AuthSessionScope } from '../models/auth-session.entity';
import { SessionService } from '../services/session.service';

export const SESSION_SCOPE_METADATA = 'makaan:session-scope';

export const RequireSessionScope = (scope: AuthSessionScope) =>
  SetMetadata(SESSION_SCOPE_METADATA, scope);

export interface SessionRequest extends Request {
  makaanSession?: AuthSession;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessionService: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredScope = this.reflector.getAllAndOverride<AuthSessionScope>(
      SESSION_SCOPE_METADATA,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredScope) {
      throw new UnauthorizedException('session_scope_not_declared');
    }

    const request = context.switchToHttp().getRequest<SessionRequest>();
    const requiredCookie = this.sessionService.cookieName(requiredScope);
    const token = request.cookies?.[requiredCookie] as string | undefined;

    if (!token) {
      const otherScope =
        requiredScope === AuthSessionScope.ADMIN
          ? AuthSessionScope.SELLER
          : AuthSessionScope.ADMIN;
      const otherToken = request.cookies?.[
        this.sessionService.cookieName(otherScope)
      ] as string | undefined;
      if (otherToken) {
        try {
          await this.sessionService.authenticate(otherToken, otherScope);
          throw new ForbiddenException('session_scope_forbidden');
        } catch (error) {
          if (error instanceof ForbiddenException) {
            throw error;
          }
        }
      }
      throw new UnauthorizedException('authentication_required');
    }

    request.makaanSession = await this.sessionService.authenticate(
      token,
      requiredScope,
    );
    return true;
  }
}
