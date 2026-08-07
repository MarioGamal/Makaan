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
  RENT = 'long_term_rent',
}

export enum PublicLocationMode {
  APPROXIMATE = 'approximate',
  AREA_ONLY = 'area_only',
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

  @Column({ name: 'title_ar', type: 'varchar', length: 180, nullable: true })
  titleAr!: string | null;

  @Column({ name: 'title_en', type: 'varchar', length: 180, nullable: true })
  titleEn!: string | null;

  @Column({ name: 'description_ar', type: 'text', nullable: true })
  descriptionAr!: string | null;

  @Column({ name: 'description_en', type: 'text', nullable: true })
  descriptionEn!: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  amenities!: string[];

  @Column({ name: 'floor_number', type: 'int', nullable: true })
  floorNumber!: number | null;

  @Column({
    name: 'seller_public_location_mode',
    type: 'enum',
    enum: PublicLocationMode,
    nullable: true,
  })
  sellerPublicLocationMode!: PublicLocationMode | null;

  @Column({
    name: 'approved_public_location_mode',
    type: 'enum',
    enum: PublicLocationMode,
    nullable: true,
  })
  approvedPublicLocationMode!: PublicLocationMode | null;

  @Column({
    name: 'public_location',
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  publicLocation!: PointGeometry | null;

  @Column({ name: 'public_location_distance_m', type: 'int', nullable: true })
  publicLocationDistanceM!: number | null;

  @Column({
    name: 'exact_location',
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
    name: 'availability_confirmed_at',
    type: 'timestamptz',
    nullable: true,
  })
  availabilityConfirmedAt!: Date | null;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy!: string | null;

  @Column({ name: 'rejected_at', type: 'timestamptz', nullable: true })
  rejectedAt!: Date | null;

  @Column({ name: 'rejected_by', type: 'uuid', nullable: true })
  rejectedBy!: string | null;

  @Column({
    name: 'rejection_reason',
    type: 'enum',
    enum: RejectionReason,
    nullable: true,
  })
  rejectionReason!: RejectionReason | null;

  @Column({ name: 'current_revision_id', type: 'uuid', nullable: true })
  currentRevisionId!: string | null;

  @Column({ name: 'approved_revision_id', type: 'uuid', nullable: true })
  approvedRevisionId!: string | null;

  @Column({ name: 'lock_version', type: 'int', default: 1 })
  lockVersion!: number;

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
