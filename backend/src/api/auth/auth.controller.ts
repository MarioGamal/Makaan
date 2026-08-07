import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { RequireCsrfScope, CsrfGuard } from '../../middleware/csrf.guard';
import {
  RequireSessionScope,
  SessionGuard,
  SessionRequest,
} from '../../middleware/session.guard';
import { AuthSessionScope } from '../../models/auth-session.entity';
import { AbuseControlService } from '../../services/abuse-control.service';
import { AuthService } from '../../services/auth.service';
import { SessionService } from '../../services/session.service';

import { DeclareParticipationDto } from './dto/declare-participation.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
    private readonly abuseControlService: AbuseControlService,
  ) {}

  @Post('otp/requests')
  async requestOtp(@Body() dto: RequestOtpDto, @Req() request: Request) {
    const client = this.abuseControlService.clientAddress(request);
    await this.abuseControlService.consume('otpRequest', ['client', client]);
    await this.abuseControlService.consume('otpRequest', ['phone', dto.phone]);
    await this.authService.requestOtp(dto.phone);
    return { accepted: true };
  }

  @Post('otp/verifications')
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const client = this.abuseControlService.clientAddress(request);
    await this.abuseControlService.consume('otpVerification', [
      'client',
      client,
    ]);
    await this.abuseControlService.consume('otpVerification', [
      'phone',
      dto.phone,
    ]);
    const result = await this.authService.verifyOtp(dto.phone, dto.code);
    const issued = await this.sessionService.issue(
      result.user,
      AuthSessionScope.SELLER,
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
      this.sessionService.cookieName(AuthSessionScope.SELLER),
      issued.sessionToken,
      this.sessionService.sessionCookieSettings(AuthSessionScope.SELLER),
    );
    response.cookie(
      this.sessionService.csrfCookieName(AuthSessionScope.SELLER),
      issued.csrfToken,
      this.sessionService.csrfCookieSettings(AuthSessionScope.SELLER),
    );
    return { seller: result.seller };
  }

  @Get('session')
  @UseGuards(SessionGuard)
  @RequireSessionScope(AuthSessionScope.SELLER)
  async getSession(@Req() request: SessionRequest) {
    const session = request.makaanSession!;
    return {
      seller: await this.authService.getAuthenticatedSeller(session.userId),
      expiresAt: session.absoluteExpiresAt.toISOString(),
    };
  }

  @Put('participation')
  @UseGuards(SessionGuard, CsrfGuard)
  @RequireSessionScope(AuthSessionScope.SELLER)
  @RequireCsrfScope(AuthSessionScope.SELLER)
  async declareParticipation(
    @Body() dto: DeclareParticipationDto,
    @Req() request: SessionRequest,
  ) {
    return {
      seller: await this.authService.declareParticipation(
        request.makaanSession!.userId,
        dto.participation,
      ),
    };
  }

  @Get('csrf')
  @UseGuards(SessionGuard)
  @RequireSessionScope(AuthSessionScope.SELLER)
  async csrf(
    @Req() request: SessionRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const csrfToken = await this.sessionService.rotateCsrf(
      request.makaanSession!.id,
    );
    response.cookie(
      this.sessionService.csrfCookieName(AuthSessionScope.SELLER),
      csrfToken,
      this.sessionService.csrfCookieSettings(AuthSessionScope.SELLER),
    );
    return { csrfToken };
  }

  @Delete('session')
  @UseGuards(SessionGuard, CsrfGuard)
  @RequireSessionScope(AuthSessionScope.SELLER)
  @RequireCsrfScope(AuthSessionScope.SELLER)
  async logout(
    @Req() request: SessionRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const cookieName = this.sessionService.cookieName(AuthSessionScope.SELLER);
    await this.sessionService.revokeByToken(
      request.cookies?.[cookieName] as string | undefined,
      AuthSessionScope.SELLER,
    );
    response.clearCookie(
      cookieName,
      this.sessionService.sessionCookieSettings(AuthSessionScope.SELLER),
    );
    response.clearCookie(
      this.sessionService.csrfCookieName(AuthSessionScope.SELLER),
      this.sessionService.csrfCookieSettings(AuthSessionScope.SELLER),
    );
    return { success: true };
  }
}
