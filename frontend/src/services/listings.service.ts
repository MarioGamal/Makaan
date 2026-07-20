export type ListingCard = {
  id: string;
  purpose: 'sale' | 'rent';
  propertyType: string;
  sizeSqm: number;
  bedrooms: number;
  bathrooms: number;
  finishingLevel: string;
  priceEgp: number;
  location: {
    lat: number;
    lng: number;
    areaName?: string | null;
  };
  photos: string[];
  seller: {
    sellerType?: string | null;
    isVerified: boolean;
  };
  stats: {
    views: number;
    saves: number;
    contacts: number;
    daysListed: number;
  };
};

export type ListingDetail = {
  id: string;
  purpose: 'sale' | 'rent';
  propertyType: string;
  sizeSqm: number;
  bedrooms: number;
  bathrooms: number;
  finishingLevel: string;
  priceEgp: number;
  location: {
    lat: number;
    lng: number;
  };
  status: string;
  viewCount: number;
  saveCount: number;
  contactCount: number;
  submittedAt?: string | null;
  approvedAt?: string | null;
  photos: Array<{ id: string; url: string; width: number; height: number; order: number }>;
  seller: {
    sellerType?: string | null;
    isVerified: boolean;
  };
  area: {
    id?: string | null;
    nameEn?: string | null;
  };
  daysListed: number;
};

export type ListingSearchParams = {
  bbox?: string;
  area_id?: string;
  purpose?: 'sale' | 'rent';
  property_type?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  seller_type?: 'owner' | 'agent';
  page?: number;
  limit?: number;
};

export type SellerManagedListing = {
  id: string;
  title: string;
  purpose: 'sale' | 'rent';
  propertyType: string;
  sizeSqm: number;
  bedrooms: number;
  bathrooms: number;
  finishingLevel: string;
  priceEgp: number;
  description?: string | null;
  location: {
    lat: number;
    lng: number;
  };
  area: {
    id?: string | null;
    nameEn?: string | null;
  };
  status: string;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  thumbnailUrl?: string | null;
  photos: Array<{ id: string; url: string; width: number; height: number; order: number }>;
  metrics: {
    viewCount: number;
    saveCount: number;
    contactCount: number;
    daysListed: number;
  };
};

export type SellerListingsResponse = {
  success: true;
  seller: {
    sellerType: 'owner' | 'agent';
    isVerified: boolean;
  };
  listings: SellerManagedListing[];
};

export type SellerNotification = {
  id: string;
  listingId: string;
  rejectionReason: string;
  rejectedAt: string;
  listingTitle: string;
  notes?: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const buildUrl = (path: string, params?: Record<string, string | number | undefined>) => {
  const url = new URL(path, API_URL.endsWith('/') ? API_URL : `${API_URL}/`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
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

  return (await response.json()) as {
    listings: ListingCard[];
    total: number;
    bbox: string | null;
  };
}

export async function getListingById(id: string) {
  const response = await fetch(buildUrl(`listings/${id}`), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Unable to fetch listing');
  }

  return (await response.json()) as ListingDetail;
}

export async function searchAreas(query: string) {
  const response = await fetch(buildUrl('areas/search', { q: query }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Unable to search areas');
  }

  return (await response.json()) as Array<{
    id: string;
    name_en: string;
    name_ar: string;
    bbox: [number, number, number, number];
  }>;
}

export async function trackContact(id: string, method: 'whatsapp' | 'call') {
  const response = await fetch(buildUrl(`listings/${id}/contact`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method }),
  });

  if (!response.ok) {
    throw new Error('Unable to track contact');
  }

  return response.json();
}

export const getContactRedirectUrl = (
  id: string,
  method: 'whatsapp' | 'call',
) => buildUrl(`listings/${id}/contact-link`, { method });

export async function createListing(data: Record<string, unknown>) {
  const response = await fetch(buildUrl('seller/listings'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await response.json();
  }

  return response.json();
}

export async function updateListing(id: string, data: Record<string, unknown>) {
  const response = await fetch(buildUrl(`seller/listings/${id}`), {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await response.json();
  }

  return response.json();
}

export async function uploadPhotos(listingId: string, files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const response = await fetch(buildUrl(`seller/listings/${listingId}/photos`), {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    throw await response.json();
  }

  return response.json();
}

export async function deleteListingPhoto(listingId: string, photoId: string) {
  const response = await fetch(buildUrl(`seller/listings/${listingId}/photos/${photoId}`), {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw await response.json();
  }

  return response.json();
}

export async function getSellerListings() {
  const response = await fetch(buildUrl('seller/listings'), {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw await response.json();
  }

  return (await response.json()) as SellerListingsResponse;
}

export async function getSellerListingMetrics(id: string) {
  const response = await fetch(buildUrl(`seller/listings/${id}/metrics`), {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw await response.json();
  }

  return (await response.json()) as {
    success: true;
    metrics: {
      listingId: string;
      viewCount: number;
      saveCount: number;
      contactCount: number;
      daysListed: number;
      viewsLast7Days: number;
    };
  };
}

export async function updateSellerListingStatus(
  id: string,
  status: 'sold' | 'inactive',
) {
  const response = await fetch(buildUrl(`seller/listings/${id}/status`), {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw await response.json();
  }

  return response.json();
}

export async function getSellerNotifications() {
  const response = await fetch(buildUrl('seller/notifications'), {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw await response.json();
  }

  return (await response.json()) as {
    success: true;
    notifications: SellerNotification[];
  };
}
