'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';

// A clock corrected against Aki's own public NTP server. The status page on
// ntp-jp.aki.quest exposes the server clock at /time (CORS-enabled); the
// sample with the shortest round trip gives the best offset estimate.
const TIME_URL = 'https://ntp-jp.aki.quest/time';
const SERVER_LABEL = 'ntp-jp.aki.quest';
const SAMPLES = 3;

type Sync = { offsetMs: number; accuracyMs: number };

async function measure(): Promise<Sync | null> {
  let best: Sync | null = null;
  for (let i = 0; i < SAMPLES; i++) {
    const startedAt = performance.now();
    const sentAt = Date.now();
    const response = await fetch(TIME_URL, { cache: 'no-store' });
    const serverSeconds = Number(await response.text());
    const roundTrip = performance.now() - startedAt;
    if (!response.ok || !Number.isFinite(serverSeconds)) continue;
    const offsetMs = serverSeconds * 1000 - (sentAt + roundTrip / 2);
    if (!best || roundTrip / 2 < best.accuracyMs) best = { offsetMs, accuracyMs: roundTrip / 2 };
  }
  return best;
}

function formatJst(ms: number) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(ms);
}

export function NtpClock() {
  const t = useTranslations('Footer');
  const [sync, setSync] = useState<Sync | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    let cancelled = false;
    measure()
      .then((result) => {
        if (!cancelled && result) setSync(result);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sync) return;
    let timeoutId = 0;
    const tick = () => {
      const corrected = Date.now() + sync.offsetMs;
      setNow(corrected);
      // Re-align to the next whole second of the corrected clock.
      timeoutId = window.setTimeout(tick, 1000 - (corrected % 1000));
    };
    tick();
    return () => window.clearTimeout(timeoutId);
  }, [sync]);

  // Render nothing until synced: no server/client mismatch and no wrong time.
  if (!sync || !now) return null;

  const offset = Math.round(-sync.offsetMs);
  const offsetLabel = `${offset >= 0 ? '+' : ''}${offset} ms`;

  return (
    <a
      href={`https://${SERVER_LABEL}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
      title={t('ntpAccuracy', { accuracy: Math.round(sync.accuracyMs) })}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
      <span className="tabular-nums text-foreground">{formatJst(now)} JST</span>
      <span>{t('ntpSynced', { server: SERVER_LABEL })}</span>
      <span className="text-muted-foreground/70">{t('ntpDeviceOffset', { offset: offsetLabel })}</span>
    </a>
  );
}
