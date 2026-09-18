import { useRouter } from 'next/router';
import { useState } from 'react';

import { PropertyType } from '@makaan/shared/constants/enums';
import type { PublicArea } from '@makaan/shared/types/marketplace';

import { catalogues, propertyTypeLabel } from '../../i18n';
import type { PropertyFilters } from '../../hooks/usePropertiesSearch';
import { useLocale } from '../layout/LocaleProvider';
import { Button, Input, SegmentedControl, Select } from '../ui';
import { BedIcon, ChevronIcon, SearchIcon, SlidersIcon } from '../ui/icons';

import { AreaSearchBar } from './AreaSearchBar';

const positiveNumber = (value: string) => {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

/**
 * The headline search: purpose, place, type and budget in one pass.
 *
 * It composes a query and hands it to `/browse` rather than fetching, so the
 * result is a shareable URL and the results page renders on the server.
 */
export function PropertySearchBar({
  variant = 'glass',
}: {
  /** `glass` floats over the hero photograph; `panel` sits on the canvas. */
  variant?: 'glass' | 'panel';
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const copy = catalogues[locale].marketplace;

  const [purpose, setPurpose] = useState<PropertyFilters['purpose']>('sale');
  const [area, setArea] = useState<PublicArea>();
  const [propertyType, setPropertyType] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFilterCount = [
    Boolean(propertyType),
    Boolean(priceMin),
    Boolean(priceMax),
  ].filter(Boolean).length;

  const submit = () => {
    const query: Record<string, string> = {};
    if (purpose) query.purpose = purpose;
    if (area) query.areaId = area.id;
    if (propertyType) query.propertyType = propertyType;
    const min = positiveNumber(priceMin);
    const max = positiveNumber(priceMax);
    // A reversed range is a slip, not an empty result set.
    if (min !== undefined) query.priceMin = String(Math.min(min, max ?? min));
    if (max !== undefined) query.priceMax = String(Math.max(max, min ?? max));
    void router.push({ pathname: '/browse', query });
  };

  return (
    <form
      className={`rounded-card p-3.5 md:p-5 transition-all duration-200 ${
        variant === 'glass'
          ? 'border border-border/80 bg-surface/95 dark:bg-surface-raised/95 shadow-float backdrop-blur-md'
          : 'border border-border/80 bg-surface shadow-float'
      }`}
      data-testid="property-search"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      role="search"
    >
      <SegmentedControl
        className="mb-3"
        label={copy.purpose}
        onChange={setPurpose}
        options={[
          { value: 'sale', label: copy.buy, testId: 'search-purpose-sale' },
          {
            value: 'long_term_rent',
            label: copy.rent,
            testId: 'search-purpose-rent',
          },
        ]}
        value={purpose}
      />

      <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_auto]">
        <AreaSearchBar
          label={copy.area}
          onSelect={(selected) => setArea(selected)}
          testId="search-area"
        />

        {/* Secondary filters: collapsible on low screens, expanded into desktop grid */}
        <div
          className={`${
            isExpanded ? 'grid gap-2.5' : 'hidden'
          } md:contents`}
          id="hero-secondary-filters"
        >
          <Select
            aria-label={copy.propertyType}
            data-testid="search-property-type"
            icon={<BedIcon className="size-4" />}
            onChange={(event) => setPropertyType(event.target.value)}
            value={propertyType}
          >
            <option value="">{copy.anyType}</option>
            {Object.values(PropertyType).map((type) => (
              <option key={type} value={type}>
                {propertyTypeLabel(locale, type)}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-2 gap-2.5 md:contents">
            <Input
              aria-label={copy.minPrice}
              data-testid="search-price-min"
              inputMode="numeric"
              min={0}
              onChange={(event) => setPriceMin(event.target.value)}
              placeholder={copy.minPrice}
              suffix={locale === 'ar' ? 'ج.م' : 'EGP'}
              type="number"
              value={priceMin}
            />
            <Input
              aria-label={copy.maxPrice}
              data-testid="search-price-max"
              inputMode="numeric"
              min={0}
              onChange={(event) => setPriceMax(event.target.value)}
              placeholder={copy.maxPrice}
              suffix={locale === 'ar' ? 'ج.م' : 'EGP'}
              type="number"
              value={priceMax}
            />
          </div>
        </div>

        {/* Action controls: On mobile shows [Toggle Filters] + [Search], on desktop unwraps Search to end */}
        <div className="flex items-center gap-2.5 md:contents">
          <button
            aria-controls="hero-secondary-filters"
            aria-expanded={isExpanded}
            className="inline-flex min-h-tap flex-1 items-center justify-center gap-1.5 rounded-pill border border-border/80 bg-surface-raised px-3 py-2 text-xs font-semibold text-ink shadow-sm transition-colors hover:bg-surface-soft active:scale-[0.98] md:hidden"
            onClick={() => setIsExpanded((prev) => !prev)}
            type="button"
          >
            <SlidersIcon className="size-3.5 text-primary" />
            <span>{copy.filters}</span>
            {activeFilterCount > 0 && (
              <span className="grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
            <ChevronIcon
              className={`size-3 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </button>

          <Button
            className="flex-1 md:w-auto md:col-span-2 xl:col-span-1"
            data-testid="search-submit"
            icon={<SearchIcon className="size-[1.1rem]" />}
            size="lg"
            type="submit"
          >
            {copy.search}
          </Button>
        </div>
      </div>
    </form>
  );
}
