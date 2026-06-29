import { useLayoutEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { navigationStateKeys, readSessionValue } from '@/lib/navigationState';

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

  useLayoutEffect(() => {
    if (!hasPendingRestoreRef.current) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
