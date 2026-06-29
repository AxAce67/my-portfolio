'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight } from 'lucide-react';
import { Globe } from '@/components/ui/Globe';
import HomePageSections from '@/components/home/HomePageSections';
import { getHomePageData, type HomeProject, type HomeActiveProject } from '@/lib/content/publicContent';
import { navigationStateKeys, readSessionValue } from '@/lib/navigationState';
import { useHomeNavigationRestoration } from '@/hooks/useHomeNavigationRestoration';

export default function HomePage() {
  const [projects, setProjects] = useState<HomeProject[]>([]);
  const [activeProjects, setActiveProjects] = useState<HomeActiveProject[]>([]);
  const [dataReady, setDataReady] = useState(false);

  const [returningProjectId] = useState(() => {
    return readSessionValue(navigationStateKeys.returnToProjects) === '1'
      ? readSessionValue(navigationStateKeys.homeFromProjectId)
      : null;
  });

  useHomeNavigationRestoration(returningProjectId, dataReady);

  useEffect(() => {
    getHomePageData().then((data) => {
      setProjects(data.projects);
      setActiveProjects(data.activeProjects);
      setDataReady(true);
    });
  }, []);

  return (
    <>
      <HeroSection />
      <HomePageSections
        initialCompletedProjects={projects}
        initialActiveProjects={activeProjects}
        returningProjectId={returningProjectId}
        isLoading={!dataReady}
      />
    </>
  );
}

function HeroSection({ hidden = false }: { hidden?: boolean }) {
  const { t } = useTranslation('Hero');

  return (
    <section
      className={`relative w-full min-h-[100svh] px-4 sm:px-6 lg:px-8 pt-[4.5rem] sm:pt-20 pb-8 sm:pb-12 flex items-center justify-center ${hidden ? 'opacity-0 pointer-events-none' : ''}`}
      aria-hidden={hidden}
    >
      <div
        className="relative w-full max-w-6xl min-h-[34rem] sm:min-h-[36rem] lg:min-h-[42rem] rounded-[2rem] sm:rounded-[3rem] bg-[var(--hero-bg)] text-[var(--hero-fg)] overflow-hidden flex flex-col p-6 sm:p-10 lg:p-14 border border-[var(--hero-border)] shadow-[var(--hero-shadow)] transition-colors duration-500"
        style={{ willChange: 'transform', transform: 'translateZ(0)' }}
      >
        {/* Decorative gradients */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--hero-accent-rgb),0.08),transparent_60%)]" />
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_bottom_left,rgba(var(--hero-accent-soft-rgb),0.05),transparent_40%)]" />

        {/* Giant globe, peeking in from the bottom-right corner */}
        <div
          className="absolute -right-[13rem] -bottom-[13rem] w-[26rem] h-[26rem] sm:-right-[32rem] sm:-bottom-[32rem] sm:w-[64rem] sm:h-[64rem] z-0 hero-v3-globe"
          style={{ filter: 'drop-shadow(0 0 60px rgba(var(--hero-accent-rgb), 0.22))' }}
        >
          <Globe size={720} className="hero-globe-canvas" />
        </div>

        {/* Center content — left column, clear of the corner globe */}
        <div className="flex-1 flex flex-col justify-center z-10 relative mt-12 sm:mt-0 max-w-2xl">
          <div className="leading-[0.85] tracking-tighter font-black uppercase text-[clamp(4rem,15vw,11rem)] flex flex-col hero-v3-title">
            <span className="text-[var(--hero-fg)] mix-blend-difference drop-shadow-sm">HELLO</span>
            <span className="text-[var(--hero-fg)] mix-blend-difference drop-shadow-sm">WORLD</span>
          </div>

          <div className="mt-6 sm:mt-8 hero-v3-subtitle">
            <p className="text-xl sm:text-4xl font-bold tracking-tight mb-2">
              I'm Aki<span className="text-[var(--accent-muted)]">.</span>
            </p>
            <p className="text-sm sm:text-base text-[var(--muted-foreground)] max-w-xs leading-relaxed font-medium mb-7">
              {t('subtitle')}
            </p>

            <button
              onClick={() => document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })}
              className="group relative flex items-center justify-between gap-4 pl-6 pr-2 py-2 bg-[var(--hero-fg)] text-[var(--hero-bg)] rounded-full hover:scale-105 transition-transform active:scale-95 shadow-xl"
            >
              <span className="font-mono text-sm sm:text-base font-bold tracking-wide uppercase">{t('ctaPrimary')}</span>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[var(--hero-bg)]/20 flex items-center justify-center transition-transform group-hover:rotate-45">
                <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
