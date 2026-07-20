import { ListingStatus } from '@makaan/shared/constants/enums';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Listing } from '../models/listing.entity';

type DuplicateCandidateRow = {
  listing_id: string;
  seller_id: string;
  property_type: string;
  size_sqm: string;
  bedrooms: number;
  distance_meters: string;
};

type DuplicateHint = {
  listingId: string;
  confidence: number;
  reasons: string[];
};

@Injectable()
export class DuplicateDetectionService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
  ) {}

  async findDuplicateHints(listingId: string): Promise<DuplicateHint[]> {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
      select: {
        id: true,
        sellerId: true,
        propertyType: true,
        sizeSqm: true,
        bedrooms: true,
        location: true,
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const [lng, lat] = listing.location.coordinates;
    const candidates = await this.listingRepository
      .createQueryBuilder('listing')
      .select([
        'listing.id AS listing_id',
        'listing.seller_id AS seller_id',
        'listing.property_type AS property_type',
        'listing.size_sqm AS size_sqm',
        'listing.bedrooms AS bedrooms',
        'ST_Distance(listing.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography) AS distance_meters',
      ])
      .where('listing.id != :listingId', { listingId })
      .andWhere('listing.status IN (:...statuses)', {
        statuses: [ListingStatus.ACTIVE, ListingStatus.SUBMITTED],
      })
      .andWhere(
        'ST_DWithin(listing.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, 50)',
        { lng, lat },
      )
      .orderBy('distance_meters', 'ASC')
      .limit(10)
      .getRawMany<DuplicateCandidateRow>();

    return candidates
      .map((candidate) => this.scoreCandidate(listing, candidate))
      .filter((candidate): candidate is DuplicateHint => candidate !== null)
      .sort((left, right) => right.confidence - left.confidence);
  }

  private scoreCandidate(listing: Listing, candidate: DuplicateCandidateRow): DuplicateHint | null {
    let confidence = 50;
    const reasons = ['Within 50 meters of this listing'];
    const currentSize = Number(listing.sizeSqm);
    const candidateSize = Number(candidate.size_sqm);

    if (candidate.property_type === listing.propertyType) {
      confidence += 20;
      reasons.push('Same property type');
    }

    if (currentSize > 0) {
      const sizeDelta = Math.abs(candidateSize - currentSize) / currentSize;
      if (sizeDelta <= 0.1) {
        confidence += 15;
        reasons.push('Size is within 10%');
      }
    }

    if (candidate.bedrooms === listing.bedrooms) {
      confidence += 10;
      reasons.push('Same bedroom count');
    }

    if (candidate.seller_id === listing.sellerId) {
      confidence += 5;
      reasons.push('Same seller account');
    }

    if (confidence < 40) {
      return null;
    }

    return {
      listingId: candidate.listing_id,
      confidence,
      reasons,
    };
  }
}
