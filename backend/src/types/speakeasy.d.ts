declare module 'speakeasy' {
  type VerifyOptions = {
    secret: string;
    encoding: 'base32';
    token: string;
    window?: number;
  };

  const speakeasy: {
    totp: {
      verify(options: VerifyOptions): boolean;
    };
  };

  export default speakeasy;
}
