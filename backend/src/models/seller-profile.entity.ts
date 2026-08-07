import { SellerType } from '@makaan/shared/constants/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from './user.entity';

export enum ParticipationClassificationSource {
  SELF_DECLARED = 'self_declared',
  MODERATOR_OVERRIDE = 'moderator_override',
  RISK_SIGNAL = 'risk_signal',
}

export enum ParticipationReviewState {
  CLEAR = 'clear',
  UNDER_REVIEW = 'under_review',
  SUSPENDED = 'suspended',
}

export enum SellerVerificationState {
  NOT_VERIFIED = 'not_verified',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Entity('seller_profiles')
export class SellerProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId!: string;

  @Column({
    name: 'declared_participation',
    type: 'enum',
    enum: SellerType,
  })
  declaredParticipation!: SellerType;

  /** Transitional source compatibility; not a second persisted column. */
  get sellerType(): SellerType {
    return this.declaredParticipation;
  }

  set sellerType(value: SellerType) {
    this.declaredParticipation = value;
  }

  @Column({ name: 'listing_count', type: 'int', default: 0 })
  listingCount!: number;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null;

  @Column({
    name: 'participation_declaration_version',
    type: 'int',
    default: 1,
  })
  participationDeclarationVersion!: number;

  @Column({
    name: 'agent_declaration_confirmed_version',
    type: 'int',
    nullable: true,
  })
  agentDeclarationConfirmedVersion!: number | null;

  @Column({
    name: 'agent_declaration_confirmed_at',
    type: 'timestamptz',
    nullable: true,
  })
  agentDeclarationConfirmedAt!: Date | null;

  @Column({
    name: 'agent_declaration_confirmed_by',
    type: 'uuid',
    nullable: true,
  })
  agentDeclarationConfirmedBy!: string | null;

  @Column({
    name: 'classification_source',
    type: 'enum',
    enum: ParticipationClassificationSource,
    default: ParticipationClassificationSource.SELF_DECLARED,
  })
  classificationSource!: ParticipationClassificationSource;

  @Column({
    name: 'moderator_participation_override',
    type: 'enum',
    enum: SellerType,
    nullable: true,
  })
  moderatorParticipationOverride!: SellerType | null;

  @Column({
    name: 'review_state',
    type: 'enum',
    enum: ParticipationReviewState,
    default: ParticipationReviewState.CLEAR,
  })
  reviewState!: ParticipationReviewState;

  @Column({
    name: 'verification_state',
    type: 'enum',
    enum: SellerVerificationState,
    default: SellerVerificationState.NOT_VERIFIED,
  })
  verificationState!: SellerVerificationState;

  @Column({
    name: 'verification_decided_at',
    type: 'timestamptz',
    nullable: true,
  })
  verificationDecidedAt!: Date | null;

  @Column({
    name: 'verification_decided_by',
    type: 'uuid',
    nullable: true,
  })
  verificationDecidedBy!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToOne(() => User, (user) => user.sellerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'agent_declaration_confirmed_by' })
  agentDeclarationConfirmedByUser!: User | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'verification_decided_by' })
  verificationDecidedByUser!: User | null;
}
