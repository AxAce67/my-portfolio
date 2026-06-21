import { useEffect, useLayoutEffect, useRef } from 'react';
import { navigationStateKeys, readSessionNumber, readSessionValue, removeSessionValue } from '@/lib/navigationState';

function resolveHomeProjectsTransition() {
  window.__resolveHomeProjectsTransition?.();
  window.__resolveHomeProjectsTransition = undefined;
}

function waitForNextFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

function waitForTimeout(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function waitForCardImage(card: HTMLElement | null) {
  if (!card) {
    await waitForNextFrame();
    return;
  }

  const image = card.querySelector('img');
  if (!image) {
    await waitForNextFrame();
    return;
  }

  if (!image.complete) {
    await Promise.race([
      new Promise<void>((resolve) => {
        image.addEventListener('load', () => resolve(), { once: true });
        image.addEventListener('error', () => resolve(), { once: true });
      }),
      waitForTimeout(120),
    ]);
  }

  await waitForNextFrame();
}

export function useHomeNavigationRestoration(returningProjectId: string | null, dataReady: boolean) {
  const scrollRestoredRef = useRef(false);

  // Nav clicks from another page hand off their target section via
  // sessionStorage (not a URL hash). Wait for both the project data fetch
  // and the route's own enter transition to finish before scrolling —
  // otherwise the smooth scroll competes with the transition animation for
  // frames (looks janky/rushed) instead of landing the same way a plain
  // nav click does on an already-settled home page.
  useEffect(() => {
    if (!dataReady) return;
    const navTargetSection = readSessionValue(navigationStateKeys.navTargetSection);
    if (!navTargetSection) return;

    let cancelled = false;
    void (async () => {
      await (window.__routeTransitionFinished ?? Promise.resolve());
      if (cancelled) return;

      removeSessionValue(navigationStateKeys.navTargetSection);
      const target = document.getElementById(navTargetSection);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.requestAnimationFrame(resolveHomeProjectsTransition);
    })();

    return () => {
      cancelled = true;
    };
  }, [dataReady]);

  useLayoutEffect(() => {
    const savedScrollY = readSessionNumber(navigationStateKeys.homeScrollY);
    if (savedScrollY === null) return;

    let cancelled = false;
    window.scrollTo(0, savedScrollY);
    scrollRestoredRef.current = true;

    void (async () => {
      const card = returningProjectId
        ? document.querySelector<HTMLElement>(`[data-card-id="${returningProjectId}"]`)
        : null;

      if (card) {
        card.scrollIntoView({ block: 'nearest' });
      }

      await waitForCardImage(card);
      if (!cancelled) {
        resolveHomeProjectsTransition();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [returningProjectId]);

  useEffect(() => {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const isReload = navigationEntry?.type === 'reload';
    const shouldRestoreProjects = readSessionValue(navigationStateKeys.returnToProjects) === '1';

    let hash = window.location.hash?.replace('#', '') || '';
    if (!hash && shouldRestoreProjects) {
      hash = sessionStorage.getItem(navigationStateKeys.homeReferrerHash) || '';
    }

    if (shouldRestoreProjects) {
      const savedScrollY = readSessionNumber(navigationStateKeys.homeScrollY);
      if (savedScrollY !== null && !scrollRestoredRef.current) {
        // Try scrolling multiple times as the page content loads
        let scrollAttempts = 0;
        const maxScrollAttempts = 12;
        const tryPixelScroll = () => {
          // If page is tall enough, we assume pixel scroll will be accurate
          if (document.documentElement.scrollHeight > savedScrollY + window.innerHeight * 0.8) {
            window.scrollTo(0, savedScrollY);
            return;
          }
          
          // Otherwise, try to keep the target element in view while waiting for page to grow
          if (hash) {
            const target = document.getElementById(hash);
            if (target) target.scrollIntoView({ behavior: 'auto', block: 'start' });
          } else {
            window.scrollTo(0, savedScrollY);
          }

          scrollAttempts += 1;
          if (scrollAttempts < maxScrollAttempts) {
            window.setTimeout(tryPixelScroll, 80);
          }
        };
        tryPixelScroll();
      } else if (savedScrollY === null && !hash) {
        const projectsSection = document.getElementById('projects');
        projectsSection?.scrollIntoView({ behavior: 'auto', block: 'start' });
      }
      
      // Delay clearing the keys slightly to ensure retry loops can read them if needed elsewhere
      window.setTimeout(() => {
        removeSessionValue(navigationStateKeys.homeScrollY);
        removeSessionValue(navigationStateKeys.homeFromProjectId);
        removeSessionValue(navigationStateKeys.returnToProjects);
        removeSessionValue(navigationStateKeys.homeReferrerHash);
      }, 1000);
      return;
    }

    if (isReload && !window.location.hash?.replace('#', '')) {
      const previousRestoration = window.history.scrollRestoration;
      window.history.scrollRestoration = 'manual';

      const forceTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      forceTop();
      const rafId = window.requestAnimationFrame(forceTop);
      const timeoutId = window.setTimeout(forceTop, 80);

      const onLoad = () => {
        forceTop();
        window.history.scrollRestoration = previousRestoration;
      };

      window.addEventListener('load', onLoad, { once: true });
      return () => {
        window.cancelAnimationFrame(rafId);
        window.clearTimeout(timeoutId);
        window.removeEventListener('load', onLoad);
        window.history.scrollRestoration = previousRestoration;
      };
    }

    if (!hash) {
      return;
    }

    let attempts = 0;
    const maxAttempts = 12;

    const tryScroll = () => {
      const target = document.getElementById(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
        window.requestAnimationFrame(resolveHomeProjectsTransition);
        return;
      }

      attempts += 1;
      if (attempts < maxAttempts) {
        window.setTimeout(tryScroll, 80);
      }
    };

    window.setTimeout(tryScroll, 0);
  }, []);
}
