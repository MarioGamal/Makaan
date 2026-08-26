const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export type SellerSessionUser = {
  id: string;
  role: 'seller';
  participation: 'verified_owner' | 'owner_not_verified' | 'declared_agent';
  createdAt?: string;
  /** Transitional display fields retained for existing seller screens. */
  sellerType?: 'owner' | 'agent';
  isVerified?: boolean;
};

export type SessionStatus =
  'loading' | 'authenticated' | 'anonymous' | 'expired' | 'error';
export class SessionError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const buildUrl = (path: string) =>
  new URL(path, API_URL.endsWith('/') ? API_URL : `${API_URL}/`).toString();

async function errorFor(response: Response, fallback: string): Promise<never> {
  let payload: { code?: string; message?: string } | undefined;
  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    /* use fallback */
  }
  throw new SessionError(
    payload?.code ??
      (response.status === 401 ? 'SESSION_EXPIRED' : 'REQUEST_FAILED'),
    payload?.message ?? fallback,
  );
}

export async function sellerRequest(
  path: string,
  init: RequestInit = {},
  csrfToken?: string,
) {
  const headers = new Headers(init.headers);
  const isFormData =
    typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (init.body && !isFormData && !headers.has('Content-Type'))
    headers.set('Content-Type', 'application/json');
  if (csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(init.method ?? 'GET'))
    headers.set('X-CSRF-Token', csrfToken);
  const response = await fetch(buildUrl(path), {
    ...init,
    credentials: 'include',
    headers,
  });
  if (!response.ok) await errorFor(response, 'Unable to complete this request');
  return response;
}

export async function requestOtp(phone: string, locale: 'ar' | 'en' = 'ar') {
  const response = await sellerRequest('auth/otp/requests', {
    method: 'POST',
    body: JSON.stringify({ phone, locale }),
  });
  return response.json() as Promise<{ accepted: true }>;
}

export async function verifyOtp(phone: string, code: string) {
  const response = await sellerRequest('auth/otp/verifications', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
  const { seller } = (await response.json()) as { seller: SellerSessionUser };
  const csrfToken = await getSellerCsrf();
  return { user: seller, csrfToken };
}

export async function getSellerSession() {
  const response = await sellerRequest('auth/session');
  const { seller, expiresAt } = (await response.json()) as {
    seller: SellerSessionUser;
    expiresAt: string;
  };
  const csrfToken = await getSellerCsrf();
  return { user: seller, csrfToken, expiresAt };
}

async function getSellerCsrf() {
  const response = await sellerRequest('auth/csrf');
  return ((await response.json()) as { csrfToken: string }).csrfToken;
}

export async function logout(csrfToken?: string) {
  await sellerRequest('auth/session', { method: 'DELETE' }, csrfToken);
}

/** Explicit seller self-declaration. The backend applies additional review to agents. */
export async function declareParticipation(
  participation: 'owner' | 'agent',
  csrfToken: string,
) {
  const response = await sellerRequest(
    'auth/participation',
    { method: 'PUT', body: JSON.stringify({ participation }) },
    csrfToken,
  );
  return (await response.json()) as {
    seller: SellerSessionUser;
  };
}
