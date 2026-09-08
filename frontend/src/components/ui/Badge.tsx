import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?:
    'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'glass';
  size?: 'sm' | 'md';
  icon?: ReactNode;
};

const tones = {
  neutral: 'bg-surface-muted text-ink-muted',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-primary-soft text-primary',
  brand: 'bg-primary text-white',
  // Over photography, where a flat tint would disappear.
  glass: 'glass text-ink',
};

const sizes = {
  sm: 'min-h-6 gap-1 px-2 text-[0.68rem]',
  md: 'min-h-7 gap-1.5 px-2.5 text-xs',
};

export function Badge({
  className = '',
  tone = 'neutral',
  size = 'md',
  icon,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={`inline-flex items-center rounded-pill font-semibold leading-none ${tones[tone]} ${sizes[size]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
