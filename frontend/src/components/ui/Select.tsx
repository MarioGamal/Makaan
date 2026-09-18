import {
  forwardRef,
  useId,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';

import { ChevronIcon } from './icons';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
  icon?: ReactNode;
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
      icon,
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
      <div
        className={`${label || hint || error ? 'space-y-1.5' : ''} ${containerClassName}`}
      >
        {label ? (
          <label
            className="block text-sm font-semibold text-ink"
            htmlFor={selectId}
          >
            {label}
            {required ? <span aria-hidden="true"> *</span> : null}
          </label>
        ) : null}
        <div className="relative flex items-center">
          {icon ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 start-3.5 z-10 flex shrink-0 items-center text-ink-subtle [&>svg]:size-4"
            >
              {icon}
            </span>
          ) : null}
          <select
            {...props}
            ref={ref}
            id={selectId}
            required={required}
            aria-describedby={
              [hintId, errorId].filter(Boolean).join(' ') || undefined
            }
            aria-invalid={Boolean(error) || undefined}
            className={`min-h-tap h-11 w-full appearance-none rounded-ui border bg-surface-raised py-2.5 ${
              icon ? 'ps-10' : 'ps-3.5'
            } pe-10 text-sm text-ink cursor-pointer transition-colors duration-200 outline-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-border-strong [&>option]:bg-surface-raised [&>option]:text-ink dark:[&>option]:bg-[#182622] dark:[&>option]:text-[#eef4f2] ${
              error ? 'border-danger' : 'border-border'
            } ${className}`}
          >
            {children}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 end-3.5 flex items-center text-ink-subtle"
          >
            <ChevronIcon className="size-4 shrink-0" />
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
