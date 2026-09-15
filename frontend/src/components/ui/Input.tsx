import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
  /** Decorative leading glyph; it never replaces the label. */
  icon?: ReactNode;
  /** Trailing unit or affix, such as EGP or m². */
  suffix?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    hint,
    error,
    className = '',
    containerClassName = '',
    icon,
    suffix,
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
      {/*
       * The ring lives on the shell so the icon and the suffix are inside the
       * focus outline; the input itself drops its own outline.
       */}
      <div
        className={`flex min-h-tap items-center gap-2 rounded-ui border bg-surface-raised ps-3.5 pe-3 transition-colors duration-200 focus-within:border-primary ${
          error ? 'border-danger' : 'border-border hover:border-border-strong'
        }`}
      >
        {icon ? (
          <span className="shrink-0 text-ink-subtle [&>svg]:size-[1.05rem]">
            {icon}
          </span>
        ) : null}
        <input
          {...props}
          ref={ref}
          id={inputId}
          required={required}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error) || undefined}
          className={`w-full min-w-0 bg-transparent py-2 text-ink outline-none focus-visible:shadow-none ${className}`}
        />
        {suffix ? (
          <span className="shrink-0 text-xs font-semibold text-ink-subtle">
            {suffix}
          </span>
        ) : null}
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
});
