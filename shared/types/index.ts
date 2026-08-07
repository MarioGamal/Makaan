import {
  FinishingLevel,
  ListingStatus,
  PropertyType,
  SellerType,
  UserType,
} from '../constants/enums';

export interface ListingDTO {
  id: string;
  sellerId: string;
  areaId?: string | null;
  purpose: 'sale' | 'long_term_rent';
  propertyType: PropertyType;
  sizeSqm: number;
  bedrooms: number;
  bathrooms: number;
  finishingLevel: FinishingLevel;
  priceEgp: number;
  latitude: number;
  longitude: number;
  status: ListingStatus;
  viewCount: number;
  saveCount: number;
  contactCount: number;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
}

export interface UserDTO {
  id: string;
  phoneNumberMasked?: string;
  userType: UserType;
  sellerType?: SellerType;
  status: 'active' | 'blocked' | 'deactivated';
  isPhoneVerified: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface CairoAreaDTO {
  id: string;
  nameEn: string;
  nameAr: string;
  bbox: [number, number, number, number];
  parentId?: string | null;
  level: number;
}
