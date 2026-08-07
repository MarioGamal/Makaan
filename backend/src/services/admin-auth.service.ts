import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

import { UserType } from '@makaan/shared/constants/enums';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import { Repository } from 'typeorm';

import { User, UserStatus } from '../models/user.entity';

export interface AuthenticatedAdministrator {
  id: string;
  role: 'admin';
  email: string;
  lastLogin: string | null;
}

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async login(
    email: string,
    password: string,
    secondFactorCode: string,
  ): Promise<{ user: User; administrator: AuthenticatedAdministrator }> {
    const normalizedEmail = email.trim().toLowerCase();
    let administrator = await this.userRepository
      .createQueryBuilder('user')
      .addSelect([
        'user.passwordHash',
        'user.secondFactorSecretCiphertext',
        'user.twoFactorSecret',
      ])
      .where('LOWER(user.username) = :email', { email: normalizedEmail })
      .andWhere('user.user_type = :role', { role: UserType.ADMIN })
      .getOne();

    if (!administrator) {
      administrator = await this.createLocalAdministrator(normalizedEmail);
    }
    if (!administrator || administrator.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('admin_credentials_invalid');
    }

    const secret = administrator.secondFactorSecretCiphertext
      ? this.decryptProtectedValue(administrator.secondFactorSecretCiphertext)
      : administrator.twoFactorSecret;
    if (
      !administrator.passwordHash ||
      !secret ||
      !(await bcrypt.compare(password, administrator.passwordHash)) ||
      !speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token: secondFactorCode,
        window: 1,
      })
    ) {
      throw new UnauthorizedException('admin_credentials_invalid');
    }

    const priorLastLogin = administrator.lastLoginAt;
    administrator.lastLoginAt = new Date();
    administrator.isTwoFactorEnabled = true;
    const saved = await this.userRepository.save(administrator);
    return {
      user: saved,
      administrator: {
        id: saved.id,
        role: 'admin',
        email: saved.username ?? normalizedEmail,
        lastLogin: priorLastLogin?.toISOString() ?? null,
      },
    };
  }

  private async createLocalAdministrator(email: string): Promise<User | null> {
    const mode = this.configService.getOrThrow<string>('APP_MODE');
    const configuredEmail = this.configService
      .get<string>('LOCAL_ADMIN_EMAIL')
      ?.trim()
      .toLowerCase();
    const configuredPassword = this.configService.get<string>(
      'LOCAL_ADMIN_PASSWORD',
    );
    const configuredSecret = this.configService.get<string>(
      'LOCAL_ADMIN_TOTP_SECRET',
    );
    if (
      (mode !== 'local' && mode !== 'test') ||
      !configuredEmail ||
      email !== configuredEmail ||
      !configuredPassword ||
      !configuredSecret
    ) {
      return null;
    }

    return this.userRepository.save(
      this.userRepository.create({
        phoneNumber: null,
        phoneCiphertext: null,
        phoneLookupHash: null,
        username: configuredEmail,
        userType: UserType.ADMIN,
        status: UserStatus.ACTIVE,
        isPhoneVerified: false,
        passwordHash: await bcrypt.hash(configuredPassword, 12),
        twoFactorSecret: null,
        secondFactorSecretCiphertext:
          this.encryptProtectedValue(configuredSecret),
        isTwoFactorEnabled: true,
        lastLoginAt: null,
      }),
    );
  }

  private encryptionKey(): Buffer {
    return createHash('sha256')
      .update(this.configService.getOrThrow<string>('FIELD_ENCRYPTION_KEY'))
      .digest();
  }

  private encryptProtectedValue(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.encryptionKey(), iv);
    const ciphertext = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);
    return `v1:${iv.toString('base64url')}:${cipher.getAuthTag().toString('base64url')}:${ciphertext.toString('base64url')}`;
  }

  private decryptProtectedValue(value: string): string {
    const [version, ivValue, tagValue, ciphertextValue] = value.split(':');
    if (version !== 'v1' || !ivValue || !tagValue || !ciphertextValue) {
      throw new UnauthorizedException('admin_credentials_invalid');
    }
    try {
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.encryptionKey(),
        Buffer.from(ivValue, 'base64url'),
      );
      decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
      return Buffer.concat([
        decipher.update(Buffer.from(ciphertextValue, 'base64url')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      throw new UnauthorizedException('admin_credentials_invalid');
    }
  }
}
