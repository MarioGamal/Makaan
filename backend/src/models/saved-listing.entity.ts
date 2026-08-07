import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { AnonymousSubject } from './anonymous-subject.entity';
import { Listing } from './listing.entity';
import { User } from './user.entity';

@Entity('saved_listings')
@Index('UQ_SAVED_LISTINGS_ACTIVE_USER', ['userId', 'listingId'], {
  unique: true,
  where: '"active" = true AND "user_id" IS NOT NULL',
})
@Index(
  'UQ_SAVED_LISTINGS_ACTIVE_ANONYMOUS',
  ['anonymousSubjectId', 'listingId'],
  {
    unique: true,
    where: '"active" = true AND "anonymous_subject_id" IS NOT NULL',
  },
)
@Index('IDX_SAVED_LISTINGS_LISTING_ACTIVE', ['listingId'], {
  where: '"active" = true',
})
export class SavedListing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ name: 'listing_id', type: 'uuid' })
  listingId!: string;

  @Column({ name: 'anonymous_subject_id', type: 'uuid', nullable: true })
  anonymousSubjectId!: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'deactivated_at', type: 'timestamptz', nullable: true })
  deactivatedAt!: Date | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @ManyToOne(() => AnonymousSubject, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'anonymous_subject_id' })
  anonymousSubject!: AnonymousSubject | null;

  @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing!: Listing;
}
