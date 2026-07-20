export enum PropertyType {
  APARTMENT = "Apartment",
  VILLA = "Villa",
  DUPLEX = "Duplex",
  PENTHOUSE = "Penthouse",
  STUDIO = "Studio",
  TOWNHOUSE = "Townhouse",
  CHALET = "Chalet",
}

export enum FinishingLevel {
  SEMI_FINISHED = "Semi-finished",
  FULLY_FINISHED = "Fully finished",
  LUXURY_FINISHED = "Luxury finished",
}

export enum ListingStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  ACTIVE = "active",
  REJECTED = "rejected",
  SOLD = "sold",
  INACTIVE = "inactive",
}

export enum UserType {
  BUYER = "buyer",
  SELLER = "seller",
  ADMIN = "admin",
}

export enum SellerType {
  OWNER = "owner",
  AGENT = "agent",
}

export enum RejectionReason {
  INCOMPLETE_DATA = "incomplete_data",
  INACCURATE_LOCATION = "inaccurate_location",
  DUPLICATE = "duplicate",
  SPAM_SCAM = "spam_scam",
}

