import { FinishingLevel, PropertyType } from '@makaan/shared/constants/enums';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import {
  ListingPurpose,
  PublicLocationMode,
} from '../../../models/listing.entity';

import { LocationDto } from './location.dto';

export class CreateListingDto {
  @IsIn([ListingPurpose.SALE, ListingPurpose.RENT])
  purpose!: ListingPurpose;

  @IsEnum(PropertyType)
  propertyType!: PropertyType;

  @IsNumber()
  @Min(10)
  sizeSqm!: number;

  @IsInt()
  @Min(0)
  @Max(20)
  bedrooms!: number;

  @IsInt()
  @Min(0)
  @Max(20)
  bathrooms!: number;

  @IsEnum(FinishingLevel)
  finishingLevel!: FinishingLevel;

  @IsNumber()
  @Min(100000)
  priceEgp!: number;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  titleAr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  titleEn?: string;

  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsInt()
  @Min(-5)
  @Max(200)
  floorNumber?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(40)
  @IsString({ each: true })
  amenities?: string[];

  @IsOptional()
  @IsEnum(PublicLocationMode)
  publicLocationMode?: PublicLocationMode;

  @ValidateNested()
  @Type(() => LocationDto)
  location!: LocationDto;

}
