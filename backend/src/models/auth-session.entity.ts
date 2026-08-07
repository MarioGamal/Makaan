import { UserType } from '@makaan/shared/constants/enums';
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

import { User } from './user.entity';

export enum AuthSessionScope {
  SELLER = 'seller',
  ADMIN = 'admin',
}

@Entity('auth_sessions')
@Index('IDX_AUTH_SESSIONS_TOKEN_HASH', ['tokenHash'], { unique: true })
@Index('IDX_AUTH_SESSIONS_USER_SCOPE', ['userId', 'sessionScope'])
@Index(
  'IDX_AUTH_SESSIONS_ACTIVE_EXPIRY',
  ['absoluteExpiresAt', 'idleExpiresAt'],
  {
    where: '"revoked_at" IS NULL',
  },
)
export class AuthSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'session_scope', type: 'enum', enum: AuthSessionScope })
  sessionScope!: AuthSessionScope;

  @Column({
    name: 'role_at_issue',
    type: 'enum',
    enum: UserType,
    enumName: 'users_user_type_enum',
  })
  roleAtIssue!: UserType;

  @Column({ name: 'token_hash', type: 'varchar', length: 255, select: false })
  tokenHash!: string;

  @Column({ name: 'csrf_hash', type: 'varchar', length: 128, select: false })
  csrfHash!: string;

  @Column({ name: 'absolute_expires_at', type: 'timestamptz' })
  absoluteExpiresAt!: Date;

  /** Transitional source compatibility; not a second persisted column. */
  get expiresAt(): Date {
    return this.absoluteExpiresAt;
  }

  set expiresAt(value: Date) {
    this.absoluteExpiresAt = value;
  }

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'last_seen_at', type: 'timestamptz' })
  lastSeenAt!: Date;

  @Column({ name: 'idle_expires_at', type: 'timestamptz' })
  idleExpiresAt!: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({
    name: 'revocation_reason',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  revocationReason!: string | null;

  @Column({ name: 'rotated_from_id', type: 'uuid', nullable: true })
  rotatedFromId!: string | null;

  @Column({
    name: 'ip_prefix_hash',
    type: 'varchar',
    length: 128,
    nullable: true,
    select: false,
  })
  ipPrefixHash!: string | null;

  @Column({
    name: 'user_agent_hash',
    type: 'varchar',
    length: 128,
    nullable: true,
    select: false,
  })
  userAgentHash!: string | null;

  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => AuthSession, (session) => session.rotatedSessions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'rotated_from_id' })
  rotatedFrom!: AuthSession | null;

  @OneToMany(() => AuthSession, (session) => session.rotatedFrom)
  rotatedSessions!: AuthSession[];
}
