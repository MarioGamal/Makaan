import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';

import { PublicListingService } from '../../services/public-listing.service';

import { PublicListingQueryDto } from './dto/public-listing-query.dto';

@Controller('listings')
export class ListingsController {
  constructor(private readonly publicListings: PublicListingService) {}

  @Get()
  search(@Query() query: PublicListingQueryDto) {
    return this.publicListings.search(query);
  }

  @Get(':id')
  detail(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('locale') locale: 'ar' | 'en' = 'ar',
  ) {
    return this.publicListings.detail(id, locale === 'en' ? 'en' : 'ar');
  }
}
