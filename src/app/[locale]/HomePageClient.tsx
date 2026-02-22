'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const HeroScene = dynamic(() => import('@/components/three/HeroScene'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 -z-10 pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,rgb(var(--foreground-rgb)_/_0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_58%,rgb(var(--foreground-rgb)_/_0.06),transparent_48%)]" />
    </div>
  ),
});

const HomePageSections = dynamic(() => import('./HomePageSections'), {
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

    const fallbackId = window.setTimeout(() => setShowSections(true), 900);

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(() => {
        window.clearTimeout(fallbackId);
        setShowSections(true);
      });

      return () => {
        window.clearTimeout(fallbackId);
        window.cancelIdleCallback(idleId);
      };
    }

    return () => {
      window.clearTimeout(fallbackId);
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
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [isTypingDone, setIsTypingDone] = useState(false);
  const [showScene, setShowScene] = useState(false);
  const [sceneQuality, setSceneQuality] = useState<'full' | 'lite'>('full');
  const description = t('description');
  const typingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    setIsTypingDone(false);

    const startTyping = () => {
      typingRef.current = setInterval(() => {
        if (index < description.length) {
          setDisplayedText(description.slice(0, index + 1));
          index += 1;
        } else {
          if (typingRef.current) clearInterval(typingRef.current);
          setIsTypingDone(true);
        }
      }, 80);
    };

    const delay = setTimeout(startTyping, 150);
    return () => {
      clearTimeout(delay);
      if (typingRef.current) clearInterval(typingRef.current);
    };
  }, [description]);

  useEffect(() => {
    const interval = setInterval(() => setShowCursor((p) => !p), 700);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    let sceneTimer: number | null = null;
    let idleId: number | null = null;
    const win = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    const scheduleScene = () => {
      if (sceneTimer !== null) {
        window.clearTimeout(sceneTimer);
      }
      if (idleId !== null && typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(idleId);
      }

      if (reducedMotionQuery.matches) {
        setShowScene(false);
        return;
      }

      const isDesktop = desktopQuery.matches;
      const navigatorWithConnection = navigator as Navigator & { connection?: { saveData?: boolean } };
      const saveData = navigatorWithConnection.connection?.saveData === true;
      const lowCpu = (navigator.hardwareConcurrency ?? 8) <= 4;
      const shouldUseLite = !isDesktop || saveData || lowCpu;
      setSceneQuality(shouldUseLite ? 'lite' : 'full');

      const revealScene = () => setShowScene(true);
      const revealDelay = shouldUseLite ? 1800 : 900;

      if (typeof win.requestIdleCallback === 'function') {
        idleId = win.requestIdleCallback(
          () => {
            sceneTimer = window.setTimeout(revealScene, revealDelay);
          },
          { timeout: shouldUseLite ? 2500 : 1400 }
        );
      } else {
        sceneTimer = window.setTimeout(revealScene, revealDelay);
      }
    };

    const handlePreferenceChange = () => {
      scheduleScene();
    };

    scheduleScene();

    reducedMotionQuery.addEventListener?.('change', handlePreferenceChange);
    desktopQuery.addEventListener?.('change', handlePreferenceChange);

    return () => {
      if (sceneTimer !== null) {
        window.clearTimeout(sceneTimer);
      }
      if (idleId !== null && typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(idleId);
      }
      reducedMotionQuery.removeEventListener?.('change', handlePreferenceChange);
      desktopQuery.removeEventListener?.('change', handlePreferenceChange);
    };
  }, []);

  return (
    <section
      className={`relative min-h-[92svh] sm:min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-14 sm:pt-0 overflow-hidden ${
        hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-hidden={hidden}
    >
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,rgb(var(--foreground-rgb)_/_0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_58%,rgb(var(--foreground-rgb)_/_0.06),transparent_48%)]" />
      </div>
      {showScene ? <HeroScene quality={sceneQuality} /> : null}

      <motion.p
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="font-mono text-[10px] sm:text-xs text-muted-foreground mb-8 sm:mb-12 tracking-[0.18em] sm:tracking-widest"
      >
        {t('greeting')}
      </motion.p>

      <motion.div
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-[-0.04em] text-center leading-[1.1]">
          {t('title')}
        </h1>
      </motion.div>

      <motion.p
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="text-sm sm:text-lg text-muted-foreground font-light mt-4 sm:mt-6 mb-8 sm:mb-10 tracking-wide text-center"
      >
        {t('subtitle')}
      </motion.p>

      <div className="min-h-8 flex items-center px-2 sm:px-0">
        <p className="font-mono text-xs sm:text-base text-foreground text-center break-words">
          {displayedText}
          <span
            className={`inline-block w-[1.5px] h-4 ml-0.5 bg-foreground align-middle transition-opacity ${
              showCursor ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </p>
      </div>

      {isTypingDone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="absolute bottom-12"
        >
          <button
            onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="font-mono text-[11px] tracking-wider">{t('scrollDown')}</span>
            <ChevronDown className="w-4 h-4 animate-float" strokeWidth={1.5} />
          </button>
        </motion.div>
      )}

    </section>
  );
}
