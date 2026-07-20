import { UserType } from '@makaan/shared/constants/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { AdminAction } from './admin-action.entity';
import { AuthSession } from './auth-session.entity';
import { Listing } from './listing.entity';
import { SellerNotification } from './seller-notification.entity';
import { SellerProfile } from './seller-profile.entity';

export enum UserStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  DEACTIVATED = 'deactivated',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 255, unique: true })
  phoneNumber!: string;

  @Column({ type: 'varchar', length: 120, unique: true, nullable: true })
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

  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash!: string | null;

  @Column({ name: 'two_factor_secret', type: 'varchar', length: 255, nullable: true })
  twoFactorSecret!: string | null;

  @Column({ name: 'is_2fa_enabled', type: 'boolean', default: false })
  isTwoFactorEnabled!: boolean;

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
}
