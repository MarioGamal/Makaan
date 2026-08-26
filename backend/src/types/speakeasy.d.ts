declare module 'speakeasy' {
  type VerifyOptions = {
    secret: string;
    encoding: 'base32';
    token: string;
    window?: number;
  };

  type GeneratedSecret = {
    base32: string;
    otpauth_url: string;
  };

  const speakeasy: {
    generateSecret(options: {
      length?: number;
      name?: string;
      issuer?: string;
    }): GeneratedSecret;
    totp: {
      verify(options: VerifyOptions): boolean;
    };
  };

  export default speakeasy;
}
