---

description: "Task list for Makaan MVP - Map-First Real Estate Marketplace"
---

# Tasks: Makaan MVP - Map-First Real Estate Marketplace

**Input**: Design documents from `/specs/001-makaan-mvp/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/api-spec.md ✅ quickstart.md ✅

**Tests**: Not included (not requested in spec). Add test tasks only if explicitly requested.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete sibling tasks)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization — monorepo scaffold, tooling, Docker, CI

- [X] T001 Create monorepo root directory structure: `backend/`, `frontend/`, `shared/`, `infrastructure/docker/` per plan.md
- [X] T002 [P] Initialize NestJS 10 backend project in `backend/` with TypeScript 5, install core deps: `@nestjs/core @nestjs/common @nestjs/typeorm typeorm pg class-validator class-transformer @nestjs/passport passport passport-jwt @nestjs/jwt @nestjs/throttler`
- [X] T003 [P] Initialize Next.js 16 frontend project in `frontend/` with TypeScript 5 and Tailwind CSS; install deps: `react-map-gl mapbox-gl swr react-hook-form zod`
- [X] T004 [P] Create `infrastructure/docker/docker-compose.yml` with PostgreSQL 16 + PostGIS 3.6, Redis 7, and pgAdmin services per quickstart.md
- [X] T005 [P] Create `shared/constants/enums.ts` with `PropertyType`, `FinishingLevel`, `ListingStatus`, `UserType`, `SellerType`, `RejectionReason` enums matching spec.md values
- [X] T006 [P] Create `shared/types/index.ts` with shared TypeScript interfaces: `ListingDTO`, `UserDTO`, `CairoAreaDTO`
- [X] T007 Create root-level `.env.example` documenting all required env vars: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `MAPBOX_TOKEN`, `CLOUDINARY_*`, `TWILIO_*`, `OPENAI_API_KEY`, `ADMIN_2FA_SECRET`
- [X] T008 [P] Configure ESLint + Prettier in `backend/.eslintrc.js` and `frontend/.eslintrc.js` with TypeScript rules
- [X] T009 [P] Setup GitHub Actions CI workflow in `.github/workflows/ci.yml`: lint → build backend → build frontend

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, core entities, security middleware — MUST complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T010 Configure TypeORM database connection module in `backend/src/database/database.module.ts` using `DATABASE_URL` env var with connection pooling
- [X] T011 [P] Create initial database migration in `backend/src/database/migrations/001-create-extensions.ts` that runs `CREATE EXTENSION IF NOT EXISTS postgis; CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
- [X] T012 [P] Create `User` TypeORM entity in `backend/src/models/user.entity.ts` with fields: `id (uuid PK)`, `phone_number (unique, encrypted)`, `user_type (enum)`, `status (enum)`, `is_phone_verified`, `created_at`, `last_login_at`
- [X] T013 [P] Create `CairoArea` TypeORM entity in `backend/src/models/cairo-area.entity.ts` with fields: `id (uuid PK)`, `name_en`, `name_ar`, `boundary (geography POLYGON)`, `parent_id (self-ref FK)`, `level`; add GiST index on `boundary`
- [X] T014 Create `Listing` TypeORM entity in `backend/src/models/listing.entity.ts` with ALL fields from data-model.md: `id`, `seller_id (FK User)`, `area_id (FK CairoArea)`, `purpose (sale/rent)`, `property_type (enum)`, `size_sqm`, `bedrooms`, `bathrooms`, `finishing_level (enum)`, `price_egp`, `location (geography POINT 4326)`, `status (enum)`, `view_count`, `save_count`, `contact_count`, `submitted_at`, `approved_at`, `rejection_reason`; add GiST index on `location`, composite index on `(status, location)`
- [X] T015 [P] Create `Photo` TypeORM entity in `backend/src/models/photo.entity.ts` with fields: `id`, `listing_id (FK)`, `cloudinary_url`, `display_order`, `original_filename`, `width`, `height`, `created_at`
- [X] T016 [P] Create `AuthSession` TypeORM entity in `backend/src/models/auth-session.entity.ts` with fields: `id`, `user_id (FK)`, `token_hash`, `expires_at`, `created_at`, `revoked_at`
- [X] T017 [P] Create `SellerProfile` TypeORM entity in `backend/src/models/seller-profile.entity.ts` with fields: `id`, `user_id (unique FK)`, `seller_type (owner/agent inferred)`, `listing_count`, `is_verified`, `verified_at`
- [X] T018 Configure Redis module in `backend/src/config/redis.module.ts` using `ioredis` connecting to `REDIS_URL`; export `RedisService` wrapping get/set/setex/del/incr
- [X] T019 [P] Implement JWT authentication guard in `backend/src/middleware/jwt-auth.guard.ts` using `@nestjs/passport`; implement `JwtStrategy` extracting user from Bearer token and verifying against `AuthSession`
- [X] T020 [P] Implement RBAC roles guard in `backend/src/middleware/roles.guard.ts` with `@Roles('seller')`, `@Roles('admin')` decorators enforcing user_type from JWT payload
- [X] T021 [P] Implement `LoggingInterceptor` in `backend/src/middleware/logging.interceptor.ts`: mask phone numbers (replace middle 4+ digits with `****`) in all log output; NEVER log OTP codes or raw tokens
- [X] T022 [P] Implement global `HttpExceptionFilter` in `backend/src/middleware/http-exception.filter.ts` returning standardized `{statusCode, message, error}` JSON per api-spec.md error format
- [X] T023 Implement `ImageProcessingService` in `backend/src/utils/image.service.ts` using Sharp: (1) validate format is jpg/png/webp, (2) reject files > 5MB, (3) strip EXIF metadata, (4) resize to max 1200×1200, (5) convert to WebP 85% quality, (6) upload to Cloudinary; return `{url, width, height}`
- [X] T024 Configure Cloudinary SDK in `backend/src/config/cloudinary.config.ts` using `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` env vars; create `uploads/listings/{listingId}/` folder structure
- [X] T025 Bootstrap NestJS `AppModule` in `backend/src/app.module.ts` importing: `DatabaseModule`, `RedisModule`, `ThrottlerModule`, `ConfigModule`; apply `LoggingInterceptor` and `HttpExceptionFilter` globally; enable CORS for frontend origin
- [X] T026 Setup Next.js `_app.tsx` in `frontend/src/pages/_app.tsx` with global Tailwind CSS import, `SWRConfig` provider with dedupingInterval, and base layout wrapper

**Checkpoint**: Database entities created, Redis connected, security middleware active — user story implementation can now begin

---

## Phase 3: User Story 1 — Browse and Search Listings via Map (Priority: P1) 🎯 MVP

**Goal**: Buyers can explore Cairo properties on a map, filter listings, view details, and contact sellers — no account required

**Independent Test**: Visit homepage → map shows approved listing pins in Cairo → search "Nasr City" → map centers on area → apply filters → pins update → click pin → listing detail page shows price/photos/specs/contact buttons → WhatsApp button opens with pre-filled contact

### Backend — US1

- [X] T027 [P] [US1] Create `View` TypeORM entity in `backend/src/models/view.entity.ts` with fields: `id`, `listing_id (FK)`, `viewer_id (nullable FK User)`, `source (map_click/search/direct)`, `created_at`; index on `(listing_id, created_at)`
- [X] T028 [P] [US1] Create `Inquiry` TypeORM entity in `backend/src/models/inquiry.entity.ts` with fields: `id`, `listing_id (FK)`, `buyer_id (nullable FK)`, `contact_method (whatsapp/call)`, `created_at`; index on `listing_id`
- [X] T029 [US1] Implement `ListingSearchService` in `backend/src/services/listing-search.service.ts`: (1) bbox spatial query using `ST_MakeEnvelope` + `ST_Intersects`, (2) area polygon filter using `ST_Intersects(location, area.boundary)`, (3) filter params: purpose, property_type, min/max price, bedrooms, bathrooms, seller_type; return listings with PostGIS coordinates; only `status = 'active'` listings
- [X] T030 [US1] Implement `CairoAreaService` in `backend/src/services/cairo-area.service.ts`: search areas by partial name (EN/AR), return top 5 matches with bbox coordinates for Mapbox flyTo; cache results in Redis for 1 hour
- [X] T031 [US1] Implement `GET /listings` endpoint in `backend/src/api/listings/listings.controller.ts` accepting query params: `bbox`, `area_id`, `purpose`, `property_type`, `min_price`, `max_price`, `bedrooms`, `bathrooms`, `seller_type`, `page`, `limit (max 100)`; respond with `{listings: [...], total, bbox}`
- [X] T032 [US1] Implement `GET /listings/:id` endpoint in `backend/src/api/listings/listings.controller.ts`; increment `view_count` and insert `View` record; return full listing details including `photos[]`, `seller.seller_type`, `seller.is_verified`, `area.name_en`; NEVER expose `seller.phone_number`
- [X] T033 [P] [US1] Implement `GET /areas/search` endpoint in `backend/src/api/listings/areas.controller.ts` with `?q=` query param; return `[{id, name_en, name_ar, bbox}]` for map centering
- [X] T034 [US1] Create `ListingsModule` in `backend/src/api/listings/listings.module.ts` registering `ListingsController`, `AreasController`, `ListingSearchService`, `CairoAreaService` and importing TypeORM entities

### Frontend — US1

- [X] T035 [P] [US1] Create `MapPage` in `frontend/src/pages/index.tsx` with full-viewport `react-map-gl` `Map` component; initial view: Cairo center `{lat: 30.0444, lng: 31.2357, zoom: 11}`; load Mapbox style `mapbox://styles/mapbox/streets-v12`; set `NEXT_PUBLIC_MAPBOX_TOKEN` from env
- [X] T036 [P] [US1] Create `ListingPin` component in `frontend/src/components/map/ListingPin.tsx`: renders price label as HTML marker; shows seller badge icon (verified/owner/agent); handles click to open `ListingPopup`
- [X] T037 [US1] Implement map pin clustering in `frontend/src/components/map/ListingPin.tsx` using `supercluster` via `react-map-gl` `useCluster`; clusters show count, expand on click/zoom
- [X] T038 [P] [US1] Create `ListingPopup` component in `frontend/src/components/map/ListingPopup.tsx`: shows thumbnail photo, price, property type, beds/baths, "View Details" and "Contact" CTA buttons; mobile-friendly touch targets
- [X] T039 [P] [US1] Create `FilterPanel` component in `frontend/src/components/filters/FilterPanel.tsx` with controls for: purpose (sale/rent toggle), price range slider (EGP), property type multi-select (all 7 types from spec), bedrooms/bathrooms count selectors, seller type toggle (owner/agent/all)
- [X] T040 [US1] Wire `FilterPanel` to map — on filter change, re-fetch `/listings` with current `bbox` + new filter params; update pins in real-time; show loading indicator on map
- [X] T041 [P] [US1] Create `AreaSearchBar` component in `frontend/src/components/search/AreaSearchBar.tsx` with autocomplete dropdown calling `GET /areas/search`; on area select: call Mapbox `flyTo(area.bbox)` and set active area filter
- [X] T042 [US1] Implement `useListings` hook in `frontend/src/hooks/useListings.ts` using `swr` fetching `/listings` with bbox (from map bounds) + active filters; debounce bbox updates by 300ms on map move
- [X] T043 [P] [US1] Create `ListingDetailPage` in `frontend/src/pages/listings/[id].tsx` with server-side rendering (`getServerSideProps`); display: photo gallery (with prev/next), full specs grid, map pin preview, seller badge, "days listed", contact buttons
- [X] T044 [US1] Implement contact action buttons in `frontend/src/components/listing/ContactButtons.tsx`: WhatsApp button opens `https://wa.me/[phone]?text=...` deeplink; Call button opens `tel:[phone]`; track contact action via `POST /listings/:id/contact`; NEVER display raw phone in HTML
- [X] T045 [P] [US1] Create API client for listings in `frontend/src/services/listings.service.ts` with typed functions: `searchListings(params)`, `getListingById(id)`, `trackContact(id, method)` using `fetch` with base URL from `NEXT_PUBLIC_API_URL`
- [X] T046 [US1] Implement empty state in `frontend/src/components/map/EmptyState.tsx`: show "No listings match your filters" overlay with "Clear filters" button when `listings.length === 0`; show "Makaan serves Cairo only" message when search area is outside Cairo boundaries
- [X] T047 [US1] Handle browser geolocation: if granted, offer "Find listings near me" button centering map on user; if denied or outside Cairo, silently default to Cairo city center (no error shown)
- [X] T048 [US1] Create `ListingsModule` page layout in `frontend/src/components/layout/MapLayout.tsx` with split-view: full-screen map (70%) + scrollable listing sidebar (30%) on desktop; stacked map-over-list on mobile; map always visible

**Checkpoint**: User Story 1 fully functional — buyers can browse, filter, and view listings on the map

---

## Phase 4: User Story 2 — Seller Phone Authentication and Listing Creation (Priority: P2)

**Goal**: Sellers authenticate via phone OTP and create structured listings with required fields, map pin, and photos — all pending admin approval

**Independent Test**: Enter phone → receive OTP within 30s → enter code → redirected to listing form → fill all required fields + place map pin + upload 3 photos → submit → listing shows "Pending" status; test invalid photo (>5MB) is rejected; test incomplete form blocks submission

### Backend — US2

- [X] T049 [US2] Implement `OtpService` in `backend/src/services/otp.service.ts`: generate cryptographically random 6-digit code, hash with bcrypt and store in Redis key `otp:{phone}` with 300s TTL, send plaintext via Twilio `messages.create`; NEVER log the OTP code; mask phone in all logs; enforce rate limit 3 requests per 10 min per phone using Redis counter
- [X] T050 [P] [US2] Implement `MockOtpService` in `backend/src/services/mock-otp.service.ts` for `NODE_ENV=development`: log code to console only (never to file), always store code `123456` in Redis; inject via `OTP_PROVIDER` env var toggle
- [X] T051 [US2] Implement `AuthService` in `backend/src/services/auth.service.ts`: `verifyOtp(phone, code)` validates Redis hash, creates or finds `User`, issues JWT (30-day expiry for sellers), records `AuthSession`; `revokeSession(token)` on logout
- [X] T052 [US2] Implement `SellerTypeInferenceService` in `backend/src/services/seller-type.service.ts`: classify `owner` if listing count ≤ 5 AND unique phones ≤ 1 AND weekly frequency < 3; classify `agent` otherwise; update `SellerProfile.seller_type` on each listing submission
- [X] T053 [US2] Implement `POST /auth/otp/request` controller in `backend/src/api/auth/auth.controller.ts`; validate Egyptian phone format `+201[0125]\d{8}`; apply 3/10min throttle per phone; return masked phone confirmation per api-spec.md
- [X] T054 [US2] Implement `POST /auth/otp/verify` controller in `backend/src/api/auth/auth.controller.ts`; max 5 attempts per phone (Redis counter, reset on success); set HTTP-only secure JWT cookie AND return token in body; return masked user object per api-spec.md
- [X] T055 [P] [US2] Implement `POST /auth/logout` controller; revoke session in `AuthSession` table; clear HTTP-only cookie
- [X] T056 [US2] Implement `ListingCreateService` in `backend/src/services/listing-create.service.ts`: validate all 9 required fields (purpose, type, size, bedrooms, bathrooms, finishing, price, location, photos ≥ 3); validate `ST_Within(location, cairo_boundary)` using PostGIS; set status to `submitted`; apply per-seller rate limit (owner: 5/day, agent: 20/day using Redis counter keyed to `listing_rate:{sellerId}`)
- [X] T057 [US2] Implement `POST /listings` endpoint in `backend/src/api/listings/seller-listings.controller.ts` (requires JWT + seller role); validate DTO with `class-validator`; call `ListingCreateService`; return `{id, status: 'submitted', message: 'Listing submitted for review'}`
- Note: Implemented as intentional draft-first flow: `POST /seller/listings` creates a draft ID, photos upload against that ID, then `PUT /seller/listings/:id` with `submit: true` performs final validation and transitions to `submitted`.
- [X] T058 [US2] Implement `PUT /listings/:id` endpoint in `backend/src/api/listings/seller-listings.controller.ts`; verify `listing.seller_id === req.user.id` (RBAC); allow updates only if status is `draft` or `rejected`; re-validate all required fields on submit
- [X] T059 [US2] Implement `POST /listings/:id/photos` multipart endpoint in `backend/src/api/listings/photos.controller.ts`; accept up to 10 files (`multipart/form-data`); for each: validate format/size, call `ImageProcessingService`; insert `Photo` records; return `{photos: [{id, url, order}]}`; reject with 400 if format invalid or > 5MB
- [X] T060 [P] [US2] Implement `DELETE /listings/:id/photos/:photoId` endpoint; verify ownership; delete `Photo` record and Cloudinary asset
- [X] T061 [US2] Create `AuthModule` in `backend/src/api/auth/auth.module.ts` and `SellerListingsModule` in `backend/src/api/listings/seller-listings.module.ts` wiring all services and controllers

### Frontend — US2

- [X] T062 [P] [US2] Create `PhoneAuthPage` in `frontend/src/pages/auth/login.tsx`: phone number input with `+20` prefix, Egyptian format validation (react-hook-form + zod), "Send OTP" button, loading state; on success show OTP entry step
- [X] T063 [US2] Implement OTP verification step in `frontend/src/pages/auth/login.tsx`: 6-digit OTP input with auto-advance between digits, 5-minute countdown timer with resend button (disabled during countdown), show error on invalid code, redirect to `/listings/create` on success
- [X] T064 [US2] Implement `authService` in `frontend/src/services/auth.service.ts`: `requestOtp(phone)`, `verifyOtp(phone, code)`, `logout()`; store JWT in `httpOnly` cookie (via backend) and user state in React context
- [X] T065 [P] [US2] Create `useAuth` hook in `frontend/src/hooks/useAuth.ts`: reads auth state, exposes `user`, `isAuthenticated`, `login()`, `logout()`; persists via `localStorage` for non-sensitive user metadata only
- [X] T066 [P] [US2] Create `ProtectedRoute` wrapper in `frontend/src/components/auth/ProtectedRoute.tsx`: redirect unauthenticated users to `/auth/login` with `returnUrl` query param; show loading skeleton during auth check
- [X] T067 [US2] Create `ListingCreatePage` in `frontend/src/pages/listings/create.tsx` (seller-protected): multi-section form with react-hook-form + zod validation; sections: (1) Purpose & Type, (2) Specs, (3) Location, (4) Photos, (5) Price; show progress stepper
- [X] T068 [US2] Implement map pin placement step in `frontend/src/pages/listings/create.tsx`: embed `react-map-gl` map with draggable marker; display "Place your property pin" instruction; show error if pin is placed outside Cairo boundary polygon; store `{lat, lng}` in form state
- [X] T069 [P] [US2] Create `PhotoUploadComponent` in `frontend/src/components/listing/PhotoUpload.tsx`: drag-drop zone + file picker, client-side format/size validation (jpg/png/webp, max 5MB per file), image preview thumbnails with remove button, show "min 3 photos required" counter, max 10 photos warning
- [X] T070 [US2] Connect `ListingCreatePage` form to backend API in `frontend/src/services/listings.service.ts`: `createListing(data)` → `POST /listings`, `uploadPhotos(listingId, files)` → multipart `POST /listings/:id/photos`; handle 400 validation errors by mapping to form field errors
- [X] T071 [US2] Implement draft auto-save in `ListingCreatePage`: save form state to `localStorage` on each field change (debounced 1s); on page load, detect and restore existing draft with "Continue your draft?" prompt
- [X] T072 [US2] Show submission success page in `frontend/src/pages/listings/submitted.tsx` after successful `POST /listings`; display "Your listing is pending admin review" message with listing ID; link to seller dashboard

**Checkpoint**: User Story 2 fully functional — sellers can register via OTP and submit structured listings for review

---

## Phase 5: User Story 3 — Admin Listing Approval Workflow (Priority: P3)

**Goal**: Admins review pending listings, see AI duplicate hints, and approve or reject with predefined reasons

**Independent Test**: Log in as admin (password + 2FA TOTP) → view moderation queue with pending listings ordered by time → click listing → see all fields + map pin + photos + duplicate hints panel → approve (listing becomes active on map) or reject with reason (seller sees reason in dashboard)

### Backend — US3

- [X] T073 [P] [US3] Create `AdminAction` TypeORM entity in `backend/src/models/admin-action.entity.ts` with fields: `id`, `admin_id (FK User)`, `action_type (approve/reject/unpublish/block_user)`, `target_listing_id (nullable FK)`, `target_user_id (nullable FK)`, `reason`, `notes`, `created_at`; index on `(admin_id, created_at)`
- [X] T074 [US3] Implement `AdminAuthService` in `backend/src/services/admin-auth.service.ts`: validate username + bcrypt password (min 12 chars, requires uppercase/lowercase/number/symbol); validate TOTP 2FA code using `speakeasy` library; issue JWT (8-hour expiry); rate limit 5 attempts per 15 min per IP
- [X] T075 [US3] Implement `DuplicateDetectionService` in `backend/src/services/duplicate-detection.service.ts`: query PostGIS `ST_DWithin(location, newListing.location, 50)` for nearby active/submitted listings; score confidence: +50 proximity, +20 same property_type, +15 size within 10%, +10 same bedrooms, +5 same seller; return hints sorted by confidence descending; only return hints with confidence ≥ 40
- [X] T076 [US3] Implement `POST /admin/login` endpoint in `backend/src/api/admin/admin-auth.controller.ts` per api-spec.md; return JWT and user object; apply IP-based rate limiting
- [X] T077 [US3] Implement `GET /admin/listings` endpoint in `backend/src/api/admin/admin-moderation.controller.ts` (admin JWT required); return all `status = 'submitted'` listings ordered by `submitted_at ASC`; include seller phone (admin-only, masked: show to admin but never in buyer-facing APIs)
- [X] T078 [US3] Implement `GET /admin/listings/:id` endpoint; return full listing details + call `DuplicateDetectionService` for hints; include `duplicateHints: [{listingId, confidence, reasons[]}]` in response
- [X] T079 [US3] Implement `POST /admin/listings/:id/approve` endpoint: set `listing.status = 'active'`, set `approved_at = now()`; insert `AdminAction` record; return `{success: true, status: 'active'}`
- [X] T080 [US3] Implement `POST /admin/listings/:id/reject` endpoint: body `{reason: RejectionReason, notes?: string}`; validate reason is one of: `incomplete_data`, `inaccurate_location`, `duplicate`, `spam_scam`; set `listing.status = 'rejected'`, set `rejection_reason`; insert `AdminAction`; create seller notification record
- [X] T081 [P] [US3] Implement `POST /admin/listings/:id/unpublish` endpoint: set `listing.status = 'inactive'`; insert `AdminAction`; only allowed for `status = 'active'` listings
- [X] T082 [P] [US3] Implement `POST /admin/users/:id/block` endpoint: set `user.status = 'blocked'`; insert `AdminAction`; invalidate all user sessions in `AuthSession`
- [X] T083 [US3] Create `AdminModule` in `backend/src/api/admin/admin.module.ts` registering all admin controllers and services with admin-role guard applied globally to all routes in the module

### Frontend — US3

- [X] T084 [P] [US3] Create `AdminLoginPage` in `frontend/src/pages/admin/login.tsx`: username/password fields + 6-digit TOTP code field; show specific error for invalid 2FA vs invalid credentials; no password reset link (admin accounts managed manually)
- [X] T085 [US3] Implement admin auth flow in `frontend/src/services/admin-auth.service.ts`: `adminLogin(credentials)`, store admin JWT separately from seller JWT; create `AdminProtectedRoute` that verifies `user.role === 'admin'`
- [X] T086 [US3] Create `AdminModerationQueue` page in `frontend/src/pages/admin/queue.tsx`: sortable table of pending listings (submission time, area, property type, price, seller type); "Review" button per row; show empty state "No pending listings" when queue is empty; show count badge in nav
- [X] T087 [US3] Create `AdminListingReview` page in `frontend/src/pages/admin/listings/[id].tsx`: full-width listing detail view for admins: all fields, photo gallery, interactive map showing pin location, seller phone (admin-only), submission metadata, duplicate hints panel
- [X] T088 [US3] Implement `DuplicateHintsPanel` component in `frontend/src/components/admin/DuplicateHintsPanel.tsx`: list each duplicate hint with confidence percentage bar, matching reasons list, link to the potentially duplicate listing in a side panel; show "No potential duplicates found" when empty
- [X] T089 [US3] Implement approve/reject action bar in `AdminListingReview` page: "Approve" button (green) triggers confirmation dialog → `POST /admin/listings/:id/approve`; "Reject" button (red) opens modal with rejection reason dropdown (4 predefined reasons + optional notes field) → `POST /admin/listings/:id/reject`; redirect back to queue on success
- [X] T090 [P] [US3] Create `AdminLayout` in `frontend/src/components/layout/AdminLayout.tsx` with sidebar navigation: Queue (with pending count), Settings; show logged-in admin username; logout button

**Checkpoint**: User Story 3 fully functional — admins can review, approve/reject listings with AI duplicate hints

---

## Phase 6: User Story 4 — Save Listings for Later (Priority: P4)

**Goal**: Buyers save favorite listings using browser localStorage (no account required), view saved listings page, unsave

**Independent Test**: Browse listings → click "Save" on 3 listings → navigate to `/saved` → see all 3 listings → click saved button again → listing removed → navigate away and return → saved listings persisted

### Backend — US4

- [X] T091 [P] [US4] Create `SavedListing` TypeORM entity in `backend/src/models/saved-listing.entity.ts` with fields: `id`, `buyer_id (nullable FK User)`, `listing_id (FK)`, `session_id (for anonymous)`, `created_at`; unique constraint on `(buyer_id, listing_id)` and `(session_id, listing_id)`
- [X] T092 [US4] Implement `GET /buyer/saved` endpoint in `backend/src/api/buyer/saved-listings.controller.ts`: accept `?listingIds=` query param (comma-separated UUIDs from localStorage); return matching active listings with `{id, title, price, thumbnail_url, area_name, status}`; filter out rejected/inactive listings silently
- [X] T093 [P] [US4] Create `BuyerModule` in `backend/src/api/buyer/buyer.module.ts` for saved listings and contact tracking endpoints

### Frontend — US4

- [X] T094 [P] [US4] Create `SaveButton` component in `frontend/src/components/listing/SaveButton.tsx`: heart icon toggle; reads/writes saved listing IDs to `localStorage` key `makaan_saved_listings`; show "Saved" filled state if already saved; accessible with ARIA labels
- [X] T095 [US4] Add `SaveButton` to `ListingPopup` (map popup) and `ListingDetailPage`; ensure visual state syncs if same listing is saved/unsaved from different views
- [X] T096 [US4] Implement `savedListingsService` in `frontend/src/services/saved.service.ts`: `getSavedIds()`, `saveListingId(id)`, `unsaveListingId(id)`, `isSaved(id)` — all operating on localStorage; emit `storage` events for cross-tab sync
- [X] T097 [P] [US4] Create `SavedListingsPage` in `frontend/src/pages/saved.tsx`: on mount, read IDs from localStorage and fetch listing data via `GET /buyer/saved?listingIds=...`; show grid of `ListingCard` components; show "No saved listings yet" empty state with "Browse listings" CTA

**Checkpoint**: User Story 4 fully functional — buyers can save/unsave listings with localStorage persistence

---

## Phase 7: User Story 5 — Seller Dashboard and Listing Management (Priority: P5)

**Goal**: Sellers view their listings, see engagement metrics, mark as sold/inactive, and edit/resubmit rejected listings

**Independent Test**: Log in as seller → dashboard shows 2+ listings with status badges and metrics → mark one as Sold (removed from map) → view rejected listing → see rejection reason → click Edit → update fields → resubmit → listing returns to Pending

### Backend — US5

- [X] T098 [US5] Implement `SellerDashboardService` in `backend/src/services/seller-dashboard.service.ts`: aggregate per-listing metrics from `View`, `SavedListing`, and `Inquiry` tables; compute `days_listed` from `submitted_at`; return seller type classification
- [X] T099 [US5] Implement `GET /seller/listings` endpoint in `backend/src/api/listings/seller-listings.controller.ts` (seller JWT required): return all listings by `req.user.id` with status, metrics summary `{view_count, save_count, contact_count, days_listed}`; ordered by `created_at DESC`
- [X] T100 [US5] Implement `GET /seller/listings/:id/metrics` endpoint: return detailed metrics `{view_count, save_count, contact_count, days_listed, views_last_7_days}` for seller's own listing only (RBAC check)
- [X] T101 [US5] Implement `PUT /listings/:id/status` endpoint (seller JWT): accept `{status: 'sold' | 'inactive'}`; only allowed if current status is `active`; set status and `updated_at`; sold/inactive listings hidden from buyer map immediately
- [X] T102 [US5] Implement `GET /seller/notifications` endpoint: return rejection notifications for seller's listings `{listing_id, rejection_reason, rejected_at, listing_title}`; mark as read on fetch
- [X] T103 [US5] Ensure `PUT /listings/:id` (from T058) supports seller editing rejected listings and resubmitting (sets status back to `submitted`); re-run all field validations; reset `rejection_reason` to null

### Frontend — US5

- [X] T104 [P] [US5] Create `SellerDashboard` page in `frontend/src/pages/seller/dashboard.tsx` (seller-protected): header with seller type badge (owner/agent) and verified badge if applicable; "Create New Listing" CTA button
- [X] T105 [US5] Create `ListingStatusCard` component in `frontend/src/components/seller/ListingStatusCard.tsx`: thumbnail, title, status badge (color-coded: draft=gray, pending=yellow, active=green, rejected=red, sold=purple), metrics row (👁 views, ❤️ saves, 📞 contacts, 📅 days listed), action buttons
- [X] T106 [US5] Implement seller listings list in `SellerDashboard` using `ListingStatusCard`; fetch from `GET /seller/listings`; show rejection notification banner if any listings were rejected since last login
- [X] T107 [US5] Implement "Mark as Sold" / "Mark as Inactive" action in `ListingStatusCard`: show confirmation dialog "Remove this listing from the map?" → `PUT /listings/:id/status`; update card status badge optimistically
- [X] T108 [US5] Implement rejection reason display: for rejected listings, show red notification "Rejected: [reason]" with explanation text; show "Edit & Resubmit" button that navigates to pre-filled `ListingEditPage`
- [X] T109 [US5] Create `ListingEditPage` in `frontend/src/pages/listings/[id]/edit.tsx` (seller-protected): pre-fill `ListingCreatePage` form with existing listing data (all fields, existing photos, existing map pin); on submit call `PUT /listings/:id`; show "Resubmitting for review" success state

**Checkpoint**: User Story 5 fully functional — sellers can manage their listings and respond to admin feedback

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Data seeding, security hardening, performance, dev tooling, infrastructure

- [ ] T110 Create Cairo data seeding script in `backend/src/database/seeds/cairo-areas.seed.ts`: insert Cairo boundary GeoJSON polygon into `cairo_areas` table as root area; insert 25+ named Cairo sub-areas (Nasr City, Zamalek, Maadi, Heliopolis, New Cairo, etc.) with real boundary polygons from public GeoJSON data; run via `npm run seed`
- [ ] T111 [P] Add `Helmet` middleware in `backend/src/main.ts` for security headers (CSP, HSTS, X-Frame-Options); configure CORS whitelist to `FRONTEND_URL` env var only; disable `x-powered-by` header
- [ ] T112 [P] Implement contact rate limiting in `backend/src/api/buyer/contact.controller.ts`: 50 WhatsApp/call actions per buyer (session ID) per day using Redis counter; return 429 when exceeded per FR-044
- [ ] T113 [US1] Add Redis caching for `GET /listings` search results: cache responses by bbox+filters hash for 2 minutes; invalidate cache when any listing status changes to/from `active`
- [ ] T114 [P] Create database indexes migration in `backend/src/database/migrations/002-add-indexes.ts`: composite index `(status, seller_id)` on listings; index `submitted_at` on listings; index `(listing_id, created_at)` on views; partial index `WHERE status = 'active'` on listings
- [ ] T115 [P] Setup Swagger/OpenAPI in `backend/src/main.ts` using `@nestjs/swagger`; auto-generate docs from NestJS decorators; available at `/api/docs` in non-production environments
- [ ] T116 [P] Configure Winston logger in `backend/src/config/logger.config.ts`: structured JSON logs with request ID, user ID (no phone), log level from `LOG_LEVEL` env var; integrate with `LoggingInterceptor` from T021
- [ ] T117 [P] Add Sentry error tracking in `backend/src/main.ts` and `frontend/src/pages/_app.tsx` using `SENTRY_DSN` env var; filter out 4xx errors from Sentry noise
- [ ] T118 Implement account deactivation endpoint `DELETE /users/me` in `backend/src/api/auth/auth.controller.ts`: set `user.status = 'deactivated'`, anonymize phone to `DELETED_[uuid]`, deactivate all listings, revoke all sessions per FR-047
- [ ] T119 [P] Add image malware scanning in `ImageProcessingService` (T023): integrate ClamAV via `clamscan` npm package (dev) or VirusTotal API (prod); reject upload with 422 if scan returns threat; log scan result without file contents
- [ ] T120 Implement "outside Cairo" detection on frontend: in `AreaSearchBar`, if Mapbox geocoding result bbox is outside Cairo metropolitan bbox `{sw: [28.9, 29.5], ne: [32.5, 31.5]}`, show toast "Makaan currently serves Cairo only" and do NOT fly to location
- [ ] T121 [P] Mobile responsiveness audit: verify map controls (zoom buttons, compass) have 44px minimum touch targets; verify filter panel is accessible as a bottom sheet on mobile; verify listing cards are readable on 375px viewport
- [ ] T122 Run `quickstart.md` full validation: `docker compose up` → seed data → `npm run dev` backend → `npm run dev` frontend → manually verify all 5 user story independent test scenarios pass end-to-end; document any deviations

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; all [P] tasks run in parallel
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user stories**
- **User Stories (Phase 3–7)**: All depend on Phase 2 completion
  - US1, US2, US3, US4, US5 can proceed in parallel after Phase 2 (with sufficient team)
  - Sequential priority order: US1 → US2 → US3 → US4 → US5 (single developer)
- **Polish (Phase 8)**: Depends on all desired user stories complete

### User Story Dependencies

- **US1 (P1)**: Independent after Foundational — only needs `Listing`, `CairoArea`, `User` entities (no seller auth)
- **US2 (P2)**: Independent after Foundational — builds on `Listing` entity, adds auth on top
- **US3 (P3)**: Depends on US2 existing listings to review — but independently testable with seeded test data
- **US4 (P4)**: Independent after US1 — needs listing search to work for browsing
- **US5 (P5)**: Depends on US2 — needs seller auth and created listings

### Within Each User Story

- Backend entities → Backend services → Backend controllers → Frontend pages → Frontend components → Integration wiring
- Models are parallel within a phase; services depend on models; controllers depend on services

### Parallel Opportunities

- T002, T003, T004, T005, T006, T008 run in parallel (Phase 1)
- T011–T017 (entity creation) run in parallel (Phase 2)
- T019, T020, T021, T022 (middleware) run in parallel (Phase 2)
- T027, T028 and T035, T036, T038, T039, T041, T043, T044, T045, T046, T047 run in parallel (US1)
- Backend and frontend tasks within each US can be parallelized across developers

---

## Parallel Example: User Story 1 (after Phase 2 complete)

```bash
# Parallel: Create entities
Task T027: Create View entity
Task T028: Create Inquiry entity

# Parallel: Backend services (after entities)
Task T029: ListingSearchService
Task T030: CairoAreaService

# Parallel: Frontend components (can start with mock API)
Task T035: MapPage
Task T036: ListingPin
Task T038: ListingPopup
Task T039: FilterPanel
Task T041: AreaSearchBar
Task T043: ListingDetailPage
Task T045: listings.service.ts

# Sequential: Wire together (after components exist)
Task T037: Add clustering to ListingPin
Task T040: Wire FilterPanel to map
Task T042: useListings hook
Task T044: ContactButtons
Task T046: Empty state
Task T047: Geolocation handling
Task T048: MapLayout split-view
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (2 days)
2. Complete Phase 2: Foundational (3 days) ← blocks everything
3. Complete Phase 3: User Story 1 (4 days)
4. **STOP AND VALIDATE**: Seed test listings, verify map loads, filters work, detail page works on mobile
5. Deploy to staging (Vercel + Railway.app)

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ready
2. Add US1 → Buyers can browse (MVP demo-ready!)
3. Add US2 → Sellers can submit listings (inventory grows)
4. Add US3 → Admins approve listings (quality gate live)
5. Add US4 → Buyers save favorites (engagement)
6. Add US5 → Sellers manage their listings (seller retention)

### Parallel Team Strategy (3 developers)

After Phase 1 + Phase 2 complete:
- **Dev A**: US1 backend + US1 frontend map/search
- **Dev B**: US2 backend (OTP, auth, listing create) + US2 frontend forms
- **Dev C**: US3 backend (admin moderation, duplicate detection) + US3 frontend admin dashboard

---

## Notes

- [P] = different files, no blocking dependencies on sibling [P] tasks
- [US#] maps task to user story for traceability and independent delivery
- No test tasks included — add explicitly if TDD approach is requested
- Phone numbers must NEVER appear in buyer-facing API responses (FR-043)
- OTP codes must NEVER be logged anywhere (FR-046)
- All admin actions must be logged with admin ID + timestamp (FR-031)
- Cairo boundary validation must happen server-side (FR-014) — client-side check is UX only
- Commit after each completed task or logical group of [P] tasks
- Stop at any phase checkpoint to validate the story independently before proceeding

