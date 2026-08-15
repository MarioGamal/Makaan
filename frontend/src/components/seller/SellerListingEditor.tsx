import { FinishingLevel, PropertyType } from '@makaan/shared/constants/enums';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ListingCreateMap } from '../listing/ListingCreateMap';
import { PhotoUpload } from '../listing/PhotoUpload';
import { Button, Card, Input, Select } from '../ui';
import { sellerCopy } from '../../i18n/seller';
import { finishingLevelLabel, propertyTypeLabel } from '../../i18n';
import { useLocale } from '../layout/LocaleProvider';
import { declareParticipation } from '../../services/auth.service';
import {
  createListing,
  submitListing,
  updateListing,
  uploadPhotos,
  type SellerManagedListing,
} from '../../services/listings.service';

type FormState = {
  purpose: 'sale' | 'long_term_rent';
  propertyType: PropertyType;
  sizeSqm: number;
  bedrooms: number;
  bathrooms: number;
  finishingLevel: FinishingLevel;
  priceEgp: number;
  titleAr: string;
  descriptionAr: string;
  titleEn: string;
  descriptionEn: string;
  location: { lat: number; lng: number };
  publicLocationMode: 'approximate' | 'area_only';
  sellerDeclaration: 'owner' | 'agent' | null;
};
const initial: FormState = {
  purpose: 'sale',
  propertyType: PropertyType.APARTMENT,
  sizeSqm: 120,
  bedrooms: 2,
  bathrooms: 1,
  finishingLevel: FinishingLevel.FULLY_FINISHED,
  priceEgp: 2500000,
  titleAr: '',
  descriptionAr: '',
  titleEn: '',
  descriptionEn: '',
  location: { lat: 30.0444, lng: 31.2357 },
  publicLocationMode: 'approximate',
  sellerDeclaration: null,
};
const withinCairo = ({ lat, lng }: FormState['location']) =>
  lat >= 29.5 && lat <= 31.5 && lng >= 28.9 && lng <= 32.5;

type LocalDraft = Pick<
  FormState,
  | 'purpose'
  | 'propertyType'
  | 'sizeSqm'
  | 'bedrooms'
  | 'bathrooms'
  | 'finishingLevel'
  | 'priceEgp'
  | 'titleAr'
  | 'descriptionAr'
  | 'titleEn'
  | 'descriptionEn'
  | 'publicLocationMode'
>;

type ValidationIssue = {
  fieldId: string;
  step: number;
  message: string;
};

const localDraft = (form: FormState): LocalDraft => ({
  purpose: form.purpose,
  propertyType: form.propertyType,
  sizeSqm: form.sizeSqm,
  bedrooms: form.bedrooms,
  bathrooms: form.bathrooms,
  finishingLevel: form.finishingLevel,
  priceEgp: form.priceEgp,
  titleAr: form.titleAr,
  descriptionAr: form.descriptionAr,
  titleEn: form.titleEn,
  descriptionEn: form.descriptionEn,
  publicLocationMode: form.publicLocationMode,
});

export function SellerListingEditor({
  listing,
  csrfToken,
  onSessionChange,
}: {
  listing?: SellerManagedListing;
  csrfToken: string;
  onSessionChange?: () => Promise<void>;
}) {
  const { locale } = useLocale();
  const copy = sellerCopy[locale];
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() =>
    listing
      ? {
          ...initial,
          purpose:
            listing.purpose === 'rent' ? 'long_term_rent' : listing.purpose,
          propertyType: listing.propertyType as PropertyType,
          sizeSqm: listing.sizeSqm,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          finishingLevel: listing.finishingLevel as FinishingLevel,
          priceEgp: listing.priceEgp,
          titleAr: listing.titleAr ?? listing.title ?? '',
          descriptionAr: listing.descriptionAr ?? listing.description ?? '',
          titleEn: listing.titleEn ?? '',
          descriptionEn: listing.descriptionEn ?? '',
          location: listing.location,
          publicLocationMode: listing.publicLocationMode ?? 'approximate',
          sellerDeclaration:
            listing.participation === 'declared_agent' ? 'agent' : 'owner',
        }
      : initial,
  );
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [draftStatus, setDraftStatus] = useState<'saved' | 'restored' | null>(
    null,
  );
  const [hydrated, setHydrated] = useState(false);
  const originalForm = useRef(JSON.stringify(form));
  const isDirty =
    JSON.stringify(form) !== originalForm.current || files.length > 0;
  const isDirtyRef = useRef(isDirty);
  const allowNavigation = useRef(false);
  const storageKey = `makaan:seller-listing-draft:${listing?.id ?? 'new'}`;
  const labels = [copy.step1, copy.step2, copy.step3, copy.step4, copy.step5];
  const patch = (values: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...values }));
    if ('sellerDeclaration' in values) {
      setIssues((current) =>
        current.filter((issue) => issue.fieldId !== 'seller-declaration'),
      );
    }
  };
  const issueFor = (fieldId: string) =>
    issues.find((issue) => issue.fieldId === fieldId)?.message;
  const payload = useMemo(
    () => ({
      purpose: form.purpose,
      propertyType: form.propertyType,
      sizeSqm: form.sizeSqm,
      bedrooms: form.bedrooms,
      bathrooms: form.bathrooms,
      finishingLevel: form.finishingLevel,
      priceEgp: form.priceEgp,
      titleAr: form.titleAr,
      descriptionAr: form.descriptionAr,
      titleEn: form.titleEn || undefined,
      descriptionEn: form.descriptionEn || undefined,
      location: form.location,
      publicLocationMode: form.publicLocationMode,
    }),
    [form],
  );
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { value?: LocalDraft };
        if (parsed.value) {
          setForm((current) => ({ ...current, ...parsed.value }));
          setDraftStatus('restored');
        }
      }
    } catch {
      // Draft recovery is optional and must never interrupt listing creation.
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);
  useEffect(() => {
    if (!hydrated || !isDirty) return;
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({ savedAt: Date.now(), value: localDraft(form) }),
        );
        setDraftStatus('saved');
      } catch {
        // Local storage can be unavailable or full; the server submission remains unaffected.
      }
    }, 800);
    return () => window.clearTimeout(timeout);
  }, [form, hydrated, isDirty, storageKey]);
  useEffect(() => {
    const confirmNavigation = () => {
      if (!allowNavigation.current && isDirtyRef.current) {
        return window.confirm(copy.unsavedChanges);
      }
      return true;
    };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!allowNavigation.current && isDirtyRef.current) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    const routeChangeStart = () => {
      if (!confirmNavigation()) {
        router.events.emit('routeChangeError');
        throw new Error('Route change aborted due to unsaved listing changes.');
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    router.events.on('routeChangeStart', routeChangeStart);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      router.events.off('routeChangeStart', routeChangeStart);
    };
  }, [copy.unsavedChanges, router.events]);
  const focusIssue = (issue: ValidationIssue) => {
    setStep(issue.step);
    window.setTimeout(() => document.getElementById(issue.fieldId)?.focus(), 0);
  };
  const validate = (): ValidationIssue[] => {
    const next: ValidationIssue[] = [];
    if (!listing && !form.sellerDeclaration) {
      next.push({
        fieldId: 'seller-declaration',
        step: 0,
        message: copy.declarationRequired,
      });
    }
    if (form.sizeSqm < 10 || form.bedrooms < 0 || form.bathrooms < 0) {
      next.push({
        fieldId: 'listing-size',
        step: 1,
        message: copy.detailsRequired,
      });
    }
    if (!withinCairo(form.location)) {
      next.push({
        fieldId: 'listing-location',
        step: 2,
        message: copy.locationRequired,
      });
    }
    if ((listing?.photos.length ?? 0) + files.length < 3) {
      next.push({
        fieldId: 'listing-photos',
        step: 3,
        message: copy.photoCount,
      });
    }
    if (!form.titleAr.trim()) {
      next.push({
        fieldId: 'listing-title-ar',
        step: 4,
        message: copy.titleRequired,
      });
    }
    if (!form.descriptionAr.trim()) {
      next.push({
        fieldId: 'listing-description-ar',
        step: 4,
        message: copy.descriptionRequired,
      });
    }
    if (!Number.isFinite(form.priceEgp) || form.priceEgp < 1) {
      next.push({
        fieldId: 'listing-price',
        step: 4,
        message: copy.priceRequired,
      });
    }
    return next;
  };
  const advanceStep = () => {
    const stepIssues = validate().filter((issue) => issue.step === step);
    setIssues(stepIssues);
    if (stepIssues.length) {
      focusIssue(stepIssues[0]);
      return;
    }
    setStep((current) => current + 1);
  };
  const saveAndSubmit = async () => {
    setError(null);
    const nextIssues = validate();
    setIssues(nextIssues);
    if (nextIssues.length) {
      focusIssue(nextIssues[0]);
      return;
    }
    setBusy(true);
    try {
      if (!listing && form.sellerDeclaration) {
        await declareParticipation(form.sellerDeclaration, csrfToken);
      }
      const current = listing
        ? await updateListing(
            listing.id,
            payload,
            listing.lockVersion,
            csrfToken,
          )
        : await createListing(payload, csrfToken);
      if (files.length) await uploadPhotos(current.id, files, csrfToken);
      const submitted = await submitListing(
        current.id,
        current.lockVersion,
        csrfToken,
      );
      await onSessionChange?.();
      allowNavigation.current = true;
      window.localStorage.removeItem(storageKey);
      await router.push(`/listings/submitted?listingId=${submitted.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : copy.requestFailed);
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Card padding="lg" className="overflow-visible">
        <div className="border-b border-border pb-5">
          <p className="text-sm font-bold text-primary">
            {listing ? copy.editTitle : copy.create}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{labels[step]}</h1>
          <div className="mt-5 grid grid-cols-5 gap-1">
            {labels.map((label, i) => (
              <span
                className={`h-1.5 rounded-full ${i <= step ? 'bg-primary' : 'bg-surface-muted'}`}
                key={label}
              />
            ))}
          </div>
          <p className="mt-3 text-sm text-ink-muted">
            {step + 1} / {labels.length} · {labels[step]}
          </p>
        </div>
        {issues.length ? (
          <section
            aria-labelledby="listing-validation-title"
            className="mt-5 rounded-ui border border-danger/30 bg-red-50 p-4 text-danger"
            role="alert"
          >
            <h2 className="font-bold" id="listing-validation-title">
              {copy.validationTitle}
            </h2>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
              {issues.map((issue) => (
                <li key={issue.fieldId}>
                  <button
                    className="text-start underline underline-offset-2 focus-visible:outline-primary"
                    onClick={() => focusIssue(issue)}
                    type="button"
                  >
                    {issue.message}{' '}
                    <span className="sr-only">{copy.fixField}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {error ? (
          <p
            className="mt-5 rounded-ui bg-red-50 p-3 text-sm font-medium text-danger"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <div className="mt-6 space-y-5">
          {step === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label={copy.purpose}
                value={form.purpose}
                onChange={(e) =>
                  patch({ purpose: e.target.value as FormState['purpose'] })
                }
              >
                <option value="sale">{copy.sale}</option>
                <option value="long_term_rent">{copy.rent}</option>
              </Select>
              <Select
                label={copy.type}
                value={form.propertyType}
                onChange={(e) =>
                  patch({ propertyType: e.target.value as PropertyType })
                }
              >
                {Object.values(PropertyType).map((v) => (
                  <option value={v} key={v}>
                    {propertyTypeLabel(locale, v)}
                  </option>
                ))}
              </Select>
              <Select
                id="seller-declaration"
                error={issueFor('seller-declaration')}
                label={copy.participation}
                required={!listing}
                value={form.sellerDeclaration ?? ''}
                onChange={(e) =>
                  patch({
                    sellerDeclaration: e.target
                      .value as FormState['sellerDeclaration'],
                  })
                }
              >
                <option disabled value="">
                  {copy.participation}
                </option>
                <option value="owner">{copy.owner}</option>
                <option value="agent">{copy.agent}</option>
              </Select>
              {form.sellerDeclaration === 'agent' ? (
                <p className="rounded-ui bg-amber-50 p-3 text-sm text-warning">
                  {copy.declaredAgent}
                </p>
              ) : null}
            </div>
          ) : null}
          {step === 1 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                id="listing-size"
                error={issueFor('listing-size')}
                label={copy.size}
                min="10"
                type="number"
                value={form.sizeSqm}
                onChange={(e) => patch({ sizeSqm: Number(e.target.value) })}
              />
              <Input
                label={copy.bedrooms}
                min="0"
                type="number"
                value={form.bedrooms}
                onChange={(e) => patch({ bedrooms: Number(e.target.value) })}
              />
              <Input
                label={copy.bathrooms}
                min="0"
                type="number"
                value={form.bathrooms}
                onChange={(e) => patch({ bathrooms: Number(e.target.value) })}
              />
              <Select
                label={copy.finishing}
                value={form.finishingLevel}
                onChange={(e) =>
                  patch({ finishingLevel: e.target.value as FinishingLevel })
                }
              >
                {Object.values(FinishingLevel).map((v) => (
                  <option value={v} key={v}>
                    {finishingLevelLabel(locale, v)}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
          {step === 2 ? (
            <>
              <p className="rounded-ui bg-surface-muted p-3 text-sm text-ink-muted">
                {copy.locationHint}
              </p>
              <ListingCreateMap
                lat={form.location.lat}
                lng={form.location.lng}
                onChange={(location) => patch({ location })}
              />
              {issueFor('listing-location') ? (
                <p className="text-sm font-medium text-danger" role="alert">
                  {issueFor('listing-location')}
                </p>
              ) : null}
              <Select
                label={copy.precision}
                value={form.publicLocationMode}
                onChange={(e) =>
                  patch({
                    publicLocationMode: e.target
                      .value as FormState['publicLocationMode'],
                  })
                }
              >
                <option value="approximate">{copy.approximate}</option>
                <option value="area_only">{copy.areaOnly}</option>
              </Select>
            </>
          ) : null}
          {step === 3 ? (
            <>
              <p className="text-sm text-ink-muted">{copy.photosHint}</p>
              <PhotoUpload
                files={files}
                onChange={setFiles}
                copy={{
                  prompt: copy.photoPrompt,
                  hint: copy.photoLimit,
                  remove: copy.removePhoto,
                  moveUp: copy.movePhotoUp,
                  moveDown: copy.movePhotoDown,
                }}
              />
            </>
          ) : null}
          {step === 4 ? (
            <div className="grid gap-4">
              <Input
                id="listing-title-ar"
                error={issueFor('listing-title-ar')}
                label={copy.title}
                required
                value={form.titleAr}
                onChange={(e) => patch({ titleAr: e.target.value })}
              />
              <label className="space-y-1.5" htmlFor="listing-description-ar">
                <span className="block text-sm font-semibold">
                  {copy.description} *
                </span>
                <textarea
                  aria-describedby={
                    issueFor('listing-description-ar')
                      ? 'listing-description-ar-error'
                      : undefined
                  }
                  aria-invalid={
                    Boolean(issueFor('listing-description-ar')) || undefined
                  }
                  className={`min-h-32 w-full rounded-ui border bg-surface-raised p-3 ${issueFor('listing-description-ar') ? 'border-danger' : 'border-border'}`}
                  id="listing-description-ar"
                  value={form.descriptionAr}
                  onChange={(e) => patch({ descriptionAr: e.target.value })}
                />
                {issueFor('listing-description-ar') ? (
                  <p
                    className="text-sm font-medium text-danger"
                    id="listing-description-ar-error"
                  >
                    {issueFor('listing-description-ar')}
                  </p>
                ) : null}
              </label>
              <Input
                label={copy.titleEn}
                value={form.titleEn}
                onChange={(e) => patch({ titleEn: e.target.value })}
              />
              <label className="space-y-1.5">
                <span className="block text-sm font-semibold">
                  {copy.descriptionEn}
                </span>
                <textarea
                  className="min-h-28 w-full rounded-ui border border-border bg-surface-raised p-3"
                  value={form.descriptionEn}
                  onChange={(e) => patch({ descriptionEn: e.target.value })}
                />
              </label>
              <Input
                id="listing-price"
                error={issueFor('listing-price')}
                label={copy.price}
                min="1"
                type="number"
                value={form.priceEgp}
                onChange={(e) => patch({ priceEgp: Number(e.target.value) })}
              />
            </div>
          ) : null}
        </div>
        <div className="sticky bottom-0 z-10 -mx-6 mt-8 flex items-center justify-between border-t border-border bg-surface-raised px-6 pb-4 pt-5 shadow-[0_-8px_20px_rgba(42,36,30,0.08)] md:static md:mx-0 md:bg-transparent md:px-0 md:pb-0 md:shadow-none">
          <Button
            disabled={step === 0 || busy}
            onClick={() => setStep((s) => s - 1)}
            variant="secondary"
          >
            {copy.back}
          </Button>
          {step < labels.length - 1 ? (
            <Button onClick={advanceStep}>{copy.next}</Button>
          ) : (
            <Button loading={busy} onClick={() => void saveAndSubmit}>
              {copy.submit}
            </Button>
          )}
        </div>
        <p
          aria-live="polite"
          className="mt-3 text-sm text-ink-muted"
          role="status"
        >
          {draftStatus === 'restored'
            ? copy.restoringDraft
            : draftStatus === 'saved'
              ? copy.autosaved
              : null}
        </p>
      </Card>
    </main>
  );
}
