'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode, ComponentType } from 'react';
import Script from 'next/script';
import Image from 'next/image';
import { ArrowUpRight, Send, Terminal, Code2, Globe, Box, Github, Twitter, Mail, List, LayoutGrid, CheckCircle2, Film, Sparkles, Wrench } from 'lucide-react';
import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/ScrollReveal';
import { Link } from '@/i18n/routing';
import { useTransitionRouter } from 'next-view-transitions';
import TechStackSectionStatic from '@/components/sections/TechStackSection';
import { TiltCard } from '@/components/ui/TiltCard';
import {
  SiTypescript,
  SiJavascript,
  SiPython,
  SiHtml5,
  SiCss,
  SiNextdotjs,
  SiReact,
  SiTailwindcss,
  SiSupabase,
  SiClaude,
  SiGooglegemini,
  SiVercel,
} from '@icons-pack/react-simple-icons';
import { SiOpenai, SiAdobepremierepro, SiCanva } from 'react-icons/si';
import type { ActiveProject, CompletedProject } from './HomePageClient';

const TechStackSection = TechStackSectionStatic;

type SkillCategory = 'Languages' | 'Stack' | 'AI' | 'Creative';
type SkillIconComponent = ComponentType<{ size?: number | string; className?: string }>;
type SkillItem = {
  name: string;
  category: SkillCategory;
  featured?: boolean;
  icon?: SkillIconComponent;
  iconSrc?: string;
  level?: 'main' | 'familiar' | 'learning';
};

const FilmoraIcon: SkillIconComponent = ({ size = 16, className = '' }) => (
  <Film width={size} height={size} strokeWidth={1.5} className={className} />
);

const sampleSkills: SkillItem[] = [
  { name: 'TypeScript', category: 'Languages', featured: true, icon: SiTypescript, level: 'main' },
  { name: 'Python', category: 'Languages', featured: true, icon: SiPython, level: 'main' },
  { name: 'JavaScript', category: 'Languages', icon: SiJavascript, level: 'familiar' },
  { name: 'HTML', category: 'Languages', icon: SiHtml5, level: 'familiar' },
  { name: 'CSS', category: 'Languages', icon: SiCss, level: 'familiar' },

  { name: 'Next.js', category: 'Stack', featured: true, icon: SiNextdotjs, level: 'main' },
  { name: 'React', category: 'Stack', featured: true, icon: SiReact, level: 'main' },
  { name: 'Tailwind CSS', category: 'Stack', icon: SiTailwindcss, level: 'familiar' },
  { name: 'Supabase', category: 'Stack', icon: SiSupabase, level: 'familiar' },
  { name: 'Vercel', category: 'Stack', icon: SiVercel, level: 'familiar' },

  { name: 'ChatGPT / Codex', category: 'AI', featured: true, icon: SiOpenai, level: 'main' },
  { name: 'Claude / Claude Code', category: 'AI', featured: true, icon: SiClaude, level: 'main' },
  { name: 'Gemini', category: 'AI', icon: SiGooglegemini, level: 'familiar' },
  { name: 'Manus', category: 'AI', iconSrc: '/brands/manus.svg', level: 'familiar' },

  { name: 'Adobe Premiere Pro', category: 'Creative', featured: true, icon: SiAdobepremierepro, level: 'main' },
  { name: 'Wondershare Filmora', category: 'Creative', icon: FilmoraIcon, level: 'familiar' },
  { name: 'Canva', category: 'Creative', icon: SiCanva, level: 'familiar' },
];

const profileLinks = [
  {
    id: 'github',
    label: 'GitHub',
    href: 'https://github.com/AxAce67',
    icon: <Github className="w-4 h-4" strokeWidth={1.5} />,
  },
  {
    id: 'x',
    label: 'X',
    href: 'https://x.com/real_Aki',
    icon: <Twitter className="w-4 h-4" strokeWidth={1.5} />,
  },
  {
    id: 'email',
    label: 'Email',
    href: '',
    disabled: true,
    icon: <Mail className="w-4 h-4" strokeWidth={1.5} />,
  },
];

type HomePageSectionsProps = {
  initialCompletedProjects: CompletedProject[];
  initialActiveProjects: ActiveProject[];
};

type AboutStatItem = {
  value: number;
  suffix?: string;
  label: string;
};

type GitHubMomentumStatus = 'loading' | 'ready' | 'error';
type GitHubDaySummary = {
  key: string;
  shortLabel: string;
  commits: number;
};

type GitHubMomentumApiResponse = {
  ok: boolean;
  username: string;
  weeklyCommits: number;
  streakDays: number;
  daily: Array<{ date: string; commits: number }>;
  updatedAt: string;
  source: 'graphql' | 'events';
};

declare global {
  interface Window {
    onTurnstileSuccess?: (token: string) => void;
    onTurnstileExpired?: () => void;
    onTurnstileError?: () => void;
    turnstile?: {
      reset: () => void;
    };
  }
}

export default function HomePageSections({
  initialCompletedProjects,
  initialActiveProjects,
}: HomePageSectionsProps) {
  return (
    <>
      <AboutSection />
      <SkillsSection />
      <TechStackSection />
      <ProjectsSection initialProjects={initialCompletedProjects} />
      <ActiveProjectsSection initialActiveProjects={initialActiveProjects} />
      <ContactSection />
    </>
  );
}

function CountUpNumber({
  end,
  suffix = '',
  durationMs = 1400,
  play,
}: {
  end: number;
  suffix?: string;
  durationMs?: number;
  play: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [value, setValue] = useState(0);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!play) {
      setValue(0);
      setIsDone(false);
      return;
    }

    if (prefersReducedMotion) {
      setValue(end);
      setIsDone(true);
      return;
    }

    let rafId = 0;
    const startedAt = performance.now();
    setValue(0);
    setIsDone(false);

    const easeOutExpo = (x: number) => x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    const tick = (time: number) => {
      const elapsed = time - startedAt;
      const progress = Math.min(1, elapsed / durationMs);
      const eased = easeOutExpo(progress);
      setValue(Math.round(end * eased));

      if (progress < 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        setValue(end);
        setIsDone(true);
      }
    };

    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [durationMs, end, play, prefersReducedMotion]);

  return (
    <span className="tabular-nums">
      {value}
      {suffix ? (
        <span className={`inline-block transition-opacity duration-200 ${isDone ? 'opacity-100' : 'opacity-0'}`}>{suffix}</span>
      ) : null}
    </span>
  );
}

function AboutStatCard({
  value,
  suffix,
  label,
  durationMs,
  className = '',
}: {
  value: number;
  suffix?: string;
  label: string;
  durationMs: number;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const isCardInView = useInView(cardRef, { once: true, amount: 0.5 });

  return (
    <TiltCard className={`bento-card about-card-motion flex flex-col items-center justify-center ${className}`.trim()}>
      <div ref={cardRef} className="flex flex-col items-center justify-center">
        <p className="text-2xl sm:text-4xl font-bold tracking-tight tabular-nums">
          <CountUpNumber end={value} suffix={suffix} durationMs={durationMs} play={isCardInView} />
        </p>
        <p className="text-[12px] text-muted-foreground mt-2 tracking-wider uppercase font-mono text-center">{label}</p>
      </div>
    </TiltCard>
  );
}

function MomentumLineChart({
  days,
}: {
  days: GitHubDaySummary[];
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const rawMax = Math.max(...days.map((day) => day.commits), 0);
  const getNiceMax = (value: number) => {
    if (value <= 5) return 5;

    const niceSteps = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10];
    const magnitude = 10 ** Math.floor(Math.log10(value));
    const normalized = value / magnitude;
    const niceNormalized = niceSteps.find((step) => normalized <= step) ?? 10;
    return niceNormalized * magnitude;
  };
  const maxValue = getNiceMax(rawMax);
  const getTickLabel = (value: number) => {
    if (value >= 100) return Math.round(value);
    if (value >= 10) return Math.round(value * 2) / 2;
    return Math.round(value * 10) / 10;
  };
  const midValue = getTickLabel(maxValue / 2);
  const bottomValue = 0;
  const activeDay = activeIndex !== null ? days[activeIndex] : null;
  const chartStepX = 100 / Math.max(days.length, 1);
  const chartStartX = chartStepX / 2;
  const chartEndX = 100 - chartStartX;
  const axisLabelX = Math.max(0.8, chartStartX - 1.2);
  const points = days.map((day, index) => {
    const x = chartStartX + index * chartStepX;
    const y = 34 - (day.commits / maxValue) * 26;
    return { x, y };
  });
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <div className="space-y-2" onMouseLeave={() => setActiveIndex(null)}>
      <div className="rounded-lg border border-border bg-muted/60 px-2 py-2">
        <svg viewBox="0 0 100 40" className="w-full h-24" preserveAspectRatio="none" role="img" aria-label="Weekly commit trend">
          <line x1={chartStartX} y1="34" x2={chartEndX} y2="34" stroke="currentColor" strokeOpacity={0.18} strokeWidth="0.5" vectorEffect="non-scaling-stroke" className="text-foreground" />
          <line x1={chartStartX} y1="21" x2={chartEndX} y2="21" stroke="currentColor" strokeOpacity={0.14} strokeWidth="0.5" vectorEffect="non-scaling-stroke" className="text-foreground" />
          <line x1={chartStartX} y1="8" x2={chartEndX} y2="8" stroke="currentColor" strokeOpacity={0.1} strokeWidth="0.5" vectorEffect="non-scaling-stroke" className="text-foreground" />
          <text x={axisLabelX} y="8" textAnchor="end" dominantBaseline="middle" fontSize="2.5" fill="currentColor" fillOpacity="0.52" className="font-mono">{maxValue}</text>
          <text x={axisLabelX} y="21" textAnchor="end" dominantBaseline="middle" fontSize="2.5" fill="currentColor" fillOpacity="0.48" className="font-mono">{midValue}</text>
          <text x={axisLabelX} y="34" textAnchor="end" dominantBaseline="middle" fontSize="2.5" fill="currentColor" fillOpacity="0.44" className="font-mono">{bottomValue}</text>
          <polyline
            fill="none"
            stroke="currentColor"
            strokeOpacity={0.62}
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
            points={linePoints}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-foreground"
          />
          {points.map((point, index) => (
            <line
              key={`${days[index].key}-point`}
              x1={point.x}
              x2={point.x}
              y1={point.y - (index === activeIndex ? 0.9 : 0.6)}
              y2={point.y + (index === activeIndex ? 0.9 : 0.6)}
              stroke="currentColor"
              strokeOpacity={index === activeIndex ? 0.95 : 0.45}
              strokeWidth={index === activeIndex ? 1.4 : 1}
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              className="text-foreground"
            />
          ))}
          {points.map((point, index) => {
            const x = Math.max(0, point.x - chartStepX / 2);
            const width = chartStepX;
            return (
              <rect
                key={`${days[index].key}-hit`}
                x={x}
                y="0"
                width={width}
                height="40"
                fill="transparent"
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onClick={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(null)}
                className="cursor-pointer"
              />
            );
          })}
        </svg>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => (
          <button
            key={`${day.key}-label`}
            type="button"
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            onClick={() => setActiveIndex(index)}
            onBlur={() => setActiveIndex(null)}
            className={`text-[12px] font-mono text-center transition-colors ${index === activeIndex ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            {day.shortLabel}
          </button>
        ))}
      </div>
      <div className={`text-[11px] font-mono tabular-nums min-h-[1.25rem] transition-opacity ${activeDay ? 'text-muted-foreground opacity-100' : 'opacity-0'}`}>
        {activeDay ? `${activeDay.shortLabel} ${activeDay.key} · ${activeDay.commits} commits` : '\u00A0'}
      </div>
    </div>
  );
}

function AboutSection() {
  const t = useTranslations('About');
  const locale = useLocale();
  const focusAreas = ['productThinking', 'rapidPrototyping', 'uiUxDesign', 'problemSolving', 'research', 'continuousImprovement'] as const;
  const stats: AboutStatItem[] = [
    { value: 7, suffix: '+', label: t('statsProjects') },
    { value: 20, suffix: '+', label: t('statsTechnologies') },
    { value: 2, suffix: '+', label: t('statsYears') },
    { value: 4, label: t('statsCommits') },
  ];
  const [momentumStatus, setMomentumStatus] = useState<GitHubMomentumStatus>('loading');
  const [githubUsername, setGithubUsername] = useState('AxAce67');
  const [weeklyCommits, setWeeklyCommits] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [dailyData, setDailyData] = useState<Array<{ date: string; commits: number }>>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const fallbackDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const now = new Date();
        const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (6 - index)));
        return { date: date.toISOString().slice(0, 10), commits: 0 };
      }),
    [],
  );
  const daysForRender = dailyData.length === 7 ? dailyData : fallbackDays;
  const daySummaries: GitHubDaySummary[] = daysForRender.map((day) => {
    const date = new Date(`${day.date}T00:00:00Z`);
    return {
      key: day.date,
      shortLabel: new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date),
      commits: day.commits,
    };
  });

  useEffect(() => {
    const controller = new AbortController();
    const fetchMomentum = async () => {
      setMomentumStatus('loading');

      try {
        const response = await fetch('/api/github/momentum', {
          signal: controller.signal,
          cache: 'no-store',
        });
        const payload = (await response.json()) as GitHubMomentumApiResponse;
        if (!response.ok || !payload.ok) {
          throw new Error('Failed to fetch momentum from server API');
        }
        setGithubUsername(payload.username || 'AxAce67');
        setDailyData(Array.isArray(payload.daily) ? payload.daily.slice(-7) : fallbackDays);
        setWeeklyCommits(payload.weeklyCommits ?? 0);
        setStreakDays(payload.streakDays ?? 0);
        setLastUpdatedAt(payload.updatedAt ?? new Date().toISOString());
        setMomentumStatus('ready');
      } catch {
        if (controller.signal.aborted) return;
        setDailyData(fallbackDays);
        setWeeklyCommits(0);
        setStreakDays(0);
        setLastUpdatedAt(null);
        setMomentumStatus('error');
      }
    };

    void fetchMomentum();
    return () => controller.abort();
  }, [fallbackDays]);

  const weeklyValueLabel = momentumStatus === 'loading' ? '...' : weeklyCommits.toString();
  const streakValueLabel = momentumStatus === 'loading' ? '...' : `${streakDays}${t('momentum.daySuffix')}`;
  const updatedDateLabel = lastUpdatedAt
    ? new Intl.DateTimeFormat(locale, { month: '2-digit', day: '2-digit' }).format(new Date(lastUpdatedAt))
    : '--';

  return (
    <section id="about" className="py-20 sm:py-32 lg:py-36">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="none">
          <p className="section-label">{t('sectionTitle')}</p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-8 sm:mb-12">{t('heading')}</h2>
        </ScrollReveal>

        <div className="md:hidden space-y-3">
          <ScrollReveal delay={0.15}>
            <div className="bento-card about-card-motion">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/images/profile/akiz-profile.jpg"
                  alt="Aki profile"
                  width={48}
                  height={48}
                  loading="lazy"
                  className="w-12 h-12 rounded-full object-cover border border-border"
                />
                <div>
                  <p className="text-sm font-semibold tracking-tight">Aki</p>
                  <p className="text-[11px] text-muted-foreground font-mono tracking-wide uppercase">{t('role')}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {profileLinks.map((link) =>
                  link.disabled ? (
                    <span
                      key={link.id}
                      className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-md border border-border text-muted-foreground opacity-50 cursor-not-allowed"
                      aria-label={`${link.label} (disabled)`}
                    >
                      <span>{link.icon}</span>
                      <span className="text-[12px] font-mono tracking-wide">{link.label}</span>
                    </span>
                  ) : (
                    <a
                      key={link.id}
                      href={link.href}
                      className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-md border border-border text-foreground/90 hover:text-foreground hover:border-border-hover transition-colors"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <span>{link.icon}</span>
                      <span className="text-[12px] font-mono tracking-wide">{link.label}</span>
                    </a>
                  )
                )}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <StaggerContainer className="grid grid-cols-2 gap-2" staggerDelay={0.04}>
              {stats.map(({ value, suffix, label }, idx) => (
                <StaggerItem key={label}>
                  <AboutStatCard value={value} suffix={suffix} label={label} durationMs={900 + idx * 80} className="py-4" />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </ScrollReveal>

          <ScrollReveal delay={0.25}>
            <div className="bento-card about-card-motion">
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{t('profileLabel')}</span>
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{t('profileParagraph1')}</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed mt-2">{t('profileParagraph2')}</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed mt-2">{t('profileParagraph3')}</p>
              <p className="text-[13px] text-muted-foreground leading-relaxed mt-2">{t('profileParagraph4')}</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="bento-card about-card-motion">
              <div className="flex items-center gap-2 mb-3">
                <Code2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{t('focusLabel')}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {focusAreas.map((area) => (
                  <span key={area} className="text-[11px] font-mono text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                    {t(`focus.${area}`)}
                  </span>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.34}>
            <TiltCard className="bento-card about-card-motion">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{t('momentum.label')}</span>
                </div>
                <span className="text-[12px] font-mono text-muted-foreground px-2 py-1 rounded-md border border-border">@{githubUsername}</span>
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{t('momentum.description')}</p>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="rounded-lg border border-border bg-muted/60 px-3 py-2.5">
                  <p className="text-xl font-bold tracking-tight tabular-nums">{weeklyValueLabel}</p>
                  <p className="text-[12px] font-mono tracking-wide uppercase text-muted-foreground mt-1">{t('momentum.weeklyCommits')}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/60 px-3 py-2.5">
                  <p className="text-xl font-bold tracking-tight tabular-nums">{streakValueLabel}</p>
                  <p className="text-[12px] font-mono tracking-wide uppercase text-muted-foreground mt-1">{t('momentum.streak')}</p>
                </div>
              </div>
              <div className="mt-4">
                <MomentumLineChart days={daySummaries} />
              </div>
              <p className="text-[12px] text-muted-foreground mt-3">
                {momentumStatus === 'error'
                  ? t('momentum.unavailable')
                  : `${t('momentum.updated')}: ${updatedDateLabel} · ${t('momentum.note')}`}
              </p>
            </TiltCard>
          </ScrollReveal>
        </div>

        <div className="hidden md:grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[minmax(120px,auto)] md:auto-rows-[minmax(140px,auto)]">
          <ScrollReveal delay={0.15} direction="left" className="order-2 md:col-start-1 md:row-start-2 md:col-span-2 md:row-span-2">
            <TiltCard className="bento-card about-card-motion p-5 h-full flex flex-col justify-start">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Terminal className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{t('profileLabel')}</span>
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{t('profileParagraph1')}</p>
                <p className="text-[13px] text-muted-foreground leading-relaxed mt-2">{t('profileParagraph2')}</p>
                <p className="text-[13px] text-muted-foreground leading-relaxed mt-2">{t('profileParagraph3')}</p>
                <p className="text-[13px] text-muted-foreground leading-relaxed mt-2">{t('profileParagraph4')}</p>
              </div>
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal delay={0.2} direction="scale">
            <AboutStatCard value={stats[0].value} suffix={stats[0].suffix} label={stats[0].label} durationMs={1200} className="h-full py-5" />
          </ScrollReveal>

          <ScrollReveal delay={0.24} direction="scale">
            <AboutStatCard value={stats[1].value} suffix={stats[1].suffix} label={stats[1].label} durationMs={1300} className="h-full py-5" />
          </ScrollReveal>

          <ScrollReveal delay={0.28} direction="scale">
            <AboutStatCard value={stats[2].value} suffix={stats[2].suffix} label={stats[2].label} durationMs={1400} className="h-full py-5" />
          </ScrollReveal>

          <ScrollReveal delay={0.32} direction="scale">
            <AboutStatCard value={stats[3].value} label={stats[3].label} durationMs={1500} className="h-full py-5" />
          </ScrollReveal>

          <ScrollReveal delay={0.2} direction="right" className="md:col-span-2">
            <TiltCard className="bento-card about-card-motion h-full flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-3">
                <Code2 className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{t('focusLabel')}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {focusAreas.map((area) => (
                  <span key={area} className="text-[11px] font-mono text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                    {t(`focus.${area}`)}
                  </span>
                ))}
              </div>
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal delay={0.25} direction="right" className="order-1 md:col-start-1 md:row-start-1 md:col-span-2 md:row-span-1">
            <TiltCard className="bento-card about-card-motion h-full flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{t('linksLabel')}</span>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/images/profile/akiz-profile.jpg"
                  alt="Aki profile"
                  width={48}
                  height={48}
                  loading="lazy"
                  className="w-12 h-12 rounded-full object-cover border border-border"
                />
                <div>
                  <p className="text-sm font-semibold tracking-tight">Aki</p>
                  <p className="text-[11px] text-muted-foreground font-mono tracking-wide uppercase">{t('role')}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
                {profileLinks.map((link) =>
                  link.disabled ? (
                    <span
                      key={link.id}
                      className="flex items-center gap-2 px-3 py-1 rounded-lg border border-border text-muted-foreground opacity-50 cursor-not-allowed"
                      aria-label={`${link.label} (disabled)`}
                    >
                      <span>{link.icon}</span>
                      <span className="text-xs font-mono tracking-wide">{link.label}</span>
                    </span>
                  ) : (
                    <a
                      key={link.id}
                      href={link.href}
                      className="flex items-center gap-2 px-3 py-1 rounded-lg border border-border hover:border-border-hover text-foreground/90 hover:text-foreground transition-colors"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <span>{link.icon}</span>
                      <span className="text-xs font-mono tracking-wide">{link.label}</span>
                    </a>
                  )
                )}
              </div>
            </TiltCard>
          </ScrollReveal>

          <ScrollReveal delay={0.35} direction="up" className="md:col-span-4">
            <TiltCard className="bento-card about-card-motion h-full">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{t('momentum.label')}</span>
                </div>
                <span className="text-[12px] font-mono text-muted-foreground px-2 py-1 rounded-md border border-border">@{githubUsername}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:items-start">
                <div className="md:col-span-2 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-border bg-muted/60 p-3">
                    <p className="text-3xl font-bold tracking-tight tabular-nums">{weeklyValueLabel}</p>
                    <p className="text-[12px] font-mono tracking-wide uppercase text-muted-foreground mt-1">{t('momentum.weeklyCommits')}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/60 p-3">
                    <p className="text-3xl font-bold tracking-tight tabular-nums">{streakValueLabel}</p>
                    <p className="text-[12px] font-mono tracking-wide uppercase text-muted-foreground mt-1">{t('momentum.streak')}</p>
                  </div>
                  <p className="text-[12px] text-muted-foreground md:col-span-2">{t('momentum.description')}</p>
                </div>

                <div className="md:col-span-3">
                  <MomentumLineChart days={daySummaries} />
                </div>
              </div>

              <p className="text-[12px] text-muted-foreground mt-4">
                {momentumStatus === 'error'
                  ? t('momentum.unavailable')
                  : `${t('momentum.updated')}: ${updatedDateLabel} · ${t('momentum.note')}`}
              </p>
            </TiltCard>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function SkillsSection() {
  const t = useTranslations('Skills');
  const categories: SkillCategory[] = ['Languages', 'Stack', 'AI', 'Creative'];
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>('Languages');
  const categoryLabels: Record<SkillCategory, string> = {
    Languages: t('categories.languages'),
    Stack: t('categories.stack'),
    AI: t('categories.ai'),
    Creative: t('categories.creative'),
  };
  const categoryDescriptions: Record<SkillCategory, string> = {
    Languages: t('descriptions.languages'),
    Stack: t('descriptions.stack'),
    AI: t('descriptions.ai'),
    Creative: t('descriptions.creative'),
  };
  const categoryIcons: Record<SkillCategory, ReactNode> = {
    Languages: <Code2 className="w-4 h-4" strokeWidth={1.5} />,
    Stack: <Wrench className="w-4 h-4" strokeWidth={1.5} />,
    AI: <Sparkles className="w-4 h-4" strokeWidth={1.5} />,
    Creative: <Film className="w-4 h-4" strokeWidth={1.5} />,
  };
  const levelLabels: Record<string, string> = {
    main: t('levels.main'),
    familiar: t('levels.familiar'),
    learning: t('levels.learning'),
  };

  const selectedSkills = sampleSkills.filter((s) => s.category === selectedCategory);

  return (
    <section id="skills" className="py-20 sm:py-32 lg:py-36">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="none">
          <p className="section-label">{t('sectionTitle')}</p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2">{t('heading')}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-8 sm:mb-12">{t('subtitle')}</p>
        </ScrollReveal>

        {/* Mobile: タブ切り替え */}
        <div className="md:hidden">
          <div className="grid grid-cols-4 gap-1 w-full rounded-xl border border-border p-1 bg-muted mb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex w-full items-center justify-center gap-1 px-1 py-2.5 rounded-lg text-[12px] font-mono transition-all duration-200 ${selectedCategory === cat
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-foreground/70 hover:text-foreground'
                  }`}
                aria-pressed={selectedCategory === cat}
              >
                <span className={`transition-colors ${selectedCategory === cat ? 'text-foreground' : 'text-foreground/60'}`}>
                  {categoryIcons[cat]}
                </span>
                <span className="whitespace-nowrap leading-none hidden min-[380px]:inline">{categoryLabels[cat]}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategory}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bento-card p-4"
            >
              <p className="text-[11px] text-muted-foreground font-mono mb-4">{categoryDescriptions[selectedCategory]}</p>
              <div className="space-y-2">
                {selectedSkills.map(({ name, icon: Icon, iconSrc, featured }) => (
                  <div
                    key={name}
                    className={`skill-item-card flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-all duration-200 ${featured
                      ? 'border-border-hover bg-muted/80'
                      : 'border-border bg-muted/40'
                      }`}
                  >
                    {(Icon || iconSrc) && (
                      <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center">
                        {iconSrc ? (
                          <Image src={iconSrc} alt="" width={16} height={16} className="w-4 h-4 object-contain" aria-hidden="true" />
                        ) : Icon ? (
                          <Icon size={16} className="text-foreground/80" />
                        ) : null}
                      </span>
                    )}
                    <span className="flex-1 text-[13px] font-mono text-foreground/95 tracking-tight">{name}</span>
                        {featured && (
                          <span className="text-[9px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-foreground/10 text-foreground/80">
                            {levelLabels['main']}
                          </span>
                        )}
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Desktop: 2x2 グリッド */}
        <div className="hidden md:grid md:grid-cols-2 gap-5">
          {categories.map((cat, catIdx) => {
            const skills = sampleSkills.filter((s) => s.category === cat);
            return (
              <ScrollReveal key={cat} delay={0.15 + catIdx * 0.06}>
                <TiltCard className="bento-card about-card-motion p-4 h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                        {categoryIcons[cat]}
                      </span>
                      <div>
                        <span className="text-[13px] font-semibold tracking-tight text-foreground">{categoryLabels[cat]}</span>
                        <p className="text-[9px] text-muted-foreground font-mono leading-tight mt-0.5">{categoryDescriptions[cat]}</p>
                      </div>
                    </div>
                    <span className="text-[12px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded-md">
                      {skills.length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {skills.map(({ name, icon: Icon, iconSrc, featured }) => (
                      <div
                        key={name}
                        className={`flex items-center gap-2.5 rounded-md border px-2.5 py-2 transition-colors duration-200 ${featured
                          ? 'border-border bg-muted/50'
                          : 'border-transparent'
                          }`}
                      >
                        {(Icon || iconSrc) && (
                          <span className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center ${featured ? 'bg-background border border-border' : 'bg-muted/60'
                            }`}>
                            {iconSrc ? (
                              <Image src={iconSrc} alt="" width={12} height={12} className="w-3 h-3 object-contain" aria-hidden="true" />
                            ) : Icon ? (
                              <Icon size={12} className="text-foreground/70" />
                            ) : null}
                          </span>
                        )}
                        <span className="flex-1 text-[12px] font-mono text-foreground/90 tracking-tight">{name}</span>
                        {featured && (
                          <span className="text-[9px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-foreground/8 text-foreground/70">
                            {levelLabels['main']}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </TiltCard>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProjectsSection({ initialProjects }: { initialProjects: CompletedProject[] }) {
  const t = useTranslations('Projects');
  const locale = useLocale();
  const transitionRouter = useTransitionRouter();
  const projects = initialProjects;
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    if (typeof window === 'undefined') return 'list';
    return (sessionStorage.getItem('projectsViewMode') as 'list' | 'grid') ?? 'list';
  });
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  // 戻りナビゲーション時はカードをすぐに visible にする（viewTransitionName 要素を不透明にするため）
  const [forceCardVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('returnToProjects') === '1';
  });
  const effectiveViewMode: 'list' | 'grid' = isMobileViewport ? 'grid' : viewMode;

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 639px)');
    const syncViewport = () => setIsMobileViewport(mobileQuery.matches);
    syncViewport();
    mobileQuery.addEventListener?.('change', syncViewport);
    return () => mobileQuery.removeEventListener?.('change', syncViewport);
  }, []);

  const formatDate = (value: string | null) => {
    if (!value) return null;
    return new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(value));
  };

  return (
    <section id="projects" className="py-20 sm:py-32 lg:py-36">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="none">
          <p className="section-label">{t('sectionTitle')}</p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">{t('heading')}</h2>
            <div className="hidden sm:inline-flex w-full sm:w-auto rounded-xl border border-border p-1 bg-muted">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex flex-1 sm:flex-none items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-colors ${viewMode === 'list'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-foreground/80 hover:text-foreground hover:bg-background/60'
                  }`}
                aria-pressed={viewMode === 'list'}
              >
                <List className="w-3.5 h-3.5" />
                {t('viewList')}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex flex-1 sm:flex-none items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-colors ${viewMode === 'grid'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-foreground/80 hover:text-foreground hover:bg-background/60'
                  }`}
                aria-pressed={viewMode === 'grid'}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                {t('viewGrid')}
              </button>
            </div>
          </div>
        </ScrollReveal>

        {projects.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('noPublishedProjects')}</p>
        )}
        <StaggerContainer
          className={effectiveViewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-6' : 'space-y-4'}
          staggerDelay={0.1}
          forceVisible={forceCardVisible}
        >
          {projects.map((project) => {
            const createdDay = project.createdAt ? new Date(project.createdAt).toDateString() : null;
            const updatedDay = project.updatedAt ? new Date(project.updatedAt).toDateString() : null;
            const showUpdatedAt = updatedDay !== null && createdDay !== null && updatedDay !== createdDay;
            return (
            <StaggerItem key={project.id} forceVisible={forceCardVisible}>
              <Link
                href={`/projects/${project.id}`}
                prefetch
                onClick={(e) => {
                  sessionStorage.setItem('returnToProjects', '1');
                  sessionStorage.setItem('homeScrollY', String(window.scrollY));
                  sessionStorage.setItem('homeFromProjectId', project.id);
                  sessionStorage.setItem('projectsViewMode', effectiveViewMode);
                  sessionStorage.removeItem('projectsReferrer');
                  sessionStorage.removeItem('projectsScrollY');
                  if ('startViewTransition' in document) {
                    e.preventDefault();
                    transitionRouter.push(`/${locale}/projects/${project.id}`);
                  }
                }}
                className={`block project-card group cursor-pointer ${effectiveViewMode === 'grid' ? 'h-full' : ''}`}
              >
                <div className={effectiveViewMode === 'grid' ? 'flex flex-col h-full' : 'flex flex-row h-28 sm:h-44 overflow-hidden'}>
                  <div
                    data-card-id={project.id}
                    className={`bg-muted overflow-hidden relative ${effectiveViewMode === 'grid'
                      ? 'aspect-video rounded-t-xl'
                      : 'w-[198px] min-w-[198px] sm:w-[313px] sm:min-w-[313px] rounded-l-xl rounded-tr-none shrink-0'
                      }`}
                    style={{ viewTransitionName: `proj-${project.id}` }}
                  >
                    {project.image ? (
                      <Image
                        src={project.image}
                        alt={`${project.title} thumbnail`}
                        fill
                        sizes={effectiveViewMode === 'grid' ? '(max-width: 640px) 50vw, 33vw' : '(max-width: 640px) 128px, 224px'}
                        className="absolute inset-0 object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Box className="w-10 h-10 text-muted-foreground/30" strokeWidth={1} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20" />
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-300 flex items-center justify-center">
                      <ArrowUpRight
                        className="w-8 h-8 text-foreground opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                  <div className={`${effectiveViewMode === 'grid' ? 'p-3 sm:p-5' : 'p-3 sm:p-4 flex flex-col justify-center'} flex-1 min-w-0 overflow-hidden`}>
                    <h3
                      className={`${effectiveViewMode === 'grid'
                        ? 'text-sm sm:text-lg'
                        : isMobileViewport
                          ? 'text-sm leading-snug line-clamp-2'
                          : 'text-lg'
                        } font-semibold tracking-tight mb-2`}
                    >
                      {project.title}
                    </h3>
                    {!isMobileViewport && project.createdAt && (
                      <div className="flex flex-wrap gap-3 mb-2">
                        <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wide">
                          {t('createdAt')}: {formatDate(project.createdAt)}
                        </p>
                        {showUpdatedAt && (
                          <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wide">
                            {t('updatedAt')}: {formatDate(project.updatedAt)}
                          </p>
                        )}
                      </div>
                    )}
                    <p
                      className={`${effectiveViewMode === 'grid'
                        ? 'text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2'
                        : isMobileViewport
                          ? 'text-xs text-muted-foreground leading-relaxed mb-2 line-clamp-2'
                          : 'text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2'
                        }`}
                    >
                      {project.description}
                    </p>
                    <div className={`${effectiveViewMode === 'grid' ? 'flex flex-wrap gap-1.5' : 'flex flex-wrap gap-2'}`}>
                      {(effectiveViewMode === 'grid' || isMobileViewport ? project.tags.slice(0, 2) : project.tags).map((tag) => (
                        <span key={tag} className="text-[11px] font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            </StaggerItem>
            );
          })}
        </StaggerContainer>

        {projects.length > 0 && (
          <div className="mt-6 flex justify-end">
            <Link href="/projects" prefetch className="btn-outline px-4 py-2 text-xs">
              {t('viewAll')}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function ActiveProjectsSection({ initialActiveProjects }: { initialActiveProjects: ActiveProject[] }) {
  const t = useTranslations('ActiveProjects');
  const has = (key: string) => {
    try {
      return t.has(key);
    } catch {
      return false;
    }
  };
  const text = (key: string, fallback: string) => (has(key) ? t(key) : fallback);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const activeProjects = initialActiveProjects;
  const VISIBLE_LIMIT = 5;
  const [showAll, setShowAll] = useState(false);
  const visibleProjects = showAll ? activeProjects : activeProjects.slice(0, VISIBLE_LIMIT);
  const hiddenCount = activeProjects.length - VISIBLE_LIMIT;
  const stages = [
    text('stagePlanning', 'Planning'),
    text('stageDesign', 'Design'),
    text('stageDevelopment', 'Development'),
    text('stageTesting', 'Testing'),
    text('stageCompleted', 'Completed'),
  ];
  return (
    <section id="timeline" className="py-20 sm:py-32 lg:py-36">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal direction="none">
          <p className="section-label">{text('sectionLabel', '// in_progress')}</p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-10 sm:mb-16">{text('heading', 'Active Projects')}</h2>
        </ScrollReveal>

        <div className="md:hidden space-y-3">
          {activeProjects.length === 0 ? (
            <div className="bento-card">
              <p className="text-sm text-muted-foreground">{text('empty', 'No active projects yet.')}</p>
            </div>
          ) : (
            <>
              {visibleProjects.map((project) => {
                const currentStage = Math.max(0, Math.min(stages.length - 1, project.stage));
                const lineInsetPercent = 50 / stages.length;
                const lineTrackPercent = 100 - lineInsetPercent * 2;
                const progressWidthPercent = lineInsetPercent + (currentStage / (stages.length - 1)) * lineTrackPercent;
                return (
                  <ScrollReveal key={project.id}>
                    <div className="bento-card p-4">
                      <p className="text-sm font-medium mb-4">{project.name}</p>
                      <div className="relative">
                        <div
                          className="absolute top-[7px] h-[2px] bg-border"
                          style={{
                            left: `${lineInsetPercent}%`,
                            right: `${lineInsetPercent}%`,
                          }}
                        />
                        <div
                          className="absolute top-[7px] left-0 h-[2px] bg-foreground transition-all duration-700"
                          style={{ width: `${progressWidthPercent}%` }}
                        />
                        <div className="relative flex justify-between">
                          {stages.map((stage, i) => {
                            const isCompleted = i < currentStage;
                            const isCurrent = i === currentStage;
                            return (
                              <div key={stage} className="flex flex-col items-center" style={{ width: `${100 / stages.length}%` }}>
                                <div
                                  className={`w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isCompleted
                                    ? 'bg-foreground border-foreground'
                                    : isCurrent
                                      ? 'bg-foreground border-foreground'
                                      : 'bg-background border-border'
                                    }`}
                                >
                                  {isCompleted && (
                                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                                      <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-background" />
                                    </svg>
                                  )}
                                  {isCurrent && !isCompleted && (
                                    <div className="w-[5px] h-[5px] rounded-full bg-background" />
                                  )}
                                </div>
                                <span className={`text-[8px] font-mono mt-1.5 text-center leading-tight ${isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                                  {stage}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              })}
              {hiddenCount > 0 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="w-full py-2.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors border border-border rounded-xl hover:border-foreground/20"
                >
                  {showAll ? '閉じる ↑' : `+ ${hiddenCount}件を表示 ↓`}
                </button>
              )}
            </>
          )}
        </div>

        <div ref={ref} className="hidden md:block gantt-chart">
          <div className="gantt-header">
            <div className="gantt-label-col">
              <span className="text-[12px] font-mono text-muted-foreground uppercase tracking-wider">
                {text('projectColumn', 'Project')}
              </span>
            </div>
            <div className="gantt-stages-area">
              {stages.map((stage) => (
                <div key={stage} className="gantt-stage-col">
                  <span className="text-[12px] font-mono text-muted-foreground uppercase tracking-wider">{stage}</span>
                </div>
              ))}
            </div>
          </div>

          {visibleProjects.map((project, rowIdx) => (
            <div key={project.id} className="gantt-row group">
              <div className="gantt-label-col">
                <span className="text-sm font-medium group-hover:text-foreground transition-colors">{project.name}</span>
              </div>
              <div className="gantt-stages-area">
                <div className="gantt-bg-line" />

                <motion.div
                  className="gantt-fg-line"
                  initial={{ width: 0 }}
                  animate={
                    isInView ? { width: `${((project.stage + 0.5) / stages.length) * 100}%` } : { width: 0 }
                  }
                  transition={{
                    duration: 1.4,
                    delay: 0.3 + rowIdx * 0.2,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                />

                {stages.map((_, i) => {
                  const isCompleted = i < project.stage;
                  const isCurrentArrow = i === project.stage;
                  return (
                    <div key={i} className="gantt-stage-cell">
                      {isCurrentArrow && (
                        <motion.div
                          className="gantt-arrow"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
                          transition={{ duration: 0.3, delay: 0.3 + rowIdx * 0.2 + 1.2 }}
                        >
                          <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
                            <path d="M0 0L10 7L0 14Z" fill="currentColor" />
                          </svg>
                        </motion.div>
                      )}

                      {isCompleted && (
                        <motion.div
                          className="gantt-check"
                          initial={{ scale: 0 }}
                          animate={isInView ? { scale: 1 } : { scale: 0 }}
                          transition={{ duration: 0.3, delay: 0.3 + rowIdx * 0.2 + (i + 1) * 0.15 }}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M2 6L5 9L10 3"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {hiddenCount > 0 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-3 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors border-t border-border hover:bg-muted/50"
            >
              {showAll ? '閉じる ↑' : `+ ${hiddenCount}件を表示 ↓`}
            </button>
          )}

          {activeProjects.length === 0 && (
            <div className="px-6 py-6">
              <p className="text-sm text-muted-foreground">{text('empty', 'No active projects yet.')}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  const SUCCESS_MODAL_MS = 5000;
  const t = useTranslations('Contact');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<'idle' | 'verifying' | 'sending'>('idle');
  const [submitState, setSubmitState] = useState<'idle' | 'success' | 'error' | 'turnstile'>('idle');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successRunId, setSuccessRunId] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<{
    name: string;
    email: string;
    subject: string;
    message: string;
    token: string;
    honeypot: string;
    elapsedMs: number;
  } | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const mountedAtRef = useRef(Date.now());
  const sectionRef = useRef<HTMLElement | null>(null);
  const isContactInView = useInView(sectionRef, { margin: '240px 0px', once: true });
  const [shouldLoadTurnstile, setShouldLoadTurnstile] = useState(false);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (isContactInView) {
      setShouldLoadTurnstile(true);
    }
  }, [isContactInView]);

  useEffect(() => {
    window.onTurnstileSuccess = (token: string) => {
      setTurnstileToken(token);
      setSubmitState('idle');
    };
    window.onTurnstileExpired = () => {
      setTurnstileToken('');
      setSubmitState('turnstile');
    };
    window.onTurnstileError = () => {
      setTurnstileToken('');
      setSubmitState('turnstile');
    };

    return () => {
      delete window.onTurnstileSuccess;
      delete window.onTurnstileExpired;
      delete window.onTurnstileError;
    };
  }, []);

  useEffect(() => {
    if (submitState === 'success') {
      setSuccessRunId((prev) => prev + 1);
      setShowSuccessModal(true);
    }
  }, [submitState]);

  useEffect(() => {
    if (!showSuccessModal) return;
    const timerId = window.setTimeout(() => {
      setShowSuccessModal(false);
      setSubmitState('idle');
    }, SUCCESS_MODAL_MS);
    return () => window.clearTimeout(timerId);
  }, [showSuccessModal, SUCCESS_MODAL_MS]);

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSubmitState('idle');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || isPreviewOpen) return;

    setSubmitState('idle');

    const form = event.currentTarget;
    formRef.current = form;
    const formData = new FormData(form);
    const honeypot = String(formData.get('_gotcha') ?? '').trim();
    const elapsedMs = Date.now() - mountedAtRef.current;
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const subject = String(formData.get('subject') ?? '').trim();
    const message = String(formData.get('message') ?? '').trim();
    const token = String(formData.get('cf-turnstile-response') ?? turnstileToken ?? '').trim();

    if (!name || !email || !subject || !message) {
      setSubmitState('error');
      return;
    }

    if (!turnstileSiteKey || !token) {
      setSubmitState('turnstile');
      return;
    }

    setPendingPayload({ name, email, subject, message, token, honeypot, elapsedMs });
    setIsPreviewOpen(true);
  };

  const confirmSubmit = async () => {
    if (!pendingPayload) return;
    setIsSubmitting(true);
    setSubmitPhase('verifying');
    setSubmitState('idle');

    try {
      setSubmitPhase('sending');
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pendingPayload),
      });

      if (response.ok) {
        formRef.current?.reset();
        window.turnstile?.reset();
        setTurnstileToken('');
        setSubmitState('success');
        setIsPreviewOpen(false);
        setPendingPayload(null);
      } else {
        setSubmitState('error');
      }
    } catch {
      setSubmitState('error');
    } finally {
      setIsSubmitting(false);
      setSubmitPhase('idle');
    }
  };

  return (
    <section id="contact" ref={sectionRef} className="py-20 sm:py-32 lg:py-36">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        {turnstileSiteKey && shouldLoadTurnstile ? (
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer strategy="afterInteractive" />
        ) : null}
        <ScrollReveal direction="none">
          <p className="section-label">{`> send_message`}</p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2 sm:mb-3">{t('heading')}</h2>
          <p className="text-sm text-muted-foreground mb-8 sm:mb-12">
            {t('description')}
          </p>
        </ScrollReveal>

        <div>
          <div className="bento-card bento-card--static p-5 sm:p-8">
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <input
                type="text"
                name="_gotcha"
                maxLength={200}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">
                    {t('name')}
                    <span className="ml-1 text-[var(--accent-muted)]" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    maxLength={80}
                    placeholder={t('namePlaceholder')}
                    className="w-full bg-muted/50 border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-foreground focus:bg-transparent placeholder:text-muted-foreground/40"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">
                    {t('email')}
                    <span className="ml-1 text-[var(--accent-muted)]" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    maxLength={320}
                    placeholder={t('emailPlaceholder')}
                    className="w-full bg-muted/50 border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-foreground focus:bg-transparent placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className="block text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">
                  {t('subject')}
                  <span className="ml-1 text-[var(--accent-muted)]" aria-hidden="true">*</span>
                </label>
                <input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  required
                  maxLength={160}
                  placeholder={t('subjectPlaceholder')}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-foreground focus:bg-transparent placeholder:text-muted-foreground/40"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">
                  {t('message')}
                  <span className="ml-1 text-[var(--accent-muted)]" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={5}
                  maxLength={5000}
                  placeholder={t('messagePlaceholder')}
                  className="w-full bg-muted/50 border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none transition-all focus:border-foreground focus:bg-transparent resize-none placeholder:text-muted-foreground/40"
                />
              </div>

              {turnstileSiteKey && shouldLoadTurnstile ? (
                <div
                  className="cf-turnstile"
                  data-sitekey={turnstileSiteKey}
                  data-callback="onTurnstileSuccess"
                  data-expired-callback="onTurnstileExpired"
                  data-error-callback="onTurnstileError"
                />
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting || !turnstileSiteKey || !shouldLoadTurnstile}
                className="btn-primary w-full mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
              >
                <Send className="w-4 h-4" strokeWidth={1.5} />
                {isSubmitting ? t('sending') : t('preview')}
              </button>
              {submitState === 'turnstile' && <p className="text-sm text-amber-500">{t('turnstileRequired')}</p>}
              {submitState === 'error' && <p className="text-sm text-red-500">{t('error')}</p>}
            </form>
          </div>
        </div>
        {isPreviewOpen && pendingPayload ? (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="w-full max-w-lg rounded-xl border border-border bg-card p-5 sm:p-6 shadow-2xl">
              <h3 className="text-lg font-semibold tracking-tight mb-4">{t('previewTitle')}</h3>
              <p className="text-xs font-mono text-muted-foreground mb-4">{t('previewDescription')}</p>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{t('name')}</p>
                  <p>{pendingPayload.name}</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{t('email')}</p>
                  <p>{pendingPayload.email}</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{t('subject')}</p>
                  <p>{pendingPayload.subject}</p>
                </div>
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{t('message')}</p>
                  <p className="whitespace-pre-wrap leading-relaxed">{pendingPayload.message}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setIsPreviewOpen(false)}
                  disabled={isSubmitting}
                >
                  {t('backToEdit')}
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={confirmSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? submitPhase === 'verifying'
                      ? t('verifying')
                      : t('sending')
                    : t('confirmSend')}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {showSuccessModal ? (
          <div className="fixed inset-0 z-[60] bg-background/75 backdrop-blur-sm flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05, duration: 0.25 }}
                className="mx-auto mb-4 h-14 w-14 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center"
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-500" strokeWidth={1.6} />
              </motion.div>
              <h3 className="text-lg font-semibold tracking-tight text-center">{t('successTitle')}</h3>
              <p className="mt-2 text-sm text-muted-foreground text-center">{t('success')}</p>
              <p className="mt-1 text-[11px] font-mono text-muted-foreground text-center">{t('successAutoClose')}</p>

              <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  key={successRunId}
                  className="h-full success-countdown-bar"
                  style={{ animationDuration: `${SUCCESS_MODAL_MS}ms` }}
                />
              </div>

              <button
                type="button"
                className="btn-outline w-full mt-4"
                onClick={closeSuccessModal}
              >
                {t('close')}
              </button>
            </motion.div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
