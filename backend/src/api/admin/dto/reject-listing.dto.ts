import { RejectionReason } from '@makaan/shared/constants/enums';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectListingDto {
  @IsEnum(RejectionReason)
  reason!: RejectionReason;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
