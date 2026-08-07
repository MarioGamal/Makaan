import type { HTMLAttributes } from 'react';

export type LiveRegionProps = HTMLAttributes<HTMLDivElement> & {
  politeness?: 'polite' | 'assertive';
  atomic?: boolean;
};
export function LiveRegion({
  politeness = 'polite',
  atomic = true,
  className = 'sr-only',
  ...props
}: LiveRegionProps) {
  return (
    <div
      {...props}
      aria-atomic={atomic}
      aria-live={politeness}
      className={className}
      role={politeness === 'assertive' ? 'alert' : 'status'}
    />
  );
}
