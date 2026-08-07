import { randomInt } from 'crypto';

import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import twilio from 'twilio';

import { RedisService } from '../config/redis.module';

@Injectable()
export class OtpService {
  protected readonly logger = new Logger(OtpService.name);

  constructor(
    protected readonly redisService: RedisService,
    protected readonly configService: ConfigService,
  ) {}

  async requestOtp(phone: string) {
    const rateLimitKey = `otp:requests:${phone}`;
    const requestCount = await this.redisService.incr(rateLimitKey);
    if (requestCount === 1) {
      await this.redisService.setex(rateLimitKey, 600, requestCount);
    }

    if (requestCount > 3) {
      throw new HttpException(
        'Too many OTP requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = String(randomInt(100000, 999999));
    const hashedCode = await bcrypt.hash(code, 10);
    await this.redisService.setex(`otp:${phone}`, 300, hashedCode);

    await this.sendOtp(phone, code);

    return {
      success: true,
      message: `OTP code sent to ${this.maskPhone(phone)}`,
      expiresIn: 300,
    };
  }

  protected async sendOtp(phone: string, code: string): Promise<void> {
    const client = twilio(
      this.configService.getOrThrow<string>('TWILIO_ACCOUNT_SID'),
      this.configService.getOrThrow<string>('TWILIO_AUTH_TOKEN'),
    );

    await client.messages.create({
      body: `Your Makaan OTP code is ${code}`,
      from: this.configService.getOrThrow<string>('TWILIO_PHONE_NUMBER'),
      to: phone,
    });

    this.logger.log(`OTP requested for ${this.maskPhone(phone)}`);
  }

  protected maskPhone(phone: string): string {
    return phone.replace(/^(\+201\d)(\d{4})(\d{4})$/, '$1****$3');
  }
}
