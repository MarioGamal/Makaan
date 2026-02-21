# Makaan -- Product Requirements Document (PRD)

## MVP Version -- Cairo, Egypt

------------------------------------------------------------------------

## 1. Product Overview

### 1.1 Vision

Makaan is a **map-first real estate marketplace** for Cairo that
replaces fragmented Facebook groups and spam-heavy classifieds with
**structured, verified, location-accurate listings**.

Makaan prioritizes: - Accurate property location - Structured listings -
Low duplication - Admin-curated quality - Buyer trust over listing
volume

------------------------------------------------------------------------

### 1.2 Problem Statement

In the Egyptian real estate market: - Listings are scattered across
Facebook groups and WhatsApp - Property data is unstructured or
incomplete - Brokers repost the same properties repeatedly - Buyers
waste time collecting missing information

Existing platforms optimize for listing volume and paid exposure rather
than trust and data quality.

------------------------------------------------------------------------

### 1.3 MVP Goal

Validate that buyers prefer a **clean, map-driven, structured
experience**, even if inventory grows more slowly.

Success is measured by **data quality and engagement**, not raw listing
count.

------------------------------------------------------------------------

## 2. Scope & Constraints

### 2.1 Geography

-   Cairo only (MVP)
-   Residential properties only

### 2.2 Listing Types

-   Sale
-   Rent (long-term only: monthly / yearly)

### 2.3 User Types

-   Buyer (default)
-   Seller (Owner or Agent -- inferred)
-   Admin

------------------------------------------------------------------------

## 3. Core Principles (Non-Negotiable)

1.  Every listing must have a map pin
2.  All listings require admin approval before visibility
3.  One canonical listing per property
4.  Data quality \> volume
5.  Seller type is inferred by behavior
6.  Map is the source of truth for search
7.  AI assists silently; no gimmicks

------------------------------------------------------------------------

## 4. User Personas

### Buyer

-   Searches by area and map
-   Wants accurate price, photos, and location
-   Distrusts brokers and reposts

### Owner Seller

-   Lists 1--2 properties
-   Wants exposure without brokers
-   Low tolerance for complexity

### Agent Seller

-   Lists multiple properties
-   Subject to stricter limits and moderation

### Admin

-   Reviews and approves listings
-   Maintains marketplace quality

------------------------------------------------------------------------

## 5. User Journeys

### Buyer Journey

1.  Search by area or map
2.  Apply filters
3.  View listing details
4.  Contact seller via WhatsApp or call
5.  Save listings

### Seller Journey

1.  Sign up via phone OTP
2.  Create listing draft
3.  Complete required fields
4.  Submit for approval
5.  Listing approved/rejected
6.  Mark listing sold or inactive

### Admin Journey

1.  View pending listings
2.  Review quality and duplication
3.  Approve or reject with reason

------------------------------------------------------------------------

## 6. Functional Requirements

### 6.1 Buyer Features

#### Search

-   Text search by Cairo area (autocomplete)
-   Map pan/zoom search
-   Draw-on-map search
-   All searches resolve to geographic boundaries

#### Filters

-   Sale / Rent
-   Price range
-   Property type
-   Bedrooms / Bathrooms
-   Owner / Agent
-   Verified sellers only

#### Listing View

-   Price (sale or rent)
-   Property specs
-   Photo gallery
-   Seller badge
-   Map pin
-   Listed duration

#### Contact

-   WhatsApp button
-   Call button
-   No in-app chat

#### Save Listings

-   Save / unsave
-   View saved listings

------------------------------------------------------------------------

### 6.2 Seller Features

#### Authentication

-   Phone OTP login

#### Create Listing

Required fields: - Purpose (sale/rent) - Property type - Size -
Bedrooms - Bathrooms - Finishing - Price - Map pin - Minimum photos

Submission blocked if incomplete.

#### Listing Status

-   Draft
-   Submitted
-   Active
-   Inactive
-   Sold (sale only)

#### Seller Dashboard

-   Listings overview
-   Views and saves count
-   Status management

------------------------------------------------------------------------

### 6.3 Admin Features

#### Listing Approval

Admins validate: - Location accuracy - Completeness - Photo relevance -
Duplicate risk - Spam/scam indicators

Actions: - Approve - Reject with predefined reason

#### Moderation

-   Unpublish listings
-   Block users
-   Track repeat offenders

------------------------------------------------------------------------

## 7. AI Usage (MVP)

AI is used internally only: - Listing quality checks - Duplicate
likelihood hints - Admin review assistance

AI does not: - Auto-approve listings - Predict prices - Chat with users

------------------------------------------------------------------------

## 8. Security & Privacy Requirements

### Authentication

-   Phone-based OTP with rate limiting
-   OTP expiry
-   Secure sessions (HTTP-only cookies)

### Authorization

-   Role-based access control
-   Users can only modify their own listings
-   Admin-only moderation endpoints

### Data Visibility

-   Only approved + active listings visible to buyers
-   Draft/rejected listings are private
-   No PII exposed in public APIs

### File Upload Security

-   Images only (jpg, png, webp)
-   Max size enforced
-   EXIF metadata stripped
-   Server-side resizing
-   Stored in object storage

### Abuse Prevention

-   Rate limiting on OTP, listing submission, and contact actions
-   CAPTCHA optional for suspicious activity

### Admin Security

-   Separate admin accounts
-   Strong passwords
-   Mandatory 2FA
-   Admin actions logged

### Logging

-   Mask phone numbers
-   Never log OTPs
-   No sensitive data in error messages

### Data Privacy

-   Secure storage of personal data
-   Account deactivation support
-   Listings removed when user is blocked

------------------------------------------------------------------------

## 9. Data Model Summary

Core entities: - Users - Seller Profiles - Listings - Locations - Cairo
Areas - Photos - Saved Listings - Views - Inquiries - Admins

------------------------------------------------------------------------

## 10. Success Metrics

### Marketplace Health

-   \% listings with valid pins
-   Average photos per listing
-   Duplicate rate
-   Approval rejection rate

### Buyer Engagement

-   Views per listing
-   Contacts per listing
-   Saves per listing

### Seller Behavior

-   \% listings closed (sold/inactive)
-   Repeat listing quality

------------------------------------------------------------------------

## 11. Out of Scope (MVP)

-   Nationwide launch
-   Short-term rentals
-   Mortgage tools
-   Legal services
-   In-app chat
-   Reviews/ratings
-   Market reports
-   AI price predictions

------------------------------------------------------------------------

## 12. MVP Exit Criteria

MVP is successful if: - Buyers use map-first search - Listings receive
meaningful contacts - Data quality remains high - Admin approval remains
manageable - Sellers comply with structure

------------------------------------------------------------------------

## Final Note

Makaan MVP prioritizes **trust over scale**. If trust is achieved,
growth becomes an engineering problem --- not a product one.
