import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from './user.entity';
import { VerificationCase } from './verification-case.entity';
import { VerificationEvidence } from './verification-evidence.entity';

@Entity('evidence_accesses')
@Index('IDX_EVIDENCE_ACCESSES_EVIDENCE_TIME', ['evidenceId', 'accessedAt'])
export class EvidenceAccess {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'case_id', type: 'uuid' })
  caseId!: string;

  @Column({ name: 'evidence_id', type: 'uuid' })
  evidenceId!: string;

  @Column({ name: 'actor_id', type: 'uuid' })
  actorId!: string;

  @Column({ type: 'varchar', length: 160 })
  purpose!: string;

  @Column({ name: 'correlation_id', type: 'varchar', length: 128 })
  correlationId!: string;

  @CreateDateColumn({ name: 'accessed_at', type: 'timestamptz' })
  accessedAt!: Date;

  @ManyToOne(
    () => VerificationCase,
    (verificationCase) => verificationCase.accesses,
    {
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({ name: 'case_id' })
  verificationCase!: VerificationCase;

  @ManyToOne(() => VerificationEvidence, (evidence) => evidence.accesses, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'evidence_id' })
  evidence!: VerificationEvidence;

  @ManyToOne(() => User, (user) => user.evidenceAccesses, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'actor_id' })
  actor!: User;
}
