import {
  createCipheriv,
  createHash,
  createHmac,
  randomBytes,
} from 'node:crypto';

import { SellerType, UserType } from '@makaan/shared/constants/enums';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import {
  ParticipationClassificationSource,
  ParticipationReviewState,
  SellerProfile,
  SellerVerificationState,
} from '../models/seller-profile.entity';
import { User, UserStatus } from '../models/user.entity';

import {
  derivePublicParticipationLabel,
  PublicParticipationLabel,
} from './participation.service';
import { OTP_PROVIDER } from './providers';
import { OtpProvider } from './providers/otp.provider';

export interface AuthenticatedSeller {
  id: string;
  role: 'seller';
  participation: PublicParticipationLabel;
  createdAt: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(OTP_PROVIDER) private readonly otpProvider: OtpProvider,
  ) {}

  async requestOtp(phone: string): Promise<{ accepted: true }> {
    await this.otpProvider.request({ phone, purpose: 'seller_sign_in' });
    return { accepted: true };
  }

  async verifyOtp(
    phone: string,
    code: string,
  ): Promise<{ user: User; seller: AuthenticatedSeller }> {
    const verification = await this.otpProvider.verify({
      phone,
      code,
      purpose: 'seller_sign_in',
    });
    if (verification.status !== 'verified') {
      throw new BadRequestException('otp_invalid_or_expired');
    }

    return this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const profiles = manager.getRepository(SellerProfile);
      const lookupHash = this.phoneLookupHash(phone);
      let user = await users
        .createQueryBuilder('user')
        .addSelect(['user.phoneLookupHash', 'user.phoneNumber'])
        .leftJoinAndSelect('user.sellerProfile', 'sellerProfile')
        .where('user.phone_lookup_hash = :lookupHash', { lookupHash })
        .orWhere('user.legacy_phone_number = :phone', { phone })
        .getOne();

      if (!user) {
        user = users.create({
          phoneNumber: null,
          phoneCiphertext: this.encryptProtectedValue(phone),
          phoneLookupHash: lookupHash,
          userType: UserType.SELLER,
          status: UserStatus.ACTIVE,
          isPhoneVerified: true,
          lastLoginAt: new Date(),
        });
      } else {
        user.phoneCiphertext = this.encryptProtectedValue(phone);
        user.phoneLookupHash = lookupHash;
        user.phoneNumber = null;
        user.userType = UserType.SELLER;
        user.isPhoneVerified = true;
        user.lastLoginAt = new Date();
      }
      user = await users.save(user);

      let profile = user.sellerProfile;
      if (!profile) {
        profile = profiles.create({
          userId: user.id,
          declaredParticipation: SellerType.OWNER,
          listingCount: 0,
          isVerified: false,
          verifiedAt: null,
          participationDeclarationVersion: 1,
          agentDeclarationConfirmedVersion: null,
          agentDeclarationConfirmedAt: null,
          agentDeclarationConfirmedBy: null,
          classificationSource: ParticipationClassificationSource.SELF_DECLARED,
          moderatorParticipationOverride: null,
          reviewState: ParticipationReviewState.CLEAR,
          verificationState: SellerVerificationState.NOT_VERIFIED,
          verificationDecidedAt: null,
          verificationDecidedBy: null,
        });
        profile = await profiles.save(profile);
      }

      return {
        user,
        seller: {
          id: user.id,
          role: 'seller',
          participation: derivePublicParticipationLabel(profile),
          createdAt: user.createdAt.toISOString(),
        },
      };
    });
  }

  async getAuthenticatedSeller(userId: string): Promise<AuthenticatedSeller> {
    const row = await this.dataSource.getRepository(User).findOne({
      where: { id: userId },
      relations: { sellerProfile: true },
    });
    if (!row?.sellerProfile) {
      throw new BadRequestException('seller_profile_required');
    }
    return {
      id: row.id,
      role: 'seller',
      participation: derivePublicParticipationLabel(row.sellerProfile),
      createdAt: row.createdAt.toISOString(),
    };
  }

  async declareParticipation(userId: string, participation: SellerType) {
    return this.dataSource.transaction(async (manager) => {
      const profiles = manager.getRepository(SellerProfile);
      const profile = await profiles.findOne({ where: { userId } });
      if (!profile) {
        throw new BadRequestException('seller_profile_required');
      }
      if (profile.declaredParticipation !== participation) {
        profile.declaredParticipation = participation;
        profile.participationDeclarationVersion += 1;
        profile.classificationSource =
          ParticipationClassificationSource.SELF_DECLARED;
        if (participation === SellerType.AGENT) {
          profile.agentDeclarationConfirmedVersion =
            profile.participationDeclarationVersion;
          profile.agentDeclarationConfirmedAt = new Date();
          profile.agentDeclarationConfirmedBy = userId;
        } else {
          profile.agentDeclarationConfirmedVersion = null;
          profile.agentDeclarationConfirmedAt = null;
          profile.agentDeclarationConfirmedBy = null;
        }
        await profiles.save(profile);
        await manager.query(
          `UPDATE listings
           SET status = 'inactive', lock_version = lock_version + 1, updated_at = now()
           WHERE seller_id = $1 AND status IN ('pending_review', 'active')`,
          [userId],
        );
      }
      const user = await manager.getRepository(User).findOneByOrFail({
        id: userId,
      });
      return {
        id: user.id,
        role: 'seller' as const,
        participation: derivePublicParticipationLabel(profile),
        createdAt: user.createdAt.toISOString(),
      };
    });
  }

  private phoneLookupHash(phone: string): string {
    return createHmac(
      'sha256',
      this.configService.getOrThrow<string>('PHONE_LOOKUP_PEPPER'),
    )
      .update(phone)
      .digest('hex');
  }

  private encryptProtectedValue(value: string): string {
    const key = createHash('sha256')
      .update(this.configService.getOrThrow<string>('FIELD_ENCRYPTION_KEY'))
      .digest();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `v1:${iv.toString('base64url')}:${tag.toString('base64url')}:${ciphertext.toString('base64url')}`;
  }
}
