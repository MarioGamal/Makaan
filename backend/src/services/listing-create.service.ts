import {
  ListingStatus,
  SellerType,
} from '@makaan/shared/constants/enums';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateListingDto } from '../api/listings/dto/create-listing.dto';
import { RedisService } from '../config/redis.module';
import { CairoArea } from '../models/cairo-area.entity';
import { Listing, ListingPurpose } from '../models/listing.entity';
import { Photo } from '../models/photo.entity';
import { SellerProfile } from '../models/seller-profile.entity';

import { SellerTypeInferenceService } from './seller-type.service';

@Injectable()
export class ListingCreateService {
  constructor(
    private readonly redisService: RedisService,
    private readonly sellerTypeInferenceService: SellerTypeInferenceService,
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    @InjectRepository(CairoArea)
    private readonly cairoAreaRepository: Repository<CairoArea>,
    @InjectRepository(SellerProfile)
    private readonly sellerProfileRepository: Repository<SellerProfile>,
  ) {}

  async createDraft(userId: string, dto: CreateListingDto) {
    const inferredSellerType = await this.sellerTypeInferenceService.inferSellerType(userId);
    await this.enforceDailyLimit(userId, inferredSellerType);

    const areaId = await this.resolveAreaId(dto.location.lng, dto.location.lat);

    const listing = await this.listingRepository.save(
      this.listingRepository.create({
        sellerId: userId,
        areaId,
        purpose: dto.purpose as ListingPurpose,
        propertyType: dto.propertyType,
        sizeSqm: dto.sizeSqm,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        finishingLevel: dto.finishingLevel,
        priceEgp: dto.priceEgp,
        description: dto.description ?? null,
        location: {
          type: 'Point',
          coordinates: [dto.location.lng, dto.location.lat],
        },
        status: ListingStatus.DRAFT,
        submittedAt: null,
        approvedAt: null,
        rejectionReason: null,
      }),
    );

    return listing;
  }

  async updateListing(userId: string, listingId: string, dto: CreateListingDto) {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId, sellerId: userId },
      relations: { photos: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found or you do not have permission to edit it.');
    }

    if (![ListingStatus.DRAFT, ListingStatus.REJECTED].includes(listing.status)) {
      throw new ForbiddenException(`Cannot edit listing with status '${listing.status}'.`);
    }

    listing.areaId = await this.resolveAreaId(dto.location.lng, dto.location.lat);
    listing.purpose = dto.purpose as ListingPurpose;
    listing.propertyType = dto.propertyType;
    listing.sizeSqm = dto.sizeSqm;
    listing.bedrooms = dto.bedrooms;
    listing.bathrooms = dto.bathrooms;
    listing.finishingLevel = dto.finishingLevel;
    listing.priceEgp = dto.priceEgp;
    listing.description = dto.description ?? null;
    listing.location = {
      type: 'Point',
      coordinates: [dto.location.lng, dto.location.lat],
    };

    if (dto.submit) {
      await this.validateSubmittableListing(listing.id);
      listing.status = ListingStatus.SUBMITTED;
      listing.submittedAt = new Date();
      listing.approvedAt = null;
      listing.rejectionReason = null;
    }

    return this.listingRepository.save(listing);
  }

  async validateSubmittableListing(listingId: string) {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId },
      relations: { photos: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const validationErrors: Array<{ field: string; message: string }> = [];

    if (!listing.location) {
      validationErrors.push({ field: 'location', message: 'Map pin is required' });
    }

    const photoCount = listing.photos?.length ?? 0;
    if (photoCount < 3) {
      validationErrors.push({
        field: 'photos',
        message: `Minimum 3 photos required (currently ${photoCount})`,
      });
    }

    if (!(await this.isWithinCairo(listing.location.coordinates[0], listing.location.coordinates[1]))) {
      validationErrors.push({
        field: 'location',
        message: 'Map pin is outside Cairo boundaries',
      });
    }

    if (validationErrors.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        message: 'Cannot submit listing. Missing required fields or invalid location.',
        error: 'Bad Request',
        validationErrors,
      });
    }
  }

  private async enforceDailyLimit(userId: string, sellerType: SellerType) {
    const key = `listing_rate:${userId}`;
    const current = await this.redisService.incr(key);
    if (current === 1) {
      await this.redisService.setex(key, 60 * 60 * 24, current);
    }

    const limit = sellerType === SellerType.AGENT ? 20 : 5;
    if (current > limit) {
      throw new ForbiddenException(
        `Daily listing limit reached (${limit}/day for ${sellerType}s).`,
      );
    }
  }

  private async resolveAreaId(lng: number, lat: number) {
    const row = await this.cairoAreaRepository
      .createQueryBuilder('area')
      .select('area.id', 'id')
      .where(
        'ST_Within(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geometry, area.boundary::geometry)',
        { lng, lat },
      )
      .orderBy('area.level', 'DESC')
      .limit(1)
      .getRawOne<{ id: string }>();

    if (!row || !(await this.isWithinCairo(lng, lat))) {
      throw new BadRequestException('Map pin must be within Cairo boundaries');
    }

    return row.id;
  }

  private async isWithinCairo(lng: number, lat: number) {
    const result = await this.cairoAreaRepository
      .createQueryBuilder('area')
      .select('COUNT(area.id)', 'count')
      .where(
        'ST_Within(ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geometry, area.boundary::geometry)',
        { lng, lat },
      )
      .getRawOne<{ count: string }>();

    return Number(result?.count ?? 0) > 0;
  }
}
