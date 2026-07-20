const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type AdminUser = {
  id: string;
  username: string;
  role: 'admin';
  lastLogin: string | null;
};

export type AdminQueueItem = {
  id: string;
  submittedAt: string | null;
  area: string;
  propertyType: string;
  priceEgp: number;
  sellerType: string | null;
  sellerPhone: string;
};

export type DuplicateHint = {
  listingId: string;
  confidence: number;
  reasons: string[];
};

export type AdminListingDetail = {
  id: string;
  purpose: 'sale' | 'rent';
  propertyType: string;
  sizeSqm: number;
  bedrooms: number;
  bathrooms: number;
  finishingLevel: string;
  priceEgp: number;
  description?: string | null;
  status: string;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectionReason?: string | null;
  location: {
    lat: number;
    lng: number;
  };
  area: {
    id: string | null;
    nameEn: string | null;
  };
  photos: Array<{ id: string; url: string; width: number; height: number; order: number }>;
  seller: {
    id: string;
    phone: string;
    sellerType: string | null;
    isVerified: boolean;
  };
  duplicateHints: DuplicateHint[];
};

const buildUrl = (path: string) =>
  new URL(path, API_URL.endsWith('/') ? API_URL : `${API_URL}/`).toString();

export const ADMIN_STORAGE_KEY = 'makaan_admin_auth';

export function getStoredAdminAuth() {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.localStorage.getItem(ADMIN_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  return JSON.parse(rawValue) as { accessToken: string; user: AdminUser };
}

function getAdminHeaders() {
  const session = getStoredAdminAuth();
  return {
    'Content-Type': 'application/json',
    Authorization: session ? `Bearer ${session.accessToken}` : '',
  };
}

async function parseError(response: Response, fallbackMessage: string) {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message ?? fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export async function adminLogin(credentials: {
  username: string;
  password: string;
  twoFactorCode: string;
}) {
  const response = await fetch(buildUrl('admin/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, 'Unable to sign in as admin'));
  }

  return (await response.json()) as {
    success: true;
    accessToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
    user: AdminUser;
  };
}

export async function logoutAdmin() {
  const session = getStoredAdminAuth();
  if (!session) {
    return;
  }

  await fetch(buildUrl('auth/logout'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  });
}

export async function getPendingListings() {
  const response = await fetch(buildUrl('admin/listings'), {
    headers: getAdminHeaders(),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, 'Unable to fetch moderation queue'));
  }

  return (await response.json()) as {
    success: true;
    listings: AdminQueueItem[];
  };
}

export async function getAdminListingById(id: string) {
  const response = await fetch(buildUrl(`admin/listings/${id}`), {
    headers: getAdminHeaders(),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, 'Unable to fetch listing review'));
  }

  return (await response.json()) as {
    success: true;
    listing: AdminListingDetail;
  };
}

export async function approveAdminListing(id: string) {
  const response = await fetch(buildUrl(`admin/listings/${id}/approve`), {
    method: 'POST',
    headers: getAdminHeaders(),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, 'Unable to approve listing'));
  }

  return response.json();
}

export async function rejectAdminListing(
  id: string,
  payload: { reason: string; notes?: string },
) {
  const response = await fetch(buildUrl(`admin/listings/${id}/reject`), {
    method: 'POST',
    headers: getAdminHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response, 'Unable to reject listing'));
  }

  return response.json();
}
