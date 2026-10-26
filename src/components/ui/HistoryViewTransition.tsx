'use client';

import { useEffect } from 'react';
import { canUseSharedElementTransitions } from '@/lib/viewTransitions';

// Browser back/forward between a project card and its article should morph
// the thumbnail the same way the in-page links do. Next.js handles popstate
// by re-rendering right away, which is too early: the view transition has to
// snapshot the old page first. So the popstate is held back, the transition
// starts, and only inside its update callback is the event handed on to
// Next.js. The callback then waits until the old page has been replaced.

const SHARED_SELECTOR = '[style*="view-transition-name: proj-"]';
const WAIT_TIMEOUT_MS = 1500;

type TransitionCapableDocument = Document & {
  startViewTransition?: (update: () => void | Promise<void>) => unknown;
};

function waitUntilDetached(elements: Element[]): Promise<void> {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const check = () => {
      if (elements.every((element) => !element.isConnected) || Date.now() - startedAt > WAIT_TIMEOUT_MS) {
        // One more task so layout effects (scroll restoration) have run.
        window.setTimeout(resolve, 0);
        return;
      }
      window.setTimeout(check, 16);
    };
    check();
  });
}

export function HistoryViewTransition() {
  useEffect(() => {
    if (!canUseSharedElementTransitions()) return;

    let replaying = false;
    const onPopState = (event: PopStateEvent) => {
      if (replaying) return;
      const shared = Array.from(document.querySelectorAll(SHARED_SELECTOR));
      if (shared.length === 0) return;

      // Capture listeners on window run before Next.js's own popstate
      // listener, so this keeps it from seeing the event until the replay.
      event.stopImmediatePropagation();

      // On a back/forward the old page gets scrolled to the destination's
      // saved position right after popstate (a short article lands on its
      // footer), and the snapshot would capture that. Put the old page back
      // where it was in the next frame, which runs before the snapshot.
      const scrollYAtPop = window.scrollY;
      window.requestAnimationFrame(() => {
        if (Math.abs(window.scrollY - scrollYAtPop) > 1) window.scrollTo(0, scrollYAtPop);
      });

      (document as TransitionCapableDocument).startViewTransition?.(() => {
        replaying = true;
        window.dispatchEvent(new PopStateEvent('popstate', { state: event.state }));
        replaying = false;
        return waitUntilDetached(shared);
      });
    };

    window.addEventListener('popstate', onPopState, { capture: true });
    return () => window.removeEventListener('popstate', onPopState, { capture: true });
  }, []);

  return null;
}
