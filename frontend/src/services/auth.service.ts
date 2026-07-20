const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type AuthUser = {
  id: string;
  phone: string;
  role: 'seller';
  sellerType: 'owner' | 'agent';
  createdAt: string;
};

const buildUrl = (path: string) =>
  new URL(path, API_URL.endsWith('/') ? API_URL : `${API_URL}/`).toString();

export async function requestOtp(phone: string) {
  const response = await fetch(buildUrl('auth/otp/request'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });

  if (!response.ok) {
    throw new Error((await response.json()).message ?? 'Unable to request OTP');
  }

  return response.json();
}

export async function verifyOtp(phone: string, code: string) {
  const response = await fetch(buildUrl('auth/otp/verify'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });

  if (!response.ok) {
    throw new Error((await response.json()).message ?? 'Unable to verify OTP');
  }

  return (await response.json()) as {
    success: true;
    accessToken: string;
    tokenType: 'Bearer';
    expiresIn: number;
    user: AuthUser;
  };
}

export async function logout() {
  await fetch(buildUrl('auth/logout'), {
    method: 'POST',
    credentials: 'include',
  });
}

