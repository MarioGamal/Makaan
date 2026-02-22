<!--
SYNC IMPACT REPORT
==================
Version change: [INITIAL] → 1.0.0
Modified principles: N/A (initial constitution creation)
Added sections:
  - Core Principles (7 principles from PRD)
  - Security & Privacy Requirements
  - Data Quality Standards
  - Development Workflow
  - Governance

Templates requiring updates:
  ✅ plan-template.md - Constitution Check section will reference these 7 principles
  ✅ spec-template.md - Requirements align with data quality and security principles
  ✅ tasks-template.md - Task categorization reflects security, quality, and approval workflow

Follow-up TODOs: None - all placeholders filled
==================
-->

# Makaan Constitution

## Core Principles

### I. Map-First Architecture (NON-NEGOTIABLE)

Every listing MUST have a verified geographic pin on the map. The map is the primary interface and source of truth for property search and discovery.

**Rules:**
- No listing can be published without a valid map pin
- All search queries MUST resolve to geographic boundaries
- Map interface takes precedence over text-based search in UI hierarchy
- Location accuracy is validated during admin review

**Rationale:** Buyers in Cairo's real estate market need precise location information. Vague addresses waste time and erode trust. Map-first design ensures location is never optional or inaccurate.

### II. Admin-Approved Quality Gate (NON-NEGOTIABLE)

All listings require explicit admin approval before becoming visible to buyers. No automated publishing.

**Rules:**
- Default listing state after submission is "pending"
- Only admin users can transition listings to "active" status
- Admins MUST validate: location accuracy, data completeness, photo relevance, duplicate risk, spam/scam indicators
- Rejected listings MUST include a predefined rejection reason
- Draft and rejected listings remain private to the seller

**Rationale:** Quality over volume. Manual curation prevents spam, duplicates, and low-quality listings that plague existing Egyptian real estate platforms.

### III. Data Quality Over Volume

Structured, complete, accurate listings are prioritized over rapid inventory growth.

**Rules:**
- All required fields MUST be filled before submission is allowed
- Required fields: purpose (sale/rent), property type, size, bedrooms, bathrooms, finishing, price, map pin, minimum photo count
- Incomplete listings cannot be submitted (submission blocked client-side and server-side)
- Success metrics emphasize data completeness (% valid pins, avg photos/listing) over listing count
- Duplicate detection MUST be performed during review

**Rationale:** Buyers waste time when data is missing. Sellers who provide complete information get better engagement. Trust is built through consistency.

### IV. One Canonical Listing Per Property

Each unique physical property MUST have only one active listing at any time to prevent broker spam and duplicate postings.

**Rules:**
- Admin review includes duplicate detection
- Same property cannot be listed by multiple sellers simultaneously
- AI hints assist admins in identifying potential duplicates (location + specs similarity)
- Sellers cannot repost rejected listings without admin approval

**Rationale:** Duplicate listings from brokers flooding the same property destroys buyer trust and creates noise. One canonical listing per property ensures clarity.

### V. Transparent Seller Identity

Seller type (owner vs agent) is inferred from behavior and disclosed to buyers. No masking of broker activity.

**Rules:**
- Seller type determined by: listing count, listing frequency, phone number reuse patterns
- Filters MUST allow buyers to exclude agent listings
- "Verified seller" badge awarded based on past listing quality and closed deals
- Agents face stricter rate limits and moderation thresholds

**Rationale:** Buyers in Egypt distrust brokers who masquerade as owners. Transparent seller identity allows informed decisions and builds marketplace credibility.

### VI. Security & Privacy by Default

User data, especially phone numbers and OTPs, MUST be protected. Security is not optional.

**Rules:**
- Phone-based OTP authentication with rate limiting and expiry
- Secure sessions via HTTP-only cookies
- Role-based access control (RBAC): users modify only their own listings; admins access moderation endpoints
- No PII exposed in public APIs
- Image uploads: jpg/png/webp only, max size enforced, EXIF stripped, server-side resizing
- Rate limiting on OTP, listing submission, and contact actions
- Admin accounts require strong passwords and mandatory 2FA
- Logging MUST mask phone numbers and NEVER log OTPs
- Account deactivation and listing removal supported for privacy compliance

**Rationale:** Egyptian users are sensitive to privacy and scams. Security builds trust. Rate limiting and CAPTCHA prevent abuse without harming legitimate users.

### VII. AI as Silent Assistant

AI assists admins and improves data quality but NEVER makes autonomous decisions or user-facing predictions.

**Rules:**
- AI used internally ONLY for: listing quality checks, duplicate likelihood hints, admin review assistance
- AI does NOT: auto-approve listings, predict prices, chat with users
- AI recommendations MUST be surfaced to admins as hints, not automatic actions
- No AI gimmicks or marketing language in user-facing product

**Rationale:** Trust is built through human judgment. AI accelerates admin work but does not replace accountability. Buyers want facts, not algorithmic predictions.

## Security & Privacy Requirements

### Authentication & Authorization

- Phone OTP with rate limiting (max 3 attempts per 10 minutes per number)
- OTP expiry: 5 minutes
- Secure session management via HTTP-only, secure cookies
- RBAC enforcement at API layer: users can only modify their own resources
- Admin endpoints require admin role verification

### Data Visibility & Privacy

- Only approved + active listings visible in public search/browse
- Draft, pending, and rejected listings MUST NOT appear in public APIs
- User phone numbers NEVER exposed in listing detail (only via WhatsApp/call intent)
- Saved listings and view history are private per user
- Account deactivation MUST remove or anonymize user data and unpublish listings

### File Upload Security

- Allowed formats: jpg, png, webp only
- Max file size: 5MB per image
- EXIF metadata stripped server-side to prevent location/device leaks
- Server-side image resizing and compression
- Object storage (e.g., S3, Cloudinary) for uploaded images
- Virus/malware scanning for uploads

### Abuse Prevention

- Rate limits:
  - OTP requests: 3 per 10 minutes per phone number
  - Listing submissions: 5 per day per user (owners), 20 per day (agents)
  - Contact actions (WhatsApp/call): 50 per day per user
- CAPTCHA triggered for suspicious activity patterns
- Admin moderation tools: unpublish listings, block users, track repeat offenders

### Admin Security

- Admin accounts separate from seller accounts (no dual roles)
- Strong password policy enforced (min 12 chars, complexity requirements)
- Mandatory 2FA for all admin accounts
- Admin actions logged with timestamp, admin ID, and action type
- Admin access logs retained for audit

### Logging & Monitoring

- Mask phone numbers in all logs (replace middle digits with ***)
- NEVER log OTP codes or tokens
- No sensitive data (passwords, tokens, full phone numbers) in error messages or stack traces
- Structured logging for security events: failed login attempts, suspicious activity, admin actions
- Log retention: 90 days minimum for security logs

## Data Quality Standards

### Listing Completeness

- All required fields enforced before submission (client and server validation)
- Photo minimum: 3 images
- Photo quality: min resolution 800x600, clear and relevant to property
- Price MUST be numeric, non-zero, in Egyptian Pounds (EGP)
- Map pin MUST be within Cairo geographic boundaries (bounding box validation)

### Duplicate Prevention

- Admin review checks for duplicates based on:
  - Geographic proximity (within 50 meters)
  - Matching property specs (type, size, bedrooms, bathrooms within 10% variance)
  - Same seller phone number
- AI hints flag potential duplicates with confidence score
- Admins can merge duplicates or reject redundant listings

### Seller Verification

- Phone number verified via OTP
- Seller type inferred from:
  - Listing count (3+ listings → likely agent)
  - Listing frequency (2+ listings per week → likely agent)
  - Phone number reuse in multiple listings → agent
- Verified badge awarded after: 1 successful sale/rent, no policy violations, 90 days account age

## Development Workflow

### Feature Development

1. All features MUST align with the 7 Core Principles
2. Features that compromise data quality or security are rejected
3. New features requiring manual review MUST NOT exceed admin capacity (< 5 min per listing target)
4. User-facing features MUST work on mobile-first (80% of Egyptian traffic is mobile)

### Code Review Gates

- Security review required for: authentication, authorization, file uploads, PII handling
- Data quality validation required for: listing creation, search/filter logic, admin moderation flows
- Privacy review required for: logging, analytics, third-party integrations
- Performance review required for: map rendering, image loading, search queries

### Testing Requirements

- Contract tests required for all public APIs
- Integration tests required for: authentication flows, listing approval workflows, search/filter logic
- Security tests required for: OTP rate limiting, RBAC enforcement, file upload validation
- Mobile browser testing required for all user-facing features (iOS Safari, Chrome Android)

### Deployment & Rollout

- Feature flags for new features to allow gradual rollout
- Admin features deployed first to internal team for dogfooding
- Buyer-facing features require admin team validation before public rollout
- Rollback plan required for features affecting: search, listing display, authentication

## Governance

This constitution supersedes all other development practices and product decisions. Any feature, design, or code change MUST comply with the Core Principles.

### Amendment Process

1. Proposed amendment documented with rationale and impact analysis
2. Amendment requires approval from: product owner, technical lead, at least one admin user
3. Amendment version incremented per semantic versioning:
   - MAJOR: Principle removal or redefinition (e.g., removing admin approval requirement)
   - MINOR: New principle added or section expansion (e.g., adding new security requirement)
   - PATCH: Clarifications, typo fixes, non-semantic wording improvements
4. All dependent templates (plan, spec, tasks) updated to reflect amendment
5. Existing features assessed for compliance with amended constitution

### Compliance Review

- All PRs/commits reviewed for constitutional compliance
- Plan phase MUST include "Constitution Check" gate before implementation
- Quarterly audit of features for drift from principles
- Complexity introduced MUST be justified against simpler alternatives in plan documentation

### Version History

- All amendments tracked in git history with clear commit messages
- Breaking changes (MAJOR version bumps) require migration plan for existing features
- Constitution changes communicated to all contributors via team channels

**Version**: 1.0.0 | **Ratified**: 2026-02-22 | **Last Amended**: 2026-02-22
