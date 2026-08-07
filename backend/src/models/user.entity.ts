import { UserType } from '@makaan/shared/constants/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { AdminAction } from './admin-action.entity';
import { AuthSession } from './auth-session.entity';
import { EvidenceAccess } from './evidence-access.entity';
import { Listing } from './listing.entity';
import { SellerNotification } from './seller-notification.entity';
import { SellerProfile } from './seller-profile.entity';
import { VerificationCase } from './verification-case.entity';
import { VerificationEvidence } from './verification-evidence.entity';

export enum UserStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  DEACTIVATED = 'deactivated',
}

@Entity('users')
@Index('IDX_USERS_USERNAME_UNIQUE', ['username'], {
  unique: true,
  where: '"username" IS NOT NULL',
})
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'legacy_phone_number',
    type: 'varchar',
    length: 255,
    unique: true,
    nullable: true,
    select: false,
  })
  phoneNumber!: string | null;

  @Column({
    name: 'phone_ciphertext',
    type: 'text',
    nullable: true,
    select: false,
  })
  phoneCiphertext!: string | null;

  @Column({
    name: 'phone_lookup_hash',
    type: 'varchar',
    length: 128,
    nullable: true,
    select: false,
  })
  @Index('IDX_USERS_PHONE_LOOKUP_HASH', {
    unique: true,
    where: '"phone_lookup_hash" IS NOT NULL',
  })
  phoneLookupHash!: string | null;

  @Column({
    name: 'display_name',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  displayName!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  username!: string | null;

  @Column({
    name: 'user_type',
    type: 'enum',
    enum: UserType,
    default: UserType.BUYER,
  })
  userType!: UserType;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({ name: 'is_phone_verified', type: 'boolean', default: false })
  isPhoneVerified!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  passwordHash!: string | null;

  @Column({
    name: 'legacy_two_factor_secret',
    type: 'varchar',
    length: 255,
    nullable: true,
    select: false,
  })
  twoFactorSecret!: string | null;

  @Column({ name: 'is_2fa_enabled', type: 'boolean', default: false })
  isTwoFactorEnabled!: boolean;

  @Column({ name: 'password_version', type: 'int', default: 1 })
  passwordVersion!: number;

  @Column({ name: 'recovery_version', type: 'int', default: 1 })
  recoveryVersion!: number;

  @Column({
    name: 'second_factor_secret_ciphertext',
    type: 'text',
    nullable: true,
    select: false,
  })
  secondFactorSecretCiphertext!: string | null;

  @OneToMany(() => Listing, (listing) => listing.seller)
  listings!: Listing[];

  @OneToMany(() => AuthSession, (session) => session.user)
  sessions!: AuthSession[];

  @OneToMany(() => AdminAction, (adminAction) => adminAction.admin)
  adminActions!: AdminAction[];

  @OneToMany(() => AdminAction, (adminAction) => adminAction.targetUser)
  targetedAdminActions!: AdminAction[];

  @OneToMany(() => SellerNotification, (notification) => notification.seller)
  notifications!: SellerNotification[];

  @OneToOne(() => SellerProfile, (sellerProfile) => sellerProfile.user)
  sellerProfile!: SellerProfile;

  @OneToMany(
    () => VerificationCase,
    (verificationCase) => verificationCase.seller,
  )
  verificationCases!: VerificationCase[];

  @OneToMany(
    () => VerificationCase,
    (verificationCase) => verificationCase.decidedBy,
  )
  verificationDecisions!: VerificationCase[];

  @OneToMany(() => VerificationEvidence, (evidence) => evidence.uploadedBy)
  uploadedVerificationEvidence!: VerificationEvidence[];

  @OneToMany(() => EvidenceAccess, (access) => access.actor)
  evidenceAccesses!: EvidenceAccess[];
}
