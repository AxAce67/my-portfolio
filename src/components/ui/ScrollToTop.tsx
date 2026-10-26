import { useLayoutEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { navigationStateKeys, readSessionValue } from '@/lib/navigationState';
import { restoreScroll, takeHistoryRestore } from '@/lib/scrollMemory';

// Pages that intentionally restore a previous scroll position on mount
// (project archive return, home return, language switch) read one of these
// keys inside their own useLayoutEffect and clear it immediately after.

export function ScrollToTop() {
  const pathname = usePathname() ?? '';
  const hasPendingRestoreRef = useRef(false);

  // Captured during render — i.e. before any layout effects run.
  const isHome = pathname === '/' || /^\/[a-z-]+\/?$/.test(pathname);
  const isProjects = /^\/[a-z-]+\/projects\/?$/.test(pathname);

  let shouldSkip = false;
  if (isHome && readSessionValue(navigationStateKeys.homeScrollY) !== null) shouldSkip = true;
  if (isProjects && readSessionValue(navigationStateKeys.projectsScrollY) !== null) shouldSkip = true;
  if (readSessionValue(navigationStateKeys.languageScrollY) !== null) shouldSkip = true;

  hasPendingRestoreRef.current = shouldSkip;

  // This layout effect runs after the page's own ones (it sits above them in
  // the tree), so on back/forward it has the last word: land where the page
  // was left, or leave the scroll alone if that position is unknown.
  useLayoutEffect(() => {
    const historyRestore = takeHistoryRestore();
    if (historyRestore !== undefined) {
      if (historyRestore !== null) restoreScroll(historyRestore);
      return;
    }
    if (!hasPendingRestoreRef.current) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
