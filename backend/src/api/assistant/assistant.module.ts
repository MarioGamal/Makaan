import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CairoArea } from '../../models/cairo-area.entity';
import { Listing } from '../../models/listing.entity';
import { AreaSearchService } from '../../services/area-search.service';
import { AssistantService } from '../../services/assistant.service';
import { PublicListingService } from '../../services/public-listing.service';
import { PublicLocationService } from '../../services/public-location.service';
import { AuthModule } from '../auth/auth.module';

import { AssistantController } from './assistant.controller';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Listing, CairoArea])],
  controllers: [AssistantController],
  providers: [
    AreaSearchService,
    AssistantService,
    PublicListingService,
    PublicLocationService,
  ],
})
export class AssistantModule {}
