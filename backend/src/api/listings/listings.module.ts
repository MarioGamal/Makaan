import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CairoArea } from '../../models/cairo-area.entity';
import { Inquiry } from '../../models/inquiry.entity';
import { Listing } from '../../models/listing.entity';
import { Photo } from '../../models/photo.entity';
import { SellerProfile } from '../../models/seller-profile.entity';
import { View } from '../../models/view.entity';
import { CairoAreaService } from '../../services/cairo-area.service';
import { ListingSearchService } from '../../services/listing-search.service';

import { AreasController } from './areas.controller';
import { ListingsController } from './listings.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Listing,
      CairoArea,
      Photo,
      SellerProfile,
      View,
      Inquiry,
    ]),
  ],
  controllers: [ListingsController, AreasController],
  providers: [ListingSearchService, CairoAreaService],
})
export class ListingsModule {}
