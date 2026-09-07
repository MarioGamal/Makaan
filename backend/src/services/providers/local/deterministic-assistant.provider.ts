import type {
  AssistantFilters,
  AssistantIntent,
  AssistantRelaxation,
  UnsupportedConstraint,
} from '@makaan/shared/types/assistant';
import type { Locale } from '@makaan/shared/types/marketplace';

import type {
  AssistantComposition,
  AssistantCompositionInput,
  AssistantInterpretation,
  AssistantInterpretationInput,
  AssistantProvider,
} from '../assistant.provider';

import {
  GREETING_KEYWORDS,
  HELP_KEYWORDS,
  KNOWLEDGE_TOPICS,
  PRIVACY_BOUNDARY_KEYWORDS,
  UNSUPPORTED_AREA_HINTS,
} from './assistant-knowledge';
import {
  detectUnsupported,
  extractFacets,
  matchAllAreas,
  normalizeText,
} from './assistant-language';

/**
 * Counted forms per property type: singular, dual, 3-10 plural, and 11+ singular
 * for Arabic; singular and plural for English.
 */
const COUNTED_TYPE_NOUNS: Record<string, { ar: string[]; en: string[] }> = {
  Apartment: {
    ar: ['شقة واحدة', 'شقتين', 'شقق', 'شقة'],
    en: ['apartment', 'apartments'],
  },
  Villa: {
    ar: ['فيلا واحدة', 'فيلتين', 'فيلات', 'فيلا'],
    en: ['villa', 'villas'],
  },
  Duplex: {
    ar: ['دوبلكس واحد', 'دوبلكسين', 'وحدات دوبلكس', 'وحدة دوبلكس'],
    en: ['duplex', 'duplexes'],
  },
  Penthouse: {
    ar: ['بنتهاوس واحد', 'بنتهاوسين', 'وحدات بنتهاوس', 'وحدة بنتهاوس'],
    en: ['penthouse', 'penthouses'],
  },
  Studio: {
    ar: ['استوديو واحد', 'استوديوهين', 'استوديوهات', 'استوديو'],
    en: ['studio', 'studios'],
  },
  Townhouse: {
    ar: ['تاون هاوس واحد', 'تاون هاوسين', 'وحدات تاون هاوس', 'وحدة تاون هاوس'],
    en: ['townhouse', 'townhouses'],
  },
  Chalet: {
    ar: ['شاليه واحد', 'شاليهين', 'شاليهات', 'شاليه'],
    en: ['chalet', 'chalets'],
  },
};

const PROPERTY_TYPE_LABELS: Record<string, Record<Locale, string>> = {
  Apartment: { ar: 'شقق', en: 'apartments' },
  Villa: { ar: 'فيلات', en: 'villas' },
  Duplex: { ar: 'وحدات دوبلكس', en: 'duplexes' },
  Penthouse: { ar: 'بنتهاوس', en: 'penthouses' },
  Studio: { ar: 'ستوديوهات', en: 'studios' },
  Townhouse: { ar: 'تاون هاوس', en: 'townhouses' },
  Chalet: { ar: 'شاليهات', en: 'chalets' },
};

const normalizedKeywords = (keywords: ReadonlyArray<string>): string[] =>
  keywords.map((keyword) => normalizeText(keyword)).filter(Boolean);

const KNOWLEDGE_INDEX = KNOWLEDGE_TOPICS.map((topic) => ({
  ...topic,
  normalized: normalizedKeywords(topic.keywords),
}));
const PRIVACY_INDEX = normalizedKeywords(PRIVACY_BOUNDARY_KEYWORDS);
const GREETING_INDEX = normalizedKeywords(GREETING_KEYWORDS);
const HELP_INDEX = normalizedKeywords(HELP_KEYWORDS);
const UNSUPPORTED_AREA_INDEX = normalizedKeywords(UNSUPPORTED_AREA_HINTS);

/**
 * Scores how strongly a question matches a keyword list.
 *
 * A multi-word keyword matches when every one of its words appears somewhere in
 * the question, not only as one contiguous run: people write "ليه المكان بيظهر
 * تقريبي", and requiring an exact substring would miss the inserted verb. The
 * longest hit wins, so a specific phrase beats an incidental single word.
 */
function bestKeywordLength(
  text: string,
  keywords: ReadonlyArray<string>,
): number {
  let best = 0;
  for (const keyword of keywords) {
    if (keyword.length <= best) continue;
    const words = keyword.split(' ').filter(Boolean);
    if (words.length === 1) {
      if (text.includes(keyword)) best = keyword.length;
      continue;
    }
    // The words must appear in the keyword's own order and within a short span.
    // Requiring only that each word appears somewhere lets a long, unrelated
    // message collect them by chance and match a topic it never asked about.
    let cursor = 0;
    let start = -1;
    let matched = true;
    for (const word of words) {
      const at = text.indexOf(word, cursor);
      if (at === -1) {
        matched = false;
        break;
      }
      if (start === -1) start = at;
      cursor = at + word.length;
    }
    if (matched && cursor - start <= keyword.length + 24) {
      best = keyword.length;
    }
  }
  return best;
}

/**
 * The account-free assistant adapter.
 *
 * It understands Arabic and English property questions with explicit rules and
 * writes its answers from reviewed templates. No model is called, so local, test,
 * and CI environments run the whole feature with no key, no cost, and no request
 * leaving the machine — which is also why it stays the default for those modes.
 */
export class DeterministicAssistantProvider implements AssistantProvider {
  readonly name = 'deterministic';

  interpret(
    input: AssistantInterpretationInput,
  ): Promise<AssistantInterpretation> {
    const text = normalizeText(input.message);
    const { filters, signalCount, resetContext, standaloneRequest, wantsMore } =
      extractFacets(input.message, input.areas);

    const unsupported = detectUnsupported(input.message);
    // Naming two governed areas is a comparison, which one search cannot answer.
    if (matchAllAreas(input.message, input.areas).length > 1) {
      unsupported.push('area_comparison');
    }

    const privacyScore = bestKeywordLength(text, PRIVACY_INDEX);
    let topicId: string | undefined;
    let topicScore = 0;
    for (const topic of KNOWLEDGE_INDEX) {
      const score = bestKeywordLength(text, topic.normalized);
      if (score > topicScore) {
        topicScore = score;
        topicId = topic.id;
      }
    }

    // A question about the exact address or a seller's number is answered as a
    // boundary, never as a search, even when it also names an area. The weight
    // keeps a direct demand on the explicit refusal rather than the softer
    // "how to contact a seller" answer, which overlaps on the same words.
    if (privacyScore > 0 && privacyScore * 1.5 >= topicScore) {
      return Promise.resolve({
        intent: 'privacy_boundary' as AssistantIntent,
        filters: {},
        topics: ['approximate_location', 'contact_seller'],
        resetContext: false,
        unsupported,
        standaloneRequest,
        wantsMore,
      });
    }

    // A named place that is not a governed area must be answered as coverage, not
    // silently searched across the areas Makaan does cover. This is checked before
    // the knowledge base because a place name such as `الإسكندرية` is also a
    // coverage keyword, and the out-of-scope answer names the covered areas back.
    if (
      filters.areaId === undefined &&
      bestKeywordLength(text, UNSUPPORTED_AREA_INDEX) > 0
    ) {
      return Promise.resolve({
        intent: 'out_of_scope' as AssistantIntent,
        filters: {},
        topics: ['coverage'],
        resetContext: false,
        unsupported,
        standaloneRequest,
        wantsMore,
      });
    }

    if (topicId && topicScore > 0 && topicScore >= signalCount * 4) {
      // No search runs for an FAQ answer, so no filters are claimed either.
      return Promise.resolve({
        intent: 'faq' as AssistantIntent,
        filters: {},
        topics: [topicId],
        resetContext: false,
        unsupported,
        standaloneRequest,
        wantsMore,
      });
    }

    if (signalCount > 0) {
      return Promise.resolve({
        intent: 'search' as AssistantIntent,
        filters,
        topics: [],
        resetContext,
        unsupported,
        standaloneRequest,
        wantsMore,
      });
    }

    // An explicit request for help outranks a greeting in the same message,
    // so "أهلاً، تقدر تعمل إيه؟" answers the question rather than saying hello.
    if (
      bestKeywordLength(text, HELP_INDEX) >=
      bestKeywordLength(text, GREETING_INDEX)
    ) {
      return Promise.resolve({
        intent: 'help' as AssistantIntent,
        filters: {},
        topics: [],
        resetContext,
        unsupported,
        standaloneRequest,
        wantsMore,
      });
    }

    return Promise.resolve({
      intent: 'greeting' as AssistantIntent,
      filters: {},
      topics: [],
      resetContext: false,
      unsupported,
      standaloneRequest,
      wantsMore,
    });
  }

  compose(input: AssistantCompositionInput): Promise<AssistantComposition> {
    const { locale } = input;
    // Only a search can present results as though a constraint had been applied,
    // so only a search carries the disclosure. The other answers address the
    // subject directly and appending it there would merely repeat them.
    const note =
      input.intent === 'search'
        ? this.unsupportedNote(input.unsupported, locale)
        : '';
    switch (input.intent) {
      case 'faq':
        return Promise.resolve({
          reply: this.knowledgeAnswer(input.topics, locale),
          suggestions: this.suggestions(input),
        });
      case 'privacy_boundary':
        return Promise.resolve({
          reply:
            locale === 'ar'
              ? 'مش هقدر أدي العنوان الدقيق ولا رقم تليفون المُعلن — دي بيانات محمية ومش بتخرج من الموقع أصلاً. اللي أقدر أعمله إني أوريك العقارات المتاحة في المنطقة، وبعدها تستخدم زرار التواصل جوه الإعلان نفسه عشان توصل لصاحبه مباشرة.'
              : 'I cannot give out an exact address or a seller’s phone number — that data is protected and never leaves the platform. What I can do is show you the available homes in an area, and you then use the contact button inside the listing itself to reach the seller directly.',
          suggestions: this.suggestions(input),
        });
      case 'greeting':
        return Promise.resolve({
          reply:
            locale === 'ar'
              ? 'أهلاً بيك في مكان. أنا مساعد آلي بيدوّر لك في العقارات السكنية المعروضة في القاهرة، وبيجاوب على أسئلتك عن الموقع. قوللي إنت بتدوّر على إيه — مثلاً «شقة للإيجار في المعادي في حدود ٢٠ ألف».'
              : 'Welcome to Makaan. I am an automated assistant that searches the residential homes listed in Cairo and answers questions about how the site works. Tell me what you are looking for — for example “an apartment to rent in Maadi up to 20,000”.',
          suggestions: this.suggestions(input),
        });
      case 'out_of_scope': {
        const areas = input.areaNames
          .map((area) => (locale === 'ar' ? area.nameAr : area.nameEn))
          .join(locale === 'ar' ? '، ' : ', ');
        const prefix =
          locale === 'ar'
            ? `المنطقة اللي سألت عنها مش ضمن المناطق المتاحة دلوقتي. المتاح حالياً: ${areas}.`
            : `The area you asked about is not covered yet. Currently available: ${areas}.`;
        return Promise.resolve({
          reply: `${prefix}\n\n${this.knowledgeAnswer(['coverage'], locale)}`,
          suggestions: this.suggestions(input),
        });
      }
      case 'help':
        return Promise.resolve({
          reply:
            locale === 'ar'
              ? 'أقدر أساعدك في حاجتين. الأولى: تدوّر على عقار — اكتبلي المنطقة والغرض والميزانية وعدد الغرف وأنا أجيبلك المتاح، ولو مفيش في الميزانية دي هقولك وأقترح أقرب حاجة. والتانية: أي سؤال عن الموقع نفسه — إزاي تعرض عقارك، ليه المكان بيظهر تقريبي، إيه الفرق بين المالك والوسيط، وإزاي تتواصل مع المُعلن.'
              : 'I can help with two things. First, finding a home — tell me the area, whether you want to buy or rent, your budget, and how many bedrooms, and I will show what is available; if nothing fits that budget I will say so and suggest the closest option. Second, any question about the site itself — how to list your property, why locations appear as approximate, the difference between an owner and an agent, and how to contact a seller.',
          suggestions: this.suggestions(input),
        });
      default:
        return Promise.resolve({
          reply: this.searchAnswer(input) + note,
          suggestions: this.suggestions(input),
        });
    }
  }

  /**
   * Names the single home a superlative asked for, then offers the rest.
   *
   * Returns nothing unless the answer is actually sorted by price and sitting on
   * the first page, because only then is the top card the extreme in question.
   */
  private superlativeLead(
    input: AssistantCompositionInput,
  ): string | undefined {
    const { highlight, filters, locale, totalMatches } = input;
    if (!highlight || !filters.sort || filters.sort === 'newest') {
      return undefined;
    }
    const arabic = locale === 'ar';
    const cheapest = filters.sort === 'price_asc';
    // Named from the filter, not from the result: calling it "the cheapest studio"
    // when no type was asked for implies a narrowing that never happened.
    const type = filters.propertyType
      ? this.propertyTypeSingular(filters.propertyType, locale)
      : arabic
        ? 'عقار'
        : 'home';
    const area = arabic ? highlight.areaAr : highlight.areaEn;
    const price = this.formatPrice(highlight.priceEgp, locale);
    const rest = totalMatches - 1;

    // The area is named once, at the end, so the qualifier leaves it out.
    const qualifier = this.describeFilters(filters, locale, {
      omitType: true,
      omitArea: true,
    });
    const opener = arabic
      ? `${cheapest ? 'أرخص' : 'أغلى'} ${type} ${qualifier}`.trim()
      : `The ${cheapest ? 'cheapest' : 'most expensive'} ${type} ${qualifier}`.trim();

    // "بـ" instead of a possessive keeps the sentence right for both genders.
    const head = arabic
      ? `${opener} بـ ${price} في ${area}.`
      : `${opener} is ${price} in ${area}.`;

    if (rest <= 0) return head;
    const alongside = Math.min(rest, input.shownCount - 1);
    return arabic
      ? `${head} دي ومعاها أقرب ${this.formatNumber(alongside, locale)} ليها، من إجمالي ${this.countPhrase(totalMatches, locale, filters.propertyType)}:`
      : `${head} Here it is with the next ${alongside}, out of ${totalMatches} matches:`;
  }

  /** Singular form used when one specific home is being named. */
  private propertyTypeSingular(value: string, locale: Locale): string {
    const noun = COUNTED_TYPE_NOUNS[value];
    if (!noun) return locale === 'ar' ? 'عقار' : 'home';
    return locale === 'ar' ? (noun.ar[3] as string) : (noun.en[0] as string);
  }

  /**
   * States plainly which stated constraints were not applied.
   *
   * Public search covers purpose, type, area, price, size, bedrooms, and the
   * participation label. A question that also names a finishing level, a floor, a
   * garage, or an average cannot be answered by narrowing the search, and saying
   * nothing would present the result as though it had been.
   */
  private unsupportedNote(
    unsupported: ReadonlyArray<UnsupportedConstraint>,
    locale: Locale,
  ): string {
    if (unsupported.length === 0) return '';
    const arabic = locale === 'ar';
    const labels: Record<UnsupportedConstraint, { ar: string; en: string }> = {
      finishing: { ar: 'التشطيب', en: 'finishing level' },
      floor: { ar: 'الدور', en: 'floor' },
      bathrooms: { ar: 'عدد الحمامات', en: 'bathroom count' },
      furnished: { ar: 'الفرش', en: 'furnishing' },
      parking: { ar: 'الجراج', en: 'parking' },
      elevator: { ar: 'الأسانسير', en: 'a lift' },
      outdoor_space: { ar: 'الحديقة أو البلكونة', en: 'garden or balcony' },
      compound: { ar: 'الكمبوند', en: 'compound' },
      nearby: { ar: 'القرب من مكان معيّن', en: 'proximity to a landmark' },
      payment_terms: { ar: 'شروط الدفع', en: 'payment terms' },
      aggregate: {
        ar: 'الحسابات زي المتوسط',
        en: 'aggregates such as averages',
      },
      area_comparison: {
        ar: 'المقارنة بين منطقتين',
        en: 'comparing two areas',
      },
    };

    // Two of these are not filters at all, so they get their own wording rather
    // than being folded into a "cannot filter by" list that would read oddly.
    const sentences: string[] = [];
    if (unsupported.includes('area_comparison')) {
      sentences.push(
        arabic
          ? 'سألت عن أكتر من منطقة، وأنا بدوّر في منطقة واحدة في المرة — اسألني عن كل واحدة لوحدها.'
          : 'You named more than one area, and I search one at a time — ask about each separately.',
      );
    }
    if (unsupported.includes('aggregate')) {
      sentences.push(
        arabic
          ? 'ومقدرش أحسب متوسطات ولا أرتّب بالمساحة — أقدر أرتّب بالسعر أو بالأحدث بس.'
          : 'I also cannot compute averages or rank by size — I can only sort by price or by newest.',
      );
    }

    const filterable = unsupported.filter(
      (item) => item !== 'area_comparison' && item !== 'aggregate',
    );
    if (filterable.length > 0) {
      const named = filterable
        .map((item) => (arabic ? labels[item].ar : labels[item].en))
        .join(arabic ? ' و' : ', ');
      sentences.push(
        arabic
          ? `مقدرش أفلتر بـ${named}، فالنتايج دي مش متفلترة على الأساس ده — راجع تفاصيل كل إعلان. اللي أقدر أفلتر بيه: المنطقة، الغرض، النوع، السعر، المساحة، عدد الغرف، ونوع المُعلن.`
          : `I cannot filter by ${named}, so these results are not narrowed by it — check each listing's details. What I can filter by: area, purpose, type, price, size, bedrooms, and participation.`,
      );
    }

    const label = arabic ? ' ملاحظة: ' : ' Note: ';
    return label + sentences.join(' ');
  }

  private knowledgeAnswer(topics: ReadonlyArray<string>, locale: Locale) {
    const answers = topics
      .map((id) => KNOWLEDGE_TOPICS.find((topic) => topic.id === id))
      .filter((topic): topic is (typeof KNOWLEDGE_TOPICS)[number] =>
        Boolean(topic),
      )
      .map((topic) => topic.answer[locale]);
    if (answers.length > 0) return answers.join('\n\n');
    return locale === 'ar'
      ? 'مش متأكد إني فهمت السؤال. تحب أدوّرلك على عقار، ولا تسأل عن حاجة في الموقع؟'
      : 'I am not sure I understood that. Would you like me to search for a home, or answer a question about the site?';
  }

  private searchAnswer(input: AssistantCompositionInput): string {
    const { locale, filters, relaxations, totalMatches, priceRange } = input;
    const descriptor = this.describeFilters(filters, locale);
    const arabic = locale === 'ar';
    // Filters kept from an earlier turn are announced, never applied silently.
    const carried = input.continuedFromContext
      ? arabic
        ? 'كمّلت على بحثك السابق. '
        : 'Continuing your previous search. '
      : '';

    if (totalMatches === 0) {
      const areas = input.areaNames
        .map((area) => (arabic ? area.nameAr : area.nameEn))
        .join(arabic ? '، ' : ', ');
      return arabic
        ? `${carried}دوّرت على ${descriptor} وللأسف مفيش أي حاجة مطابقة معروضة دلوقتي، حتى بعد ما وسّعت البحث. المناطق المتاحة حالياً هي ${areas} — جرّب واحدة منها أو غيّر الميزانية وأنا أعيد البحث.`
        : `${carried}I searched for ${descriptor} and nothing matching is listed right now, even after widening the search. The areas currently covered are ${areas} — try one of those or change the budget and I will search again.`;
    }

    const counted = this.countPhrase(
      totalMatches,
      locale,
      filters.propertyType,
    );
    const found = arabic ? `لقيت ${counted}` : `I found ${counted}`;
    // The count already names the property type, so the description drops it and
    // the two read as one sentence: "لقيت ٤ شقق للبيع في المعادي".
    const qualifier = this.describeFilters(filters, locale, { omitType: true });
    // The range describes the cards actually returned, so when more matched than
    // were shown it has to say so rather than read as the range of all of them.
    const partial = totalMatches > input.shownCount;
    const low = priceRange ? this.formatPrice(priceRange.min, locale) : '';
    const high = priceRange ? this.formatPrice(priceRange.max, locale) : '';
    const range = !priceRange
      ? ''
      : priceRange.min === priceRange.max
        ? arabic
          ? ` السعر ${low}.`
          : ` The price is ${low}.`
        : partial
          ? arabic
            ? input.page > 1
              ? ` دي ${this.formatNumber(input.shownCount, locale)} تانيين (صفحة ${this.formatNumber(input.page, locale)})، أسعارهم من ${low} لـ ${high}.`
              : ` وردّيت أول ${this.formatNumber(input.shownCount, locale)}، أسعارهم من ${low} لـ ${high}.`
            : input.page > 1
              ? ` Here are ${input.shownCount} more (page ${input.page}), priced ${low} to ${high}.`
              : ` Showing the first ${input.shownCount}, priced ${low} to ${high}.`
          : arabic
            ? ` الأسعار من ${low} لـ ${high}.`
            : ` Prices range from ${low} to ${high}.`;

    // A superlative names the home it found. "I found 10,000 apartments" does not
    // answer "which is the most expensive", and it reads worse as data grows.
    const lead = this.superlativeLead(input);
    if (lead && relaxations.length === 0) return `${carried}${lead}`;

    if (relaxations.length === 0) {
      const tail = qualifier ? ` ${qualifier}` : '';
      return `${carried}${found}${tail}.${range}`;
    }

    const explanation = this.explainRelaxations(relaxations, filters, locale);
    return arabic
      ? `${carried}${explanation} ${found} كده.${range}`
      : `${carried}${explanation} That gives ${counted}.${range}`;
  }

  /** States plainly which constraint was loosened, so a widened result is never silent. */
  private explainRelaxations(
    relaxations: ReadonlyArray<AssistantRelaxation>,
    filters: AssistantFilters,
    locale: Locale,
  ): string {
    const arabic = locale === 'ar';
    const where = filters.areaNameAr
      ? arabic
        ? ` في ${filters.areaNameAr}`
        : ` in ${filters.areaNameEn ?? ''}`
      : '';
    const sentences: string[] = [];

    for (const relaxation of relaxations) {
      switch (relaxation.kind) {
        case 'price_ceiling_raised':
          sentences.push(
            arabic
              ? `مفيش حاجة${where} في حدود ${this.formatPrice(relaxation.from, locale)}، فرفعت الميزانية لـ ${this.formatPrice(relaxation.to, locale)}.`
              : `Nothing${where} fits ${this.formatPrice(relaxation.from, locale)}, so I raised the budget to ${this.formatPrice(relaxation.to, locale)}.`,
          );
          break;
        case 'price_ceiling_dropped':
          sentences.push(
            arabic
              ? `مفيش أي حاجة${where} في حدود ${this.formatPrice(relaxation.from, locale)}، فشلت حد السعر عشان أوريك المتاح فعلاً.`
              : `Nothing${where} is available at ${this.formatPrice(relaxation.from, locale)}, so I removed the price limit to show what is actually listed.`,
          );
          break;
        case 'bedrooms_lowered':
          sentences.push(
            arabic
              ? `نزّلت عدد الغرف من ${this.formatNumber(relaxation.from, locale)} لـ ${this.formatNumber(relaxation.to, locale)} عشان ألاقي نتايج.`
              : `I lowered the bedroom count from ${relaxation.from} to ${relaxation.to} to find results.`,
          );
          break;
        case 'price_floor_dropped':
          sentences.push(
            arabic
              ? `مفيش حاجة${where} فوق ${this.formatPrice(relaxation.from, locale)}، فشلت الحد الأدنى للسعر.`
              : `Nothing${where} is above ${this.formatPrice(relaxation.from, locale)}, so I dropped the minimum price.`,
          );
          break;
        case 'bedrooms_ceiling_dropped':
          sentences.push(
            arabic
              ? `مفيش حاجة${where} بـ ${this.formatNumber(relaxation.from, locale)} غرف بالظبط، فوسّعت لعدد أكبر كمان.`
              : `Nothing${where} has exactly ${relaxation.from} bedrooms, so I also allowed larger homes.`,
          );
          break;
        case 'bedrooms_dropped':
          sentences.push(
            arabic
              ? `مفيش حاجة${where} بـ ${this.formatNumber(relaxation.from, locale)} غرف أو أكتر، فشلت شرط عدد الغرف.`
              : `Nothing${where} has ${relaxation.from} or more bedrooms, so I dropped the bedroom requirement.`,
          );
          break;
        case 'property_type_dropped':
          sentences.push(
            arabic
              ? `مفيش ${this.propertyTypeLabel(relaxation.from, locale)} متاحة، فوسّعت البحث لكل الأنواع.`
              : `No ${this.propertyTypeLabel(relaxation.from, locale)} are available, so I widened the search to all types.`,
          );
          break;
        case 'participation_dropped':
          sentences.push(
            arabic
              ? 'وسّعت البحث ليشمل كل المُعلنين مش الملاك بس.'
              : 'I widened the search to all participants rather than owners only.',
          );
          break;
        case 'size_dropped':
          sentences.push(
            arabic
              ? 'شلت شرط المساحة عشان ألاقي نتايج.'
              : 'I dropped the size requirement to find results.',
          );
          break;
        case 'area_dropped':
          sentences.push(
            arabic
              ? `مفيش حاجة مطابقة في ${relaxation.from}، فدوّرت في كل المناطق المتاحة.`
              : `Nothing matches in ${relaxation.from}, so I searched every covered area.`,
          );
          break;
      }
    }

    return sentences.join(' ');
  }

  private describeFilters(
    filters: AssistantFilters,
    locale: Locale,
    options: { omitType?: boolean; omitArea?: boolean } = {},
  ): string {
    const arabic = locale === 'ar';
    const parts: string[] = [];

    if (!options.omitType) {
      parts.push(
        filters.propertyType
          ? this.propertyTypeLabel(filters.propertyType, locale)
          : arabic
            ? 'عقارات'
            : 'homes',
      );
    }

    if (filters.purpose) {
      parts.push(
        filters.purpose === 'sale'
          ? arabic
            ? 'للبيع'
            : 'for sale'
          : arabic
            ? 'للإيجار طويل الأجل'
            : 'for long-term rent',
      );
    }

    const areaName = arabic ? filters.areaNameAr : filters.areaNameEn;
    if (areaName && !options.omitArea) {
      parts.push(arabic ? `في ${areaName}` : `in ${areaName}`);
    }

    const { bedroomsMin: bedsMin, bedroomsMax: bedsMax } = filters;
    if (bedsMin !== undefined && bedsMin === bedsMax) {
      parts.push(
        arabic
          ? `${this.formatNumber(bedsMin, locale)} غرف بالظبط`
          : `exactly ${bedsMin} bedrooms`,
      );
    } else if (bedsMin !== undefined && bedsMax !== undefined) {
      parts.push(
        arabic
          ? `من ${this.formatNumber(bedsMin, locale)} لـ ${this.formatNumber(bedsMax, locale)} غرف`
          : `${bedsMin} to ${bedsMax} bedrooms`,
      );
    } else if (bedsMin !== undefined) {
      parts.push(
        arabic
          ? `${this.formatNumber(bedsMin, locale)} غرف فأكتر`
          : `${bedsMin}+ bedrooms`,
      );
    } else if (bedsMax !== undefined) {
      parts.push(
        arabic
          ? `${this.formatNumber(bedsMax, locale)} غرف على الأكتر`
          : `up to ${bedsMax} bedrooms`,
      );
    }
    if (filters.sizeMin !== undefined) {
      parts.push(
        arabic
          ? `مساحة ${this.formatNumber(filters.sizeMin, locale)} متر فأكتر`
          : `${filters.sizeMin} m² or larger`,
      );
    }

    if (filters.priceMin !== undefined && filters.priceMax !== undefined) {
      parts.push(
        arabic
          ? `بسعر من ${this.formatPrice(filters.priceMin, locale)} لـ ${this.formatPrice(filters.priceMax, locale)}`
          : `priced between ${this.formatPrice(filters.priceMin, locale)} and ${this.formatPrice(filters.priceMax, locale)}`,
      );
    } else if (filters.priceMax !== undefined) {
      parts.push(
        arabic
          ? `في حدود ${this.formatPrice(filters.priceMax, locale)}`
          : `up to ${this.formatPrice(filters.priceMax, locale)}`,
      );
    } else if (filters.priceMin !== undefined) {
      parts.push(
        arabic
          ? `بسعر من ${this.formatPrice(filters.priceMin, locale)}`
          : `from ${this.formatPrice(filters.priceMin, locale)}`,
      );
    }

    if (filters.participation?.length) {
      const ownersOnly = !filters.participation.includes('declared_agent');
      parts.push(
        ownersOnly
          ? arabic
            ? 'من الملاك بس'
            : 'from owners only'
          : arabic
            ? 'من وسطاء معلنين'
            : 'from declared agents',
      );
    }

    return parts.join(' ');
  }

  private propertyTypeLabel(value: string, locale: Locale): string {
    return PROPERTY_TYPE_LABELS[value]?.[locale] ?? value;
  }

  /**
   * Counts using the property type that was actually filtered on.
   *
   * "15 homes — apartments" reads as a count of every property, which invites the
   * reader to compare it against a villa the search deliberately excluded. Naming
   * the type in the count itself removes that ambiguity.
   */
  private countPhrase(
    count: number,
    locale: Locale,
    propertyType?: string,
  ): string {
    const noun = propertyType
      ? COUNTED_TYPE_NOUNS[propertyType]
      : {
          ar: ['عقار واحد', 'عقارين', 'عقارات', 'عقار'],
          en: ['home', 'homes'],
        };
    if (!noun) return this.countPhrase(count, locale);

    if (locale === 'en') {
      return `${count} ${count === 1 ? noun.en[0] : noun.en[1]}`;
    }
    if (count === 1) return noun.ar[0] as string;
    if (count === 2) return noun.ar[1] as string;
    const digits = this.formatNumber(count, locale);
    // Arabic counts 3–10 with a plural noun and 11 or more with a singular one.
    return count <= 10 ? `${digits} ${noun.ar[2]}` : `${digits} ${noun.ar[3]}`;
  }

  /**
   * Renders digits in the same numeral system the interface uses for the locale.
   * Two decimals keep a raised ceiling distinguishable from the price it found:
   * at one decimal, a 1,450,000 result and a 1,500,000 budget both read as 1.5M.
   */
  private formatNumber(value: number, locale: Locale): string {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
      maximumFractionDigits: 2,
    }).format(value);
  }

  private formatPrice(value: number, locale: Locale): string {
    const scaled = (divisor: number, arabicUnit: string, dual: string) => {
      const amount = value / divisor;
      if (locale !== 'ar') return undefined;
      // Arabic states one and two of a unit as words, not as a digit plus unit.
      if (amount === 1) return `${arabicUnit} جنيه`;
      if (amount === 2) return `${dual} جنيه`;
      return `${this.formatNumber(amount, locale)} ${arabicUnit} جنيه`;
    };

    if (value >= 1_000_000) {
      return (
        scaled(1_000_000, 'مليون', 'مليونين') ??
        `${this.formatNumber(value / 1_000_000, locale)}M EGP`
      );
    }
    if (value >= 1_000) {
      return (
        scaled(1_000, 'ألف', 'ألفين') ??
        `${this.formatNumber(value / 1_000, locale)}K EGP`
      );
    }
    return locale === 'ar'
      ? `${this.formatNumber(value, locale)} جنيه`
      : `${this.formatNumber(value, locale)} EGP`;
  }

  private suggestions(input: AssistantCompositionInput): string[] {
    const { locale, filters, intent } = input;
    const arabic = locale === 'ar';
    const suggestions: string[] = [];

    if (intent === 'search') {
      if (filters.sort !== 'price_asc') {
        // Worded without a verb on purpose: a quick reply is a refinement of the
        // current search, and "show me" would read as a fresh request.
        suggestions.push(arabic ? 'الأرخص الأول' : 'Cheapest first');
      }
      if (!filters.participation) {
        suggestions.push(arabic ? 'من الملاك بس' : 'From owners only');
      }
      const other = input.areaNames.find(
        (area) => area.nameAr !== filters.areaNameAr,
      );
      if (other) {
        suggestions.push(
          arabic
            ? `نفس البحث في ${other.nameAr}`
            : `Same search in ${other.nameEn}`,
        );
      }
    } else {
      suggestions.push(
        arabic ? 'شقق للإيجار في المعادي' : 'Apartments to rent in Maadi',
        arabic ? 'إزاي أعرض عقاري؟' : 'How do I list my property?',
        arabic
          ? 'ليه المكان بيظهر تقريبي؟'
          : 'Why is the location approximate?',
      );
    }

    return suggestions.slice(0, 3);
  }
}
