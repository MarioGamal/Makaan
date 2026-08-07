import Link from 'next/link';
import { useLocale } from '../../components/layout/LocaleProvider';
import { Button, Card } from '../../components/ui';
import { sellerCopy } from '../../i18n/seller';
export default function ListingSubmittedPage() {
  const { locale } = useLocale();
  const copy = sellerCopy[locale];
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-8">
      <Card className="w-full text-center" padding="lg">
        <p className="text-sm font-bold text-primary">
          {copy.submittedEyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-bold">{copy.submittedTitle}</h1>
        <p className="mx-auto mt-4 max-w-lg text-ink-muted">
          {copy.submittedText}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/seller/dashboard">
            <Button>{copy.goDashboard}</Button>
          </Link>
          <Link href="/">
            <Button variant="secondary">{copy.browse}</Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
