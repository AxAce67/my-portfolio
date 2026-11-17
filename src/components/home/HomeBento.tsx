'use client';

// The first screen of the home page: one bento grid that shows who I am and
// what is running right now. The intro tile keeps the globe from the old hero;
// the live tiles read my own services through /api/live-stats.
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, Clock, Plane, Server, Terminal, Video } from 'lucide-react';
import { Github } from '@/components/ui/brandIcons';
import { toast } from 'sonner';
import { Globe, type GlobeMarker } from '@/components/ui/Globe';
import Image from '@/components/ui/Image';
import { Link } from '@/i18n/routing';
import { useLocale } from '@/hooks/useLocale';
import { useTranslations } from '@/hooks/useTranslations';
import { useLiveStats } from '@/hooks/useLiveStats';
import { findServerDevice, findServerMetrics, useServerStatus, type LiveServerStatus } from '@/hooks/useServerStatus';
import { selfHostedServers, type SelfHostedServer } from '@/lib/selfHostedServers';
import { navigationStateKeys, writeSessionValue } from '@/lib/navigationState';
import type { HomeProject } from '@/lib/content/publicContent';
import { ProjectBadges } from '@/components/projects/ProjectBadges';
import { ProfileIdentity, profileLinks, schoolGradeKey, useGitHubMomentum } from '@/components/home/HomePageSections';

// Articles the live tiles link to.
const NTP_PROJECT_ID = '6addf9c6d52ff427c925';
const ATLAS_PROJECT_ID = '6afb2a202cad017b6144';

// Where the six self-hosted machines run (same set as /servers), one marker per location.
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

const percent = (value: number | null | undefined) => (value === null || value === undefined ? '–' : `${Math.round(value)}%`);

const rememberScroll = () => writeSessionValue(navigationStateKeys.homeScrollY, String(window.scrollY));

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
                <span className={`size-1.5 rounded-full ${online === null ? 'bg-white/30' : online ? 'bg-[rgb(102_222_194)]' : 'bg-red-400'}`} />
                {online === null ? '…' : online ? 'online' : 'offline'}
              </span>
            </div>
            <div className="mt-0.5 flex gap-3 text-white/55">
              <span>CPU {percent(metrics?.cpuPercent)}</span>
              <span>MEM {percent(metrics?.memoryPercent)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TileLabel({ icon, children, right }: { icon: ReactNode; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-mono uppercase tracking-wider">{children}</span>
      </div>
      {right}
    </div>
  );
}

function LiveDot() {
  return (
    <span className="relative flex size-2" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:hidden" />
      <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
    </span>
  );
}

function IntroTile() {
  const { t } = useTranslation('Hero');
  const bento = useTranslations('Bento');
  const serverStatus = useServerStatus();
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  return (
    <div className="relative h-full min-h-88 sm:min-h-104 overflow-hidden rounded-3xl bg-(--hero-bg) text-(--hero-fg) border border-(--hero-border) shadow-(--hero-shadow) p-6 sm:p-9 flex flex-col justify-end">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--hero-accent-rgb),0.10),transparent_60%)]" />
      <div
        className="absolute -right-44 -top-44 size-96 opacity-80 sm:opacity-100 sm:-right-56 sm:top-1/2 sm:-translate-y-1/2 sm:size-140"
        style={{ filter: 'drop-shadow(0 0 50px rgba(var(--hero-accent-rgb), 0.22))' }}
      >
        <Globe
          size={560}
          className="hero-globe-canvas"
          markers={SERVER_MARKERS}
          initialPhi={7.3}
          theta={0.35}
          renderMarkerPanel={(marker) => <ServerPanel marker={marker} status={serverStatus} />}
        />
      </div>
      <div className="relative z-10 max-w-md">
        <p className="leading-[0.85] tracking-tighter font-black uppercase text-[clamp(2.75rem,6.5vw,4.75rem)] mix-blend-difference">
          Hello
          <br />
          World
        </p>
        <p className="mt-5 text-2xl sm:text-3xl font-bold tracking-tight">
          I&apos;m Aki<span className="text-(--accent-muted)">.</span>
        </p>
        <p className="mt-1.5 text-sm text-(--muted-foreground) font-medium">{t('subtitle')}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => scrollTo('projects')}
            className="group inline-flex items-center gap-2 rounded-full bg-(--hero-fg) text-(--hero-bg) pl-5 pr-1.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wide transition-transform hover:scale-[1.03] active:scale-95"
          >
            {t('ctaPrimary')}
            <span className="flex size-7 items-center justify-center rounded-full bg-(--hero-bg)/15 transition-transform group-hover:rotate-45">
              <ArrowUpRight className="size-4" strokeWidth={2} />
            </span>
          </button>
          <button
            type="button"
            onClick={() => scrollTo('contact')}
            className="inline-flex items-center rounded-full border border-(--hero-border) px-5 py-1.5 font-mono text-xs font-bold uppercase tracking-wide text-(--hero-fg)/85 transition-colors hover:text-(--hero-fg) hover:border-(--hero-fg)/40"
          >
            {bento('contactCta')}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileTile({ avatarUrl }: { avatarUrl: string }) {
  const about = useTranslations('About');
  const contactT = useTranslations('Contact');
  const linkClass =
    'flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:border-border-hover text-foreground/90 hover:text-foreground transition-colors';
  return (
    <div className="bento-card h-full flex flex-col justify-between gap-4">
      <div className="flex items-center gap-3">
        <Image src={avatarUrl} alt="Aki" width={52} height={52} className="size-13 rounded-full object-cover border border-border" />
        <ProfileIdentity role={about('role')} ageLabel={about('ageLabel')} locationLabel={about('locationLabel')} />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {profileLinks.map((link) =>
          link.copyText ? (
            <button
              key={link.id}
              type="button"
              onClick={() => navigator.clipboard.writeText(link.copyText!).then(() => toast.success(contactT('discordCopied')))}
              className={linkClass}
            >
              {link.icon}
              <span className="text-xs font-mono tracking-wide">{link.label}</span>
            </button>
          ) : (
            <a
              key={link.id}
              href={link.href}
              className={linkClass}
              target={link.href.startsWith('mailto:') ? undefined : '_blank'}
              rel={link.href.startsWith('mailto:') ? undefined : 'noreferrer noopener'}
            >
              {link.icon}
              <span className="text-xs font-mono tracking-wide">{link.label}</span>
            </a>
          ),
        )}
      </div>
    </div>
  );
}

function ServersTile() {
  const bento = useTranslations('Bento');
  const about = useTranslations('About');
  const status = useServerStatus();
  const online = status ? selfHostedServers.filter((server) => findServerDevice(status, server)?.online).length : null;
  return (
    <Link href="/servers" onClick={rememberScroll} className="bento-card group h-full flex flex-col">
      <TileLabel
        icon={<Server className="size-4" strokeWidth={1.5} />}
        right={
          <span className="text-[11px] font-mono text-muted-foreground">
            {online === null ? '…' : about('serversOnline', { online, total: selfHostedServers.length })}
          </span>
        }
      >
        {bento('servers')}
      </TileLabel>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {selfHostedServers.map((server) => {
          const up = status ? findServerDevice(status, server)?.online ?? false : null;
          const metrics = status ? findServerMetrics(status, server) : null;
          const cpu = metrics?.cpuPercent ?? null;
          return (
            <li key={server.id} className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`size-1.5 shrink-0 rounded-full ${up === null ? 'bg-muted-foreground/40' : up ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="truncate text-[13px] font-medium">{server.name}</span>
              </div>
              <div className="mt-1 ml-3.5 h-1 rounded-full bg-muted overflow-hidden" title={`CPU ${percent(cpu)}`}>
                <div className="h-full rounded-full bg-foreground/50 transition-[width] duration-700" style={{ width: `${Math.min(100, Math.max(2, cpu ?? 0))}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
      <span className="mt-auto pt-4 inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground group-hover:text-foreground transition-colors">
        {bento('allServers')}
        <ArrowUpRight className="size-3" />
      </span>
    </Link>
  );
}

function LiveTile({
  icon,
  label,
  value,
  caption,
  href,
  external = false,
  children,
  note,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  caption: string;
  href: string;
  external?: boolean;
  children?: ReactNode;
  note?: string;
}) {
  const body = (
    <>
      <TileLabel icon={icon} right={<LiveDot />}>
        {label}
      </TileLabel>
      <p className="text-3xl sm:text-4xl font-bold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1.5 text-[12px] leading-snug text-muted-foreground">{caption}</p>
      {children ?? (note ? <p className="mt-auto pt-3 text-[11px] font-mono text-muted-foreground/70">{note}</p> : null)}
    </>
  );
  const className = 'bento-card group h-full flex flex-col';
  return external ? (
    <a href={href} target="_blank" rel="noreferrer noopener" className={className}>
      {body}
    </a>
  ) : (
    <Link href={href} onClick={rememberScroll} className={className}>
      {body}
    </Link>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const points = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * 100},${28 - (v / max) * 24}`).join(' ');
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="mt-auto pt-3 h-10 w-full text-foreground" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeOpacity={0.55} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function LiveTiles() {
  const bento = useTranslations('Bento');
  const locale = useLocale();
  const live = useLiveStats();
  const { momentum, days } = useGitHubMomentum();
  const compact = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 });
  const whole = new Intl.NumberFormat(locale);
  const dash = '–';
  return (
    <>
      <LiveTile
        icon={<Clock className="size-4" strokeWidth={1.5} />}
        label="NTP / NTS"
        value={live?.ntp ? compact.format(live.ntp.daily) : dash}
        caption={bento('ntpCaption', { servers: live?.ntp?.servers ?? 3 })}
        href={`/projects/${NTP_PROJECT_ID}`}
        note="osaka · singapore · phoenix"
      />
      <LiveTile
        icon={<Video className="size-4" strokeWidth={1.5} />}
        label="Atlas"
        value={live?.atlas ? whole.format(live.atlas.cameras) : dash}
        caption={bento('atlasCaption', { countries: live?.atlas?.countries ?? dash })}
        href={`/projects/${ATLAS_PROJECT_ID}`}
        note="atlas.aki.sh"
      />
      <LiveTile
        icon={<Plane className="size-4" strokeWidth={1.5} />}
        label="ADS-B"
        value={live?.adsb ? whole.format(live.adsb.aircraft) : dash}
        caption={bento('adsbCaption')}
        href="/radar"
        note="1090 MHz · tar1090"
      />
      <LiveTile
        icon={<Github className="size-4" strokeWidth={1.5} />}
        label="GitHub"
        value={momentum.status === 'loading' ? dash : whole.format(momentum.weeklyCommits)}
        caption={bento('githubCaption')}
        href={`https://github.com/${momentum.username}`}
        external
      >
        <Sparkline values={days.map((d) => d.commits)} />
      </LiveTile>
    </>
  );
}

function ActivitiesTile({ projects }: { projects: HomeProject[] }) {
  const bento = useTranslations('Bento');
  return (
    <div className="bento-card h-full">
      <TileLabel
        icon={<Terminal className="size-4" strokeWidth={1.5} />}
        right={
          <button
            type="button"
            onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            {bento('activitiesAll')}
          </button>
        }
      >
        {bento('activities')}
      </TileLabel>
      <ul className="space-y-2">
        {projects.slice(0, 5).map((project) => (
          <li key={project.id}>
            <Link
              href={`/projects/${project.id}`}
              onClick={rememberScroll}
              className="group flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-2 pr-3 hover:border-border-hover transition-colors"
            >
              <div className="relative h-11 w-19 shrink-0 overflow-hidden rounded-lg bg-muted">
                {project.thumbnail_url ? (
                  <Image src={project.thumbnail_url} alt="" fill sizes="80px" className="object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">{project.title}</p>
                <div className="mt-1 flex items-center gap-1.5 overflow-hidden">
                  <span className="shrink-0 whitespace-nowrap [&_span]:whitespace-nowrap">
                    <ProjectBadges kind={project.kind} status={project.status} />
                  </span>
                  {project.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="truncate text-[10px] font-mono text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StoryTile() {
  const about = useTranslations('About');
  return (
    <div className="bento-card h-full">
      <TileLabel icon={<Terminal className="size-4" strokeWidth={1.5} />}>{about('profileLabel')}</TileLabel>
      <div className="space-y-2 text-[13px] leading-relaxed text-muted-foreground">
        <p>{about('profileParagraph1', { grade: about(`grade.${schoolGradeKey(new Date())}`) })}</p>
        <p>{about('profileParagraph2')}</p>
        <p>{about('profileParagraph3')}</p>
        <p>{about('profileParagraph4')}</p>
      </div>
    </div>
  );
}

export default function HomeBento({ avatarUrl, projects }: { avatarUrl: string; projects: HomeProject[] }) {
  return (
    <section id="about" className="pt-20 sm:pt-24 pb-10 sm:pb-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4">
        <div className="col-span-2 lg:col-span-7 lg:row-span-2">
          <IntroTile />
        </div>
        <div className="col-span-2 lg:col-span-5">
          <ProfileTile avatarUrl={avatarUrl} />
        </div>
        <div className="col-span-2 lg:col-span-5">
          <ServersTile />
        </div>
        <div className="col-span-2 grid grid-cols-2 lg:col-span-12 lg:grid-cols-4 gap-3 sm:gap-4">
          <LiveTiles />
        </div>
        <div className="col-span-2 lg:col-span-7">
          <ActivitiesTile projects={projects} />
        </div>
        <div className="col-span-2 lg:col-span-5">
          <StoryTile />
        </div>
      </div>
    </section>
  );
}
