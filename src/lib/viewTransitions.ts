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
const ROUTE_TRANSITION_COMPACT_CLASS = 'route-transition-compact';
const ROUTE_TRANSITION_MOBILE_CLASS = 'route-transition-mobile-active';
const ROUTE_TRANSITION_MOBILE_EXIT_CLASS = 'route-transition-mobile-exit';

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function prefersCompactMotion() {
  return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}

export function shouldUseMobileRouteTransitions() {
  return typeof window !== 'undefined' && !prefersReducedMotion() && prefersCompactMotion();
}

export function canUseSharedElementTransitions() {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return false;
  }

  const transitionDocument = document as TransitionCapableDocument;
  return !prefersReducedMotion() && !prefersCompactMotion() && Boolean(transitionDocument.startViewTransition);
}

export function isPlainLeftClick(event: ClickLikeEvent) {
  return !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

export function runViewTransition(action: () => void) {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    action();
    return;
  }

  const reduceMotion = prefersReducedMotion();
  const transitionDocument = document as TransitionCapableDocument;

  if (reduceMotion || !transitionDocument.startViewTransition) {
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

  const reduceMotion = prefersReducedMotion();
  const compactMotion = prefersCompactMotion();
  const transitionDocument = document as TransitionCapableDocument;
  const root = document.documentElement;
  const cleanup = () => {
    root.classList.remove(ROUTE_TRANSITION_CLASS);
    root.classList.remove(ROUTE_TRANSITION_COMPACT_CLASS);
    root.classList.remove(ROUTE_TRANSITION_MOBILE_CLASS);
    root.classList.remove(ROUTE_TRANSITION_MOBILE_EXIT_CLASS);
    root.style.removeProperty(ROUTE_DIRECTION_VAR);
  };

  if (reduceMotion) {
    action();
    cleanup();
    return;
  }

  if (compactMotion) {
    root.classList.add(ROUTE_TRANSITION_MOBILE_CLASS);
    root.style.setProperty(ROUTE_DIRECTION_VAR, options?.direction === 'backward' ? '-1' : '1');

    window.setTimeout(() => {
      action();
      root.classList.add(ROUTE_TRANSITION_MOBILE_EXIT_CLASS);
    }, 96);

    window.setTimeout(cleanup, 320);
    return;
  }

  const scheduleCleanup = () => {
    window.setTimeout(cleanup, 140);
  };

  root.classList.add(ROUTE_TRANSITION_CLASS);
  root.classList.toggle(ROUTE_TRANSITION_COMPACT_CLASS, compactMotion);
  root.style.setProperty(ROUTE_DIRECTION_VAR, options?.direction === 'backward' ? '-1' : '1');

  if (!transitionDocument.startViewTransition) {
    action();
    scheduleCleanup();
    return;
  }

  const transition = transitionDocument.startViewTransition(() => {
    action();
  });

  transition.finished.finally(scheduleCleanup);
}
