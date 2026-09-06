import type { Locale } from './catalogues';

type AssistantCopy = Record<string, string>;

export const assistantCopy: Record<Locale, AssistantCopy> = {
  ar: {
    title: 'مساعد مكان',
    open: 'افتح مساعد مكان',
    close: 'اقفل المساعد',
    subtitle: 'ردود آلية عن العقارات المعروضة والموقع',
    generatedBadge: 'رد آلي',
    disclaimer:
      'الردود دي آلية وبتتولد من الإعلانات المعروضة. راجع تفاصيل الإعلان قبل أي قرار.',
    placeholder: 'اكتب سؤالك… مثلاً: شقة للإيجار في المعادي',
    send: 'ابعت',
    sending: 'بيفكر…',
    error: 'مقدرناش نجيب الرد دلوقتي. جرّب تاني.',
    rateLimited: 'بعتّ أسئلة كتير في وقت قصير. استنى شوية وجرّب تاني.',
    seeAll: 'شوف كل النتايج في البحث',
    resultsLabel: 'عقارات مقترحة',
    emptyTitle: 'اسأل عن أي حاجة',
    intro:
      'أقدر أدوّرلك على عقار بالمنطقة والميزانية وعدد الغرف، وأجاوبك عن أي سؤال عن الموقع.',
    conversation: 'محادثة المساعد',
    you: 'إنت',
    assistant: 'المساعد',
    exampleOne: 'شقة للبيع في المعادي',
    exampleTwo: 'إزاي أعرض عقاري؟',
    exampleThree: 'ليه المكان بيظهر تقريبي؟',
    noImage: 'مفيش صورة معتمدة',
    verified_owner: 'مالك متحقق منه',
    owner_not_verified: 'مالك لسه مش متحقق منه',
    declared_agent: 'وسيط معلن',
    updated: 'تأكيد التوفر',
  },
  en: {
    title: 'Makaan assistant',
    open: 'Open the Makaan assistant',
    close: 'Close the assistant',
    subtitle: 'Automated answers about listed homes and the site',
    generatedBadge: 'Automated reply',
    disclaimer:
      'These replies are automated and generated from published listings. Check the listing details before making a decision.',
    placeholder: 'Ask anything… for example: an apartment to rent in Maadi',
    send: 'Send',
    sending: 'Thinking…',
    error: 'We could not get a reply right now. Please try again.',
    rateLimited:
      'That is a lot of questions in a short time. Please wait a moment and try again.',
    seeAll: 'See all results in search',
    resultsLabel: 'Suggested homes',
    emptyTitle: 'Ask anything',
    intro:
      'I can find a home by area, budget, and bedrooms, and answer questions about how the site works.',
    conversation: 'Assistant conversation',
    you: 'You',
    assistant: 'Assistant',
    exampleOne: 'Apartments for sale in Maadi',
    exampleTwo: 'How do I list my property?',
    exampleThree: 'Why is the location approximate?',
    noImage: 'No approved image',
    verified_owner: 'Verified owner',
    owner_not_verified: 'Owner not verified',
    declared_agent: 'Declared agent',
    updated: 'Availability confirmed',
  },
};
