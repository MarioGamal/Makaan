import type { HTMLAttributes } from 'react';

export type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'article' | 'section' | 'div' | 'aside' | 'li';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /**
   * `plain` is the default panel, `glass` floats over media, `raised` is for a
   * card that owns the page's attention, `flat` drops the shadow entirely.
   */
  tone?: 'plain' | 'glass' | 'raised' | 'flat';
  /** Adds the hover lift used by anything clickable. */
  interactive?: boolean;
};

const paddings = { none: '', sm: 'p-3', md: 'p-4 md:p-5', lg: 'p-6 md:p-7' };

const tones = {
  plain: 'border border-border bg-surface shadow-ui',
  glass: 'glass shadow-panel',
  raised: 'border border-border bg-surface-raised shadow-panel',
  flat: 'border border-border bg-surface',
};

export function Card({
  as: Component = 'section',
  padding: cardPadding = 'md',
  tone = 'plain',
  interactive = false,
  className = '',
  ...props
}: CardProps) {
  return (
    <Component
      {...props}
      className={`rounded-card transition duration-300 ease-soft ${tones[tone]} ${
        paddings[cardPadding]
      } ${
        interactive
          ? 'hover:-translate-y-0.5 hover:border-border-strong hover:shadow-panel'
          : ''
      } ${className}`}
    />
  );
}
