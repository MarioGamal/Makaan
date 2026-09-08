import type {
  AssistantFilters,
  UnsupportedConstraint,
} from '@makaan/shared/types/assistant';
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

/**
 * Egyptian Arabic typed in Latin letters and digits, which is how a large share of
 * visitors write. Only forms that are unambiguously transliteration are mapped —
 * real English words are left alone, because the English keyword lists already
 * handle them and rewriting them could change a correct parse.
 */
const FRANCO_TOKENS: Array<[RegExp, string]> = [
  [/\b(?:sha2+a|sha2+ah|sha22a|sha22ah|sh2a)\b/g, 'شقه'],
  [/\b(?:shu2a2|sho2a2|sho22a)\b/g, 'شقق'],
  [/\b(?:3ayez|3awez|3aiz|3ayza|3awza|ayez|awez)\b/g, 'عايز'],
  [/\b(?:arkhas|arkas|ar5as)\b/g, 'ارخص'],
  [/\b(?:a8la|aghla|ag2la)\b/g, 'اغلي'],
  [/\b(?:lel\s*bee3|lelbee3|lel\s*bei3|bee3|bei3)\b/g, 'للبيع'],
  [
    /\b(?:lel\s*egar|lelegar|lel\s*igar|el\s*egar|egar|igar|eg2ar)\b/g,
    'للايجار',
  ],
  [/\b(?:ma3ady|ma3adi|el\s*ma3ady|elma3ady)\b/g, 'المعادي'],
  [
    /\b(?:masr\s*el\s*gedida|masr\s*elgedida|masr\s*gdida|masr\s*el\s*gdida)\b/g,
    'مصر الجديده',
  ],
  [
    /\b(?:tagamo3|el\s*tagamo3|eltagamo3|tagamoa|tagam3|fifth\s*settlement|5th\s*settlement)\b/g,
    'التجمع الخامس',
  ],
  [/\b(?:madinet\s*nasr|madinat\s*nasr|madenet\s*nasr)\b/g, 'مدينة نصر'],
  [/\b(?:mohandeseen|mohandessin|mohandesin)\b/g, 'المهندسين'],
  // `zayed` reduces to a three-letter shape, too short for the fuzzy matcher's
  // minimum, so the name is mapped outright.
  [
    /\b(?:sheikh\s*zayed|el\s*sheikh\s*zayed|shiekh\s*zayed|zayed|zaied|zayd)\b/g,
    'الشيخ زايد',
  ],
  // `b` is the attached Egyptian "for": people write "bmelion", not "b melion".
  [/\bb?(?:melion|melyon|malyon|milion|million)\b/g, 'مليون'],
  [/\bb?(?:alf|alef|allf)\b/g, 'الف'],
  [/\b(?:oda|odda|owda|ode)\b/g, 'اوضه'],
  [
    /\b(?:odteen|odtein|owdteen|ghorfeteen|ghorfetein|3orfeteen|3orfetein|8orfeteen|2odteen)\b/g,
    'غرفتين',
  ],
  [/\b(?:ghoraf|8oraf|3oraf|ghorfa|8orfa|3orfa|odaf)\b/g, 'غرف'],
  [/\b(?:rekhes|rekhees|rakhees|re5es)\b/g, 'رخيص'],
  [/\b(?:mawgod|mawgoda|mawgoud|mawgouda|motah|mota7)\b/g, 'معروض'],
  [/\b(?:semsar|samsar|sameser)\b/g, 'سمسار'],
  [/\b(?:malek|el\s*malek|elmalek|sa7eb)\b/g, 'المالك'],
  [/\b(?:matr|meter|metr)\b/g, 'متر'],
];

/** Rewrites Latin-script Egyptian Arabic into the Arabic forms the rules match. */
function foldFranco(value: string): string {
  let folded = value;
  for (const [pattern, replacement] of FRANCO_TOKENS) {
    folded = folded.replace(pattern, replacement);
  }
  return folded;
}

/** Folds Arabic orthographic variants and digits so user spelling differences match. */
export function normalizeText(value: string): string {
  return (
    foldFranco(value.toLowerCase())
      .replace(ARABIC_DIACRITICS, '')
      .replace(TATWEEL, '')
      .replace(ARABIC_INDIC_DIGITS, (digit) =>
        String(digit.charCodeAt(0) & 0x0f),
      )
      .replace(
        /[\u0623\u0625\u0622\u0671\u0649\u0629\u0624\u0626]/g,
        (letter) => LETTER_FOLDING[letter] ?? letter,
      )
      .toLowerCase()
      // The Arabic decimal separator has to become a dot before punctuation is
      // stripped, or "١٫٥ مليون" splits into "1 5 مليون" and reads as five million.
      .replace(/(?<=\d)٫(?=\d)/g, '.')
      .replace(/(?<=\d)[,٬](?=\d{3}(?!\d))/g, '')
      .replace(/[^\p{L}\p{N}.]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Latin words carrying the digits Egyptians substitute for Arabic letters —
 * `3ayez`, `sha2a`, `7aga`. Two letters are required beside the digit so units
 * such as `m2` and figures such as `150m2` are not mistaken for it.
 */
const FRANCO_DIGIT_WORD =
  /\b(?:[a-z]{0,}[23578][a-z]{2,}|[a-z]{2,}[23578][a-z]{0,})\b/;

/**
 * Picks the language to answer in from the question itself, so a visitor writing
 * English gets English even while the interface is in Arabic, and the reverse.
 *
 * The count runs on normalized text, which means Latin-script Arabic has already
 * been folded to Arabic and counts as Arabic — someone typing "3ayez sha2a" is
 * speaking Arabic. A mixed message follows its majority; a message with no
 * letters at all, or an exact tie, keeps whatever the interface is set to.
 */
export function detectLocale(
  rawMessage: string,
  fallback: 'ar' | 'en',
): 'ar' | 'en' {
  if (FRANCO_DIGIT_WORD.test(rawMessage.toLowerCase())) return 'ar';

  // Counted by word rather than by letter. English words are longer, so letters
  // would call "عايز 3 bedroom apartment في المعادي" English when three of its
  // five words — and its whole sentence shape — are Arabic.
  let arabic = 0;
  let latin = 0;
  let opened: 'ar' | 'en' | undefined;
  for (const word of normalizeText(rawMessage).split(' ')) {
    const arabicLetters = (word.match(/[؀-ۿ]/g) ?? []).length;
    const latinLetters = (word.match(/[a-z]/g) ?? []).length;
    if (arabicLetters > latinLetters) {
      arabic += 1;
      opened ??= 'ar';
    } else if (latinLetters > arabicLetters) {
      latin += 1;
      opened ??= 'en';
    }
  }
  if (arabic !== latin) return arabic > latin ? 'ar' : 'en';
  // An even split is decided by the language the sentence opens in, which is the
  // one the visitor was thinking in. With no letters at all — "12345", "؟" — there
  // is nothing to read, so the interface setting stands.
  return opened ?? fallback;
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
  // `شق` on its own is omitted: it is a substring of unrelated words.
  [/(?:شقه|شقق|apartment|apartments|flat|flats)/, 'Apartment'],
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

/**
 * Wraps Arabic alternatives so they only match as whole words.
 *
 * Arabic attaches the article and short prepositions directly to a word, so a
 * plain `\b` is useless and a bare substring is dangerous: `مالك` ("owner") sits
 * inside `الزمالك` ("Zamalek"), which silently turned a question about an area
 * into an owners-only filter. The lookbehind admits an optional article and up to
 * two proclitic letters, and the lookahead refuses any following Arabic letter.
 */
function arabicWord(alternatives: string): string {
  return `(?<=(?:^|[^\\u0600-\\u06FF])[\\u0648\\u0641\\u0628\\u0643\\u0644]{0,2}(?:\\u0627\\u0644)?)(?:${alternatives})(?![\\u0600-\\u06FF])`;
}

const OWNER_ONLY_PATTERN = new RegExp(
  `${arabicWord('مالك|ملاك|صاحبها|صاحب العقار')}|(?:من المالك|من مالك|من صاحبها)|\\b(?:owner|owners|from the owner)\\b`,
);
const VERIFIED_PATTERN = /(?:متحقق|موثق|موثوق|verified)/;
const AGENT_PATTERN = new RegExp(
  `${arabicWord('وسيط|وسطاء|سمسار|سماسره|بروكر')}|\\b(?:agent|agents|broker|brokers)\\b`,
);
const NEGATION_CUE =
  /(?:من غير|بدون|مش|ما ?عايز|ما ?عاوز|لا اريد|\bno\b|\bnot\b|without|except|skip)/;

// "شقة رخيصة" is not a superlative but it does say which end of the range to
// start from, so it sorts the same way "الأرخص" does.
const CHEAPEST_PATTERN =
  /(?:ارخص|اقل سعر|اقل الاسعار|رخيص|رخيصه|في المتناول|cheapest|lowest price|cheap|affordable|budget friendly)/;
const PRICIEST_PATTERN =
  /(?:اغلي|اعلي سعر|اكبر سعر|most expensive|highest price|priciest|dearest|most costly|top price)/;
// `الجديد` alone is omitted on purpose: it also appears inside area names such as
// `القاهرة الجديدة`, where it says nothing about sorting.
const NEWEST_PATTERN = /(?:احدث|اجدد|اخر الاعلانات|newest|latest)/;

/**
 * A message that states what the visitor wants, rather than adjusting a search
 * already under way.
 *
 * Naming a want ("عاوز شقة غرفتين بس") or a property type is a complete request,
 * and carrying an area or a budget into it from an earlier turn answers a
 * question that was not asked. A fragment — "وفي القاهرة الجديدة؟", "الأرخص",
 * "من الملاك بس" — has no subject of its own and is a genuine refinement.
 */
const REQUEST_VERB_PATTERN =
  /(?:عايز|عاوز|عايزه|عاوزه|محتاج|محتاجه|اريد|ابحث|دورلي|دور لي|هاتلي|جبلي|وريني|ورني|i want|i need|looking for|show me|find me|search for|get me)/;

const CONTINUATION_OPENER =
  /^(?:و\s|وفي|وفى|وف\s|طب|طيب|وبعدين|وكمان|وايه|and\b|what about|how about)/;

/**
 * A request for the next page of the same search.
 *
 * It always refines, even though "ورّيني كمان" carries a request verb: asking for
 * more of something only means anything relative to the search already on screen.
 */
const MORE_PATTERN =
  /(?:كمان|المزيد|زياده|غيرهم|غيرها|التاني|الباقي|باقي النتايج|show more|more results|next page|others|anything else)/;

const RESET_PATTERN =
  /(?:من الاول|ابدا من جديد|بحث جديد|امسح|الغي الفلاتر|reset|start over|new search|clear filters)/;

/**
 * Wording that scopes a question to everything published rather than to the
 * search already in progress. "أغلى شقة معروضة" asks about the whole catalogue,
 * so carrying over the previous area and budget would answer a different
 * question than the one asked.
 */
const SCOPE_RESET_PATTERN =
  /(?:معروضه|معروض|معروضين|متاحه|متاح|عندكم|علي الموقع|في الموقع|كلها|كل الاعلانات|بشكل عام|اي منطقه|listed|available|on the site|overall|in general|anywhere|any area)/;

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

const BEDROOM_NOUNS =
  'اوضتين|اوضه|اوض|غرفتين|غرفه|غرف|حجرتين|حجره|حجر|bedrooms|bedroom|beds|bed|br';

/**
 * Marks an exact bedroom count rather than a floor.
 *
 * `بس` also means "but", so in Arabic it only counts when it follows the count
 * immediately; the unambiguous words are accepted anywhere in the short window
 * after it, which is where English puts "only" — "2 bedroom apartment only".
 */
const EXACT_COUNT_IMMEDIATE = /^\s*(?:بس|فقط|only|exactly)/;
const EXACT_COUNT_NEARBY =
  /(?:بالظبط|بالضبط|لا اكتر|مش اكتر|\bonly\b|\bexactly\b|\bno more\b)/;

/**
 * Reads a bedroom requirement as a range rather than only a floor.
 *
 * "غرفتين بس" means exactly two, and answering it with every three and four
 * bedroom home answers a different question. A stated range is read as one too.
 */
function extractBedrooms(
  text: string,
  consumed: Consumed,
): { min?: number; max?: number } {
  const quantity = `(?:\\d+|${WORD_NUMBER_PATTERN})`;
  const range = new RegExp(
    `(?:من\\s*)?(${quantity})\\s*(?:لـ|الي|ل|-|to|and|و)\\s*(${quantity})\\s*(?:${BEDROOM_NOUNS})`,
  );
  const rangeMatch = range.exec(text);
  if (rangeMatch) {
    const low = numberFrom(rangeMatch[1] as string);
    const high = numberFrom(rangeMatch[2] as string);
    if (low !== undefined && high !== undefined && low <= high && high <= 20) {
      consumed.claim(rangeMatch.index, rangeMatch.index + rangeMatch[0].length);
      return { min: low, max: high };
    }
  }

  const single = matchCountedNoun(text, BEDROOM_NOUNS, consumed);
  const value =
    single !== undefined && single >= 1 && single <= 20
      ? Math.round(single)
      : DUAL_ROOM_WORDS.test(text)
        ? 2
        : undefined;
  if (value === undefined) return {};

  // The marker has to follow the count closely; further away it is usually the
  // ordinary Egyptian "بس" meaning "but" rather than "only".
  // English puts the marker before the count ("exactly 2 bedrooms") and Arabic
  // after it ("غرفتين بس"), so both sides are examined. The window before is kept
  // short so an "only" belonging to another clause is not picked up.
  // The number is optional: Arabic dual forms such as `غرفتين` carry the count in
  // the word itself, and requiring a digit would miss "غرفتين بس" entirely.
  const counted = new RegExp(
    `(?:(?:\\d+|${WORD_NUMBER_PATTERN})\\s*)?(?:${BEDROOM_NOUNS})`,
    'g',
  );
  let exact = false;
  for (const match of text.matchAll(counted)) {
    const start = match.index;
    const end = start + match[0].length;
    const before = text.slice(Math.max(0, start - 16), start);
    const after = text.slice(end);
    if (
      EXACT_COUNT_IMMEDIATE.test(after) ||
      EXACT_COUNT_NEARBY.test(after.slice(0, 28)) ||
      EXACT_COUNT_NEARBY.test(before)
    ) {
      exact = true;
    }
  }
  return exact ? { min: value, max: value } : { min: value };
}

type Amount = { value: number; start: number; end: number };

const SIZE_NOUNS =
  'متر مربع|امتار|متر|م2|square meters|square meter|sqm|sq m|m2|meters|meter';

function validSize(value: number | undefined): value is number {
  return value !== undefined && value >= 20 && value <= 5_000;
}

/** Reads floor, ceiling, and range wording instead of treating every size as a minimum. */
function extractSize(
  text: string,
  consumed: Consumed,
): { min?: number; max?: number } {
  const quantity = `(?:\\d+(?:\\.\\d+)?|${WORD_NUMBER_PATTERN})`;
  const range = new RegExp(
    `(?:من|from)?\\s*(${quantity})\\s*(?:لـ|ل|الي|و|-|to|and)\\s*(${quantity})\\s*(?:${SIZE_NOUNS})`,
  );
  const rangeMatch = range.exec(text);
  if (rangeMatch) {
    const min = numberFrom(rangeMatch[1] as string);
    const max = numberFrom(rangeMatch[2] as string);
    if (validSize(min) && validSize(max) && min <= max) {
      consumed.claim(rangeMatch.index, rangeMatch.index + rangeMatch[0].length);
      return { min: Math.round(min), max: Math.round(max) };
    }
  }

  const directional = [
    {
      key: 'max' as const,
      pattern: new RegExp(
        `(?:اقل من|تحت|لحد|حتي|under|less than|up to|at most|max(?:imum)?)\\s*(${quantity})\\s*(?:${SIZE_NOUNS})`,
      ),
    },
    {
      key: 'min' as const,
      pattern: new RegExp(
        `(?:اكتر من|اكثر من|فوق|علي الاقل|over|more than|at least|min(?:imum)?)\\s*(${quantity})\\s*(?:${SIZE_NOUNS})`,
      ),
    },
  ];
  for (const { key, pattern } of directional) {
    const match = pattern.exec(text);
    const value = match ? numberFrom(match[1] as string) : undefined;
    if (match && validSize(value)) {
      consumed.claim(match.index, match.index + match[0].length);
      return { [key]: Math.round(value) };
    }
  }

  const minimum = matchCountedNoun(text, SIZE_NOUNS, consumed);
  return validSize(minimum) ? { min: Math.round(minimum) } : {};
}

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
      // The scale may be written against the number — "3m", "500k" — so a word
      // boundary before it is wrong; what matters is that nothing follows it, or
      // "180 m2" would read as 180 million.
      `(?:(${quantity})\\s*)(?:(نص)\\s*)?(million|millions|thousand|thousands|k|m)(?![a-z0-9])`,
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

/**
 * "between 2 and 4 million" — a range where only the second figure carries the
 * scale, so the first has to borrow it. Written out in full on both sides
 * ("من ٥ مليون لـ ٨ مليون") the ordinary two-amount path already handles it.
 */
function extractSharedScaleRange(
  text: string,
  consumed: Consumed,
): { priceMin: number; priceMax: number } | undefined {
  const quantity = `(?:\\d+(?:\\.\\d+)?|${WORD_NUMBER_PATTERN})`;
  const pattern = new RegExp(
    `(?:between|from|من)?\\s*(${quantity})\\s*(?:to|and|و|الي|لـ|ل|-)\\s*(${quantity})\\s*(مليون|ملايين|الف|الاف|million|millions|thousand|thousands|k|m)(?![a-z0-9])`,
  );
  const match = pattern.exec(text);
  if (!match) return undefined;
  const low = numberFrom(match[1] as string);
  const high = numberFrom(match[2] as string);
  const scale = match[3] as string;
  if (low === undefined || high === undefined || low > high) return undefined;
  const multiplier = /^(?:مليون|ملايين|million|millions|m)$/.test(scale)
    ? 1_000_000
    : 1_000;
  consumed.claim(match.index, match.index + match[0].length);
  return { priceMin: low * multiplier, priceMax: high * multiplier };
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

/**
 * Words that must never be read as a place name on their own. Latin matching is
 * vowel-insensitive, so without this list ordinary query words could reach an
 * area whose transliteration happens to share a consonant shape.
 */
const LATIN_AREA_STOPWORDS = new Set([
  'and',
  'any',
  'apartment',
  'apartments',
  'area',
  'areas',
  'available',
  'bed',
  'bedroom',
  'bedrooms',
  'best',
  'budget',
  'buy',
  'cairo',
  'cheap',
  'cheapest',
  'city',
  'compound',
  'cost',
  'district',
  'downtown',
  'duplex',
  'east',
  'egp',
  'expensive',
  'find',
  'flat',
  'flats',
  'floor',
  'for',
  'from',
  'furnished',
  'garden',
  'home',
  'homes',
  'house',
  'listed',
  'listing',
  'listings',
  'looking',
  'meter',
  'meters',
  'million',
  'more',
  'near',
  'need',
  'new',
  'newest',
  'north',
  'only',
  'owner',
  'owners',
  'parking',
  'penthouse',
  'please',
  'price',
  'priced',
  'property',
  'rent',
  'rental',
  'sale',
  'sell',
  'settlement',
  'show',
  'size',
  'south',
  'sqm',
  'studio',
  'thanks',
  'the',
  'townhouse',
  'under',
  'unit',
  'villa',
  'want',
  'west',
  'with',
  'within',
]);

/**
 * A vowel-insensitive shape for Latin spellings of Arabic place names.
 *
 * Egyptians transliterate the same area many ways — Zamalek, Zamalik, zamlek,
 * El Zamalek — and the differences are almost entirely in the vowels, doubled
 * letters, and the attached article. Masking those leaves a shape the spellings
 * share, which a small edit distance then covers for the rest.
 */
/**
 * Digits Egyptians use as Arabic letters, resolved before punctuation is stripped.
 *
 * Without this, `ma3ady` breaks into two fragments and no shape can be read from
 * it, which is why each such spelling used to need its own hand-written entry.
 * Resolving them here means a newly governed area is understood in Latin script
 * the moment it exists, with no code change of any kind.
 */
const ARABIZI_DIGITS: Record<string, string> = {
  '2': '', // ء — a glottal stop, silent in a skeleton
  '3': '', // ع — likewise
  '4': 'd', // ذ
  '5': 'k', // خ
  '6': 't', // ط
  '7': 'h', // ح
  '8': 'g', // غ
  '9': 's', // ص
};

const resolveArabizi = (value: string): string =>
  value.replace(/(?<=[a-z])[2-9]|[2-9](?=[a-z])/g, (digit) =>
    digit in ARABIZI_DIGITS ? (ARABIZI_DIGITS[digit] as string) : ' ',
  );

function latinAreaKey(value: string): string {
  return resolveArabizi(value.toLowerCase())
    .replace(/[’'`]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\b(?:el|al|the)\b/g, ' ')
    .trim()
    .replace(/\s+/g, '')
    .replace(/ph/g, 'f')
    .replace(/ck/g, 'k')
    .replace(/[qc]/g, 'k')
    .replace(/j/g, 'g')
    .replace(/y/g, 'i')
    .replace(/([a-z])\1+/g, '$1')
    .replace(/[aeiou]/g, '*')
    .replace(/\*+/g, '*');
}

/**
 * Arabic script writes no short vowels, Latin transliteration writes them all,
 * so the two only line up on consonants. `مصر الجديدة` and "masr alegdeda" share
 * `msrgdd`; nothing shorter than that comparison would ever match them.
 */
const ARABIC_TO_LATIN: Record<string, string> = {
  ا: '',
  أ: '',
  إ: '',
  آ: '',
  و: '',
  ي: '',
  ى: '',
  ع: '',
  ء: '',
  ة: '',
  ب: 'b',
  ت: 't',
  ث: 't',
  ج: 'g',
  ح: 'h',
  خ: 'k',
  د: 'd',
  ذ: 'd',
  ر: 'r',
  ز: 'z',
  س: 's',
  ش: 's',
  ص: 's',
  ض: 'd',
  ط: 't',
  ظ: 'z',
  غ: 'g',
  ف: 'f',
  ق: 'k',
  ك: 'k',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ه: 'h',
};

/** Consonant skeleton of an Arabic place name, with the article dropped. */
function arabicSkeleton(value: string): string {
  return (
    value
      .split(/\s+/)
      .map((word) => (word.length > 3 ? word.replace(/^ال/, '') : word))
      // The feminine ending is silent and transliterations almost never write it:
      // `القاهرة` is "kahera", not "kaherah".
      .map((word) => (word.length > 2 ? word.replace(/[هة]$/, '') : word))
      .join('')
      .split('')
      .map((letter) => ARABIC_TO_LATIN[letter] ?? '')
      .join('')
      .replace(/([a-z])\1+/g, '$1')
  );
}

/** Consonant skeleton of a Latin spelling, so it can be compared with the above. */
function latinSkeleton(value: string): string {
  return (
    resolveArabizi(value.toLowerCase())
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      // The Arabic article is written attached as often as it is written apart,
      // so it is dropped either way rather than left to distort the shape.
      .filter((word) => word !== 'al' && word !== 'el' && word !== 'the')
      .map((word) => (word.length > 4 ? word.replace(/^(?:al|el)/, '') : word))
      .join('')
      .replace(/sh|ch/g, 's')
      .replace(/kh/g, 'k')
      .replace(/gh/g, 'g')
      .replace(/th/g, 't')
      .replace(/dh/g, 'd')
      .replace(/ph/g, 'f')
      .replace(/ck/g, 'k')
      .replace(/[pb]/g, 'b')
      .replace(/[qck]/g, 'k')
      .replace(/j/g, 'g')
      .replace(/[aeiouwy]/g, '')
      .replace(/([a-z])\1+/g, '$1')
  );
}

/** Edit distance, bounded: anything past the limit stops early. */
function withinDistance(left: string, right: string, limit: number): boolean {
  if (Math.abs(left.length - right.length) > limit) return false;
  let previous = Array.from({ length: right.length + 1 }, (_, i) => i);
  for (let i = 1; i <= left.length; i += 1) {
    const current = [i];
    let best = i;
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      const value = Math.min(
        (current[j - 1] as number) + 1,
        (previous[j] as number) + 1,
        (previous[j - 1] as number) + cost,
      );
      current[j] = value;
      if (value < best) best = value;
    }
    if (best > limit) return false;
    previous = current;
  }
  return (previous[right.length] as number) <= limit;
}

/**
 * Every shape an area may be written as.
 *
 * Two kinds: a vowel-masked key from its Latin spellings, which keeps positional
 * structure for short names, and a consonant skeleton derived from the Arabic
 * name as well, which is the only thing a transliteration such as
 * "masr alegdeda" can be compared against.
 */
function latinAreaKeys(
  area: AssistantAreaOption,
): Array<{ key: string; kind: 'masked' | 'skeleton' }> {
  const keys = new Map<string, 'masked' | 'skeleton'>();
  const add = (key: string, kind: 'masked' | 'skeleton', minimum: number) => {
    if (key.length >= minimum && !keys.has(key)) keys.set(key, kind);
  };

  for (const source of [area.nameEn, ...area.aliases]) {
    if (/[a-z]/i.test(source)) {
      add(latinAreaKey(source), 'masked', 4);
      add(latinSkeleton(source), 'skeleton', 4);
      for (const word of source.toLowerCase().split(/\s+/)) {
        if (LATIN_AREA_STOPWORDS.has(word.replace(/[^a-z]/g, ''))) continue;
        add(latinAreaKey(word), 'masked', 4);
        add(latinSkeleton(word), 'skeleton', 4);
      }
    }
    if (/[؀-ۿ]/.test(source)) add(arabicSkeleton(source), 'skeleton', 4);
  }
  add(arabicSkeleton(area.nameAr), 'skeleton', 4);
  for (const word of area.nameAr.split(/\s+/)) {
    add(arabicSkeleton(word), 'skeleton', 4);
  }

  return [...keys].map(([key, kind]) => ({ key, kind }));
}

/**
 * Fallback for Latin place names that exact matching missed. Runs only after the
 * reviewed names and aliases have failed, and a longer shape needs an exact match
 * or a single edit; a short one must match exactly, because at four characters a
 * single edit is most of the word.
 */
function matchAreaByShape(
  text: string,
  areas: ReadonlyArray<AssistantAreaOption>,
): AssistantAreaOption | undefined {
  // Digits are admitted so Latin-script Arabic reaches the shape functions, which
  // resolve them; a bare figure is excluded by requiring two letters.
  const words = text
    .split(' ')
    .filter(
      (word) =>
        /^[a-z0-9]+$/.test(word) && (word.match(/[a-z]/g) ?? []).length >= 2,
    );
  if (words.length === 0) return undefined;

  const candidates: string[] = [];
  for (let i = 0; i < words.length; i += 1) {
    for (let span = 1; span <= 3 && i + span <= words.length; span += 1) {
      const phrase = words.slice(i, i + span);
      if (phrase.every((word) => LATIN_AREA_STOPWORDS.has(word))) continue;
      candidates.push(phrase.join(' '));
    }
  }

  const shapes = candidates.map((candidate) => ({
    masked: latinAreaKey(candidate),
    skeleton: latinSkeleton(candidate),
  }));

  let best: { area: AssistantAreaOption; score: number } | undefined;
  for (const area of areas) {
    for (const { key, kind } of latinAreaKeys(area)) {
      const limit = key.length >= 6 ? 1 : 0;
      for (const shape of shapes) {
        const candidateKey = kind === 'masked' ? shape.masked : shape.skeleton;
        if (candidateKey.length < 4) continue;
        if (!withinDistance(candidateKey, key, limit)) continue;
        const score =
          key.length * 10 - Math.abs(candidateKey.length - key.length);
        if (!best || score > best.score) best = { area, score };
      }
    }
  }
  return best?.area;
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
  // Reviewed names first; only if none of them appear is the Latin spelling of a
  // place name matched by shape, so a governed alias always wins over a guess.
  return best?.area ?? matchAreaByShape(text, areas);
}

export interface ExtractedFacets {
  filters: AssistantFilters;
  /** Number of concrete search facets found, used to separate search from FAQ. */
  signalCount: number;
  resetContext: boolean;
  /** True when the message is a complete request rather than a refinement. */
  standaloneRequest: boolean;
  /** True when the visitor asked for the next page of the current search. */
  wantsMore: boolean;
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

  const bedrooms = extractBedrooms(text, consumed);
  if (bedrooms.min !== undefined) {
    filters.bedroomsMin = bedrooms.min;
    signalCount += 1;
  }
  if (bedrooms.max !== undefined) {
    filters.bedroomsMax = bedrooms.max;
    if (bedrooms.min === undefined) signalCount += 1;
  }

  const size = extractSize(text, consumed);
  if (size.min !== undefined) {
    filters.sizeMin = size.min;
    signalCount += 1;
  }
  if (size.max !== undefined) {
    filters.sizeMax = size.max;
    if (size.min === undefined) signalCount += 1;
  }

  const sale = SALE_PATTERN.test(text);
  const rent = RENT_PATTERN.test(text);
  if (sale !== rent) {
    filters.purpose = sale ? 'sale' : 'long_term_rent';
    signalCount += 1;
  }

  const sharedRange = extractSharedScaleRange(text, consumed);
  const amounts = extractAmounts(text, consumed, rent);
  const prices = sharedRange ?? resolvePrices(text, amounts);
  if (prices.priceMin !== undefined) {
    filters.priceMin = prices.priceMin;
    signalCount += 1;
  }
  if (prices.priceMax !== undefined) {
    filters.priceMax = prices.priceMax;
    signalCount += 1;
  }

  // Sale prices and monthly rents sit on completely different scales, so a budget
  // with no stated purpose would otherwise offer a 20,000 EGP monthly rent to
  // someone who said "a million". Below the threshold the figure can only be a
  // rent; at or above it, only a sale price. The chosen purpose is always named
  // back in the reply, so a wrong guess is visible and easy to correct.
  const statedBudget = Math.max(filters.priceMax ?? 0, filters.priceMin ?? 0);
  if (filters.purpose === undefined && statedBudget > 0) {
    filters.purpose = statedBudget >= 200_000 ? 'sale' : 'long_term_rent';
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

  // "إيه المعروض" is a request to see the catalogue, so scope wording is itself a
  // search signal; without it the message would fall through to the generic help.
  const scoped = SCOPE_RESET_PATTERN.test(text);
  if (scoped) signalCount += 1;

  const wantsMore = MORE_PATTERN.test(text) && !scoped;
  if (wantsMore) signalCount += 1;

  // A continuation opener always wins: "وفي القاهرة الجديدة؟" is a refinement even
  // though it names an area, while "عاوز شقة في القاهرة الجديدة" is a new request.
  const standaloneRequest =
    !CONTINUATION_OPENER.test(text) &&
    !wantsMore &&
    (REQUEST_VERB_PATTERN.test(text) || filters.propertyType !== undefined);

  return {
    filters,
    signalCount,
    resetContext: RESET_PATTERN.test(text) || scoped,
    standaloneRequest,
    wantsMore,
  };
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
    // The cue is looked for anywhere in the short run before the word, because
    // English inserts articles and prepositions — "not from an agent" — that an
    // anchored test would never see past.
    const before = text.slice(
      Math.max(0, agentMatch.index - 22),
      agentMatch.index,
    );
    if (NEGATION_CUE.test(before) || ownerCue) {
      return ['verified_owner', 'owner_not_verified'];
    }
    return ['declared_agent'];
  }

  if (!ownerCue) return undefined;
  return VERIFIED_PATTERN.test(text)
    ? ['verified_owner']
    : ['verified_owner', 'owner_not_verified'];
}

/**
 * Constraints people ask for that the public search contract cannot express.
 *
 * The listing card exposes purpose, type, price, size, bedrooms, area, and
 * participation. Anything else in a question — a finishing level, a floor, a
 * garage, a view — has to be reported back rather than quietly discarded, or the
 * answer describes a search that never happened.
 */
const UNSUPPORTED_PATTERNS: ReadonlyArray<[RegExp, UnsupportedConstraint]> = [
  [/(?:تشطيب|نص تشطيب|لوكس|سوبر لوكس|finishing|finished)/, 'finishing'],
  [/(?:الدور|دور ارضي|دور عالي|الطابق|ground floor|top floor|floor)/, 'floor'],
  [/(?:حمام|حمامات|حمامين|bathroom|bathrooms)/, 'bathrooms'],
  [/(?:مفروش|مفروشه|فرش|furnished|unfurnished)/, 'furnished'],
  [/(?:جراج|جراش|كراج|موقف سياره|parking|garage)/, 'parking'],
  [/(?:اسانسير|مصعد|elevator|lift)/, 'elevator'],
  [
    /(?:حديقه|جنينه|بلكونه|تراس|روف|حمام سباحه|garden|balcony|terrace|pool)/,
    'outdoor_space',
  ],
  [/(?:كمبوند|كومبوند|compound|gated)/, 'compound'],
  [
    /(?:قريب|قريبه|جنب|علي النيل|المترو|near|close to|nile view|metro|view)/,
    'nearby',
  ],
  [
    /(?:تقسيط|مقدم|كاش|تفاوض|قابل للتفاوض|استلام|installment|instalment|down payment|negotiab|cash)/,
    'payment_terms',
  ],
  [
    /(?:متوسط|المتوسط|اكبر|اصغر|احصائ|كام في المتوسط|average|median|largest|smallest|biggest)/,
    'aggregate',
  ],
];

/** Which unsupported constraints a question mentions, in a stable order. */
export function detectUnsupported(rawMessage: string): UnsupportedConstraint[] {
  const text = normalizeText(rawMessage);
  const found = new Set<UnsupportedConstraint>();
  for (const [pattern, constraint] of UNSUPPORTED_PATTERNS) {
    if (pattern.test(text)) found.add(constraint);
  }
  return [...found];
}

/** Every governed area a question names, so asking about two can be answered honestly. */
export function matchAllAreas(
  rawMessage: string,
  areas: ReadonlyArray<AssistantAreaOption>,
): AssistantAreaOption[] {
  const text = normalizeText(rawMessage);
  const matched: AssistantAreaOption[] = [];
  for (const area of areas) {
    const names = [area.nameAr, area.nameEn, ...area.aliases];
    const hit = names.some((name) =>
      areaKeys(name).some((key) => key.length >= 3 && text.includes(key)),
    );
    if (hit) matched.push(area);
  }
  return matched;
}
