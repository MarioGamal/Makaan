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

export enum AdminActionType {
  APPROVE = 'approve',
  REJECT = 'reject',
  UNPUBLISH = 'unpublish',
  BLOCK_USER = 'block_user',
}

@Entity('admin_actions')
@Index('IDX_ADMIN_ACTIONS_ADMIN_CREATED_AT', ['adminId', 'createdAt'])
export class AdminAction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'admin_id', type: 'uuid' })
  adminId!: string;

  @Column({
    name: 'action_type',
    type: 'enum',
    enum: AdminActionType,
  })
  actionType!: AdminActionType;

  @Column({ name: 'target_listing_id', type: 'uuid', nullable: true })
  targetListingId!: string | null;

  @Column({ name: 'target_user_id', type: 'uuid', nullable: true })
  targetUserId!: string | null;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.adminActions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'admin_id' })
  admin!: User;

  @ManyToOne(() => Listing, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_listing_id' })
  targetListing!: Listing | null;

  @ManyToOne(() => User, (user) => user.targetedAdminActions, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'target_user_id' })
  targetUser!: User | null;
}
