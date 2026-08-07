import type { HTMLAttributes } from 'react';

export type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'article' | 'section' | 'div';
  padding?: 'none' | 'sm' | 'md' | 'lg';
};
const padding = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-6' };
export function Card({
  as: Component = 'section',
  padding: cardPadding = 'md',
  className = '',
  ...props
}: CardProps) {
  return (
    <Component
      {...props}
      className={`rounded-panel border border-border bg-surface shadow-ui ${padding[cardPadding]} ${className}`}
    />
  );
}
