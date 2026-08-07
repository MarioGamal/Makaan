import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum AuditActorKind {
  USER = 'user',
  ANONYMOUS = 'anonymous',
  SYSTEM = 'system',
}

@Entity('audit_events')
@Index('IDX_AUDIT_EVENTS_TARGET_TIME', ['targetKind', 'targetId', 'occurredAt'])
@Index('IDX_AUDIT_EVENTS_ACTOR_TIME', ['actorKind', 'actorId', 'occurredAt'])
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'actor_kind', type: 'enum', enum: AuditActorKind })
  actorKind!: AuditActorKind;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId!: string | null;

  @Column({
    name: 'actor_snapshot',
    type: 'jsonb',
    default: () => "'{}'::jsonb",
  })
  actorSnapshot!: Record<string, unknown>;

  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId!: string | null;

  @Column({ type: 'varchar', length: 160 })
  action!: string;

  @Column({ name: 'target_kind', type: 'varchar', length: 120 })
  targetKind!: string;

  @Column({ name: 'target_id', type: 'uuid', nullable: true })
  targetId!: string | null;

  @Column({ name: 'prior_state', type: 'jsonb', nullable: true })
  priorState!: Record<string, unknown> | null;

  @Column({ name: 'resulting_state', type: 'jsonb', nullable: true })
  resultingState!: Record<string, unknown> | null;

  @Column({ name: 'reason_key', type: 'varchar', length: 160, nullable: true })
  reasonKey!: string | null;

  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt!: Date;

  @Column({ name: 'correlation_id', type: 'varchar', length: 128 })
  correlationId!: string;
}
