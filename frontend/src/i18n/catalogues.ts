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
    buy: 'Buy',
    rent: 'Rent',
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
    skipToContent: 'Skip to main content',
  },
  theme: {
    label: 'Appearance',
    light: 'Light',
    dark: 'Dark',
    system: 'Match my device',
  },
  marketplace: {
    eyebrow: 'Owner-first Cairo homes',
    headline: 'Find the Cairo home that feels right for you.',
    intro:
      'Browse approved residential homes for sale and long-term rent, with clear participation and privacy labels.',
    area: 'Search a Cairo area',
    search: 'Search homes',
    filters: 'Filters',
    purpose: 'Purpose',
    anyPurpose: 'Any purpose',
    sale: 'For sale',
    rent: 'Long-term rent',
    propertyType: 'Property type',
    anyType: 'Any residential type',
    minPrice: 'Minimum price',
    maxPrice: 'Maximum price',
    minSize: 'Minimum size (m²)',
    maxSize: 'Maximum size (m²)',
    size: 'Size',
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
    featured: 'Featured homes',
    whatsApp: 'WhatsApp',
    call: 'Call',
    contactUnavailable:
      'Secure contact is unavailable for this home right now.',
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
    advancedSearch: 'Refine your search',
    anyPrice: 'Any price',
    priceRange: 'Price range',
    anyBedrooms: 'Any bedrooms',
    minBedrooms: 'Bedrooms from',
    maxBedrooms: 'Bedrooms up to',
    moreFilters: 'All filters',
    hideFilters: 'Hide filters',
    activeFilters: 'Active filters',
    showingResults: 'Showing {count} of {total}',
    searchThisArea: 'Search this area',
    mapMoved: 'The map moved. Search this area to update the results.',
    approximateBadge: 'Approximate pin',
    areaOnlyBadge: 'Area only',
    newBadge: 'New',
    perMonth: 'per month',
    saveShort: 'Save',
    resultsHeading: 'Homes for you',
    mapUnavailable: 'The interactive map is unavailable',
    mapUnavailableHint:
      'Browsing the list works exactly the same. Every pin below is an approved approximate location.',
    heroScrollHint: 'Scroll to browse',
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
    browse: 'دور على عقار',
    buy: 'شراء',
    rent: 'إيجار',
    saved: 'عقاراتك المحفوظة',
    sell: 'اعرض عقارك',
    signIn: 'دخول البائع',
    openMenu: 'افتح القائمة',
    closeMenu: 'اقفل القائمة',
    language: 'اللغة',
    primaryNavigation: 'التنقل الأساسي',
    mobileNavigation: 'قائمة الموبايل',
  },
  shell: {
    tagline: 'بيوت القاهرة، معروضة بشكل أوضح.',
    footerDescription: 'منصة عقارات بتحط المالك في الأول لبيوت القاهرة.',
    explore: 'دور',
    forSellers: 'للبائعين',
    support: 'المساعدة',
    privacy: 'الخصوصية',
    terms: 'الشروط',
    accessibility: 'سهولة الاستخدام',
    copyright: '© {year} مكان. جميع الحقوق محفوظة.',
  },
  session: {
    expired: 'جلستك خلصت. سجّل دخول تاني.',
    unavailable: 'مش قادرين نتأكد من جلستك دلوقتي. جرّب تاني.',
  },
  common: {
    loading: 'بنحمّل…',
    retry: 'جرّب تاني',
    close: 'اقفل',
    skipToContent: 'روح للمحتوى',
  },
  theme: {
    label: 'المظهر',
    light: 'فاتح',
    dark: 'غامق',
    system: 'زي جهازي',
  },
  marketplace: {
    eyebrow: 'بيوت القاهرة من أصحابها أولاً',
    headline: 'دور على بيتك الجديد في القاهرة.',
    intro:
      'اتفرّج على عقارات سكنية متراجعة للبيع والإيجار طويل الأجل، واعرف إذا الإعلان من مالك أو وسيط مع الحفاظ على خصوصية المكان.',
    area: 'دور في منطقة في القاهرة',
    search: 'دور على عقارات',
    filters: 'فلتر النتائج',
    purpose: 'الغرض',
    anyPurpose: 'أي غرض',
    sale: 'للبيع',
    rent: 'إيجار طويل الأجل',
    propertyType: 'نوع العقار',
    anyType: 'أي نوع سكني',
    minPrice: 'أقل سعر',
    maxPrice: 'أعلى سعر',
    minSize: 'أقل مساحة (م²)',
    maxSize: 'أكبر مساحة (م²)',
    size: 'المساحة',
    bedrooms: 'غرف النوم',
    bathrooms: 'الحمامات',
    participation: 'صاحب الإعلان',
    anySeller: 'كل المعلنين',
    verifiedOwner: 'مالك متحقق منه',
    owner: 'مالك لسه مش متحقق منه',
    agent: 'وسيط معلن',
    sort: 'رتّب النتائج',
    newest: 'الأحدث الأول',
    priceAsc: 'السعر: من الأقل للأعلى',
    priceDesc: 'السعر: من الأعلى للأقل',
    removeFilter: 'شيل الفلتر',
    reset: 'امسح الفلاتر',
    list: 'ليستة',
    map: 'الخريطة',
    mapDescription: 'الخريطة دي بتعرض المواقع التقريبية اللي اتراجعت بس.',
    pin: 'عقار',
    areaOnly: 'العقارات اللي من غير دبوس هتلاقيها في الليستة',
    allPinned: 'كل العقارات المعروضة ليها مكان تقريبي متراجع.',
    results: 'عقار متاح',
    loadMore: 'هات كمان',
    previous: 'الصفحة اللي فاتت',
    noResults: 'مفيش عقارات مناسبة للفلاتر دي.',
    error: 'مش قادرين نحمّل العقارات دلوقتي.',
    retry: 'جرّب تاني',
    noImage: 'مفيش صورة اتراجعت',
    updated: 'التوفر اتأكد',
    trustTitle: 'اختار وأنت عارف كل حاجة',
    trustOwner: 'إعلانات من أصحابها أولاً',
    trustPrivacy: 'مواقع تقريبية فقط',
    trustReview: 'مراجعة قبل ما الإعلان يظهر',
    details: 'تفاصيل العقار',
    back: 'ارجع للعقارات',
    description: 'الوصف',
    facts: 'تفاصيل البيت',
    floor: 'الدور',
    finishing: 'التشطيب',
    amenities: 'مميزات',
    locationTrust: 'خصوصية المكان',
    approximate: 'مبينين مكان تقريبي',
    areaOnlyLocation: 'مبينين المنطقة من غير دبوس',
    arabicFallback: 'الوصف ده متاح بالعربي دلوقتي.',
    gallery: 'صور اتراجعت',
    unavailableImage: 'الصورة مش متاحة',
    related: 'عقارات شبهه',
    notFound: 'العقار ده مش متاح.',
    save: 'احفظه',
    unsave: 'شيله من المحفوظات',
    savedConfirmation: 'اتحفظ العقار عندك.',
    unsavedConfirmation: 'اتشال العقار من المحفوظات.',
    saveUnavailable: 'مش قادرين نحدّث المحفوظات دلوقتي. جرّب تاني.',
    savedEyebrow: 'العقارات المحفوظة',
    savedTitle: 'عقاراتك المحفوظة',
    savedLoading: 'بنحمّل عقاراتك المحفوظة…',
    savedError: 'مش قادرين نحمّل عقاراتك المحفوظة.',
    savedEmptyTitle: 'لسه ما حفظتش عقارات',
    savedEmptyDescription: 'احفظ العقارات اللي عجبتك علشان ترجع لها هنا بعدين.',
    browseListings: 'دور على عقارات',
    featured: 'عقارات مختارة',
    whatsApp: 'واتساب',
    call: 'اتصل',
    contactUnavailable: 'التواصل الآمن مش متاح للعقار ده دلوقتي.',
    propertyApartment: 'شقة',
    propertyVilla: 'فيلا',
    propertyDuplex: 'دوبلكس',
    propertyPenthouse: 'بنتهاوس',
    propertyStudio: 'استوديو',
    propertyTownhouse: 'تاون هاوس',
    propertyChalet: 'شاليه',
    finishingSemi: 'نص تشطيب',
    finishingFully: 'تشطيب كامل',
    finishingLuxury: 'تشطيب لوكس',
    advancedSearch: 'ظبط بحثك',
    anyPrice: 'أي سعر',
    priceRange: 'حدود السعر',
    anyBedrooms: 'أي عدد غرف',
    minBedrooms: 'الغرف من',
    maxBedrooms: 'الغرف لحد',
    moreFilters: 'كل الفلاتر',
    hideFilters: 'اخفي الفلاتر',
    activeFilters: 'الفلاتر الشغالة',
    showingResults: 'مبينين {count} من {total}',
    searchThisArea: 'دور في المنطقة دي',
    mapMoved: 'الخريطة اتحركت. دوس «دور في المنطقة دي» علشان تحدّث النتايج.',
    approximateBadge: 'مكان تقريبي',
    areaOnlyBadge: 'المنطقة بس',
    newBadge: 'جديد',
    perMonth: 'في الشهر',
    saveShort: 'احفظ',
    resultsHeading: 'عقارات ليك',
    mapUnavailable: 'الخريطة التفاعلية غير متاحة',
    mapUnavailableHint:
      'تقدر تكمّل من الليستة عادي. كل دبوس تحت ده مكان تقريبي متراجع.',
    heroScrollHint: 'انزل تحت تتفرج',
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
