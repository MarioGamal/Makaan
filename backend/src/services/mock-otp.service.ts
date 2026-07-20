import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';

import { RedisService } from '../config/redis.module';

import { OtpService } from './otp.service';

@Injectable()
export class MockOtpService extends OtpService {
  private readonly mockLogger = new Logger(MockOtpService.name);

  constructor(
    redisService: RedisService,
    configService: ConfigService,
  ) {
    super(redisService, configService);
  }

  protected override async sendOtp(phone: string, _code: string): Promise<void> {
    this.mockLogger.log(`[MOCK OTP] Phone: ${this.maskPhone(phone)}, Code: 123456`);
  }

  override async requestOtp(phone: string) {
    const rateLimitKey = `otp:requests:${phone}`;
    const requestCount = await this.redisService.incr(rateLimitKey);
    if (requestCount === 1) {
      await this.redisService.setex(rateLimitKey, 600, requestCount);
    }

    const hashedCode = await bcrypt.hash('123456', 10);
    await this.redisService.setex(`otp:${phone}`, 300, hashedCode);
    await this.sendOtp(phone, '123456');

    return {
      success: true,
      message: `OTP code sent to ${this.maskPhone(phone)}`,
      expiresIn: 300,
    };
  }
}
