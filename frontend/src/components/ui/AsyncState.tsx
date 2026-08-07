import type { ReactNode } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { Skeleton } from './Skeleton';

export type AsyncStateProps = {
  state: 'loading' | 'empty' | 'error' | 'offline';
  title?: string;
  description?: string;
  retryLabel?: string;
  loadingLabel?: string;
  onRetry?: () => void;
  children?: ReactNode;
};
export function AsyncState({
  state,
  title,
  description,
  retryLabel,
  loadingLabel,
  onRetry,
  children,
}: AsyncStateProps) {
  if (state === 'loading')
    return (
      <div
        aria-busy="true"
        aria-label={title ?? loadingLabel}
        className="space-y-3"
      >
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-24 w-full" />
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
      role={state === 'error' ? 'alert' : 'status'}
    >
      <h2 className="text-lg font-bold">{title ?? defaults[0]}</h2>
      <p className="mt-2 text-sm text-ink-muted">
        {description ?? defaults[1]}
      </p>
      {children}
      {onRetry && retryLabel ? (
        <Button className="mt-4" onClick={onRetry} variant="secondary">
          {retryLabel}
        </Button>
      ) : null}
    </Card>
  );
}
