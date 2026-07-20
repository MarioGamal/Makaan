import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';

import { AdminAuthService } from '../../services/admin-auth.service';

import { AdminLoginDto } from './dto/admin-login.dto';

@Controller('admin')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  async login(@Body() dto: AdminLoginDto, @Req() request: Request) {
    return this.adminAuthService.login(
      dto.username,
      dto.password,
      dto.twoFactorCode,
      this.getIpAddress(request),
    );
  }

  private getIpAddress(request: Request): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
      return forwardedFor.split(',')[0]?.trim() ?? request.ip ?? 'unknown';
    }

    return request.ip ?? 'unknown';
  }
}
