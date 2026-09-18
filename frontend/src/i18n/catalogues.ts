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
      'Browse approved residential homes for sale and rent in Cairo, with transparent seller labels and protected location privacy.',
    area: 'Search a Cairo area',
    search: 'Search homes',
    filters: 'Filters',
    purpose: 'Purpose',
    anyPurpose: 'Any purpose',
    buy: 'Buy',
    sale: 'For sale',
    rent: 'Rent',
    propertyType: 'Property type',
    anyType: 'Any residential type',
    minPrice: 'Minimum price',
    maxPrice: 'Maximum price',
    minSize: 'Minimum size (m²)',
    maxSize: 'Maximum size (m²)',
    size: 'Size',
    bedrooms: 'Bedrooms',
    minBedrooms: 'Minimum bedrooms',
    maxBedrooms: 'Maximum bedrooms',
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
    areaOnly: 'Area-only homes remain in the list',
    allPinned: 'All current homes have an approved approximate location.',
    results: 'homes found',
    loadMore: 'Load more',
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
    approximate: 'Approximate location shown to protect privacy',
    areaOnlyLocation: 'Area shown without a pin to protect privacy',
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
    showMap: 'Show map',
    closeMap: 'Close map',
    resetMap: 'Reset view',
    pinnedLocations: 'approximate locations',
    mapUnavailable: 'The interactive map is unavailable',
    mapUnavailableHint:
      'Browsing the list works exactly the same. Every pin below is an approved approximate location.',
    heroScrollHint: 'Scroll to browse',
    mapSectionEyebrow: 'Interactive map',
    mapSectionTitle: 'Explore Cairo homes on map',
    mapSectionSubtitle:
      'Discover approved residential properties across Cairo neighborhoods with transparent locations.',
    allCategories: 'All',
    expandMap: 'Full screen',
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
    browse: 'تصفح العقارات',
    buy: 'شراء',
    rent: 'إيجار',
    saved: 'العقارات المحفوظة',
    sell: 'اعرض عقارك',
    signIn: 'دخول البائع',
    openMenu: 'فتح القائمة',
    closeMenu: 'إغلاق القائمة',
    language: 'اللغة',
    primaryNavigation: 'التنقل الأساسي',
    mobileNavigation: 'قائمة الجوال',
  },
  shell: {
    tagline: 'بيوت القاهرة، معروضة بوضوح وموثوقية.',
    footerDescription:
      'منصة عقارات سكنية في القاهرة، تضع المالك في المقام الأول.',
    explore: 'استكشف',
    forSellers: 'للبائعين',
    support: 'المساعدة والدعم',
    privacy: 'سياسة الخصوصية',
    terms: 'الشروط والأحكام',
    accessibility: 'سهولة الوصول',
    copyright: '© {year} مكان. جميع الحقوق محفوظة.',
  },
  session: {
    expired: 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.',
    unavailable: 'تعذر التحقق من جلستك حالياً. يرجى المحاولة مرة أخرى.',
  },
  common: {
    loading: 'جاري التحميل…',
    retry: 'إعادة المحاولة',
    close: 'إغلاق',
    skipToContent: 'التخطي إلى المحتوى الرئيسي',
  },
  theme: {
    label: 'المظهر',
    light: 'فاتح',
    dark: 'داكن',
    system: 'حسب إعدادات الجهاز',
  },
  marketplace: {
    eyebrow: 'بيوت القاهرة من أصحابها أولاً',
    headline: 'دور على بيتك الجديد في القاهرة.',
    intro:
      'تصفّح بيوت وعقارات سكنية معتمدة للبيع والإيجار في القاهرة، مع توضيح مباشر لهوية المعلن وحماية خصوصية الموقع.',
    area: 'ابحث في منطقة بالقاهرة',
    search: 'بحث عن عقارات',
    filters: 'تصفية النتائج',
    purpose: 'الغرض',
    anyPurpose: 'أي غرض',
    buy: 'شراء',
    sale: 'للبيع',
    rent: 'إيجار',
    propertyType: 'نوع العقار',
    anyType: 'أي نوع سكني',
    minPrice: 'أقل سعر',
    maxPrice: 'أعلى سعر',
    minSize: 'أقل مساحة (م²)',
    maxSize: 'أكبر مساحة (م²)',
    size: 'المساحة',
    bedrooms: 'غرف النوم',
    minBedrooms: 'الحد الأدنى للغرف',
    maxBedrooms: 'الحد الأقصى للغرف',
    bathrooms: 'الحمامات',
    participation: 'هوية المعلن',
    anySeller: 'كل المعلنين',
    verifiedOwner: 'مالك موثّق',
    owner: 'مالك غير موثّق',
    agent: 'وسيط معلن',
    sort: 'ترتيب النتائج',
    newest: 'الأحدث أولاً',
    priceAsc: 'السعر: من الأقل للأعلى',
    priceDesc: 'السعر: من الأعلى للأقل',
    removeFilter: 'إزالة الفلتر',
    reset: 'إعادة ضبط الفلاتر',
    list: 'قائمة',
    map: 'الخريطة',
    mapDescription:
      'خريطة تعرض المواقع التقريبية المعتمدة فقط لحماية خصوصية العقار.',
    pin: 'عقار',
    areaOnly: 'العقارات المحددة بالمنطقة تظهر في القائمة أدناه',
    allPinned: 'جميع العقارات المعروضة ذات موقع تقريبي معتمد.',
    results: 'عقار متاح',
    loadMore: 'عرض المزيد',
    previous: 'الصفحة السابقة',
    noResults: 'لا توجد عقارات مطابقة لهذه المعايير.',
    error: 'تعذر تحميل العقارات حالياً.',
    retry: 'إعادة المحاولة',
    noImage: 'لا توجد صور معتمدة حالياً',
    updated: 'تم تأكيد التوفر',
    trustTitle: 'اختيارات أوضح وشفافية كاملة',
    trustOwner: 'إعلانات من الملاك أولاً',
    trustPrivacy: 'مواقع تقريبية فقط لحماية الخصوصية',
    trustReview: 'مراجعة واعتماد قبل النشر',
    details: 'تفاصيل العقار',
    back: 'العودة إلى العقارات',
    description: 'الوصف',
    facts: 'المواصفات الأساسية',
    floor: 'الدور',
    finishing: 'حالة التشطيب',
    amenities: 'المميزات والمرافق',
    locationTrust: 'خصوصية الموقع',
    approximate: 'يُعرض موقع تقريبي لحماية الخصوصية',
    areaOnlyLocation: 'محدد بالمنطقة فقط دون كشف العنوان الدقيق',
    arabicFallback: 'الوصف متوفر حالياً باللغة العربية.',
    gallery: 'الصور المعتمدة',
    unavailableImage: 'الصورة غير متاحة',
    related: 'عقارات مشابهة',
    notFound: 'هذا العقار غير متاح.',
    save: 'حفظ العقار',
    unsave: 'إزالة من المحفوظات',
    savedConfirmation: 'تم حفظ العقار في قائمتك.',
    unsavedConfirmation: 'تمت إزالة العقار من المحفوظات.',
    saveUnavailable: 'تعذر تحديث المحفوظات حالياً. يرجى المحاولة لاحقاً.',
    savedEyebrow: 'العقارات المحفوظة',
    savedTitle: 'عقاراتك المحفوظة',
    savedLoading: 'جاري تحميل العقارات المحفوظة…',
    savedError: 'تعذر تحميل عقاراتك المحفوظة.',
    savedEmptyTitle: 'لم تحفظ أي عقارات بعد',
    savedEmptyDescription:
      'احفظ العقارات التي تنال إعجابك للرجوع إليها بسهولة في أي وقت.',
    browseListings: 'تصفح العقارات',
    featured: 'عقارات مختارة',
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
    advancedSearch: 'تخصيص البحث',
    anyPrice: 'أي سعر',
    priceRange: 'نطاق السعر',
    anyBedrooms: 'أي عدد غرف',
    moreFilters: 'جميع الفلاتر',
    hideFilters: 'إخفاء الفلاتر',
    activeFilters: 'الفلاتر المطبقة',
    showingResults: 'عرض {count} من أصل {total}',
    searchThisArea: 'البحث في هذه المنطقة',
    mapMoved: 'تغير نطاق الخريطة. اضغط «البحث في هذه المنطقة» لتحديث النتائج.',
    approximateBadge: 'موقع تقريبي',
    areaOnlyBadge: 'المنطقة فقط',
    newBadge: 'جديد',
    perMonth: 'شهرياً',
    saveShort: 'حفظ',
    resultsHeading: 'عقارات مختارة لك',
    showMap: 'عرض الخريطة',
    closeMap: 'إغلاق الخريطة',
    resetMap: 'إعادة ضبط الخريطة',
    pinnedLocations: 'مواقع تقريبية معتمدة',
    mapUnavailable: 'الخريطة التفاعلية غير متاحة حالياً',
    mapUnavailableHint:
      'يمكنك متابعة التصفح من القائمة بكل سهولة؛ كل عقار معروض بموقع تقريبي معتمد.',
    heroScrollHint: 'مرر لأسفل للاستكشاف',
    mapSectionEyebrow: 'خريطة تفاعلية',
    mapSectionTitle: 'استكشف بيوت القاهرة على الخريطة',
    mapSectionSubtitle:
      'تصفح عقارات سكنية معتمدة في مختلف أحياء القاهرة مع الحفاظ التام على خصوصية الموقع الدقيق.',
    allCategories: 'الكل',
    expandMap: 'ملء الشاشة',
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
