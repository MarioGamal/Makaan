import { SellerType } from '@makaan/shared/constants/enums';
import { IsEnum } from 'class-validator';

export class DeclareParticipationDto {
  @IsEnum(SellerType)
  participation!: SellerType;
}
