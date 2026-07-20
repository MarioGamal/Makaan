import Link from 'next/link';
import { useRouter } from 'next/router';

export default function ListingSubmittedPage() {
  const router = useRouter();
  const listingId =
    typeof router.query.listingId === 'string' ? router.query.listingId : 'pending';

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-8">
      <div className="w-full rounded-[2rem] border border-ink/10 bg-white p-8 text-center shadow-xl">
        <p className="text-sm uppercase tracking-[0.25em] text-oasis">Listing Submitted</p>
        <h1 className="mt-4 text-3xl font-semibold">Your listing is pending admin review</h1>
        <p className="mt-3 text-ink/70">Listing ID: {listingId}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white" href="/seller/dashboard">
            Seller dashboard
          </Link>
          <Link className="rounded-full border border-ink/10 px-4 py-3 text-sm font-semibold" href="/">
            Browse listings
          </Link>
        </div>
      </div>
    </main>
  );
}
