import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { CairoArea } from '../models/cairo-area.entity';
import { ContactMethod, Inquiry } from '../models/inquiry.entity';
import { Listing, ListingPurpose } from '../models/listing.entity';
import { Photo } from '../models/photo.entity';
import { SellerProfile } from '../models/seller-profile.entity';
import { View, ViewSource } from '../models/view.entity';

type SearchListingsParams = {
  bbox?: string;
  areaId?: string;
  purpose?: ListingPurpose;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  sellerType?: string;
  page?: number;
  limit?: number;
};

type ListingRow = {
  listing_id: string;
  listing_purpose: ListingPurpose;
  listing_property_type: string;
  listing_size_sqm: string;
  listing_bedrooms: number;
  listing_bathrooms: number;
  listing_finishing_level: string;
  listing_price_egp: string;
  listing_status: string;
  listing_view_count: number;
  listing_save_count: number;
  listing_contact_count: number;
  listing_submitted_at: string | null;
  listing_approved_at: string | null;
  listing_created_at?: string | null;
  listing_rejection_reason: string | null;
  area_name_en: string | null;
  seller_type: string | null;
  seller_verified: boolean | null;
  photo_url: string | null;
  lat: number;
  lng: number;
};

@Injectable()
export class ListingSearchService {
  constructor(
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    @InjectRepository(Inquiry)
    private readonly inquiryRepository: Repository<Inquiry>,
    @InjectRepository(View)
    private readonly viewRepository: Repository<View>,
  ) {}

  async searchListings(params: SearchListingsParams) {
    const page = Math.max(params.page ?? 1, 1);
    const limit = Math.min(Math.max(params.limit ?? 20, 1), 100);

    const qb = this.listingRepository
      .createQueryBuilder('listing')
      .leftJoin(CairoArea, 'area', 'area.id = listing.area_id')
      .leftJoin(SellerProfile, 'seller_profile', 'seller_profile.user_id = listing.seller_id')
      .leftJoin(
        Photo,
        'photo',
        'photo.listing_id = listing.id AND photo.display_order = 0',
      )
      .where('listing.status = :status', { status: 'active' });

    this.applyFilters(qb, params);

    const total = await qb.getCount();
    const rows = (await qb
      .select([
        'listing.id AS listing_id',
        'listing.purpose AS listing_purpose',
        'listing.property_type AS listing_property_type',
        'listing.size_sqm AS listing_size_sqm',
        'listing.bedrooms AS listing_bedrooms',
        'listing.bathrooms AS listing_bathrooms',
        'listing.finishing_level AS listing_finishing_level',
        'listing.price_egp AS listing_price_egp',
        'listing.status AS listing_status',
        'listing.view_count AS listing_view_count',
        'listing.save_count AS listing_save_count',
        'listing.contact_count AS listing_contact_count',
        'listing.submitted_at AS listing_submitted_at',
        'listing.approved_at AS listing_approved_at',
        'listing.created_at AS listing_created_at',
        'listing.rejection_reason AS listing_rejection_reason',
        'area.name_en AS area_name_en',
        'seller_profile.seller_type AS seller_type',
        'seller_profile.is_verified AS seller_verified',
        'photo.cloudinary_url AS photo_url',
        'ST_Y(listing.location::geometry) AS lat',
        'ST_X(listing.location::geometry) AS lng',
      ])
      .orderBy('listing.approved_at', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany()) as ListingRow[];

    return {
      listings: rows.map((row) => this.mapSearchRow(row)),
      total,
      bbox: params.bbox ?? null,
    };
  }

  async getListingById(id: string, viewerId?: string) {
    const listing = await this.listingRepository.findOne({
      where: { id, status: 'active' as never },
      relations: {
        photos: true,
        seller: {
          sellerProfile: true,
        },
        area: true,
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    await this.listingRepository.increment({ id }, 'viewCount', 1);
    await this.viewRepository.save(
      this.viewRepository.create({
        listingId: id,
        viewerId: viewerId ?? null,
        source: ViewSource.DIRECT,
      }),
    );

    return {
      id: listing.id,
      purpose: listing.purpose,
      propertyType: listing.propertyType,
      sizeSqm: Number(listing.sizeSqm),
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      finishingLevel: listing.finishingLevel,
      priceEgp: Number(listing.priceEgp),
      location: {
        lat: listing.location.coordinates[1],
        lng: listing.location.coordinates[0],
      },
      status: listing.status,
      viewCount: listing.viewCount + 1,
      saveCount: listing.saveCount,
      contactCount: listing.contactCount,
      submittedAt: listing.submittedAt,
      approvedAt: listing.approvedAt,
      photos: [...(listing.photos ?? [])]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((photo) => ({
          id: photo.id,
          url: photo.cloudinaryUrl,
          width: photo.width,
          height: photo.height,
          order: photo.displayOrder,
        })),
      seller: {
        sellerType: listing.seller?.sellerProfile?.sellerType ?? null,
        isVerified: listing.seller?.sellerProfile?.isVerified ?? false,
      },
      area: {
        id: listing.area?.id ?? null,
        nameEn: listing.area?.nameEn ?? null,
      },
      daysListed: this.calculateDaysListed(
        listing.approvedAt ?? listing.submittedAt ?? new Date(),
      ),
    };
  }

  async trackContact(id: string, method: ContactMethod, buyerId?: string) {
    await this.ensureActiveListing(id);

    await this.listingRepository.increment({ id }, 'contactCount', 1);
    await this.inquiryRepository.save(
      this.inquiryRepository.create({
        listingId: id,
        buyerId: buyerId ?? null,
        contactMethod: method,
      }),
    );

    return {
      success: true,
      method,
    };
  }

  async getContactRedirectUrl(id: string, method: ContactMethod) {
    const listing = await this.listingRepository.findOne({
      where: { id, status: 'active' as never },
      relations: {
        seller: true,
      },
    });

    if (!listing?.seller?.phoneNumber) {
      throw new NotFoundException('Listing contact is unavailable');
    }

    const encodedText = encodeURIComponent(
      `Hi, I'm interested in your Makaan listing ${listing.id}.`,
    );

    if (method === ContactMethod.WHATSAPP) {
      return `https://wa.me/${listing.seller.phoneNumber.replace(/\D/g, '')}?text=${encodedText}`;
    }

    return `tel:${listing.seller.phoneNumber.replace(/\s+/g, '')}`;
  }

  private applyFilters(
    qb: SelectQueryBuilder<Listing>,
    params: SearchListingsParams,
  ): void {
    if (params.bbox) {
      const [minLng, minLat, maxLng, maxLat] = params.bbox.split(',').map(Number);
      if ([minLng, minLat, maxLng, maxLat].every((value) => !Number.isNaN(value))) {
        qb.andWhere(
          'ST_Intersects(listing.location::geometry, ST_MakeEnvelope(:minLng, :minLat, :maxLng, :maxLat, 4326))',
          { minLng, minLat, maxLng, maxLat },
        );
      }
    }

    if (params.areaId) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM cairo_areas area_filter WHERE area_filter.id = :areaId AND ST_Intersects(listing.location::geometry, area_filter.boundary::geometry))',
        { areaId: params.areaId },
      );
    }

    if (params.purpose) {
      qb.andWhere('listing.purpose = :purpose', { purpose: params.purpose });
    }

    if (params.propertyType) {
      qb.andWhere('listing.property_type = :propertyType', {
        propertyType: params.propertyType,
      });
    }

    if (typeof params.minPrice === 'number') {
      qb.andWhere('listing.price_egp >= :minPrice', { minPrice: params.minPrice });
    }

    if (typeof params.maxPrice === 'number') {
      qb.andWhere('listing.price_egp <= :maxPrice', { maxPrice: params.maxPrice });
    }

    if (typeof params.bedrooms === 'number') {
      qb.andWhere('listing.bedrooms >= :bedrooms', { bedrooms: params.bedrooms });
    }

    if (typeof params.bathrooms === 'number') {
      qb.andWhere('listing.bathrooms >= :bathrooms', { bathrooms: params.bathrooms });
    }

    if (params.sellerType) {
      qb.andWhere('seller_profile.seller_type = :sellerType', {
        sellerType: params.sellerType,
      });
    }
  }

  private mapSearchRow(row: ListingRow) {
    return {
      id: row.listing_id,
      purpose: row.listing_purpose,
      propertyType: row.listing_property_type,
      sizeSqm: Number(row.listing_size_sqm),
      bedrooms: row.listing_bedrooms,
      bathrooms: row.listing_bathrooms,
      finishingLevel: row.listing_finishing_level,
      priceEgp: Number(row.listing_price_egp),
      location: {
        lat: Number(row.lat),
        lng: Number(row.lng),
        areaName: row.area_name_en,
      },
      status: row.listing_status,
      photos: row.photo_url ? [row.photo_url] : [],
      seller: {
        sellerType: row.seller_type,
        isVerified: Boolean(row.seller_verified),
      },
      stats: {
        views: row.listing_view_count,
        saves: row.listing_save_count,
        contacts: row.listing_contact_count,
        daysListed: this.calculateDaysListed(
          row.listing_approved_at ?? row.listing_submitted_at ?? row.listing_created_at,
        ),
      },
      submittedAt: row.listing_submitted_at,
      approvedAt: row.listing_approved_at,
      rejectionReason: row.listing_rejection_reason,
    };
  }

  private calculateDaysListed(dateValue?: string | Date | null): number {
    if (!dateValue) {
      return 0;
    }

    const createdAt = new Date(dateValue);
    const diff = Date.now() - createdAt.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  private async ensureActiveListing(id: string): Promise<void> {
    const listing = await this.listingRepository.findOne({
      where: { id, status: 'active' as never },
      select: {
        id: true,
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
  }
}
