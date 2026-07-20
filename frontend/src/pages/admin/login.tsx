import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAdminAuth } from '../../hooks/useAdminAuth';

const adminLoginSchema = z.object({
  username: z.string().min(3, 'Enter your admin username'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[a-z]/, 'Password must include lowercase letters')
    .regex(/[A-Z]/, 'Password must include uppercase letters')
    .regex(/\d/, 'Password must include a number')
    .regex(/[^A-Za-z0-9]/, 'Password must include a symbol'),
  twoFactorCode: z.string().regex(/^\d{6}$/, 'Enter the 6-digit authenticator code'),
});

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();
  const form = useForm<z.infer<typeof adminLoginSchema>>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      username: '',
      password: '',
      twoFactorCode: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login(values);
      const returnUrl =
        typeof router.query.returnUrl === 'string' ? router.query.returnUrl : '/admin/queue';
      await router.push(returnUrl);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Invalid username, password, or 2FA code';
      form.setError('root', {
        message:
          /2FA/i.test(message) || /authenticator/i.test(message)
            ? 'The authenticator code is invalid or expired.'
            : 'The username or password is incorrect.',
      });
    }
  });

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center px-4 py-8">
      <div className="w-full rounded-[2rem] border border-ink/10 bg-white p-8 shadow-xl">
        <p className="text-xs uppercase tracking-[0.35em] text-ink/50">Makaan admin</p>
        <h1 className="mt-3 text-3xl font-semibold">Moderation sign in</h1>
        <p className="mt-3 text-ink/70">
          Use your admin username, password, and authenticator code.
        </p>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Username</span>
            <input
              className="w-full rounded-2xl border border-ink/10 px-4 py-3 outline-none"
              {...form.register('username')}
            />
            <p className="mt-2 text-sm text-clay">{form.formState.errors.username?.message}</p>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Password</span>
            <input
              className="w-full rounded-2xl border border-ink/10 px-4 py-3 outline-none"
              type="password"
              {...form.register('password')}
            />
            <p className="mt-2 text-sm text-clay">{form.formState.errors.password?.message}</p>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">2FA code</span>
            <input
              className="w-full rounded-2xl border border-ink/10 px-4 py-3 outline-none"
              inputMode="numeric"
              maxLength={6}
              {...form.register('twoFactorCode')}
            />
            <p className="mt-2 text-sm text-clay">
              {form.formState.errors.twoFactorCode?.message}
            </p>
          </label>
          <p className="text-sm text-clay">{form.formState.errors.root?.message}</p>
          <button
            className="w-full rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white"
            disabled={form.formState.isSubmitting}
            type="submit"
          >
            {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}
