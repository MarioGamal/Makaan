import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { AdminProtectedRoute } from '../../../components/auth/AdminProtectedRoute';
import { AdminLayout } from '../../../components/layout/AdminLayout';
import { useLocale } from '../../../components/layout/LocaleProvider';
import { AsyncState } from '../../../components/ui/AsyncState';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { moderationCopy } from '../../../i18n/moderation';
import {
  approveAdminListing,
  getAdminListingById,
  rejectAdminListing,
  unpublishAdminListing,
  type AdminListingDetail,
  type Participation,
  type RejectionReason,
} from '../../../services/admin-auth.service';
import { useAdminAuth } from '../../../hooks/useAdminAuth';

const reasons: RejectionReason[] = [
  'incomplete_data',
  'inaccurate_location',
  'media_issue',
  'participation_unconfirmed',
  'duplicate',
  'spam_scam',
];
type Decision = 'approve' | 'reject' | 'unpublish';
const label = (value: number, locale: string) =>
  new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    maximumFractionDigits: 5,
  }).format(value);

export default function AdminListingReviewPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const copy = moderationCopy[locale];
  const { csrfToken } = useAdminAuth();
  const listingId =
    typeof router.query.id === 'string' ? router.query.id : null;
  const [listing, setListing] = useState<AdminListingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [reasonCode, setReasonCode] =
    useState<RejectionReason>('incomplete_data');
  const [sellerNote, setSellerNote] = useState('');
  const [internalReason, setInternalReason] = useState('');
  const [participationOutcome, setParticipationOutcome] =
    useState<Participation>('owner_not_verified');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const load = async () => {
    if (!listingId) return;
    try {
      setIsLoading(true);
      setError(null);
      const next = await getAdminListingById(listingId);
      setListing(next);
      setParticipationOutcome(next.seller.participation);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Unable to load listing',
      );
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [listingId]);
  const submitDecision = async () => {
    if (!listing || !listingId || !decision || !internalReason.trim()) return;
    try {
      setIsSubmitting(true);
      if (decision === 'approve')
        await approveAdminListing(
          listingId,
          {
            lockVersion: listing.lockVersion,
            approvedPublicLocation: listing.proposedPublicLocation,
            participationOutcome,
            internalReason: internalReason.trim(),
          },
          csrfToken ?? undefined,
        );
      else if (decision === 'reject')
        await rejectAdminListing(
          listingId,
          {
            lockVersion: listing.lockVersion,
            reasonCode,
            sellerNote: sellerNote.trim() || undefined,
            internalReason: internalReason.trim(),
          },
          csrfToken ?? undefined,
        );
      else
        await unpublishAdminListing(
          listingId,
          {
            lockVersion: listing.lockVersion,
            reasonCode,
            internalReason: internalReason.trim(),
          },
          csrfToken ?? undefined,
        );
      await router.push('/admin/queue');
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Unable to save decision';
      setError(message.includes('CONFLICT') ? copy.conflict : message);
      setDecision(null);
    } finally {
      setIsSubmitting(false);
    }
  };
  const detailTitle = listing
    ? (locale === 'ar'
        ? listing.titleAr || listing.titleEn
        : listing.titleEn || listing.titleAr) ||
      `${listing.propertyType} — ${locale === 'ar' ? listing.area.nameAr || listing.area.nameEn : listing.area.nameEn || listing.area.nameAr}`
    : '';
  return (
    <AdminProtectedRoute>
      <AdminLayout pendingCount={undefined}>
        <div className="space-y-6">
          {isLoading ? (
            <AsyncState state="loading" title={copy.loading} />
          ) : error && !listing ? (
            <AsyncState
              state="error"
              title={error}
              onRetry={() => void load()}
              retryLabel={copy.retry}
            />
          ) : !listing ? (
            <AsyncState state="empty" title="Listing not found" />
          ) : (
            <>
              {error ? (
                <div
                  className="rounded-ui border border-danger/25 bg-red-50 p-4 text-sm text-danger"
                  role="alert"
                >
                  {error}
                </div>
              ) : null}
              <section className="rounded-panel border border-border bg-surface-raised p-5 shadow-panel md:p-7">
                <div className="flex flex-col justify-between gap-4 lg:flex-row">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.24em] text-ink/55">
                      {copy.review}
                    </p>
                    <h1 className="mt-2 text-3xl font-bold">{detailTitle}</h1>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge>{copy[listing.purpose]}</Badge>
                      <Badge
                        tone={
                          listing.seller.participation === 'verified_owner'
                            ? 'success'
                            : listing.seller.participation === 'declared_agent'
                              ? 'info'
                              : 'warning'
                        }
                      >
                        {copy[listing.seller.participation]}
                      </Badge>
                      <Badge tone="warning">{listing.status}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setDecision('approve')}>
                      {copy.approve}
                    </Button>
                    <Button
                      onClick={() => setDecision('reject')}
                      variant="danger"
                    >
                      {copy.reject}
                    </Button>
                    {listing.status === 'active' ? (
                      <Button
                        onClick={() => setDecision('unpublish')}
                        variant="secondary"
                      >
                        {copy.unpublish}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </section>
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.8fr)]">
                <div className="space-y-6">
                  <section className="rounded-panel border border-border bg-surface-raised p-5">
                    <h2 className="text-xl font-bold">{copy.media}</h2>
                    {listing.media.length ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {listing.media
                          .sort((a, b) => a.displayOrder - b.displayOrder)
                          .map((media) => (
                            <img
                              alt={`${copy.media} ${media.displayOrder + 1}`}
                              className="aspect-[4/3] w-full rounded-ui object-cover"
                              key={media.id}
                              src={media.previewUrl}
                            />
                          ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-ink/65">{copy.noMedia}</p>
                    )}
                  </section>
                  <section className="rounded-panel border border-border bg-surface-raised p-5">
                    <h2 className="text-xl font-bold">{copy.details}</h2>
                    <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Info
                        label={copy.price}
                        value={`${label(listing.priceEgp, locale)} EGP`}
                      />
                      <Info label={copy.type} value={listing.propertyType} />
                      <Info label="m²" value={label(listing.sizeSqm, locale)} />
                      <Info
                        label="Beds / baths"
                        value={`${listing.bedrooms} / ${listing.bathrooms}`}
                      />
                    </dl>
                    <p className="mt-5 whitespace-pre-wrap leading-7 text-ink/75">
                      {locale === 'ar'
                        ? listing.descriptionAr || listing.descriptionEn
                        : listing.descriptionEn || listing.descriptionAr || '—'}
                    </p>
                  </section>
                  <LocationPanel
                    title={copy.exact}
                    help={copy.exactHelp}
                    latitude={listing.exactLocation.latitude}
                    longitude={listing.exactLocation.longitude}
                    locale={locale}
                    privateLocation
                  />{' '}
                  <LocationPanel
                    title={copy.proposed}
                    help={copy.publicHelp}
                    location={listing.proposedPublicLocation}
                    locale={locale}
                  />
                </div>
                <aside className="space-y-6">
                  <section className="rounded-panel border border-border bg-surface-raised p-5">
                    <h2 className="text-xl font-bold">{copy.seller}</h2>
                    <dl className="mt-4 space-y-3 text-sm">
                      <Info label="Phone" value={listing.seller.phone} inline />
                      <Info
                        label={copy.participation}
                        value={copy[listing.seller.participation]}
                        inline
                      />
                      <Info
                        label={copy.verified}
                        value={
                          listing.seller.isVerified
                            ? copy.verified
                            : copy.notVerified
                        }
                        inline
                      />
                    </dl>
                  </section>
                  <section className="rounded-panel border border-border bg-surface-raised p-5">
                    <h2 className="text-xl font-bold">{copy.declaration}</h2>
                    <p className="mt-3 text-sm text-ink/70">
                      {listing.declaration?.publicLocationConsent || '—'}
                    </p>
                    <p className="mt-2 text-sm text-ink/70">
                      {listing.declaration?.participation
                        ? copy[listing.declaration.participation]
                        : '—'}
                    </p>
                  </section>
                  <section className="rounded-panel border border-border bg-surface-raised p-5">
                    <h2 className="text-xl font-bold">{copy.revision}</h2>
                    <p className="mt-3 text-sm text-ink/70">
                      {listing.revision?.submittedAt
                        ? new Intl.DateTimeFormat(
                            locale === 'ar' ? 'ar-EG' : 'en-EG',
                            { dateStyle: 'medium', timeStyle: 'short' },
                          ).format(new Date(listing.revision.submittedAt))
                        : '—'}
                    </p>
                    <p className="mt-2 text-sm text-ink/70">
                      {listing.revision?.notes || '—'}
                    </p>
                  </section>
                  <section className="rounded-panel border border-border bg-surface-raised p-5">
                    <h2 className="text-xl font-bold">
                      {copy.decisionHistory}
                    </h2>
                    {listing.decisions?.length ? (
                      <ol className="mt-4 space-y-4">
                        {listing.decisions.map((item) => (
                          <li
                            className="border-s-2 border-primary/30 ps-3 text-sm"
                            key={item.id}
                          >
                            <p className="font-bold">
                              {
                                copy[
                                  item.action === 'approved'
                                    ? 'approved'
                                    : item.action === 'rejected'
                                      ? 'rejected'
                                      : 'unpublished'
                                ]
                              }
                            </p>
                            <p className="mt-1 text-ink/65">
                              {item.reasonCode
                                ? copy[item.reasonCode]
                                : item.internalReason || '—'}
                            </p>
                            <time className="mt-1 block text-xs text-ink/50">
                              {new Intl.DateTimeFormat(
                                locale === 'ar' ? 'ar-EG' : 'en-EG',
                                { dateStyle: 'medium', timeStyle: 'short' },
                              ).format(new Date(item.createdAt))}
                            </time>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="mt-3 text-sm text-ink/65">
                        {copy.noHistory}
                      </p>
                    )}
                  </section>
                </aside>
              </div>
              <Modal
                open={decision !== null}
                onClose={() => setDecision(null)}
                title={
                  decision === 'approve'
                    ? copy.confirmApprove
                    : decision === 'reject'
                      ? copy.confirmReject
                      : copy.confirmUnpublish
                }
              >
                <div className="space-y-4">
                  <p className="text-sm text-ink/70">
                    {decision === 'approve'
                      ? copy.approveCopy
                      : decision === 'reject'
                        ? copy.rejectCopy
                        : copy.unpublishCopy}
                  </p>
                  {decision === 'approve' ? (
                    <label className="block text-sm font-semibold">
                      <span className="mb-1.5 block">{copy.participation}</span>
                      <select
                        className="min-h-11 w-full rounded-ui border border-border bg-white px-3"
                        value={participationOutcome}
                        onChange={(event) =>
                          setParticipationOutcome(
                            event.target.value as Participation,
                          )
                        }
                      >
                        <option value="verified_owner">
                          {copy.verified_owner}
                        </option>
                        <option value="owner_not_verified">
                          {copy.owner_not_verified}
                        </option>
                        <option value="declared_agent">
                          {copy.declared_agent}
                        </option>
                      </select>
                    </label>
                  ) : (
                    <>
                      <label className="block text-sm font-semibold">
                        <span className="mb-1.5 block">{copy.reason}</span>
                        <select
                          className="min-h-11 w-full rounded-ui border border-border bg-white px-3"
                          value={reasonCode}
                          onChange={(event) =>
                            setReasonCode(event.target.value as RejectionReason)
                          }
                        >
                          {reasons.map((reason) => (
                            <option key={reason} value={reason}>
                              {copy[reason]}
                            </option>
                          ))}
                        </select>
                      </label>
                      {decision === 'reject' ? (
                        <label className="block text-sm font-semibold">
                          <span className="mb-1.5 block">
                            {copy.sellerNote}
                          </span>
                          <textarea
                            className="min-h-24 w-full rounded-ui border border-border p-3 font-normal"
                            value={sellerNote}
                            onChange={(event) =>
                              setSellerNote(event.target.value)
                            }
                          />
                        </label>
                      ) : null}
                    </>
                  )}
                  <label className="block text-sm font-semibold">
                    <span className="mb-1.5 block">{copy.internalReason}</span>
                    <textarea
                      aria-describedby="internal-reason-help"
                      className="min-h-24 w-full rounded-ui border border-border p-3 font-normal"
                      required
                      value={internalReason}
                      onChange={(event) =>
                        setInternalReason(event.target.value)
                      }
                    />
                    <span
                      className="mt-1 block text-xs font-normal text-ink/60"
                      id="internal-reason-help"
                    >
                      {copy.required}
                    </span>
                  </label>
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => setDecision(null)}
                      variant="secondary"
                    >
                      {copy.cancel}
                    </Button>
                    <Button
                      disabled={!internalReason.trim()}
                      loading={isSubmitting}
                      onClick={() => void submitDecision()}
                      variant={decision === 'approve' ? 'primary' : 'danger'}
                    >
                      {decision === 'approve'
                        ? copy.approve
                        : decision === 'reject'
                          ? copy.reject
                          : copy.unpublish}
                    </Button>
                  </div>
                </div>
              </Modal>
            </>
          )}
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}

function Info({
  label: infoLabel,
  value,
  inline = false,
}: {
  label: string;
  value: string;
  inline?: boolean;
}) {
  return (
    <div className={inline ? 'flex items-start justify-between gap-3' : ''}>
      <dt className="text-xs font-bold uppercase tracking-wide text-ink/55">
        {infoLabel}
      </dt>
      <dd className={inline ? 'text-end font-semibold' : 'mt-1 font-semibold'}>
        {value}
      </dd>
    </div>
  );
}
function LocationPanel({
  title,
  help,
  latitude,
  longitude,
  location,
  locale,
  privateLocation = false,
}: {
  title: string;
  help: string;
  latitude?: number;
  longitude?: number;
  location?: AdminListingDetail['proposedPublicLocation'];
  locale: string;
  privateLocation?: boolean;
}) {
  const isAreaOnly = location?.mode === 'area_only';
  const lat = location?.mode === 'approximate' ? location.latitude : latitude;
  const lng = location?.mode === 'approximate' ? location.longitude : longitude;
  const radius =
    location?.mode === 'approximate' ? location.radiusMeters : undefined;
  const copy = moderationCopy[locale as 'ar' | 'en'];
  return (
    <section className="rounded-panel border border-border bg-surface-raised p-5">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-ink/65">{help}</p>
      {isAreaOnly ? (
        <p className="mt-4 rounded-ui bg-surface-muted p-4 text-sm font-semibold">
          {copy.areaOnly}
        </p>
      ) : (
        <div className="mt-4 grid gap-3 rounded-ui bg-surface-muted p-4 sm:grid-cols-2">
          <Info
            label={
              privateLocation ? copy.privateCoordinates : copy.publicCoordinates
            }
            value={`${label(lat ?? 0, locale)}, ${label(lng ?? 0, locale)}`}
          />
          <Info
            label={copy.radius}
            value={radius ? `${label(radius, locale)} m` : copy.approvedPoint}
          />
        </div>
      )}
    </section>
  );
}
