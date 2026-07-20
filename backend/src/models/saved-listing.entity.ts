import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Listing } from './listing.entity';
import { User } from './user.entity';

@Entity('saved_listings')
@Unique('UQ_SAVED_LISTINGS_BUYER_LISTING', ['buyerId', 'listingId'])
@Unique('UQ_SAVED_LISTINGS_SESSION_LISTING', ['sessionId', 'listingId'])
export class SavedListing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'buyer_id', type: 'uuid', nullable: true })
  buyerId!: string | null;

  @Column({ name: 'listing_id', type: 'uuid' })
  listingId!: string;

  @Column({ name: 'session_id', type: 'varchar', length: 120, nullable: true })
  sessionId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyer_id' })
  buyer!: User | null;

  @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing!: Listing;
}
