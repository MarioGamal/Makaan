import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CairoArea } from '../../models/cairo-area.entity';
import { Listing } from '../../models/listing.entity';
import { AreaSearchService } from '../../services/area-search.service';
import { ContactIntentService } from '../../services/contact-intent.service';
import { PublicListingService } from '../../services/public-listing.service';
import { PublicLocationService } from '../../services/public-location.service';
import { AuthModule } from '../auth/auth.module';

import { AreasController } from './areas.controller';
import { ContactIntentsController } from './contact-intents.controller';
import { ListingsController } from './listings.controller';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Listing, CairoArea])],
  controllers: [ListingsController, AreasController, ContactIntentsController],
  providers: [
    AreaSearchService,
    ContactIntentService,
    PublicListingService,
    PublicLocationService,
  ],
  exports: [PublicListingService],
})
export class ListingsModule {}
