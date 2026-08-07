import type { HTMLAttributes } from 'react';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
};
const tones = {
  neutral: 'bg-surface-muted text-ink',
  success: 'bg-primary-soft text-success',
  warning: 'bg-amber-100 text-warning',
  danger: 'bg-red-100 text-danger',
  info: 'bg-teal-100 text-primary-strong',
};
export function Badge({
  className = '',
  tone = 'neutral',
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={`inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-bold ${tones[tone]} ${className}`}
    />
  );
}
