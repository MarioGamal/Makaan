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

// Market-shaped demo inventory captured from public Cairo asking-price pages
// on 2026-09-18. Titles and descriptions are original Makaan fixture copy;
// no broker contacts, exact addresses, or third-party media are reproduced.
// See docs/demo-listing-sources.md for the source snapshot.
const marketReferenceListings = [
  // Long-term rentals
  { areaId: DEMO_IDS.maadi, purpose: ListingPurpose.RENT, sizeSqm: 150, bedrooms: 2, bathrooms: 2, priceEgp: 50000, finishingLevel: FinishingLevel.FULLY_FINISHED, titleAr: 'شقة متشطبة للإيجار طويل الأجل في سرايات المعادي', titleEn: 'Finished apartment for long-term rent in Maadi Sarayat' },
  { areaId: DEMO_IDS.maadi, purpose: ListingPurpose.RENT, sizeSqm: 200, bedrooms: 3, bathrooms: 2, priceEgp: 60000, finishingLevel: FinishingLevel.LUXURY_FINISHED, titleAr: 'شقة مفروشة للإيجار طويل الأجل في المعادي', titleEn: 'Furnished apartment for long-term rent in Maadi' },
  { areaId: DEMO_IDS.heliopolis, purpose: ListingPurpose.RENT, sizeSqm: 135, bedrooms: 3, bathrooms: 1, priceEgp: 15000, finishingLevel: FinishingLevel.FULLY_FINISHED, titleAr: 'شقة جاهزة للإيجار طويل الأجل في أرض الجولف', titleEn: 'Ready apartment for long-term rent in Ard El Golf' },
  { areaId: DEMO_IDS.heliopolis, purpose: ListingPurpose.RENT, sizeSqm: 200, bedrooms: 3, bathrooms: 3, priceEgp: 32000, finishingLevel: FinishingLevel.FULLY_FINISHED, titleAr: 'شقة بإطلالة مفتوحة للإيجار طويل الأجل في مصر الجديدة', titleEn: 'Finished apartment for long-term rent in Heliopolis' },
  { areaId: DEMO_IDS.newCairo, purpose: ListingPurpose.RENT, sizeSqm: 127, bedrooms: 2, bathrooms: 2, priceEgp: 35000, finishingLevel: FinishingLevel.FULLY_FINISHED, titleAr: 'شقة غرفتين للإيجار طويل الأجل في هايد بارك', titleEn: 'Two-bedroom apartment for long-term rent in Hyde Park' },
  { areaId: DEMO_IDS.newCairo, purpose: ListingPurpose.RENT, sizeSqm: 200, bedrooms: 3, bathrooms: 3, priceEgp: 110000, finishingLevel: FinishingLevel.LUXURY_FINISHED, titleAr: 'شقة مفروشة للإيجار طويل الأجل في كايرو فستيفال سيتي', titleEn: 'Furnished apartment for long-term rent in Cairo Festival City' },
  { areaId: DEMO_IDS.newCairo, purpose: ListingPurpose.RENT, sizeSqm: 140, bedrooms: 2, bathrooms: 3, priceEgp: 85000, finishingLevel: FinishingLevel.LUXURY_FINISHED, titleAr: 'شقة بحديقة للإيجار طويل الأجل في إيستاون', titleEn: 'Garden apartment for long-term rent in Eastown' },
  { areaId: DEMO_IDS.newCairo, purpose: ListingPurpose.RENT, sizeSqm: 217, bedrooms: 3, bathrooms: 3, priceEgp: 80000, finishingLevel: FinishingLevel.LUXURY_FINISHED, titleAr: 'شقة مفروشة للإيجار طويل الأجل في ميفيدا', titleEn: 'Furnished apartment for long-term rent in Mivida' },
  { areaId: DEMO_IDS.newCairo, purpose: ListingPurpose.RENT, sizeSqm: 195, bedrooms: 3, bathrooms: 3, priceEgp: 65000, finishingLevel: FinishingLevel.FULLY_FINISHED, titleAr: 'شقة متشطبة للإيجار طويل الأجل في إيستاون', titleEn: 'Finished apartment for long-term rent in Eastown' },
  { areaId: DEMO_IDS.newCairo, purpose: ListingPurpose.RENT, sizeSqm: 141, bedrooms: 3, bathrooms: 2, priceEgp: 35000, finishingLevel: FinishingLevel.FULLY_FINISHED, titleAr: 'شقة جاهزة للإيجار طويل الأجل في فيفث سكوير', titleEn: 'Ready apartment for long-term rent in Fifth Square' },
  // Completed resale apartments
  { areaId: DEMO_IDS.maadi, purpose: ListingPurpose.SALE, sizeSqm: 150, bedrooms: 2, bathrooms: 2, priceEgp: 5200000, finishingLevel: FinishingLevel.FULLY_FINISHED, titleAr: 'شقة متشطبة للبيع في المعادي', titleEn: 'Finished apartment for sale in Maadi' },
  { areaId: DEMO_IDS.maadi, purpose: ListingPurpose.SALE, sizeSqm: 250, bedrooms: 3, bathrooms: 2, priceEgp: 8000000, finishingLevel: FinishingLevel.LUXURY_FINISHED, titleAr: 'شقة جاهزة للبيع في المعادي', titleEn: 'Ready apartment for sale in Maadi' },
  { areaId: DEMO_IDS.heliopolis, purpose: ListingPurpose.SALE, sizeSqm: 400, bedrooms: 5, bathrooms: 3, priceEgp: 18000000, finishingLevel: FinishingLevel.LUXURY_FINISHED, titleAr: 'شقة سوبر لوكس جاهزة للبيع في مصر الجديدة', titleEn: 'Ready luxury apartment for sale in Heliopolis' },
  { areaId: DEMO_IDS.heliopolis, purpose: ListingPurpose.SALE, sizeSqm: 215, bedrooms: 3, bathrooms: 2, priceEgp: 9500000, finishingLevel: FinishingLevel.FULLY_FINISHED, titleAr: 'شقة متشطبة بالكامل للبيع في مصر الجديدة', titleEn: 'Fully finished apartment for sale in Heliopolis' },
  { areaId: DEMO_IDS.newCairo, purpose: ListingPurpose.SALE, sizeSqm: 225, bedrooms: 3, bathrooms: 2, priceEgp: 9000000, finishingLevel: FinishingLevel.FULLY_FINISHED, titleAr: 'شقة جاهزة للبيع في البنفسج', titleEn: 'Ready apartment for sale in El Banafseg' },
  { areaId: DEMO_IDS.newCairo, purpose: ListingPurpose.SALE, sizeSqm: 171, bedrooms: 3, bathrooms: 3, priceEgp: 8200000, finishingLevel: FinishingLevel.FULLY_FINISHED, titleAr: 'شقة بحديقة مستلمة للبيع في ذا سكوير', titleEn: 'Delivered garden apartment for sale in The Square' },
  { areaId: DEMO_IDS.newCairo, purpose: ListingPurpose.SALE, sizeSqm: 120, bedrooms: 2, bathrooms: 2, priceEgp: 8850000, finishingLevel: FinishingLevel.LUXURY_FINISHED, titleAr: 'شقة سوبر لوكس للبيع في الباتيو أورو', titleEn: 'Luxury finished apartment for sale in El Patio Oro' },
  { areaId: DEMO_IDS.newCairo, purpose: ListingPurpose.SALE, sizeSqm: 179, bedrooms: 3, bathrooms: 3, priceEgp: 12000000, finishingLevel: FinishingLevel.FULLY_FINISHED, titleAr: 'شقة جاهزة للسكن للبيع في ديستريكت 5', titleEn: 'Ready-to-move apartment for sale in District 5' },
  { areaId: DEMO_IDS.newCairo, purpose: ListingPurpose.SALE, sizeSqm: 116, bedrooms: 2, bathrooms: 2, priceEgp: 8500000, finishingLevel: FinishingLevel.FULLY_FINISHED, titleAr: 'شقة متشطبة للبيع في جاردن ريزيدنس', titleEn: 'Finished apartment for sale in Garden Residence' },
  { areaId: DEMO_IDS.newCairo, purpose: ListingPurpose.SALE, sizeSqm: 186, bedrooms: 3, bathrooms: 3, priceEgp: 11000000, finishingLevel: FinishingLevel.LUXURY_FINISHED, titleAr: 'شقة فاخرة جاهزة للبيع في جاردن ريزيدنس', titleEn: 'Ready luxury apartment for sale in Garden Residence' },
] as const;

const areaCoordinates = {
  [DEMO_IDS.maadi]: { longitude: 31.265, latitude: 29.96 },
  [DEMO_IDS.newCairo]: { longitude: 31.44, latitude: 30.04 },
  [DEMO_IDS.heliopolis]: { longitude: 31.325, latitude: 30.095 },
} as const;

const marketDemoListings = marketReferenceListings.map((sample, index) => {
  const sequence = index + 1;
  const coordinates = areaCoordinates[sample.areaId];
  const offset = ((index % 5) - 2) * 0.0012;
  const locationWkt = `POINT(${(coordinates.longitude + offset).toFixed(4)} ${(coordinates.latitude - offset / 2).toFixed(4)})`;
  const publicLocationWkt = `POINT(${(coordinates.longitude + offset + 0.0015).toFixed(4)} ${(coordinates.latitude - offset / 2 + 0.0008).toFixed(4)})`;
  return {
    id: `31000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`,
    sellerId: sequence % 4 === 0 ? DEMO_IDS.agent : DEMO_IDS.verifiedOwner,
    areaId: sample.areaId,
    purpose: sample.purpose,
    propertyType: PropertyType.APARTMENT,
    sizeSqm: sample.sizeSqm,
    bedrooms: sample.bedrooms,
    bathrooms: sample.bathrooms,
    finishingLevel: sample.finishingLevel,
    priceEgp: sample.priceEgp,
    titleAr: sample.titleAr,
    titleEn: sample.titleEn,
    description: `${sample.titleAr}. إعلان تجريبي مبني على نطاقات سعر وبيانات منشورة للسوق، والموقع الظاهر تقريبي حفاظاً على الخصوصية.`,
    descriptionEn: `${sample.titleEn}. Demo inventory based on public market asking data; the displayed location is approximate for privacy.`,
    locationWkt,
    publicLocationWkt,
    // The fixed coordinate offset is approximately 170 metres in Cairo. The
    // database trigger verifies this value against PostGIS within 2 metres.
    publicLocationDistanceM: 170,
    sellerPublicLocationMode: 'approximate',
    approvedPublicLocationMode: 'approximate',
    revisionId: `71000000-0000-4000-8000-${String(sequence).padStart(12, '0')}`,
    status: ListingStatus.ACTIVE,
    submittedAt: `2026-09-${String((index % 10) + 1).padStart(2, '0')}T09:00:00.000Z`,
    approvedAt: `2026-09-${String((index % 10) + 2).padStart(2, '0')}T09:00:00.000Z`,
    rejectionReason: null,
  } as const;
});

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
      'شقة للبيع في المعادي من مالك متحقق منه. اللي بيظهر للناس: المعادي بس؛ تفاصيل الوحدة بالظبط عند فريق المراجعة.',
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
      'دوبلكس للإيجار طويل الأجل في القاهرة الجديدة من وسيط معلن. اللي بيظهر للناس: القاهرة الجديدة بس.',
    locationWkt: 'POINT(31.440 30.040)',
    publicLocationWkt: 'POINT(31.442 30.041)',
    publicLocationDistanceM: 222,
    sellerPublicLocationMode: 'approximate',
    approvedPublicLocationMode: 'approximate',
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
    description: 'شقة في مصر الجديدة مستنية المراجعة ولسه مش ظاهرة في البحث.',
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
    description: 'مثال إعلان اترفض علشان نختبر رسائل المراجعة؛ مش ظاهر للناس.',
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
  ...marketDemoListings,
] as const;

const listingMediaAssets = Object.fromEntries(
  demoListings.map((listing) => [
    listing.id,
    listing.areaId === DEMO_IDS.newCairo
      ? 'new-cairo-duplex.webp'
      : listing.areaId === DEMO_IDS.heliopolis
        ? 'heliopolis-apartment.webp'
        : listing.propertyType === PropertyType.STUDIO
          ? 'maadi-studio.webp'
          : 'maadi-apartment.webp',
  ]),
) as Record<(typeof demoListings)[number]['id'], string>;

export const mediaMetadata = demoListings.flatMap((listing, listingIndex) => {
  const assetFilename = listingMediaAssets[listing.id];
  return [0, 1, 2].map((displayOrder) => ({
    id: `50000000-0000-4000-8000-${String(listingIndex * 3 + displayOrder + 1).padStart(12, '0')}`,
    listingId: listing.id,
    assetFilename,
    publicPath: `/media/listings/demo/${assetFilename}`,
    displayOrder,
    originalFilename: assetFilename,
    width: 1536,
    height: 1024,
  }));
});

export const moderationFixtures = [
  {
    id: DEMO_IDS.approveAction,
    actionType: 'approve',
    targetListingId: DEMO_IDS.maadiSale,
    reason: 'fixture_approved_verified_owner',
    notes: 'قرار تجريبي: مالك متحقق منه، والمكان العام على مستوى المنطقة بس.',
  },
  {
    id: DEMO_IDS.approveAgentAction,
    actionType: 'approve',
    targetListingId: DEMO_IDS.newCairoRent,
    reason: 'fixture_approved_declared_agent',
    notes: 'قرار تجريبي: وسيط معلن ومكتوب بوضوح بعد مراجعة يدوية.',
  },
  {
    id: DEMO_IDS.rejectAction,
    actionType: 'reject',
    targetListingId: DEMO_IDS.maadiRejected,
    reason: 'incomplete_data',
    notes: 'قرار تجريبي: محتاج يكمل بيانات السكن قبل ما يبعت الإعلان تاني.',
  },
] as const;
