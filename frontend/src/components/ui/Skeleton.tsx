import type { HTMLAttributes } from 'react';

/**
 * A placeholder shaped like the content that will replace it, so the layout
 * does not jump when data lands.
 */
export function Skeleton({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={`shimmer rounded-ui bg-surface-muted ${className}`}
    />
  );
}

/** Matches the property card's proportions: media, price, title, two lines. */
export function ListingCardSkeleton() {
  return (
    <div className="space-y-3" data-testid="listing-card-skeleton">
      <Skeleton className="aspect-[4/3] w-full rounded-card" />
      <div className="space-y-2 px-1">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
    </div>
  );
}
