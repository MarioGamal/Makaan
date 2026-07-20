import { createHash, randomUUID } from 'crypto';

import { UserType } from '@makaan/shared/constants/enums';
import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import { Repository } from 'typeorm';

import { RedisService } from '../config/redis.module';
import { AuthSession } from '../models/auth-session.entity';
import { User, UserStatus } from '../models/user.entity';

type LoginResult = {
  success: true;
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: {
    id: string;
    username: string;
    role: 'admin';
    lastLogin: string | null;
  };
};

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AuthSession)
    private readonly authSessionRepository: Repository<AuthSession>,
  ) {}

  async login(username: string, password: string, twoFactorCode: string, ipAddress: string): Promise<LoginResult> {
    const rateLimitKey = `admin_login_attempts:${ipAddress}`;
    const attempts = await this.redisService.incr(rateLimitKey);
    if (attempts === 1) {
      await this.redisService.setex(rateLimitKey, 15 * 60, attempts);
    }

    if (attempts > 5) {
      throw new HttpException(
        'Too many login attempts. Please try again in 15 minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const adminUser = await this.resolveAdminUser(username);

    const passwordHash = adminUser.passwordHash;
    const secret = adminUser.twoFactorSecret;

    if (
      !passwordHash ||
      !secret ||
      !(await bcrypt.compare(password, passwordHash)) ||
      !speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: twoFactorCode,
        window: 1,
      })
    ) {
      throw new UnauthorizedException('Invalid username, password, or 2FA code');
    }

    await this.redisService.del(rateLimitKey);

    const previousLastLogin = adminUser.lastLoginAt;
    adminUser.lastLoginAt = new Date();
    adminUser.userType = UserType.ADMIN;
    adminUser.status = UserStatus.ACTIVE;
    adminUser.isTwoFactorEnabled = true;
    const savedUser = await this.userRepository.save(adminUser);

    const sessionId = randomUUID();
    const accessToken = await this.jwtService.signAsync(
      {
        sub: savedUser.id,
        sessionId,
        userType: UserType.ADMIN,
        username: savedUser.username,
      },
      {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: '8h',
      },
    );

    await this.authSessionRepository.save(
      this.authSessionRepository.create({
        id: sessionId,
        userId: savedUser.id,
        tokenHash: createHash('sha256').update(accessToken).digest('hex'),
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
        revokedAt: null,
      }),
    );

    return {
      success: true,
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 8 * 60 * 60,
      user: {
        id: savedUser.id,
        username: savedUser.username ?? username,
        role: 'admin',
        lastLogin: previousLastLogin?.toISOString() ?? null,
      },
    };
  }

  private async resolveAdminUser(username: string): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: {
        username,
        userType: UserType.ADMIN,
      },
    });

    if (existingUser && existingUser.status !== UserStatus.BLOCKED) {
      return existingUser;
    }

    const configuredUsername = this.configService.get<string>('ADMIN_USERNAME');
    const configuredPasswordHash = this.configService.get<string>('ADMIN_PASSWORD_HASH');
    const configuredTwoFactorSecret = this.configService.get<string>('ADMIN_2FA_SECRET');

    if (
      !configuredUsername ||
      configuredUsername !== username ||
      !configuredPasswordHash ||
      !configuredTwoFactorSecret
    ) {
      throw new UnauthorizedException('Invalid username, password, or 2FA code');
    }

    const adminRecord =
      existingUser ??
      this.userRepository.create({
        phoneNumber: `admin:${configuredUsername}`,
        username: configuredUsername,
        userType: UserType.ADMIN,
        status: UserStatus.ACTIVE,
        isPhoneVerified: true,
        passwordHash: configuredPasswordHash,
        twoFactorSecret: configuredTwoFactorSecret,
        isTwoFactorEnabled: true,
      });

    adminRecord.passwordHash = configuredPasswordHash;
    adminRecord.twoFactorSecret = configuredTwoFactorSecret;
    adminRecord.username = configuredUsername;
    adminRecord.userType = UserType.ADMIN;
    adminRecord.status = UserStatus.ACTIVE;
    adminRecord.isTwoFactorEnabled = true;

    return this.userRepository.save(adminRecord);
  }
}
