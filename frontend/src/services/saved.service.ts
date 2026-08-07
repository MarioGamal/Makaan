import type { ApiError, PublicListingCard } from '@makaan/shared/types/marketplace';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

let anonymousCsrfToken: string | null = null;
let anonymousSessionPromise: Promise<string> | null = null;

export class MarketplaceRequestError extends Error {
  constructor(
    message: string,
    public readonly code?: ApiError['code'],
  ) {
    super(message);
    this.name = 'MarketplaceRequestError';
  }
}

const buildUrl = (path: string) =>
  new URL(path, API_URL.endsWith('/') ? API_URL : `${API_URL}/`).toString();

async function request(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  const response = await fetch(buildUrl(path), {
    ...init,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    let error: ApiError | undefined;
    try {
      error = (await response.json()) as ApiError;
    } catch {
      // Preserve a useful fallback when a proxy returns a non-JSON response.
    }
    throw new MarketplaceRequestError(
      error?.message ?? 'Unable to complete this request.',
      error?.code,
    );
  }
  return response;
}

export async function getAnonymousCsrfToken() {
  if (anonymousCsrfToken) return anonymousCsrfToken;
  if (!anonymousSessionPromise) {
    anonymousSessionPromise = request('anonymous/session', { method: 'POST' })
      .then(async (response) => {
        const payload = (await response.json()) as { csrfToken: string };
        anonymousCsrfToken = payload.csrfToken;
        return anonymousCsrfToken;
      })
      .finally(() => {
        anonymousSessionPromise = null;
      });
  }
  return anonymousSessionPromise;
}

export async function fetchSavedListings() {
  await getAnonymousCsrfToken();
  const response = await request('saved-listings');
  return ((await response.json()) as { items: PublicListingCard[] }).items;
}

export async function setListingSaved(listingId: string, saved: boolean) {
  const csrfToken = await getAnonymousCsrfToken();
  const response = await request(`saved-listings/${listingId}`, {
    method: saved ? 'PUT' : 'DELETE',
    headers: { 'X-CSRF-Token': csrfToken },
  });
  return (await response.json()) as { saved: boolean };
}

export async function createContactIntent(
  listingId: string,
  channel: 'phone' | 'whatsapp',
) {
  const csrfToken = await getAnonymousCsrfToken();
  const response = await request(`listings/${listingId}/contact-intents`, {
    method: 'POST',
    headers: { 'X-CSRF-Token': csrfToken },
    body: JSON.stringify({ channel }),
  });
  return (await response.json()) as { token: string; expiresAt: string };
}

export function contactIntentResolverUrl(token: string) {
  return buildUrl(`contact-intents/${encodeURIComponent(token)}/resolve`);
}
