import type {
  Locale,
  ListingPurpose,
  ParticipationLabel,
  PublicListingCard,
  PublicSort,
} from './marketplace';

/**
 * Structured search facets the assistant understood from a question.
 * Every field mirrors an existing public search filter, so the assistant can
 * never request data the public marketplace search would not already return.
 */
export interface AssistantFilters {
  purpose?: ListingPurpose;
  areaId?: string;
  areaNameAr?: string;
  areaNameEn?: string;
  propertyType?: string;
  priceMin?: number;
  priceMax?: number;
  sizeMin?: number;
  sizeMax?: number;
  bedroomsMin?: number;
  bathroomsMin?: number;
  participation?: ParticipationLabel[];
  sort?: PublicSort;
}

/** A constraint the assistant loosened, and the value it used instead. */
export type AssistantRelaxation =
  | { kind: 'price_ceiling_raised'; from: number; to: number }
  | { kind: 'price_ceiling_dropped'; from: number }
  | { kind: 'bedrooms_lowered'; from: number; to: number }
  | { kind: 'bedrooms_dropped'; from: number }
  | { kind: 'property_type_dropped'; from: string }
  | { kind: 'participation_dropped' }
  | { kind: 'size_dropped' }
  | { kind: 'area_dropped'; from: string };

export type AssistantIntent =
  'search' | 'faq' | 'greeting' | 'help' | 'privacy_boundary' | 'out_of_scope';

export interface AssistantMessageRequest {
  message: string;
  locale?: Locale;
  /** Filters echoed from the previous reply so follow-up questions keep context. */
  context?: AssistantFilters;
}

export interface AssistantMessageResponse {
  messageId: string;
  locale: Locale;
  intent: AssistantIntent;
  /** Localized answer text. Always machine-generated; surface it as such. */
  reply: string;
  /** Constitution VII: user-facing generated content is always identified. */
  generated: true;
  /** Which assistant adapter produced the reply, for support and evidence. */
  provider: string;
  /** Public listing cards only. Identical projection to `GET /listings`. */
  listings: PublicListingCard[];
  totalMatches: number;
  filters: AssistantFilters;
  relaxations: AssistantRelaxation[];
  /** Deep link into the real marketplace search with the same filters applied. */
  browseQuery: string;
  /** Localized quick replies the interface may offer as buttons. */
  suggestions: string[];
  /** Knowledge-base topic identifiers behind an FAQ answer, for reviewability. */
  topics: string[];
}
