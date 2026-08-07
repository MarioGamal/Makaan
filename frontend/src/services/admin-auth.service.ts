import { SessionError, type SessionStatus } from './auth.service';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export type Participation =
  'verified_owner' | 'owner_not_verified' | 'declared_agent';
export type RejectionReason =
  | 'incomplete_data'
  | 'inaccurate_location'
  | 'media_issue'
  | 'participation_unconfirmed'
  | 'duplicate'
  | 'spam_scam';

export type AdminUser = {
  id: string;
  displayName: string;
  role: 'admin';
  username?: string;
  lastLogin?: string | null;
};

export type AdminQueueItem = {
  id: string;
  submittedAt: string | null;
  area: { id?: string | null; nameAr?: string | null; nameEn?: string | null };
  propertyType: string;
  purpose: 'sale' | 'long_term_rent';
  priceEgp: number;
  participation: Participation;
  sellerLabel?: string | null;
  lockVersion: number;
};

export type DuplicateHint = {
  listingId: string;
  confidence: number;
  reasons: string[];
};

export type PrivateLocation = {
  latitude: number;
  longitude: number;
  addressHint?: string | null;
};
export type ProposedPublicLocation =
  | {
      mode: 'approximate';
      latitude: number;
      longitude: number;
      radiusMeters: number;
    }
  | { mode: 'area_only' };

export type AdminListingDetail = {
  id: string;
  purpose: 'sale' | 'long_term_rent';
  propertyType: string;
  titleAr?: string | null;
  titleEn?: string | null;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  sizeSqm: number;
  bedrooms: number;
  bathrooms: number;
  finishingLevel?: string | null;
  floor?: string | number | null;
  priceEgp: number;
  status: string;
  submittedAt: string | null;
  lockVersion: number;
  area: { id: string | null; nameAr?: string | null; nameEn: string | null };
  exactLocation: PrivateLocation;
  proposedPublicLocation: ProposedPublicLocation;
  media: Array<{
    id: string;
    previewUrl: string;
    width: number;
    height: number;
    displayOrder: number;
    state?: string;
  }>;
  seller: {
    id: string;
    phone: string;
    participation: Participation;
    isVerified: boolean;
  };
  declaration?: {
    participation?: Participation;
    submittedAt?: string | null;
    publicLocationConsent?: string | null;
  };
  revision?: {
    id?: string;
    submittedAt?: string | null;
    version?: number;
    notes?: string | null;
  };
  decisions?: Array<{
    id: string;
    action: 'approved' | 'rejected' | 'unpublished';
    createdAt: string;
    reasonCode?: RejectionReason | null;
    sellerNote?: string | null;
    internalReason?: string | null;
    administratorName?: string | null;
  }>;
  duplicateHints?: DuplicateHint[];
};

const buildUrl = (path: string) =>
  new URL(path, API_URL.endsWith('/') ? API_URL : `${API_URL}/`).toString();

async function request(
  path: string,
  init: RequestInit = {},
  csrfToken?: string,
) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type'))
    headers.set('Content-Type', 'application/json');
  if (csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(init.method ?? 'GET'))
    headers.set('X-CSRF-Token', csrfToken);
  const response = await fetch(buildUrl(path), {
    ...init,
    credentials: 'include',
    headers,
  });
  if (!response.ok) {
    let payload: { code?: string; message?: string } = {};
    try {
      payload = (await response.json()) as typeof payload;
    } catch {
      /* response was not JSON */
    }
    throw new SessionError(
      payload.code ??
        (response.status === 401 ? 'SESSION_EXPIRED' : 'REQUEST_FAILED'),
      payload.message ?? 'Unable to complete this request',
    );
  }
  return response;
}

async function getAdminCsrf() {
  return ((await (await request('admin/csrf')).json()) as { csrfToken: string })
    .csrfToken;
}

export async function getAdminSession() {
  const payload = (await (await request('admin/session')).json()) as {
    administrator: AdminUser;
    expiresAt: string;
  };
  return {
    admin: payload.administrator,
    csrfToken: await getAdminCsrf(),
    expiresAt: payload.expiresAt,
  };
}
export async function adminLogin(credentials: {
  username: string;
  password: string;
  twoFactorCode: string;
}) {
  const response = await request('admin/sessions', {
    method: 'POST',
    body: JSON.stringify({
      email: credentials.username,
      password: credentials.password,
      secondFactorCode: credentials.twoFactorCode,
    }),
  });
  const payload = (await response.json()) as { administrator: AdminUser };
  return { admin: payload.administrator, csrfToken: await getAdminCsrf() };
}
export async function logoutAdmin(csrfToken?: string) {
  await request('admin/session', { method: 'DELETE' }, csrfToken);
}
export async function adminRequest(
  path: string,
  init: RequestInit = {},
  csrfToken?: string,
) {
  return request(path, init, csrfToken);
}
export type AdminSessionStatus = SessionStatus;

type AdminPage<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};
export async function getPendingListings(
  params: { page?: number; participation?: Participation } = {},
) {
  const query = new URLSearchParams({
    status: 'pending_review',
    page: String(params.page ?? 1),
    pageSize: '20',
  });
  if (params.participation) query.set('participation', params.participation);
  const payload = (await (
    await request(`admin/listings?${query.toString()}`)
  ).json()) as AdminPage<AdminQueueItem> | { listings: AdminQueueItem[] };
  return 'items' in payload
    ? payload
    : {
        items: payload.listings,
        page: 1,
        pageSize: payload.listings.length,
        total: payload.listings.length,
        hasMore: false,
      };
}
export async function getAdminListingById(id: string) {
  const payload = (await (await request(`admin/listings/${id}`)).json()) as
    AdminListingDetail | { listing: AdminListingDetail };
  return 'listing' in payload ? payload.listing : payload;
}
export async function approveAdminListing(
  id: string,
  payload: {
    lockVersion: number;
    approvedPublicLocation: ProposedPublicLocation;
    participationOutcome: Participation;
    internalReason: string;
  },
  csrfToken?: string,
) {
  return (
    await request(
      `admin/listings/${id}/approve`,
      { method: 'POST', body: JSON.stringify(payload) },
      csrfToken,
    )
  ).json();
}
export async function rejectAdminListing(
  id: string,
  payload: {
    lockVersion: number;
    reasonCode: RejectionReason;
    sellerNote?: string;
    internalReason: string;
  },
  csrfToken?: string,
) {
  return (
    await request(
      `admin/listings/${id}/reject`,
      { method: 'POST', body: JSON.stringify(payload) },
      csrfToken,
    )
  ).json();
}
export async function unpublishAdminListing(
  id: string,
  payload: {
    lockVersion: number;
    reasonCode: RejectionReason;
    internalReason: string;
  },
  csrfToken?: string,
) {
  return (
    await request(
      `admin/listings/${id}/unpublish`,
      { method: 'POST', body: JSON.stringify(payload) },
      csrfToken,
    )
  ).json();
}
