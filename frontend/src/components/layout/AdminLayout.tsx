import Link from 'next/link';
import { useRouter } from 'next/router';

import { useAdminAuth } from '../../hooks/useAdminAuth';

export function AdminLayout({
  children,
  pendingCount,
}: {
  children: React.ReactNode;
  pendingCount?: number;
}) {
  const router = useRouter();
  const { logout, user } = useAdminAuth();

  return (
    <div className="min-h-screen bg-[#f4ecdd] text-ink">
      <div className="mx-auto grid min-h-screen max-w-[1440px] gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] bg-[#12343b] p-6 text-white shadow-xl">
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">Makaan admin</p>
          <h1 className="mt-3 text-3xl font-semibold">Moderation</h1>
          <nav className="mt-8 space-y-3">
            <Link
              className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                router.pathname.startsWith('/admin/queue') || router.pathname.startsWith('/admin/listings')
                  ? 'bg-white/15'
                  : 'bg-white/5'
              }`}
              href="/admin/queue"
            >
              <span>Queue</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs">
                {pendingCount ?? 0}
              </span>
            </Link>
            <Link
              className={`block rounded-2xl px-4 py-3 ${
                router.pathname === '/admin/settings' ? 'bg-white/15' : 'bg-white/5'
              }`}
              href="/admin/settings"
            >
              Settings
            </Link>
          </nav>
          <div className="mt-8 rounded-2xl bg-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-white/60">Signed in as</p>
            <p className="mt-2 text-lg font-semibold">{user?.username}</p>
            <button
              className="mt-4 w-full rounded-full border border-white/25 px-4 py-3 text-sm font-semibold"
              onClick={() => void logout().then(() => router.push('/admin/login'))}
              type="button"
            >
              Logout
            </button>
          </div>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  );
}
