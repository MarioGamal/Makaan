import type {
  Locale,
  ParticipationLabel,
  PublicListingCard,
  PublicListingDetail,
  PublicListingSearchResponse,
} from '@makaan/shared/types/marketplace';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';

import { PublicListingQueryDto } from '../api/listings/dto/public-listing-query.dto';
import { Listing } from '../models/listing.entity';

import { PublicLocationService } from './public-location.service';

type PublicRow = {
  id: string;
  purpose: 'sale' | 'long_term_rent';
  property_type: string;
  price_egp: string;
  size_sqm: string;
  bedrooms: number;
  bathrooms: number;
  finishing_level: string;
  floor_number: number | null;
  title_ar: string;
  title_en: string | null;
  description_ar: string;
  description_en: string | null;
  amenities: unknown;
  area_id: string;
  area_name_ar: string;
  area_name_en: string;
  participation: ParticipationLabel;
  public_location_mode: 'approximate' | 'area_only';
  public_latitude: string | null;
  public_longitude: string | null;
  public_radius_meters: string | null;
  cover_url: string | null;
  cover_width: number | null;
  cover_height: number | null;
  approved_at: Date | string;
  availability_confirmed_at: Date | string;
};

@Injectable()
export class PublicListingService {
  constructor(
    @InjectRepository(Listing)
    private readonly listings: Repository<Listing>,
    private readonly publicLocationService: PublicLocationService,
  ) {}

  async search(
    query: PublicListingQueryDto,
  ): Promise<PublicListingSearchResponse> {
    const builder = this.baseQuery(query.locale);
    this.applyFilters(builder, query);
    const total = await builder.clone().getCount();
    this.applySort(builder, query.sort);

    const rows = (await builder
      .offset((query.page - 1) * query.pageSize)
      .limit(query.pageSize)
      .getRawMany()) as PublicRow[];

    return {
      items: rows.map((row) => this.toCard(row)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      hasMore: query.page * query.pageSize < total,
      applied: this.appliedFilters(query),
      sort: query.sort,
    };
  }

  async detail(id: string, locale: Locale): Promise<PublicListingDetail> {
    const row = (await this.baseQuery(locale)
      .andWhere('listing.id = :id', { id })
      .getRawOne()) as PublicRow | undefined;

    if (!row) throw new NotFoundException('Listing not found');

    const card = this.toCard(row);
    const description =
      locale === 'en' && row.description_en
        ? row.description_en
        : row.description_ar;
    const descriptionSourceLocale: Locale =
      locale === 'en' && row.description_en ? 'en' : 'ar';

    const mediaRows = (await this.listings.manager.query<
      Array<{
        url: string;
        width: number;
        height: number;
        display_order: number;
      }>
    >(
      `SELECT approved_derivative_reference AS url, width, height, display_order
         FROM listing_media
        WHERE listing_id = $1 AND revision_id = (
          SELECT approved_revision_id FROM listings WHERE id = $1
        ) AND scan_state = 'clean' AND deleted_at IS NULL
        ORDER BY display_order ASC`,
      [id],
    )) as Array<{
      url: string;
      width: number;
      height: number;
      display_order: number;
    }>;

    return {
      ...card,
      description,
      descriptionSourceLocale,
      finishingLevel: row.finishing_level,
      floorNumber: row.floor_number,
      amenities: Array.isArray(row.amenities)
        ? row.amenities.filter(
            (value): value is string => typeof value === 'string',
          )
        : [],
      media: mediaRows.map((media, index) => ({
        url: media.url,
        width: media.width,
        height: media.height,
        alt: `${card.title} ${index + 1}`,
      })),
      related: [],
    };
  }

  async cardsByIds(
    ids: string[],
    locale: Locale,
  ): Promise<PublicListingCard[]> {
    if (ids.length === 0) return [];
    const rows = (await this.baseQuery(locale)
      .andWhere('listing.id IN (:...ids)', { ids })
      .getRawMany()) as PublicRow[];
    const byId = new Map(rows.map((row) => [row.id, this.toCard(row)]));
    return ids.flatMap((id) => {
      const listing = byId.get(id);
      return listing ? [listing] : [];
    });
  }

  private baseQuery(locale: Locale): SelectQueryBuilder<Listing> {
    const localizedTitle =
      locale === 'en'
        ? `COALESCE(NULLIF(listing.title_en, ''), listing.title_ar)`
        : 'listing.title_ar';
    const titleSource =
      locale === 'en'
        ? `CASE WHEN NULLIF(listing.title_en, '') IS NULL THEN 'ar' ELSE 'en' END`
        : `'ar'`;

    return this.listings
      .createQueryBuilder('listing')
      .innerJoin(
        'cairo_areas',
        'area',
        'area.id = listing.area_id AND area.is_active = true',
      )
      .innerJoin(
        'seller_profiles',
        'profile',
        'profile.user_id = listing.seller_id',
      )
      .innerJoin('users', 'seller', 'seller.id = listing.seller_id')
      .leftJoin(
        'listing_media',
        'cover',
        `cover.listing_id = listing.id
          AND cover.revision_id = listing.approved_revision_id
          AND cover.display_order = 0 AND cover.scan_state = 'clean' AND cover.deleted_at IS NULL`,
      )
      .where('listing.status = :activeStatus', { activeStatus: 'active' })
      .andWhere('listing.current_revision_id = listing.approved_revision_id')
      .andWhere(
        'listing.approved_at IS NOT NULL AND listing.approved_by IS NOT NULL',
      )
      .andWhere('listing.availability_confirmed_at IS NOT NULL')
      .andWhere('listing.expires_at > NOW()')
      .andWhere('listing.approved_public_location_mode IS NOT NULL')
      .andWhere("seller.status = 'active'")
      .andWhere("profile.review_state = 'clear'")
      .select([
        'listing.id AS id',
        'listing.purpose AS purpose',
        'listing.property_type AS property_type',
        'listing.price_egp AS price_egp',
        'listing.size_sqm AS size_sqm',
        'listing.bedrooms AS bedrooms',
        'listing.bathrooms AS bathrooms',
        'listing.finishing_level AS finishing_level',
        'listing.floor_number AS floor_number',
        `${localizedTitle} AS title_ar`,
        `${titleSource} AS title_en`,
        'listing.description_ar AS description_ar',
        'listing.description_en AS description_en',
        'listing.amenities AS amenities',
        'area.id AS area_id',
        'area.name_ar AS area_name_ar',
        'area.name_en AS area_name_en',
        `CASE
          WHEN COALESCE(profile.moderator_participation_override::text, profile.declared_participation::text) = 'agent'
            THEN 'declared_agent'
          WHEN profile.verification_state = 'verified' THEN 'verified_owner'
          ELSE 'owner_not_verified'
        END AS participation`,
        'listing.approved_public_location_mode AS public_location_mode',
        'ST_Y(listing.public_location::geometry) AS public_latitude',
        'ST_X(listing.public_location::geometry) AS public_longitude',
        'listing.public_location_distance_m AS public_radius_meters',
        'cover.approved_derivative_reference AS cover_url',
        'cover.width AS cover_width',
        'cover.height AS cover_height',
        'listing.approved_at AS approved_at',
        'listing.availability_confirmed_at AS availability_confirmed_at',
      ]);
  }

  private applyFilters(
    builder: SelectQueryBuilder<Listing>,
    query: PublicListingQueryDto,
  ): void {
    if (query.purpose)
      builder.andWhere('listing.purpose = :purpose', {
        purpose: query.purpose,
      });
    if (query.areaId?.length)
      builder.andWhere('listing.area_id IN (:...areaIds)', {
        areaIds: query.areaId,
      });
    if (query.propertyType?.length)
      builder.andWhere('listing.property_type IN (:...propertyTypes)', {
        propertyTypes: query.propertyType,
      });
    if (query.priceMin !== undefined)
      builder.andWhere('listing.price_egp >= :priceMin', {
        priceMin: query.priceMin,
      });
    if (query.priceMax !== undefined)
      builder.andWhere('listing.price_egp <= :priceMax', {
        priceMax: query.priceMax,
      });
    if (query.sizeMin !== undefined)
      builder.andWhere('listing.size_sqm >= :sizeMin', {
        sizeMin: query.sizeMin,
      });
    if (query.sizeMax !== undefined)
      builder.andWhere('listing.size_sqm <= :sizeMax', {
        sizeMax: query.sizeMax,
      });
    if (query.bedroomsMin !== undefined)
      builder.andWhere('listing.bedrooms >= :bedroomsMin', {
        bedroomsMin: query.bedroomsMin,
      });
    if (query.participation?.length) {
      builder.andWhere(
        `CASE
          WHEN COALESCE(profile.moderator_participation_override::text, profile.declared_participation::text) = 'agent'
            THEN 'declared_agent'
          WHEN profile.verification_state = 'verified' THEN 'verified_owner'
          ELSE 'owner_not_verified'
        END IN (:...participation)`,
        { participation: query.participation },
      );
    }
    if (query.bbox) {
      const values = query.bbox.split(',').map(Number);
      if (
        values.length !== 4 ||
        values.some((value) => !Number.isFinite(value))
      ) {
        throw new BadRequestException('Invalid bbox');
      }
      const [west, south, east, north] = values;
      if (
        west >= east ||
        south >= north ||
        west < 30.7 ||
        east > 32 ||
        south < 29.7 ||
        north > 30.4
      ) {
        throw new BadRequestException('Bbox must be a valid Cairo extent');
      }
      builder.andWhere(
        new Brackets((where) => {
          where.where(
            `listing.public_location IS NOT NULL AND ST_Intersects(
              listing.public_location::geometry,
              ST_MakeEnvelope(:west, :south, :east, :north, 4326)
            )`,
            { west, south, east, north },
          );
        }),
      );
    }
  }

  private applySort(
    builder: SelectQueryBuilder<Listing>,
    sort: PublicListingQueryDto['sort'],
  ): void {
    if (sort === 'price_asc') builder.orderBy('listing.price_egp', 'ASC');
    else if (sort === 'price_desc')
      builder.orderBy('listing.price_egp', 'DESC');
    else builder.orderBy('listing.approved_at', 'DESC');
    builder.addOrderBy('listing.id', 'ASC');
  }

  private toCard(row: PublicRow): PublicListingCard {
    const titleSourceLocale: Locale = row.title_en === 'en' ? 'en' : 'ar';
    return {
      id: row.id,
      purpose: row.purpose,
      propertyType: row.property_type,
      priceEgp: Number(row.price_egp),
      sizeSqm: Number(row.size_sqm),
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      title: row.title_ar,
      titleSourceLocale,
      area: {
        id: row.area_id,
        nameAr: row.area_name_ar,
        nameEn: row.area_name_en,
      },
      participation: row.participation,
      publicLocation: this.publicLocationService.fromApprovedProjection(row),
      coverImage: row.cover_url
        ? {
            url: row.cover_url,
            width: row.cover_width ?? 1600,
            height: row.cover_height ?? 1067,
            alt: row.title_ar,
          }
        : null,
      publishedAt: new Date(row.approved_at).toISOString(),
      availabilityConfirmedAt: new Date(
        row.availability_confirmed_at,
      ).toISOString(),
      saved: false,
    };
  }

  private appliedFilters(
    query: PublicListingQueryDto,
  ): Record<string, string | string[] | number> {
    return Object.fromEntries(
      Object.entries(query).filter(
        ([, value]) => value !== undefined && value !== '',
      ),
    ) as Record<string, string | string[] | number>;
  }
}
