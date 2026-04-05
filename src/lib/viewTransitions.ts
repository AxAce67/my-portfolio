'use client';

type TransitionCapableDocument = Document & {
  startViewTransition?: (update: () => void) => {
    finished: Promise<void>;
  };
};

type ClickLikeEvent = {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
};

export function isPlainLeftClick(event: ClickLikeEvent) {
  return !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

export function runViewTransition(action: () => void) {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    action();
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const transitionDocument = document as TransitionCapableDocument;

  if (prefersReducedMotion || !transitionDocument.startViewTransition) {
    action();
    return;
  }

  transitionDocument.startViewTransition(() => {
    action();
  });
}
