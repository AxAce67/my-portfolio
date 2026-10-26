'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight } from 'lucide-react';
import { Globe, type GlobeMarker } from '@/components/ui/Globe';
import HomePageSections from '@/components/home/HomePageSections';
import { Link } from '@/i18n/routing';
import { selfHostedServers, type SelfHostedServer } from '@/lib/selfHostedServers';
import { findServerDevice, findServerMetrics, useServerStatus, type LiveServerStatus } from '@/hooks/useServerStatus';
import type { HomeProject, HomeActiveProject, MutualLink } from '@/lib/content/publicContent';
import { navigationStateKeys, readSessionValue, writeSessionValue } from '@/lib/navigationState';
import { useHomeNavigationRestoration } from '@/hooks/useHomeNavigationRestoration';

type Props = {
  projects: HomeProject[];
  activeProjects: HomeActiveProject[];
  avatarUrl: string;
  mutualLinks: MutualLink[];
  projectCount: number;
};

// Data is loaded on the server (src/app/[locale]/page.tsx) so the first HTML
// already contains the projects, avatar and links.
export default function HomePage({ projects, activeProjects, avatarUrl, mutualLinks, projectCount }: Props) {
  const [returningProjectId] = useState(() => {
    return readSessionValue(navigationStateKeys.returnToProjects) === '1'
      ? readSessionValue(navigationStateKeys.homeFromProjectId)
      : null;
  });

  useHomeNavigationRestoration(returningProjectId, true);

  return (
    <>
      <HeroSection />
      <HomePageSections
        initialCompletedProjects={projects}
        initialActiveProjects={activeProjects}
        avatarUrl={avatarUrl}
        mutualLinks={mutualLinks}
        projectCount={projectCount}
        returningProjectId={returningProjectId}
      />
    </>
  );
}

// Where the six self-hosted machines run (same set as /servers), one marker
// per location: Oracle Cloud in Osaka, Singapore and Phoenix, Contabo and
// the home lab in Tokyo.
const MARKER_SERVER_IDS: Record<string, string[]> = {
  osaka: ['jp-server'],
  tokyo: ['jp-server-2', 'home-server', 'home-nas'],
  singapore: ['sg-server'],
  phoenix: ['us-server'],
};

const serversAt = (markerId: string): SelfHostedServer[] =>
  (MARKER_SERVER_IDS[markerId] ?? []).flatMap((id) => selfHostedServers.filter((server) => server.id === id));

const SERVER_MARKERS: GlobeMarker[] = ([
  { id: 'osaka', location: [34.69, 135.5], size: 0.03, label: 'Osaka', labelSide: 'left' },
  { id: 'tokyo', location: [35.68, 139.69], size: 0.03, label: 'Tokyo' },
  { id: 'singapore', location: [1.29, 103.85], size: 0.03, label: 'Singapore' },
  { id: 'phoenix', location: [33.45, -112.07], size: 0.03, label: 'Phoenix' },
] satisfies GlobeMarker[]).map((marker) => ({ ...marker, details: serversAt(marker.id).map((server) => server.name) }));

function formatPercent(value: number | null | undefined): string {
  return value === null || value === undefined ? '–' : `${Math.round(value)}%`;
}

function ServerPanel({ marker, status }: { marker: GlobeMarker; status: LiveServerStatus | null }) {
  return (
    <div className="flex flex-col gap-2.5 leading-[1.4]">
      {serversAt(marker.id).map((server) => {
        const online = status ? findServerDevice(status, server)?.online ?? false : null;
        const metrics = status ? findServerMetrics(status, server) : null;
        return (
          <div key={server.id}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[0.72rem] text-white">{server.name}</span>
              <span className="flex items-center gap-1.5 text-white/60">
                <span
                  className={`size-1.5 rounded-full ${online === null ? 'bg-white/30' : online ? 'bg-[rgb(102_222_194)]' : 'bg-red-400'}`}
                />
                {online === null ? '…' : online ? 'online' : 'offline'}
              </span>
            </div>
            <div className="mt-0.5 flex gap-3 text-white/55">
              <span>CPU {formatPercent(metrics?.cpuPercent)}</span>
              <span>MEM {formatPercent(metrics?.memoryPercent)}</span>
              <span>DISK {formatPercent(metrics?.diskPercent)}</span>
            </div>
          </div>
        );
      })}
      <Link
        href="/servers"
        className="inline-flex items-center gap-1 self-start text-[rgb(102_222_194)] hover:underline"
        onClick={() => {
          // Coming back from /servers should land on the hero, not the projects.
          writeSessionValue(navigationStateKeys.homeScrollY, String(window.scrollY));
        }}
      >
        All servers
        <ArrowUpRight className="size-3" />
      </Link>
    </div>
  );
}

function HeroSection({ hidden = false }: { hidden?: boolean }) {
  const { t } = useTranslation('Hero');
  const serverStatus = useServerStatus();

  return (
    <section
      className={`relative w-full min-h-svh px-4 sm:px-6 lg:px-8 pt-18 sm:pt-20 pb-8 sm:pb-12 flex items-center justify-center ${hidden ? 'opacity-0 pointer-events-none' : ''}`}
      aria-hidden={hidden}
    >
      <div
        className="relative w-full max-w-6xl min-h-136 sm:min-h-144 lg:min-h-168 rounded-4xl sm:rounded-[3rem] bg-(--hero-bg) text-(--hero-fg) overflow-hidden flex flex-col p-6 sm:p-10 lg:p-14 border border-(--hero-border) shadow-(--hero-shadow) transition-colors duration-500"
        style={{ willChange: 'transform', transform: 'translateZ(0)' }}
      >
        {/* Decorative gradients */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--hero-accent-rgb),0.08),transparent_60%)]" />
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_bottom_left,rgba(var(--hero-accent-soft-rgb),0.05),transparent_40%)]" />

        {/* Giant globe, peeking in from the bottom-right corner */}
        <div
          className="absolute -right-52 -bottom-52 w-104 h-104 sm:-right-128 sm:-bottom-96 sm:w-5xl sm:h-256 z-0 hero-v3-globe"
          style={{ filter: 'drop-shadow(0 0 60px rgba(var(--hero-accent-rgb), 0.22))' }}
        >
          <Globe
            size={720}
            className="hero-globe-canvas"
            markers={SERVER_MARKERS}
            initialPhi={7.3}
            theta={0.35}
            renderMarkerPanel={(marker) => <ServerPanel marker={marker} status={serverStatus} />}
          />
        </div>

        {/* Center content — left column, clear of the corner globe */}
        <div className="flex-1 flex flex-col justify-center z-10 relative mt-12 sm:mt-0 max-w-2xl">
          <div className="leading-[0.85] tracking-tighter font-black uppercase text-[clamp(4rem,15vw,11rem)] flex flex-col hero-v3-title">
            <span className="text-(--hero-fg) mix-blend-difference drop-shadow-xs">HELLO</span>
            <span className="text-(--hero-fg) mix-blend-difference drop-shadow-xs">WORLD</span>
          </div>

          <div className="mt-6 sm:mt-8 hero-v3-subtitle">
            <p className="text-xl sm:text-4xl font-bold tracking-tight mb-2">
              I'm Aki<span className="text-(--accent-muted)">.</span>
            </p>
            <p className="text-sm sm:text-base text-(--muted-foreground) max-w-xs leading-relaxed font-medium mb-7">
              {t('subtitle')}
            </p>

            <button
              onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative flex items-center justify-between gap-4 pl-6 pr-2 py-2 bg-(--hero-fg) text-(--hero-bg) rounded-full hover:scale-105 transition-transform active:scale-95 shadow-xl"
            >
              <span className="font-mono text-sm sm:text-base font-bold tracking-wide uppercase">{t('ctaPrimary')}</span>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-(--hero-bg)/20 flex items-center justify-center transition-transform group-hover:rotate-45">
                <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
