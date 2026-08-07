import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SavedListing } from '../../models/saved-listing.entity';
import { SavedListingService } from '../../services/saved-listing.service';
import { AuthModule } from '../auth/auth.module';
import { ListingsModule } from '../listings/listings.module';

import { SavedListingsController } from './saved-listings.controller';

@Module({
  imports: [
    AuthModule,
    ListingsModule,
    TypeOrmModule.forFeature([SavedListing]),
  ],
  controllers: [SavedListingsController],
  providers: [SavedListingService],
})
export class BuyerModule {}
