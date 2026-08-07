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
import { VerificationCase } from './verification-case.entity';

export enum VerificationEvidenceScanState {
  PENDING = 'pending',
  CLEAN = 'clean',
  MALICIOUS = 'malicious',
  FAILED = 'failed',
}

@Entity('verification_evidence')
@Index('IDX_VERIFICATION_EVIDENCE_CASE', ['caseId'])
@Index('IDX_VERIFICATION_EVIDENCE_RETENTION', ['deletionDueAt'], {
  where: '"deleted_at" IS NULL',
})
export class VerificationEvidence {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'case_id', type: 'uuid' })
  caseId!: string;

  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedById!: string;

  @Column({ name: 'metadata_ciphertext', type: 'text', select: false })
  metadataCiphertext!: string;

  @Column({ name: 'private_object_reference', type: 'text', select: false })
  privateObjectReference!: string;

  @Column({
    name: 'scan_state',
    type: 'enum',
    enum: VerificationEvidenceScanState,
    default: VerificationEvidenceScanState.PENDING,
  })
  scanState!: VerificationEvidenceScanState;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamptz' })
  uploadedAt!: Date;

  @Column({ name: 'decision_at', type: 'timestamptz', nullable: true })
  decisionAt!: Date | null;

  @Column({ name: 'deletion_due_at', type: 'timestamptz', nullable: true })
  deletionDueAt!: Date | null;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;

  @Column({ name: 'retention_hold_reason', type: 'text', nullable: true })
  retentionHoldReason!: string | null;

  @ManyToOne(
    () => VerificationCase,
    (verificationCase) => verificationCase.evidence,
    {
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({ name: 'case_id' })
  verificationCase!: VerificationCase;

  @ManyToOne(() => User, (user) => user.uploadedVerificationEvidence, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy!: User;

  @OneToMany(() => EvidenceAccess, (access) => access.evidence)
  accesses!: EvidenceAccess[];
}
