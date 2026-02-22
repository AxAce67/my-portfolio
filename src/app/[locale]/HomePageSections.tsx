'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import Script from 'next/script';
import Image from 'next/image';
import { ArrowUpRight, Send, Terminal, Code2, Layers, Globe, Cpu, Box, Github, Twitter, Mail, List, LayoutGrid } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { ScrollReveal, StaggerContainer, StaggerItem } from '@/components/ui/ScrollReveal';
import { Link } from '@/i18n/routing';
import dynamic from 'next/dynamic';
import type { ActiveProject, CompletedProject } from './HomePageClient';

const TechStackSection = dynamic(() => import('@/components/sections/TechStackSection'), {
  loading: () => (
    <section id="tech-stack" className="py-20 sm:py-32 lg:py-36">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="section-label text-center">{'// tech_stack'}</p>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-10 sm:mb-16 text-center">Technologies &amp; Services</h2>
      </div>
    </section>
  ),
});

type SkillCategory = 'Languages' | 'AI' | 'Tools';
type SkillItem = {
  name: string;
  category: SkillCategory;
  featured?: boolean;
};

const sampleSkills: SkillItem[] = [
  { name: 'TypeScript', category: 'Languages', featured: true },
  { name: 'JavaScript', category: 'Languages', featured: true },
  { name: 'Python', category: 'Languages' },
  { name: 'HTML', category: 'Languages' },
  { name: 'CSS', category: 'Languages' },

  { name: 'ChatGPT', category: 'AI', featured: true },
  { name: 'Claude', category: 'AI' },
  { name: 'Gemini', category: 'AI' },
  { name: 'Claude Code / Codex', category: 'AI', featured: true },

  { name: 'Next.js', category: 'Tools', featured: true },
  { name: 'React', category: 'Tools', featured: true },
  { name: 'Tailwind CSS', category: 'Tools' },
  { name: 'Supabase', category: 'Tools' },
  { name: 'Framer Motion', category: 'Tools' },
  { name: 'Adobe Premiere Pro', category: 'Tools' },
  { name: 'Wondershare Filmora', category: 'Tools' },
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

function AboutSection() {
  const t = useTranslations('About');
  const focusAreas = ['productThinking', 'rapidPrototyping', 'uiUxDesign', 'problemSolving', 'research', 'continuousImprovement'] as const;

  return (
    <section id="about" className="py-20 sm:py-32 lg:py-36">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <p className="section-label">{t('sectionTitle')}</p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-8 sm:mb-12">{t('heading')}</h2>
        </ScrollReveal>

        <div className="md:hidden space-y-3">
          <ScrollReveal delay={0.15}>
            <div className="bento-card">
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
                      aria-disabled="true"
                    >
                      <span>{link.icon}</span>
                      <span className="text-[10px] font-mono tracking-wide">{link.label}</span>
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
                      <span className="text-[10px] font-mono tracking-wide">{link.label}</span>
                    </a>
                  )
                )}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['7+', t('statsProjects')],
                ['20+', t('statsTechnologies')],
                ['2+', t('statsYears')],
                ['4', t('statsCommits')],
              ].map(([value, label]) => (
                <div key={label} className="bento-card py-4 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold tracking-tight">{value}</p>
                  <p className="text-[10px] text-muted-foreground mt-1.5 tracking-wider uppercase font-mono text-center">{label}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.25}>
            <div className="bento-card">
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
            <div className="bento-card">
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
        </div>

        <div className="hidden md:grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[minmax(120px,auto)] md:auto-rows-[minmax(140px,auto)]">
          <ScrollReveal delay={0.15} className="order-2 md:col-start-1 md:row-start-2 md:col-span-2 md:row-span-2">
            <div className="bento-card p-5 h-full flex flex-col justify-start">
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
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="bento-card h-full flex flex-col items-center justify-center py-5">
              <p className="text-3xl sm:text-4xl font-bold tracking-tight">7+</p>
              <p className="text-[10px] text-muted-foreground mt-2 tracking-wider uppercase font-mono">{t('statsProjects')}</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.25}>
            <div className="bento-card h-full flex flex-col items-center justify-center py-5">
              <p className="text-3xl sm:text-4xl font-bold tracking-tight">20+</p>
              <p className="text-[10px] text-muted-foreground mt-2 tracking-wider uppercase font-mono">{t('statsTechnologies')}</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="bento-card h-full flex flex-col items-center justify-center py-5">
              <p className="text-3xl sm:text-4xl font-bold tracking-tight">2+</p>
              <p className="text-[10px] text-muted-foreground mt-2 tracking-wider uppercase font-mono">{t('statsYears')}</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.35}>
            <div className="bento-card h-full flex flex-col items-center justify-center py-5">
              <p className="text-3xl sm:text-4xl font-bold tracking-tight">4</p>
              <p className="text-[10px] text-muted-foreground mt-2 tracking-wider uppercase font-mono">{t('statsCommits')}</p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2} className="md:col-span-2">
            <div className="bento-card h-full flex flex-col justify-center">
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

          <ScrollReveal delay={0.25} className="order-1 md:col-start-1 md:row-start-1 md:col-span-2 md:row-span-1">
            <div className="bento-card h-full flex flex-col justify-between">
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
                      aria-disabled="true"
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
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function SkillsSection() {
  const categories: SkillCategory[] = ['Languages', 'AI', 'Tools'];
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>('Languages');
  const categoryLabels: Record<(typeof categories)[number], string> = {
    Languages: '言語',
    AI: 'AI活用',
    Tools: 'クリエイティブ',
  };
  const categoryDescriptions: Record<(typeof categories)[number], string> = {
    Languages: '主にWeb開発で使う言語',
    AI: '実装・設計で活用するAI',
    Tools: '開発と制作で使うツール',
  };
  const categoryIcons: Record<string, ReactNode> = {
    Languages: <Code2 className="w-4 h-4" strokeWidth={1.5} />,
    AI: <Cpu className="w-4 h-4" strokeWidth={1.5} />,
    Tools: <Layers className="w-4 h-4" strokeWidth={1.5} />,
  };
  const selectedSkills = sampleSkills.filter((s) => s.category === selectedCategory);

  return (
    <section id="skills" className="py-20 sm:py-32 lg:py-36">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <p className="section-label">{'// skills'}</p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2">Skills</h2>
          <p className="text-xs sm:text-sm text-muted-foreground mb-8 sm:mb-12">特に力を入れているスキル</p>
        </ScrollReveal>

        <div className="md:hidden">
          <div className="grid grid-cols-3 gap-1 w-full rounded-xl border border-border p-1 bg-muted mb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex w-full items-center justify-center gap-1 px-1.5 py-2 rounded-lg text-[10px] font-mono transition-colors ${
                  selectedCategory === cat ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
                aria-pressed={selectedCategory === cat}
              >
                <span className="text-muted-foreground">{categoryIcons[cat]}</span>
                <span className="whitespace-nowrap leading-none">{categoryLabels[cat]}</span>
              </button>
            ))}
          </div>

          <div className="bento-card p-4">
            <p className="text-[11px] text-muted-foreground font-mono mb-3.5">{categoryDescriptions[selectedCategory]}</p>
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map(({ name, featured }) => (
                <span
                  key={name}
                  className={`inline-flex items-center rounded-full border border-border bg-muted/60 ${
                    featured ? 'px-3.5 py-2 text-[12px]' : 'px-3 py-1.5 text-[11px]'
                  } font-mono text-foreground/95`}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat, catIdx) => {
            const skills = sampleSkills.filter((s) => s.category === cat);
            return (
              <ScrollReveal key={cat} delay={0.15 + catIdx * 0.08}>
                <div className="bento-card p-5 h-full">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-muted-foreground">{categoryIcons[cat]}</span>
                    <span className="text-[11px] font-mono text-muted-foreground tracking-wider">{categoryLabels[cat]}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono mb-3.5">{categoryDescriptions[cat]}</p>
                  <div className="flex flex-wrap gap-2">
                    {skills.map(({ name, featured }) => (
                      <span
                        key={name}
                        className={`inline-flex items-center rounded-full border border-border bg-muted/60 ${
                          featured ? 'px-3.5 py-2 text-[12px]' : 'px-3 py-1.5 text-[11px]'
                        } font-mono text-foreground/95`}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
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
  const projects = initialProjects;
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const effectiveViewMode: 'list' | 'grid' = isMobileViewport ? 'list' : viewMode;

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
        <ScrollReveal>
          <p className="section-label">{t('sectionTitle')}</p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">{t('heading')}</h2>
            <div className="hidden sm:inline-flex w-full sm:w-auto rounded-xl border border-border p-1 bg-muted">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex flex-1 sm:flex-none items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-colors ${
                  viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-pressed={viewMode === 'list'}
              >
                <List className="w-3.5 h-3.5" />
                {t('viewList')}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex flex-1 sm:flex-none items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-colors ${
                  viewMode === 'grid' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-pressed={viewMode === 'grid'}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                {t('viewGrid')}
              </button>
            </div>
          </div>
        </ScrollReveal>

        <StaggerContainer
          className={effectiveViewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-6' : 'space-y-4'}
          staggerDelay={0.1}
        >
          {projects.map((project) => (
            <StaggerItem key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                prefetch
                onClick={() => {
                  sessionStorage.setItem('returnToProjects', '1');
                }}
                className={`block project-card group cursor-pointer ${effectiveViewMode === 'grid' ? 'h-full' : ''}`}
              >
                <div className={effectiveViewMode === 'grid' ? 'flex flex-col h-full' : 'flex flex-row'}>
                  <div
                    className={`bg-muted overflow-hidden relative ${
                      effectiveViewMode === 'grid'
                        ? 'aspect-[4/3] rounded-t-xl'
                        : 'w-32 min-w-32 aspect-[4/3] sm:w-56 sm:min-w-56 sm:aspect-video rounded-l-xl rounded-tr-none shrink-0'
                    }`}
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
                  <div className={`${effectiveViewMode === 'grid' ? 'p-3 sm:p-5' : 'p-3 sm:p-6'} flex-1 min-w-0`}>
                    <h3
                      className={`${
                        effectiveViewMode === 'grid'
                          ? 'text-sm sm:text-lg'
                          : isMobileViewport
                            ? 'text-sm leading-snug line-clamp-2'
                            : 'text-lg'
                      } font-semibold tracking-tight mb-2`}
                    >
                      {project.title}
                    </h3>
                    {project.createdAt && (
                      <p className={`${effectiveViewMode === 'grid' ? 'text-[10px]' : 'text-[11px]'} font-mono text-muted-foreground uppercase tracking-wide mb-2`}>
                        {t('createdAt')}: {formatDate(project.createdAt)}
                      </p>
                    )}
                    <p
                      className={`${
                        effectiveViewMode === 'grid'
                          ? 'text-xs sm:text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2'
                          : isMobileViewport
                            ? 'text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-3'
                            : 'text-sm text-muted-foreground leading-relaxed mb-4'
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
          ))}
        </StaggerContainer>

        {projects.length === 0 && <p className="text-sm text-muted-foreground mt-4">{t('noPublishedProjects')}</p>}
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
        <ScrollReveal>
          <p className="section-label">{text('sectionLabel', '// in_progress')}</p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-10 sm:mb-16">{text('heading', 'Active Projects')}</h2>
        </ScrollReveal>

        <div className="md:hidden">
          {activeProjects.length === 0 ? (
            <div className="bento-card">
              <p className="text-sm text-muted-foreground">No active projects yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-2">
              <div className="grid grid-cols-5 gap-2 min-w-[560px]">
                {stages.map((stageLabel, stageIndex) => {
                  const projectsInStage = activeProjects.filter(
                    (project) => Math.max(0, Math.min(stages.length - 1, project.stage)) === stageIndex
                  );
                  return (
                    <div key={`mobile-stage-col-${stageLabel}`} className="rounded-xl border border-border bg-card p-2.5">
                      <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wide mb-2">
                        {stageLabel}
                      </p>
                      <div className="space-y-1.5">
                        {projectsInStage.length === 0 ? (
                          <p className="text-[10px] font-mono text-muted-foreground/70">-</p>
                        ) : (
                          projectsInStage.map((project) => (
                            <div key={project.id} className="rounded-md border border-border bg-muted px-2 py-1.5">
                              <p className="text-[11px] leading-tight text-foreground/95 break-words">{project.name}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div ref={ref} className="hidden md:block gantt-chart">
          <div className="gantt-header">
            <div className="gantt-label-col">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                {text('projectColumn', 'Project')}
              </span>
            </div>
            <div className="gantt-stages-area">
              {stages.map((stage) => (
                <div key={stage} className="gantt-stage-col">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{stage}</span>
                </div>
              ))}
            </div>
          </div>

          {activeProjects.map((project, rowIdx) => (
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

          {activeProjects.length === 0 && (
            <div className="px-6 py-6">
              <p className="text-sm text-muted-foreground">No active projects yet.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  const t = useTranslations('Contact');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<'idle' | 'success' | 'error' | 'turnstile'>('idle');
  const [turnstileToken, setTurnstileToken] = useState('');
  const mountedAtRef = useRef(Date.now());
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

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
    if (submitState !== 'success') return;
    const timerId = window.setTimeout(() => {
      setSubmitState('idle');
    }, 4000);
    return () => window.clearTimeout(timerId);
  }, [submitState]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitState('idle');

    const form = event.currentTarget;
    const formData = new FormData(form);
    const honeypot = String(formData.get('_gotcha') ?? '').trim();
    const elapsedMs = Date.now() - mountedAtRef.current;
    const name = String(formData.get('name') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const message = String(formData.get('message') ?? '').trim();
    const token = String(formData.get('cf-turnstile-response') ?? turnstileToken ?? '').trim();

    // Lightweight anti-spam: hidden field trap + too-fast submit guard.
    if (honeypot || elapsedMs < 2500) {
      form.reset();
      setSubmitState('success');
      setIsSubmitting(false);
      return;
    }

    if (!turnstileSiteKey || !token) {
      setSubmitState('turnstile');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          message,
          token,
          honeypot,
          elapsedMs,
        }),
      });

      if (response.ok) {
        form.reset();
        window.turnstile?.reset();
        setTurnstileToken('');
        setSubmitState('success');
      } else {
        setSubmitState('error');
      }
    } catch {
      setSubmitState('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-20 sm:py-32 lg:py-36">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        {turnstileSiteKey ? (
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer strategy="afterInteractive" />
        ) : null}
        <ScrollReveal>
          <p className="section-label">{`> send_message`}</p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-8 sm:mb-12">Contact</h2>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <input type="hidden" name="_subject" value="New portfolio contact message" />
            <input
              type="text"
              name="_gotcha"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />
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
                className="w-full bg-transparent border-b border-border focus:border-foreground outline-none pb-2 text-sm transition-colors"
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
                className="w-full bg-transparent border-b border-border focus:border-foreground outline-none pb-2 text-sm transition-colors"
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
                className="w-full bg-transparent border-b border-border focus:border-foreground outline-none pb-2 text-sm transition-colors resize-none"
              />
            </div>
            {turnstileSiteKey ? (
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
              disabled={isSubmitting || !turnstileSiteKey}
              className="btn-primary w-full mt-4 flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
            >
              <Send className="w-4 h-4" strokeWidth={1.5} />
              {isSubmitting ? t('sending') : t('send')}
            </button>
            {submitState === 'success' && <p className="text-sm text-emerald-500">{t('success')}</p>}
            {submitState === 'turnstile' && <p className="text-sm text-amber-500">{t('turnstileRequired')}</p>}
            {submitState === 'error' && <p className="text-sm text-red-500">{t('error')}</p>}
          </form>
        </ScrollReveal>
      </div>
    </section>
  );
}
