import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Listing } from './listing.entity';

type PolygonGeometry = {
  type: 'Polygon';
  coordinates: number[][][];
};

@Entity('cairo_areas')
@Index('IDX_CAIRO_AREAS_BOUNDARY_GIST', ['boundary'], { spatial: true })
export class CairoArea {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'name_en', type: 'varchar', length: 120, unique: true })
  nameEn!: string;

  @Column({ name: 'name_ar', type: 'varchar', length: 120, unique: true })
  nameAr!: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Polygon',
    srid: 4326,
  })
  boundary!: PolygonGeometry;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId!: string | null;

  @Column({ type: 'int', default: 0 })
  level!: number;

  @ManyToOne(() => CairoArea, (area) => area.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent!: CairoArea | null;

  @OneToMany(() => CairoArea, (area) => area.parent)
  children!: CairoArea[];

  @OneToMany(() => Listing, (listing) => listing.area)
  listings!: Listing[];
}
