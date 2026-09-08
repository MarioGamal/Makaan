import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type ButtonVariant =
  'primary' | 'secondary' | 'quiet' | 'ghost' | 'danger' | 'glass';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  /** Decorative glyph before the label; the label carries the meaning. */
  icon?: ReactNode;
  iconEnd?: ReactNode;
  /** Square control sized for an icon alone. Needs an accessible name. */
  iconOnly?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white shadow-ui hover:bg-primary-strong hover:shadow-panel',
  secondary:
    'border border-border bg-surface-raised text-ink shadow-xs hover:border-border-strong hover:bg-surface-muted',
  quiet: 'text-primary hover:bg-primary-soft',
  ghost: 'text-ink-muted hover:bg-surface-muted hover:text-ink',
  danger: 'bg-danger text-white shadow-ui hover:opacity-90',
  // Sits on photography or a scrolled header, and borrows the colour behind it.
  glass: 'glass text-ink shadow-ui hover:bg-surface-raised',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-tap px-3.5 text-sm',
  md: 'min-h-tap px-5 text-sm',
  lg: 'min-h-12 px-7 text-base',
};

const iconSizes: Record<ButtonSize, string> = {
  sm: 'min-h-tap w-tap px-0',
  md: 'min-h-tap w-tap px-0',
  lg: 'min-h-12 w-12 px-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className = '',
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      icon,
      iconEnd,
      iconOnly = false,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) {
    return (
      <button
        {...props}
        ref={ref}
        aria-busy={loading || undefined}
        className={`group/button inline-flex select-none items-center justify-center gap-2 rounded-pill font-semibold transition-[background-color,border-color,box-shadow,transform,opacity] duration-200 ease-soft active:translate-y-px disabled:pointer-events-none disabled:opacity-50 ${
          variants[variant]
        } ${iconOnly ? iconSizes[size] : sizes[size]} ${
          fullWidth ? 'w-full' : ''
        } ${className}`}
        disabled={disabled || loading}
        type={type}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-e-transparent"
          />
        ) : (
          icon
        )}
        {children}
        {iconEnd}
      </button>
    );
  },
);
