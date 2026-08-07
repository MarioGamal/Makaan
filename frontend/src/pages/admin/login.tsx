import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useLocale } from '../../components/layout/LocaleProvider';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { authCopy } from '../../i18n/auth';

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

export default function AdminLoginPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const { isExpired, login } = useAdminAuth();
  const copy = authCopy[locale].admin;
  const schema = z.object({
    username: z.string().min(1, copy.validUsername),
    password: z.string().min(1, copy.validPassword),
    twoFactorCode: z.string().regex(/^\d{6}$/, copy.validTwoFactor),
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '', twoFactorCode: '' },
  });
  const onSubmit = form.handleSubmit(async (values) => {
    form.clearErrors('root');
    try {
      await login(values);
      await router.push(safeReturnUrl(router.query.returnUrl, '/admin/queue'));
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      form.setError('root', {
        message: /2FA|two.factor|authenticator/i.test(message)
          ? copy.invalidTwoFactor
          : copy.invalidCredentials,
      });
    }
  });
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <section
        aria-labelledby="admin-login-title"
        className="w-full max-w-md rounded-panel border border-border bg-surface-raised p-6 shadow-panel sm:p-8"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-semibold" id="admin-login-title">
          {copy.title}
        </h1>
        <p className="mt-3 text-ink-muted">{copy.description}</p>
        {isExpired && (
          <p
            className="mt-5 rounded-ui bg-danger/10 px-4 py-3 text-sm text-danger"
            role="status"
          >
            {copy.sessionExpired}
          </p>
        )}
        <form className="mt-7 space-y-5" noValidate onSubmit={onSubmit}>
          <label className="block" htmlFor="admin-username">
            <span className="mb-2 block text-sm font-semibold">
              {copy.username}
            </span>
            <input
              autoComplete="username"
              className="w-full rounded-ui border border-border bg-surface px-4 py-3 outline-none"
              id="admin-username"
              {...form.register('username')}
            />
          </label>
          {form.formState.errors.username && (
            <p className="text-sm text-danger" role="alert">
              {form.formState.errors.username.message}
            </p>
          )}
          <label className="block" htmlFor="admin-password">
            <span className="mb-2 block text-sm font-semibold">
              {copy.password}
            </span>
            <input
              autoComplete="current-password"
              className="w-full rounded-ui border border-border bg-surface px-4 py-3 outline-none"
              id="admin-password"
              type="password"
              {...form.register('password')}
            />
          </label>
          {form.formState.errors.password && (
            <p className="text-sm text-danger" role="alert">
              {form.formState.errors.password.message}
            </p>
          )}
          <label className="block" htmlFor="admin-two-factor">
            <span className="mb-2 block text-sm font-semibold">
              {copy.twoFactor}
            </span>
            <input
              autoComplete="one-time-code"
              className="w-full rounded-ui border border-border bg-surface px-4 py-3 outline-none"
              id="admin-two-factor"
              inputMode="numeric"
              maxLength={6}
              {...form.register('twoFactorCode', {
                onChange: (event) => {
                  event.target.value = event.target.value.replace(/\D/g, '');
                },
              })}
            />
          </label>
          {form.formState.errors.twoFactorCode && (
            <p className="text-sm text-danger" role="alert">
              {form.formState.errors.twoFactorCode.message}
            </p>
          )}
          {form.formState.errors.root && (
            <p
              className="rounded-ui bg-danger/10 px-4 py-3 text-sm text-danger"
              role="alert"
            >
              {form.formState.errors.root.message}
            </p>
          )}
          <button
            className="w-full rounded-full bg-primary px-4 py-3 font-semibold text-white transition hover:bg-primary-strong disabled:cursor-not-allowed disabled:opacity-60"
            disabled={form.formState.isSubmitting}
            type="submit"
          >
            {form.formState.isSubmitting ? copy.signingIn : copy.signIn}
          </button>
        </form>
      </section>
    </main>
  );
}
