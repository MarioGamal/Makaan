import { ListingStatus, SellerType } from '@makaan/shared/constants/enums';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Inquiry } from '../models/inquiry.entity';
import { Listing } from '../models/listing.entity';
import { SavedListing } from '../models/saved-listing.entity';
import { SellerNotification } from '../models/seller-notification.entity';
import { SellerProfile } from '../models/seller-profile.entity';
import { View } from '../models/view.entity';

type ListingCountRow = {
  listingId: string;
  count: string;
};

@Injectable()
export class SellerDashboardService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(View)
    private readonly viewRepository: Repository<View>,
    @InjectRepository(SavedListing)
    private readonly savedListingRepository: Repository<SavedListing>,
    @InjectRepository(Inquiry)
    private readonly inquiryRepository: Repository<Inquiry>,
    @InjectRepository(SellerProfile)
    private readonly sellerProfileRepository: Repository<SellerProfile>,
    @InjectRepository(SellerNotification)
    private readonly sellerNotificationRepository: Repository<SellerNotification>,
  ) {}

  async getSellerListings(sellerId: string) {
    const [listings, sellerProfile, notifications] = await Promise.all([
      this.listingRepository.find({
        where: { sellerId },
        relations: {
          area: true,
          photos: true,
        },
        order: {
          createdAt: 'DESC',
        },
      }),
      this.sellerProfileRepository.findOne({
        where: { userId: sellerId },
      }),
      this.sellerNotificationRepository.find({
        where: { sellerId },
        order: { createdAt: 'DESC' },
      }),
    ]);

    const metricsMap = await this.getMetricsMap(
      listings.map((listing) => listing.id),
    );

    const latestNote = new Map<string, string | null>();
    for (const notification of notifications) {
      if (!latestNote.has(notification.listingId)) {
        latestNote.set(notification.listingId, notification.notes);
      }
    }

    return {
      seller: {
        sellerType: sellerProfile?.sellerType ?? SellerType.OWNER,
        isVerified: sellerProfile?.isVerified ?? false,
      },
      listings: listings.map((listing) =>
        this.mapListing(
          listing,
          metricsMap[listing.id],
          latestNote.get(listing.id) ?? null,
        ),
      ),
    };
  }

  async getListingMetrics(sellerId: string, listingId: string) {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId, sellerId },
    });

    if (!listing) {
      throw new NotFoundException(
        'Listing not found or you do not have permission to access it.',
      );
    }

    const [metricsMap, viewsLast7Days] = await Promise.all([
      this.getMetricsMap([listingId]),
      this.viewRepository
        .createQueryBuilder('view')
        .where('view.listing_id = :listingId', { listingId })
        .andWhere('view.created_at >= :since', {
          since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .getCount(),
    ]);

    return {
      listingId,
      ...metricsMap[listingId],
      viewsLast7Days,
    };
  }

  async getSellerListing(sellerId: string, listingId: string) {
    const listing = await this.listingRepository.findOne({
      where: { id: listingId, sellerId },
      relations: { area: true, photos: true },
    });
    if (!listing) {
      throw new NotFoundException('listing_not_found');
    }
    const [metrics, notification] = await Promise.all([
      this.getMetricsMap([listingId]),
      this.sellerNotificationRepository.findOne({
        where: { listingId, sellerId },
        order: { createdAt: 'DESC' },
      }),
    ]);
    return this.mapListing(
      listing,
      metrics[listingId],
      notification?.notes ?? null,
    );
  }

  async updateListingStatus(
    sellerId: string,
    listingId: string,
    status: ListingStatus.SOLD | ListingStatus.INACTIVE,
    expectedLockVersion?: number,
  ) {
    if (![ListingStatus.SOLD, ListingStatus.INACTIVE].includes(status)) {
      throw new BadRequestException('Status must be sold or inactive.');
    }

    const listing = await this.listingRepository.findOne({
      where: { id: listingId, sellerId },
    });

    if (!listing) {
      throw new NotFoundException(
        'Listing not found or you do not have permission to update it.',
      );
    }

    if (
      expectedLockVersion !== undefined &&
      listing.lockVersion !== expectedLockVersion
    ) {
      throw new ConflictException('listing_version_conflict');
    }

    if (listing.status !== ListingStatus.ACTIVE) {
      throw new ForbiddenException(
        'Only active listings can be marked sold or inactive.',
      );
    }

    listing.status = status;
    listing.lockVersion += 1;
    return this.listingRepository.save(listing);
  }

  async getNotifications(sellerId: string) {
    const notifications = await this.sellerNotificationRepository.find({
      where: {
        sellerId,
        isRead: false,
      },
      relations: {
        listing: {
          area: true,
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (notifications.length > 0) {
      await this.sellerNotificationRepository.update(
        { id: In(notifications.map((notification) => notification.id)) },
        { isRead: true },
      );
    }

    return notifications.map((notification) => ({
      id: notification.id,
      listingId: notification.listingId,
      rejectionReason: notification.rejectionReason,
      rejectedAt: notification.createdAt,
      listingTitle: this.buildTitle(notification.listing),
      notes: notification.notes,
    }));
  }

  private async getMetricsMap(listingIds: string[]) {
    const baseMetrics = Object.fromEntries(
      listingIds.map((listingId) => [
        listingId,
        {
          viewCount: 0,
          saveCount: 0,
          contactCount: 0,
          daysListed: 0,
        },
      ]),
    ) as Record<
      string,
      {
        viewCount: number;
        saveCount: number;
        contactCount: number;
        daysListed: number;
      }
    >;

    if (listingIds.length === 0) {
      return baseMetrics;
    }

    const [views, saves, inquiries, listings] = await Promise.all([
      this.viewRepository
        .createQueryBuilder('view')
        .select('view.listing_id', 'listingId')
        .addSelect('COUNT(*)', 'count')
        .where('view.listing_id IN (:...listingIds)', { listingIds })
        .groupBy('view.listing_id')
        .getRawMany<ListingCountRow>(),
      this.savedListingRepository
        .createQueryBuilder('saved_listing')
        .select('saved_listing.listing_id', 'listingId')
        .addSelect('COUNT(*)', 'count')
        .where('saved_listing.listing_id IN (:...listingIds)', { listingIds })
        .andWhere('saved_listing.active = true')
        .groupBy('saved_listing.listing_id')
        .getRawMany<ListingCountRow>(),
      this.inquiryRepository
        .createQueryBuilder('inquiry')
        .select('inquiry.listing_id', 'listingId')
        .addSelect('COUNT(*)', 'count')
        .where('inquiry.listing_id IN (:...listingIds)', { listingIds })
        .groupBy('inquiry.listing_id')
        .getRawMany<ListingCountRow>(),
      this.listingRepository.find({
        where: { id: In(listingIds) },
        select: {
          id: true,
          createdAt: true,
          submittedAt: true,
        },
      }),
    ]);

    views.forEach((row) => {
      if (baseMetrics[row.listingId]) {
        baseMetrics[row.listingId].viewCount = Number(row.count);
      }
    });
    saves.forEach((row) => {
      if (baseMetrics[row.listingId]) {
        baseMetrics[row.listingId].saveCount = Number(row.count);
      }
    });
    inquiries.forEach((row) => {
      if (baseMetrics[row.listingId]) {
        baseMetrics[row.listingId].contactCount = Number(row.count);
      }
    });
    listings.forEach((listing) => {
      const anchorDate = listing.submittedAt ?? listing.createdAt;
      baseMetrics[listing.id].daysListed = this.calculateDaysListed(anchorDate);
    });

    return baseMetrics;
  }

  private mapListing(
    listing: Listing,
    metrics = { viewCount: 0, saveCount: 0, contactCount: 0, daysListed: 0 },
    moderatorNote: string | null = null,
  ) {
    const orderedPhotos = [...(listing.photos ?? [])].sort(
      (left, right) => left.displayOrder - right.displayOrder,
    );

    return {
      id: listing.id,
      title: this.buildTitle(listing),
      purpose: listing.purpose,
      propertyType: listing.propertyType,
      sizeSqm: Number(listing.sizeSqm),
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      finishingLevel: listing.finishingLevel,
      priceEgp: Number(listing.priceEgp),
      description: listing.description,
      titleAr: listing.titleAr,
      titleEn: listing.titleEn,
      descriptionAr: listing.descriptionAr,
      descriptionEn: listing.descriptionEn,
      floorNumber: listing.floorNumber,
      amenities: listing.amenities,
      publicLocationMode: listing.sellerPublicLocationMode,
      lockVersion: listing.lockVersion,
      location: {
        lat: listing.location.coordinates[1],
        lng: listing.location.coordinates[0],
      },
      area: {
        id: listing.area?.id ?? null,
        nameEn: listing.area?.nameEn ?? null,
        nameAr: listing.area?.nameAr ?? null,
      },
      status: listing.status,
      rejectionReason: listing.rejectionReason,
      moderatorNote,
      submittedAt: listing.submittedAt,
      approvedAt: listing.approvedAt,
      thumbnailUrl: orderedPhotos[0]?.cloudinaryUrl ?? null,
      photos: orderedPhotos.map((photo) => ({
        id: photo.id,
        url: photo.cloudinaryUrl,
        width: photo.width,
        height: photo.height,
        order: photo.displayOrder,
      })),
      metrics,
    };
  }

  private buildTitle(
    listing: Pick<Listing, 'propertyType' | 'rejectionReason'> & {
      area?: { nameEn?: string | null } | null;
    },
  ) {
    if ('titleAr' in listing && typeof listing.titleAr === 'string') {
      return listing.titleAr;
    }
    return `${listing.propertyType} in ${listing.area?.nameEn ?? 'Cairo'}`;
  }

  private calculateDaysListed(dateValue: Date | null) {
    if (!dateValue) {
      return 0;
    }

    const diff = Date.now() - new Date(dateValue).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }
}
