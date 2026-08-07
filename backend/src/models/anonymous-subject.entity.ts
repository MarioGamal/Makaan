import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('anonymous_subjects')
@Index('IDX_ANONYMOUS_SUBJECTS_ACTIVE_EXPIRY', ['expiresAt'], {
  where: '"revoked_at" IS NULL',
})
export class AnonymousSubject {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'token_hash',
    type: 'varchar',
    length: 128,
    unique: true,
    select: false,
  })
  tokenHash!: string;

  @Column({ name: 'csrf_hash', type: 'varchar', length: 128, select: false })
  csrfHash!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'last_seen_at', type: 'timestamptz' })
  lastSeenAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;
}
