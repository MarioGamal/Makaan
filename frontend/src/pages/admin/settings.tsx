import { AdminProtectedRoute } from '../../components/auth/AdminProtectedRoute';
import { AdminLayout } from '../../components/layout/AdminLayout';

export default function AdminSettingsPage() {
  return (
    <AdminProtectedRoute>
      <AdminLayout pendingCount={0}>
        <section className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.35em] text-ink/50">Settings</p>
          <h1 className="mt-2 text-3xl font-semibold">Admin settings</h1>
          <p className="mt-3 text-ink/70">
            Two-factor and team account management can expand here during polish.
          </p>
        </section>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
