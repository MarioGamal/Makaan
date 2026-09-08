import { useEffect, useId, useRef, type ReactNode } from 'react';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  labelledBy?: string;
  closeLabel?: string;
  className?: string;
};

const focusableSelector =
  'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  children,
  labelledBy,
  closeLabel = title,
  className = '',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const generatedTitleId = useId();
  const titleId = labelledBy ?? generatedTitleId;

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const timer = window.setTimeout(
      () =>
        dialog?.querySelector<HTMLElement>(focusableSelector)?.focus() ??
        dialog?.focus(),
      0,
    );
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !dialog) return;
      const nodes = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector),
      );
      if (!nodes.length) {
        event.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        aria-label={closeLabel}
        className="absolute inset-0 h-full w-full cursor-default bg-scrim/55 backdrop-blur-sm"
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />
      <div
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-modal="true"
        className={`relative z-10 max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-auto rounded-panel bg-surface-raised p-5 shadow-panel ${className}`}
        role="dialog"
        tabIndex={-1}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-xl font-bold" id={titleId}>
            {title}
          </h2>
          <button
            aria-label={closeLabel}
            className="grid size-11 shrink-0 place-items-center rounded-ui text-ink hover:bg-surface-muted"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
