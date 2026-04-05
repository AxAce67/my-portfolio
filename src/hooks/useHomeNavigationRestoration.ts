import { useEffect, useLayoutEffect, useRef } from 'react';
import { navigationStateKeys, readSessionNumber, readSessionValue, removeSessionValue } from '@/lib/navigationState';

function resolveHomeProjectsTransition() {
  window.__resolveHomeProjectsTransition?.();
  window.__resolveHomeProjectsTransition = undefined;
}

export function useHomeNavigationRestoration(returningProjectId: string | null) {
  const scrollRestoredRef = useRef(false);

  useLayoutEffect(() => {
    const savedScrollY = readSessionNumber(navigationStateKeys.homeScrollY);
    if (savedScrollY === null) return;

    window.scrollTo(0, savedScrollY);
    scrollRestoredRef.current = true;

    if (returningProjectId) {
      const card = document.querySelector<HTMLElement>(`[data-card-id="${returningProjectId}"]`);
      if (card) {
        card.scrollIntoView({ block: 'nearest' });
      }
    }

    window.requestAnimationFrame(resolveHomeProjectsTransition);
  }, [returningProjectId]);

  useEffect(() => {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const isReload = navigationEntry?.type === 'reload';
    const shouldRestoreProjects = readSessionValue(navigationStateKeys.returnToProjects) === '1';
    const hash = window.location.hash?.replace('#', '');

    if (shouldRestoreProjects) {
      const savedScrollY = readSessionNumber(navigationStateKeys.homeScrollY);
      if (savedScrollY !== null && !scrollRestoredRef.current) {
        window.scrollTo(0, savedScrollY);
      }
      removeSessionValue(navigationStateKeys.homeScrollY);
      removeSessionValue(navigationStateKeys.homeFromProjectId);
      removeSessionValue(navigationStateKeys.returnToProjects);
      return;
    }

    if (isReload && !hash) {
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
