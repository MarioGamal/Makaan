import { PropertyType } from '@makaan/shared/constants/enums';

export type ListingFilters = {
  area_id?: string;
  purpose?: 'sale' | 'rent';
  property_type?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  seller_type?: 'owner' | 'agent';
};

const propertyTypes = Object.values(PropertyType);

export function FilterPanel({
  filters,
  onChange,
  onClear,
}: {
  filters: ListingFilters;
  onChange: (nextFilters: ListingFilters) => void;
  onClear: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-3xl border border-ink/10 bg-white/85 p-4 shadow-sm backdrop-blur md:grid-cols-7">
      <select
        className="rounded-2xl border border-ink/10 px-3 py-2"
        onChange={(event) =>
          onChange({
            ...filters,
            purpose: (event.target.value || undefined) as 'sale' | 'rent' | undefined,
          })
        }
        value={filters.purpose ?? ''}
      >
        <option value="">Purpose</option>
        <option value="sale">Sale</option>
        <option value="rent">Rent</option>
      </select>
      <select
        className="rounded-2xl border border-ink/10 px-3 py-2"
        onChange={(event) =>
          onChange({
            ...filters,
            property_type: event.target.value || undefined,
          })
        }
        value={filters.property_type ?? ''}
      >
        <option value="">Property Type</option>
        {propertyTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
      <input
        className="rounded-2xl border border-ink/10 px-3 py-2"
        min={0}
        onChange={(event) =>
          onChange({
            ...filters,
            min_price: event.target.value ? Number(event.target.value) : undefined,
          })
        }
        placeholder="Min price"
        type="number"
        value={filters.min_price ?? ''}
      />
      <input
        className="rounded-2xl border border-ink/10 px-3 py-2"
        min={0}
        onChange={(event) =>
          onChange({
            ...filters,
            max_price: event.target.value ? Number(event.target.value) : undefined,
          })
        }
        placeholder="Max price"
        type="number"
        value={filters.max_price ?? ''}
      />
      <input
        className="rounded-2xl border border-ink/10 px-3 py-2"
        min={0}
        onChange={(event) =>
          onChange({
            ...filters,
            bedrooms: event.target.value ? Number(event.target.value) : undefined,
          })
        }
        placeholder="Bedrooms"
        type="number"
        value={filters.bedrooms ?? ''}
      />
      <input
        className="rounded-2xl border border-ink/10 px-3 py-2"
        min={0}
        onChange={(event) =>
          onChange({
            ...filters,
            bathrooms: event.target.value ? Number(event.target.value) : undefined,
          })
        }
        placeholder="Bathrooms"
        type="number"
        value={filters.bathrooms ?? ''}
      />
      <div className="flex gap-2">
        <select
          className="flex-1 rounded-2xl border border-ink/10 px-3 py-2"
          onChange={(event) =>
            onChange({
              ...filters,
              seller_type: (event.target.value || undefined) as 'owner' | 'agent' | undefined,
            })
          }
          value={filters.seller_type ?? ''}
        >
          <option value="">Seller</option>
          <option value="owner">Owner</option>
          <option value="agent">Agent</option>
        </select>
        <button
          className="rounded-2xl border border-ink/10 px-4 py-2 text-sm font-medium"
          onClick={onClear}
          type="button"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

