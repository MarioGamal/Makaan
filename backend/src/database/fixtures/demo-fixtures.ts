import {
  FinishingLevel,
  ListingStatus,
  PropertyType,
  RejectionReason,
  SellerType,
  UserType,
} from '@makaan/shared/constants/enums';

import { ListingPurpose } from '../../models/listing.entity';
import { UserStatus } from '../../models/user.entity';

export const DEMO_TIMESTAMP = '2026-01-15T09:00:00.000Z';

export const DEMO_IDS = {
  admin: '10000000-0000-4000-8000-000000000001',
  verifiedOwner: '10000000-0000-4000-8000-000000000002',
  owner: '10000000-0000-4000-8000-000000000003',
  agent: '10000000-0000-4000-8000-000000000004',
  maadi: '20000000-0000-4000-8000-000000000001',
  newCairo: '20000000-0000-4000-8000-000000000002',
  heliopolis: '20000000-0000-4000-8000-000000000003',
  maadiSale: '30000000-0000-4000-8000-000000000001',
  newCairoRent: '30000000-0000-4000-8000-000000000002',
  heliopolisPending: '30000000-0000-4000-8000-000000000003',
  maadiRejected: '30000000-0000-4000-8000-000000000004',
  approveAction: '40000000-0000-4000-8000-000000000001',
  rejectAction: '40000000-0000-4000-8000-000000000002',
  approveAgentAction: '40000000-0000-4000-8000-000000000003',
  maadiSaleRevision: '70000000-0000-4000-8000-000000000001',
  newCairoRentRevision: '70000000-0000-4000-8000-000000000002',
  heliopolisPendingRevision: '70000000-0000-4000-8000-000000000003',
  maadiRejectedRevision: '70000000-0000-4000-8000-000000000004',
} as const;

export const cairoAreas = [
  {
    id: DEMO_IDS.maadi,
    nameAr: 'المعادي',
    nameEn: 'Maadi',
    // Governed discovery boundary; it is not a listing-level public location.
    boundaryWkt:
      'POLYGON((31.245 29.945,31.285 29.945,31.285 29.975,31.245 29.975,31.245 29.945))',
  },
  {
    id: DEMO_IDS.newCairo,
    nameAr: 'القاهرة الجديدة',
    nameEn: 'New Cairo',
    boundaryWkt:
      'POLYGON((31.390 30.000,31.490 30.000,31.490 30.080,31.390 30.080,31.390 30.000))',
  },
  {
    id: DEMO_IDS.heliopolis,
    nameAr: 'مصر الجديدة',
    nameEn: 'Heliopolis',
    boundaryWkt:
      'POLYGON((31.300 30.075,31.350 30.075,31.350 30.115,31.300 30.115,31.300 30.075))',
  },
] as const;

export const areaAliases = [
  {
    id: '21000000-0000-4000-8000-000000000001',
    areaId: DEMO_IDS.maadi,
    locale: 'en',
    displayAlias: 'El Maadi',
    normalizedAlias: 'el maadi',
  },
  {
    id: '21000000-0000-4000-8000-000000000002',
    areaId: DEMO_IDS.newCairo,
    locale: 'ar',
    displayAlias: 'التجمع الخامس',
    normalizedAlias: 'التجمع الخامس',
  },
  {
    id: '21000000-0000-4000-8000-000000000003',
    areaId: DEMO_IDS.heliopolis,
    locale: 'ar',
    displayAlias: 'هليوبوليس',
    normalizedAlias: 'هليوبوليس',
  },
] as const;

export const demoUsers = [
  {
    id: DEMO_IDS.admin,
    username: 'moderator@fixture.local',
    displayName: 'مشرف تجريبي | Demo moderator',
    userType: UserType.ADMIN,
    status: UserStatus.ACTIVE,
    isPhoneVerified: false,
  },
  {
    id: DEMO_IDS.verifiedOwner,
    username: 'verified-owner@fixture.local',
    displayName: 'مالك موثّق تجريبي | Verified owner demo',
    userType: UserType.SELLER,
    status: UserStatus.ACTIVE,
    isPhoneVerified: true,
    // Syntactically valid but intentionally non-routable all-zero demo subscriber.
    phone: '+201000000000',
  },
  {
    id: DEMO_IDS.owner,
    username: 'owner@fixture.local',
    displayName: 'مالك معلن تجريبي | Declared owner demo',
    userType: UserType.SELLER,
    status: UserStatus.ACTIVE,
    isPhoneVerified: false,
    phone: 'fixture:no-contact:owner',
  },
  {
    id: DEMO_IDS.agent,
    username: 'agent@fixture.local',
    displayName: 'وكيل معلن تجريبي | Declared agent demo',
    userType: UserType.SELLER,
    status: UserStatus.ACTIVE,
    isPhoneVerified: false,
    phone: 'fixture:no-contact:agent',
  },
] as const;

export const sellerProfiles = [
  {
    userId: DEMO_IDS.verifiedOwner,
    declaredParticipation: SellerType.OWNER,
    isVerified: true,
    verificationState: 'verified',
    verificationDecidedBy: DEMO_IDS.admin,
    verificationDecidedAt: DEMO_TIMESTAMP,
  },
  {
    userId: DEMO_IDS.owner,
    declaredParticipation: SellerType.OWNER,
    isVerified: false,
    verificationState: 'not_verified',
    verificationDecidedBy: null,
    verificationDecidedAt: null,
  },
  {
    userId: DEMO_IDS.agent,
    declaredParticipation: SellerType.AGENT,
    isVerified: false,
    verificationState: 'not_verified',
    verificationDecidedBy: null,
    verificationDecidedAt: null,
  },
] as const;

export const demoListings = [
  {
    id: DEMO_IDS.maadiSale,
    sellerId: DEMO_IDS.verifiedOwner,
    areaId: DEMO_IDS.maadi,
    purpose: ListingPurpose.SALE,
    propertyType: PropertyType.APARTMENT,
    sizeSqm: 165,
    bedrooms: 3,
    bathrooms: 2,
    finishingLevel: FinishingLevel.FULLY_FINISHED,
    priceEgp: 7800000,
    description:
      'شقة سكنية للبيع في المعادي. الموقع العام: المعادي فقط؛ تفاصيل الوحدة الدقيقة متاحة للمراجعة الداخلية.',
    locationWkt: 'POINT(31.265 29.960)',
    publicLocationWkt: 'POINT(31.267 29.960)',
    publicLocationDistanceM: 193,
    sellerPublicLocationMode: 'approximate',
    approvedPublicLocationMode: 'approximate',
    revisionId: DEMO_IDS.maadiSaleRevision,
    status: ListingStatus.ACTIVE,
    submittedAt: '2026-01-10T09:00:00.000Z',
    approvedAt: DEMO_TIMESTAMP,
    rejectionReason: null,
  },
  {
    id: DEMO_IDS.newCairoRent,
    sellerId: DEMO_IDS.agent,
    areaId: DEMO_IDS.newCairo,
    purpose: ListingPurpose.RENT,
    propertyType: PropertyType.DUPLEX,
    sizeSqm: 220,
    bedrooms: 4,
    bathrooms: 3,
    finishingLevel: FinishingLevel.LUXURY_FINISHED,
    priceEgp: 65000,
    description:
      'دوبلكس للإيجار طويل الأجل في القاهرة الجديدة بواسطة وكيل معلن. الموقع العام: القاهرة الجديدة فقط.',
    locationWkt: 'POINT(31.440 30.040)',
    publicLocationWkt: null,
    publicLocationDistanceM: null,
    sellerPublicLocationMode: 'area_only',
    approvedPublicLocationMode: 'area_only',
    revisionId: DEMO_IDS.newCairoRentRevision,
    status: ListingStatus.ACTIVE,
    submittedAt: '2026-01-11T09:00:00.000Z',
    approvedAt: '2026-01-16T09:00:00.000Z',
    rejectionReason: null,
  },
  {
    id: DEMO_IDS.heliopolisPending,
    sellerId: DEMO_IDS.owner,
    areaId: DEMO_IDS.heliopolis,
    purpose: ListingPurpose.SALE,
    propertyType: PropertyType.APARTMENT,
    sizeSqm: 120,
    bedrooms: 2,
    bathrooms: 1,
    finishingLevel: FinishingLevel.SEMI_FINISHED,
    priceEgp: 4900000,
    description:
      'شقة سكنية قيد المراجعة في مصر الجديدة؛ لا تظهر في البحث العام.',
    locationWkt: 'POINT(31.325 30.095)',
    publicLocationWkt: null,
    publicLocationDistanceM: null,
    sellerPublicLocationMode: 'approximate',
    approvedPublicLocationMode: null,
    revisionId: DEMO_IDS.heliopolisPendingRevision,
    status: ListingStatus.SUBMITTED,
    submittedAt: '2026-01-18T09:00:00.000Z',
    approvedAt: null,
    rejectionReason: null,
  },
  {
    id: DEMO_IDS.maadiRejected,
    sellerId: DEMO_IDS.owner,
    areaId: DEMO_IDS.maadi,
    purpose: ListingPurpose.RENT,
    propertyType: PropertyType.STUDIO,
    sizeSqm: 65,
    bedrooms: 1,
    bathrooms: 1,
    finishingLevel: FinishingLevel.FULLY_FINISHED,
    priceEgp: 22000,
    description: 'مثال خاص مرفوض لاختبار رسائل المراجعة؛ لا يظهر للعامة.',
    locationWkt: 'POINT(31.270 29.955)',
    publicLocationWkt: null,
    publicLocationDistanceM: null,
    sellerPublicLocationMode: 'area_only',
    approvedPublicLocationMode: null,
    revisionId: DEMO_IDS.maadiRejectedRevision,
    status: ListingStatus.REJECTED,
    submittedAt: '2026-01-05T09:00:00.000Z',
    approvedAt: null,
    rejectionReason: RejectionReason.INCOMPLETE_DATA,
  },
] as const;

export const mediaMetadata = demoListings.flatMap((listing, listingIndex) =>
  [0, 1, 2].map((displayOrder) => ({
    id: `50000000-0000-4000-8000-${String(listingIndex * 3 + displayOrder + 1).padStart(12, '0')}`,
    listingId: listing.id,
    cloudinaryUrl: `local-fixture://media/${listing.id}/${displayOrder + 1}.jpg`,
    displayOrder,
    originalFilename: `fixture-${displayOrder + 1}.jpg`,
    width: 1600,
    height: 1067,
  })),
);

export const moderationFixtures = [
  {
    id: DEMO_IDS.approveAction,
    actionType: 'approve',
    targetListingId: DEMO_IDS.maadiSale,
    reason: 'fixture_approved_verified_owner',
    notes: 'قرار تجريبي: مالك موثّق، موقع عام على مستوى المنطقة فقط.',
  },
  {
    id: DEMO_IDS.approveAgentAction,
    actionType: 'approve',
    targetListingId: DEMO_IDS.newCairoRent,
    reason: 'fixture_approved_declared_agent',
    notes: 'قرار تجريبي: وكيل معلن وموسوم بوضوح بعد مراجعة يدوية.',
  },
  {
    id: DEMO_IDS.rejectAction,
    actionType: 'reject',
    targetListingId: DEMO_IDS.maadiRejected,
    reason: 'incomplete_data',
    notes: 'قرار تجريبي: يلزم استكمال بيانات السكن قبل إعادة الإرسال.',
  },
] as const;
