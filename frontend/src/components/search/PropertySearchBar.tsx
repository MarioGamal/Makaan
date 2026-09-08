import { useRouter } from 'next/router';
import { useState } from 'react';

import { PropertyType } from '@makaan/shared/constants/enums';
import type { PublicArea } from '@makaan/shared/types/marketplace';

import { catalogues, propertyTypeLabel } from '../../i18n';
import type { PropertyFilters } from '../../hooks/usePropertiesSearch';
import { useLocale } from '../layout/LocaleProvider';
import { Button, Input, SegmentedControl, Select } from '../ui';
import { SearchIcon } from '../ui/icons';

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

  const [purpose, setPurpose] = useState<PropertyFilters['purpose']>(undefined);
  const [area, setArea] = useState<PublicArea>();
  const [propertyType, setPropertyType] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

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
      className={`rounded-panel p-3 md:p-4 ${
        variant === 'glass'
          ? 'glass-strong shadow-float'
          : 'border border-border bg-surface shadow-panel'
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
          {
            value: undefined,
            label: copy.anyPurpose,
            testId: 'search-purpose-any',
          },
          { value: 'sale', label: copy.sale, testId: 'search-purpose-sale' },
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
        <Select
          aria-label={copy.propertyType}
          data-testid="search-property-type"
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
        <Button
          className="md:col-span-2 xl:col-span-1"
          data-testid="search-submit"
          icon={<SearchIcon className="size-[1.1rem]" />}
          size="lg"
          type="submit"
        >
          {copy.search}
        </Button>
      </div>
    </form>
  );
}
