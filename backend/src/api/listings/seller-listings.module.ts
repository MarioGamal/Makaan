import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CairoArea } from '../../models/cairo-area.entity';
import { Inquiry } from '../../models/inquiry.entity';
import { Listing } from '../../models/listing.entity';
import { Photo } from '../../models/photo.entity';
import { SavedListing } from '../../models/saved-listing.entity';
import { SellerNotification } from '../../models/seller-notification.entity';
import { SellerProfile } from '../../models/seller-profile.entity';
import { User } from '../../models/user.entity';
import { View } from '../../models/view.entity';
import { ListingCreateService } from '../../services/listing-create.service';
import { SellerDashboardService } from '../../services/seller-dashboard.service';
import { SellerTypeInferenceService } from '../../services/seller-type.service';

import { PhotosController } from './photos.controller';
import { SellerListingsController } from './seller-listings.controller';
import { SellerNotificationsController } from './seller-notifications.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Listing,
      Photo,
      CairoArea,
      SellerProfile,
      User,
      View,
      Inquiry,
      SavedListing,
      SellerNotification,
    ]),
  ],
  controllers: [SellerListingsController, PhotosController, SellerNotificationsController],
  providers: [ListingCreateService, SellerTypeInferenceService, SellerDashboardService],
})
export class SellerListingsModule {}
