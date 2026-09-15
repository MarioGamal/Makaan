import { forwardRef, useId, type SelectHTMLAttributes } from 'react';

import { ChevronIcon } from './icons';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      id,
      label,
      hint,
      error,
      className = '',
      containerClassName = '',
      required,
      children,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const hintId = hint ? `${selectId}-hint` : undefined;
    const errorId = error ? `${selectId}-error` : undefined;
    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {label ? (
          <label
            className="block text-sm font-semibold text-ink"
            htmlFor={selectId}
          >
            {label}
            {required ? <span aria-hidden="true"> *</span> : null}
          </label>
        ) : null}
        <div className="relative">
          <select
            {...props}
            ref={ref}
            id={selectId}
            required={required}
            aria-describedby={
              [hintId, errorId].filter(Boolean).join(' ') || undefined
            }
            aria-invalid={Boolean(error) || undefined}
            className={`min-h-tap w-full appearance-none rounded-ui border bg-surface-raised py-2 ps-3.5 pe-11 text-ink transition-colors duration-200 focus-visible:border-primary ${
              error
                ? 'border-danger'
                : 'border-border hover:border-border-strong'
            } ${className}`}
          >
            {children}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-1.5 end-1.5 grid w-8 place-items-center rounded-xs text-ink-subtle"
          >
            <ChevronIcon className="size-4" />
          </span>
        </div>
        {hint ? (
          <p className="text-sm text-ink-muted" id={hintId}>
            {hint}
          </p>
        ) : null}
        {error ? (
          <p
            className="text-sm font-medium text-danger"
            id={errorId}
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
