# Technology Stack Research: Makaan MVP

**Feature Branch**: `001-makaan-mvp`
**Created**: 2026-02-22
**Purpose**: Technology stack recommendations for map-first real estate marketplace

## Executive Summary

This document provides comprehensive technology stack recommendations for the Makaan MVP based on the requirements specified in [spec.md](spec.md) and [plan.md](plan.md). Recommendations prioritize mobile-first performance, security by default, data quality, and rapid MVP delivery for the Egyptian market.

**Key Recommendations:**
- **Backend**: Node.js + NestJS + TypeScript
- **Frontend**: Next.js (React framework)
- **Database**: PostgreSQL 16+ with PostGIS extension
- **Map Library**: Mapbox GL JS
- **Image Processing**: Sharp (Node.js)
- **Object Storage**: Cloudinary (MVP), AWS S3 + CloudFront (scale)
- **SMS Provider**: Twilio (testing), local Egyptian carrier API (production)
- **AI Duplicate Detection**: Rule-based + OpenAI embeddings hybrid
- **Testing**: Jest + Supertest + Playwright

---

## 1. Backend Framework

### RECOMMENDATION: Node.js + NestJS + TypeScript

**Rationale:**
- **Type Safety**: TypeScript provides compile-time type checking, reducing runtime errors and improving code maintainability - critical for security-sensitive features (OTP, RBAC, admin actions)
- **Architecture**: NestJS provides opinionated, modular architecture with built-in dependency injection, perfect for enterprise-level features (admin moderation, rate limiting, RBAC)
- **Developer Experience**: Excellent for rapid MVP development with decorators, middleware, and guards that align with security requirements (FR-041-048)
- **Ecosystem**: Massive npm ecosystem for integrations (Twilio, Cloudinary, PostGIS drivers, OpenAI)
- **Performance**: Node.js handles concurrent connections efficiently - essential for real-time map searches and OTP delivery (SC-009: 95% searches < 2 seconds)
- **Team Hiring**: Easier to find Node.js/TypeScript developers in Egypt compared to Python specialists

**Alternatives Considered:**

| Framework | Pros | Cons | Why Rejected |
|-----------|------|------|--------------|
| **Express.js** | Simple, flexible, massive ecosystem | No built-in structure, requires manual RBAC/validation setup | Lacks architectural guardrails needed for complex admin workflows and security requirements |
| **Python + FastAPI** | Excellent for AI/ML integration, modern async | Smaller ecosystem for spatial queries, 2-6x slower than Node.js in benchmarks | Performance gap and weaker PostGIS driver ecosystem |
| **Python + Django** | Batteries-included, mature ORM | Synchronous by default, heavier framework, slower for real-time API responses | Overkill for MVP, performance concerns for mobile-first requirements |

**Constitution Alignment:**
- **Principle VI (Security by Default)**: NestJS guards/interceptors enforce RBAC, rate limiting, validation out-of-the-box
- **Principle III (Data Quality)**: Class-validator decorators ensure required fields, TypeScript interfaces prevent data inconsistencies
- **Mobile-First**: Node.js async nature ensures fast API responses for mobile clients

**Key Dependencies:**
- `@nestjs/core`, `@nestjs/common` - Core framework
- `@nestjs/typeorm` - Database ORM integration
- `typeorm` - ORM with PostGIS support
- `class-validator`, `class-transformer` - Request validation
- `@nestjs/passport`, `@nestjs/jwt` - Authentication
- `@nestjs/throttler` - Rate limiting
- `sharp` - Image processing
- `twilio` - SMS provider
- `openai` - AI duplicate detection

---

## 2. Frontend Framework

### RECOMMENDATION: Next.js 16+ (React framework)

**Rationale:**
- **Mobile Performance**: Next.js 16 Server Components reduce bundle size sent to mobile clients, improving load times on slower Egyptian 3G/4G networks
- **SEO**: Server-side rendering (SSR) critical for buyer-facing listing pages to appear in Google search results - important for organic traffic growth
- **Image Optimization**: Built-in `next/image` component automatically optimizes property photos for different screen sizes and formats (WebP support)
- **Developer Ecosystem**: Largest component library ecosystem (Material-UI, Chakra, Tailwind) for elegant real estate UIs as per requirements
- **API Routes**: Built-in API routes useful for serverless functions (e.g., OTP generation, webhook handlers)
- **Hiring**: React developers are most abundant in Egypt's job market

**Alternatives Considered:**

| Framework | Pros | Cons | Why Rejected |
|-----------|------|------|--------------|
| **React (CRA)** | Simple, flexible, no framework lock-in | No SSR, manual optimization needed, larger bundles | Missing SSR for SEO, no built-in image optimization |
| **Vue.js 3** | Smaller bundle size, excellent DX, good mobile performance | Smaller ecosystem, fewer real estate UI component libraries | Limited elegant UI templates for real estate websites |
| **Svelte/SvelteKit** | Best raw performance (3x faster DOM manipulation), smallest bundles (1.6KB runtime) | Smallest ecosystem, harder to hire developers in Egypt | Ecosystem immaturity and hiring challenges outweigh performance gains for MVP |

**Constitution Alignment:**
- **Mobile-First**: Server Components reduce JavaScript shipped to mobile browsers, Next.js image optimization ensures fast property photo loading
- **Principle I (Map-First)**: React ecosystem has mature mapping integrations (react-map-gl for Mapbox)
- **Performance**: SC-009 (95% searches < 2s) achievable with Next.js SSR + edge caching

**Key Dependencies:**
- `next` - Framework
- `react`, `react-dom` - Core React
- `react-map-gl` - Mapbox integration for React
- `swr` or `@tanstack/react-query` - Data fetching/caching
- `tailwindcss` - Utility-first CSS framework
- `headlessui` or `shadcn/ui` - Accessible UI components
- `react-hook-form` + `zod` - Form validation
- `next-auth` - Authentication (optional)

---

## 3. Database

### RECOMMENDATION: PostgreSQL 16+ with PostGIS 3.6+ Extension

**Rationale:**
- **Spatial Queries**: PostGIS provides production-ready spatial indexing (GiST/SP-GiST) for fast map searches and duplicate detection within 50m radius (FR-026)
- **Performance**: Spatial indexes accelerate bounding box queries, distance searches, and Cairo boundary validation (FR-014) to meet SC-009 (95% searches < 2s)
- **ACID Compliance**: Required for listing approval workflows, admin actions, and financial data (listing prices)
- **Real Estate Proven**: Used by major real estate platforms worldwide for location-based property search
- **Data Quality**: PostgreSQL constraints (NOT NULL, CHECK, UNIQUE) enforce FR-013-015 required field validation at database level
- **Mature Ecosystem**: Excellent TypeORM and Sequelize support for Node.js, widespread hosting availability in Egypt

**Alternatives Considered:**

| Database | Pros | Cons | Why Rejected |
|----------|------|------|--------------|
| **MySQL + Spatial** | Widely hosted, familiar to many developers | Weaker spatial query performance, less mature spatial indexing than PostGIS | PostGIS is industry standard for geospatial applications |
| **MongoDB + GeoJSON** | Flexible schema, native GeoJSON support | No ACID transactions (until v4+), weaker spatial query optimization, schema flexibility undermines data quality requirements | Principle III requires structured data; NoSQL schema flexibility conflicts with required field enforcement |

**Constitution Alignment:**
- **Principle I (Map-First)**: PostGIS is the gold standard for geographic queries; ST_Within, ST_DWithin, ST_Intersects functions support all spatial requirements
- **Principle III (Data Quality)**: Relational constraints enforce required fields, prevent incomplete submissions
- **Principle IV (One Canonical Listing)**: Spatial proximity queries (ST_DWithin) enable duplicate detection within 50m

**Key Spatial Features Needed:**
- `ST_Within(point, cairo_boundary)` - Validate map pins within Cairo (FR-014)
- `ST_DWithin(point1, point2, 50)` - Find duplicates within 50m radius (FR-026)
- `ST_Intersects(listing_point, area_polygon)` - Area-based search (FR-002, FR-004)
- `ST_Distance(point1, point2)` - Calculate listing proximity for ranking
- GiST index on `location` column for fast spatial queries

**Schema Highlights:**
```sql
CREATE EXTENSION postgis;

CREATE TABLE listings (
  id UUID PRIMARY KEY,
  location GEOGRAPHY(POINT, 4326) NOT NULL, -- WGS84 lat/long
  purpose VARCHAR(10) NOT NULL CHECK (purpose IN ('sale', 'rent')),
  property_type VARCHAR(20) NOT NULL,
  price DECIMAL(12,2) NOT NULL CHECK (price > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'submitted',
  -- ... other fields
  CONSTRAINT valid_cairo_location CHECK (
    ST_Within(location::geometry, (SELECT boundary FROM cairo_boundary))
  )
);

CREATE INDEX idx_listings_location ON listings USING GIST(location);
CREATE INDEX idx_listings_status ON listings(status) WHERE status = 'active';
```

---

## 4. Map Library

### RECOMMENDATION: Mapbox GL JS

**Rationale:**
- **Mobile Performance**: WebGL-based rendering offloads work to GPU, ensuring smooth interactions on mobile devices (iOS Safari, Chrome Android) - critical for 80% mobile traffic
- **Vector Tiles**: Efficient data transfer and rendering for thousands of listing pins without performance degradation
- **Touch Support**: Native touch gestures (pinch-to-zoom, pan, rotate) work flawlessly on mobile browsers
- **Customization**: Full control over pin styling, clustering, popups - needed for seller badges, property type icons, price labels
- **Cairo Basemap**: Excellent coverage of Cairo streets, neighborhoods, landmarks in English and Arabic
- **Developer Experience**: Mature React integration (react-map-gl), comprehensive documentation, active community

**Alternatives Considered:**

| Library | Pros | Cons | Why Rejected |
|---------|------|------|--------------|
| **Google Maps** | Best overall map data quality, universal brand recognition | Expensive pricing ($7/1000 map loads after free tier), limited customization, requires Google Cloud account | Cost prohibitive for MVP with potential 1000-5000 users; pricing uncertainty for scale |
| **Leaflet** | Lightweight (40KB), simple API, free, good for basic maps | DOM-based rendering struggles with 200+ pins, limited mobile touch optimization, no WebGL acceleration | Performance concerns with target 200+ listings; SC-009 (95% searches < 2s) at risk with many pins |
| **OpenStreetMap (Leaflet)** | Completely free, community-driven data | Same performance limitations as Leaflet, requires custom tile server setup, Cairo data quality varies | Performance and setup complexity outweigh cost savings for MVP |

**Constitution Alignment:**
- **Principle I (Map-First)**: Mapbox GL is designed for map-centric applications; vector tiles ensure map remains performant as primary interface
- **Mobile-First**: WebGL rendering and touch optimization meet 80% mobile traffic requirement
- **Performance**: Vector tile caching and GPU rendering support SC-009 (95% searches < 2s)

**Key Features Utilized:**
- **Markers/Pins**: Custom HTML markers with seller badges, property type icons
- **Clustering**: Automatic pin clustering when zoomed out to avoid visual clutter
- **Popups**: Listing preview cards on pin click
- **Geocoding**: Mapbox Geocoding API for area name search (FR-002)
- **Boundary Filtering**: GeoJSON layers for Cairo administrative boundaries
- **Mobile Gestures**: Two-finger pan, pinch-zoom, rotation

**Pricing Analysis (MVP Scale):**
- **Free Tier**: 50,000 map loads/month - sufficient for MVP
- **Beyond Free**: $5/1,000 loads - predictable pricing for scale
- **Geocoding**: 100,000 requests/month free - ample for area search

**Implementation Example:**
```typescript
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

function ListingMap({ listings }) {
  return (
    <Map
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{
        latitude: 30.0444, // Cairo center
        longitude: 31.2357,
        zoom: 11
      }}
      mapStyle="mapbox://styles/mapbox/streets-v12"
    >
      {listings.map(listing => (
        <Marker
          key={listing.id}
          latitude={listing.location.lat}
          longitude={listing.location.lng}
        >
          <ListingPin listing={listing} />
        </Marker>
      ))}
    </Map>
  );
}
```

---

## 5. Image Processing & Storage

### RECOMMENDATION: Sharp (Node.js) + Cloudinary (MVP) → AWS S3 + CloudFront (Scale)

**Image Processing: Sharp**

**Rationale:**
- **Performance**: 5-10x faster than Pillow for resize/compress operations - critical for handling seller photo uploads without server bottlenecks
- **Security**: Strips EXIF metadata by default (FR-017), preventing GPS location leaks from seller smartphone photos
- **Memory Efficiency**: Streaming-based processing handles 5MB images without excessive memory usage
- **Format Support**: jpg/png/webp input, automatic WebP conversion for mobile browsers
- **Native Integration**: Pure Node.js, no Python dependencies needed

**Alternatives Considered:**

| Tool | Pros | Cons | Why Rejected |
|------|------|------|--------------|
| **Pillow (Python)** | Mature, feature-rich | Requires Python backend (we chose Node.js), slower performance, manual EXIF stripping | Backend language mismatch, performance gap |
| **Cloudinary Transformations** | No server-side processing needed, automatic optimization | Vendor lock-in, expensive beyond free tier, network dependency for processing | Better used as storage layer; want server-side control for security (EXIF strip, malware scan) |

**Object Storage: Cloudinary (MVP Phase)**

**Rationale for MVP:**
- **Zero Setup**: Pre-integrated CDN (Akamai/Fastly/CloudFront), no infrastructure configuration needed
- **Automatic Optimization**: Serves WebP to modern browsers, JPEG to older browsers - improves mobile load times
- **Responsive Images**: On-the-fly resizing based on device screen size - reduces bandwidth for mobile users
- **Free Tier**: 25GB storage, 25GB bandwidth/month - sufficient for MVP with 200 listings × 5 photos = 1000 images
- **Developer Experience**: Simple Node.js SDK, 30-minute integration

**Migration Path: AWS S3 + CloudFront (Post-MVP Scale)**

**Rationale for Scale:**
- **Cost**: At 100k+ monthly visitors, S3+CloudFront becomes 40-60% cheaper than Cloudinary
- **Control**: Full ownership of image pipeline, no vendor lock-in
- **Flexibility**: Custom caching rules, multi-region replication for global expansion

**Transition Trigger:**
- Monthly active users > 10,000
- Image bandwidth > 100GB/month
- Budget constraints require cost optimization

**Constitution Alignment:**
- **Principle VI (Security by Default)**: Sharp strips EXIF by default (FR-017), file type validation prevents malware (FR-016, FR-048)
- **Mobile-First**: Cloudinary automatic WebP conversion and responsive images reduce mobile data usage and load times
- **Data Quality**: Server-side image validation ensures only jpg/png/webp, max 5MB (FR-016)

**Image Processing Pipeline:**
```typescript
import sharp from 'sharp';
import { v2 as cloudinary } from 'cloudinary';

async function processAndUploadPhoto(fileBuffer: Buffer, listingId: string) {
  // 1. Validate format and size (FR-016)
  const metadata = await sharp(fileBuffer).metadata();
  if (!['jpeg', 'png', 'webp'].includes(metadata.format)) {
    throw new Error('Invalid image format');
  }

  // 2. Strip EXIF, resize, compress (FR-017, FR-018)
  const processed = await sharp(fileBuffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  // 3. Upload to Cloudinary
  const result = await cloudinary.uploader.upload_stream(
    { folder: `listings/${listingId}`, resource_type: 'image' },
    processed
  );

  return result.secure_url;
}
```

---

## 6. SMS Provider (OTP Authentication)

### RECOMMENDATION: Twilio (Testing/Staging) → Local Egyptian Carrier API (Production)

**Twilio for Testing/Staging:**

**Rationale:**
- **Reliability**: 99.95% uptime SLA, proven OTP delivery infrastructure
- **Egypt Coverage**: Supports all major Egyptian carriers (Vodafone, Orange, Etisalat, WE) as of 2026
- **Developer Experience**: Excellent Node.js SDK, comprehensive documentation, 30-minute integration
- **Testing**: Free trial credits, sandbox mode for development without real SMS costs
- **Compliance**: Built-in rate limiting, delivery tracking, automatic retry logic

**Pricing (2026):**
- **Egypt Outbound SMS**: $0.3959 per message
- **Sender ID Registration**: Required (~3 weeks, one-time setup)
- **MVP Cost Estimate**: 1000 users × 2 OTPs (signup + occasional re-auth) = 2000 SMS × $0.40 = $800/month

**Local Egyptian Carrier for Production:**

**Rationale:**
- **Cost Savings**: 50-70% cheaper than Twilio ($0.10-0.15 per SMS vs $0.40)
- **Direct Carrier Relationship**: Better delivery rates, priority routing during network congestion
- **Local Support**: Arabic-speaking support teams, understanding of Egyptian regulations
- **Compliance**: Simplified sender ID registration through direct carrier relationship

**Recommended Carriers:**
1. **Vodafone Egypt Business SMS API** - Largest market share, most reliable
2. **Orange Egypt A2P Messaging** - Good coverage, competitive pricing
3. **Etisalat Egypt SMS Gateway** - Strong in specific Cairo areas

**Migration Trigger:**
- Monthly SMS volume > 5,000 (cost savings justify integration effort)
- Production launch (switch from Twilio testing to local carrier)

**Alternatives Considered:**

| Provider | Pros | Cons | Why Rejected |
|----------|------|------|--------------|
| **Plivo** | Cheaper than Twilio ($0.30/SMS), similar API | Fewer Egyptian carrier direct connections, less mature | Marginal cost savings don't justify switching from Twilio for testing |
| **MessageBird** | European presence, good for GDPR compliance | Higher Egypt pricing ($0.42/SMS), unnecessary GDPR overhead for Egyptian market | More expensive, overkill for Egypt-only MVP |

**Constitution Alignment:**
- **Principle VI (Security by Default)**: OTP expiry (5 min), rate limiting (3 attempts/10 min per number) enforced server-side (FR-011, FR-012)
- **Privacy**: Phone numbers never logged in plaintext (FR-045), OTP codes never logged (FR-046)

**Implementation Example:**
```typescript
import { Twilio } from 'twilio';

const client = new Twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendOTP(phoneNumber: string, code: string) {
  // Rate limiting checked by middleware before this function

  await client.messages.create({
    body: `Your Makaan verification code is: ${code}. Valid for 5 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: `+20${phoneNumber}` // Egypt country code
  });

  // Store OTP hash (not plaintext) in Redis with 5-min TTL
  await redis.setex(
    `otp:${phoneNumber}`,
    300, // 5 minutes
    await bcrypt.hash(code, 10)
  );
}
```

---

## 7. AI/ML Duplicate Detection

### RECOMMENDATION: Hybrid Approach - Rule-Based Heuristics + OpenAI Embeddings

**Architecture:**

**Phase 1: Rule-Based Heuristics (Immediate, Free)**
- **Geographic Proximity**: Flag listings within 50m radius (ST_DWithin PostGIS query)
- **Exact Match Detection**: Same seller phone + similar price/size/bedrooms within 10% variance
- **Confidence Scoring**:
  - Same location (< 50m) + same specs (type/size/beds) = 95% duplicate confidence
  - Same location + different specs = 70% confidence (possible different units in same building)
  - Different location (> 50m) + same seller + similar specs = 40% confidence (same seller listing multiple properties)

**Phase 2: OpenAI Embeddings (Post-MVP, If Needed)**
- **Text Similarity**: Embed listing description + title using `text-embedding-3-small` model
- **Image Similarity**: Use OpenAI CLIP embeddings to compare property photos (detect brokers reusing same photos)
- **Semantic Matching**: Cosine similarity > 0.9 between embeddings = likely duplicate
- **Cost**: $0.02 per 1M tokens - very affordable for MVP scale (200 listings)

**Rationale for Hybrid:**
- **MVP Speed**: Rule-based works immediately, no AI setup needed
- **Cost Efficiency**: Rule-based is free, covers 80%+ of duplicates
- **Accuracy**: Geographic + specs matching is highly reliable for real estate (unlike text-based duplicates in other domains)
- **Scalability**: Add embeddings later if rule-based false negative rate > 10%

**Alternatives Considered:**

| Approach | Pros | Cons | Why Rejected |
|----------|------|------|--------------|
| **OpenAI Embeddings Only** | High accuracy for text similarity, handles paraphrasing | $0.02/1M tokens cost, API dependency, overkill for structured data | Real estate listings are highly structured; location + specs matching is deterministic and free |
| **Custom ML Model** | No API costs, full control | Requires training data (don't have labeled duplicates yet), weeks of ML engineering effort | Premature optimization; need data from MVP before training models |
| **Manual Review Only** | 100% accuracy (human judgment) | Doesn't scale beyond 50-100 listings/day (admin capacity constraint) | Constitution Principle VII: AI should assist admins, not replace them |

**Constitution Alignment:**
- **Principle VII (AI as Silent Assistant)**: Duplicate hints shown to admins as confidence scores, admin makes final approve/reject decision (FR-026)
- **Principle IV (One Canonical Listing)**: Duplicate detection enforces single listing per property
- **Admin Capacity**: SC-005 (< 5 min per listing) achievable when AI pre-flags high-confidence duplicates

**Implementation Example:**
```typescript
interface DuplicateHint {
  targetListingId: string;
  confidence: number;
  reasons: string[];
}

async function detectDuplicates(newListing: Listing): Promise<DuplicateHint[]> {
  const hints: DuplicateHint[] = [];

  // Rule 1: Geographic proximity (PostGIS)
  const nearby = await db.query(`
    SELECT id, ST_Distance(location, $1) as distance
    FROM listings
    WHERE ST_DWithin(location, $1, 50) -- 50 meters
      AND id != $2
      AND status IN ('active', 'submitted')
  `, [newListing.location, newListing.id]);

  for (const candidate of nearby) {
    let confidence = 50; // Base confidence for proximity
    const reasons = [`Within ${candidate.distance}m`];

    // Rule 2: Spec similarity
    if (candidate.propertyType === newListing.propertyType) {
      confidence += 20;
      reasons.push('Same property type');
    }

    if (Math.abs(candidate.size - newListing.size) / newListing.size < 0.1) {
      confidence += 15;
      reasons.push('Similar size (±10%)');
    }

    if (candidate.bedrooms === newListing.bedrooms) {
      confidence += 10;
      reasons.push('Same bedroom count');
    }

    // Rule 3: Same seller
    if (candidate.sellerId === newListing.sellerId) {
      confidence += 5;
      reasons.push('Same seller');
    }

    hints.push({
      targetListingId: candidate.id,
      confidence: Math.min(confidence, 100),
      reasons
    });
  }

  return hints.filter(h => h.confidence >= 40).sort((a, b) => b.confidence - a.confidence);
}
```

**When to Upgrade to OpenAI Embeddings:**
- False negative rate (missed duplicates) > 10% after 3 months of manual review data
- Admins report rule-based hints missing obvious duplicates
- Budget allows ($50-100/month for embeddings API calls)

---

## 8. Testing Stack

### RECOMMENDATION: Jest + Supertest + Playwright

**Architecture:**

**Backend Testing:**
- **Unit Tests**: Jest for business logic, services, utilities
- **API Contract Tests**: Supertest for REST endpoint validation
- **Integration Tests**: Jest + Supertest for auth flows, approval workflows

**Frontend Testing:**
- **Component Unit Tests**: Jest + React Testing Library for UI components
- **E2E Tests**: Playwright for critical user journeys (browse listings, create listing, admin approval)

**Security Testing:**
- **OWASP ZAP**: Automated security scanning (SQL injection, XSS, CSRF)
- **Custom Scripts**: Rate limit validation, RBAC enforcement tests

**Rationale:**

| Tool | Purpose | Why Chosen |
|------|---------|------------|
| **Jest** | Unit & integration tests | De facto standard for Node.js/React, built-in mocking, parallel execution, 40% market share |
| **Supertest** | API contract tests | Seamless Express/NestJS integration, simple HTTP assertions, no server startup needed |
| **Playwright** | E2E tests | 40% faster than Selenium, 50% fewer flaky tests, excellent mobile browser emulation (iOS Safari, Chrome Android), modern architecture |
| **React Testing Library** | Component tests | Encourages accessibility-first testing, aligns with user-centric approach |

**Alternatives Considered:**

| Stack | Pros | Cons | Why Rejected |
|-------|------|------|--------------|
| **Pytest + Selenium** | Mature, Python ecosystem integration | Slower (Selenium), no benefit since we chose Node.js backend | Backend language mismatch |
| **Vitest + Cypress** | Vitest is faster than Jest, Cypress has great DX | Vitest less mature (newer), Cypress struggles with multi-tab flows | Jest ecosystem advantage outweighs Vitest speed gains; Playwright more versatile |
| **Jest + Cypress** | Familiar tools, good DX | Cypress limited to Chromium-based browsers (no Safari), slower than Playwright | Missing iOS Safari testing (20%+ of Egyptian mobile traffic) |

**Constitution Alignment:**
- **Security Testing**: OWASP ZAP + custom scripts validate FR-041-048 (RBAC, rate limiting, PII protection)
- **Contract Tests**: Ensure API contracts match frontend expectations (Principle VI: prevent security bugs)
- **Mobile Testing**: Playwright mobile emulation validates 80% mobile traffic assumption

**Test Coverage Requirements:**

| Test Type | Coverage Target | Critical Paths |
|-----------|----------------|----------------|
| **Unit** | 80% code coverage | Business logic, utilities, validators |
| **API Contract** | 100% public endpoints | All REST routes, error responses |
| **Integration** | 90% critical flows | OTP auth, listing submission, admin approval, search/filter |
| **E2E** | 100% happy paths | User Story 1-3 (browse, create, approve) |
| **Security** | All OWASP Top 10 | SQL injection, XSS, CSRF, auth bypass, rate limit bypass |

**Implementation Example:**

**Backend Unit Test (Jest):**
```typescript
describe('DuplicateDetectionService', () => {
  it('should flag listings within 50m with high confidence', async () => {
    const newListing = createMockListing({ lat: 30.0444, lng: 31.2357 });
    const existing = createMockListing({ lat: 30.0445, lng: 31.2358 }); // ~15m away

    const hints = await duplicateService.detectDuplicates(newListing);

    expect(hints).toHaveLength(1);
    expect(hints[0].confidence).toBeGreaterThan(70);
  });
});
```

**API Contract Test (Supertest):**
```typescript
describe('POST /api/listings', () => {
  it('should reject listing without required fields', async () => {
    const invalidListing = { purpose: 'sale' }; // Missing type, size, etc.

    const response = await request(app)
      .post('/api/listings')
      .set('Authorization', `Bearer ${validToken}`)
      .send(invalidListing)
      .expect(400);

    expect(response.body.errors).toContain('propertyType is required');
  });
});
```

**E2E Test (Playwright):**
```typescript
test('buyer can search listings by area', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Search for Nasr City
  await page.fill('input[placeholder="Search by area"]', 'Nasr City');
  await page.click('button:has-text("Search")');

  // Map should center on Nasr City
  await page.waitForTimeout(1000);
  const mapCenter = await page.evaluate(() => window.map.getCenter());
  expect(mapCenter.lat).toBeCloseTo(30.0626, 1);

  // Only Nasr City listings should appear
  const pins = await page.locator('.listing-pin').count();
  expect(pins).toBeGreaterThan(0);
});
```

---

## 9. Additional Technologies

### Rate Limiting & Caching

**Redis 7.0+**
- **Use Cases**: OTP storage (5-min TTL), session management, rate limiting counters, listing view counts
- **Rationale**: In-memory speed for OTP validation, built-in expiry for security, NestJS integration via `@nestjs/throttler`

### API Documentation

**Swagger/OpenAPI 3.0**
- **Tool**: `@nestjs/swagger` (auto-generates from NestJS decorators)
- **Rationale**: Contract testing requires API spec, frontend team needs endpoint documentation

### Logging & Monitoring

**MVP Phase:**
- **Winston** (Node.js logging) + **Morgan** (HTTP request logging)
- **Sentry** (error tracking) - free tier sufficient for MVP

**Post-MVP:**
- **ELK Stack** (Elasticsearch, Logstash, Kibana) for log aggregation
- **Prometheus + Grafana** for metrics

### Deployment & Hosting (Egypt Context)

**Recommended Providers (Egypt-friendly):**

1. **DigitalOcean** - Simple droplets, Egypt data center access via CDN, $12/month starter
2. **AWS** - S3 Bahrain region (lowest latency to Egypt), well-known in Egyptian market
3. **Heroku** - Zero DevOps for MVP, auto-scaling, $7/month hobby tier

**Avoid:**
- **Google Cloud** - Limited Egypt presence, higher latency
- **Azure** - Overkill for MVP, complex pricing

### CI/CD

**GitHub Actions**
- **Rationale**: Free for public repos, seamless GitHub integration, matrix testing for Node versions
- **Pipeline**: Lint → Unit Tests → Contract Tests → Build → E2E Tests (Playwright) → Deploy

---

## 10. Cost Analysis (MVP - First 3 Months)

| Service | Tier | Monthly Cost | Notes |
|---------|------|--------------|-------|
| **DigitalOcean Droplet** | 2GB RAM / 1 vCPU | $12 | Backend + DB |
| **Cloudinary** | Free | $0 | 25GB storage, 25GB bandwidth |
| **Mapbox** | Free | $0 | 50k map loads/month |
| **Twilio SMS** | Pay-as-you-go | $400 | 1000 users × 2 OTPs × $0.20 (testing phase) |
| **OpenAI API** | Pay-as-you-go | $10 | Embeddings for 200 listings (if needed) |
| **Sentry** | Free | $0 | 5k errors/month |
| **Redis Cloud** | Free | $0 | 30MB (sufficient for OTP + sessions) |
| **Domain + SSL** | Annual | $15/year | .com domain via Namecheap |
| **Total** | | **~$422/month** | **$440/month if using Twilio** |

**Scale Cost Projection (10k users, 2k listings):**
- Droplet: $48/month (8GB RAM)
- Cloudinary → S3: $30/month (100GB bandwidth)
- Mapbox: $50/month (100k loads)
- Twilio → Local Carrier: $150/month (1000 SMS/month at $0.15)
- **Total: ~$278/month** (37% cost reduction by switching to local SMS + S3)

---

## 11. Technology Decision Matrix

### Decision Summary Table

| Decision Area | Recommended | Alternatives | Key Criteria |
|---------------|-------------|--------------|--------------|
| **Backend Language** | Node.js + TypeScript | Python | Performance, ecosystem, hiring |
| **Backend Framework** | NestJS | Express, FastAPI, Django | Architecture, security, DX |
| **Frontend** | Next.js | React, Vue, Svelte | SSR, ecosystem, mobile perf |
| **Database** | PostgreSQL + PostGIS | MySQL, MongoDB | Spatial queries, ACID, proven |
| **Map Library** | Mapbox GL JS | Google Maps, Leaflet, OSM | Mobile perf, cost, customization |
| **Image Processing** | Sharp | Pillow, Cloudinary | Performance, EXIF stripping |
| **Object Storage** | Cloudinary (MVP) | S3, imgix | Setup speed, auto-optimization |
| **SMS Provider** | Twilio (test) → Local carrier (prod) | Plivo, MessageBird | Reliability, Egypt coverage, cost |
| **Duplicate Detection** | Rule-based + OpenAI (later) | Custom ML, manual only | Accuracy, cost, admin assistance |
| **Testing** | Jest + Supertest + Playwright | Pytest + Selenium, Vitest + Cypress | Ecosystem, performance, mobile |

---

## 12. Implementation Roadmap

### Phase 0: Setup (Week 1)
- [ ] Initialize Next.js + NestJS monorepo
- [ ] Configure PostgreSQL + PostGIS (local Docker, DigitalOcean Managed DB for staging)
- [ ] Set up Mapbox account, obtain API key
- [ ] Configure Cloudinary account
- [ ] Set up Twilio account with Egypt test number

### Phase 1: Core Backend (Weeks 2-3)
- [ ] Database schema with PostGIS types
- [ ] OTP authentication endpoints (Twilio integration)
- [ ] Listing CRUD endpoints with validation
- [ ] Image upload pipeline (Sharp + Cloudinary)
- [ ] Rate limiting middleware (Redis + NestJS Throttler)

### Phase 2: Core Frontend (Weeks 4-5)
- [ ] Next.js app structure with Tailwind
- [ ] Mapbox integration (react-map-gl)
- [ ] Listing browse page with filters
- [ ] Listing creation form with map pin placement
- [ ] Mobile-responsive UI (iOS Safari, Chrome Android testing)

### Phase 3: Admin & Quality (Week 6)
- [ ] Admin dashboard (moderation queue)
- [ ] Duplicate detection service (rule-based)
- [ ] Approval/rejection workflows
- [ ] Seller dashboard (listing management)

### Phase 4: Testing & Security (Week 7)
- [ ] Jest unit tests (80% coverage)
- [ ] Supertest API contract tests
- [ ] Playwright E2E tests (User Stories 1-3)
- [ ] OWASP ZAP security scan
- [ ] Load testing (Artillery or k6)

### Phase 5: Deployment (Week 8)
- [ ] DigitalOcean Droplet setup
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Staging environment
- [ ] Production deployment
- [ ] Monitoring (Sentry, Winston logs)

---

## 13. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| **Mapbox free tier exceeded** | High cost ($5/1k loads) | Medium | Implement aggressive caching, lazy-load map on scroll |
| **Twilio SMS costs too high** | Budget overrun | High | Switch to local Egyptian carrier API after MVP validation |
| **PostGIS query performance degrades** | Fails SC-009 (95% < 2s) | Low | Spatial indexes, query optimization, caching frequent searches |
| **Cloudinary bandwidth exceeded** | Image loading failures | Medium | Migrate to S3+CloudFront if bandwidth > 25GB/month |
| **Mobile browser compatibility issues** | Poor UX for 80% users | Medium | Playwright mobile tests, BrowserStack real device testing |
| **Admin approval bottleneck** | Listings queue up | High | AI duplicate hints, streamlined review UI, hire 2nd admin |
| **EXIF stripping fails** | PII leaks | Low | Automated tests verify EXIF removal, manual spot checks |
| **OTP delivery delays in Egypt** | Auth failures | Medium | Implement retry logic, fallback to voice call OTP |

---

## 14. Research Sources

### Backend Frameworks
- [Comparing Web Frameworks: Flask, FastAPI, Django, NestJS, Express.js](https://medium.com/@arif.rahman.rhm/comparing-web-frameworks-flask-fastapi-django-nestjs-express-js-db735f1c6eba)
- [FastAPI Benchmarks](https://fastapi.tiangolo.com/benchmarks/)
- [FastAPI vs. Express.js vs. Flask vs. Nest.js Benchmark](https://www.travisluong.com/fastapi-vs-express-js-vs-flask-vs-nest-js-benchmark/)
- [Top 10 API Frameworks: Choose Your Best Fit for 2026](https://www.digitalapi.ai/blogs/top-10-api-frameworks-choose-your-best-fit-for-2026)
- [12 Best Backend Frameworks to Use in 2026](https://www.index.dev/blog/best-backend-frameworks-ranked)
- [Express.js vs Fastify vs NestJS for Backend Development [2026]](https://www.index.dev/skill-vs-skill/backend-nestjs-vs-expressjs-vs-fastify)

### Database & PostGIS
- [Postgres Geospatial: A Complete Guide to Spatial Data with PostGIS](https://www.geowgs84.ai/post/postgres-geospatial-a-complete-guide-to-spatial-data-with-postgis)
- [Using PostGIS To Enable Better Performance in PostgreSQL](https://www.percona.com/blog/working-with-postgresql-and-postgis-how-to-become-a-gis-expert/)
- [Working with Geospatial Data? PostGIS Makes PostgreSQL Enterprise-Ready](https://www.percona.com/blog/working-with-geospatial-data-postgis-makes-postgresql-enterprise-ready/)
- [Applications of PostGIS and PostgreSQL in Modern Geospatial Analysis](https://www.ve3.global/applications-of-postgis-and-postgresql-in-modern-geospatial-analysis/)

### Frontend Frameworks
- [Svelte vs React: A Comprehensive Comparison for Developers](https://strapi.io/blog/svelte-vs-react-comparison)
- [React vs. Vue vs. Svelte: The 2026 SaaS Performance Benchmark](https://laderalabs.io/blog/best-tech-stack-saas-2026)
- [Svelte vs NextJS Difference - 2026](https://www.aalpha.net/articles/svelte-vs-nextjs-comparison/)
- [Svelte vs React 2026: Which Framework Should You Choose?](https://devtrios.com/blog/svelte-vs-react-which-framework-should-you-choose/)
- [JavaScript Framework Trends in 2026: React, Next.js, Vue, Angular, Svelte](https://www.nucamp.co/blog/javascript-framework-trends-in-2026-what-s-new-in-react-next.js-vue-angular-and-svelte)

### Map Libraries
- [5 JavaScript mapping APIs compared - LogRocket](https://blog.logrocket.com/javascript-mapping-apis-compared/)
- [Mapbox vs Google Maps vs Leaflet](https://stackshare.io/stackups/google-maps-vs-leaflet-vs-mapbox)
- [Leaflet or Mapbox? Choosing the Right Tool for Interactive Maps](https://medium.com/visarsoft-blog/leaflet-or-mapbox-choosing-the-right-tool-for-interactive-maps-53dea7cc3c40)
- [Mapbox vs. MapTiler vs. MapLibre vs. Leaflet: Which to Choose?](https://www.gispeople.com.au/mapbox-vs-maptiler-vs-maplibre-vs-leaflet-which-to-choose/)

### Image Processing
- [Sharp Output Options](https://sharp.pixelplumbing.com/api-output/)
- [Sharp Performance](https://sharp.pixelplumbing.com/performance/)
- [Python pillow vs NPM sharp performance](https://github.com/lovell/sharp/issues/3786)
- [EXIF Data Risks: Strip Image Metadata for Global Privacy](https://mochify.xyz/guides/exif-data-risks-image-compression-2026)

### Object Storage
- [Cloudinary vs AWS S3 — Are they really comparable?](https://www.bytescale.com/blog/cloudinary-vs-s3/)
- [Cloudinary vs. S3: Choosing the Right Solution](https://cloudinary.com/guides/ecosystems/cloudinary-vs-s3)
- [AWS S3 vs Cloudinary vs imgix: Total Cost Breakdown](https://knackforge.com/blog/aws-s3)
- [Amazon S3 vs Cloudinary - 2026 Comparison](https://www.softwareadvice.com/cloud-storage/amazon-s3-profile/vs/cloudinary/)

### SMS Providers
- [Egypt: SMS Guidelines | Twilio](https://www.twilio.com/en-us/guidelines/eg/sms)
- [Egypt SMS Pricing 2025: Complete API Cost Comparison Guide](https://www.sent.dm/resources/egypt-sms-pricing)
- [SMS Pricing in Egypt for Text Messaging | Twilio](https://www.twilio.com/en-us/sms/pricing/eg)
- [SMS API Egypt: Unlock SMS API Egypt Power For Business](https://epushagency.eg/blog/sms-api-egypt/)

### AI/ML Duplicate Detection
- [How do I use embeddings for duplicate detection?](https://zilliz.com/ai-faq/how-do-i-use-embeddings-for-duplicate-detection)
- [Should I use Embedding to search for duplicate reports?](https://community.openai.com/t/should-i-use-embedding-to-search-for-duplicate-reports/326065)
- [Text Embeddings with OpenAI: A Practical Engineer's Guide for 2026](https://thelinuxcode.com/text-embeddings-with-openai-a-practical-engineers-guide-for-2026/)
- [Use cases for embeddings | OpenAI Cookbook](https://cookbook.openai.com/articles/text_comparison_examples)
- [Image deduplication using OpenAI's CLIP](https://zarkopafilis.medium.com/image-deduplication-using-openais-clip-and-community-detection-2504f0437e7e)

### Testing Frameworks
- [API Testing Comparison: Cypress vs. Playwright vs. Jest](https://javascript.plainenglish.io/api-testing-comparison-cypress-vs-playwright-vs-jest-2ff1f80c5a7b)
- [Playwright vs Selenium vs Cypress: Complete Comparison Guide for 2026](https://mastersoftwaretesting.com/automation-academy/ui-automation/selenium-vs-playwright-vs-cypress)
- [Selenium Alternatives in 2026: Playwright, Cypress & More](https://quashbugs.com/blog/selenium-alternatives-2026)
- [Playwright vs. Jest: A Comprehensive Guide](https://digitalrishabh01.medium.com/playwright-vs-jest-a-comprehensive-guide-cfea315c8c49)

---

## 15. Next Steps

1. **Review & Approval**: Share this research document with technical lead and product owner for feedback
2. **Create `data-model.md`**: Design detailed database schema based on PostgreSQL + PostGIS recommendation
3. **Create `quickstart.md`**: Document local development setup (Docker Compose with Postgres, Redis, etc.)
4. **Create API Contracts**: Define REST endpoints in `contracts/api-spec.md`
5. **Technology Proof-of-Concept**: Build small prototype with NestJS + Next.js + Mapbox + PostGIS to validate integration assumptions
6. **Run `/speckit.tasks`**: Generate actionable implementation tasks based on this research

---

**Document Status**: Complete
**Last Updated**: 2026-02-22
**Next Phase**: Data Model Design (`/speckit.plan` Phase 1 output)
