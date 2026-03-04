'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
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
  const [isTypingDone, setIsTypingDone] = useState(false);
  const description = t('description');

  useEffect(() => {
    const id = window.setTimeout(() => setIsTypingDone(true), 120);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <section
      className={`relative min-h-[92svh] sm:min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-14 sm:pt-0 overflow-hidden ${hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      aria-hidden={hidden}
    >
      {/* Background layers */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="hero-spotlight-grid" />
        <div className="hero-vignette-overlay" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        <p className="font-mono text-[12px] sm:text-xs text-muted-foreground mb-8 sm:mb-12 tracking-[0.18em] sm:tracking-widest">
          {t('greeting')}
        </p>

        <div>
          <h1 className="hero-gradient-title text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-[-0.04em] text-center leading-[1.1]">
            {t('title')}
          </h1>
        </div>

        <p className="text-sm sm:text-lg text-muted-foreground font-light mt-4 sm:mt-6 mb-8 sm:mb-10 tracking-wide text-center">
          {t('subtitle')}
        </p>

        <div className="min-h-8 flex items-center px-2 sm:px-0">
          <p className="font-mono text-xs sm:text-base text-foreground text-center break-words">
            {description}
          </p>
        </div>
      </div>

      {isTypingDone && (
        <div className="absolute bottom-12 animate-fade-in">
          <button
            onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="font-mono text-[11px] tracking-wider">{t('scrollDown')}</span>
            <ChevronDown className="w-4 h-4 animate-float" strokeWidth={1.5} />
          </button>
        </div>
      )}

    </section>
  );
}
