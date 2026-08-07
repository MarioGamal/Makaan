export type Locale = 'ar' | 'en';
export type ListingPurpose = 'sale' | 'long_term_rent';
export type ParticipationLabel = 'verified_owner' | 'owner_not_verified' | 'declared_agent';
export type PublicSort = 'newest' | 'price_asc' | 'price_desc';

export interface ApiError {
  code:
    | 'VALIDATION_ERROR'
    | 'UNAUTHENTICATED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'CONFLICT'
    | 'RATE_LIMITED'
    | 'SESSION_EXPIRED'
    | 'CSRF_INVALID'
    | 'MEDIA_INVALID'
    | 'INTERNAL_ERROR';
  message: string;
  correlationId: string;
  fields?: Record<string, string>;
  retryAfterSeconds?: number;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface PublicArea {
  id: string;
  nameAr: string;
  nameEn: string;
}

export type PublicLocation =
  | {
      mode: 'approximate';
      latitude: number;
      longitude: number;
      radiusMeters: number;
    }
  | { mode: 'area_only' };

export interface PublicListingImage {
  url: string;
  width: number;
  height: number;
  alt: string;
}

export interface PublicListingCard {
  id: string;
  purpose: ListingPurpose;
  propertyType: string;
  priceEgp: number;
  sizeSqm: number;
  bedrooms: number;
  bathrooms: number;
  title: string;
  titleSourceLocale: Locale;
  area: PublicArea;
  participation: ParticipationLabel;
  publicLocation: PublicLocation;
  coverImage: PublicListingImage | null;
  publishedAt: string;
  availabilityConfirmedAt: string;
  saved: boolean;
}

export interface PublicListingSearchResponse extends Page<PublicListingCard> {
  applied: Record<string, string | string[] | number>;
  sort: PublicSort;
}

export interface PublicListingDetail extends PublicListingCard {
  description: string;
  descriptionSourceLocale: Locale;
  finishingLevel: string;
  floorNumber: number | null;
  amenities: string[];
  media: PublicListingImage[];
  related: PublicListingCard[];
}

export type ListingLifecycleStatus =
  'draft' | 'pending_review' | 'active' | 'rejected' | 'sold' | 'inactive' | 'expired';

export interface SellerMedia {
  id: string;
  previewUrl: string;
  width: number;
  height: number;
  displayOrder: number;
  state: 'pending' | 'clean' | 'failed';
}
