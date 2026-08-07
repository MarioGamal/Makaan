export enum PropertyType {
  APARTMENT = 'Apartment',
  VILLA = 'Villa',
  DUPLEX = 'Duplex',
  PENTHOUSE = 'Penthouse',
  STUDIO = 'Studio',
  TOWNHOUSE = 'Townhouse',
  CHALET = 'Chalet',
}

export enum FinishingLevel {
  SEMI_FINISHED = 'Semi-finished',
  FULLY_FINISHED = 'Fully finished',
  LUXURY_FINISHED = 'Luxury finished',
}

export enum ListingStatus {
  DRAFT = 'draft',
  SUBMITTED = 'pending_review',
  ACTIVE = 'active',
  REJECTED = 'rejected',
  SOLD = 'sold',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

export enum UserType {
  BUYER = 'buyer',
  SELLER = 'seller',
  ADMIN = 'admin',
}

export enum SellerType {
  OWNER = 'owner',
  AGENT = 'agent',
}

export enum RejectionReason {
  INCOMPLETE_DATA = 'incomplete_data',
  INACCURATE_LOCATION = 'inaccurate_location',
  MEDIA_ISSUE = 'media_issue',
  PARTICIPATION_UNCONFIRMED = 'participation_unconfirmed',
  DUPLICATE = 'duplicate',
  SPAM_SCAM = 'spam_scam',
}
