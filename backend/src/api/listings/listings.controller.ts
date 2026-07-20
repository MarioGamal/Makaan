import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Redirect,
  Req,
} from '@nestjs/common';

import { ContactMethod } from '../../models/inquiry.entity';
import { ListingPurpose } from '../../models/listing.entity';
import { ListingSearchService } from '../../services/listing-search.service';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingSearchService: ListingSearchService) {}

  @Get()
  async searchListings(
    @Query('bbox') bbox?: string,
    @Query('area_id') areaId?: string,
    @Query('purpose') purpose?: ListingPurpose,
    @Query('property_type') propertyType?: string,
    @Query('min_price') minPrice?: string,
    @Query('max_price') maxPrice?: string,
    @Query('bedrooms') bedrooms?: string,
    @Query('bathrooms') bathrooms?: string,
    @Query('seller_type') sellerType?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.listingSearchService.searchListings({
      bbox,
      areaId,
      purpose,
      propertyType,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      bedrooms: bedrooms ? Number(bedrooms) : undefined,
      bathrooms: bathrooms ? Number(bathrooms) : undefined,
      sellerType,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get(':id')
  async getListingById(@Param('id') id: string, @Req() request: { user?: { id?: string } }) {
    return this.listingSearchService.getListingById(id, request.user?.id);
  }

  @Post(':id/contact')
  async trackContact(
    @Param('id') id: string,
    @Body('method') method: ContactMethod,
    @Req() request: { user?: { id?: string } },
  ) {
    return this.listingSearchService.trackContact(id, method, request.user?.id);
  }

  @Get(':id/contact-link')
  @Redirect()
  async getContactLink(
    @Param('id') id: string,
    @Query('method') method: ContactMethod,
  ) {
    const url = await this.listingSearchService.getContactRedirectUrl(
      id,
      method === ContactMethod.CALL ? ContactMethod.CALL : ContactMethod.WHATSAPP,
    );

    return { url };
  }
}
