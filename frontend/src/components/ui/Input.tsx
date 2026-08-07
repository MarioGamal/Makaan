import { forwardRef, useId, type InputHTMLAttributes } from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    hint,
    error,
    className = '',
    containerClassName = '',
    required,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label ? (
        <label
          className="block text-sm font-semibold text-ink"
          htmlFor={inputId}
        >
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </label>
      ) : null}
      <input
        {...props}
        ref={ref}
        id={inputId}
        required={required}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error) || undefined}
        className={`w-full rounded-ui border bg-surface-raised px-3 text-ink placeholder:text-ink-muted focus-visible:border-primary ${error ? 'border-danger' : 'border-border'} ${className}`}
      />
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
});
