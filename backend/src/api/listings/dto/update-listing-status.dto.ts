import { ListingStatus } from '@makaan/shared/constants/enums';
import { IsIn } from 'class-validator';

export class UpdateListingStatusDto {
  @IsIn([ListingStatus.SOLD, ListingStatus.INACTIVE])
  status!: ListingStatus.SOLD | ListingStatus.INACTIVE;
}
