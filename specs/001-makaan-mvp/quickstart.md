# Makaan MVP - Local Development Quickstart Guide

**Version**: 1.0.0
**Last Updated**: 2026-02-22
**Estimated Setup Time**: 15-20 minutes

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (5 Minutes)](#quick-start-5-minutes)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Development Workflow](#development-workflow)
6. [Project Structure](#project-structure)
7. [Common Tasks](#common-tasks)
8. [Troubleshooting](#troubleshooting)
9. [Testing](#testing)
10. [VS Code Setup](#vs-code-setup)

---

## Prerequisites

### Required Software

| Tool | Version | Purpose | Installation |
|------|---------|---------|-------------|
| **Node.js** | 20 LTS | Backend + Frontend runtime | [nodejs.org](https://nodejs.org) |
| **npm** | 10+ | Package manager | Included with Node.js |
| **Docker Desktop** | Latest | PostgreSQL + PostGIS + Redis | [docker.com](https://www.docker.com/products/docker-desktop) |
| **Git** | 2.40+ | Version control | [git-scm.com](https://git-scm.com) |
| **VS Code** | Latest | Code editor (recommended) | [code.visualstudio.com](https://code.visualstudio.com) |

### Third-Party Accounts Needed

| Service | Purpose | Free Tier | Sign Up |
|---------|---------|-----------|---------|
| **Mapbox** | Map rendering & geocoding | 50k map loads/month | [mapbox.com/signup](https://www.mapbox.com/signup/) |
| **Cloudinary** | Image hosting & CDN | 25GB storage + bandwidth | [cloudinary.com/users/register](https://cloudinary.com/users/register/free) |
| **Twilio** | SMS OTP delivery (testing) | Trial credits | [twilio.com/try-twilio](https://www.twilio.com/try-twilio) |

### Verify Installation

```bash
# Check versions
node --version    # Should output v20.x.x
npm --version     # Should output 10.x.x
docker --version  # Should output Docker version 24.x.x or higher
git --version     # Should output git version 2.40 or higher

# Verify Docker is running
docker ps         # Should list running containers (or empty if none running)
```

---

## Quick Start (5 Minutes)

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/makaan.git
cd makaan

# Verify you're on the correct branch
git branch
# Should show: * 001-makaan-mvp or master
```

### Step 2: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to project root
cd ..
```

**Expected Output**:
```
added 1247 packages in 45s
```

### Step 3: Set Up Environment Variables

```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment
cp frontend/.env.example frontend/.env.local

# Edit files with your API keys (see Environment Variables section below)
```

### Step 4: Start Database Services

```bash
# Start PostgreSQL + PostGIS + Redis with Docker Compose
docker-compose up -d

# Verify containers are running
docker ps
```

**Expected Output**:
```
CONTAINER ID   IMAGE              STATUS         PORTS
abc123def456   postgres:16        Up 10 seconds  0.0.0.0:5432->5432/tcp
def456ghi789   redis:7-alpine     Up 10 seconds  0.0.0.0:6379->6379/tcp
```

### Step 5: Initialize Database

```bash
# Run database migrations (creates tables, indexes, PostGIS setup)
cd backend
npm run migration:run

# Seed Cairo area data (Nasr City, Zamalek, Maadi, etc.)
npm run seed

# Return to project root
cd ..
```

**Expected Output**:
```
Migration InitialSchema1708646400000 has been executed successfully.
Migration EnablePostGIS1708646500000 has been executed successfully.
Seeded 15 Cairo areas successfully.
```

### Step 6: Start Development Servers

```bash
# Option A: Start both servers in parallel (recommended)
npm run dev

# Option B: Start separately in different terminals
# Terminal 1 - Backend
cd backend && npm run start:dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

**Expected Output**:
```
[Backend]  Nest application successfully started on http://localhost:3001
[Frontend] ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Step 7: Verify Setup

Open your browser and navigate to:

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001/api](http://localhost:3001/api)
- **API Documentation**: [http://localhost:3001/api-docs](http://localhost:3001/api-docs) (Swagger UI)

You should see:
- Frontend: Makaan homepage with interactive map centered on Cairo
- Backend API: JSON response with `{ "message": "Makaan API v1.0.0" }`
- API Docs: Swagger UI listing all available endpoints

---

## Environment Variables

### Backend `.env` File

Create `/backend/.env` with the following configuration:

```bash
# ============================================
# DATABASE CONFIGURATION (PostgreSQL + PostGIS)
# ============================================
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=makaan_dev
DB_PASSWORD=makaan_dev_password_change_in_production
DB_DATABASE=makaan_dev
DB_SYNCHRONIZE=false  # IMPORTANT: Use migrations, not auto-sync

# ============================================
# REDIS CONFIGURATION (Cache + Sessions)
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Leave empty for local development

# ============================================
# JWT AUTHENTICATION
# ============================================
# Generate a random secret: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION_SELLER=30d   # 30 days for sellers
JWT_EXPIRATION_ADMIN=8h     # 8 hours for admins

# ============================================
# TWILIO SMS PROVIDER (OTP Delivery)
# ============================================
# Sign up at: https://www.twilio.com/try-twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio test number

# For testing without sending real SMS (uses Twilio test credentials)
TWILIO_TEST_MODE=true

# ============================================
# CLOUDINARY (Image Storage + CDN)
# ============================================
# Get credentials at: https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# ============================================
# MAPBOX (Geocoding API - Server-Side)
# ============================================
# Get token at: https://account.mapbox.com/access-tokens
MAPBOX_SECRET_TOKEN=sk.ey...your_secret_token  # Secret token for server-side

# ============================================
# SECURITY & RATE LIMITING
# ============================================
CORS_ORIGIN=http://localhost:3000  # Frontend URL
RATE_LIMIT_TTL=60                   # Rate limit window in seconds
RATE_LIMIT_MAX=100                  # Max requests per window

# ============================================
# APPLICATION SETTINGS
# ============================================
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug  # Options: error, warn, info, debug
```

### Frontend `.env.local` File

Create `/frontend/.env.local` with the following configuration:

```bash
# ============================================
# BACKEND API CONFIGURATION
# ============================================
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# ============================================
# MAPBOX (Public Token for Map Rendering)
# ============================================
# Get token at: https://account.mapbox.com/access-tokens
# IMPORTANT: Use a PUBLIC token (starts with pk.), not secret token
NEXT_PUBLIC_MAPBOX_TOKEN=pk.ey...your_public_token

# ============================================
# MAP DEFAULT SETTINGS (Cairo Center)
# ============================================
NEXT_PUBLIC_DEFAULT_LAT=30.0444
NEXT_PUBLIC_DEFAULT_LNG=31.2357
NEXT_PUBLIC_DEFAULT_ZOOM=11

# ============================================
# APPLICATION SETTINGS
# ============================================
NEXT_PUBLIC_APP_NAME=Makaan
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### How to Get API Keys

#### 1. Mapbox Tokens

1. Go to [mapbox.com/signup](https://www.mapbox.com/signup/)
2. Create free account
3. Navigate to [Account > Access Tokens](https://account.mapbox.com/access-tokens/)
4. You'll see a default **public token** (starts with `pk.`) - copy this to `NEXT_PUBLIC_MAPBOX_TOKEN`
5. Click "Create a token" for a **secret token** (starts with `sk.`) - copy this to `MAPBOX_SECRET_TOKEN`

#### 2. Cloudinary Credentials

1. Go to [cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Create free account
3. Navigate to [Dashboard](https://cloudinary.com/console)
4. Copy **Cloud Name**, **API Key**, and **API Secret** from dashboard

#### 3. Twilio Credentials (Testing)

1. Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Create free account
3. Navigate to [Console Dashboard](https://console.twilio.com/)
4. Copy **Account SID** and **Auth Token**
5. Get a [test phone number](https://console.twilio.com/us1/develop/phone-numbers/manage/incoming) (free)

**For Testing Without Real SMS**:
Set `TWILIO_TEST_MODE=true` in backend `.env` to use Twilio's test credentials:
- Test Account SID: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- Test Auth Token: (provided by Twilio)
- OTP codes will be logged to console instead of sent via SMS

---

## Database Setup

### Docker Compose Configuration

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  # PostgreSQL 16 + PostGIS 3.6
  postgres:
    image: postgis/postgis:16-3.6
    container_name: makaan-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: makaan_dev
      POSTGRES_PASSWORD: makaan_dev_password_change_in_production
      POSTGRES_DB: makaan_dev
      # Enable PostGIS by default
      POSTGRES_INITDB_ARGS: "-E UTF8"
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      # Optional: Custom init scripts
      - ./database/init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U makaan_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis 7 (Cache + Sessions)
  redis:
    image: redis:7-alpine
    container_name: makaan-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  # pgAdmin (Optional - Database GUI)
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: makaan-pgadmin
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@makaan.local
      PGADMIN_DEFAULT_PASSWORD: admin123
      PGADMIN_LISTEN_PORT: 5050
    ports:
      - "5050:5050"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    depends_on:
      - postgres

volumes:
  postgres_data:
  redis_data:
  pgadmin_data:
```

### Database Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove all data (WARNING: Deletes database!)
docker-compose down -v

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Access PostgreSQL CLI
docker exec -it makaan-postgres psql -U makaan_dev -d makaan_dev

# Access Redis CLI
docker exec -it makaan-redis redis-cli
```

### Migration Commands

```bash
cd backend

# Generate new migration from entity changes
npm run migration:generate -- -n MigrationName

# Create empty migration file
npm run migration:create -- -n MigrationName

# Run all pending migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migration status
npm run migration:show
```

### Seed Data (Cairo Areas)

The seed script populates the `cairo_area` table with geographic boundaries for:

- **Nasr City** (مدينة نصر)
- **Zamalek** (الزمالك)
- **Maadi** (المعادي)
- **Heliopolis** (مصر الجديدة)
- **6th of October** (6 أكتوبر)
- **Sheikh Zayed** (الشيخ زايد)
- **New Cairo** (القاهرة الجديدة)
- **Downtown Cairo** (وسط البلد)
- **Garden City** (جاردن سيتي)
- **Dokki** (الدقي)
- **Mohandessin** (المهندسين)
- **Agouza** (العجوزة)
- **Giza** (الجيزة)
- **Helwan** (حلوان)
- **Shubra** (شبرا)

```bash
# Run seed script
npm run seed

# Verify seeded data
docker exec -it makaan-postgres psql -U makaan_dev -d makaan_dev -c \
  "SELECT name, name_ar, hierarchy_level FROM cairo_area ORDER BY name;"
```

**Expected Output**:
```
      name       |    name_ar    | hierarchy_level
-----------------+---------------+-----------------
 6th of October  | 6 أكتوبر      |               1
 Agouza          | العجوزة       |               1
 Downtown Cairo  | وسط البلد     |               1
 ...
(15 rows)
```

### pgAdmin Access (Database GUI)

1. Open browser: [http://localhost:5050](http://localhost:5050)
2. Login:
   - **Email**: `admin@makaan.local`
   - **Password**: `admin123`
3. Add server connection:
   - **Host**: `postgres` (Docker internal hostname)
   - **Port**: `5432`
   - **Username**: `makaan_dev`
   - **Password**: `makaan_dev_password_change_in_production`
   - **Database**: `makaan_dev`

---

## Development Workflow

### Start Development Environment

```bash
# Option 1: Run both backend and frontend simultaneously (uses concurrently)
npm run dev

# Option 2: Run separately
# Terminal 1 - Backend (watch mode, auto-reload)
cd backend
npm run start:dev

# Terminal 2 - Frontend (Next.js dev server, hot reload)
cd frontend
npm run dev
```

### Backend Development (NestJS)

```bash
cd backend

# Start in development mode (watch mode)
npm run start:dev

# Start in debug mode (enables Chrome DevTools debugging)
npm run start:debug

# Build for production
npm run build

# Run production build
npm run start:prod
```

**Backend runs on**: [http://localhost:3001](http://localhost:3001)

### Frontend Development (Next.js)

```bash
cd frontend

# Start dev server (hot reload, fast refresh)
npm run dev

# Build for production
npm run build

# Run production build locally
npm run start

# Lint code
npm run lint

# Format code with Prettier
npm run format
```

**Frontend runs on**: [http://localhost:3000](http://localhost:3000)

### Code Quality Commands

```bash
# Backend linting
cd backend
npm run lint          # Check for linting errors
npm run lint:fix      # Auto-fix linting errors
npm run format        # Format with Prettier
npm run format:check  # Check formatting without changing files

# Frontend linting
cd frontend
npm run lint          # Next.js ESLint
npm run lint:fix      # Auto-fix
npm run format        # Prettier
```

### Watch Mode Features

Both backend and frontend support hot reload:

- **Backend**: NestJS watches `.ts` files and auto-reloads on changes
- **Frontend**: Next.js Fast Refresh updates UI instantly without full reload

---

## Project Structure

### Monorepo Layout

```
makaan/
├── backend/                 # NestJS backend API
│   ├── src/
│   │   ├── auth/           # OTP authentication module
│   │   ├── listings/       # Listing CRUD + search
│   │   ├── admin/          # Admin moderation module
│   │   ├── users/          # User management
│   │   ├── images/         # Image upload + processing (Sharp)
│   │   ├── areas/          # Cairo area boundaries
│   │   ├── common/         # Shared utilities, guards, decorators
│   │   ├── config/         # Configuration (TypeORM, Redis, etc.)
│   │   ├── database/       # Migrations + seeds
│   │   │   ├── migrations/ # TypeORM migrations
│   │   │   └── seeds/      # Seed data scripts
│   │   ├── entities/       # TypeORM entities
│   │   └── main.ts         # Application entry point
│   ├── test/               # E2E tests
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── .env
│
├── frontend/               # Next.js frontend
│   ├── app/               # Next.js 13+ App Router
│   │   ├── page.tsx       # Homepage (map view)
│   │   ├── listings/      # Listing pages
│   │   ├── seller/        # Seller dashboard
│   │   ├── admin/         # Admin dashboard
│   │   └── layout.tsx     # Root layout
│   ├── components/        # React components
│   │   ├── map/           # Mapbox map components
│   │   ├── listings/      # Listing cards, filters
│   │   ├── forms/         # Form components
│   │   └── ui/            # Shared UI components (buttons, modals)
│   ├── lib/               # Utilities
│   │   ├── api.ts         # API client wrapper
│   │   ├── mapbox.ts      # Mapbox helper functions
│   │   └── validators.ts  # Client-side validation
│   ├── hooks/             # Custom React hooks
│   ├── public/            # Static assets
│   ├── styles/            # Global CSS, Tailwind config
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   └── .env.local
│
├── shared/                # Shared types/utilities (future)
│   └── types/             # Shared TypeScript interfaces
│
├── docker-compose.yml     # PostgreSQL + Redis + pgAdmin
├── .gitignore
├── package.json           # Root package.json for monorepo scripts
├── README.md
└── specs/                 # Project documentation
    └── 001-makaan-mvp/
        ├── spec.md
        ├── plan.md
        ├── research.md
        ├── data-model.md
        ├── quickstart.md  # This file
        └── contracts/
            └── api-spec.md
```

### Key File Locations

| Need | File Path |
|------|-----------|
| **Add new API endpoint** | `backend/src/<module>/<module>.controller.ts` |
| **Add new database entity** | `backend/src/entities/<entity>.entity.ts` |
| **Create database migration** | `npm run migration:create -n Name` |
| **Add new frontend page** | `frontend/app/<route>/page.tsx` |
| **Add React component** | `frontend/components/<category>/<Component>.tsx` |
| **Configure TypeORM** | `backend/src/config/database.config.ts` |
| **Configure Next.js** | `frontend/next.config.js` |
| **API route handlers** | `backend/src/<module>/<module>.service.ts` |
| **Map components** | `frontend/components/map/` |

---

## Common Tasks

### 1. Add New API Endpoint

**Example: Add endpoint to get listing statistics**

```typescript
// backend/src/listings/listings.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ListingsService } from './listings.service';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get('stats')
  async getStats() {
    return this.listingsService.getStatistics();
  }
}

// backend/src/listings/listings.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Listing } from '../entities/listing.entity';

@Injectable()
export class ListingsService {
  constructor(
    @InjectRepository(Listing)
    private listingRepository: Repository<Listing>,
  ) {}

  async getStatistics() {
    const total = await this.listingRepository.count({
      where: { status: 'active', isDeleted: false },
    });

    const avgPrice = await this.listingRepository
      .createQueryBuilder('listing')
      .select('AVG(listing.priceEgp)', 'avg')
      .where('listing.status = :status', { status: 'active' })
      .getRawOne();

    return {
      totalListings: total,
      averagePrice: parseFloat(avgPrice.avg),
    };
  }
}
```

**Test the endpoint**:
```bash
curl http://localhost:3001/api/listings/stats
```

### 2. Add New Database Entity

**Example: Add `Review` entity for listing reviews**

```typescript
// backend/src/entities/review.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Listing } from './listing.entity';

@Entity('review')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  listingId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'int', width: 1 })
  rating: number; // 1-5 stars

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Listing, (listing) => listing.reviews)
  listing: Listing;

  @ManyToOne(() => User)
  user: User;
}
```

**Generate migration**:
```bash
cd backend
npm run migration:generate -- -n AddReviewTable
npm run migration:run
```

### 3. Add New Frontend Page

**Example: Add seller dashboard page**

```typescript
// frontend/app/seller/dashboard/page.tsx
import { Metadata } from 'next';
import { SellerDashboard } from '@/components/seller/SellerDashboard';

export const metadata: Metadata = {
  title: 'Seller Dashboard - Makaan',
  description: 'Manage your property listings',
};

export default function SellerDashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">My Listings</h1>
      <SellerDashboard />
    </div>
  );
}

// frontend/components/seller/SellerDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function SellerDashboard() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      try {
        const data = await api.get('/listings/my-listings');
        setListings(data);
      } catch (error) {
        console.error('Failed to fetch listings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
```

**Access page**: [http://localhost:3000/seller/dashboard](http://localhost:3000/seller/dashboard)

### 4. Upload Test Images to Cloudinary

**Using backend API endpoint**:

```bash
# Upload image via API (requires JWT token)
curl -X POST http://localhost:3001/api/images/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "listingId=LISTING_UUID"
```

**Test EXIF stripping**:

```typescript
// backend/src/images/images.service.ts
import * as sharp from 'sharp';

async processImage(file: Buffer): Promise<Buffer> {
  // Sharp automatically strips EXIF by default
  const processed = await sharp(file)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  // Verify EXIF was stripped
  const metadata = await sharp(processed).metadata();
  console.log('EXIF removed:', !metadata.exif); // Should be true

  return processed;
}
```

### 5. Test SMS OTP Locally (Without Sending Real SMS)

**Option A: Use Twilio Test Credentials**

Set in `backend/.env`:
```bash
TWILIO_TEST_MODE=true
```

OTP codes will be logged to console instead of sending SMS:

```
[OTP] Phone: +201234567890, Code: 123456 (expires in 5 minutes)
```

**Option B: Use Mock SMS Service**

```typescript
// backend/src/auth/sms.service.ts
async sendOTP(phoneNumber: string, code: string) {
  if (process.env.NODE_ENV === 'development') {
    // Log to console instead of sending SMS
    console.log(`[OTP] Phone: ${phoneNumber}, Code: ${code}`);
    return { success: true, mock: true };
  }

  // Production: Use Twilio
  return this.twilioClient.messages.create({
    body: `Your Makaan verification code is: ${code}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phoneNumber,
  });
}
```

### 6. Debug Spatial Queries (PostGIS)

**Test duplicate detection query**:

```bash
# Access PostgreSQL
docker exec -it makaan-postgres psql -U makaan_dev -d makaan_dev
```

```sql
-- Find duplicates within 50 meters of a test point
WITH target AS (
  SELECT ST_GeographyFromText('SRID=4326;POINT(31.2357 30.0444)') AS point
)
SELECT
  l.id,
  l.property_type,
  l.price_egp,
  ST_Distance(l.map_pin, t.point) AS distance_meters
FROM listing l
CROSS JOIN target t
WHERE
  ST_DWithin(l.map_pin, t.point, 50)  -- 50 meters
  AND l.status = 'active'
  AND l.is_deleted = false
ORDER BY distance_meters ASC;
```

**Visualize area boundaries**:

```sql
-- Get GeoJSON for Cairo area (use in mapbox.com/geojson viewer)
SELECT
  name,
  ST_AsGeoJSON(boundary) AS geojson
FROM cairo_area
WHERE name = 'Nasr City';
```

---

## Troubleshooting

### Port Already in Use

**Problem**: Error `EADDRINUSE: address already in use :::3001`

**Solution**:

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or change port in backend/.env
PORT=3002
```

### Docker Container Not Starting

**Problem**: `docker-compose up` fails with connection errors

**Solutions**:

```bash
# Check Docker is running
docker ps

# Restart Docker Desktop
# macOS: Docker icon > Restart

# Remove old containers and volumes
docker-compose down -v
docker-compose up -d

# Check container logs
docker-compose logs postgres
```

### Database Connection Errors

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solutions**:

1. Verify PostgreSQL is running:
   ```bash
   docker ps | grep postgres
   ```

2. Check database credentials in `backend/.env`:
   ```bash
   DB_HOST=localhost  # Should be 'localhost', not '127.0.0.1'
   DB_PORT=5432
   ```

3. Test connection manually:
   ```bash
   docker exec -it makaan-postgres psql -U makaan_dev -d makaan_dev -c "SELECT 1;"
   ```

### Migration Failures

**Problem**: `QueryFailedError: column "xyz" already exists`

**Solutions**:

```bash
# Check migration status
npm run migration:show

# Revert failed migration
npm run migration:revert

# Fix migration file, then re-run
npm run migration:run
```

**Reset database completely** (WARNING: Deletes all data):

```bash
# Stop containers and delete volumes
docker-compose down -v

# Restart containers
docker-compose up -d

# Re-run all migrations
cd backend
npm run migration:run
npm run seed
```

### Module Not Found Errors

**Problem**: `Cannot find module '@nestjs/core'`

**Solutions**:

```bash
# Delete node_modules and reinstall
cd backend
rm -rf node_modules package-lock.json
npm install

# Clear npm cache if still failing
npm cache clean --force
npm install
```

### CORS Errors Between Frontend and Backend

**Problem**: `Access to fetch at 'http://localhost:3001/api' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Solutions**:

1. Check `backend/.env`:
   ```bash
   CORS_ORIGIN=http://localhost:3000
   ```

2. Verify CORS configuration in `backend/src/main.ts`:
   ```typescript
   app.enableCors({
     origin: process.env.CORS_ORIGIN,
     credentials: true,
   });
   ```

3. Restart backend server:
   ```bash
   cd backend
   npm run start:dev
   ```

### Mapbox Map Not Rendering

**Problem**: Blank map or error `Error: A valid Mapbox access token is required`

**Solutions**:

1. Verify token in `frontend/.env.local`:
   ```bash
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.ey...
   ```

2. Ensure token starts with `pk.` (public token), not `sk.` (secret token)

3. Check browser console for errors:
   ```
   F12 > Console
   ```

4. Test token validity:
   ```bash
   curl "https://api.mapbox.com/geocoding/v5/mapbox.places/Cairo.json?access_token=YOUR_TOKEN"
   ```

### Image Upload Errors

**Problem**: `500 Internal Server Error` when uploading images

**Solutions**:

1. Check Cloudinary credentials in `backend/.env`

2. Verify file size (<5MB):
   ```bash
   ls -lh image.jpg  # Should show file size
   ```

3. Check backend logs:
   ```bash
   cd backend
   npm run start:dev
   # Upload image and watch console output
   ```

4. Test Cloudinary connection:
   ```typescript
   // backend/src/images/images.service.ts
   async testCloudinary() {
     const result = await cloudinary.uploader.upload('https://via.placeholder.com/150');
     console.log('Cloudinary test:', result.secure_url);
   }
   ```

---

## Testing

### Unit Tests (Jest)

```bash
# Backend unit tests
cd backend
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report
npm run test -- --verbose # Verbose output

# Test specific file
npm run test -- listings.service.spec.ts

# Frontend unit tests
cd frontend
npm run test
```

**Example backend test**:

```typescript
// backend/src/listings/listings.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ListingsService } from './listings.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Listing } from '../entities/listing.entity';

describe('ListingsService', () => {
  let service: ListingsService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingsService,
        {
          provide: getRepositoryToken(Listing),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ListingsService>(ListingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return active listings', async () => {
    const mockListings = [{ id: '1', status: 'active' }];
    mockRepository.find.mockResolvedValue(mockListings);

    const result = await service.findAll({ status: 'active' });

    expect(result).toEqual(mockListings);
    expect(mockRepository.find).toHaveBeenCalledWith({
      where: { status: 'active', isDeleted: false },
    });
  });
});
```

### API Contract Tests (Supertest)

```bash
# Backend integration tests
cd backend
npm run test:e2e
```

**Example integration test**:

```typescript
// backend/test/listings.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Listings API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/listings (GET) should return listings', () => {
    return request(app.getHttpServer())
      .get('/api/listings')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });

  it('/api/listings (POST) should reject invalid data', () => {
    return request(app.getHttpServer())
      .post('/api/listings')
      .send({ purpose: 'invalid' })  // Invalid enum value
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toContain('purpose must be');
      });
  });
});
```

### E2E Tests (Playwright)

```bash
# Install Playwright
cd frontend
npx playwright install

# Run E2E tests
npm run test:e2e

# Run in UI mode (interactive)
npx playwright test --ui

# Run specific test file
npx playwright test tests/search-listings.spec.ts
```

**Example E2E test**:

```typescript
// frontend/tests/search-listings.spec.ts
import { test, expect } from '@playwright/test';

test('buyer can search listings by area', async ({ page }) => {
  // Navigate to homepage
  await page.goto('http://localhost:3000');

  // Search for Nasr City
  await page.fill('input[placeholder="Search by area"]', 'Nasr City');
  await page.click('button:has-text("Search")');

  // Wait for map to center on Nasr City
  await page.waitForTimeout(1000);

  // Verify listings appear
  const listingCards = page.locator('.listing-card');
  await expect(listingCards).toHaveCountGreaterThan(0);

  // Verify map pins
  const mapPins = page.locator('.mapboxgl-marker');
  await expect(mapPins).toHaveCountGreaterThan(0);
});

test('seller can create listing', async ({ page }) => {
  // Login as seller (OTP flow)
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="phone"]', '+201234567890');
  await page.click('button:has-text("Send OTP")');

  // Mock OTP (in test mode)
  await page.fill('input[name="otp"]', '123456');
  await page.click('button:has-text("Verify")');

  // Create listing
  await page.goto('http://localhost:3000/seller/listings/new');
  await page.selectOption('select[name="purpose"]', 'sale');
  await page.selectOption('select[name="propertyType"]', 'Apartment');
  await page.fill('input[name="sizeSqm"]', '150');
  await page.fill('input[name="bedrooms"]', '3');
  await page.fill('input[name="bathrooms"]', '2');
  await page.fill('input[name="priceEgp"]', '3500000');

  // Place pin on map
  await page.click('.mapboxgl-canvas', { position: { x: 400, y: 300 } });

  // Submit
  await page.click('button:has-text("Submit Listing")');

  // Verify success
  await expect(page.locator('text=Listing submitted')).toBeVisible();
});
```

### Coverage Report

```bash
# Backend coverage
cd backend
npm run test:cov

# Open coverage report
open coverage/lcov-report/index.html

# Frontend coverage
cd frontend
npm run test:cov
```

**Coverage targets**:
- Unit tests: 80%+ code coverage
- API contract tests: 100% public endpoints
- E2E tests: 100% critical user journeys

---

## VS Code Setup

### Recommended Extensions

Install via **Extensions** sidebar (`Cmd+Shift+X` on macOS, `Ctrl+Shift+X` on Windows/Linux):

| Extension | Purpose | ID |
|-----------|---------|-----|
| **ESLint** | JavaScript/TypeScript linting | `dbaeumer.vscode-eslint` |
| **Prettier** | Code formatting | `esbenp.prettier-vscode` |
| **TypeScript** | TypeScript language support | Built-in |
| **Docker** | Docker container management | `ms-azuretools.vscode-docker` |
| **PostgreSQL** | SQL syntax highlighting | `ckolkman.vscode-postgres` |
| **Thunder Client** | API testing (Postman alternative) | `rangav.vscode-thunder-client` |
| **GitLens** | Git blame, history, diff | `eamodio.gitlens` |
| **Tailwind CSS IntelliSense** | Tailwind autocomplete | `bradlc.vscode-tailwindcss` |
| **Playwright Test** | Playwright test runner | `ms-playwright.playwright` |

**Install all at once**:

```bash
# Create .vscode/extensions.json
cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-azuretools.vscode-docker",
    "ckolkman.vscode-postgres",
    "rangav.vscode-thunder-client",
    "eamodio.gitlens",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright"
  ]
}
EOF
```

VS Code will prompt to install recommended extensions.

### Debug Configurations

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend (NestJS)",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "start:debug"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector",
      "skipFiles": ["<node_internals>/**"],
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"]
    },
    {
      "name": "Debug Frontend (Next.js)",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "cwd": "${workspaceFolder}/frontend",
      "console": "integratedTerminal",
      "serverReadyAction": {
        "pattern": "started server on .+, url: (https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    },
    {
      "name": "Debug Backend Tests",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "test:debug"],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

**Usage**:
1. Set breakpoints in code (click left of line numbers)
2. Press `F5` or go to **Run and Debug** sidebar
3. Select configuration (e.g., "Debug Backend (NestJS)")
4. Click green play button

### Tasks for Common Commands

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Database",
      "type": "shell",
      "command": "docker-compose up -d",
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "Stop Database",
      "type": "shell",
      "command": "docker-compose down",
      "group": "build"
    },
    {
      "label": "Run Migrations",
      "type": "shell",
      "command": "npm run migration:run",
      "options": {
        "cwd": "${workspaceFolder}/backend"
      },
      "group": "build"
    },
    {
      "label": "Seed Database",
      "type": "shell",
      "command": "npm run seed",
      "options": {
        "cwd": "${workspaceFolder}/backend"
      },
      "group": "build"
    },
    {
      "label": "Start Dev (Full Stack)",
      "type": "shell",
      "command": "npm run dev",
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    }
  ]
}
```

**Usage**:
- Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
- Type "Run Task"
- Select task (e.g., "Start Database")

### Workspace Settings

Create `.vscode/settings.json`:

```json
{
  // Editor
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.tabSize": 2,

  // TypeScript
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,

  // Files
  "files.exclude": {
    "**/.git": true,
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true
  },

  // Search
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true,
    "**/coverage": true
  },

  // Docker
  "docker.dockerComposePath": "docker-compose",

  // Prettier
  "prettier.singleQuote": true,
  "prettier.trailingComma": "all",
  "prettier.printWidth": 100,

  // ESLint
  "eslint.workingDirectories": [
    "./backend",
    "./frontend"
  ]
}
```

---

## Next Steps

After completing this quickstart guide:

1. **Read the Specification**: Review [spec.md](spec.md) for detailed feature requirements
2. **Understand Data Model**: Study [data-model.md](data-model.md) for database schema
3. **API Contracts**: Reference [contracts/api-spec.md](contracts/api-spec.md) for endpoint documentation
4. **Implementation Plan**: Follow [plan.md](plan.md) for development phases
5. **Run Tests**: Execute `npm run test` and `npm run test:e2e` to verify setup
6. **Start Building**: Begin with User Story 1 (Buyer Browse Listings) or User Story 2 (Seller Create Listing)

---

## Getting Help

### Documentation Resources

- **NestJS Docs**: [docs.nestjs.com](https://docs.nestjs.com)
- **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **TypeORM Docs**: [typeorm.io](https://typeorm.io)
- **PostGIS Reference**: [postgis.net/docs](https://postgis.net/docs/)
- **Mapbox GL JS Docs**: [docs.mapbox.com/mapbox-gl-js](https://docs.mapbox.com/mapbox-gl-js/api/)
- **Playwright Docs**: [playwright.dev](https://playwright.dev)

### Common Issues

If you encounter issues not covered in this guide:

1. Check container logs: `docker-compose logs -f`
2. Verify environment variables are correctly set
3. Ensure all prerequisites are installed and up-to-date
4. Review error messages in browser console (F12) and terminal
5. Search GitHub issues for similar problems

---

**Happy coding!**

For questions or contributions, please refer to the project README or open a GitHub issue.
