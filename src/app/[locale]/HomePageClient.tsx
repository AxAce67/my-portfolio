'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import HomePageSections from './HomePageSections';
import { navigationStateKeys, readSessionNumber, readSessionValue, removeSessionValue } from '@/lib/navigationState';

export type CompletedProject = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  image: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ActiveProject = {
  id: string;
  name: string;
  stage: number;
};

type HomePageClientProps = {
  initialCompletedProjects: CompletedProject[];
  initialActiveProjects: ActiveProject[];
};

function resolveHomeProjectsTransition() {
  window.__resolveHomeProjectsTransition?.();
  window.__resolveHomeProjectsTransition = undefined;
}

export default function HomePageClient({
  initialCompletedProjects,
  initialActiveProjects,
}: HomePageClientProps) {
  const [returningProjectId] = useState(() => {
    return readSessionValue(navigationStateKeys.returnToProjects) === '1'
      ? readSessionValue(navigationStateKeys.homeFromProjectId)
      : null;
  });
  const scrollRestoredRef = useRef(false);

  useLayoutEffect(() => {
    const savedScrollY = readSessionNumber(navigationStateKeys.homeScrollY);
    if (savedScrollY === null) return;

    window.scrollTo(0, savedScrollY);
    scrollRestoredRef.current = true;

    const projectId = returningProjectId;
    if (projectId) {
      const el = document.querySelector<HTMLElement>(`[data-card-id="${projectId}"]`);
      if (el) el.scrollIntoView({ block: 'nearest' });
    }

    window.requestAnimationFrame(() => {
      resolveHomeProjectsTransition();
    });
  }, [returningProjectId]);

  useEffect(() => {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const isReload = navigationEntry?.type === 'reload';
    const shouldRestoreProjects = readSessionValue(navigationStateKeys.returnToProjects) === '1';

    if (shouldRestoreProjects) {
      const savedScrollY = readSessionNumber(navigationStateKeys.homeScrollY);
      if (savedScrollY !== null && !scrollRestoredRef.current) {
        window.scrollTo(0, savedScrollY);
      }
      removeSessionValue(navigationStateKeys.homeScrollY);
      removeSessionValue(navigationStateKeys.homeFromProjectId);
      removeSessionValue(navigationStateKeys.returnToProjects);
      return;
    }

    if (isReload) {
      const previousRestoration = window.history.scrollRestoration;
      window.history.scrollRestoration = 'manual';
      if (window.location.hash) {
        const cleanUrl = `${window.location.pathname}${window.location.search}`;
        window.history.replaceState(window.history.state, '', cleanUrl);
      }
      const forceTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      forceTop();
      const singleRafId = window.requestAnimationFrame(forceTop);
      const timeoutId = window.setTimeout(forceTop, 80);

      const onLoad = () => {
        forceTop();
        window.history.scrollRestoration = previousRestoration;
      };
      window.addEventListener('load', onLoad, { once: true });
      return () => {
        window.cancelAnimationFrame(singleRafId);
        window.clearTimeout(timeoutId);
        window.removeEventListener('load', onLoad);
        window.history.scrollRestoration = previousRestoration;
      };
    }

    const hash = window.location.hash?.replace('#', '');
    if (!hash) {
      return;
    }

    let attempts = 0;
    const maxAttempts = 12;
    const tryScroll = () => {
      const target = document.getElementById(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
        window.requestAnimationFrame(() => {
          resolveHomeProjectsTransition();
        });
        return;
      }
      attempts += 1;
      if (attempts < maxAttempts) {
        window.setTimeout(tryScroll, 80);
      }
    };
    window.setTimeout(tryScroll, 0);
  }, []);

  return (
    <>
      <HeroSection />
      <HomePageSections
        initialCompletedProjects={initialCompletedProjects}
        initialActiveProjects={initialActiveProjects}
        returningProjectId={returningProjectId}
      />
    </>
  );
}

function HeroSection({ hidden = false }: { hidden?: boolean }) {
  const t = useTranslations('Hero');

  return (
    <section
      className={`relative min-h-[92svh] sm:min-h-screen flex flex-col px-6 sm:px-10 lg:px-14 pt-14 sm:pt-16 pb-10 sm:pb-14 overflow-hidden ${hidden ? 'opacity-0 pointer-events-none' : ''}`}
      aria-hidden={hidden}
    >
      {/* Ambient orbs */}
      <div className="hero-orb hero-orb--1" aria-hidden="true" />
      <div className="hero-orb hero-orb--2" aria-hidden="true" />
      <div className="hero-orb hero-orb--3" aria-hidden="true" />

      {/* Grid + grain + vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
        <div className="hero-spotlight-grid" />
        <svg className="hero-grain-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <filter id="hero-grain-f" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#hero-grain-f)" />
        </svg>
        <div className="hero-vignette-overlay" />
      </div>

      {/* Center: eyebrow + huge outline name */}
      <div className="relative flex flex-1 flex-col items-center justify-center gap-1 sm:gap-2" style={{ zIndex: 10 }}>
        <p className="hero-eyebrow hero-eyebrow--center">{t('role')}</p>
        <svg
          className="hero-svg-name"
          viewBox="0 0 1000 400"
          aria-label={t('name')}
          role="img"
          overflow="visible"
          focusable="false"
        >
          <text
            x="500"
            y="360"
            textAnchor="middle"
            fill="none"
            vectorEffect="non-scaling-stroke"
            className="hero-svg-text"
          >
            {t('name')}
          </text>
        </svg>
      </div>

      {/* Bottom bar: slogan left — clock center — CTA right */}
      <div className="hero-v5-bottom">
        <div className="flex flex-col gap-1">
          <p className="text-base sm:text-lg lg:text-xl xl:text-2xl font-medium tracking-tight">{t('title')}</p>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground font-light">{t('subtitle')}</p>
        </div>
        <HeroClock />
        <button
          onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
          className="btn-primary flex items-center gap-2"
        >
          {t('ctaPrimary')}
          <ArrowUpRight className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </section>
  );
}

const tokyoFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Tokyo',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

function HeroClock() {
  const [time, setTime] = useState('');
  const tidRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Self-correcting tick: fires at the start of each second boundary
    const scheduleTick = () => {
      const now = Date.now();
      setTime(tokyoFmt.format(new Date(now)));
      const delay = 1000 - (now % 1000);
      tidRef.current = setTimeout(scheduleTick, delay);
    };

    scheduleTick();

    return () => { if (tidRef.current) clearTimeout(tidRef.current); };
  }, []);

  return (
    <div className="hero-clock" aria-hidden="true">
      <span className="hero-clock__loc">Tokyo, Japan</span>
      <span className="hero-clock__sep" />
      <span className="hero-clock__time">{time || '--:--:--'}</span>
      <span className="hero-clock__tz">UTC+9</span>
    </div>
  );
}
