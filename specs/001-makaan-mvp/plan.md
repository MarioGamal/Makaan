# Implementation Plan: Makaan MVP - Map-First Real Estate Marketplace

**Branch**: `001-makaan-mvp` | **Date**: 2026-02-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from [specs/001-makaan-mvp/spec.md](spec.md)

## Summary

Build a map-first real estate marketplace for Cairo that prioritizes data quality over volume. Buyers browse properties via interactive map with filters. Sellers authenticate via phone OTP and create structured listings with required fields and map pins. Admins manually review and approve all listings before publication. AI assists admins by highlighting potential duplicates based on location and property specs. All 5 user stories (browse, seller auth/creation, admin approval, saved listings, seller dashboard) implemented as independently testable increments.

## Technical Context

**Language/Version**: TypeScript 5.0+ with Node.js 20 LTS (backend) + TypeScript 5.0+ (frontend)
**Primary Dependencies**: NestJS 10+ (backend), Next.js 16+ (frontend), PostgreSQL 16 + PostGIS 3.6 (database), Mapbox GL JS (mapping), Twilio (SMS OTP), Cloudinary (image storage), Sharp (image processing), OpenAI API (AI duplicate detection hints)
**Storage**: PostgreSQL 16 with PostGIS extension (relational + spatial data), Cloudinary (MVP image storage), Redis 7 (session + OTP caching)
**Testing**: Jest (unit tests), Supertest (API contract tests), Playwright (E2E mobile browser tests)
**Target Platform**: Web browsers (mobile-first: iOS Safari, Chrome Android) + Node.js server (backend) + Vercel/DigitalOcean (hosting)
**Project Type**: Full-stack web application (backend REST API + frontend SPA with SSR)
**Performance Goals**: 95% of map searches < 2 seconds (Mapbox vector tiles + PostGIS spatial indexes + Redis caching), OTP delivery < 30 seconds (Twilio SLA), admin review < 5 min per listing (AI duplicate hints)
**Constraints**: Mobile-first (80% traffic), Cairo geographic boundaries only, Egyptian Pounds (EGP) currency, manual admin approval (50-100 listings/day capacity), MVP budget ~$422/month
**Scale/Scope**: MVP targeting 200+ active listings, initial user base 1000-5000 users (buyers + sellers + admins), 8-week development timeline

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify this feature complies with the Makaan Constitution (`.specify/memory/constitution.md`):

**Core Principles Compliance:**
- [x] **I. Map-First Architecture**: ✅ All 5 user stories centered on map interface. FR-001: map pins primary display. FR-004: all searches resolve to geographic boundaries. Map takes UI precedence.
- [x] **II. Admin-Approved Quality Gate**: ✅ FR-024-031 enforce manual admin approval. FR-019: default status "Submitted/Pending". No automated publishing paths. User Story 3 dedicated to approval workflow.
- [x] **III. Data Quality Over Volume**: ✅ FR-013-015 enforce required fields with client+server validation. FR-013 lists all mandatory fields including 3+ photos and map pin. Submission blocked if incomplete.
- [x] **IV. One Canonical Listing Per Property**: ✅ FR-026: AI-assisted duplicate detection during admin review. Admin validates duplicates manually. Edge case documents duplicate rejection flow.
- [x] **V. Transparent Seller Identity**: ✅ FR-022: seller type inferred from behavior (listing count, frequency, phone reuse). FR-005: buyers can filter by seller type. Verified badge per constitution criteria.
- [x] **VI. Security & Privacy by Default**: ✅ FR-010-012, FR-041-048 cover OTP rate limiting, RBAC, PII protection, EXIF stripping, image scanning, logging masking, 2FA for admins.
- [x] **VII. AI as Silent Assistant**: ✅ FR-026 clarification: AI runs during admin review only, provides hints, admin makes final decision. No auto-approval or user-facing predictions.

**Security & Privacy Requirements:**
- [x] Authentication flows use phone OTP with proper rate limiting and expiry (FR-011: 30 sec delivery, 5 min expiry; FR-012: 3 attempts per 10 min)
- [x] Authorization enforces RBAC (FR-042: users modify own listings only, admin-only endpoints protected)
- [x] No PII exposed in public APIs (FR-043: phone numbers never exposed in listing details)
- [x] File uploads follow security requirements (FR-016-018: jpg/png/webp only, 5MB max, EXIF stripped, server-side resize/compress; FR-048: malware scan)
- [x] Rate limits applied to user actions (FR-012: OTP; FR-021: listing submissions; FR-044: contact actions)
- [x] Logging masks sensitive data (FR-045-046: mask phone numbers, never log OTPs)

**Data Quality Standards:**
- [x] Required fields enforced (FR-013-015: client and server validation, submission blocked if incomplete)
- [x] Duplicate detection mechanisms in place (FR-026: AI hints during admin review based on proximity + specs)
- [x] Cairo geographic boundary validation for map pins (FR-014: map pin within Cairo boundaries)

**Development Workflow:**
- [x] Feature aligns with all 7 Core Principles (verified above)
- [x] Mobile-first design (SC-010: iOS Safari, Chrome Android; 80%+ mobile traffic per assumptions)
- [x] Testing strategy includes contract/integration/security tests (Constitution mandates contract tests for APIs, integration for auth/approval workflows, security for OTP/RBAC/uploads)
- [x] Admin capacity impact assessed (SC-005: < 5 min per listing; assumptions: 50-100 listings/day capacity)

**Complexity Justification** (fill only if introducing new complexity):
- None required. All requirements align with constitution without violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-makaan-mvp/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── api-spec.md      # REST API endpoints
│   └── websocket-spec.md # Real-time map updates (if needed)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/              # Data models (User, Listing, Photo, etc.)
│   ├── services/            # Business logic (auth, listing mgmt, admin moderation)
│   ├── api/                 # API routes and controllers
│   │   ├── auth/           # OTP authentication endpoints
│   │   ├── listings/       # Listing CRUD, search, filter endpoints
│   │   ├── admin/          # Admin moderation endpoints
│   │   └── buyer/          # Buyer-facing endpoints (browse, save)
│   ├── middleware/          # RBAC, rate limiting, logging
│   ├── utils/              # Helper functions (image processing, geo validation)
│   └── ai/                 # AI duplicate detection service
└── tests/
    ├── contract/           # API contract tests
    ├── integration/        # Auth flows, approval workflows, search/filter
    └── unit/               # Service and utility unit tests

frontend/
├── src/
│   ├── components/         # Reusable UI components (Map, ListingCard, Filters)
│   ├── pages/              # Page components (HomePage, SellerDashboard, AdminDashboard)
│   │   ├── buyer/         # Browse, Search, Saved Listings pages
│   │   ├── seller/        # Create Listing, Dashboard pages
│   │   └── admin/         # Moderation Queue, Listing Review pages
│   ├── services/           # API client, auth state management
│   ├── hooks/              # Custom React hooks (useAuth, useMap, useListings)
│   ├── utils/              # Frontend utilities (validation, formatting)
│   └── assets/             # Static assets (icons, images)
└── tests/
    ├── integration/        # E2E user journey tests (Playwright/Cypress)
    └── unit/               # Component unit tests

shared/
├── types/                  # Shared TypeScript types (if using monorepo)
└── constants/              # Shared constants (property types, finishing levels, etc.)

infrastructure/
├── terraform/              # Infrastructure as code (optional for MVP)
└── docker/                 # Docker configs for local dev
```

**Structure Decision**: Web application structure chosen (Option 2) because feature requires frontend UI for buyers/sellers/admins and backend API for data management, authentication, and admin workflows. Monorepo approach with `backend/`, `frontend/`, and `shared/` directories supports independent deployment and shared type definitions. This aligns with constitution's mobile-first requirement and facilitates contract testing between frontend and backend.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations detected. All complexity is justified by constitutional requirements:
- Map integration: Required by Principle I (Map-First Architecture)
- Manual admin approval: Required by Principle II (Admin-Approved Quality Gate)
- AI duplicate detection hints: Justified by Principle VII (AI as Silent Assistant) - internal use only
- SMS OTP: Required by Principle VI (Security & Privacy by Default)
- Image processing (EXIF strip, resize): Required by Principle VI (Security & Privacy by Default)
- Rate limiting: Required by Principle VI (Security & Privacy by Default)
