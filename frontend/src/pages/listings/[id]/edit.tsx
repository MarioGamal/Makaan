import { zodResolver } from '@hookform/resolvers/zod';
import { FinishingLevel, PropertyType } from '@makaan/shared/constants/enums';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { ListingCreateMap } from '../../../components/listing/ListingCreateMap';
import { PhotoUpload } from '../../../components/listing/PhotoUpload';
import {
  deleteListingPhoto,
  getSellerListings,
  updateListing,
  uploadPhotos,
  type SellerManagedListing,
} from '../../../services/listings.service';

const cairoBounds = { minLat: 29.5, maxLat: 31.5, minLng: 28.9, maxLng: 32.5 };

const listingSchema = z.object({
  purpose: z.enum(['sale', 'rent']),
  propertyType: z.nativeEnum(PropertyType),
  sizeSqm: z.coerce.number().min(10),
  bedrooms: z.coerce.number().min(0),
  bathrooms: z.coerce.number().min(0),
  finishingLevel: z.nativeEnum(FinishingLevel),
  priceEgp: z.coerce.number().min(100000),
  description: z.string().optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
});

type ListingFormValues = z.infer<typeof listingSchema>;

const defaultValues: ListingFormValues = {
  purpose: 'sale',
  propertyType: PropertyType.APARTMENT,
  sizeSqm: 120,
  bedrooms: 2,
  bathrooms: 1,
  finishingLevel: FinishingLevel.FULLY_FINISHED,
  priceEgp: 2500000,
  description: '',
  location: {
    lat: 30.0444,
    lng: 31.2357,
  },
};

const steps = ['Purpose & Type', 'Specs', 'Location', 'Photos', 'Price'];

function isWithinCairo(lat: number, lng: number) {
  return (
    lat >= cairoBounds.minLat &&
    lat <= cairoBounds.maxLat &&
    lng >= cairoBounds.minLng &&
    lng <= cairoBounds.maxLng
  );
}

export default function ListingEditPage() {
  const router = useRouter();
  const listingId = typeof router.query.id === 'string' ? router.query.id : null;
  const [listing, setListing] = useState<SellerManagedListing | null>(null);
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues,
  });

  const values = form.watch();
  const progress = useMemo(() => ((step + 1) / steps.length) * 100, [step]);

  useEffect(() => {
    if (!listingId) {
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const response = await getSellerListings();
        const currentListing = response.listings.find((item) => item.id === listingId) ?? null;

        if (!currentListing) {
          setPageError('Listing not found.');
          return;
        }

        if (!['draft', 'rejected'].includes(currentListing.status)) {
          setPageError('Only draft or rejected listings can be edited.');
          return;
        }

        setListing(currentListing);
        form.reset({
          purpose: currentListing.purpose,
          propertyType: currentListing.propertyType as PropertyType,
          sizeSqm: currentListing.sizeSqm,
          bedrooms: currentListing.bedrooms,
          bathrooms: currentListing.bathrooms,
          finishingLevel: currentListing.finishingLevel as FinishingLevel,
          priceEgp: currentListing.priceEgp,
          description: currentListing.description ?? '',
          location: currentListing.location,
        });
      } catch (error) {
        const payload = error as { message?: string };
        setPageError(payload.message ?? 'Unable to load listing details.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [form, listingId]);

  const handleDeleteExistingPhoto = async (photoId: string) => {
    if (!listingId || !listing) {
      return;
    }

    await deleteListingPhoto(listingId, photoId);
    setListing({
      ...listing,
      thumbnailUrl:
        listing.photos.find((photo) => photo.id !== photoId)?.url ?? null,
      photos: listing.photos.filter((photo) => photo.id !== photoId),
    });
  };

  const onSubmit = form.handleSubmit(async (data) => {
    setPhotoError(null);

    if (!listingId || !listing) {
      return;
    }

    if (!isWithinCairo(data.location.lat, data.location.lng)) {
      form.setError('location', { message: 'Map pin is outside Cairo boundaries' });
      return;
    }

    const totalPhotoCount = listing.photos.length + files.length;
    if (totalPhotoCount < 3) {
      setPhotoError('Minimum 3 total photos are required before resubmission.');
      setStep(3);
      return;
    }

    if (totalPhotoCount > 10) {
      setPhotoError('A listing can have up to 10 total photos.');
      setStep(3);
      return;
    }

    setSubmitting(true);
    try {
      await updateListing(listingId, data);
      if (files.length > 0) {
        await uploadPhotos(listingId, files);
      }
      await updateListing(listingId, { ...data, submit: true });
      await router.push(`/listings/submitted?listingId=${listingId}`);
    } catch (error) {
      const payload = error as {
        validationErrors?: Array<{ field: string; message: string }>;
        message?: string;
      };
      payload.validationErrors?.forEach((validationError) => {
        if (validationError.field === 'location') {
          form.setError('location', { message: validationError.message });
        }
        if (validationError.field === 'photos') {
          setPhotoError(validationError.message);
        }
      });
      if (payload.message && !payload.validationErrors?.length) {
        setPageError(payload.message);
      }
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <ProtectedRoute>
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-8">
        <div className="rounded-[2rem] border border-ink/10 bg-white p-6 shadow-xl">
          {loading ? (
            <p className="text-sm text-ink/60">Loading listing editor...</p>
          ) : pageError ? (
            <p className="text-sm text-clay">{pageError}</p>
          ) : listing ? (
            <>
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between text-sm text-ink/60">
                  <span>Edit Listing</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-2 rounded-full bg-sand">
                  <div
                    className="h-2 rounded-full bg-oasis transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-ink/50">
                  {steps.map((label, index) => (
                    <span key={label}>{index === step ? `[${label}]` : label}</span>
                  ))}
                </div>
              </div>

              <form className="space-y-6" onSubmit={onSubmit}>
                {step === 0 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <label>
                      <span className="mb-2 block text-sm font-medium">Purpose</span>
                      <select className="w-full rounded-2xl border border-ink/10 px-4 py-3" {...form.register('purpose')}>
                        <option value="sale">Sale</option>
                        <option value="rent">Rent</option>
                      </select>
                    </label>
                    <label>
                      <span className="mb-2 block text-sm font-medium">Property type</span>
                      <select className="w-full rounded-2xl border border-ink/10 px-4 py-3" {...form.register('propertyType')}>
                        {Object.values(PropertyType).map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}

                {step === 1 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <input className="rounded-2xl border border-ink/10 px-4 py-3" placeholder="Size in sqm" type="number" {...form.register('sizeSqm')} />
                    <input className="rounded-2xl border border-ink/10 px-4 py-3" placeholder="Bedrooms" type="number" {...form.register('bedrooms')} />
                    <input className="rounded-2xl border border-ink/10 px-4 py-3" placeholder="Bathrooms" type="number" {...form.register('bathrooms')} />
                    <select className="rounded-2xl border border-ink/10 px-4 py-3" {...form.register('finishingLevel')}>
                      {Object.values(FinishingLevel).map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <p className="text-sm text-ink/70">Update your property pin inside Cairo.</p>
                    <ListingCreateMap
                      lat={values.location.lat}
                      lng={values.location.lng}
                      onChange={(location) => form.setValue('location', location, { shouldValidate: true })}
                    />
                    <p className="text-sm text-clay">{form.formState.errors.location?.message}</p>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {listing.photos.map((photo) => (
                        <div className="rounded-2xl border border-ink/10 bg-sand p-3" key={photo.id}>
                          <img alt={listing.title} className="h-32 w-full rounded-xl object-cover" src={photo.url} />
                          <button
                            className="mt-3 text-sm text-clay"
                            onClick={() => void handleDeleteExistingPhoto(photo.id)}
                            type="button"
                          >
                            Remove existing photo
                          </button>
                        </div>
                      ))}
                    </div>
                    <PhotoUpload
                      files={files}
                      onChange={(nextFiles) => {
                        setFiles(nextFiles);
                        if (listing.photos.length + nextFiles.length >= 3) {
                          setPhotoError(null);
                        }
                      }}
                    />
                    {photoError ? <p className="text-sm text-clay">{photoError}</p> : null}
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4">
                    <input className="w-full rounded-2xl border border-ink/10 px-4 py-3" placeholder="Price in EGP" type="number" {...form.register('priceEgp')} />
                    <textarea className="min-h-32 w-full rounded-2xl border border-ink/10 px-4 py-3" placeholder="Describe the property" {...form.register('description')} />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button
                    className="rounded-full border border-ink/10 px-4 py-3 text-sm font-semibold"
                    disabled={step === 0}
                    onClick={() => setStep((current) => Math.max(0, current - 1))}
                    type="button"
                  >
                    Back
                  </button>
                  {step < steps.length - 1 ? (
                    <button
                      className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white"
                      onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))}
                      type="button"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      className="rounded-full bg-ink px-4 py-3 text-sm font-semibold text-white"
                      disabled={submitting}
                      type="submit"
                    >
                      {submitting ? 'Resubmitting...' : 'Resubmit listing'}
                    </button>
                  )}
                </div>
              </form>
            </>
          ) : null}
        </div>
      </main>
    </ProtectedRoute>
  );
}
