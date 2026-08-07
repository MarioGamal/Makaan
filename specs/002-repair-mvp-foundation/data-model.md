# Data Model: Repair MVP Foundation

**Feature**: `002-repair-mvp-foundation`  
**Date**: 2026-07-20

## Conventions and Invariants

- UUID primary keys; UTC `timestamptz` timestamps; money stored as integer EGP minor units or an existing
  exact decimal representation, never binary floating point.
- All production schema changes are migrations. TypeORM synchronization remains disabled.
- Public serializers are allowlists. Private columns are never removed merely at controller level and
  must not be selected by public search/detail queries.
- Audit, listing revision, contact/view event, and verification access records are append-only.
- `exact_location` participates only in private seller/moderator operations and duplicate signals.
- Partial unique indexes, check constraints, and transaction locks enforce invariants that could race.

## Identity, Participation, and Sessions

### User Account

| Field                             | Type                    | Rules                                                           |
| --------------------------------- | ----------------------- | --------------------------------------------------------------- |
| `id`                              | uuid                    | Primary key                                                     |
| `phone_ciphertext`                | encrypted text          | Never public/logged; lookup uses separate keyed hash            |
| `phone_lookup_hash`               | bytes/text              | Unique, peppered/HMAC form                                      |
| `display_name`                    | text                    | Private unless a future explicit public-name policy is approved |
| `account_role`                    | enum                    | `buyer`, `seller`, `admin`; privileged changes revoke sessions  |
| `status`                          | enum                    | `active`, `blocked`, `deactivated`                              |
| `second_factor_secret_ciphertext` | nullable encrypted text | Required for administrators only                                |
| `created_at`, `last_login_at`     | timestamp               | Managed metadata                                                |

The existing `User` is the single authenticated account/principal. A buyer may later add a seller profile;
seller-facing access requires that profile. Administrator access uses the same account table but a distinct
admin session scope/cookie and mandatory second factor. Saves, views, and contact intents reference
`user_id` for any authenticated buyer/seller account and never introduce a second undefined buyer entity.

### SellerProfile

| Field                                 | Type                    | Rules                                                        |
| ------------------------------------- | ----------------------- | ------------------------------------------------------------ |
| `id`, `user_id`                       | uuid                    | One profile per user account                                 |
| `declared_participation`              | enum                    | `owner`, `agent`; seller-controlled declaration              |
| `participation_declaration_version`   | integer                 | Increments whenever declaration changes                      |
| `agent_declaration_confirmed_version` | nullable integer        | Must equal current version before first agent publication    |
| `agent_declaration_confirmed_at/by`   | nullable timestamp/uuid | Human moderator proof; append-only action also recorded      |
| `classification_source`               | enum                    | `self_declared`, `moderator_override`, `risk_signal`         |
| `moderator_participation_override`    | nullable enum           | `owner`, `agent`; human-only                                 |
| `review_state`                        | enum                    | `clear`, `under_review`, `suspended`                         |
| `verification_state`                  | enum                    | `not_verified`, `pending`, `verified`, `rejected`, `expired` |
| `verification_decided_at/by`          | nullable timestamp/uuid | Human decision provenance                                    |
| `created_at`, `updated_at`            | timestamp               | Managed metadata                                             |

Public participation label is derived, never freely entered: moderator-effective `agent` → `agent`;
effective owner with current verification → `verified_owner`; otherwise → `owner_not_verified`.
Automated risk signals may set/queue `under_review` but cannot overwrite declaration or moderator override.
Changing participation increments the declaration version and invalidates an older agent confirmation.

### Administrator Account Rules

The `User` administrator role adds password/recovery version metadata and requires encrypted second-factor
material. Password hashes and second-factor material are never returned. Admin recovery is an audited
out-of-band command in this feature, not a public endpoint.

### AuthSession

| Field                                    | Type                | Rules                                                    |
| ---------------------------------------- | ------------------- | -------------------------------------------------------- |
| `id`                                     | uuid                | Internal identifier, never a browser credential          |
| `user_id`, `session_scope`               | uuid, enum          | Account plus `seller` or `admin`; indexed                |
| `role_at_issue`                          | enum                | Authorization snapshot; privileged changes rotate/revoke |
| `token_hash`                             | bytes/text          | Unique hash of opaque random cookie token                |
| `csrf_hash`                              | bytes/text          | Hash bound to separately supplied CSRF value             |
| `created_at`, `last_seen_at`             | timestamp           | Idle tracking                                            |
| `idle_expires_at`, `absolute_expires_at` | timestamp           | Both must be valid                                       |
| `revoked_at`, `revocation_reason`        | nullable            | Immediate invalidation                                   |
| `rotated_from_id`                        | nullable uuid       | Session lineage                                          |
| `ip_prefix_hash`, `user_agent_hash`      | nullable bytes/text | Privacy-minimal risk evidence                            |

Seller and admin sessions use separate cookies and CSRF names. Store only credential hashes. Local HTTP cookie names omit
`__Host-`; production uses `__Host-makaan-seller` and `__Host-makaan-admin`, Secure, HttpOnly,
SameSite=Lax, Path=/.

### AnonymousSubject

`id`, unique `token_hash`, `csrf_hash`, created/last-seen timestamps, optional expiry/revocation. The opaque
cookie is not a fingerprint and the raw value is never persisted. It is one valid principal for saves and
events and has a separately named CSRF value bound only to the anonymous-subject cookie.

### VerificationCase / VerificationEvidence / EvidenceAccess

- `VerificationCase`: seller, status (`open`, `approved`, `rejected`, `cancelled`), decision/reason/hold.
- `VerificationEvidence`: case, encrypted metadata, private object reference, uploaded/decision/deletion
  dates, retention hold reason. Evidence is deleted 30 days after decision unless the hold is recorded.
- `EvidenceAccess`: append-only actor, case/evidence, purpose, time, correlation ID.

Evidence is unavailable to ranking or automated classification.

## Geography and Listings

### CairoArea / CairoAreaAlias

`CairoArea` preserves authoritative `name_ar`, `name_en`, governed polygon geometry, normalized Arabic and
English keys, active/order metadata. `CairoAreaAlias` stores reviewed locale, display alias, normalized
alias, target area, provenance, and active flag. Normalized alias is unique per locale. User-submitted
aliases and generic fuzzy matches are prohibited.

Normalization: Unicode NFKC; remove Arabic combining marks and tatweel; fold Alef variants to `ا` and
`ى` to `ي`; lowercase Latin; normalize punctuation and whitespace. Display values remain unchanged.

### Listing

Core current fields remain and are reconciled with migrations: seller, title, description, purpose
(`sale`, `long_term_rent`), residential property type, integer/decimal price, size, bedrooms, bathrooms,
amenities, area, floor/address/private contact metadata, and timestamps.

Added policy fields:

| Field                              | Type                           | Rules                                                                                      |
| ---------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------ |
| `status`                           | enum                           | `draft`, `pending_review`, `active`, `rejected`, `sold`, `inactive`, `expired`, `disputed` |
| `exact_location`                   | geography(Point,4326)          | Required before submission; private                                                        |
| `seller_public_location_mode`      | enum                           | `approximate`, `area_only` consent                                                         |
| `approved_public_location_mode`    | nullable enum                  | Moderator may only make more private                                                       |
| `public_location`                  | nullable geography(Point,4326) | Persisted, stable, inside governed area, never exact                                       |
| `public_location_distance_m`       | nullable integer               | 100–500 for approximate mode                                                               |
| `availability_confirmed_at`        | nullable timestamp             | Active requires current value                                                              |
| `availability_warning_sent_at`     | nullable timestamp             | One warning in final 7 days                                                                |
| `expires_at`                       | nullable timestamp             | Confirmation + 30 days                                                                     |
| `canonical_property_id`            | nullable uuid                  | Required before activation                                                                 |
| `current_revision_id`              | nullable uuid                  | Null for a never-submitted draft; otherwise latest immutable submitted revision            |
| `approved_revision_id`             | nullable uuid                  | Public projection source                                                                   |
| `lock_version`                     | integer                        | Optimistic concurrency                                                                     |
| `approved_at/by`, `rejected_at/by` | nullable                       | Human provenance                                                                           |

Active check: approved current public revision, active Cairo area, current availability, canonical identity,
valid seller state, approved public precision, and media requirements. Public search uses only fields from
the approved projection.

### ListingRevision

Append-only snapshot of all seller-controlled/material fields, exact location, participation declaration
at submission, media references, author, creation time, and change classification (`material`,
`non_material`). A new/rejected draft can be edited as working state; submission creates its immutable
revision. A PATCH to an active listing containing any material field atomically snapshots the supplied
candidate revision and moves the listing directly to `pending_review`—there is no second submit step and
the previous approved snapshot becomes non-public in the same transaction. Non-material active edits are
recorded without changing public eligibility. Material fields include price, exact location, declaration,
purpose, type, size, bedrooms, bathrooms, description, amenities, and media.

### Listing State Transitions

```text
draft ──submit──> pending_review ──approve──> active
  ▲                    │  │                    │
  │                    │  ├─reject──> rejected ├─mark sold──> sold
  │                    │  └─dispute─> disputed ├─withdraw───> inactive
  └──edit rejected─────┘                       ├─30 days────> expired
                                               ├─dispute────> disputed
                                               └─material edit→ pending_review

expired ──reconfirm unchanged──> active
expired ──material edit + submit→ pending_review
disputed ──human resolution─────> pending_review | active | inactive
```

All transitions run in one transaction with a row lock or checked `lock_version` and append one audit
event. Expiry workers claim bounded rows with `FOR UPDATE SKIP LOCKED`; re-confirmation and expiry cannot
both win.

### CanonicalProperty / DuplicateSignal / PropertyDispute

- `CanonicalProperty`: moderator-created identity, governed area, private normalized/property identity
  attributes, status, creator/time. It does not expose exact location publicly.
- `DuplicateSignal`: candidate pair, signal types (proximity, attributes, reused media/contact), values,
  generation version/time, review outcome. Explainable evidence only.
- `PropertyDispute`: canonical property, claimant listings/sellers, `open|resolved|dismissed`, private notes,
  human decision and time.

A partial unique index on `(canonical_property_id, purpose)` where `status='active'` is the final concurrency
guard. No signal may automatically merge, reject, suspend, or establish ownership.

## Media, Saves, and Events

### ListingMedia

Listing/revision, private source/quarantine key, approved derivative key, detected MIME, byte size, width,
height, SHA-256 digest, perceptual hash, scan state (`pending`, `clean`, `malicious`, `failed`), scan engine
and time, display order, lifecycle timestamps. Only 3–10 clean 800×600-or-larger JPEG/PNG/WebP-derived,
metadata-stripped images may appear in an approved revision. Source max is 5 MB.

### SavedListing

`listing_id`, nullable `user_id`, nullable `anonymous_subject_id`, `active`, created/updated/deactivated
timestamps. Check constraint requires exactly one principal. Partial unique indexes cover active
`(user_id, listing_id)` and `(anonymous_subject_id, listing_id)`. Save is an idempotent upsert/reactivation;
unsave deactivates. Seller save metric counts active membership.

### ListingView / ContactIntent

Append-only events identify the listing plus exactly one authenticated/anonymous principal (or an approved
privacy-minimal aggregate identity), time bucket, event metadata allowlist, and correlation ID. Views use a
documented dedupe window. Contact intent adds allowed method (`phone`, `whatsapp`), rate decision, accepted
time, short-lived resolver-token hash, resolved time, and expiry. Raw destinations never enter these rows,
logs, public responses, or analytics.

## AuditEvent

Append-only fields: actor kind/id and immutable actor snapshot, session ID, action, target kind/id, prior
state summary, resulting state summary, reason/message key, private metadata allowlist, occurrence time,
and correlation ID. Subject deletion never cascades audit history; identifiers may be tombstoned according
to retention policy. Database permissions/trigger rules prevent update and delete by the application role.

## Ranking Projection

Public query order is lexicographic and versioned:

1. query relevance descending;
2. geographic fit descending;
3. completeness descending;
4. named verification descending;
5. `availability_confirmed_at` descending;
6. policy compliance descending;
7. owner priority descending;
8. `approved_at` descending;
9. `listing.id` ascending.

Views, saves, contacts, payment, and hidden model scores are forbidden ordering inputs. Public bbox search
uses `public_location`; area filtering uses `area_id`.

## Migration Allocation

- `005-schema-reconciliation`: missing description; view/contact structures; registry parity; baseline
  constraints/indexes.
- `006-security-audit-participation`: sessions/CSRF support, anonymous subjects, participation,
  verification/evidence, audit ledger.
- `007-listing-privacy-lifecycle-canonical`: area aliases, exact/public locations, revisions, availability,
  canonical properties, signals, disputes.
- `008-events-saves-media`: race-safe saves, events/contact intents, protected media metadata.
- `009-data-backfill-policy`: conservative backfill; legacy public records return to review where required
  approval, consent, canonical identity, availability, or participation evidence is absent.

Applied migrations 001–004 are never rewritten.
