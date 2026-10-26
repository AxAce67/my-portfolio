'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// Pieces shared by the dashboard tabs, so the active-project and mutual-link
// tabs look and behave like the project list.

export const FIELD_LABEL_CLASS = 'mb-1.5 block text-xs font-medium text-muted-foreground';
export const INPUT_CLASS =
  'h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 hover:border-foreground/30 focus:border-foreground/60 focus-visible:outline-none';
export const ICON_BUTTON_CLASS =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted hover:text-foreground';
export const DANGER_ICON_BUTTON_CLASS =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-500/40 bg-red-500/10 text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-300';
export const ROW_CLASS = 'group rounded-lg border border-border bg-card px-3 py-3 transition-colors hover:border-border-hover hover:bg-muted/30';

type AdminModalProps = {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  size?: 'md' | 'lg';
};

/** A dialog over the page. Escape, the × button and a click outside close it. */
export function AdminModal({ title, closeLabel, onClose, children, size = 'lg' }: AdminModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // Leave Escape to a dialog opened on top of this one (e.g. the cropper).
      for (let next = overlayRef.current?.nextElementSibling; next; next = next.nextElementSibling) {
        if (next.classList.contains('fixed') && next.classList.contains('inset-0')) return;
      }
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div ref={overlayRef} className="fixed inset-0 z-2147483647 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-xl sm:p-6 ${size === 'md' ? 'max-w-md' : 'max-w-lg'}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="-mr-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

type ConfirmDeleteModalProps = {
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteModal({ title, description, cancelLabel, confirmLabel, pending, onCancel, onConfirm }: ConfirmDeleteModalProps) {
  return (
    <AdminModal title={title} closeLabel={cancelLabel} onClose={onCancel} size="md">
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 flex flex-col-reverse items-stretch justify-end gap-2 sm:flex-row sm:items-center">
        <button type="button" className="h-9 rounded-lg border border-border px-4 text-sm transition-colors hover:bg-muted" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onConfirm}
          className="h-9 rounded-lg bg-red-600 px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? '…' : confirmLabel}
        </button>
      </div>
    </AdminModal>
  );
}

/** Grey placeholder rows shown while a list loads. */
export function RowSkeleton({ count = 3, thumb = false }: { count?: number; thumb?: boolean }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex animate-pulse items-center gap-3 rounded-lg border border-border px-3 py-3">
          {thumb && <div className="h-6 w-[72px] shrink-0 rounded-sm bg-muted" />}
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/2 rounded-sm bg-muted" />
            <div className="h-3 w-1/3 rounded-sm bg-muted" />
          </div>
        </div>
      ))}
    </>
  );
}

export const PRIMARY_BUTTON_CLASS =
  'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60';
