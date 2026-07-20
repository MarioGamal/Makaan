const STORAGE_KEY = 'makaan_saved_listings';
const SAVED_EVENT = 'makaan:saved-listings-changed';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export type SavedListingCard = {
  id: string;
  title: string;
  price: number;
  thumbnail_url: string | null;
  area_name: string;
  status: string;
};

function readIds(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as string[];
    return Array.from(new Set(parsed.filter(Boolean)));
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(SAVED_EVENT));
}

export function getSavedIds() {
  return readIds();
}

export function saveListingId(id: string) {
  const ids = readIds();
  if (ids.includes(id)) {
    return ids;
  }

  const nextIds = [id, ...ids];
  writeIds(nextIds);
  return nextIds;
}

export function unsaveListingId(id: string) {
  const nextIds = readIds().filter((savedId) => savedId !== id);
  writeIds(nextIds);
  return nextIds;
}

export function isSaved(id: string) {
  return readIds().includes(id);
}

export function subscribeToSavedListings(listener: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(SAVED_EVENT, listener);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(SAVED_EVENT, listener);
  };
}

const buildUrl = (path: string, params?: Record<string, string>) => {
  const url = new URL(path, API_URL.endsWith('/') ? API_URL : `${API_URL}/`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      }
    });
  }
  return url.toString();
};

export async function fetchSavedListings(ids: string[]) {
  if (ids.length === 0) {
    return [] as SavedListingCard[];
  }

  const response = await fetch(
    buildUrl('buyer/saved', {
      listingIds: ids.join(','),
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  );

  if (!response.ok) {
    throw new Error('Unable to fetch saved listings');
  }

  const payload = (await response.json()) as {
    success: true;
    listings: SavedListingCard[];
  };

  return payload.listings;
}
