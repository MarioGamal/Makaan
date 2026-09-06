import type { AssistantFilters } from '@makaan/shared/types/assistant';
import type { ParticipationLabel } from '@makaan/shared/types/marketplace';

import type { AssistantAreaOption } from '../assistant.provider';

/**
 * Deterministic Arabic/English understanding for the local assistant adapter.
 * Everything here is pure text analysis: it produces the same public search
 * filters a visitor could set by hand, and nothing else.
 */

const ARABIC_DIACRITICS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const TATWEEL = /\u0640/g;
const ARABIC_INDIC_DIGITS = /[\u0660-\u0669\u06F0-\u06F9]/g;

const LETTER_FOLDING: Record<string, string> = {
  أ: 'ا', // أ -> ا
  إ: 'ا', // إ -> ا
  آ: 'ا', // آ -> ا
  ٱ: 'ا', // ٱ -> ا
  ى: 'ي', // ى -> ي
  ة: 'ه', // ة -> ه
  ؤ: 'و', // ؤ -> و
  ئ: 'ي', // ئ -> ي
};

/** Folds Arabic orthographic variants and digits so user spelling differences match. */
export function normalizeText(value: string): string {
  return value
    .replace(ARABIC_DIACRITICS, '')
    .replace(TATWEEL, '')
    .replace(ARABIC_INDIC_DIGITS, (digit) => String(digit.charCodeAt(0) & 0x0f))
    .replace(
      /[\u0623\u0625\u0622\u0671\u0649\u0629\u0624\u0626]/g,
      (letter) => LETTER_FOLDING[letter] ?? letter,
    )
    .toLowerCase()
    .replace(/(?<=\d)[,٬](?=\d{3}(?!\d))/g, '')
    .replace(/[^\p{L}\p{N}.]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const WORD_NUMBERS: Record<string, number> = {
  واحد: 1,
  واحده: 1,
  وحده: 1,
  one: 1,
  اتنين: 2,
  اثنين: 2,
  تنين: 2,
  two: 2,
  تلاته: 3,
  ثلاثه: 3,
  تلات: 3,
  ثلاث: 3,
  three: 3,
  اربعه: 4,
  اربع: 4,
  four: 4,
  خمسه: 5,
  خمس: 5,
  five: 5,
  سته: 6,
  ست: 6,
  six: 6,
  سبعه: 7,
  سبع: 7,
  seven: 7,
  تمانيه: 8,
  ثمانيه: 8,
  تمان: 8,
  ثمان: 8,
  eight: 8,
  تسعه: 9,
  تسع: 9,
  nine: 9,
  عشره: 10,
  عشر: 10,
  ten: 10,
};

const WORD_NUMBER_PATTERN = Object.keys(WORD_NUMBERS)
  .sort((left, right) => right.length - left.length)
  .join('|');

const DUAL_ROOM_WORDS = /(?:غرفتين|اوضتين|حجرتين)/;

const PROPERTY_TYPE_KEYWORDS: ReadonlyArray<[RegExp, string]> = [
  [/(?:شقه|شقق|شق|apartment|apartments|flat|flats)/, 'Apartment'],
  [/(?:فيلا|فيلات|فلل|villa|villas)/, 'Villa'],
  [/(?:دوبلكس|دبلكس|duplex|duplexes)/, 'Duplex'],
  [/(?:بنتهاوس|بنت هاوس|penthouse|penthouses)/, 'Penthouse'],
  [/(?:ستوديو|استوديو|studio|studios)/, 'Studio'],
  [/(?:تاون هاوس|تاونهاوس|town house|townhouse|townhouses)/, 'Townhouse'],
  [/(?:شاليه|شاليهات|chalet|chalets)/, 'Chalet'],
];

const SALE_PATTERN =
  /(?:للبيع|بيع|اشتري|اشتريه|شرا|شراء|تمليك|امتلك|buy|buying|sale|for sale|purchase)/;
const RENT_PATTERN =
  /(?:للايجار|ايجار|استاجر|اجار|تاجير|rent|rental|renting|for rent|lease|leasing)/;

const OWNER_ONLY_PATTERN =
  /(?:من المالك|من مالك|مالك|ملاك|صاحبها|صاحب العقار|من صاحبها|owner|owners|from the owner)/;
const VERIFIED_PATTERN = /(?:متحقق|موثق|موثوق|verified)/;
const AGENT_PATTERN =
  /(?:وسيط|وسطاء|سمسار|سماسره|بروكر|agent|agents|broker|brokers)/;
const NEGATION_CUE =
  /(?:من غير|بدون|مش|ما ?عايز|ما ?عاوز|لا اريد|no|not|without|skip)\s*$/;

const CHEAPEST_PATTERN = /(?:ارخص|اقل سعر|اقل الاسعار|cheapest|lowest price)/;
const PRICIEST_PATTERN =
  /(?:اغلي|اعلي سعر|اكبر سعر|most expensive|highest price)/;
// `الجديد` alone is omitted on purpose: it also appears inside area names such as
// `القاهرة الجديدة`, where it says nothing about sorting.
const NEWEST_PATTERN = /(?:احدث|اجدد|اخر الاعلانات|newest|latest)/;

const RESET_PATTERN =
  /(?:من الاول|ابدا من جديد|بحث جديد|امسح|الغي الفلاتر|reset|start over|new search|clear filters)/;

const PRICE_MAX_HINTS =
  /(?:تحت|اقل من|لحد|في حدود|بحدود|حوالي|في حدود|بحد اقصي|حد اقصي|ميزانيتي|ميزانيه|مش اكتر من|ما يزيد|under|below|up to|max|maximum|budget|at most|no more than)\s*$/;
const PRICE_MIN_HINTS =
  /(?:فوق|اكتر من|اكثر من|من|starting|starting from|over|above|min|minimum|at least)\s*$/;
const RANGE_MARKER = /(?:\s(?:لـ?|الي|ل|to|and|و)\s|\s*-\s*)/;

type Span = { start: number; end: number };

class Consumed {
  private readonly spans: Span[] = [];

  claim(start: number, end: number): void {
    this.spans.push({ start, end });
  }

  overlaps(start: number, end: number): boolean {
    return this.spans.some((span) => start < span.end && end > span.start);
  }
}

function numberFrom(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const word = WORD_NUMBERS[trimmed];
  if (word !== undefined) return word;
  const parsed = Number(trimmed.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function matchCountedNoun(
  text: string,
  nounPattern: string,
  consumed: Consumed,
): number | undefined {
  const pattern = new RegExp(
    `(\\d+(?:\\.\\d+)?|${WORD_NUMBER_PATTERN})\\s*(?:${nounPattern})`,
    'g',
  );
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (consumed.overlaps(start, end)) continue;
    const value = numberFrom(match[1] as string);
    if (value === undefined) continue;
    consumed.claim(start, end);
    return value;
  }
  return undefined;
}

type Amount = { value: number; start: number; end: number };

/**
 * Reads Egyptian money expressions: digits, `مليون`/`ألف` scales, `k`/`m`
 * suffixes, `نص` halves, and bare figures that are large enough to be a price.
 */
function extractAmounts(
  text: string,
  consumed: Consumed,
  rentContext: boolean,
): Amount[] {
  const amounts: Amount[] = [];
  const quantity = `(?:\\d+(?:\\.\\d+)?|${WORD_NUMBER_PATTERN})`;
  // Latin scales always require a leading quantity and word boundaries, otherwise
  // the `m` inside an ordinary word such as `from` or `room` reads as "million".
  // The Arabic scale words must not be followed by another Arabic letter, or
  // `الفرق` reads as `ألف` and invents a 1,000 EGP budget.
  const pattern = new RegExp(
    [
      `(?:(${quantity})\\s*)?(?:(نص)\\s*)?(مليونين|مليون|ملايين|الفين|الف|الاف)(?![\\u0600-\\u06FF])`,
      `(?:(${quantity})\\s*)(?:(نص)\\s*)?\\b(million|millions|thousand|thousands|k|m)\\b`,
      `(\\d{3,}(?:\\.\\d+)?)`,
    ].join('|'),
    'g',
  );

  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (consumed.overlaps(start, end)) continue;

    const quantityRaw = match[1] ?? match[4];
    const halfRaw = match[2] ?? match[5];
    const scaleRaw = match[3] ?? match[6];
    const bareRaw = match[7];
    let value: number | undefined;

    if (scaleRaw) {
      const multiplier = /^(?:مليونين|مليون|ملايين|million|millions|m)$/i.test(
        scaleRaw,
      )
        ? 1_000_000
        : 1_000;
      let quantity = quantityRaw ? numberFrom(quantityRaw) : undefined;
      if (quantity === undefined) {
        // Arabic dual forms carry the count in the word itself.
        quantity = /^(?:مليونين|الفين)$/.test(scaleRaw) ? 2 : halfRaw ? 0.5 : 1;
      } else if (halfRaw) quantity += 0.5;
      value = quantity * multiplier;
      const trailing = text.slice(end, end + 5);
      if (/^\s*و\s*نص/.test(trailing)) value += multiplier / 2;
    } else if (bareRaw) {
      const bare = Number(bareRaw);
      const threshold = rentContext ? 1_000 : 10_000;
      if (Number.isFinite(bare) && bare >= threshold) value = bare;
    }

    if (value === undefined || value <= 0) continue;
    consumed.claim(start, end);
    amounts.push({ value, start, end });
  }

  return amounts;
}

function resolvePrices(
  text: string,
  amounts: Amount[],
): { priceMin?: number; priceMax?: number } {
  if (amounts.length === 0) return {};

  if (amounts.length >= 2) {
    const [first, second] = amounts as [Amount, Amount];
    const between = text.slice(first.end, second.start);
    if (RANGE_MARKER.test(between) && between.trim().length <= 6) {
      const low = Math.min(first.value, second.value);
      const high = Math.max(first.value, second.value);
      return { priceMin: low, priceMax: high };
    }
  }

  const amount = amounts[0] as Amount;
  const before = text.slice(Math.max(0, amount.start - 24), amount.start);
  if (PRICE_MIN_HINTS.test(before) && !PRICE_MAX_HINTS.test(before)) {
    return { priceMin: amount.value };
  }
  // A budget stated without a comparator ("بمليون", "٥ مليون") is a ceiling.
  return { priceMax: amount.value };
}

const AREA_KEY_STOPWORDS = new Set([
  'القاهره',
  'قاهره',
  'مصر',
  'مدينه',
  'حي',
  'منطقه',
  'جديده',
  'الجديده',
  'شرق',
  'غرب',
  'شمال',
  'جنوب',
  'cairo',
  'city',
  'new',
  'district',
  'east',
  'west',
  'north',
  'south',
  'el',
  'al',
]);

function areaKeys(name: string): string[] {
  const normalized = normalizeText(name);
  if (!normalized) return [];
  const keys = new Set<string>([normalized]);
  const withoutArticle = normalized.replace(/^ال/, '');
  if (withoutArticle.length >= 3) keys.add(withoutArticle);

  const words = normalized.split(' ').filter(Boolean);
  if (words.length > 1) {
    for (const word of words) {
      const bare = word.replace(/^ال/, '');
      if (
        word.length >= 5 &&
        !AREA_KEY_STOPWORDS.has(word) &&
        !AREA_KEY_STOPWORDS.has(bare)
      ) {
        keys.add(word);
        if (bare.length >= 4) keys.add(bare);
      }
    }
  }
  return [...keys];
}

/** Picks the governed area whose longest reviewed name or alias appears in the question. */
export function matchArea(
  text: string,
  areas: ReadonlyArray<AssistantAreaOption>,
): AssistantAreaOption | undefined {
  let best: { area: AssistantAreaOption; length: number } | undefined;
  for (const area of areas) {
    const names = [area.nameAr, area.nameEn, ...area.aliases];
    for (const name of names) {
      for (const key of areaKeys(name)) {
        if (key.length < 3 || !text.includes(key)) continue;
        if (!best || key.length > best.length) {
          best = { area, length: key.length };
        }
      }
    }
  }
  return best?.area;
}

export interface ExtractedFacets {
  filters: AssistantFilters;
  /** Number of concrete search facets found, used to separate search from FAQ. */
  signalCount: number;
  resetContext: boolean;
}

export function extractFacets(
  rawMessage: string,
  areas: ReadonlyArray<AssistantAreaOption>,
): ExtractedFacets {
  const text = normalizeText(rawMessage);
  const consumed = new Consumed();
  const filters: AssistantFilters = {};
  let signalCount = 0;

  // Bathrooms are parsed only so their number is not mistaken for a bedroom count;
  // the public search contract has no bathroom filter, so nothing is claimed from it.
  // Alternatives are ordered longest first so `bedroom` is never truncated to
  // `bed`, which would leave the trailing letters to be misread as a price scale.
  matchCountedNoun(
    text,
    'حمامات|حمامين|حمام|bathrooms|bathroom|baths|bath',
    consumed,
  );

  const bedrooms = matchCountedNoun(
    text,
    'اوضتين|اوضه|اوض|غرفتين|غرفه|غرف|حجرتين|حجره|حجر|bedrooms|bedroom|beds|bed|br',
    consumed,
  );
  if (bedrooms !== undefined && bedrooms >= 1 && bedrooms <= 20) {
    filters.bedroomsMin = Math.round(bedrooms);
    signalCount += 1;
  } else if (DUAL_ROOM_WORDS.test(text)) {
    filters.bedroomsMin = 2;
    signalCount += 1;
  }

  const size = matchCountedNoun(
    text,
    'متر مربع|امتار|متر|م2|square meters|square meter|sqm|sq m|m2|meters|meter',
    consumed,
  );
  if (size !== undefined && size >= 20 && size <= 5_000) {
    filters.sizeMin = Math.round(size);
    signalCount += 1;
  }

  const sale = SALE_PATTERN.test(text);
  const rent = RENT_PATTERN.test(text);
  if (sale !== rent) {
    filters.purpose = sale ? 'sale' : 'long_term_rent';
    signalCount += 1;
  }

  const amounts = extractAmounts(text, consumed, rent);
  const prices = resolvePrices(text, amounts);
  if (prices.priceMin !== undefined) {
    filters.priceMin = prices.priceMin;
    signalCount += 1;
  }
  if (prices.priceMax !== undefined) {
    filters.priceMax = prices.priceMax;
    signalCount += 1;
  }

  for (const [pattern, propertyType] of PROPERTY_TYPE_KEYWORDS) {
    if (pattern.test(text)) {
      filters.propertyType = propertyType;
      signalCount += 1;
      break;
    }
  }

  const participation = matchParticipation(text);
  if (participation) {
    filters.participation = participation;
    signalCount += 1;
  }

  const area = matchArea(text, areas);
  if (area) {
    filters.areaId = area.id;
    filters.areaNameAr = area.nameAr;
    filters.areaNameEn = area.nameEn;
    signalCount += 1;
  }

  // A sort request counts as a search signal so "show me the cheapest" refines an
  // ongoing conversation instead of falling through to the generic help reply.
  if (CHEAPEST_PATTERN.test(text)) {
    filters.sort = 'price_asc';
    signalCount += 1;
  } else if (PRICIEST_PATTERN.test(text)) {
    filters.sort = 'price_desc';
    signalCount += 1;
  } else if (NEWEST_PATTERN.test(text)) {
    filters.sort = 'newest';
    signalCount += 1;
  }

  return { filters, signalCount, resetContext: RESET_PATTERN.test(text) };
}

/**
 * Decides which participation labels a question is asking for.
 *
 * "من المالك مش من سمسار" names both an owner and an agent, so a plain keyword
 * test would answer with agent listings — the opposite of the request. A negation
 * cue immediately before the agent word, or an owner cue anywhere alongside it,
 * both resolve to owners.
 */
function matchParticipation(text: string): ParticipationLabel[] | undefined {
  const agentMatch = AGENT_PATTERN.exec(text);
  const ownerCue = OWNER_ONLY_PATTERN.test(text);

  if (agentMatch) {
    const before = text.slice(
      Math.max(0, agentMatch.index - 20),
      agentMatch.index,
    );
    const negated = NEGATION_CUE.test(
      before.replace(/\s*(?:من|the|a)\s*$/, ' '),
    );
    if (negated || ownerCue) return ['verified_owner', 'owner_not_verified'];
    return ['declared_agent'];
  }

  if (!ownerCue) return undefined;
  return VERIFIED_PATTERN.test(text)
    ? ['verified_owner']
    : ['verified_owner', 'owner_not_verified'];
}
