'use client';

import { useEffect, useState } from 'react';
import type { SelfHostedServer } from '@/lib/selfHostedServers';

// Live status from /api/server-status (Tailscale presence + Beszel metrics).
// Every component on the page shares one request per refresh interval.

export type LiveServerDevice = { name: string; online: boolean };
export type LiveServerMetrics = {
  name: string;
  cpuPercent: number | null;
  memoryPercent: number | null;
  diskPercent: number | null;
};
export type LiveServerStatus = { devices: LiveServerDevice[]; metrics: LiveServerMetrics[] };

const REFRESH_MS = 60_000;

let cached: { loadedAt: number; promise: Promise<LiveServerStatus | null> } | null = null;

function loadServerStatus(): Promise<LiveServerStatus | null> {
  if (cached && Date.now() - cached.loadedAt < REFRESH_MS) return cached.promise;

  const promise = fetch('/api/server-status')
    .then((res) => (res.ok ? res.json() : null))
    .then((data: Partial<LiveServerStatus> | null) =>
      data ? { devices: data.devices ?? [], metrics: data.metrics ?? [] } : null,
    )
    .catch(() => null);
  cached = { loadedAt: Date.now(), promise };
  return promise;
}

// null until the first response, or while the status check is unavailable.
export function useServerStatus(): LiveServerStatus | null {
  const [status, setStatus] = useState<LiveServerStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      loadServerStatus().then((next) => {
        if (!cancelled && next && next.devices.length > 0) setStatus(next);
      });
    load();
    const intervalId = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  return status;
}

const shortName = (value: string) => value.split('.')[0]?.toLowerCase() ?? '';

export function findServerDevice(status: LiveServerStatus, server: SelfHostedServer): LiveServerDevice | null {
  const target = shortName(server.tailscaleHostname ?? server.id);
  return status.devices.find((device) => shortName(device.name) === target) ?? null;
}

export function findServerMetrics(status: LiveServerStatus, server: SelfHostedServer): LiveServerMetrics | null {
  const target = shortName(server.beszelName ?? server.tailscaleHostname ?? server.id);
  return status.metrics.find((metrics) => shortName(metrics.name) === target) ?? null;
}
