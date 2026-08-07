import { ListingStatus } from '@makaan/shared/constants/enums';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CreateListingDto } from '../api/listings/dto/create-listing.dto';
import { CairoArea } from '../models/cairo-area.entity';
import { Listing, ListingPurpose } from '../models/listing.entity';
import { Photo } from '../models/photo.entity';
import { SellerProfile } from '../models/seller-profile.entity';

import { AbuseControlService } from './abuse-control.service';
import { deriveEffectiveParticipation } from './participation.service';

@Injectable()
export class ListingCreateService {
  constructor(
    private readonly abuseControlService: AbuseControlService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
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
        description: dto.descriptionAr ?? null,
        titleAr: dto.titleAr?.trim() || null,
        titleEn: dto.titleEn?.trim() || null,
        descriptionAr: dto.descriptionAr?.trim() || null,
        descriptionEn: dto.descriptionEn?.trim() || null,
        amenities: dto.amenities ?? [],
        floorNumber: dto.floorNumber ?? null,
        sellerPublicLocationMode: dto.publicLocationMode ?? null,
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

  async updateListing(
    userId: string,
    listingId: string,
    dto: CreateListingDto,
    expectedLockVersion?: number,
  ) {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId, sellerId: userId },
      relations: { photos: true },
    });

    if (!listing) {
      throw new NotFoundException(
        'Listing not found or you do not have permission to edit it.',
      );
    }

    if (
      expectedLockVersion !== undefined &&
      listing.lockVersion !== expectedLockVersion
    ) {
      throw new ConflictException('listing_version_conflict');
    }

    if (
      ![ListingStatus.DRAFT, ListingStatus.REJECTED].includes(listing.status)
    ) {
      throw new ForbiddenException(
        `Cannot edit listing with status '${listing.status}'.`,
      );
    }

    listing.areaId = await this.resolveAreaId(
      dto.location.lng,
      dto.location.lat,
    );
    listing.purpose = dto.purpose as ListingPurpose;
    listing.propertyType = dto.propertyType;
    listing.sizeSqm = dto.sizeSqm;
    listing.bedrooms = dto.bedrooms;
    listing.bathrooms = dto.bathrooms;
    listing.finishingLevel = dto.finishingLevel;
    listing.priceEgp = dto.priceEgp;
    listing.description = dto.descriptionAr ?? null;
    listing.titleAr = dto.titleAr?.trim() || null;
    listing.titleEn = dto.titleEn?.trim() || null;
    listing.descriptionAr = dto.descriptionAr?.trim() || null;
    listing.descriptionEn = dto.descriptionEn?.trim() || null;
    listing.amenities = dto.amenities ?? [];
    listing.floorNumber = dto.floorNumber ?? null;
    listing.sellerPublicLocationMode = dto.publicLocationMode ?? null;
    listing.location = {
      type: 'Point',
      coordinates: [dto.location.lng, dto.location.lat],
    };
    listing.lockVersion += 1;

    return this.listingRepository.save(listing);
  }

  async submitListing(userId: string, listingId: string, lockVersion: number) {
    await this.validateSubmittableListing(listingId, userId);
    await this.enforceSubmissionLimit(userId);

    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Listing);
      const listing = await repository
        .createQueryBuilder('listing')
        .setLock('pessimistic_write')
        .where('listing.id = :listingId', { listingId })
        .andWhere('listing.sellerId = :userId', { userId })
        .getOne();

      if (!listing) {
        throw new NotFoundException('listing_not_found');
      }
      if (listing.lockVersion !== lockVersion) {
        throw new ConflictException('listing_version_conflict');
      }
      if (
        ![ListingStatus.DRAFT, ListingStatus.REJECTED].includes(listing.status)
      ) {
        throw new ForbiddenException('listing_not_submittable');
      }
      if (!listing.titleAr?.trim() || !listing.descriptionAr?.trim()) {
        throw new BadRequestException({
          message: 'listing_arabic_content_required',
          validationErrors: [
            ...(!listing.titleAr?.trim()
              ? [{ field: 'titleAr', message: 'Arabic title is required' }]
              : []),
            ...(!listing.descriptionAr?.trim()
              ? [
                  {
                    field: 'descriptionAr',
                    message: 'Arabic description is required',
                  },
                ]
              : []),
          ],
        });
      }
      if (!listing.sellerPublicLocationMode) {
        throw new BadRequestException({
          message: 'public_location_consent_required',
          validationErrors: [
            {
              field: 'publicLocationMode',
              message: 'Choose approximate or area-only public location',
            },
          ],
        });
      }

      listing.photos = await manager.getRepository(Photo).find({
        where: { listingId: listing.id },
        order: { displayOrder: 'ASC' },
      });

      const profile = await manager.getRepository(SellerProfile).findOne({
        where: { userId },
      });
      if (!profile) {
        throw new ForbiddenException('seller_profile_required');
      }

      const snapshot = {
        titleAr: listing.titleAr,
        titleEn: listing.titleEn,
        descriptionAr: listing.descriptionAr,
        descriptionEn: listing.descriptionEn,
        purpose: listing.purpose,
        propertyType: listing.propertyType,
        sizeSqm: Number(listing.sizeSqm),
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        finishingLevel: listing.finishingLevel,
        priceEgp: Number(listing.priceEgp),
        floorNumber: listing.floorNumber,
        amenities: listing.amenities,
        areaId: listing.areaId,
        publicLocationMode: listing.sellerPublicLocationMode,
      };
      const mediaReferences = [...(listing.photos ?? [])]
        .sort((left, right) => left.displayOrder - right.displayOrder)
        .map((photo) => ({ id: photo.id, order: photo.displayOrder }));
      const rows = (await manager.query(
        `INSERT INTO listing_revisions (
          listing_id, revision_number, snapshot, exact_location,
          participation_declaration_version, declared_participation,
          media_references, change_classification, created_by
        )
        SELECT $1,
          COALESCE((SELECT MAX(revision_number) + 1 FROM listing_revisions WHERE listing_id = $1), 1),
          $2::jsonb, exact_location, $3, $4, $5::jsonb, 'material', $6
        FROM listings WHERE id = $1
        RETURNING id`,
        [
          listing.id,
          JSON.stringify(snapshot),
          profile.participationDeclarationVersion,
          profile.declaredParticipation,
          JSON.stringify(mediaReferences),
          userId,
        ],
      )) as Array<{ id: string }>;

      listing.currentRevisionId = rows[0].id;
      listing.status = ListingStatus.SUBMITTED;
      listing.submittedAt = new Date();
      listing.approvedAt = null;
      listing.rejectionReason = null;
      listing.lockVersion += 1;
      return repository.save(listing);
    });
  }

  async validateSubmittableListing(listingId: string, userId?: string) {
    const listing = await this.listingRepository.findOne({
      where: userId ? { id: listingId, sellerId: userId } : { id: listingId },
      relations: { photos: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const validationErrors: Array<{ field: string; message: string }> = [];

    if (!listing.location) {
      validationErrors.push({
        field: 'location',
        message: 'Map pin is required',
      });
    }

    const photoCount = listing.photos?.length ?? 0;
    if (photoCount < 3) {
      validationErrors.push({
        field: 'photos',
        message: `Minimum 3 photos required (currently ${photoCount})`,
      });
    }

    if (
      !(await this.isWithinCairo(
        listing.location.coordinates[0],
        listing.location.coordinates[1],
      ))
    ) {
      validationErrors.push({
        field: 'location',
        message: 'Map pin is outside Cairo boundaries',
      });
    }

    if (validationErrors.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        message:
          'Cannot submit listing. Missing required fields or invalid location.',
        error: 'Bad Request',
        validationErrors,
      });
    }
  }

  private async enforceSubmissionLimit(userId: string): Promise<void> {
    const profile = await this.sellerProfileRepository.findOne({
      where: { userId },
    });
    if (!profile) {
      throw new ForbiddenException('seller_profile_required');
    }
    const participation = deriveEffectiveParticipation(profile);
    await this.abuseControlService.consume(
      participation === 'agent'
        ? 'agentListingSubmission'
        : 'ownerListingSubmission',
      ['seller', userId],
    );
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
