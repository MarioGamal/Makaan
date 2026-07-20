import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Listing } from './listing.entity';
import { User } from './user.entity';

export enum ViewSource {
  MAP_CLICK = 'map_click',
  SEARCH = 'search',
  DIRECT = 'direct',
}

@Entity('views')
@Index('IDX_VIEWS_LISTING_CREATED_AT', ['listingId', 'createdAt'])
export class View {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'listing_id', type: 'uuid' })
  listingId!: string;

  @Column({ name: 'viewer_id', type: 'uuid', nullable: true })
  viewerId!: string | null;

  @Column({
    type: 'enum',
    enum: ViewSource,
    default: ViewSource.DIRECT,
  })
  source!: ViewSource;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing!: Listing;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'viewer_id' })
  viewer!: User | null;
}

