import {
  Body,
  Controller,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { AuthService } from '../../services/auth.service';
import { MockOtpService } from '../../services/mock-otp.service';
import { OtpService } from '../../services/otp.service';

import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
    private readonly mockOtpService: MockOtpService,
  ) {}

  @Post('otp/request')
  async requestOtp(@Body() dto: RequestOtpDto) {
    const service = process.env.NODE_ENV === 'development' ? this.mockOtpService : this.otpService;
    return service.requestOtp(dto.phone);
  }

  @Post('otp/verify')
  async verifyOtp(@Body() dto: VerifyOtpDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.verifyOtp(dto.phone, dto.code);
    response.cookie('makaan_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: result.expiresIn * 1000,
    });

    return result;
  }

  @Post('logout')
  async logout(
    @Req() request: Request & { cookies?: { makaan_token?: string } },
    @Res({ passthrough: true }) response: Response,
  ) {
    const token =
      request.cookies?.makaan_token ??
      request.headers.authorization?.replace(/^Bearer\s+/i, '');

    const result = token ? await this.authService.revokeSession(token) : { success: true };
    response.clearCookie('makaan_token');
    return result;
  }
}

