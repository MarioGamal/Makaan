# Feature Specification: Makaan MVP - Map-First Real Estate Marketplace

**Feature Branch**: `001-makaan-mvp`
**Created**: 2026-02-22
**Status**: Draft
**Input**: User description: "we want to have MVP for this web app so let's do that and also note that we want to use claude's front end skill when creating UIs for this web app to be elegant and in line with real estate websites design with easy UX for the users"

## Clarifications

### Session 2026-02-22

- Q: How should OTP codes be delivered to sellers' phone numbers? → A: SMS via international provider (e.g., Twilio) for testing environment; SMS via local Egyptian provider (e.g., Vodafone, Orange, Etisalat business API) for production
- Q: How should sellers be notified when their listing is rejected by admin? → A: In-app notification only (visible when seller logs in to dashboard)
- Q: What are the allowed property type categories for residential listings in Cairo? → A: Apartment, Villa, Duplex, Penthouse, Studio, Townhouse, Chalet
- Q: What are the allowed finishing level options for property listings? → A: Semi-finished, Fully finished, Luxury finished
- Q: When should AI-powered duplicate detection run and provide hints to admins? → A: Duplicate detection hints during admin review only (AI assists admin decision)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and Search Listings via Map (Priority: P1)

Buyers can discover properties by exploring a map interface, applying filters, and viewing detailed listings without creating an account.

**Why this priority**: This is the core value proposition - buyers need to find properties quickly using Cairo's geography. Map-first search differentiates Makaan from fragmented Facebook groups and validates the primary hypothesis.

**Independent Test**: Can be fully tested by visiting the site, panning/zooming the map or searching by area name, applying filters, and viewing at least 5 different property listings with complete details.

**Acceptance Scenarios**:

1. **Given** a buyer visits Makaan homepage, **When** they view the map, **Then** they see active approved listings as map pins within Cairo boundaries
2. **Given** a buyer searches for "Nasr City", **When** the search completes, **Then** the map centers on Nasr City and displays only listings within that area
3. **Given** a buyer applies filters (price range, bedrooms, property type), **When** filters are applied, **Then** only matching listings appear on the map and results update in real-time
4. **Given** a buyer clicks a map pin, **When** the listing card appears, **Then** they see price, photos, specs, seller badge, and contact buttons (WhatsApp/call)
5. **Given** a buyer views a listing, **When** they click contact, **Then** WhatsApp or phone dialer opens with pre-filled seller contact

---

### User Story 2 - Seller Phone Authentication and Listing Creation (Priority: P2)

Sellers can sign up using phone OTP authentication and create property listings by filling required fields, placing a map pin, and uploading photos.

**Why this priority**: Without seller content, buyers have nothing to browse. This enables inventory growth while enforcing data quality through required fields.

**Independent Test**: Can be fully tested by registering with a phone number, receiving and entering OTP, creating a draft listing with all required fields and photos, placing a map pin, and submitting for approval.

**Acceptance Scenarios**:

1. **Given** a seller visits "Create Listing", **When** they enter their phone number, **Then** they receive an OTP code within 30 seconds
2. **Given** a seller enters a valid OTP, **When** they submit, **Then** they are authenticated and redirected to listing creation form
3. **Given** a seller fills listing form, **When** any required field is missing, **Then** submission is blocked with clear error messages
4. **Given** a seller completes all required fields (purpose, type, size, bedrooms, bathrooms, finishing, price, map pin, 3+ photos), **When** they submit, **Then** listing status changes to "Submitted" and awaits admin approval
5. **Given** a seller uploads photos, **When** photos exceed 5MB or are non-image formats, **Then** upload is rejected with error message

---

### User Story 3 - Admin Listing Approval Workflow (Priority: P3)

Admins can review pending listings, validate quality and accuracy, and approve or reject listings with predefined reasons.

**Why this priority**: Manual approval ensures data quality and prevents spam, but is only useful after P2 enables listing creation. This validates the quality-over-volume principle.

**Independent Test**: Can be fully tested by logging in as admin, viewing pending listings queue, reviewing a listing for completeness and duplicate risk, and approving or rejecting with feedback.

**Acceptance Scenarios**:

1. **Given** an admin logs in, **When** they navigate to moderation dashboard, **Then** they see all pending listings with submission timestamps
2. **Given** an admin reviews a listing, **When** they check details, **Then** they can validate location pin accuracy, photo relevance, data completeness, and potential duplicates
3. **Given** an admin approves a listing, **When** approval is confirmed, **Then** listing status changes to "Active" and becomes visible to buyers on the map
4. **Given** an admin rejects a listing, **When** selecting rejection reason (incomplete data, inaccurate location, duplicate, spam), **Then** listing status changes to "Rejected" and seller receives feedback
5. **Given** an admin identifies a duplicate, **When** reviewing similar listings (same location + specs), **Then** system highlights potential duplicates based on proximity and attributes

---

### User Story 4 - Save Listings for Later (Priority: P4)

Buyers can save favorite listings to view later without creating a full account, using browser storage or optional phone-based account.

**Why this priority**: Enhances buyer engagement and retention, but not critical for MVP validation. Buyers can still contact sellers directly without this feature.

**Independent Test**: Can be fully tested by browsing listings, clicking "Save" on 3+ properties, navigating away, returning, and seeing saved listings persist.

**Acceptance Scenarios**:

1. **Given** a buyer views a listing, **When** they click "Save" button, **Then** listing is added to saved items and button shows "Saved" state
2. **Given** a buyer has saved listings, **When** they view "Saved Listings" page, **Then** they see all saved properties with photos, price, and location
3. **Given** a buyer saved listings using browser storage, **When** they clear cookies/cache, **Then** saved listings are lost (expected behavior for MVP)
4. **Given** a buyer unsaves a listing, **When** they click "Saved" button again, **Then** listing is removed from saved items

---

### User Story 5 - Seller Dashboard and Listing Management (Priority: P5)

Sellers can view their listings, see engagement metrics (views, saves, contacts), and mark listings as sold or inactive.

**Why this priority**: Provides seller value and encourages listing updates, but not essential for initial marketplace validation. Sellers can still create listings without this.

**Independent Test**: Can be fully tested by logging in as seller with 2+ listings, viewing dashboard with status and metrics, and marking one listing as sold.

**Acceptance Scenarios**:

1. **Given** a seller logs in, **When** they view dashboard, **Then** they see all their listings with status (draft, pending, active, rejected, sold)
2. **Given** a seller views an active listing, **When** they check metrics, **Then** they see view count, save count, and days listed
3. **Given** a seller has a sold property, **When** they mark listing as "Sold", **Then** listing is removed from public map and status updates
4. **Given** a seller has a rejected listing, **When** they view rejection reason, **Then** they can edit and resubmit with corrections

---

### Edge Cases

- What happens when a seller tries to submit a listing without a map pin? Submission is blocked with error message.
- What happens when a buyer searches for an area outside Cairo? Search returns no results with message "Makaan currently serves Cairo only".
- What happens when admin approval queue is empty? Dashboard shows "No pending listings" message.
- What happens when a seller receives OTP but doesn't enter it within 5 minutes? OTP expires and seller must request a new code.
- What happens when the same property is listed by two different sellers? Admin review flags potential duplicate and rejects redundant listing.
- What happens when a buyer applies filters that match zero listings? Map shows "No listings match your filters" with option to clear filters.
- What happens when seller uploads 10+ photos? System accepts first 10 and shows warning about limit.
- What happens when seller rate limit is exceeded (5 listings/day for owners, 20/day for agents)? Submission is blocked with message showing limit reset time.
- What happens when admin tries to approve a listing with invalid data? System prevents approval and highlights missing/invalid fields.
- What happens when buyer's location services are disabled? Map defaults to Cairo city center view.

## Requirements *(mandatory)*

### Functional Requirements

#### Search & Discovery (Buyer)

- **FR-001**: System MUST display all active approved listings as map pins on an interactive map of Cairo
- **FR-002**: System MUST support text search by Cairo area name with autocomplete suggestions
- **FR-003**: System MUST support map pan and zoom for browsing listings geographically
- **FR-004**: System MUST resolve all search queries (text or map interaction) to geographic boundaries
- **FR-005**: Buyers MUST be able to filter listings by: sale/rent, price range, property type (Apartment, Villa, Duplex, Penthouse, Studio, Townhouse, Chalet), bedrooms, bathrooms, seller type (owner/agent)
- **FR-006**: System MUST update map pins and listing results in real-time when filters change
- **FR-007**: System MUST display listing details including: price, property specs, photo gallery, seller badge, map pin, contact options, days listed
- **FR-008**: Buyers MUST be able to contact sellers via WhatsApp button or call button (no in-app chat)
- **FR-009**: System MUST show only approved and active listings to buyers (draft, pending, rejected, sold, inactive listings hidden)

#### Listing Creation (Seller)

- **FR-010**: Sellers MUST authenticate using phone number and OTP code
- **FR-011**: System MUST send OTP via SMS (international provider like Twilio for testing, local Egyptian provider like Vodafone/Orange/Etisalat for production) within 30 seconds of request and expire OTP after 5 minutes
- **FR-012**: System MUST rate limit OTP requests to 3 attempts per 10 minutes per phone number
- **FR-013**: System MUST require these fields before listing submission: purpose (sale/rent), property type, size, bedrooms, bathrooms, finishing level (Semi-finished, Fully finished, Luxury finished), price, map pin coordinates, minimum 3 photos
- **FR-014**: System MUST validate map pin is within Cairo geographic boundaries
- **FR-015**: System MUST block listing submission if any required field is incomplete
- **FR-016**: System MUST accept image uploads in jpg, png, webp formats only with max 5MB per file
- **FR-017**: System MUST strip EXIF metadata from uploaded photos
- **FR-018**: System MUST resize and compress uploaded photos server-side
- **FR-019**: System MUST set listing status to "Submitted/Pending" after seller submission
- **FR-020**: Sellers MUST be able to save draft listings and return later to complete
- **FR-021**: System MUST enforce rate limits: 5 listings per day for owner sellers, 20 per day for agent sellers
- **FR-022**: System MUST infer seller type (owner vs agent) based on listing count, frequency, and phone number reuse

#### Admin Moderation

- **FR-023**: Admins MUST authenticate with strong password (min 12 chars, complexity requirements) and mandatory 2FA
- **FR-024**: System MUST display all pending listings in admin moderation queue ordered by submission time
- **FR-025**: Admins MUST be able to review listing details including: all fields, photos, map pin accuracy, submission metadata
- **FR-026**: System MUST use AI to highlight potential duplicate listings during admin review based on geographic proximity (within 50 meters) and similar specs (AI hints shown to admin, admin makes final decision)
- **FR-027**: Admins MUST be able to approve listings, changing status to "Active" and making them visible to buyers
- **FR-028**: Admins MUST be able to reject listings with predefined reasons: incomplete data, inaccurate location, duplicate, spam/scam
- **FR-029**: System MUST display rejection notification with reason in seller dashboard (in-app notification visible on login)
- **FR-030**: Admins MUST be able to unpublish active listings and block user accounts
- **FR-031**: System MUST log all admin actions with timestamp, admin ID, and action type

#### Saved Listings (Buyer)

- **FR-032**: Buyers MUST be able to save/unsave listings while browsing
- **FR-033**: System MUST persist saved listings using browser storage for unauthenticated buyers
- **FR-034**: System MUST display all saved listings with photos, price, and location
- **FR-035**: Buyers MUST be able to remove listings from saved items

#### Seller Dashboard

- **FR-036**: Sellers MUST be able to view all their listings with current status
- **FR-037**: System MUST display engagement metrics for each listing: view count, save count, days listed
- **FR-038**: Sellers MUST be able to mark active listings as "Sold" or "Inactive"
- **FR-039**: Sellers MUST be able to view rejection reasons for rejected listings
- **FR-040**: Sellers MUST be able to edit and resubmit rejected listings

#### Security & Privacy

- **FR-041**: System MUST use HTTP-only secure cookies for session management
- **FR-042**: System MUST enforce role-based access control: users can only modify their own listings, admin endpoints require admin role
- **FR-043**: System MUST NOT expose user phone numbers in public APIs or listing details
- **FR-044**: System MUST rate limit contact actions (WhatsApp/call) to 50 per day per buyer
- **FR-045**: System MUST mask phone numbers in all logs (replace middle digits with ***)
- **FR-046**: System MUST NEVER log OTP codes or authentication tokens
- **FR-047**: System MUST support account deactivation and remove/anonymize user data
- **FR-048**: System MUST scan uploaded images for malware/viruses

### Key Entities

- **User**: Represents both buyers and sellers; has phone number (unique identifier), authentication session, user type (buyer/seller/admin), account creation date, status (active/blocked)

- **Seller Profile**: Extends User for sellers; has seller type (owner/agent inferred from behavior), listing count, listing frequency, verified badge status, verification criteria (successful sales, policy compliance, account age)

- **Listing**: Represents a property for sale or rent; has purpose (sale/rent), property type (Apartment, Villa, Duplex, Penthouse, Studio, Townhouse, Chalet), size (square meters), bedrooms count, bathrooms count, finishing level (Semi-finished, Fully finished, Luxury finished), price (EGP), map pin coordinates, photos (array of image URLs), status (draft/submitted/active/rejected/sold/inactive), seller reference, submission timestamp, approval timestamp, rejection reason, view count, save count, contact count

- **Cairo Area**: Represents named geographic areas in Cairo; has area name, geographic boundary polygon, parent/child relationships for hierarchical areas

- **Photo**: Represents listing images; has image URL, upload timestamp, display order, metadata (original filename, processed dimensions)

- **Saved Listing**: Represents buyer's saved properties; has buyer reference, listing reference, save timestamp

- **View**: Represents listing view event; has listing reference, viewer (anonymous or user), timestamp, source (map click, search result, direct link)

- **Inquiry**: Represents buyer contact action; has listing reference, buyer reference (optional), contact method (WhatsApp/call), timestamp

- **Admin**: Represents admin users; has admin account credentials, 2FA settings, action log history

- **Admin Action**: Represents moderation activity; has admin reference, action type (approve/reject/unpublish/block), target (listing or user), timestamp, reason/notes

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Buyers can find relevant property listings within 2 minutes of arriving on the site using map or area search
- **SC-002**: 90% of submitted listings have all required fields completed and valid map pins
- **SC-003**: Average 5+ photos per listing across all active properties
- **SC-004**: Duplicate listing rate below 5% (flagged and rejected during admin review)
- **SC-005**: Admin can review and approve/reject a listing in under 5 minutes on average
- **SC-006**: Each active listing receives at least 10 views within first 7 days
- **SC-007**: At least 20% of listing views result in contact actions (WhatsApp/call)
- **SC-008**: Sellers mark listings as sold or inactive within 30 days of property transaction
- **SC-009**: 95% of map searches return results in under 2 seconds
- **SC-010**: Site functions properly on mobile browsers (iOS Safari, Chrome Android) with touch-friendly map controls
- **SC-011**: Zero security incidents related to OTP bypass, unauthorized data access, or PII exposure during MVP period
- **SC-012**: Admin approval rejection rate between 10-30% indicating quality enforcement without excessive friction

### Assumptions

- Cairo geographic boundaries are defined as the Greater Cairo metropolitan area
- Sellers have access to WhatsApp and phone for verification and buyer contact
- Buyers primarily use mobile devices (80%+ mobile traffic expected)
- Admin team can process 50-100 listings per day during MVP
- Average listing lifespan is 30-60 days before sold/inactive
- Initial inventory target is 200+ active listings to validate buyer engagement
- Property photos are taken by sellers using smartphones (no professional photography required)
- Buyers are comfortable using WhatsApp and phone calls (no in-app messaging needed)
- Admin moderation is manual for MVP; AI hints assist with duplicate detection during review but don't auto-approve or block listings
- Listing price is always in Egyptian Pounds (EGP)
- Long-term rentals only (monthly/yearly); no short-term/vacation rentals
- Residential properties only for MVP

### Development & Deployment Phases

**Phase 1: Local Development (Weeks 1-6) - $0/month**
- Docker Compose (PostgreSQL + PostGIS + Redis) runs locally
- Mock OTP service (no real SMS) for authentication testing
- Cloudinary free tier (25GB storage) for image uploads
- Mapbox free tier (50k loads/month) for map testing
- No cloud hosting needed - all development on local machine

**Phase 2: Staging/Testing (Week 7) - $0-5/month**
- Railway.app: $5 free credit covers backend + database hosting
- Vercel: FREE frontend hosting with automatic deployments
- Mock OTP or Twilio test credentials (magic numbers) - no SMS costs
- Cloudinary free tier continues
- Mapbox free tier continues

**Phase 3: Limited Production Test (Week 8) - ~$56/month**
- DigitalOcean: $6/month droplet (1GB RAM, supports 100 users)
- Twilio: $50/month (250 users × 2 OTPs × $0.10 via Egyptian SMS carrier)
- All other services remain on free tiers

**Post-MVP Scale (1000+ users) - ~$422/month**
- Upgrade hosting as needed based on actual traffic
- Switch to local Egyptian SMS provider for cost savings (60% reduction)
- Consider S3 + CloudFront migration from Cloudinary at scale
