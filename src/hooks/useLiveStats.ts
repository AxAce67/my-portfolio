'use client';

import { useEffect, useState } from 'react';
import type { LiveStats } from '@/lib/server/liveStats';

// Polls /api/live-stats once a minute while the page is open. null until the
// first answer (or if the route is unavailable).
export function useLiveStats(): LiveStats | null {
  const [stats, setStats] = useState<LiveStats | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch('/api/live-stats', { signal: controller.signal });
        if (response.ok) setStats((await response.json()) as LiveStats);
      } catch {
        // keep the last numbers
      }
    };
    void load();
    const id = window.setInterval(load, 60_000);
    return () => {
      controller.abort();
      window.clearInterval(id);
    };
  }, []);
  return stats;
}
