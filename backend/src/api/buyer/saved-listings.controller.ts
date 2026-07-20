import { ListingStatus } from '@makaan/shared/constants/enums';
import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Listing } from '../../models/listing.entity';

@Controller('buyer')
export class SavedListingsController {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
  ) {}

  @Get('saved')
  async getSavedListings(@Query('listingIds') listingIds?: string) {
    const ids = (listingIds ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 50);

    if (ids.length === 0) {
      return {
        success: true,
        listings: [],
      };
    }

    const listings = await this.listingRepository.find({
      where: {
        id: In(ids),
        status: ListingStatus.ACTIVE,
      },
      relations: {
        area: true,
        photos: true,
      },
    });

    const orderedListings = ids
      .map((id) => listings.find((listing) => listing.id === id))
      .filter((listing): listing is Listing => Boolean(listing));

    return {
      success: true,
      listings: orderedListings.map((listing) => ({
        id: listing.id,
        title: `${listing.propertyType} in ${listing.area?.nameEn ?? 'Cairo'}`,
        price: Number(listing.priceEgp),
        thumbnail_url:
          [...(listing.photos ?? [])].sort((left, right) => left.displayOrder - right.displayOrder)[0]
            ?.cloudinaryUrl ?? null,
        area_name: listing.area?.nameEn ?? 'Cairo',
        status: listing.status,
      })),
    };
  }
}
