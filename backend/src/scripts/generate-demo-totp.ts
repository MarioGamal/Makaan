import speakeasy from 'speakeasy';

const email = process.env.DEMO_ADMIN_EMAIL?.trim();
if (!email) {
  throw new Error('DEMO_ADMIN_EMAIL must be set in .env.demo.');
}

const generated = speakeasy.generateSecret({
  length: 20,
  name: `Makaan Demo (${email})`,
  issuer: 'Makaan Demo',
});

console.log('Add this value to .env.demo as DEMO_ADMIN_TOTP_SECRET:');
console.log(generated.base32);
console.log('\nAdd this setup URI to your authenticator application:');
console.log(generated.otpauth_url);
