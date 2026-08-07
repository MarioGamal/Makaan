import {
  OtpProvider,
  OtpRequest,
  OtpRequestResult,
  OtpVerificationRequest,
  OtpVerificationResult,
} from '../otp.provider';

/**
 * The local/test adapter deliberately has no delivery side effect and no log output.
 * It exists only behind the explicit APP_MODE gate configured by the application.
 */
export class LocalOtpProvider implements OtpProvider {
  private static readonly localCode = '123456';
  private static readonly expiresInSeconds = 300;

  async request(_input: OtpRequest): Promise<OtpRequestResult> {
    return {
      accepted: true,
      expiresInSeconds: LocalOtpProvider.expiresInSeconds,
    };
  }

  async verify(input: OtpVerificationRequest): Promise<OtpVerificationResult> {
    return input.code === LocalOtpProvider.localCode
      ? { status: 'verified' }
      : { status: 'invalid' };
  }
}
