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
      eyebrow: 'للبائعين',
      title: 'سجّل دخولك إلى مكان',
      description: 'استخدم رقم موبايل مصري لإدارة إعلاناتك بأمان.',
      phone: 'رقم الموبايل',
      phoneHint: 'أدخل الرقم من دون +20',
      phonePlaceholder: '10xxxxxxxx',
      send: 'إرسال رمز التحقق',
      sending: 'جارٍ إرسال الرمز…',
      code: 'رمز التحقق',
      codeHint: 'أدخل الرمز المكوّن من 6 أرقام المرسل إلى',
      verify: 'تأكيد الرمز',
      verifying: 'جارٍ التأكيد…',
      changePhone: 'تغيير الرقم',
      resendIn: 'إعادة الإرسال خلال {seconds} ثانية',
      resendReady: 'يمكنك إعادة إرسال الرمز الآن',
      resend: 'إعادة إرسال الرمز',
      resending: 'جارٍ إعادة الإرسال…',
      validPhone: 'أدخل رقم موبايل مصري صحيح.',
      validCode: 'أدخل رمز التحقق المكوّن من 6 أرقام.',
      requestFailed: 'تعذر إرسال رمز التحقق. حاول مرة أخرى.',
      verificationFailed: 'تعذر تأكيد الرمز. تأكد منه وحاول مرة أخرى.',
      sessionExpired: 'انتهت جلستك. سجّل دخولك مرة أخرى.',
      codeDigit: 'الرقم {number} من رمز التحقق.',
    },
    admin: {
      eyebrow: 'إدارة مكان',
      title: 'تسجيل دخول فريق المراجعة',
      description: 'استخدم بيانات المشرف ورمز تطبيق المصادقة.',
      username: 'اسم المستخدم أو البريد الإلكتروني',
      password: 'كلمة المرور',
      twoFactor: 'رمز المصادقة الثنائية',
      signIn: 'تسجيل الدخول',
      signingIn: 'جارٍ تسجيل الدخول…',
      validUsername: 'أدخل اسم المستخدم أو البريد الإلكتروني.',
      validPassword: 'أدخل كلمة المرور.',
      validTwoFactor: 'أدخل رمز المصادقة المكوّن من 6 أرقام.',
      invalidCredentials: 'اسم المستخدم أو كلمة المرور غير صحيحين.',
      invalidTwoFactor: 'رمز تطبيق المصادقة غير صحيح أو انتهت صلاحيته.',
      sessionExpired: 'انتهت جلستك الإدارية. سجّل دخولك مرة أخرى.',
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
