import { forwardRef, useId, type SelectHTMLAttributes } from 'react';

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
            className={`min-h-12 w-full appearance-none rounded-xl border bg-surface-raised py-2 ps-4 pe-12 text-ink shadow-ui transition hover:border-primary/45 focus-visible:border-primary ${error ? 'border-danger' : 'border-border'} ${className}`}
          >
            {children}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-1 end-1 grid w-10 place-items-center rounded-lg bg-surface-muted text-primary"
          >
            <svg
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                d="m7 10 5 5 5-5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
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
