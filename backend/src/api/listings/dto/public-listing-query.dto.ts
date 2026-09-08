import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

const toArray = ({ value }: { value: unknown }): unknown[] | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  return Array.isArray(value) ? value : [value];
};

export class PublicListingQueryDto {
  @IsOptional()
  @IsIn(['ar', 'en'])
  locale: 'ar' | 'en' = 'ar';

  @IsOptional()
  @IsIn(['sale', 'long_term_rent'])
  purpose?: 'sale' | 'long_term_rent';

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsUUID('4', { each: true })
  areaId?: string[];

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsString({ each: true })
  propertyType?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sizeMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sizeMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  bedroomsMin?: number;

  /** Upper bound so "two bedrooms only" is expressible, not just "two or more". */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  bedroomsMax?: number;

  @IsOptional()
  @Transform(toArray)
  @IsArray()
  @IsIn(['verified_owner', 'owner_not_verified', 'declared_agent'], {
    each: true,
  })
  participation?: string[];

  @IsOptional()
  @IsString()
  bbox?: string;

  @IsOptional()
  @IsIn(['newest', 'price_asc', 'price_desc'])
  sort: 'newest' | 'price_asc' | 'price_desc' = 'newest';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(40)
  pageSize = 20;
}
