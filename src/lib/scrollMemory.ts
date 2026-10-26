'use client';

// Remembers the last scroll position of every URL so back/forward can land
// where each page was left. Several components move the scroll on a route
// change (scroll-to-top, the home and archive "return here" restores, the
// article's scroll-to-top); ScrollToTop runs last and asks this module
// whether the change came from back/forward before doing anything.

const positions = new Map<string, number>();

// undefined: no back/forward in progress. number: where to land. null: a
// back/forward to a URL we have no position for (leave the scroll alone).
let pendingRestore: number | null | undefined;
let clearTimer: number | undefined;
let started = false;

export function startScrollMemory() {
  if (started || typeof window === 'undefined') return;
  started = true;

  window.addEventListener(
    'scroll',
    () => {
      // While a back/forward settles, scroll events belong to neither page.
      if (pendingRestore === undefined) positions.set(window.location.href, window.scrollY);
    },
    { passive: true },
  );

  window.addEventListener(
    'popstate',
    () => {
      if (pendingRestore !== undefined) return; // replayed event, already noted
      pendingRestore = positions.get(window.location.href) ?? null;
      // A popstate that changes no route (e.g. a hash) is never consumed.
      window.clearTimeout(clearTimer);
      clearTimer = window.setTimeout(() => {
        pendingRestore = undefined;
      }, 3000);
    },
    { capture: true },
  );
}

// The last back/forward restore, so parts of the page that mount after the
// route commit (e.g. the article's scroll-to-top) can tell it was one.
let lastRestore: { href: string; y: number | null; at: number } | undefined;

/** Called once the new route has committed. See `pendingRestore`. */
export function takeHistoryRestore(): number | null | undefined {
  const value = pendingRestore;
  pendingRestore = undefined;
  window.clearTimeout(clearTimer);
  if (value !== undefined) lastRestore = { href: window.location.href, y: value, at: Date.now() };
  return value;
}

/** The restore of a back/forward that just landed on this URL, if any. */
export function recentHistoryRestore(): number | null | undefined {
  if (!lastRestore || lastRestore.href !== window.location.href || Date.now() - lastRestore.at > 2000) return undefined;
  return lastRestore.y;
}

const RESTORE_TIMEOUT_MS = 1500;

/**
 * Scroll to y. A page that is still filling in (article body, images) may be
 * too short at first, so keep trying as it grows, until it gets there, the
 * user scrolls themselves, or the timeout passes.
 */
export function restoreScroll(y: number) {
  window.scrollTo(0, y);
  if (Math.abs(window.scrollY - y) <= 1) return;

  const stop = () => {
    observer.disconnect();
    window.clearTimeout(timer);
    for (const type of ['wheel', 'touchstart', 'keydown'] as const) window.removeEventListener(type, stop);
  };
  const observer = new ResizeObserver(() => {
    window.scrollTo(0, y);
    if (Math.abs(window.scrollY - y) <= 1) stop();
  });
  observer.observe(document.body);
  const timer = window.setTimeout(stop, RESTORE_TIMEOUT_MS);
  for (const type of ['wheel', 'touchstart', 'keydown'] as const) window.addEventListener(type, stop, { passive: true });
}
