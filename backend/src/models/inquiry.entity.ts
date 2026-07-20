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

export enum ContactMethod {
  WHATSAPP = 'whatsapp',
  CALL = 'call',
}

@Entity('inquiries')
@Index('IDX_INQUIRIES_LISTING_ID', ['listingId'])
export class Inquiry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'listing_id', type: 'uuid' })
  listingId!: string;

  @Column({ name: 'buyer_id', type: 'uuid', nullable: true })
  buyerId!: string | null;

  @Column({
    name: 'contact_method',
    type: 'enum',
    enum: ContactMethod,
  })
  contactMethod!: ContactMethod;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => Listing, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listing_id' })
  listing!: Listing;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'buyer_id' })
  buyer!: User | null;
}
