'use client';

import { flushSync } from 'react-dom';

type TransitionCapableDocument = Document & {
  startViewTransition?: (update: () => void) => {
    finished: Promise<void>;
  };
};

type RouteTransitionDirection = 'forward' | 'backward';
type RouteTransitionVariant = 'default' | 'document';

type ClickLikeEvent = {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented: boolean;
};

const ROUTE_TRANSITION_CLASS = 'route-transition-active';
const ROUTE_TRANSITION_DOCUMENT_CLASS = 'route-transition-document';

declare global {
  interface Window {
    // Lets code on the destination page (e.g. a section-scroll restoration
    // hook) wait for the route's enter animation to actually finish before
    // doing its own motion, instead of competing with it for frames.
    __routeTransitionFinished?: Promise<void>;
  }
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function prefersCompactMotion() {
  return window.matchMedia('(pointer: coarse), (any-pointer: coarse)').matches;
}

export function shouldUseMobileRouteTransitions() {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return false;
  }

  const transitionDocument = document as TransitionCapableDocument;
  return !prefersReducedMotion() && prefersCompactMotion() && !transitionDocument.startViewTransition;
}

export function canUseSharedElementTransitions() {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return false;
  }

  const transitionDocument = document as TransitionCapableDocument;
  return !prefersReducedMotion() && Boolean(transitionDocument.startViewTransition);
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
    // React Router's navigate() doesn't commit synchronously on its own —
    // without flushSync, startViewTransition captures its "after" snapshot
    // before the new route's DOM (and its viewTransitionName element) has
    // actually been painted, so there's nothing for it to morph into.
    flushSync(() => {
      action();
    });
  });
}

export function runRouteTransition(
  action: () => void,
  options?: { direction?: RouteTransitionDirection; variant?: RouteTransitionVariant },
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
    root.classList.remove(ROUTE_TRANSITION_DOCUMENT_CLASS);
  };

  if (reduceMotion) {
    window.__routeTransitionFinished = Promise.resolve();
    action();
    cleanup();
    return;
  }

  if (compactMotion) {
    // No view transition here, but the destination page still plays its
    // own ~180ms CSS enter animation (.mobile-page-motion) — give that a
    // moment too instead of resolving immediately.
    window.__routeTransitionFinished = new Promise((resolve) => window.setTimeout(resolve, 200));
    action();
    cleanup();
    return;
  }

  void options;

  const scheduleCleanup = () => {
    window.setTimeout(cleanup, 180);
  };

  root.classList.add(ROUTE_TRANSITION_CLASS);
  root.classList.toggle(ROUTE_TRANSITION_DOCUMENT_CLASS, options?.variant === 'document');

  if (!transitionDocument.startViewTransition) {
    window.__routeTransitionFinished = Promise.resolve();
    action();
    scheduleCleanup();
    return;
  }

  const transition = transitionDocument.startViewTransition(() => {
    flushSync(() => {
      action();
    });
  });

  window.__routeTransitionFinished = transition.finished.catch(() => undefined);
  transition.finished.finally(scheduleCleanup);
}
