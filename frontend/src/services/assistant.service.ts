import type {
  AssistantFilters,
  AssistantMessageResponse,
} from '@makaan/shared/types/assistant';
import type { ApiError, Locale } from '@makaan/shared/types/marketplace';

import {
  getAnonymousCsrfToken,
  MarketplaceRequestError,
} from './saved.service';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const buildUrl = (path: string) =>
  new URL(path, API_URL.endsWith('/') ? API_URL : `${API_URL}/`).toString();

export async function askAssistant(
  message: string,
  locale: Locale,
  context?: AssistantFilters,
): Promise<AssistantMessageResponse> {
  const csrfToken = await getAnonymousCsrfToken();
  const response = await fetch(buildUrl('assistant/messages'), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({ message, locale, ...(context ? { context } : {}) }),
  });

  if (!response.ok) {
    let error: ApiError | undefined;
    try {
      error = (await response.json()) as ApiError;
    } catch {
      // A proxy may return a non-JSON body; the status still drives the message.
    }
    throw new MarketplaceRequestError(
      error?.message ?? 'Unable to reach the assistant.',
      response.status === 429 ? 'RATE_LIMITED' : error?.code,
    );
  }

  return (await response.json()) as AssistantMessageResponse;
}
