'use client';

type TransitionCapableDocument = Document & {
  startViewTransition?: (update: () => void) => {
    finished: Promise<void>;
  };
};

type RouteTransitionDirection = 'forward' | 'backward';

type ClickLikeEvent = {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
};

const ROUTE_TRANSITION_CLASS = 'route-transition-active';
const ROUTE_DIRECTION_VAR = '--route-direction';

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

export function runRouteTransition(
  action: () => void,
  options?: { direction?: RouteTransitionDirection },
) {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    action();
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const transitionDocument = document as TransitionCapableDocument;
  const root = document.documentElement;
  const cleanup = () => {
    root.classList.remove(ROUTE_TRANSITION_CLASS);
    root.style.removeProperty(ROUTE_DIRECTION_VAR);
  };
  const scheduleCleanup = () => {
    window.setTimeout(cleanup, 140);
  };

  root.classList.add(ROUTE_TRANSITION_CLASS);
  root.style.setProperty(ROUTE_DIRECTION_VAR, options?.direction === 'backward' ? '-1' : '1');

  if (prefersReducedMotion || !transitionDocument.startViewTransition) {
    action();
    scheduleCleanup();
    return;
  }

  const transition = transitionDocument.startViewTransition(() => {
    action();
  });

  transition.finished.finally(scheduleCleanup);
}
