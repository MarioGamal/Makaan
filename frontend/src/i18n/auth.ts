import type { Locale } from './catalogues';

export const authCopy: Record<
  Locale,
  {
    seller: Record<string, string>;
    admin: Record<string, string>;
  }
> = {
  ar: {
    seller: {
      eyebrow: 'لأصحاب العقارات',
      title: 'سجّل دخولك في مكان',
      description: 'استخدم رقم موبايل مصري لإدارة إعلاناتك بأمان.',
      phone: 'رقم الموبايل',
      phoneHint: 'اكتب الرقم من غير +20',
      phonePlaceholder: '١٠xxxxxxxx',
      send: 'ابعت كود التحقق',
      sending: 'بنبعت الكود…',
      code: 'كود التحقق',
      codeHint: 'اكتب الكود المكوّن من 6 أرقام اللي اتبعت لـ',
      verify: 'أكّد الكود',
      verifying: 'بنتأكد من الكود…',
      changePhone: 'غيّر الرقم',
      resendIn: 'تقدر تبعته تاني بعد {seconds} ثانية',
      resendReady: 'تقدر تبعت الكود تاني دلوقتي',
      resend: 'ابعت الكود تاني',
      resending: 'بنبعت الكود تاني…',
      validPhone: 'اكتب رقم موبايل مصري صحيح.',
      validCode: 'اكتب كود التحقق المكوّن من 6 أرقام.',
      requestFailed: 'مش قدرنا نبعت كود التحقق. جرّب تاني.',
      verificationFailed: 'الكود مش صحيح. راجعه وجرّب تاني.',
      sessionExpired: 'جلستك خلصت. سجّل دخول تاني.',
      codeDigit: 'الرقم {number} من كود التحقق.',
      accessTitle: 'عايز تعرض عقارك؟',
      accessDescription:
        'سجّل دخولك لو عندك حساب، أو اعمل حساب بائع جديد في دقائق.',
      signInAction: 'تسجيل الدخول',
      registerAction: 'اعمل حساب بائع',
      registerEyebrow: 'ابدأ كمالك أو وسيط معلن',
      registerTitle: 'اعرض عقارك بشكل أوضح',
      registerDescription:
        'هتبدأ برقم موبايلك المصري، وبعدها تقدر تضيف إعلانك وتتابع مراجعته.',
      registerSend: 'ابدأ التسجيل',
      onboardingBack: 'رجوع',
      onboardingNext: 'التالي',
      onboardingStart: 'ابدأ التسجيل',
      onboardingSkip: 'تخطي',
      onboardingOneTitle: 'وصل للمهتمين بوضوح',
      onboardingOneDescription:
        'اعرض التفاصيل والصور والسعر بطريقة تساعد الناس تاخد قرارها.',
      onboardingTwoTitle: 'إعلانك بيتراجع قبل النشر',
      onboardingTwoDescription:
        'بنراجع البيانات والصور عشان السوق يفضل أوضح وأكثر أماناً.',
      onboardingThreeTitle: 'إنت المتحكم في مكان عقارك',
      onboardingThreeDescription:
        'الموقع الدقيق بيبقى خاص، وإنت بتختار اللي يظهر للناس.',
    },
    admin: {
      eyebrow: 'إدارة مكان',
      title: 'دخول فريق المراجعة',
      description: 'استخدم بيانات المشرف وكود تطبيق المصادقة.',
      username: 'اسم المستخدم أو البريد الإلكتروني',
      password: 'كلمة المرور',
      twoFactor: 'رمز المصادقة الثنائية',
      signIn: 'تسجيل الدخول',
      signingIn: 'بنسجّل الدخول…',
      validUsername: 'اكتب اسم المستخدم أو البريد الإلكتروني.',
      validPassword: 'اكتب كلمة المرور.',
      validTwoFactor: 'اكتب كود المصادقة المكوّن من 6 أرقام.',
      invalidCredentials: 'اسم المستخدم أو كلمة المرور مش صحيحين.',
      invalidTwoFactor: 'كود تطبيق المصادقة مش صحيح أو انتهت صلاحيته.',
      sessionExpired: 'جلسة الإدارة خلصت. سجّل دخول تاني.',
    },
  },
  en: {
    seller: {
      eyebrow: 'For sellers',
      title: 'Sign in to Makaan',
      description:
        'Use an Egyptian mobile number to manage your listings securely.',
      phone: 'Mobile number',
      phoneHint: 'Enter the number without +20',
      phonePlaceholder: '10xxxxxxxx',
      send: 'Send verification code',
      sending: 'Sending code…',
      code: 'Verification code',
      codeHint: 'Enter the 6-digit code sent to',
      verify: 'Verify code',
      verifying: 'Verifying…',
      changePhone: 'Change number',
      resendIn: 'Resend in {seconds}s',
      resendReady: 'You can resend your code now',
      resend: 'Resend code',
      resending: 'Resending code…',
      validPhone: 'Enter a valid Egyptian mobile number.',
      validCode: 'Enter the 6-digit verification code.',
      requestFailed: 'We could not send a verification code. Please try again.',
      verificationFailed:
        'We could not verify that code. Check it and try again.',
      sessionExpired: 'Your session has expired. Please sign in again.',
      codeDigit: 'Digit {number} of verification code.',
      accessTitle: 'Want to list your property?',
      accessDescription:
        'Sign in if you already have a seller account, or create one in minutes.',
      signInAction: 'Sign in',
      registerAction: 'Create seller account',
      registerEyebrow: 'Start as an owner or declared agent',
      registerTitle: 'List your property with more clarity',
      registerDescription:
        'Start with your Egyptian mobile number, then add a listing and follow its review.',
      registerSend: 'Start registration',
      onboardingBack: 'Back',
      onboardingNext: 'Next',
      onboardingStart: 'Start registration',
      onboardingSkip: 'Skip',
      onboardingOneTitle: 'Reach serious home seekers clearly',
      onboardingOneDescription:
        'Present the details, photos, and price in a way that helps people decide.',
      onboardingTwoTitle: 'Each listing is reviewed before it goes live',
      onboardingTwoDescription:
        'We review details and photos to keep the marketplace clearer and safer.',
      onboardingThreeTitle: 'You control location privacy',
      onboardingThreeDescription:
        'Your exact location stays private, and you choose what buyers can see.',
    },
    admin: {
      eyebrow: 'Makaan administration',
      title: 'Moderation team sign in',
      description: 'Use your administrator credentials and authenticator code.',
      username: 'Username or email',
      password: 'Password',
      twoFactor: 'Two-factor code',
      signIn: 'Sign in',
      signingIn: 'Signing in…',
      validUsername: 'Enter your username or email.',
      validPassword: 'Enter your password.',
      validTwoFactor: 'Enter the 6-digit authenticator code.',
      invalidCredentials: 'The username or password is incorrect.',
      invalidTwoFactor: 'The authenticator code is invalid or expired.',
      sessionExpired:
        'Your administrator session has expired. Please sign in again.',
    },
  },
};

export function authMessage(
  template: string,
  values: Record<string, string | number>,
) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(values[key] ?? `{${key}}`),
  );
}
