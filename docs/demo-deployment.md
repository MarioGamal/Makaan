# Hosted demo deployment

This deployment is intentionally a demonstration environment, not the production
security profile. It uses fixed seller OTP `123456` and deterministic upload
scanning while retaining HTTPS, secure host-only cookies, encrypted protected
fields, persistent PostgreSQL/Redis data, Cloudinary media, and Mapbox maps.

## 1. Finish the local demo configuration

Keep the populated `.env.demo` uncommitted. Compare it with
`.env.demo.example`, then generate the moderator authenticator secret:

```bash
npm run demo:admin:totp
```

Add the printed base32 value as `DEMO_ADMIN_TOTP_SECRET` and import the printed
setup URI into the moderator's authenticator application. Do not share either
value. The final URL fields can be completed after choosing the Vercel project
name.

## 2. Create the Vercel frontend

Import the GitHub repository into Vercel and use the repository root. The checked
in `vercel.json` supplies the install, build, and output settings. Choose Node 20
and a stable project name, then set:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://<vercel-project>.vercel.app/api/v1` |
| `NEXT_PUBLIC_MAP_PROVIDER` | `mapbox` |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox public token |

The first deployment can complete without a backend. Its API calls will not work
until `BACKEND_ORIGIN` is added in step 4.

## 3. Create the Render backend

Create a Render Blueprint from `render.yaml`. Enter every value marked
`sync: false` from `.env.demo`. Use the stable Vercel origin for
`PUBLIC_APP_URL`, `ALLOWED_ORIGINS`, `NEXT_PUBLIC_API_URL`, and the public Mapbox
variables. Do not include URL paths in `PUBLIC_APP_URL` or `ALLOWED_ORIGINS`.

Render builds from the repository root because the backend depends on the shared
workspace. Its build explicitly installs development dependencies because the Nest
CLI and TypeScript compiler are build-time tools even when `NODE_ENV=production`.
The free service health check uses `/api/v1/health`; database readiness
is available separately at `/api/v1/health/ready`.

## 4. Connect the same-origin API proxy

Copy the Render service origin, without a trailing slash, into the Vercel variable:

```text
BACKEND_ORIGIN=https://<render-service>.onrender.com
```

Redeploy Vercel. Browser requests now use the Vercel `/api/v1` origin and are
rewritten to Render, allowing the secure host-only seller, buyer, and moderator
cookies to work without cross-site cookie exceptions.

## 5. Migrate and seed Neon

Update the URL values in `.env.demo`, validate the complete configuration, then
run migrations and the explicitly confirmed hosted demo seed from a trusted local
checkout:

```bash
npm run demo:config:check
npm run demo:db:migrate
npm run demo:db:seed
```

The seed command is intentionally separate from builds. It uploads the bundled
property images to Cloudinary and upserts deterministic Cairo demo data and the
moderator account. Never run it against a real production database.

## 6. Smoke-check the demo

1. Open `/api/v1/health/ready` through the Vercel URL and expect `ready`.
2. Browse the Arabic landing and sale/rental pages and confirm images and maps.
3. Register a seller using OTP `123456`, create a listing, and upload photos.
4. Sign in to `/admin/login` with the demo moderator credentials and a current
   authenticator code, then approve the listing.
5. Confirm the approved listing appears publicly and its exact location remains
   hidden.

Render's free service sleeps after inactivity. Open the site before a demo and
allow the first API request time to wake the backend.
