import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsIn,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { PublicLocationMode } from '../../../models/listing.entity';

export class ApprovedPublicLocationDto {
  @IsEnum(PublicLocationMode)
  mode!: PublicLocationMode;

  @ValidateIf(
    (value: ApprovedPublicLocationDto) =>
      value.mode === PublicLocationMode.APPROXIMATE,
  )
  @IsNumber()
  @Min(29)
  @Max(32)
  latitude?: number;

  @ValidateIf(
    (value: ApprovedPublicLocationDto) =>
      value.mode === PublicLocationMode.APPROXIMATE,
  )
  @IsNumber()
  @Min(28)
  @Max(33)
  longitude?: number;

  @ValidateIf(
    (value: ApprovedPublicLocationDto) =>
      value.mode === PublicLocationMode.APPROXIMATE,
  )
  @IsInt()
  @Min(100)
  @Max(500)
  radiusMeters?: number;
}

export class ApproveListingDto {
  @IsInt()
  @Min(1)
  lockVersion!: number;

  @ValidateNested()
  @Type(() => ApprovedPublicLocationDto)
  approvedPublicLocation!: ApprovedPublicLocationDto;

  @IsIn(['verified_owner', 'owner_not_verified', 'declared_agent'])
  participationOutcome!:
    'verified_owner' | 'owner_not_verified' | 'declared_agent';

  @IsString()
  @MaxLength(2000)
  internalReason!: string;
}
