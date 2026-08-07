import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { EvidenceAccess } from './evidence-access.entity';
import { User } from './user.entity';
import { VerificationEvidence } from './verification-evidence.entity';

export enum VerificationCaseStatus {
  OPEN = 'open',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

@Entity('verification_cases')
@Index('IDX_VERIFICATION_CASES_SELLER_STATUS', ['sellerId', 'status'])
export class VerificationCase {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'seller_id', type: 'uuid' })
  sellerId!: string;

  @Column({
    type: 'enum',
    enum: VerificationCaseStatus,
    default: VerificationCaseStatus.OPEN,
  })
  status!: VerificationCaseStatus;

  @Column({ name: 'decision_reason', type: 'text', nullable: true })
  decisionReason!: string | null;

  @Column({ name: 'retention_hold_reason', type: 'text', nullable: true })
  retentionHoldReason!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'decided_at', type: 'timestamptz', nullable: true })
  decidedAt!: Date | null;

  @Column({ name: 'decided_by', type: 'uuid', nullable: true })
  decidedById!: string | null;

  @ManyToOne(() => User, (user) => user.verificationCases, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'seller_id' })
  seller!: User;

  @ManyToOne(() => User, (user) => user.verificationDecisions, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'decided_by' })
  decidedBy!: User | null;

  @OneToMany(
    () => VerificationEvidence,
    (evidence) => evidence.verificationCase,
  )
  evidence!: VerificationEvidence[];

  @OneToMany(() => EvidenceAccess, (access) => access.verificationCase)
  accesses!: EvidenceAccess[];
}
