'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { useLocale } from '@/hooks/useLocale';
import { Link, getLocaleMeta } from '@/i18n/routing';
import { TiltCard } from '@/components/ui/TiltCard';
import { selfHostedServers, type ServerStatus } from '@/lib/selfHostedServers';
import { RefreshCw } from 'lucide-react';
import { navigationStateKeys, readSessionValue, writeSessionValue } from '@/lib/navigationState';

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

type LiveMetrics = {
  name: string;
  cpuPercent: number | null;
  cpuThreads: number | null;
  memoryUsedGb: number | null;
  memoryTotalGb: number | null;
  memoryPercent: number | null;
  diskUsedGb: number | null;
  diskTotalGb: number | null;
  diskPercent: number | null;
};

const REFRESH_INTERVAL_MS = 30_000;

// Tailscale's device `name` is a full FQDN (e.g.
// "jp-server.taile106e9.ts.net"); compare case-insensitively against just
// the short label so config entries don't need to match exact casing/FQDN.
function shortName(value: string): string {
  return value.split('.')[0]?.toLowerCase() ?? '';
}

function clampPercent(value: number | null): number {
  if (value === null) return 0;
  return Math.min(100, Math.max(0, value));
}

function MetricRow({
  label,
  primaryValue,
  secondaryValue,
  percent,
  barClassName,
  isLoading = false,
}: {
  label: string;
  primaryValue: string;
  secondaryValue?: string;
  percent: number | null;
  barClassName: string;
  isLoading?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <span className="text-right text-foreground">
          {isLoading ? (
            <PlaceholderText className="w-24" />
          ) : (
            <>
              <span className="font-semibold">{primaryValue}</span>
              {secondaryValue && (
                <span className="ml-2 text-muted-foreground">{secondaryValue}</span>
              )}
            </>
          )}
        </span>
      </div>
      <div className="h-2 rounded-full bg-border overflow-hidden" aria-hidden="true">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${barClassName}`}
          style={{ width: `${clampPercent(percent)}%` }}
        />
      </div>
    </div>
  );
}

function PlaceholderText({ className = 'w-16' }: { className?: string }) {
  return <span className={`inline-block h-3 rounded-full bg-muted align-middle ${className}`} aria-hidden="true" />;
}

export default function ServersPage() {
  const t = useTranslations('Servers');
  const locale = useLocale();
  const dateLocale = getLocaleMeta(locale).dateLocale;
  const [liveDevices, setLiveDevices] = useState<LiveDevice[] | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics[] | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const cancelledRef = useRef(false);

  const [backLabel, setBackLabel] = useState<string | null>(null);

  useEffect(() => {
    const hash = readSessionValue(navigationStateKeys.homeReferrerHash);
    if (hash === 'about') setBackLabel(t('backAbout'));
    else if (hash === 'timeline') setBackLabel(t('backTimeline'));
  }, [t]);

  const load = useCallback(() => {
    setIsRefreshing(true);
    return fetch('/api/server-status')
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { devices?: LiveDevice[]; metrics?: LiveMetrics[] }) => {
        if (cancelledRef.current) return;
        setLiveDevices(data.devices ?? []);
        setLiveMetrics(data.metrics ?? []);
        setLastUpdated(new Date());
      })
      .catch(() => {
        // Tailscale check unavailable (no API key configured yet, network
        // error, etc.) — fall back to the manual `status` field below.
        if (cancelledRef.current) return;
        setLiveDevices((prev) => prev ?? []);
        setLiveMetrics((prev) => prev ?? []);
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

  const findLiveMetrics = (server: (typeof selfHostedServers)[number]): LiveMetrics | null => {
    if (!liveMetrics) return null;
    const target = shortName(server.beszelName ?? server.tailscaleHostname ?? server.id);
    return liveMetrics.find((metrics) => shortName(metrics.name) === target) ?? null;
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

  const formatPercent = (value: number | null) => (
    value === null ? null : `${Math.round(value)}%`
  );

  const formatGb = (value: number | null) => (
    value === null ? null : new Intl.NumberFormat(dateLocale, { maximumFractionDigits: 1 }).format(value)
  );

  const formatUsage = (used: number | null, total: number | null, percent: number | null): {
    primaryValue: string;
    secondaryValue?: string;
  } | null => {
    const usedLabel = formatGb(used);
    const totalLabel = formatGb(total);
    const percentLabel = formatPercent(percent);

    if (usedLabel && totalLabel) {
      return {
        primaryValue: percentLabel ?? `${usedLabel} GB`,
        secondaryValue: `${usedLabel} / ${totalLabel} GB`,
      };
    }

    return percentLabel ? { primaryValue: percentLabel } : null;
  };

  const isInitialLoading = liveDevices === null && liveMetrics === null;

  return (
    <section className="max-w-5xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
      <div className="mb-6 sm:mb-8">
        <Link
          href="/"
          className="text-xs font-mono text-muted-foreground hover:text-foreground"
          onClick={() => {
            writeSessionValue(navigationStateKeys.returnToProjects, '1');
          }}
        >
          {backLabel ?? t('backHome')}
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3 mt-4">
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
          const metrics = findLiveMetrics(server);
          const status = resolveStatus(server, live);
          const os = live?.os ? OS_LABEL[live.os] ?? live.os : null;
          const cpuMetric = metrics?.cpuPercent === null || metrics?.cpuPercent === undefined
            ? null
            : {
              primaryValue: formatPercent(metrics.cpuPercent) ?? '',
              secondaryValue: metrics.cpuThreads ? `${metrics.cpuThreads} ${t('threadsLabel')}` : undefined,
            };
          const memoryMetric = metrics ? formatUsage(metrics.memoryUsedGb, metrics.memoryTotalGb, metrics.memoryPercent) : null;
          const diskMetric = metrics ? formatUsage(metrics.diskUsedGb, metrics.diskTotalGb, metrics.diskPercent) : null;
          const hasSystemDetails = Boolean(isInitialLoading || server.specs || os || live?.maskedIp || (live?.lastSeen && status === 'offline'));
          const hasMetricDetails = Boolean(isInitialLoading || cpuMetric || memoryMetric || diskMetric);

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

              {(hasSystemDetails || hasMetricDetails) && (
                <div className="mt-3 pt-3 border-t border-border text-[12px] font-mono text-muted-foreground">
                  {hasSystemDetails && (
                    <div className="grid grid-cols-2 gap-y-1.5">
                      {server.specs && (
                        <>
                          <span>{t('specsLabel')}</span>
                          <span className="text-right">{server.specs}</span>
                        </>
                      )}
                      {(os || isInitialLoading) && (
                        <>
                          <span>{t('osLabel')}</span>
                          <span className="text-right">{os ?? <PlaceholderText className="w-12" />}</span>
                        </>
                      )}
                      {(live?.maskedIp || isInitialLoading) && (
                        <>
                          <span>{t('ipLabel')}</span>
                          <span className="text-right tracking-wide text-foreground/80">{live?.maskedIp ?? <PlaceholderText className="w-24" />}</span>
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
                  {hasMetricDetails && (
                    <div className={`${hasSystemDetails ? 'mt-3 pt-3 border-t border-border/35 dark:border-white/10' : ''} space-y-2.5`}>
                      {(cpuMetric || isInitialLoading) && (
                        <MetricRow
                          label={t('cpuLabel')}
                          primaryValue={cpuMetric?.primaryValue ?? '--'}
                          secondaryValue={cpuMetric?.secondaryValue}
                          percent={metrics?.cpuPercent ?? null}
                          barClassName="bg-sky-500"
                          isLoading={isInitialLoading}
                        />
                      )}
                      {(memoryMetric || isInitialLoading) && (
                        <MetricRow
                          label={t('memoryLabel')}
                          primaryValue={memoryMetric?.primaryValue ?? '--'}
                          secondaryValue={memoryMetric?.secondaryValue}
                          percent={metrics?.memoryPercent ?? null}
                          barClassName="bg-emerald-500"
                          isLoading={isInitialLoading}
                        />
                      )}
                      {(diskMetric || isInitialLoading) && (
                        <MetricRow
                          label={t('diskLabel')}
                          primaryValue={diskMetric?.primaryValue ?? '--'}
                          secondaryValue={diskMetric?.secondaryValue}
                          percent={metrics?.diskPercent ?? null}
                          barClassName="bg-amber-500"
                          isLoading={isInitialLoading}
                        />
                      )}
                    </div>
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
