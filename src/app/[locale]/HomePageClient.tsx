'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import dynamic from 'next/dynamic';

const HomePageSections = dynamic(() => import('./HomePageSections'), {
  ssr: false,
  loading: () => (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="h-8 w-44 bg-muted rounded mb-8" />
      <div className="h-32 bg-muted rounded" />
    </div>
  ),
});

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

export default function HomePageClient({
  initialCompletedProjects,
  initialActiveProjects,
}: HomePageClientProps) {
  const [showSections, setShowSections] = useState(false);
  const [restoreProjectsOnBack, setRestoreProjectsOnBack] = useState(false);
  const sectionsTriggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    const isReload = navigationEntry?.type === 'reload';
    const shouldRestoreProjects = sessionStorage.getItem('returnToProjects') === '1';

    if (shouldRestoreProjects) {
      setRestoreProjectsOnBack(true);
      setShowSections(true);
      return;
    }

    if (isReload) {
      const previousRestoration = window.history.scrollRestoration;
      window.history.scrollRestoration = 'manual';
      if (window.location.hash) {
        const cleanUrl = `${window.location.pathname}${window.location.search}`;
        window.history.replaceState(window.history.state, '', cleanUrl);
      }
      // Ensure sections still mount on reload.
      setShowSections(true);
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

    // If user lands with a hash (e.g. /#projects), mount sections immediately
    // so the target can be displayed without delayed jump scrolling.
    if (window.location.hash) {
      setShowSections(true);
      return;
    }

    const onHashChange = () => {
      if (window.location.hash) {
        setShowSections(true);
      }
    };
    window.addEventListener('hashchange', onHashChange);

    const triggerEl = sectionsTriggerRef.current;
    if (!triggerEl) {
      return () => {
        window.removeEventListener('hashchange', onHashChange);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setShowSections(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        rootMargin: '220px 0px',
        threshold: 0,
      },
    );

    observer.observe(triggerEl);

    return () => {
      window.removeEventListener('hashchange', onHashChange);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!showSections) return;

    const hash = window.location.hash?.replace('#', '');

    if (restoreProjectsOnBack) {
      let attempts = 0;
      const maxAttempts = 16;
      const tryRestoreProjects = () => {
        const target = document.getElementById('projects');
        if (target) {
          target.scrollIntoView({ behavior: 'auto', block: 'start' });
          sessionStorage.removeItem('returnToProjects');
          setRestoreProjectsOnBack(false);
          return;
        }
        attempts += 1;
        if (attempts < maxAttempts) {
          window.setTimeout(tryRestoreProjects, 80);
        } else {
          sessionStorage.removeItem('returnToProjects');
          setRestoreProjectsOnBack(false);
        }
      };
      window.setTimeout(tryRestoreProjects, 0);
      return;
    }

    if (!hash) {
      sessionStorage.removeItem('returnToProjects');
      return;
    }

    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    // On browser back/forward, let native scroll restoration handle position.
    if (navigationEntry?.type === 'back_forward') return;

    // Sections are lazy-mounted; retry briefly until the target exists.
    let attempts = 0;
    const maxAttempts = 12;
    const tryScroll = () => {
      const target = document.getElementById(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
        return;
      }
      attempts += 1;
      if (attempts < maxAttempts) {
        window.setTimeout(tryScroll, 80);
      }
    };

    window.setTimeout(tryScroll, 0);
  }, [showSections, restoreProjectsOnBack]);

  return (
    <>
      <HeroSection hidden={restoreProjectsOnBack} />
      <div ref={sectionsTriggerRef} className="h-px w-full" aria-hidden />
      {showSections ? (
        <HomePageSections
          initialCompletedProjects={initialCompletedProjects}
          initialActiveProjects={initialActiveProjects}
        />
      ) : null}
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

      {/* Bottom bar: slogan left — CTA right */}
      <div className="hero-v5-bottom">
        <div className="flex flex-col gap-1">
          <p className="text-base sm:text-lg lg:text-xl xl:text-2xl font-medium tracking-tight">{t('title')}</p>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground font-light">{t('subtitle')}</p>
        </div>
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
