# Configuration

`APP_MODE` is a required, discriminated configuration value. It is the only switch that selects
providers and security posture:

| Mode         | Intended use         | Provider policy                                                                                                                     |
| ------------ | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `local`      | Developer machine    | Fixed non-logging OTP, local media, deterministic scanner, accessible local map substitute                                          |
| `test`       | Automated tests      | Same non-production adapters with isolated test paths and deterministic fixtures                                                    |
| `demo`       | Hosted product demo  | Fixed non-logging OTP, Cloudinary media, deterministic scanner, Mapbox, hosted TLS, and secure cookies                              |
| `production` | Deployed application | Configured SMS, private object storage, real malware scanner, encryption, map, TLS, cookies, exact origins, and trusted proxy CIDRs |

`NODE_ENV` does not select providers. The application must validate the whole environment before
Nest starts and reject an invalid configuration; it must not silently select a substitute.

The `demo` mode is intentionally not a production shortcut. It exists for the
zero-cost functional deployment described in `docs/demo-deployment.md`; its fixed
OTP and deterministic scanner must never be used for real customer traffic.

## Local setup inventory

Copy `.env.example` to `.env`. Docker Compose exposes PostGIS at `localhost:5433`, Redis at
`localhost:6379`, the backend at `localhost:4000`, and the frontend at `localhost:3000`.

| Group                  | Variables                                                                                                                                                                                                         | Local value/rule                                                                                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Application            | `APP_MODE`, `NODE_ENV`, `PORT`, `PUBLIC_APP_URL`                                                                                                                                                                  | `local`, `development`, `4000`, `http://localhost:4000`                                                                                                                                             |
| Browser boundary       | `ALLOWED_ORIGINS`, `TRUSTED_PROXY_CIDRS`, `COOKIE_SECURE`, `COOKIE_SAME_SITE`, `COOKIE_DOMAIN`                                                                                                                    | Exact `http://localhost:3000`; no trusted proxy; `false`, `lax`, and empty domain for localhost                                                                                                     |
| Session policy         | `SELLER_SESSION_IDLE_MINUTES`, `SELLER_SESSION_ABSOLUTE_HOURS`, `ADMIN_SESSION_IDLE_MINUTES`, `ADMIN_SESSION_ABSOLUTE_HOURS`, `CONTACT_INTENT_TTL_SECONDS`                                                        | Explicit positive integer policy values; admin values are shorter than seller values                                                                                                                |
| Abuse limits           | `ABUSE_OTP_REQUEST_LIMIT`, `ABUSE_OTP_VERIFICATION_LIMIT`, `ABUSE_ADMIN_LOGIN_LIMIT`, `ABUSE_OWNER_LISTING_SUBMISSION_LIMIT`, `ABUSE_AGENT_LISTING_SUBMISSION_LIMIT`, `ABUSE_UPLOAD_LIMIT`, `ABUSE_CONTACT_LIMIT` | Optional positive-integer overrides. Defaults are 5/5/5, 3 owner and 2 agent submissions per 24 hours, 20 uploads/hour, and 10 contacts/hour; agent submissions may never exceed owner submissions. |
| Database/cache         | `DATABASE_URL`, `DATABASE_TLS_MODE`, `DATABASE_TLS_CA_FILE`, `REDIS_URL`, `REDIS_TLS`                                                                                                                             | PostGIS `5433`, Redis `6379`, database TLS `disable`, Redis TLS `false`                                                                                                                             |
| Cryptographic material | `SESSION_TOKEN_PEPPER`, `CSRF_TOKEN_PEPPER`, `PHONE_LOOKUP_PEPPER`, `FIELD_ENCRYPTION_KEY`                                                                                                                        | Local-only non-empty development values. They are never logged or committed as real credentials.                                                                                                    |
| Local providers        | `OTP_PROVIDER`, `LOCAL_FIXED_OTP`, `MEDIA_PROVIDER`, `LOCAL_MEDIA_ROOT`, `MALWARE_SCANNER_PROVIDER`, `MAP_PROVIDER`                                                                                               | `local_fixed`, `123456`, `local`, namespaced local media path, `deterministic`, `accessible_local`                                                                                                  |
| Assistant              | `ASSISTANT_PROVIDER`                                                                                                                                                                                              | Optional. Defaults to `deterministic`, which calls no external service and requires no key in any mode.                                                                                             |
| Local admin fixture    | `LOCAL_ADMIN_EMAIL`, `LOCAL_ADMIN_PASSWORD`, `LOCAL_ADMIN_TOTP_SECRET`                                                                                                                                            | Test-only fixture values; all authentication responses and logs must still omit credentials and factors.                                                                                            |
| Retention/logging      | `EVIDENCE_RETENTION_DAYS`, `LOG_RETENTION_DAYS`, `LOG_LEVEL`                                                                                                                                                      | Evidence default is `30`; log retention is explicit; debug logging must still redact protected data.                                                                                                |
| Frontend public config | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_MAP_PROVIDER`, `NEXT_PUBLIC_MAPBOX_TOKEN`                                                                                                                                     | Local API URL, `accessible_local`, and no map token. Only `NEXT_PUBLIC_*` values may be exposed to browser bundles.                                                                                 |

## Production inventory and fail-closed rules

Production uses the same common variables, with the following mandatory conditions. The example
uses non-secret placeholders only; a deployment secret manager supplies real values.

| Area                      | Required production configuration                                                                                                     | Rejected configuration                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Mode and URLs             | `APP_MODE=production`; HTTPS `PUBLIC_APP_URL`; one or more exact HTTPS `ALLOWED_ORIGINS`                                              | Missing/unknown mode, HTTP public URL, blank/wildcard origin, localhost origin                                         |
| Proxy and TLS             | Non-empty, specific `TRUSTED_PROXY_CIDRS`; `DATABASE_TLS_MODE=verify-full`; readable CA file; `REDIS_TLS=true` and `rediss://`        | Empty/wildcard proxy trust, forwarded headers from untrusted peers, `disable`/insecure database TLS, Redis without TLS |
| Cookies                   | `COOKIE_SECURE=true`, `COOKIE_SAME_SITE=lax`, empty `COOKIE_DOMAIN` for host-only `__Host-` cookies                                   | Insecure cookies, `SameSite=none`, a domain on `__Host-` cookies, development cookie names                             |
| Session/encryption        | Unique high-entropy `SESSION_TOKEN_PEPPER`, `CSRF_TOKEN_PEPPER`, `PHONE_LOOKUP_PEPPER`, `FIELD_ENCRYPTION_KEY`                        | Blank, `replace-with-*`, `change-me`, or copied local fixture values                                                   |
| OTP                       | `OTP_PROVIDER=twilio`; `SMS_PROVIDER=twilio`; `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` from secret management | `local_fixed`, fixed OTP, missing/placeholder SMS configuration                                                        |
| Media                     | `MEDIA_PROVIDER=s3`; private bucket/region/endpoint/access credentials                                                                | `local`, public bucket defaults, blank/placeholder object-storage configuration                                        |
| Malware                   | `MALWARE_SCANNER_PROVIDER=clamav`; reachable scanner host/port                                                                        | `deterministic`, no-op scanner, missing host/port, scanner outage treated as success                                   |
| Maps                      | `MAP_PROVIDER=mapbox`; restricted `MAPBOX_TOKEN` and matching `NEXT_PUBLIC_MAP_*` values                                              | `accessible_local`, missing/placeholder production map configuration                                                   |
| Local-only fixture values | No `LOCAL_*` value may be selected or used                                                                                            | Local admin fixture, local media root, or fixed OTP enabled in production                                              |

The production validator must reject `replace-with-*`, `change-me`, reserved `.example` hosts, blank values for
required fields, and local/test adapter names. It must also reject an insecure combination even
when individual values are non-empty. Health and startup failures may name the invalid setting but
must never echo a secret, private URL credential, phone number, token, OTP, or exact location.

## Provider variable reference

| Provider      | Variables                                                                                                                                               | Mode                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| SMS           | `OTP_PROVIDER`, `SMS_PROVIDER`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`                                                        | Twilio values required only in production; local/test use `local_fixed`     |
| Media storage | `MEDIA_PROVIDER`, `LOCAL_MEDIA_ROOT`, `MEDIA_S3_REGION`, `MEDIA_S3_BUCKET`, `MEDIA_S3_ENDPOINT`, `MEDIA_S3_ACCESS_KEY_ID`, `MEDIA_S3_SECRET_ACCESS_KEY` | Local/test use local storage; production uses private S3-compatible storage |
| Scanner       | `MALWARE_SCANNER_PROVIDER`, `MALWARE_SCANNER_PROVIDER_PRODUCTION`, `CLAMAV_HOST`, `CLAMAV_PORT`                                                         | Local/test deterministic scanner; production ClamAV only                    |
| Map           | `MAP_PROVIDER`, `MAPBOX_TOKEN`, `NEXT_PUBLIC_MAP_PROVIDER`, `NEXT_PUBLIC_MAPBOX_TOKEN`                                                                  | Local/test accessible substitute; production configured map provider        |
| Assistant     | `ASSISTANT_PROVIDER`, `ABUSE_ASSISTANT_MESSAGE_LIMIT`                                                                                                   | Optional; defaults to `deterministic` in every mode and needs no account    |

The application must use only a provider selected by validated configuration. A scanner, cache, or
security-provider failure rejects the protected operation rather than bypassing the check.

## Cookie and proxy contract

Production seller/admin session cookies use separate host-only `__Host-` names with `Secure`,
`HttpOnly`, `Path=/`, and `SameSite=Lax`. Readable CSRF values use separate names and are bound by
hash to the matching session/anonymous subject. All unsafe requests require an exact allowed Origin
and matching `X-CSRF-Token`.

Trusted client IP may be derived from forwarded headers only when the immediate peer is inside a
configured trusted proxy CIDR. `0.0.0.0/0`, `::/0`, an empty production list, or blindly trusting
`X-Forwarded-For` are invalid production configurations.
