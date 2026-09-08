import type {
  Locale,
  PublicArea,
  PublicListingDetail,
  PublicListingSearchResponse,
  PublicSort,
} from '@makaan/shared/types/marketplace';
import { sellerRequest } from './auth.service';

export type ListingSearchParams = {
  locale?: Locale;
  bbox?: string;
  areaId?: string[];
  purpose?: 'sale' | 'long_term_rent';
  propertyType?: string[];
  priceMin?: number;
  priceMax?: number;
  sizeMin?: number;
  sizeMax?: number;
  bedroomsMin?: number;
  bedroomsMax?: number;
  participation?: 'verified_owner' | 'owner_not_verified' | 'declared_agent';
  sort?: PublicSort;
  page?: number;
  pageSize?: number;
};

export type SellerManagedListing = {
  id: string;
  title: string;
  titleAr?: string;
  titleEn?: string;
  purpose: 'sale' | 'rent' | 'long_term_rent';
  propertyType: string;
  sizeSqm: number;
  bedrooms: number;
  bathrooms: number;
  finishingLevel: string;
  priceEgp: number;
  description?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  location: {
    lat: number;
    lng: number;
  };
  area: {
    id?: string | null;
    nameEn?: string | null;
    nameAr?: string | null;
  };
  status: string;
  lockVersion: number;
  participation: 'verified_owner' | 'owner_not_verified' | 'declared_agent';
  publicLocationMode?: 'approximate' | 'area_only';
  rejectionReason?: string | null;
  moderatorNote?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  thumbnailUrl?: string | null;
  photos: Array<{
    id: string;
    url: string;
    width: number;
    height: number;
    order: number;
  }>;
  metrics: {
    viewCount: number;
    saveCount: number;
    contactCount: number;
    daysListed: number;
  };
};

export type SellerListingsResponse = {
  items: SellerManagedListing[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const buildUrl = (
  path: string,
  params?: Record<string, string | number | string[] | undefined>,
) => {
  const url = new URL(path, API_URL.endsWith('/') ? API_URL : `${API_URL}/`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        if (Array.isArray(value))
          value.forEach((item) => url.searchParams.append(key, item));
        else url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
};

export async function searchListings(params: ListingSearchParams) {
  const response = await fetch(buildUrl('listings', params), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Unable to fetch listings');
  }

  return (await response.json()) as PublicListingSearchResponse;
}

export async function getListingById(id: string, locale: Locale = 'ar') {
  const response = await fetch(buildUrl(`listings/${id}`, { locale }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Unable to fetch listing');
  }

  return (await response.json()) as PublicListingDetail;
}

export async function searchAreas(query: string, locale: Locale) {
  const response = await fetch(buildUrl('areas', { q: query, locale }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Unable to search areas');
  }

  return ((await response.json()) as { items: PublicArea[] }).items;
}

export async function createListing(
  data: Record<string, unknown>,
  csrfToken: string,
) {
  const response = await sellerRequest(
    'seller/listings',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
    csrfToken,
  );

  return (await response.json()) as {
    id: string;
    status: string;
    lockVersion: number;
  };
}

export async function updateListing(
  id: string,
  data: Record<string, unknown>,
  lockVersion: number,
  csrfToken: string,
) {
  const response = await sellerRequest(
    `seller/listings/${id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'If-Match': String(lockVersion),
      },
      body: JSON.stringify(data),
    },
    csrfToken,
  );

  return (await response.json()) as SellerManagedListing;
}

export async function submitListing(
  id: string,
  lockVersion: number,
  csrfToken: string,
) {
  const response = await sellerRequest(
    `seller/listings/${id}/submit`,
    {
      method: 'POST',
      headers: { 'If-Match': String(lockVersion) },
    },
    csrfToken,
  );
  return (await response.json()) as SellerManagedListing;
}

export async function changeSellerListingStatus(
  id: string,
  action: 'withdraw' | 'mark-sold',
  lockVersion: number,
  csrfToken: string,
) {
  const response = await sellerRequest(
    `seller/listings/${id}/${action}`,
    {
      method: 'POST',
      headers: { 'If-Match': String(lockVersion) },
    },
    csrfToken,
  );
  return (await response.json()) as SellerManagedListing;
}

export async function uploadPhotos(
  listingId: string,
  files: File[],
  csrfToken: string,
) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const response = await sellerRequest(
    `seller/listings/${listingId}/media`,
    {
      method: 'POST',
      body: formData,
    },
    csrfToken,
  );

  return response.json();
}

export async function deleteListingPhoto(
  listingId: string,
  photoId: string,
  csrfToken: string,
) {
  const response = await sellerRequest(
    `seller/listings/${listingId}/media/${photoId}`,
    {
      method: 'DELETE',
    },
    csrfToken,
  );

  return response.json();
}

export async function getSellerListings(
  params: { page?: number; status?: string } = {},
) {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  );
  const response = await sellerRequest(
    `seller/listings${query.toString() ? `?${query.toString()}` : ''}`,
  );
  return (await response.json()) as SellerListingsResponse;
}

export async function getSellerListing(id: string) {
  const response = await sellerRequest(`seller/listings/${id}`);
  return (await response.json()) as SellerManagedListing;
}
