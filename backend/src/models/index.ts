import { AdminAction } from './admin-action.entity';
import { AnonymousSubject } from './anonymous-subject.entity';
import { AuditEvent } from './audit-event.entity';
import { AuthSession } from './auth-session.entity';
import { CairoArea } from './cairo-area.entity';
import { EvidenceAccess } from './evidence-access.entity';
import { Inquiry } from './inquiry.entity';
import { Listing } from './listing.entity';
import { Photo } from './photo.entity';
import { SavedListing } from './saved-listing.entity';
import { SellerNotification } from './seller-notification.entity';
import { SellerProfile } from './seller-profile.entity';
import { User } from './user.entity';
import { VerificationCase } from './verification-case.entity';
import { VerificationEvidence } from './verification-evidence.entity';
import { View } from './view.entity';

export {
  AdminAction,
  AnonymousSubject,
  AuditEvent,
  AuthSession,
  CairoArea,
  EvidenceAccess,
  Inquiry,
  Listing,
  Photo,
  SavedListing,
  SellerNotification,
  SellerProfile,
  User,
  VerificationCase,
  VerificationEvidence,
  View,
};

/** Canonical entity registry shared by Nest runtime and the TypeORM migration CLI. */
export const MAKAAN_ENTITIES = [
  AdminAction,
  AnonymousSubject,
  AuditEvent,
  AuthSession,
  CairoArea,
  EvidenceAccess,
  Inquiry,
  Listing,
  Photo,
  SavedListing,
  SellerNotification,
  SellerProfile,
  User,
  VerificationCase,
  VerificationEvidence,
  View,
] as const;
