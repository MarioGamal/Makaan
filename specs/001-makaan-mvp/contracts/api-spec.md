# Makaan MVP - REST API Specification

**Version**: 1.0.0
**Created**: 2026-02-22
**Base URL**: `https://api.makaan.app/v1`
**Framework**: NestJS + TypeScript
**Authentication**: JWT (sellers/admins), localStorage (buyer saved listings)

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Endpoint Specifications](#endpoint-specifications)
   - [Authentication Endpoints](#authentication-endpoints)
   - [Listing Endpoints (Public/Buyer)](#listing-endpoints-publicbuyer)
   - [Listing Management (Seller)](#listing-management-seller)
   - [Admin Endpoints](#admin-endpoints)
   - [Saved Listings (Buyer)](#saved-listings-buyer)
4. [Data Transfer Objects (DTOs)](#data-transfer-objects-dtos)
5. [Error Handling](#error-handling)
6. [Security Considerations](#security-considerations)
7. [Rate Limiting](#rate-limiting)
8. [Pagination & Filtering](#pagination--filtering)

---

## API Overview

### Base Configuration

- **Protocol**: HTTPS only
- **Content-Type**: `application/json` (except file uploads: `multipart/form-data`)
- **Charset**: UTF-8
- **Timezone**: All timestamps in UTC (ISO 8601 format)
- **Currency**: Egyptian Pounds (EGP)

### Authentication Methods

| User Type | Method | Header Format |
|-----------|--------|---------------|
| Seller | JWT | `Authorization: Bearer <token>` |
| Admin | JWT | `Authorization: Bearer <token>` |
| Buyer (Saved Listings) | localStorage | Client-side UUID in request body |

### Standard HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET/PUT/DELETE |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE (no response body) |
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions (RBAC) |
| 404 | Not Found | Resource does not exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

---

## Authentication

### JWT Token Structure

```typescript
interface JwtPayload {
  sub: string;           // User ID
  phone: string;         // Masked phone (e.g., "+2010****5678")
  role: 'seller' | 'admin';
  sellerType?: 'owner' | 'agent'; // Inferred from behavior
  iat: number;           // Issued at (timestamp)
  exp: number;           // Expires at (timestamp)
}
```

### Token Lifecycle

- **Expiration**: 30 days for sellers, 8 hours for admins
- **Refresh**: Automatic refresh for sellers (sliding window), manual re-login for admins
- **Storage**: HTTP-only secure cookies (recommended) or client-side localStorage

---

## Endpoint Specifications

### Authentication Endpoints

#### 1. Request OTP Code

**Endpoint**: `POST /auth/otp/request`
**Access**: Public
**Rate Limit**: 3 requests per 10 minutes per phone number

**Description**: Sends OTP code to seller's phone number via SMS.

**Request Body**:

```typescript
{
  phone: string;  // E.164 format (e.g., "+201012345678")
}
```

**Validation Rules**:
- Phone number must match Egyptian format: `+2010xxxxxxxx`, `+2011xxxxxxxx`, `+2012xxxxxxxx`, `+2015xxxxxxxx`
- Must be 13 characters (including +20 prefix)

**Response (201 Created)**:

```typescript
{
  success: true;
  message: "OTP code sent to +2010****5678";
  expiresIn: 300; // seconds (5 minutes)
  retryAfter?: number; // seconds until next request allowed (if near limit)
}
```

**Error Responses**:

```typescript
// 400 Bad Request - Invalid phone format
{
  statusCode: 400;
  message: "Invalid phone number format. Must be Egyptian number (+2010/11/12/15xxxxxxxx)";
  error: "Bad Request";
}

// 429 Too Many Requests - Rate limit exceeded
{
  statusCode: 429;
  message: "Too many OTP requests. Please try again in 8 minutes.";
  error: "Too Many Requests";
  retryAfter: 480; // seconds
}
```

**Example cURL**:

```bash
curl -X POST https://api.makaan.app/v1/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+201012345678"}'
```

---

#### 2. Verify OTP Code

**Endpoint**: `POST /auth/otp/verify`
**Access**: Public
**Rate Limit**: 5 attempts per phone number (then requires new OTP)

**Description**: Verifies OTP code and returns JWT token for authenticated seller.

**Request Body**:

```typescript
{
  phone: string;  // E.164 format
  code: string;   // 6-digit OTP code
}
```

**Response (200 OK)**:

```typescript
{
  success: true;
  accessToken: string;  // JWT token
  tokenType: "Bearer";
  expiresIn: 2592000;   // 30 days in seconds
  user: {
    id: string;
    phone: string;      // Masked (e.g., "+2010****5678")
    role: "seller";
    sellerType: "owner" | "agent";
    createdAt: string;  // ISO 8601
  }
}
```

**Error Responses**:

```typescript
// 400 Bad Request - Invalid or expired OTP
{
  statusCode: 400;
  message: "Invalid or expired OTP code";
  error: "Bad Request";
}

// 429 Too Many Requests - Too many failed attempts
{
  statusCode: 429;
  message: "Too many failed attempts. Please request a new OTP code.";
  error: "Too Many Requests";
}
```

**Example cURL**:

```bash
curl -X POST https://api.makaan.app/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone": "+201012345678", "code": "123456"}'
```

---

#### 3. Admin Login

**Endpoint**: `POST /admin/login`
**Access**: Public (admin credentials required)
**Rate Limit**: 5 attempts per 15 minutes per IP

**Description**: Authenticates admin user with password and 2FA code.

**Request Body**:

```typescript
{
  username: string;     // Admin username
  password: string;     // Min 12 chars, complexity requirements
  twoFactorCode: string; // 6-digit TOTP code
}
```

**Response (200 OK)**:

```typescript
{
  success: true;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: 28800;  // 8 hours in seconds
  user: {
    id: string;
    username: string;
    role: "admin";
    lastLogin: string; // ISO 8601
  }
}
```

**Error Responses**:

```typescript
// 401 Unauthorized - Invalid credentials
{
  statusCode: 401;
  message: "Invalid username, password, or 2FA code";
  error: "Unauthorized";
}

// 429 Too Many Requests - Brute force protection
{
  statusCode: 429;
  message: "Too many login attempts. Please try again in 12 minutes.";
  error: "Too Many Requests";
  retryAfter: 720;
}
```

**Example cURL**:

```bash
curl -X POST https://api.makaan.app/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin@makaan.app",
    "password": "SecureP@ssw0rd123",
    "twoFactorCode": "123456"
  }'
```

---

#### 4. Logout

**Endpoint**: `POST /auth/logout`
**Access**: Authenticated (seller or admin)
**Rate Limit**: None

**Description**: Invalidates JWT token and ends session.

**Request Headers**:

```
Authorization: Bearer <token>
```

**Response (200 OK)**:

```typescript
{
  success: true;
  message: "Logged out successfully";
}
```

**Example cURL**:

```bash
curl -X POST https://api.makaan.app/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### Listing Endpoints (Public/Buyer)

#### 5. Browse Listings

**Endpoint**: `GET /listings`
**Access**: Public
**Rate Limit**: 100 requests per minute per IP

**Description**: Retrieves paginated listings with filters and sorting.

**Query Parameters**:

```typescript
{
  // Filters
  purpose?: 'sale' | 'rent';
  propertyType?: 'Apartment' | 'Villa' | 'Duplex' | 'Penthouse' | 'Studio' | 'Townhouse' | 'Chalet';
  minPrice?: number;        // EGP
  maxPrice?: number;        // EGP
  bedrooms?: number;
  bathrooms?: number;
  sellerType?: 'owner' | 'agent';

  // Geographic filters
  areaName?: string;        // Cairo area name (e.g., "Nasr City")
  bounds?: string;          // Map viewport bounds "minLat,minLng,maxLat,maxLng"

  // Pagination (cursor-based for mobile)
  cursor?: string;          // Opaque cursor from previous response
  limit?: number;           // Default 20, max 100

  // Sorting
  sortBy?: 'createdAt' | 'price' | 'views' | 'saves';
  sortOrder?: 'asc' | 'desc'; // Default 'desc'
}
```

**Response (200 OK)**:

```typescript
{
  success: true;
  data: Listing[];  // Array of listing objects (see DTO section)
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    total: number;  // Total matching listings
  };
  filters: {
    applied: object;  // Echo back applied filters
  };
}
```

**Example Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "lst_abc123xyz",
      "purpose": "sale",
      "propertyType": "Apartment",
      "size": 150,
      "bedrooms": 3,
      "bathrooms": 2,
      "finishing": "Fully finished",
      "price": 3500000,
      "location": {
        "lat": 30.0444,
        "lng": 31.2357,
        "areaName": "Nasr City"
      },
      "photos": [
        "https://cdn.makaan.app/listings/lst_abc123xyz/photo1.webp",
        "https://cdn.makaan.app/listings/lst_abc123xyz/photo2.webp"
      ],
      "seller": {
        "type": "owner",
        "verified": true
      },
      "stats": {
        "views": 234,
        "saves": 12,
        "daysListed": 5
      },
      "createdAt": "2026-02-17T10:30:00Z"
    }
  ],
  "pagination": {
    "nextCursor": "eyJpZCI6Imxz...",
    "hasMore": true,
    "total": 156
  },
  "filters": {
    "applied": {
      "purpose": "sale",
      "propertyType": "Apartment",
      "bedrooms": 3
    }
  }
}
```

**Error Responses**:

```typescript
// 400 Bad Request - Invalid filter values
{
  statusCode: 400;
  message: "Invalid price range: minPrice must be less than maxPrice";
  error: "Bad Request";
}
```

**Example cURL**:

```bash
curl -X GET "https://api.makaan.app/v1/listings?purpose=sale&bedrooms=3&minPrice=2000000&maxPrice=5000000&limit=20" \
  -H "Content-Type: application/json"
```

---

#### 6. Search Listings by Area

**Endpoint**: `GET /listings/search`
**Access**: Public
**Rate Limit**: 100 requests per minute per IP

**Description**: Full-text search for listings by Cairo area name with autocomplete.

**Query Parameters**:

```typescript
{
  q: string;                // Search query (area name)
  autocomplete?: boolean;   // Return area suggestions (default false)
  limit?: number;           // Default 20, max 100
  cursor?: string;
}
```

**Response (200 OK)**:

```typescript
{
  success: true;
  query: string;
  areaMatch: {
    name: string;
    bounds: {
      minLat: number;
      minLng: number;
      maxLat: number;
      maxLng: number;
    };
  } | null;
  suggestions?: string[];  // If autocomplete=true
  data: Listing[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    total: number;
  };
}
```

**Example Response (Autocomplete)**:

```json
{
  "success": true,
  "query": "nasr",
  "areaMatch": null,
  "suggestions": [
    "Nasr City",
    "Nasr City - First District",
    "Nasr City - Seventh District"
  ]
}
```

**Error Responses**:

```typescript
// 404 Not Found - No matching area
{
  statusCode: 404;
  message: "Area 'Alexandria' not found. Makaan currently serves Cairo only.";
  error: "Not Found";
}
```

**Example cURL**:

```bash
curl -X GET "https://api.makaan.app/v1/listings/search?q=Nasr%20City&limit=20" \
  -H "Content-Type: application/json"
```

---

#### 7. Get Listing Details

**Endpoint**: `GET /listings/:id`
**Access**: Public
**Rate Limit**: 200 requests per minute per IP

**Description**: Retrieves full details for a single listing.

**Path Parameters**:

- `id` (string): Listing ID

**Response (200 OK)**:

```typescript
{
  success: true;
  data: {
    id: string;
    purpose: 'sale' | 'rent';
    propertyType: string;
    size: number;
    bedrooms: number;
    bathrooms: number;
    finishing: string;
    price: number;
    description?: string;
    location: {
      lat: number;
      lng: number;
      areaName: string;
    };
    photos: string[];  // Array of image URLs
    seller: {
      id: string;      // Masked seller ID
      type: 'owner' | 'agent';
      verified: boolean;
      listingsCount: number;
    };
    stats: {
      views: number;
      saves: number;
      daysListed: number;
    };
    status: 'active';  // Only active listings returned
    createdAt: string;
    updatedAt: string;
  };
}
```

**Error Responses**:

```typescript
// 404 Not Found - Listing does not exist or not active
{
  statusCode: 404;
  message: "Listing not found";
  error: "Not Found";
}
```

**Example cURL**:

```bash
curl -X GET https://api.makaan.app/v1/listings/lst_abc123xyz \
  -H "Content-Type: application/json"
```

---

#### 8. Track Listing View

**Endpoint**: `POST /listings/:id/view`
**Access**: Public
**Rate Limit**: 10 views per minute per listing per IP

**Description**: Tracks a view event for analytics (increments view count).

**Path Parameters**:

- `id` (string): Listing ID

**Request Body**:

```typescript
{
  source?: 'map' | 'search' | 'direct_link' | 'saved'; // View source
  sessionId?: string;  // Client-side session UUID (for deduplication)
}
```

**Response (201 Created)**:

```typescript
{
  success: true;
  message: "View recorded";
}
```

**Error Responses**:

```typescript
// 404 Not Found
{
  statusCode: 404;
  message: "Listing not found";
  error: "Not Found";
}

// 429 Too Many Requests - Duplicate view spam
{
  statusCode: 429;
  message: "Too many view events. Please wait before trying again.";
  error: "Too Many Requests";
}
```

**Example cURL**:

```bash
curl -X POST https://api.makaan.app/v1/listings/lst_abc123xyz/view \
  -H "Content-Type: application/json" \
  -d '{"source": "map", "sessionId": "uuid-123"}'
```

---

#### 9. Track Contact Action

**Endpoint**: `POST /listings/:id/contact`
**Access**: Public
**Rate Limit**: 50 contacts per day per buyer (tracked by IP or session)

**Description**: Tracks when a buyer clicks WhatsApp or call button. Returns seller contact info.

**Path Parameters**:

- `id` (string): Listing ID

**Request Body**:

```typescript
{
  method: 'whatsapp' | 'call';
  sessionId?: string;  // Client-side session UUID
}
```

**Response (200 OK)**:

```typescript
{
  success: true;
  contactInfo: {
    whatsappLink?: string;  // WhatsApp deep link (if method=whatsapp)
    phoneNumber?: string;   // tel: link (if method=call)
  };
  message: "Contact information retrieved. Seller will be notified.";
}
```

**Example Response**:

```json
{
  "success": true,
  "contactInfo": {
    "whatsappLink": "https://wa.me/201012345678?text=Hello%2C%20I%27m%20interested%20in%20your%20property%20in%20Nasr%20City"
  },
  "message": "Contact information retrieved. Seller will be notified."
}
```

**Error Responses**:

```typescript
// 429 Too Many Requests - Daily limit exceeded
{
  statusCode: 429;
  message: "Daily contact limit reached (50/day). Please try again tomorrow.";
  error: "Too Many Requests";
  retryAfter: 43200; // seconds until limit resets
}
```

**Example cURL**:

```bash
curl -X POST https://api.makaan.app/v1/listings/lst_abc123xyz/contact \
  -H "Content-Type: application/json" \
  -d '{"method": "whatsapp", "sessionId": "uuid-123"}'
```

---

### Listing Management (Seller)

#### 10. Create Draft Listing

**Endpoint**: `POST /seller/listings`
**Access**: Authenticated seller
**Rate Limit**: 5 listings per day (owner), 20 per day (agent)

**Description**: Creates a new draft listing. Does not require all fields initially.

**Request Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:

```typescript
{
  purpose?: 'sale' | 'rent';
  propertyType?: 'Apartment' | 'Villa' | 'Duplex' | 'Penthouse' | 'Studio' | 'Townhouse' | 'Chalet';
  size?: number;
  bedrooms?: number;
  bathrooms?: number;
  finishing?: 'Semi-finished' | 'Fully finished' | 'Luxury finished';
  price?: number;
  description?: string;
  location?: {
    lat: number;
    lng: number;
    areaName?: string;  // Optional, inferred from coordinates if not provided
  };
}
```

**Response (201 Created)**:

```typescript
{
  success: true;
  data: {
    id: string;
    status: 'draft';
    purpose?: string;
    propertyType?: string;
    // ... other fields from request
    photos: [];
    createdAt: string;
    updatedAt: string;
  };
}
```

**Error Responses**:

```typescript
// 401 Unauthorized - Not authenticated
{
  statusCode: 401;
  message: "Unauthorized. Please log in as a seller.";
  error: "Unauthorized";
}

// 429 Too Many Requests - Rate limit exceeded
{
  statusCode: 429;
  message: "Daily listing limit reached (5/day for owners). You can create more listings tomorrow.";
  error: "Too Many Requests";
  retryAfter: 28800; // seconds
}
```

**Example cURL**:

```bash
curl -X POST https://api.makaan.app/v1/seller/listings \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "purpose": "sale",
    "propertyType": "Apartment",
    "bedrooms": 3,
    "bathrooms": 2
  }'
```

---

#### 11. Update Draft or Rejected Listing

**Endpoint**: `PUT /seller/listings/:id`
**Access**: Authenticated seller (owns listing)
**Rate Limit**: 20 updates per hour per seller

**Description**: Updates an existing draft or rejected listing.

**Path Parameters**:

- `id` (string): Listing ID

**Request Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:

```typescript
{
  // Same fields as POST /seller/listings
  // Only provided fields will be updated
  purpose?: 'sale' | 'rent';
  propertyType?: string;
  size?: number;
  bedrooms?: number;
  bathrooms?: number;
  finishing?: string;
  price?: number;
  description?: string;
  location?: {
    lat: number;
    lng: number;
  };
}
```

**Response (200 OK)**:

```typescript
{
  success: true;
  data: {
    id: string;
    status: 'draft' | 'rejected';
    // ... updated fields
    updatedAt: string;
  };
}
```

**Error Responses**:

```typescript
// 403 Forbidden - Cannot edit active/pending listing
{
  statusCode: 403;
  message: "Cannot edit listing with status 'active'. Mark as inactive first.";
  error: "Forbidden";
}

// 404 Not Found
{
  statusCode: 404;
  message: "Listing not found or you do not have permission to edit it.";
  error: "Not Found";
}
```

**Example cURL**:

```bash
curl -X PUT https://api.makaan.app/v1/seller/listings/lst_abc123xyz \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "price": 3800000,
    "description": "Spacious apartment with modern amenities"
  }'
```

---

#### 12. Submit Listing for Review

**Endpoint**: `POST /seller/listings/:id/submit`
**Access**: Authenticated seller (owns listing)
**Rate Limit**: 10 submissions per hour per seller

**Description**: Submits a draft listing for admin review. Validates all required fields.

**Path Parameters**:

- `id` (string): Listing ID

**Request Headers**:

```
Authorization: Bearer <token>
```

**Response (200 OK)**:

```typescript
{
  success: true;
  message: "Listing submitted for review. You will be notified once it is approved.";
  data: {
    id: string;
    status: 'pending';
    submittedAt: string;
  };
}
```

**Error Responses**:

```typescript
// 400 Bad Request - Missing required fields
{
  statusCode: 400;
  message: "Cannot submit listing. Missing required fields: location, photos (minimum 3)";
  error: "Bad Request";
  validationErrors: [
    {
      field: "location";
      message: "Map pin is required";
    },
    {
      field: "photos";
      message: "Minimum 3 photos required (currently 1)";
    }
  ];
}

// 400 Bad Request - Location outside Cairo
{
  statusCode: 400;
  message: "Map pin must be within Cairo boundaries";
  error: "Bad Request";
}
```

**Example cURL**:

```bash
curl -X POST https://api.makaan.app/v1/seller/listings/lst_abc123xyz/submit \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

#### 13. Upload Listing Photos

**Endpoint**: `POST /seller/listings/:id/photos`
**Access**: Authenticated seller (owns listing)
**Rate Limit**: 10 uploads per minute per seller

**Description**: Uploads photos for a listing. Maximum 10 photos per listing.

**Path Parameters**:

- `id` (string): Listing ID

**Request Headers**:

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data)**:

```typescript
{
  photos: File[];  // Array of image files
}
```

**Validation Rules**:
- File types: `image/jpeg`, `image/png`, `image/webp`
- Max file size: 5MB per image
- Max 10 photos per listing
- EXIF metadata stripped server-side
- Images resized/compressed automatically

**Response (201 Created)**:

```typescript
{
  success: true;
  message: "3 photos uploaded successfully";
  data: {
    photos: [
      {
        id: string;
        url: string;
        order: number;
        uploadedAt: string;
      }
    ];
  };
}
```

**Error Responses**:

```typescript
// 400 Bad Request - Invalid file type
{
  statusCode: 400;
  message: "Invalid file type. Only JPG, PNG, and WebP images are allowed.";
  error: "Bad Request";
}

// 413 Payload Too Large - File size exceeded
{
  statusCode: 413;
  message: "File 'IMG_1234.jpg' exceeds maximum size of 5MB";
  error: "Payload Too Large";
}

// 400 Bad Request - Too many photos
{
  statusCode: 400;
  message: "Maximum 10 photos allowed per listing. Remove existing photos to upload new ones.";
  error: "Bad Request";
}
```

**Example cURL**:

```bash
curl -X POST https://api.makaan.app/v1/seller/listings/lst_abc123xyz/photos \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "photos=@photo1.jpg" \
  -F "photos=@photo2.jpg" \
  -F "photos=@photo3.jpg"
```

---

#### 14. Delete Listing Photo

**Endpoint**: `DELETE /seller/listings/:id/photos/:photoId`
**Access**: Authenticated seller (owns listing)
**Rate Limit**: 20 deletions per hour per seller

**Description**: Deletes a photo from a listing.

**Path Parameters**:

- `id` (string): Listing ID
- `photoId` (string): Photo ID

**Request Headers**:

```
Authorization: Bearer <token>
```

**Response (200 OK)**:

```typescript
{
  success: true;
  message: "Photo deleted successfully";
}
```

**Error Responses**:

```typescript
// 404 Not Found
{
  statusCode: 404;
  message: "Photo not found";
  error: "Not Found";
}

// 403 Forbidden - Cannot delete from submitted listing
{
  statusCode: 403;
  message: "Cannot delete photos from submitted listing. Please wait for admin review.";
  error: "Forbidden";
}
```

**Example cURL**:

```bash
curl -X DELETE https://api.makaan.app/v1/seller/listings/lst_abc123xyz/photos/photo_xyz789 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

#### 15. Update Listing Status

**Endpoint**: `PUT /seller/listings/:id/status`
**Access**: Authenticated seller (owns listing)
**Rate Limit**: 10 updates per hour per seller

**Description**: Marks an active listing as sold or inactive.

**Path Parameters**:

- `id` (string): Listing ID

**Request Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:

```typescript
{
  status: 'sold' | 'inactive';
}
```

**Response (200 OK)**:

```typescript
{
  success: true;
  message: "Listing marked as sold. It has been removed from public view.";
  data: {
    id: string;
    status: 'sold' | 'inactive';
    updatedAt: string;
  };
}
```

**Error Responses**:

```typescript
// 403 Forbidden - Invalid status transition
{
  statusCode: 403;
  message: "Cannot mark draft listing as sold. Submit for review first.";
  error: "Forbidden";
}
```

**Example cURL**:

```bash
curl -X PUT https://api.makaan.app/v1/seller/listings/lst_abc123xyz/status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"status": "sold"}'
```

---

#### 16. Get Seller Dashboard

**Endpoint**: `GET /seller/dashboard`
**Access**: Authenticated seller
**Rate Limit**: 60 requests per hour per seller

**Description**: Retrieves all seller's listings with engagement metrics.

**Request Headers**:

```
Authorization: Bearer <token>
```

**Query Parameters**:

```typescript
{
  status?: 'draft' | 'pending' | 'active' | 'rejected' | 'sold' | 'inactive';
  cursor?: string;
  limit?: number;  // Default 20, max 100
}
```

**Response (200 OK)**:

```typescript
{
  success: true;
  data: {
    listings: [
      {
        id: string;
        status: string;
        purpose: string;
        propertyType: string;
        price: number;
        location: {
          areaName: string;
        };
        photos: string[];
        stats: {
          views: number;
          saves: number;
          contacts: number;
          daysListed: number;
        };
        rejectionReason?: string;  // If status=rejected
        createdAt: string;
        updatedAt: string;
      }
    ];
    summary: {
      totalListings: number;
      activeListings: number;
      pendingListings: number;
      totalViews: number;
      totalContacts: number;
    };
  };
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}
```

**Example cURL**:

```bash
curl -X GET "https://api.makaan.app/v1/seller/dashboard?status=active&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### Admin Endpoints

#### 17. Get Pending Listings Queue

**Endpoint**: `GET /admin/listings/pending`
**Access**: Authenticated admin
**Rate Limit**: 100 requests per hour per admin

**Description**: Retrieves all pending listings awaiting moderation.

**Request Headers**:

```
Authorization: Bearer <token>
```

**Query Parameters**:

```typescript
{
  cursor?: string;
  limit?: number;  // Default 50, max 100
  sortBy?: 'submittedAt' | 'price' | 'seller';
  sortOrder?: 'asc' | 'desc'; // Default 'asc' (oldest first)
}
```

**Response (200 OK)**:

```typescript
{
  success: true;
  data: [
    {
      id: string;
      purpose: string;
      propertyType: string;
      price: number;
      size: number;
      bedrooms: number;
      bathrooms: number;
      finishing: string;
      location: {
        lat: number;
        lng: number;
        areaName: string;
      };
      photos: string[];
      seller: {
        id: string;
        phone: string;  // Masked
        type: 'owner' | 'agent';
        listingsCount: number;
        approvalRate: number;  // % of approved listings
      };
      submittedAt: string;
      waitingTime: number;  // Hours waiting in queue
    }
  ];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    total: number;
  };
}
```

**Example cURL**:

```bash
curl -X GET "https://api.makaan.app/v1/admin/listings/pending?limit=50" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

#### 18. Review Listing with AI Duplicate Hints

**Endpoint**: `GET /admin/listings/:id/review`
**Access**: Authenticated admin
**Rate Limit**: 200 requests per hour per admin

**Description**: Retrieves listing details with AI-generated duplicate hints.

**Path Parameters**:

- `id` (string): Listing ID

**Request Headers**:

```
Authorization: Bearer <token>
```

**Response (200 OK)**:

```typescript
{
  success: true;
  data: {
    listing: {
      id: string;
      // ... full listing details
    };
    duplicateHints: {
      hasPotentialDuplicates: boolean;
      confidence: 'low' | 'medium' | 'high';
      similarListings: [
        {
          id: string;
          similarity: number;  // 0-100%
          reasons: string[];   // ["Same location (12m distance)", "Same specs (3BR/2BA)", "Similar price"]
          status: 'active' | 'rejected';
          seller: {
            id: string;
            phone: string;  // Masked
          };
          photos: string[];
        }
      ];
    };
    validationChecks: {
      locationInCairo: boolean;
      requiredFieldsComplete: boolean;
      minimumPhotos: boolean;
      photoQuality: 'poor' | 'acceptable' | 'good';
      suspiciousPatterns: string[];  // e.g., ["Stock photos detected", "Price significantly below market"]
    };
  };
}
```

**Example Response**:

```json
{
  "success": true,
  "data": {
    "listing": { /* ... */ },
    "duplicateHints": {
      "hasPotentialDuplicates": true,
      "confidence": "high",
      "similarListings": [
        {
          "id": "lst_xyz789",
          "similarity": 92,
          "reasons": [
            "Same location (8m distance)",
            "Identical specs (3BR/2BA/150sqm)",
            "Same price (3.5M EGP)"
          ],
          "status": "active",
          "seller": {
            "id": "usr_abc456",
            "phone": "+2011****9876"
          }
        }
      ]
    },
    "validationChecks": {
      "locationInCairo": true,
      "requiredFieldsComplete": true,
      "minimumPhotos": true,
      "photoQuality": "good",
      "suspiciousPatterns": []
    }
  }
}
```

**Example cURL**:

```bash
curl -X GET https://api.makaan.app/v1/admin/listings/lst_abc123xyz/review \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

#### 19. Approve Listing

**Endpoint**: `POST /admin/listings/:id/approve`
**Access**: Authenticated admin
**Rate Limit**: 100 approvals per hour per admin

**Description**: Approves a pending listing and makes it active.

**Path Parameters**:

- `id` (string): Listing ID

**Request Headers**:

```
Authorization: Bearer <token>
```

**Response (200 OK)**:

```typescript
{
  success: true;
  message: "Listing approved and published successfully";
  data: {
    id: string;
    status: 'active';
    approvedAt: string;
    approvedBy: string;  // Admin ID
  };
}
```

**Error Responses**:

```typescript
// 400 Bad Request - Validation failures
{
  statusCode: 400;
  message: "Cannot approve listing with validation errors";
  error: "Bad Request";
  validationErrors: [
    {
      field: "location";
      message: "Map pin is outside Cairo boundaries";
    }
  ];
}

// 409 Conflict - Already approved
{
  statusCode: 409;
  message: "Listing is already approved";
  error: "Conflict";
}
```

**Example cURL**:

```bash
curl -X POST https://api.makaan.app/v1/admin/listings/lst_abc123xyz/approve \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

#### 20. Reject Listing

**Endpoint**: `POST /admin/listings/:id/reject`
**Access**: Authenticated admin
**Rate Limit**: 100 rejections per hour per admin

**Description**: Rejects a pending listing with a reason.

**Path Parameters**:

- `id` (string): Listing ID

**Request Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:

```typescript
{
  reason: 'incomplete_data' | 'inaccurate_location' | 'duplicate' | 'spam_scam' | 'other';
  notes?: string;  // Optional admin notes (shown to seller)
}
```

**Response (200 OK)**:

```typescript
{
  success: true;
  message: "Listing rejected. Seller will be notified.";
  data: {
    id: string;
    status: 'rejected';
    rejectionReason: string;
    rejectedAt: string;
    rejectedBy: string;  // Admin ID
  };
}
```

**Error Responses**:

```typescript
// 400 Bad Request - Missing reason
{
  statusCode: 400;
  message: "Rejection reason is required";
  error: "Bad Request";
}
```

**Example cURL**:

```bash
curl -X POST https://api.makaan.app/v1/admin/listings/lst_abc123xyz/reject \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "duplicate",
    "notes": "Duplicate of listing lst_xyz789. Please remove."
  }'
```

---

#### 21. Block User

**Endpoint**: `POST /admin/users/:id/block`
**Access**: Authenticated admin
**Rate Limit**: 20 blocks per hour per admin

**Description**: Blocks a user account and unpublishes all their listings.

**Path Parameters**:

- `id` (string): User ID

**Request Headers**:

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body**:

```typescript
{
  reason: string;  // Required reason for blocking
  permanent?: boolean;  // Default false (7-day suspension)
}
```

**Response (200 OK)**:

```typescript
{
  success: true;
  message: "User blocked successfully. 5 active listings unpublished.";
  data: {
    userId: string;
    status: 'blocked';
    blockedAt: string;
    blockedBy: string;  // Admin ID
    blockDuration: number | null;  // Days, null if permanent
  };
}
```

**Example cURL**:

```bash
curl -X POST https://api.makaan.app/v1/admin/users/usr_abc123/block \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Repeated spam listings",
    "permanent": false
  }'
```

---

### Saved Listings (Buyer)

#### 22. Save Listing

**Endpoint**: `POST /saved-listings/:listingId`
**Access**: Public (uses client-side session ID)
**Rate Limit**: 100 saves per hour per session

**Description**: Saves a listing to buyer's favorites.

**Path Parameters**:

- `listingId` (string): Listing ID

**Request Body**:

```typescript
{
  sessionId: string;  // Client-side UUID stored in localStorage
}
```

**Response (201 Created)**:

```typescript
{
  success: true;
  message: "Listing saved successfully";
  data: {
    listingId: string;
    savedAt: string;
  };
}
```

**Error Responses**:

```typescript
// 400 Bad Request - Missing session ID
{
  statusCode: 400;
  message: "Session ID is required";
  error: "Bad Request";
}

// 409 Conflict - Already saved
{
  statusCode: 409;
  message: "Listing is already saved";
  error: "Conflict";
}
```

**Example cURL**:

```bash
curl -X POST https://api.makaan.app/v1/saved-listings/lst_abc123xyz \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "uuid-123-456-789"}'
```

---

#### 23. Unsave Listing

**Endpoint**: `DELETE /saved-listings/:listingId`
**Access**: Public (uses client-side session ID)
**Rate Limit**: 100 unsaves per hour per session

**Description**: Removes a listing from buyer's favorites.

**Path Parameters**:

- `listingId` (string): Listing ID

**Request Body**:

```typescript
{
  sessionId: string;
}
```

**Response (200 OK)**:

```typescript
{
  success: true;
  message: "Listing removed from saved items";
}
```

**Example cURL**:

```bash
curl -X DELETE https://api.makaan.app/v1/saved-listings/lst_abc123xyz \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "uuid-123-456-789"}'
```

---

#### 24. Get Saved Listings

**Endpoint**: `GET /saved-listings`
**Access**: Public (uses client-side session ID)
**Rate Limit**: 60 requests per hour per session

**Description**: Retrieves all saved listings for a buyer session.

**Query Parameters**:

```typescript
{
  sessionId: string;
  cursor?: string;
  limit?: number;  // Default 20, max 100
}
```

**Response (200 OK)**:

```typescript
{
  success: true;
  data: Listing[];  // Array of full listing objects
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    total: number;
  };
}
```

**Example cURL**:

```bash
curl -X GET "https://api.makaan.app/v1/saved-listings?sessionId=uuid-123-456-789&limit=20" \
  -H "Content-Type: application/json"
```

---

## Data Transfer Objects (DTOs)

### Listing Object

```typescript
interface Listing {
  id: string;
  purpose: 'sale' | 'rent';
  propertyType: 'Apartment' | 'Villa' | 'Duplex' | 'Penthouse' | 'Studio' | 'Townhouse' | 'Chalet';
  size: number;           // Square meters
  bedrooms: number;
  bathrooms: number;
  finishing: 'Semi-finished' | 'Fully finished' | 'Luxury finished';
  price: number;          // EGP
  description?: string;
  location: {
    lat: number;
    lng: number;
    areaName: string;
  };
  photos: string[];       // Array of CDN URLs
  seller: {
    id: string;           // Masked seller ID
    type: 'owner' | 'agent';
    verified: boolean;
    listingsCount?: number;
  };
  stats: {
    views: number;
    saves: number;
    contacts?: number;    // Only visible to seller/admin
    daysListed: number;
  };
  status: 'draft' | 'pending' | 'active' | 'rejected' | 'sold' | 'inactive';
  rejectionReason?: string;
  createdAt: string;      // ISO 8601
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
}
```

### User Object

```typescript
interface User {
  id: string;
  phone: string;          // Masked (e.g., "+2010****5678")
  role: 'buyer' | 'seller' | 'admin';
  sellerType?: 'owner' | 'agent';
  verified?: boolean;
  status: 'active' | 'blocked';
  createdAt: string;
  lastLogin?: string;
}
```

### Photo Object

```typescript
interface Photo {
  id: string;
  url: string;            // CDN URL
  order: number;          // Display order (0-9)
  uploadedAt: string;
}
```

### Pagination Object

```typescript
interface Pagination {
  nextCursor: string | null;  // Opaque cursor for next page
  hasMore: boolean;
  total?: number;             // Total count (optional, expensive query)
}
```

### Error Response Object

```typescript
interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;            // HTTP status text
  validationErrors?: Array<{
    field: string;
    message: string;
  }>;
  retryAfter?: number;      // Seconds (for rate limit errors)
  timestamp?: string;       // ISO 8601
  path?: string;            // Request path
}
```

---

## Error Handling

### Standard Error Response Format

All error responses follow this structure:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "validationErrors": [
    {
      "field": "price",
      "message": "Price must be a positive number"
    }
  ],
  "timestamp": "2026-02-22T14:30:00Z",
  "path": "/seller/listings"
}
```

### Error Categories

| Category | HTTP Status | Description |
|----------|-------------|-------------|
| Validation Error | 400 | Invalid input data (missing fields, wrong format) |
| Authentication Error | 401 | Missing or invalid JWT token |
| Authorization Error | 403 | Insufficient permissions (RBAC) |
| Not Found | 404 | Resource does not exist |
| Conflict | 409 | Resource already exists or state conflict |
| Rate Limit Error | 429 | Too many requests |
| Server Error | 500 | Unexpected internal error |

### Validation Error Details

Validation errors include field-specific messages:

```json
{
  "statusCode": 400,
  "message": "Cannot submit listing. Missing required fields.",
  "error": "Bad Request",
  "validationErrors": [
    {
      "field": "location",
      "message": "Map pin is required"
    },
    {
      "field": "photos",
      "message": "Minimum 3 photos required (currently 1)"
    },
    {
      "field": "price",
      "message": "Price must be between 100,000 and 100,000,000 EGP"
    }
  ]
}
```

---

## Security Considerations

### CORS (Cross-Origin Resource Sharing)

- **Allowed Origins**: Whitelist production domain (e.g., `https://makaan.app`, `https://www.makaan.app`)
- **Allowed Methods**: `GET, POST, PUT, DELETE, OPTIONS`
- **Allowed Headers**: `Authorization, Content-Type`
- **Credentials**: `true` (for HTTP-only cookies)
- **Max Age**: 86400 seconds (24 hours)

### CSRF Protection

- **Double Submit Cookie**: CSRF token in cookie + request header
- **SameSite Cookies**: `SameSite=Strict` for session cookies
- **State-Changing Endpoints**: All POST/PUT/DELETE require CSRF token

### Input Validation

- **DTO Validation**: Use `class-validator` decorators on all DTOs
- **Sanitization**: Strip HTML tags, escape special characters
- **Phone Number Validation**: Strict Egyptian format validation
- **Coordinate Validation**: Ensure lat/lng within Cairo boundaries
- **File Upload Validation**: MIME type checking, virus scanning

### Rate Limiting Strategy

```typescript
// Global rate limit (per IP)
{
  ttl: 60000,        // 1 minute
  limit: 100         // 100 requests per minute
}

// OTP request rate limit (per phone number)
{
  ttl: 600000,       // 10 minutes
  limit: 3           // 3 OTP requests per 10 minutes
}

// Listing creation (per seller)
{
  ttl: 86400000,     // 24 hours
  limit: 5           // 5 listings per day (owners)
}

// Contact actions (per session/IP)
{
  ttl: 86400000,     // 24 hours
  limit: 50          // 50 contacts per day
}
```

### Data Privacy

- **Phone Masking**: Always mask middle 4 digits (e.g., `+2010****5678`)
- **No OTP Logging**: Never log OTP codes or authentication tokens
- **EXIF Stripping**: Remove all EXIF metadata from uploaded photos
- **HTTPS Only**: Enforce TLS 1.2+ for all endpoints
- **JWT Secrets**: Use strong secrets (min 256-bit), rotate regularly

---

## Rate Limiting

### Implementation with @nestjs/throttler

```typescript
// Global throttler configuration
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),
  ],
})
```

### Per-Endpoint Rate Limits

| Endpoint | Limit | Window | Key |
|----------|-------|--------|-----|
| `POST /auth/otp/request` | 3 | 10 min | Phone number |
| `POST /auth/otp/verify` | 5 | 5 min | Phone number |
| `POST /admin/login` | 5 | 15 min | IP address |
| `POST /seller/listings` | 5 (owner) / 20 (agent) | 24 hours | User ID |
| `POST /listings/:id/contact` | 50 | 24 hours | Session ID / IP |
| `POST /seller/listings/:id/photos` | 10 | 1 min | User ID |
| `GET /listings` | 100 | 1 min | IP address |
| `GET /admin/listings/pending` | 100 | 1 hour | User ID |

### Rate Limit Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1677253200
Retry-After: 45
```

### Custom Rate Limiting Guards

```typescript
// Seller listing creation rate limit (based on seller type)
@UseGuards(SellerListingThrottlerGuard)
@Post('seller/listings')
createListing() {
  // Implementation
}

// Dynamic rate limit based on user role
class SellerListingThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request): Promise<string> {
    const user = req.user as JwtPayload;
    return user.sub; // User ID
  }

  protected async getLimit(context: ExecutionContext): Promise<number> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return user.sellerType === 'agent' ? 20 : 5;
  }
}
```

---

## Pagination & Filtering

### Cursor-Based Pagination

Cursor-based pagination is used for mobile-friendly infinite scroll:

**Request**:

```
GET /listings?cursor=eyJpZCI6Imxzd..&limit=20
```

**Response**:

```json
{
  "data": [ /* ... */ ],
  "pagination": {
    "nextCursor": "eyJpZCI6Imxzd...",
    "hasMore": true,
    "total": 156
  }
}
```

**Cursor Structure** (Base64-encoded JSON):

```json
{
  "id": "lst_abc123xyz",
  "createdAt": "2026-02-22T14:30:00Z"
}
```

### Filtering Query Parameters

All filters are optional and can be combined:

```
GET /listings?purpose=sale&propertyType=Apartment&minPrice=2000000&maxPrice=5000000&bedrooms=3&bathrooms=2&sellerType=owner&areaName=Nasr%20City&limit=20
```

### Filter Validation

```typescript
class ListingFiltersDto {
  @IsOptional()
  @IsEnum(['sale', 'rent'])
  purpose?: 'sale' | 'rent';

  @IsOptional()
  @IsEnum(['Apartment', 'Villa', 'Duplex', 'Penthouse', 'Studio', 'Townhouse', 'Chalet'])
  propertyType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsEnum(['owner', 'agent'])
  sellerType?: 'owner' | 'agent';

  @IsOptional()
  @IsString()
  areaName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/)
  bounds?: string; // "minLat,minLng,maxLat,maxLng"

  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(['createdAt', 'price', 'views', 'saves'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
```

### Sorting Options

| Sort Field | Description | Default Order |
|------------|-------------|---------------|
| `createdAt` | Newest first | `desc` |
| `price` | Price (low to high) | `asc` |
| `views` | Most viewed | `desc` |
| `saves` | Most saved | `desc` |

---

## OpenAPI 3.0 Metadata

```yaml
openapi: 3.0.3
info:
  title: Makaan MVP API
  description: REST API for Makaan map-first real estate marketplace
  version: 1.0.0
  contact:
    name: Makaan Support
    email: support@makaan.app

servers:
  - url: https://api.makaan.app/v1
    description: Production server
  - url: https://staging-api.makaan.app/v1
    description: Staging server

tags:
  - name: Authentication
    description: OTP and admin authentication endpoints
  - name: Listings (Public)
    description: Public listing browsing and search
  - name: Listings (Seller)
    description: Seller listing management
  - name: Admin
    description: Admin moderation and user management
  - name: Saved Listings
    description: Buyer saved listings (localStorage-based)

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

---

## Appendix: Complete Request/Response Examples

### Example 1: End-to-End Seller Flow

**Step 1: Request OTP**

```bash
curl -X POST https://api.makaan.app/v1/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone": "+201012345678"}'
```

**Response**:

```json
{
  "success": true,
  "message": "OTP code sent to +2010****5678",
  "expiresIn": 300
}
```

**Step 2: Verify OTP**

```bash
curl -X POST https://api.makaan.app/v1/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+201012345678",
    "code": "123456"
  }'
```

**Response**:

```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 2592000,
  "user": {
    "id": "usr_abc123",
    "phone": "+2010****5678",
    "role": "seller",
    "sellerType": "owner",
    "createdAt": "2026-02-22T10:00:00Z"
  }
}
```

**Step 3: Create Draft Listing**

```bash
curl -X POST https://api.makaan.app/v1/seller/listings \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "purpose": "sale",
    "propertyType": "Apartment",
    "size": 150,
    "bedrooms": 3,
    "bathrooms": 2,
    "finishing": "Fully finished",
    "price": 3500000,
    "description": "Spacious apartment in the heart of Nasr City",
    "location": {
      "lat": 30.0444,
      "lng": 31.2357
    }
  }'
```

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "lst_abc123xyz",
    "status": "draft",
    "purpose": "sale",
    "propertyType": "Apartment",
    "size": 150,
    "bedrooms": 3,
    "bathrooms": 2,
    "finishing": "Fully finished",
    "price": 3500000,
    "description": "Spacious apartment in the heart of Nasr City",
    "location": {
      "lat": 30.0444,
      "lng": 31.2357,
      "areaName": "Nasr City"
    },
    "photos": [],
    "createdAt": "2026-02-22T14:30:00Z",
    "updatedAt": "2026-02-22T14:30:00Z"
  }
}
```

**Step 4: Upload Photos**

```bash
curl -X POST https://api.makaan.app/v1/seller/listings/lst_abc123xyz/photos \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "photos=@living_room.jpg" \
  -F "photos=@bedroom.jpg" \
  -F "photos=@kitchen.jpg"
```

**Response**:

```json
{
  "success": true,
  "message": "3 photos uploaded successfully",
  "data": {
    "photos": [
      {
        "id": "photo_xyz1",
        "url": "https://cdn.makaan.app/listings/lst_abc123xyz/photo1.webp",
        "order": 0,
        "uploadedAt": "2026-02-22T14:35:00Z"
      },
      {
        "id": "photo_xyz2",
        "url": "https://cdn.makaan.app/listings/lst_abc123xyz/photo2.webp",
        "order": 1,
        "uploadedAt": "2026-02-22T14:35:00Z"
      },
      {
        "id": "photo_xyz3",
        "url": "https://cdn.makaan.app/listings/lst_abc123xyz/photo3.webp",
        "order": 2,
        "uploadedAt": "2026-02-22T14:35:00Z"
      }
    ]
  }
}
```

**Step 5: Submit for Review**

```bash
curl -X POST https://api.makaan.app/v1/seller/listings/lst_abc123xyz/submit \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response**:

```json
{
  "success": true,
  "message": "Listing submitted for review. You will be notified once it is approved.",
  "data": {
    "id": "lst_abc123xyz",
    "status": "pending",
    "submittedAt": "2026-02-22T14:40:00Z"
  }
}
```

---

### Example 2: Admin Review Flow

**Step 1: Get Pending Listings**

```bash
curl -X GET "https://api.makaan.app/v1/admin/listings/pending?limit=10" \
  -H "Authorization: Bearer admin_token..."
```

**Step 2: Review Listing with AI Hints**

```bash
curl -X GET https://api.makaan.app/v1/admin/listings/lst_abc123xyz/review \
  -H "Authorization: Bearer admin_token..."
```

**Step 3: Approve Listing**

```bash
curl -X POST https://api.makaan.app/v1/admin/listings/lst_abc123xyz/approve \
  -H "Authorization: Bearer admin_token..."
```

**Response**:

```json
{
  "success": true,
  "message": "Listing approved and published successfully",
  "data": {
    "id": "lst_abc123xyz",
    "status": "active",
    "approvedAt": "2026-02-22T15:00:00Z",
    "approvedBy": "admin_usr123"
  }
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-22 | Initial API specification for Makaan MVP |

---

**End of API Specification**
