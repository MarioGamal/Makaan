/**
 * Delivers an OTP challenge and verifies it with the provider that issued it.
 * Implementations must never return, log, or include an OTP in an error.
 */
export interface OtpProvider {
  request(input: OtpRequest): Promise<OtpRequestResult>;
  verify(input: OtpVerificationRequest): Promise<OtpVerificationResult>;
}

export interface OtpRequest {
  phone: string;
  purpose: 'seller_sign_in';
}

export interface OtpRequestResult {
  accepted: true;
  expiresInSeconds: number;
}

export interface OtpVerificationRequest {
  phone: string;
  purpose: 'seller_sign_in';
  code: string;
}

export type OtpVerificationResult =
  { status: 'verified' } | { status: 'invalid' } | { status: 'expired' };
