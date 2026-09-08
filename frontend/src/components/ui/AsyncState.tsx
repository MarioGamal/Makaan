import type { ReactNode } from 'react';

import { Button } from './Button';
import { Card } from './Card';
import { ListingCardSkeleton } from './Skeleton';

export type AsyncStateProps = {
  state: 'loading' | 'empty' | 'error' | 'offline';
  title?: string;
  description?: string;
  retryLabel?: string;
  loadingLabel?: string;
  onRetry?: () => void;
  /** How many placeholder cards to show while loading. */
  skeletonCount?: number;
  children?: ReactNode;
};

export function AsyncState({
  state,
  title,
  description,
  retryLabel,
  loadingLabel,
  onRetry,
  skeletonCount = 6,
  children,
}: AsyncStateProps) {
  if (state === 'loading')
    return (
      <div
        aria-busy="true"
        aria-label={title ?? loadingLabel}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        role="status"
      >
        {Array.from({ length: skeletonCount }, (_, index) => (
          <ListingCardSkeleton key={index} />
        ))}
      </div>
    );

  const defaults =
    state === 'empty'
      ? ['Nothing to show yet', 'Try changing your search or return later.']
      : state === 'offline'
        ? ['You appear to be offline', 'Check your connection and try again.']
        : ['Something went wrong', 'Please try again.'];

  return (
    <Card
      className="mx-auto max-w-lg text-center"
      padding="lg"
      role={state === 'error' ? 'alert' : 'status'}
      tone="raised"
    >
      <h2 className="font-display text-xl font-semibold">
        {title ?? defaults[0]}
      </h2>
      <p className="mt-2 text-sm text-ink-muted">
        {description ?? defaults[1]}
      </p>
      {children}
      {onRetry && retryLabel ? (
        <Button className="mt-5" onClick={onRetry} variant="secondary">
          {retryLabel}
        </Button>
      ) : null}
    </Card>
  );
}
