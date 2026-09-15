import type { ReactNode } from 'react';

export type SegmentedOption<Value> = {
  value: Value;
  label: string;
  icon?: ReactNode;
  testId?: string;
};

/**
 * A row of mutually exclusive choices — purpose, or list versus map.
 *
 * Rendered as buttons with `aria-pressed` rather than radios: the choice takes
 * effect immediately, and there is no form to submit.
 */
export function SegmentedControl<Value extends string | undefined>({
  label,
  options,
  value,
  onChange,
  className = '',
  size = 'md',
}: {
  label: string;
  options: SegmentedOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div
      aria-label={label}
      className={`inline-flex items-center gap-1 rounded-pill border border-border bg-surface-muted/70 p-1 ${className}`}
      role="group"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            aria-pressed={active}
            className={`inline-flex items-center justify-center gap-1.5 rounded-pill font-semibold transition-all duration-200 ease-soft ${
              size === 'sm'
                ? 'min-h-tap px-3 text-xs'
                : 'min-h-tap px-4 text-sm'
            } ${
              active
                ? 'bg-surface-raised text-ink shadow-ui'
                : 'text-ink-muted hover:text-ink'
            }`}
            data-testid={option.testId}
            key={option.label}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.icon}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
