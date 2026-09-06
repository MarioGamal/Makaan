import type {
  AssistantFilters,
  AssistantIntent,
  AssistantRelaxation,
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
import { extractFacets, normalizeText } from './assistant-language';

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
    const matched =
      words.length === 1
        ? text.includes(keyword)
        : words.every((word) => text.includes(word));
    if (matched) best = keyword.length;
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
    const { filters, signalCount, resetContext } = extractFacets(
      input.message,
      input.areas,
    );

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
      });
    }

    if (topicId && topicScore > 0 && topicScore >= signalCount * 4) {
      // No search runs for an FAQ answer, so no filters are claimed either.
      return Promise.resolve({
        intent: 'faq' as AssistantIntent,
        filters: {},
        topics: [topicId],
        resetContext: false,
      });
    }

    // A named place that is not a governed area must be answered as coverage,
    // not silently searched across the areas Makaan does cover.
    if (
      filters.areaId === undefined &&
      bestKeywordLength(text, UNSUPPORTED_AREA_INDEX) > 0
    ) {
      return Promise.resolve({
        intent: 'out_of_scope' as AssistantIntent,
        filters: {},
        topics: ['coverage'],
        resetContext: false,
      });
    }

    if (signalCount > 0) {
      return Promise.resolve({
        intent: 'search' as AssistantIntent,
        filters,
        topics: [],
        resetContext,
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
      });
    }

    return Promise.resolve({
      intent: 'greeting' as AssistantIntent,
      filters: {},
      topics: [],
      resetContext: false,
    });
  }

  compose(input: AssistantCompositionInput): Promise<AssistantComposition> {
    const { locale } = input;
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
          reply: this.searchAnswer(input),
          suggestions: this.suggestions(input),
        });
    }
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

    if (totalMatches === 0) {
      const areas = input.areaNames
        .map((area) => (arabic ? area.nameAr : area.nameEn))
        .join(arabic ? '، ' : ', ');
      return arabic
        ? `دوّرت على ${descriptor} وللأسف مفيش أي حاجة مطابقة معروضة دلوقتي، حتى بعد ما وسّعت البحث. المناطق المتاحة حالياً هي ${areas} — جرّب واحدة منها أو غيّر الميزانية وأنا أعيد البحث.`
        : `I searched for ${descriptor} and nothing matching is listed right now, even after widening the search. The areas currently covered are ${areas} — try one of those or change the budget and I will search again.`;
    }

    const found = arabic
      ? `لقيت ${this.countPhrase(totalMatches, locale)}`
      : `I found ${this.countPhrase(totalMatches, locale)}`;
    const range =
      priceRange && priceRange.min !== priceRange.max
        ? arabic
          ? ` الأسعار من ${this.formatPrice(priceRange.min, locale)} لـ ${this.formatPrice(priceRange.max, locale)}.`
          : ` Prices range from ${this.formatPrice(priceRange.min, locale)} to ${this.formatPrice(priceRange.max, locale)}.`
        : priceRange
          ? arabic
            ? ` السعر ${this.formatPrice(priceRange.min, locale)}.`
            : ` The price is ${this.formatPrice(priceRange.min, locale)}.`
          : '';

    if (relaxations.length === 0) {
      // A dash instead of an adjective avoids Arabic number-gender agreement,
      // which would otherwise need a different word for one, two, and many.
      return arabic
        ? `${found} — ${descriptor}.${range}`
        : `${found} matching ${descriptor}.${range}`;
    }

    const explanation = this.explainRelaxations(relaxations, filters, locale);
    return arabic
      ? `${explanation} ${found} كده.${range}`
      : `${explanation} That gives ${this.countPhrase(totalMatches, locale)}.${range}`;
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

  private describeFilters(filters: AssistantFilters, locale: Locale): string {
    const arabic = locale === 'ar';
    const parts: string[] = [];

    parts.push(
      filters.propertyType
        ? this.propertyTypeLabel(filters.propertyType, locale)
        : arabic
          ? 'عقارات'
          : 'homes',
    );

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
    if (areaName) parts.push(arabic ? `في ${areaName}` : `in ${areaName}`);

    if (filters.bedroomsMin !== undefined) {
      parts.push(
        arabic
          ? `${this.formatNumber(filters.bedroomsMin, locale)} غرف فأكتر`
          : `${filters.bedroomsMin}+ bedrooms`,
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

  private countPhrase(count: number, locale: Locale): string {
    if (locale === 'en') return count === 1 ? '1 home' : `${count} homes`;
    if (count === 1) return 'عقار واحد';
    if (count === 2) return 'عقارين';
    const digits = this.formatNumber(count, locale);
    // Arabic counts 3–10 with a plural noun and 11 or more with a singular one.
    return count <= 10 ? `${digits} عقارات` : `${digits} عقار`;
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
        suggestions.push(arabic ? 'ورّيني الأرخص' : 'Show the cheapest');
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
