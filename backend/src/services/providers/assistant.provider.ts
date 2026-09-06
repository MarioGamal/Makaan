import type {
  AssistantFilters,
  AssistantIntent,
  AssistantRelaxation,
} from '@makaan/shared/types/assistant';
import type { Locale } from '@makaan/shared/types/marketplace';

/** A governed area the assistant may resolve a question to, with reviewed aliases. */
export interface AssistantAreaOption {
  id: string;
  nameAr: string;
  nameEn: string;
  aliases: string[];
}

export interface AssistantInterpretationInput {
  message: string;
  locale: Locale;
  /** Filters carried over from the previous turn so follow-up questions work. */
  context?: AssistantFilters;
  areas: ReadonlyArray<AssistantAreaOption>;
}

export interface AssistantInterpretation {
  intent: AssistantIntent;
  filters: AssistantFilters;
  /** Knowledge-base topic identifiers behind an FAQ answer. */
  topics: string[];
  /** True when the visitor asked to start a new search rather than refine one. */
  resetContext: boolean;
}

export interface AssistantCompositionInput {
  locale: Locale;
  intent: AssistantIntent;
  filters: AssistantFilters;
  topics: string[];
  totalMatches: number;
  shownCount: number;
  relaxations: AssistantRelaxation[];
  priceRange?: { min: number; max: number };
  areaNames: ReadonlyArray<{ nameAr: string; nameEn: string }>;
}

export interface AssistantComposition {
  reply: string;
  suggestions: string[];
}

/**
 * Splits assistant behaviour into understanding and wording so retrieval always
 * stays in `AssistantService`. An adapter never reads listings itself, which keeps
 * exact locations, seller contacts, and moderation data outside its reach whatever
 * implementation is registered for the validated application mode.
 */
export interface AssistantProvider {
  readonly name: string;
  interpret(
    input: AssistantInterpretationInput,
  ): Promise<AssistantInterpretation>;
  compose(input: AssistantCompositionInput): Promise<AssistantComposition>;
}
