import { FinishingLevel, PropertyType } from '@makaan/shared/constants/enums';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import { ListingPurpose } from '../../../models/listing.entity';

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

  @ValidateNested()
  @Type(() => LocationDto)
  location!: LocationDto;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Boolean)
  submit?: boolean;
}
