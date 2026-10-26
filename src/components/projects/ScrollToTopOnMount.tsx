'use client';

import { useLayoutEffect } from 'react';
import { recentHistoryRestore } from '@/lib/scrollMemory';

export default function ScrollToTopOnMount() {
  useLayoutEffect(() => {
    // On back/forward the page goes back to where it was left (ScrollToTop
    // has already started that); only a fresh visit starts at the top.
    if (recentHistoryRestore() !== undefined) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  return null;
}
