import { PropertyType } from '@makaan/shared/constants/enums';

import { Button, Input, Select } from '../ui';
import { propertyTypeLabel, type Locale } from '../../i18n';
import type { ListingSearchParams } from '../../services/listings.service';

export type ListingFilters = Omit<
  ListingSearchParams,
  'locale' | 'page' | 'pageSize' | 'areaId' | 'bbox'
>;

type Copy = Record<string, string>;

export function FilterPanel({
  filters,
  copy,
  locale,
  onChange,
  onClear,
}: {
  filters: ListingFilters;
  copy: Copy;
  locale: Locale;
  onChange: (filters: ListingFilters) => void;
  onClear: () => void;
}) {
  const numeric = (
    key:
      | 'priceMin'
      | 'priceMax'
      | 'sizeMin'
      | 'sizeMax'
      | 'bedroomsMin'
      | 'bedroomsMax',
    value: string,
  ) => onChange({ ...filters, [key]: value ? Number(value) : undefined });
  const activeFilters = Object.entries(filters).filter(
    ([key, value]) =>
      key !== 'sort' &&
      value !== undefined &&
      (!Array.isArray(value) || value.length > 0),
  );
  return (
    <section
      aria-label={copy.filters}
      className="grid gap-3 rounded-panel border border-border bg-surface p-4 shadow-ui md:grid-cols-2 xl:grid-cols-4"
    >
      <Select
        aria-label={copy.purpose}
        onChange={(event) =>
          onChange({
            ...filters,
            purpose: (event.target.value ||
              undefined) as ListingFilters['purpose'],
          })
        }
        value={filters.purpose ?? ''}
      >
        <option value="">{copy.anyPurpose}</option>
        <option value="sale">{copy.sale}</option>
        <option value="long_term_rent">{copy.rent}</option>
      </Select>
      <Select
        aria-label={copy.propertyType}
        onChange={(event) =>
          onChange({
            ...filters,
            propertyType: event.target.value ? [event.target.value] : undefined,
          })
        }
        value={filters.propertyType?.[0] ?? ''}
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
        min={0}
        onChange={(event) => numeric('priceMin', event.target.value)}
        placeholder={copy.minPrice}
        type="number"
        value={filters.priceMin ?? ''}
      />
      <Input
        aria-label={copy.maxPrice}
        min={0}
        onChange={(event) => numeric('priceMax', event.target.value)}
        placeholder={copy.maxPrice}
        type="number"
        value={filters.priceMax ?? ''}
      />
      <Input
        aria-label={copy.minSize}
        min={0}
        onChange={(event) => numeric('sizeMin', event.target.value)}
        placeholder={copy.minSize}
        type="number"
        value={filters.sizeMin ?? ''}
      />
      <Input
        aria-label={copy.maxSize}
        min={0}
        onChange={(event) => numeric('sizeMax', event.target.value)}
        placeholder={copy.maxSize}
        type="number"
        value={filters.sizeMax ?? ''}
      />
      <Input
        aria-label={copy.minBedrooms}
        min={0}
        onChange={(event) => numeric('bedroomsMin', event.target.value)}
        placeholder={copy.minBedrooms}
        type="number"
        value={filters.bedroomsMin ?? ''}
      />
      <Input
        aria-label={copy.maxBedrooms}
        min={0}
        onChange={(event) => numeric('bedroomsMax', event.target.value)}
        placeholder={copy.maxBedrooms}
        type="number"
        value={filters.bedroomsMax ?? ''}
      />
      <Select
        aria-label={copy.participation}
        onChange={(event) =>
          onChange({
            ...filters,
            participation: (event.target.value ||
              undefined) as ListingFilters['participation'],
          })
        }
        value={filters.participation ?? ''}
      >
        <option value="">{copy.anySeller}</option>
        <option value="verified_owner">{copy.verifiedOwner}</option>
        <option value="owner_not_verified">{copy.owner}</option>
        <option value="declared_agent">{copy.agent}</option>
      </Select>
      <Select
        aria-label={copy.sort}
        onChange={(event) =>
          onChange({
            ...filters,
            sort: event.target.value as ListingFilters['sort'],
          })
        }
        value={filters.sort ?? 'newest'}
      >
        <option value="newest">{copy.newest}</option>
        <option value="price_asc">{copy.priceAsc}</option>
        <option value="price_desc">{copy.priceDesc}</option>
      </Select>
      <Button onClick={onClear} variant="secondary">
        {copy.reset}
      </Button>
      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-4">
          {activeFilters.map(([key, value]) => (
            <button
              aria-label={`${copy.removeFilter}: ${filterLabel(key, value, copy, locale)}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-soft px-3 text-sm font-semibold text-primary-strong"
              key={key}
              onClick={() =>
                onChange({ ...filters, [key]: undefined } as ListingFilters)
              }
              type="button"
            >
              <span>
                {filterLabel(key, value, copy, locale)}
              </span>
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function filterLabel(
  key: string,
  value: unknown,
  copy: Copy,
  locale: Locale,
) {
  if (key === 'propertyType' && Array.isArray(value)) {
    return value.map((type) => propertyTypeLabel(locale, type)).join(', ');
  }
  const labels: Record<string, string> = {
    purpose: value === 'sale' ? copy.sale : copy.rent,
    participation:
      value === 'verified_owner'
        ? copy.verifiedOwner
        : value === 'declared_agent'
          ? copy.agent
          : copy.owner,
    priceMin: copy.minPrice,
    priceMax: copy.maxPrice,
    sizeMin: copy.minSize,
    sizeMax: copy.maxSize,
    bedroomsMin: copy.bedrooms,
  };
  return labels[key]
    ? `${labels[key]}: ${String(value)}`
    : String(value);
}
