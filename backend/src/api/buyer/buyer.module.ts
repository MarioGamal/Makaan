import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Listing } from '../../models/listing.entity';
import { SavedListing } from '../../models/saved-listing.entity';

import { SavedListingsController } from './saved-listings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Listing, SavedListing])],
  controllers: [SavedListingsController],
})
export class BuyerModule {}
