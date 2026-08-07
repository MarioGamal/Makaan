import { RejectionReason } from '@makaan/shared/constants/enums';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class RejectListingDto {
  @IsInt()
  @Min(1)
  lockVersion!: number;

  @IsEnum(RejectionReason)
  reasonCode!: RejectionReason;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  sellerNote?: string;

  @IsString()
  @MaxLength(2000)
  internalReason!: string;
}
