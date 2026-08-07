import { RejectionReason } from '@makaan/shared/constants/enums';
import { IsEnum, IsInt, IsString, MaxLength, Min } from 'class-validator';

export class UnpublishListingDto {
  @IsInt()
  @Min(1)
  lockVersion!: number;

  @IsEnum(RejectionReason)
  reasonCode!: RejectionReason;

  @IsString()
  @MaxLength(2000)
  internalReason!: string;
}
