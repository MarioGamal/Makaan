import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { CsrfGuard, RequireCsrfScope } from '../../middleware/csrf.guard';
import {
  RequireSessionScope,
  SessionGuard,
  SessionRequest,
} from '../../middleware/session.guard';
import { AuthSessionScope } from '../../models/auth-session.entity';
import { AbuseControlService } from '../../services/abuse-control.service';
import { AdminAuthService } from '../../services/admin-auth.service';
import { SessionService } from '../../services/session.service';

import { AdminLoginDto } from './dto/admin-login.dto';

@Controller('admin')
export class AdminAuthController {
  constructor(
    private readonly adminAuthService: AdminAuthService,
    private readonly sessionService: SessionService,
    private readonly abuseControlService: AbuseControlService,
  ) {}

  @Post('sessions')
  async login(
    @Body() dto: AdminLoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const client = this.abuseControlService.clientAddress(request);
    await this.abuseControlService.consume('adminLogin', ['client', client]);
    await this.abuseControlService.consume('adminLogin', [
      'account',
      dto.email.trim().toLowerCase(),
    ]);
    const result = await this.adminAuthService.login(
      dto.email,
      dto.password,
      dto.secondFactorCode,
    );
    const issued = await this.sessionService.issue(
      result.user,
      AuthSessionScope.ADMIN,
      {
        ipPrefixHash: this.abuseControlService.protectedClientPrefix(client),
        userAgentHash: request.headers['user-agent']
          ? this.abuseControlService.protectedIdentity(
              request.headers['user-agent'],
            )
          : undefined,
      },
    );
    response.cookie(
      this.sessionService.cookieName(AuthSessionScope.ADMIN),
      issued.sessionToken,
      this.sessionService.sessionCookieSettings(AuthSessionScope.ADMIN),
    );
    response.cookie(
      this.sessionService.csrfCookieName(AuthSessionScope.ADMIN),
      issued.csrfToken,
      this.sessionService.csrfCookieSettings(AuthSessionScope.ADMIN),
    );
    return { administrator: result.administrator };
  }

  @Get('session')
  @UseGuards(SessionGuard)
  @RequireSessionScope(AuthSessionScope.ADMIN)
  getSession(@Req() request: SessionRequest) {
    const session = request.makaanSession!;
    return {
      administrator: { id: session.userId, role: 'admin' },
      expiresAt: session.absoluteExpiresAt.toISOString(),
    };
  }

  @Get('csrf')
  @UseGuards(SessionGuard)
  @RequireSessionScope(AuthSessionScope.ADMIN)
  async csrf(
    @Req() request: SessionRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const csrfToken = await this.sessionService.rotateCsrf(
      request.makaanSession!.id,
    );
    response.cookie(
      this.sessionService.csrfCookieName(AuthSessionScope.ADMIN),
      csrfToken,
      this.sessionService.csrfCookieSettings(AuthSessionScope.ADMIN),
    );
    return { csrfToken };
  }

  @Delete('session')
  @UseGuards(SessionGuard, CsrfGuard)
  @RequireSessionScope(AuthSessionScope.ADMIN)
  @RequireCsrfScope(AuthSessionScope.ADMIN)
  async logout(
    @Req() request: SessionRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cookieName = this.sessionService.cookieName(AuthSessionScope.ADMIN);
    await this.sessionService.revokeByToken(
      request.cookies?.[cookieName] as string | undefined,
      AuthSessionScope.ADMIN,
    );
    response.clearCookie(
      cookieName,
      this.sessionService.sessionCookieSettings(AuthSessionScope.ADMIN),
    );
    response.clearCookie(
      this.sessionService.csrfCookieName(AuthSessionScope.ADMIN),
      this.sessionService.csrfCookieSettings(AuthSessionScope.ADMIN),
    );
    return { success: true };
  }
}
