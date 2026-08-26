import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useLocale } from '../../components/layout/LocaleProvider';
import { useAuth } from '../../hooks/useAuth';
import { authCopy, authMessage } from '../../i18n/auth';
import { requestOtp } from '../../services/auth.service';

const localPhonePattern = /^1[0125]\d{8}$/;

function safeReturnUrl(value: unknown, fallback: string) {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  )
    return fallback;
  return value;
}

function toWesternDigits(value: string) {
  return value.replace(/[٠-٩]/g, (digit) =>
    String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)),
  );
}

function toArabicDigits(value: string) {
  return value.replace(/\d/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)]);
}

export default function PhoneAuthPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const { isExpired, login } = useAuth();
  const copy = authCopy[locale].seller;
  const isRegistration = router.query.mode === 'register';
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const otpInputs = useRef<Array<HTMLInputElement | null>>([]);
  const phoneForm = useForm<{ phone: string }>({
    defaultValues: { phone: '' },
  });
  const otpForm = useForm<{ code: string }>({ defaultValues: { code: '' } });
  const otpValue = otpForm.watch('code') ?? '';

  useEffect(() => {
    if (step !== 'otp' || secondsLeft <= 0) return;
    const timer = window.setTimeout(
      () => setSecondsLeft((current) => current - 1),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [secondsLeft, step]);

  const sendCode = async (formattedPhone: string, resend = false) => {
    setRequestError(null);
    setVerifyError(null);
    setIsRequesting(true);
    try {
      await requestOtp(formattedPhone, locale);
      setPhone(formattedPhone);
      setSecondsLeft(300);
      if (!resend) setStep('otp');
    } catch {
      setRequestError(copy.requestFailed);
    } finally {
      setIsRequesting(false);
    }
  };

  const submitPhone = phoneForm.handleSubmit(async ({ phone: value }) => {
    const localPhone = toWesternDigits(value).replace(/\D/g, '');
    if (!localPhonePattern.test(localPhone)) {
      phoneForm.setError('phone', { message: copy.validPhone });
      return;
    }
    await sendCode(`+20${localPhone}`);
  });

  const submitOtp = otpForm.handleSubmit(async ({ code }) => {
    if (!/^\d{6}$/.test(code)) {
      otpForm.setError('code', { message: copy.validCode });
      return;
    }
    setVerifyError(null);
    try {
      await login(phone, code);
      await router.push(
        safeReturnUrl(router.query.returnUrl, '/listings/create'),
      );
    } catch {
      setVerifyError(copy.verificationFailed);
    }
  });

  const updateCode = (index: number, nextDigit: string) => {
    const digits = otpValue.padEnd(6, ' ').split('');
    digits[index] =
      toWesternDigits(nextDigit).replace(/\D/g, '').slice(-1) || ' ';
    otpForm.setValue('code', digits.join('').trimEnd(), {
      shouldValidate: false,
    });
    otpForm.clearErrors('code');
    if (nextDigit && index < 5) otpInputs.current[index + 1]?.focus();
  };

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <section
        aria-labelledby="seller-login-title"
        className="w-full max-w-md rounded-panel border border-border bg-surface-raised p-6 shadow-panel sm:p-8"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {isRegistration ? copy.registerEyebrow : copy.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold" id="seller-login-title">
          {isRegistration ? copy.registerTitle : copy.title}
        </h1>
        <p className="mt-3 text-ink-muted">
          {isRegistration ? copy.registerDescription : copy.description}
        </p>
        {isExpired && !isRegistration && (
          <p
            className="mt-5 rounded-ui bg-danger/10 px-4 py-3 text-sm text-danger"
            role="status"
          >
            {copy.sessionExpired}
          </p>
        )}
        {step === 'phone' ? (
          <form className="mt-7 space-y-5" noValidate onSubmit={submitPhone}>
            <label className="block" htmlFor="seller-phone">
              <span className="mb-2 block text-sm font-semibold">
                {copy.phone}
              </span>
              <span className="mb-2 block text-xs text-ink-muted">
                {copy.phoneHint}
              </span>
              <div
                className="flex overflow-hidden rounded-ui border border-border bg-surface"
                dir="ltr"
              >
                <span
                  aria-hidden="true"
                  className="flex items-center border-e border-border px-4 text-ink-muted"
                >
                  {locale === 'ar' ? '+٢٠' : '+20'}
                </span>
                <input
                  autoComplete="tel-national"
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 outline-none"
                  dir="ltr"
                  id="seller-phone"
                  inputMode="tel"
                  onChange={(event) => {
                    phoneForm.setValue(
                      'phone',
                      locale === 'ar'
                        ? toArabicDigits(event.target.value)
                        : event.target.value,
                    );
                    phoneForm.clearErrors('phone');
                  }}
                  placeholder={copy.phonePlaceholder}
                  type="tel"
                  value={phoneForm.watch('phone')}
                />
              </div>
            </label>
            {phoneForm.formState.errors.phone && (
              <p className="text-sm text-danger" role="alert">
                {phoneForm.formState.errors.phone.message}
              </p>
            )}
            {requestError && (
              <p className="text-sm text-danger" role="alert">
                {requestError}
              </p>
            )}
            <button
              className="w-full rounded-full bg-primary px-4 py-3 font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isRequesting}
              type="submit"
            >
              {isRequesting
                ? copy.sending
                : isRegistration
                  ? copy.registerSend
                  : copy.send}
            </button>
          </form>
        ) : (
          <form className="mt-7 space-y-5" noValidate onSubmit={submitOtp}>
            <input type="hidden" {...otpForm.register('code')} />
            <div>
              <span className="block text-sm font-semibold">{copy.code}</span>
              <p className="mt-1 text-sm text-ink-muted">
                {copy.codeHint} <bdi dir="ltr">{phone}</bdi>
              </p>
            </div>
            <div className="grid grid-cols-6 gap-2" dir="ltr">
              {Array.from({ length: 6 }).map((_, index) => (
                <input
                  aria-label={authMessage(copy.codeDigit, {
                    number: index + 1,
                  })}
                  className="min-w-0 rounded-ui border border-border bg-surface px-1 py-3 text-center text-lg outline-none"
                  inputMode="numeric"
                  key={index}
                  maxLength={1}
                  onChange={(event) => updateCode(index, event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Backspace' &&
                      !otpValue[index] &&
                      index > 0
                    )
                      otpInputs.current[index - 1]?.focus();
                  }}
                  onPaste={(event) => {
                    const pasted = toWesternDigits(
                      event.clipboardData.getData('text'),
                    )
                      .replace(/\D/g, '')
                      .slice(0, 6);
                    if (pasted) {
                      event.preventDefault();
                      otpForm.setValue('code', pasted, {
                        shouldValidate: false,
                      });
                      otpForm.clearErrors('code');
                      otpInputs.current[Math.min(pasted.length, 5)]?.focus();
                    }
                  }}
                  ref={(element) => {
                    otpInputs.current[index] = element;
                  }}
                  value={
                    locale === 'ar'
                      ? toArabicDigits(otpValue[index] ?? '')
                      : (otpValue[index] ?? '')
                  }
                />
              ))}
            </div>
            {(otpForm.formState.errors.code || verifyError || requestError) && (
              <p className="text-sm text-danger" role="alert">
                {otpForm.formState.errors.code?.message ??
                  verifyError ??
                  requestError}
              </p>
            )}
            <div className="flex items-center justify-between gap-4 text-sm text-ink-muted">
              <span>
                {secondsLeft > 0
                  ? authMessage(copy.resendIn, { seconds: secondsLeft })
                  : copy.resendReady}
              </span>
              <button
                className="font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-50"
                disabled={secondsLeft > 0 || isRequesting}
                onClick={() => void sendCode(phone, true)}
                type="button"
              >
                {isRequesting ? copy.resending : copy.resend}
              </button>
            </div>
            <button
              className="w-full rounded-full bg-primary px-4 py-3 font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
              disabled={otpForm.formState.isSubmitting}
              type="submit"
            >
              {otpForm.formState.isSubmitting ? copy.verifying : copy.verify}
            </button>
            <button
              className="w-full text-sm font-semibold text-primary"
              onClick={() => {
                setStep('phone');
                setRequestError(null);
                setVerifyError(null);
                otpForm.reset();
              }}
              type="button"
            >
              {copy.changePhone}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
