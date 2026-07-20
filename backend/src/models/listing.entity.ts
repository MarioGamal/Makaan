import {
  FinishingLevel,
  ListingStatus,
  PropertyType,
  RejectionReason,
} from '@makaan/shared/constants/enums';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CairoArea } from './cairo-area.entity';
import { Photo } from './photo.entity';
import { SellerNotification } from './seller-notification.entity';
import { User } from './user.entity';

export enum ListingPurpose {
  SALE = 'sale',
  RENT = 'rent',
}

type PointGeometry = {
  type: 'Point';
  coordinates: [number, number];
};

@Entity('listings')
@Index('IDX_LISTINGS_STATUS', ['status'])
@Index('IDX_LISTINGS_SELLER_ID', ['sellerId'])
@Index('IDX_LISTINGS_LOCATION_GIST', ['location'], { spatial: true })
export class Listing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'seller_id', type: 'uuid' })
  sellerId!: string;

  @Column({ name: 'area_id', type: 'uuid', nullable: true })
  areaId!: string | null;

  @Column({
    type: 'enum',
    enum: ListingPurpose,
  })
  purpose!: ListingPurpose;

  @Column({
    name: 'property_type',
    type: 'enum',
    enum: PropertyType,
  })
  propertyType!: PropertyType;

  @Column({ name: 'size_sqm', type: 'decimal', precision: 10, scale: 2 })
  sizeSqm!: number;

  @Column({ type: 'int' })
  bedrooms!: number;

  @Column({ type: 'int' })
  bathrooms!: number;

  @Column({
    name: 'finishing_level',
    type: 'enum',
    enum: FinishingLevel,
  })
  finishingLevel!: FinishingLevel;

  @Column({ name: 'price_egp', type: 'decimal', precision: 12, scale: 2 })
  priceEgp!: number;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location!: PointGeometry;

  @Column({
    type: 'enum',
    enum: ListingStatus,
    default: ListingStatus.DRAFT,
  })
  status!: ListingStatus;

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount!: number;

  @Column({ name: 'save_count', type: 'int', default: 0 })
  saveCount!: number;

  @Column({ name: 'contact_count', type: 'int', default: 0 })
  contactCount!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
  submittedAt!: Date | null;

  @Column({ name: 'approved_at', type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  @Column({
    name: 'rejection_reason',
    type: 'enum',
    enum: RejectionReason,
    nullable: true,
  })
  rejectionReason!: RejectionReason | null;

  @ManyToOne(() => User, (user) => user.listings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_id' })
  seller!: User;

  @ManyToOne(() => CairoArea, (area) => area.listings, { nullable: true })
  @JoinColumn({ name: 'area_id' })
  area!: CairoArea | null;

  @OneToMany(() => Photo, (photo) => photo.listing)
  photos!: Photo[];

  @OneToMany(() => SellerNotification, (notification) => notification.listing)
  notifications!: SellerNotification[];
}
