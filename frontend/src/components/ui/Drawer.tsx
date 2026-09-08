import { useEffect, useId, useRef, type ReactNode } from 'react';

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  side?: 'inline-start' | 'inline-end';
  closeLabel?: string;
  className?: string;
};

export function Drawer({
  open,
  onClose,
  title,
  children,
  side = 'inline-end',
  closeLabel = title,
  className = '',
}: DrawerProps) {
  const drawerRef = useRef<HTMLElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement as HTMLElement | null;
    const timer = window.setTimeout(
      () =>
        drawerRef.current
          ?.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          )
          ?.focus(),
      0,
    );
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose, open]);
  if (!open) return null;
  const position = side === 'inline-start' ? 'start-0' : 'end-0';
  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <button
        aria-label={closeLabel}
        className="absolute inset-0 h-full w-full cursor-default bg-scrim/55 backdrop-blur-sm"
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />
      <aside
        ref={drawerRef}
        aria-labelledby={titleId}
        aria-modal="true"
        className={`absolute ${position} top-0 flex h-full w-full max-w-md flex-col bg-surface-raised p-5 shadow-panel ${className}`}
        role="dialog"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold" id={titleId}>
            {title}
          </h2>
          <button
            aria-label={closeLabel}
            className="grid size-11 place-items-center rounded-ui hover:bg-surface-muted"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </aside>
    </div>
  );
}
