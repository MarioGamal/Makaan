import { useEffect, useId, useRef, useState } from 'react';

import { PropertyType } from '@makaan/shared/constants/enums';

import type { PropertyFilters } from '../../hooks/usePropertiesSearch';
import { formatNumber, propertyTypeLabel, type Locale } from '../../i18n';
import { Badge, Button, Input, SegmentedControl, Select } from '../ui';
import { CloseIcon, SlidersIcon } from '../ui/icons';

type Copy = Record<string, string>;

/** Numeric fields are typed into, so they are drafted locally and debounced. */
const NUMERIC_KEYS = [
  'priceMin',
  'priceMax',
  'sizeMin',
  'sizeMax',
  'bedroomsMin',
  'bedroomsMax',
] as const;

type NumericKey = (typeof NUMERIC_KEYS)[number];
type Draft = Record<NumericKey, string>;

const COMMIT_DELAY_MS = 350;

const toDraft = (filters: PropertyFilters): Draft =>
  NUMERIC_KEYS.reduce((draft, key) => {
    draft[key] = filters[key] === undefined ? '' : String(filters[key]);
    return draft;
  }, {} as Draft);

export function FilterPanel({
  filters,
  copy,
  locale,
  activeCount,
  onChange,
  onClear,
}: {
  filters: PropertyFilters;
  copy: Copy;
  locale: Locale;
  activeCount: number;
  onChange: (patch: Partial<PropertyFilters>) => void;
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => toDraft(filters));
  const timerRef = useRef<number | undefined>(undefined);
  const panelId = useId();

  /*
   * Adopt filters that changed elsewhere — a chip removed, the URL replayed,
   * everything reset — but never while a debounce is in flight, or the field
   * would snap back to the committed value mid-keystroke.
   */
  useEffect(() => {
    if (timerRef.current !== undefined) return;
    setDraft(toDraft(filters));
  }, [filters]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const commitNumeric = (key: NumericKey, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = undefined;
      const parsed = value.trim() === '' ? undefined : Number(value);
      onChange({
        [key]:
          parsed !== undefined && Number.isFinite(parsed) && parsed >= 0
            ? parsed
            : undefined,
      });
    }, COMMIT_DELAY_MS);
  };

  const numericField = (
    key: NumericKey,
    label: string,
    suffix?: string,
    max?: number,
  ) => (
    <Input
      aria-label={label}
      data-testid={`filter-${key}`}
      inputMode="numeric"
      label={label}
      max={max}
      min={0}
      onChange={(event) => commitNumeric(key, event.target.value)}
      suffix={suffix}
      type="number"
      value={draft[key]}
    />
  );

  const chips = activeChips(filters, copy, locale);

  return (
    <section
      aria-label={copy.filters}
      className="rounded-panel border border-border bg-surface p-3 shadow-ui md:p-4"
      data-testid="filter-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          label={copy.purpose}
          onChange={(value) => onChange({ purpose: value })}
          options={[
            {
              value: undefined,
              label: copy.anyPurpose,
              testId: 'filter-purpose-any',
            },
            { value: 'sale', label: copy.sale, testId: 'filter-purpose-sale' },
            {
              value: 'long_term_rent',
              label: copy.rent,
              testId: 'filter-purpose-rent',
            },
          ]}
          value={filters.purpose}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Select
            aria-label={copy.sort}
            className="min-w-44"
            data-testid="filter-sort"
            onChange={(event) =>
              onChange({ sort: event.target.value as PropertyFilters['sort'] })
            }
            value={filters.sort ?? 'newest'}
          >
            <option value="newest">{copy.newest}</option>
            <option value="price_asc">{copy.priceAsc}</option>
            <option value="price_desc">{copy.priceDesc}</option>
          </Select>
          <Button
            aria-controls={panelId}
            aria-expanded={expanded}
            data-testid="toggle-filters"
            icon={<SlidersIcon className="size-[1.1rem]" />}
            onClick={() => setExpanded((current) => !current)}
            variant="secondary"
          >
            {expanded ? copy.hideFilters : copy.moreFilters}
            {activeCount > 0 ? (
              <Badge size="sm" tone="brand">
                {formatNumber(activeCount, locale)}
              </Badge>
            ) : null}
          </Button>
        </div>
      </div>

      {expanded ? (
        <div
          className="mt-4 grid animate-fade-up gap-3 border-t border-border pt-4 sm:grid-cols-2 xl:grid-cols-4"
          id={panelId}
        >
          <Select
            aria-label={copy.propertyType}
            data-testid="filter-property-type"
            label={copy.propertyType}
            onChange={(event) =>
              onChange({
                propertyType: event.target.value
                  ? [event.target.value]
                  : undefined,
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

          <Select
            aria-label={copy.participation}
            data-testid="filter-participation"
            label={copy.participation}
            onChange={(event) =>
              onChange({
                participation: (event.target.value ||
                  undefined) as PropertyFilters['participation'],
              })
            }
            value={filters.participation ?? ''}
          >
            <option value="">{copy.anySeller}</option>
            <option value="verified_owner">{copy.verifiedOwner}</option>
            <option value="owner_not_verified">{copy.owner}</option>
            <option value="declared_agent">{copy.agent}</option>
          </Select>

          {numericField(
            'priceMin',
            copy.minPrice,
            locale === 'ar' ? 'ج.م' : 'EGP',
          )}
          {numericField(
            'priceMax',
            copy.maxPrice,
            locale === 'ar' ? 'ج.م' : 'EGP',
          )}
          {numericField('sizeMin', copy.minSize, 'm²')}
          {numericField('sizeMax', copy.maxSize, 'm²')}
          {/* Both bounds, so "two bedrooms only" is expressible. */}
          {numericField('bedroomsMin', copy.minBedrooms, undefined, 20)}
          {numericField('bedroomsMax', copy.maxBedrooms, undefined, 20)}
        </div>
      ) : null}

      {chips.length > 0 ? (
        <div
          aria-label={copy.activeFilters}
          className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3"
          data-testid="active-filters"
        >
          {chips.map((chip) => (
            <button
              aria-label={`${copy.removeFilter}: ${chip.label}`}
              className="inline-flex min-h-tap items-center gap-1.5 rounded-pill bg-primary-soft px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
              data-testid={`remove-filter-${chip.key}`}
              key={chip.key}
              onClick={() => onChange({ [chip.key]: undefined })}
              type="button"
            >
              {chip.label}
              <CloseIcon className="size-3.5" />
            </button>
          ))}
          <Button
            data-testid="clear-filters"
            onClick={onClear}
            size="sm"
            variant="ghost"
          >
            {copy.reset}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function activeChips(filters: PropertyFilters, copy: Copy, locale: Locale) {
  const chips: { key: keyof PropertyFilters; label: string }[] = [];
  const push = (key: keyof PropertyFilters, label: string) =>
    chips.push({ key, label });

  if (filters.purpose)
    push('purpose', filters.purpose === 'sale' ? copy.sale : copy.rent);
  if (filters.propertyType?.length)
    push(
      'propertyType',
      filters.propertyType
        .map((type) => propertyTypeLabel(locale, type))
        .join(', '),
    );
  if (filters.participation)
    push(
      'participation',
      filters.participation === 'verified_owner'
        ? copy.verifiedOwner
        : filters.participation === 'declared_agent'
          ? copy.agent
          : copy.owner,
    );
  if (filters.areaId?.length)
    push(
      'areaId',
      `${copy.area} (${formatNumber(filters.areaId.length, locale)})`,
    );

  const numericLabels: Record<NumericKey, string> = {
    priceMin: copy.minPrice,
    priceMax: copy.maxPrice,
    sizeMin: copy.minSize,
    sizeMax: copy.maxSize,
    bedroomsMin: copy.minBedrooms,
    bedroomsMax: copy.maxBedrooms,
  };
  NUMERIC_KEYS.forEach((key) => {
    const value = filters[key];
    if (value === undefined) return;
    push(key, `${numericLabels[key]}: ${formatNumber(value, locale)}`);
  });

  return chips;
}
