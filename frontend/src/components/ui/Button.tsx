import { forwardRef, type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
};

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-strong',
  secondary:
    'border border-border bg-surface-raised text-ink hover:bg-surface-muted',
  quiet: 'text-primary hover:bg-primary-soft',
  danger: 'bg-danger text-white hover:opacity-90',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-3 text-sm',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className = '',
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
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
        className={`inline-flex items-center justify-center gap-2 rounded-ui font-semibold shadow-ui transition-colors focus-visible:relative disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        disabled={disabled || loading}
        type={type}
      >
        {loading ? (
          <span
            aria-hidden="true"
            className="size-4 animate-spin rounded-full border-2 border-current border-e-transparent"
          />
        ) : null}
        {children}
      </button>
    );
  },
);
