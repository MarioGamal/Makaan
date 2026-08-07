export const locales = ['ar', 'en'] as const;

export type Locale = (typeof locales)[number];

export const localeMeta: Record<
  Locale,
  { direction: 'rtl' | 'ltr'; label: string }
> = {
  ar: { direction: 'rtl', label: 'العربية' },
  en: { direction: 'ltr', label: 'English' },
};

const en = {
  brand: 'Makaan',
  navigation: {
    browse: 'Browse homes',
    saved: 'Saved homes',
    sell: 'List your property',
    signIn: 'Seller sign in',
    openMenu: 'Open navigation menu',
    closeMenu: 'Close navigation menu',
    language: 'Language',
    primaryNavigation: 'Primary navigation',
    mobileNavigation: 'Mobile navigation',
  },
  shell: {
    tagline: 'Cairo homes, listed with care.',
    footerDescription:
      'An owner-first marketplace for Cairo residential homes.',
    explore: 'Explore',
    forSellers: 'For sellers',
    support: 'Support',
    privacy: 'Privacy',
    terms: 'Terms',
    accessibility: 'Accessibility',
    copyright: '© {year} Makaan. All rights reserved.',
  },
  session: {
    expired: 'Your session has expired. Please sign in again.',
    unavailable: 'We could not check your session. Please try again.',
  },
  common: {
    loading: 'Loading…',
    retry: 'Try again',
    close: 'Close',
  },
  marketplace: {
    eyebrow: 'Owner-first Cairo homes',
    headline: 'Find a home you can trust in Cairo.',
    intro:
      'Browse approved residential homes for sale and long-term rent, with clear participation and privacy labels.',
    area: 'Search a Cairo area',
    search: 'Search homes',
    filters: 'Filters',
    anyPurpose: 'Any purpose',
    sale: 'For sale',
    rent: 'Long-term rent',
    propertyType: 'Property type',
    anyType: 'Any residential type',
    minPrice: 'Minimum price',
    maxPrice: 'Maximum price',
    minSize: 'Minimum size (m²)',
    maxSize: 'Maximum size (m²)',
    bedrooms: 'Bedrooms',
    bathrooms: 'Bathrooms',
    participation: 'Participation',
    anySeller: 'All participants',
    verifiedOwner: 'Verified owner',
    owner: 'Owner not verified',
    agent: 'Declared agent',
    sort: 'Sort results',
    newest: 'Newest first',
    priceAsc: 'Price: low to high',
    priceDesc: 'Price: high to low',
    removeFilter: 'Remove filter',
    reset: 'Reset filters',
    list: 'List',
    map: 'Map',
    mapDescription: 'Schematic map using approved approximate locations only.',
    pin: 'Home',
    areaOnly: 'area-only homes remain in the list',
    allPinned: 'All current homes have an approved approximate location.',
    results: 'homes found',
    loadMore: 'Next page',
    previous: 'Previous page',
    noResults: 'No homes match these filters.',
    error: 'We could not load homes right now.',
    retry: 'Try again',
    noImage: 'No approved image',
    updated: 'Availability confirmed',
    trustTitle: 'Built for clearer choices',
    trustOwner: 'Owner-first listings',
    trustPrivacy: 'Approximate locations only',
    trustReview: 'Approved before publishing',
    details: 'Property details',
    back: 'Back to homes',
    description: 'Description',
    facts: 'Home facts',
    floor: 'Floor',
    finishing: 'Finishing',
    amenities: 'Amenities',
    locationTrust: 'Location privacy',
    approximate: 'Approximate location shown',
    areaOnlyLocation: 'Area shown without a pin',
    arabicFallback: 'This description is currently available in Arabic.',
    gallery: 'Approved photos',
    unavailableImage: 'Image unavailable',
    related: 'Similar homes',
    notFound: 'This home is not available.',
    save: 'Save home',
    unsave: 'Remove from saved',
    savedConfirmation: 'Saved to your homes.',
    unsavedConfirmation: 'Removed from saved homes.',
    saveUnavailable: 'We could not update your saved homes. Please try again.',
    savedEyebrow: 'Saved homes',
    savedTitle: 'Your saved homes',
    savedLoading: 'Loading saved homes…',
    savedError: 'We could not load your saved homes.',
    savedEmptyTitle: 'No saved homes yet',
    savedEmptyDescription: 'Save homes you like and find them here later.',
    browseListings: 'Browse homes',
    whatsApp: 'WhatsApp',
    call: 'Call',
    contactUnavailable: 'Secure contact is unavailable for this home right now.',
    propertyApartment: 'Apartment',
    propertyVilla: 'Villa',
    propertyDuplex: 'Duplex',
    propertyPenthouse: 'Penthouse',
    propertyStudio: 'Studio',
    propertyTownhouse: 'Townhouse',
    propertyChalet: 'Chalet',
    finishingSemi: 'Semi-finished',
    finishingFully: 'Fully finished',
    finishingLuxury: 'Luxury finished',
  },
} as const;

type Catalogue = {
  [Section in keyof typeof en]: (typeof en)[Section] extends string
    ? string
    : { [Message in keyof (typeof en)[Section]]: string };
};

const ar: Catalogue = {
  brand: 'مكان',
  navigation: {
    browse: 'تصفح المنازل',
    saved: 'المنازل المحفوظة',
    sell: 'أضف عقارك',
    signIn: 'تسجيل دخول البائع',
    openMenu: 'فتح قائمة التنقل',
    closeMenu: 'إغلاق قائمة التنقل',
    language: 'اللغة',
    primaryNavigation: 'التنقل الرئيسي',
    mobileNavigation: 'تنقل الهاتف',
  },
  shell: {
    tagline: 'منازل القاهرة، معروضة بعناية.',
    footerDescription: 'سوق عقاري يضع المالك أولاً للمنازل السكنية في القاهرة.',
    explore: 'استكشف',
    forSellers: 'للبائعين',
    support: 'المساعدة',
    privacy: 'الخصوصية',
    terms: 'الشروط',
    accessibility: 'إتاحة الوصول',
    copyright: '© {year} مكان. جميع الحقوق محفوظة.',
  },
  session: {
    expired: 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.',
    unavailable: 'تعذر التحقق من جلستك. يرجى المحاولة مرة أخرى.',
  },
  common: {
    loading: 'جارٍ التحميل…',
    retry: 'حاول مرة أخرى',
    close: 'إغلاق',
  },
  marketplace: {
    eyebrow: 'منازل القاهرة، المالك أولاً',
    headline: 'اعثر على منزل تثق به في القاهرة.',
    intro:
      'تصفح منازل سكنية معتمدة للبيع والإيجار طويل الأجل، مع توضيح المشاركة والخصوصية.',
    area: 'ابحث في منطقة بالقاهرة',
    search: 'ابحث عن منازل',
    filters: 'التصفية',
    anyPurpose: 'كل الأغراض',
    sale: 'للبيع',
    rent: 'إيجار طويل الأجل',
    propertyType: 'نوع العقار',
    anyType: 'كل الأنواع السكنية',
    minPrice: 'الحد الأدنى للسعر',
    maxPrice: 'الحد الأقصى للسعر',
    minSize: 'الحد الأدنى للمساحة (م²)',
    maxSize: 'الحد الأقصى للمساحة (م²)',
    bedrooms: 'غرف النوم',
    bathrooms: 'الحمامات',
    participation: 'نوع المشاركة',
    anySeller: 'كل المشاركين',
    verifiedOwner: 'مالك موثق',
    owner: 'مالك غير موثق',
    agent: 'وسيط معلن',
    sort: 'ترتيب النتائج',
    newest: 'الأحدث أولاً',
    priceAsc: 'السعر: من الأقل إلى الأعلى',
    priceDesc: 'السعر: من الأعلى إلى الأقل',
    removeFilter: 'إزالة التصفية',
    reset: 'إعادة ضبط',
    list: 'قائمة',
    map: 'الخريطة',
    mapDescription: 'خريطة توضيحية تستخدم المواقع التقريبية المعتمدة فقط.',
    pin: 'منزل',
    areaOnly: 'عقارات بلا دبوس تظهر في القائمة',
    allPinned: 'كل العقارات الحالية لها موقع تقريبي معتمد.',
    results: 'عقاراً',
    loadMore: 'الصفحة التالية',
    previous: 'الصفحة السابقة',
    noResults: 'لا توجد عقارات تطابق هذه التصفية.',
    error: 'تعذر تحميل العقارات الآن.',
    retry: 'حاول مرة أخرى',
    noImage: 'لا توجد صورة معتمدة',
    updated: 'تم تأكيد التوفر',
    trustTitle: 'اختيارات أوضح',
    trustOwner: 'إعلانات تضع المالك أولاً',
    trustPrivacy: 'مواقع تقريبية فقط',
    trustReview: 'مراجعة قبل النشر',
    details: 'تفاصيل العقار',
    back: 'العودة للعقارات',
    description: 'الوصف',
    facts: 'مواصفات المنزل',
    floor: 'الطابق',
    finishing: 'التشطيب',
    amenities: 'المزايا',
    locationTrust: 'خصوصية الموقع',
    approximate: 'يظهر موقع تقريبي',
    areaOnlyLocation: 'تظهر المنطقة بدون دبوس',
    arabicFallback: 'هذا الوصف متاح بالعربية حالياً.',
    gallery: 'صور معتمدة',
    unavailableImage: 'الصورة غير متاحة',
    related: 'عقارات مشابهة',
    notFound: 'هذا العقار غير متاح.',
    save: 'احفظ العقار',
    unsave: 'إزالة من المحفوظات',
    savedConfirmation: 'تم حفظ العقار.',
    unsavedConfirmation: 'تمت إزالة العقار من المحفوظات.',
    saveUnavailable: 'تعذر تحديث العقارات المحفوظة. يرجى المحاولة مرة أخرى.',
    savedEyebrow: 'العقارات المحفوظة',
    savedTitle: 'عقاراتك المحفوظة',
    savedLoading: 'جارٍ تحميل العقارات المحفوظة…',
    savedError: 'تعذر تحميل العقارات المحفوظة.',
    savedEmptyTitle: 'لا توجد عقارات محفوظة بعد',
    savedEmptyDescription: 'احفظ العقارات التي تعجبك لتجدها هنا لاحقاً.',
    browseListings: 'تصفح العقارات',
    whatsApp: 'واتساب',
    call: 'اتصال',
    contactUnavailable: 'التواصل الآمن غير متاح لهذا العقار حالياً.',
    propertyApartment: 'شقة',
    propertyVilla: 'فيلا',
    propertyDuplex: 'دوبلكس',
    propertyPenthouse: 'بنتهاوس',
    propertyStudio: 'استوديو',
    propertyTownhouse: 'تاون هاوس',
    propertyChalet: 'شاليه',
    finishingSemi: 'نصف تشطيب',
    finishingFully: 'تشطيب كامل',
    finishingLuxury: 'تشطيب فاخر',
  },
};

export const catalogues: Record<Locale, Catalogue> = { ar, en };

const propertyTypeKeys = {
  Apartment: 'propertyApartment',
  Villa: 'propertyVilla',
  Duplex: 'propertyDuplex',
  Penthouse: 'propertyPenthouse',
  Studio: 'propertyStudio',
  Townhouse: 'propertyTownhouse',
  Chalet: 'propertyChalet',
} as const;

const finishingLevelKeys = {
  'Semi-finished': 'finishingSemi',
  'Fully finished': 'finishingFully',
  'Luxury finished': 'finishingLuxury',
} as const;

export function propertyTypeLabel(locale: Locale, value: string) {
  const key = propertyTypeKeys[value as keyof typeof propertyTypeKeys];
  return key ? catalogues[locale].marketplace[key] : value;
}

export function finishingLevelLabel(locale: Locale, value: string) {
  const key = finishingLevelKeys[value as keyof typeof finishingLevelKeys];
  return key ? catalogues[locale].marketplace[key] : value;
}
export type TranslationKey = {
  [Section in keyof Catalogue]: Catalogue[Section] extends string
    ? Section & string
    : Catalogue[Section] extends Record<string, string>
      ? `${Section & string}.${keyof Catalogue[Section] & string}`
      : never;
}[keyof Catalogue];

export function translate(
  locale: Locale,
  key: TranslationKey,
  values?: Record<string, string | number>,
) {
  const [section, message] = key.split('.') as [
    keyof Catalogue,
    string | undefined,
  ];
  const catalogueSection = catalogues[locale][section];
  const value =
    typeof catalogueSection === 'string'
      ? catalogueSection
      : (catalogueSection[message as never] as string);
  return values
    ? value.replace(/\{(\w+)\}/g, (_, name: string) =>
        String(values[name] ?? `{${name}}`),
      )
    : value;
}
