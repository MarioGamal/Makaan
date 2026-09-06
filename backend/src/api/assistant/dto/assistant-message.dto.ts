import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/**
 * Conversation context echoed back from a previous reply. It mirrors the public
 * search filters exactly, so a follow-up question can never widen what the
 * assistant is able to read.
 */
export class AssistantContextDto {
  @IsOptional()
  @IsIn(['sale', 'long_term_rent'])
  purpose?: 'sale' | 'long_term_rent';

  @IsOptional()
  @IsUUID('4')
  areaId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  areaNameAr?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  areaNameEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  propertyType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1_000_000_000)
  priceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1_000_000_000)
  priceMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100_000)
  sizeMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100_000)
  sizeMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(20)
  bedroomsMin?: number;

  @IsOptional()
  @IsArray()
  @IsIn(['verified_owner', 'owner_not_verified', 'declared_agent'], {
    each: true,
  })
  participation?: Array<
    'verified_owner' | 'owner_not_verified' | 'declared_agent'
  >;

  @IsOptional()
  @IsIn(['newest', 'price_asc', 'price_desc'])
  sort?: 'newest' | 'price_asc' | 'price_desc';
}

export class AssistantMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  message!: string;

  @IsOptional()
  @IsIn(['ar', 'en'])
  locale: 'ar' | 'en' = 'ar';

  @IsOptional()
  @ValidateNested()
  @Type(() => AssistantContextDto)
  context?: AssistantContextDto;
}
