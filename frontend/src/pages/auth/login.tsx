import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAuth } from '../../hooks/useAuth';
import { requestOtp } from '../../services/auth.service';

const phoneSchema = z.object({
  phone: z
    .string()
    .regex(/^1[0125]\d{8}$/, 'Enter a valid Egyptian mobile number'),
});

const otpSchema = z.object({
  code: z.string().length(6, 'Enter the 6-digit OTP'),
});

export default function PhoneAuthPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [error, setError] = useState<string | null>(null);

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });
  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: '' },
  });

  const otpValue = otpForm.watch('code') ?? '';

  useEffect(() => {
    if (step !== 'otp' || secondsLeft <= 0) {
      return;
    }

    const timer = window.setTimeout(() => setSecondsLeft((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft, step]);

  const submitPhone = phoneForm.handleSubmit(async (values) => {
    setError(null);
    const formattedPhone = `+20${values.phone}`;
    await requestOtp(formattedPhone);
    setPhone(formattedPhone);
    setSecondsLeft(300);
    setStep('otp');
  });

  const submitOtp = otpForm.handleSubmit(async (values) => {
    try {
      setError(null);
      await login(phone, values.code);
      const returnUrl =
        typeof router.query.returnUrl === 'string' ? router.query.returnUrl : '/listings/create';
      await router.push(returnUrl);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'OTP verification failed');
    }
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-8">
      <div className="w-full rounded-[2rem] border border-ink/10 bg-white p-8 shadow-xl">
        <h1 className="text-3xl font-semibold">Seller login</h1>
        <p className="mt-3 text-ink/70">Authenticate with your Egyptian mobile number.</p>

        {step === 'phone' ? (
          <form className="mt-6 space-y-4" onSubmit={submitPhone}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Phone number</span>
              <div className="flex rounded-2xl border border-ink/10">
                <span className="flex items-center px-4 text-sm text-ink/60">+20</span>
                <input
                  className="w-full rounded-r-2xl px-4 py-3 outline-none"
                  placeholder="10xxxxxxxx"
                  {...phoneForm.register('phone')}
                />
              </div>
              <p className="mt-2 text-sm text-clay">{phoneForm.formState.errors.phone?.message}</p>
            </label>
            <button
              className="w-full rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white"
              type="submit"
            >
              Send OTP
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={submitOtp}>
            <p className="text-sm text-ink/70">Enter the 6-digit code sent to {phone}</p>
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <input
                  className="rounded-2xl border border-ink/10 px-3 py-4 text-center text-xl outline-none"
                  inputMode="numeric"
                  key={index}
                  maxLength={1}
                  onChange={(event) => {
                    const next = otpValue.padEnd(6, ' ').split('');
                    next[index] = event.target.value.replace(/\D/g, '').slice(0, 1) || ' ';
                    otpForm.setValue('code', next.join('').trimEnd(), { shouldValidate: true });
                    if (event.target.value && event.currentTarget.nextElementSibling instanceof HTMLInputElement) {
                      event.currentTarget.nextElementSibling.focus();
                    }
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Backspace' &&
                      !otpValue[index] &&
                      event.currentTarget.previousElementSibling instanceof HTMLInputElement
                    ) {
                      event.currentTarget.previousElementSibling.focus();
                    }
                  }}
                  value={otpValue[index] ?? ''}
                />
              ))}
            </div>
            <p className="text-sm text-clay">{otpForm.formState.errors.code?.message ?? error}</p>
            <div className="flex items-center justify-between text-sm text-ink/60">
              <span>{secondsLeft > 0 ? `Resend in ${secondsLeft}s` : 'You can resend now'}</span>
              <button
                className="font-medium text-oasis disabled:opacity-40"
                disabled={secondsLeft > 0}
                onClick={() => void requestOtp(phone)}
                type="button"
              >
                Resend
              </button>
            </div>
            <button
              className="w-full rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white"
              type="submit"
            >
              Verify OTP
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
