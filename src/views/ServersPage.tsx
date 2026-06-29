'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { useLocale } from '@/hooks/useLocale';
import { Link, getLocaleMeta } from '@/i18n/routing';
import { TiltCard } from '@/components/ui/TiltCard';
import { selfHostedServers, type ServerStatus } from '@/lib/selfHostedServers';
import { RefreshCw } from 'lucide-react';
import { navigationStateKeys, writeSessionValue } from '@/lib/navigationState';

const STATUS_DOT_CLASS: Record<ServerStatus, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-red-500',
  maintenance: 'bg-amber-500',
};

const OS_LABEL: Record<string, string> = {
  linux: 'Linux',
  macos: 'macOS',
  windows: 'Windows',
  ios: 'iOS',
  android: 'Android',
};

type LiveDevice = {
  name: string;
  online: boolean;
  lastSeen: string | null;
  os: string | null;
  maskedIp: string | null;
};

const REFRESH_INTERVAL_MS = 30_000;

// Tailscale's device `name` is a full FQDN (e.g.
// "jp-server.taile106e9.ts.net"); compare case-insensitively against just
// the short label so config entries don't need to match exact casing/FQDN.
function shortName(value: string): string {
  return value.split('.')[0]?.toLowerCase() ?? '';
}

export default function ServersPage() {
  const t = useTranslations('Servers');
  const locale = useLocale();
  const dateLocale = getLocaleMeta(locale).dateLocale;
  const [liveDevices, setLiveDevices] = useState<LiveDevice[] | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const cancelledRef = useRef(false);

  const [[backHref, backLabel]] = useState<[string, string | null]>(() => {
    if (typeof window === 'undefined') return ['/', null];
    const hash = sessionStorage.getItem(navigationStateKeys.homeReferrerHash);
    let label = null;
    if (hash === 'about') {
      label = locale === 'ja' ? '← Aboutへ戻る' : '← Back to About';
    } else if (hash === 'timeline') {
      label = locale === 'ja' ? '← Active Projectsへ戻る' : '← Back to Active Projects';
    }
    return ['/', label];
  });

  const load = useCallback(() => {
    setIsRefreshing(true);
    return fetch('/api/server-status')
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { devices?: LiveDevice[] }) => {
        if (cancelledRef.current) return;
        setLiveDevices(data.devices ?? []);
        setLastUpdated(new Date());
      })
      .catch(() => {
        // Tailscale check unavailable (no API key configured yet, network
        // error, etc.) — fall back to the manual `status` field below.
        if (cancelledRef.current) return;
        setLiveDevices((prev) => prev ?? []);
        setLastUpdated(new Date());
      })
      .finally(() => {
        if (!cancelledRef.current) setIsRefreshing(false);
      });
  }, []);

  useEffect(() => {
    cancelledRef.current = false;
    load();
    const intervalId = window.setInterval(load, REFRESH_INTERVAL_MS);

    return () => {
      cancelledRef.current = true;
      window.clearInterval(intervalId);
    };
  }, [load]);

  const findLiveDevice = (server: (typeof selfHostedServers)[number]): LiveDevice | null => {
    if (!server.tailscaleHostname || !liveDevices) return null;
    const target = shortName(server.tailscaleHostname);
    return (
      liveDevices.find((d) => shortName(d.name) === target) ?? null
    );
  };

  const resolveStatus = (server: (typeof selfHostedServers)[number], live: LiveDevice | null): ServerStatus => {
    if (!live) return server.status;
    return live.online ? 'online' : 'offline';
  };

  const statusLabel = (status: ServerStatus) => {
    if (status === 'online') return t('statusOnline');
    if (status === 'offline') return t('statusOffline');
    return t('statusMaintenance');
  };

  const categoryLabel = (category: string) => {
    switch (category) {
      case 'web':
        return t('categoryWeb');
      case 'game':
        return t('categoryGame');
      case 'bot':
        return t('categoryBot');
      default:
        return t('categoryInfra');
    }
  };

  const formatLastSeen = (iso: string) =>
    new Intl.DateTimeFormat(dateLocale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));

  const formatClock = (date: Date) => new Intl.DateTimeFormat(dateLocale, { timeStyle: 'medium' }).format(date);

  return (
    <section className="max-w-5xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
      <div className="mb-10">
        <Link 
          href={backHref} 
          className="text-xs font-mono text-muted-foreground hover:text-foreground"
          onClick={() => {
            writeSessionValue(navigationStateKeys.returnToProjects, '1');
          }}
        >
          {backLabel ?? t('backHome')}
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3 mt-5">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t('heading')}</h1>
            <p className="text-sm text-muted-foreground mt-2">{t('description')}</p>
          </div>
          <button
            type="button"
            onClick={() => load()}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-[12px] font-mono text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} strokeWidth={2} />
            <span>{t('refreshButton')}</span>
            <span className="opacity-70">· {t('lastUpdatedLabel')} {lastUpdated ? formatClock(lastUpdated) : '--:--:--'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {selfHostedServers.map((server) => {
          const live = findLiveDevice(server);
          const status = resolveStatus(server, live);
          const os = live?.os ? OS_LABEL[live.os] ?? live.os : null;

          return (
            <TiltCard key={server.id} className="bento-card p-5">
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                  {categoryLabel(server.category)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-[12px] font-mono">
                  <span className={`w-2 h-2 rounded-full ${STATUS_DOT_CLASS[status]}`} aria-hidden="true" />
                  {statusLabel(status)}
                </span>
              </div>
              <p className="text-base font-semibold tracking-tight">{server.name}</p>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{server.description}</p>

              {(server.specs || os || live?.maskedIp || live?.lastSeen) && (
                <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-y-1.5 text-[12px] font-mono text-muted-foreground">
                  {server.specs && (
                    <>
                      <span>{t('specsLabel')}</span>
                      <span className="text-right">{server.specs}</span>
                    </>
                  )}
                  {os && (
                    <>
                      <span>{t('osLabel')}</span>
                      <span className="text-right">{os}</span>
                    </>
                  )}
                  {live?.maskedIp && (
                    <>
                      <span>{t('ipLabel')}</span>
                      <span className="text-right tracking-wide text-foreground/80">{live.maskedIp}</span>
                    </>
                  )}
                  {live?.lastSeen && status === 'offline' && (
                    <>
                      <span>{t('lastSeenLabel')}</span>
                      <span className="text-right">{formatLastSeen(live.lastSeen)}</span>
                    </>
                  )}
                </div>
              )}
            </TiltCard>
          );
        })}
      </div>
    </section>
  );
}
