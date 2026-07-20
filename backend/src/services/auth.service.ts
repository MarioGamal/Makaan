import { randomUUID, createHash } from 'crypto';

import { SellerType, UserType } from '@makaan/shared/constants/enums';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';


import { RedisService } from '../config/redis.module';
import { AuthSession } from '../models/auth-session.entity';
import { SellerProfile } from '../models/seller-profile.entity';
import { User, UserStatus } from '../models/user.entity';

import { SellerTypeInferenceService } from './seller-type.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sellerTypeInferenceService: SellerTypeInferenceService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AuthSession)
    private readonly authSessionRepository: Repository<AuthSession>,
    @InjectRepository(SellerProfile)
    private readonly sellerProfileRepository: Repository<SellerProfile>,
  ) {}

  async verifyOtp(phone: string, code: string) {
    const attemptKey = `otp:attempts:${phone}`;
    const attemptCount = await this.redisService.incr(attemptKey);
    if (attemptCount === 1) {
      await this.redisService.setex(attemptKey, 300, attemptCount);
    }

    if (attemptCount > 5) {
      throw new UnauthorizedException(
        'Too many failed attempts. Please request a new OTP code.',
      );
    }

    const storedHash = await this.redisService.get(`otp:${phone}`);
    if (!storedHash || !(await bcrypt.compare(code, storedHash))) {
      throw new BadRequestException('Invalid or expired OTP code');
    }

    await this.redisService.del(`otp:${phone}`);
    await this.redisService.del(attemptKey);

    let user = await this.userRepository.findOne({
      where: { phoneNumber: phone },
      relations: { sellerProfile: true },
    });

    if (!user) {
      user = this.userRepository.create({
        phoneNumber: phone,
        userType: UserType.SELLER,
        status: UserStatus.ACTIVE,
        isPhoneVerified: true,
        lastLoginAt: new Date(),
      });
      user = await this.userRepository.save(user);
    } else {
      user.isPhoneVerified = true;
      user.userType = UserType.SELLER;
      user.lastLoginAt = new Date();
      user = await this.userRepository.save(user);
    }

    const inferredSellerType = await this.sellerTypeInferenceService.inferSellerType(user.id);
    const accessToken = await this.issueToken(user.id, inferredSellerType);

    return {
      success: true,
      accessToken: accessToken.token,
      tokenType: 'Bearer',
      expiresIn: 60 * 60 * 24 * 30,
      user: {
        id: user.id,
        phone: this.maskPhone(phone),
        role: 'seller',
        sellerType: inferredSellerType,
        createdAt: user.createdAt.toISOString(),
      },
      sessionId: accessToken.sessionId,
    };
  }

  async revokeSession(token: string) {
    const decoded = this.jwtService.decode(token) as { sessionId?: string } | null;
    if (!decoded?.sessionId) {
      return { success: true };
    }

    await this.authSessionRepository.update(
      { id: decoded.sessionId },
      { revokedAt: new Date() },
    );

    return { success: true, message: 'Logged out successfully' };
  }

  private async issueToken(userId: string, sellerType: SellerType) {
    const sessionId = randomUUID();
    const token = await this.jwtService.signAsync(
      {
        sub: userId,
        sessionId,
        userType: UserType.SELLER,
        sellerType,
      },
      {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: '30d',
      },
    );

    await this.authSessionRepository.save(
      this.authSessionRepository.create({
        id: sessionId,
        userId,
        tokenHash: createHash('sha256').update(token).digest('hex'),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        revokedAt: null,
      }),
    );

    return {
      token,
      sessionId,
    };
  }

  private maskPhone(phone: string): string {
    return phone.replace(/^(\+201\d)(\d{4})(\d{4})$/, '$1****$3');
  }
}
