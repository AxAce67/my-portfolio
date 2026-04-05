'use client';

import { useLayoutEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { useTransitionRouter } from 'next-view-transitions';
import { StaggerContainer, StaggerItem } from '@/components/ui/ScrollReveal';
import { canUseSharedElementTransitions, isPlainLeftClick, runRouteTransition, shouldUseMobileRouteTransitions } from '@/lib/viewTransitions';
import { areSameCalendarDate, formatLocaleDate } from '@/lib/dates';
import { navigationStateKeys, readSessionNumber, readSessionValue, removeSessionValue, writeSessionValue } from '@/lib/navigationState';

const PAGE_SIZE = 12;

export type ProjectListItem = {
  id: string;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  tags: string[];
};

type Props = {
  projects: ProjectListItem[];
};

export default function ProjectsListClient({ projects }: Props) {
  const t = useTranslations('ProjectList');
  const locale = useLocale();
  const router = useRouter();
  const transitionRouter = useTransitionRouter();
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  // 戻りナビゲーション時はカードをすぐに visible にする（viewTransitionName 要素を不透明にするため）
  const [forceCardVisible] = useState(() => {
    return readSessionValue(navigationStateKeys.projectsScrollY) !== null;
  });

  // 戻り時にスクロール位置を復元（ViewTransitionsのfinishより先に実行される）
  useLayoutEffect(() => {
    const y = readSessionNumber(navigationStateKeys.projectsScrollY);
    if (y !== null) {
      removeSessionValue(navigationStateKeys.projectsScrollY);
      window.scrollTo(0, y);
    }
  }, []);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((project) => {
      const title = (project.title ?? '').toLowerCase();
      const description = (project.description ?? '').toLowerCase();
      const tags = project.tags.map((tag) => tag.toLowerCase()).join(' ');
      return title.includes(q) || description.includes(q) || tags.includes(q);
    });
  }, [projects, keyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const normalizedPage = Math.min(page, totalPages);
  const currentItems = filtered.slice((normalizedPage - 1) * PAGE_SIZE, normalizedPage * PAGE_SIZE);

  return (
    <section className="max-w-5xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
      <div className="mb-8">
        <Link
          href="/"
          className="text-xs font-mono text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            if (!isPlainLeftClick(e)) {
              return;
            }

            writeSessionValue(navigationStateKeys.returnToProjects, '1');
            if ('startViewTransition' in document) {
              e.preventDefault();
              runRouteTransition(() => {
                router.push(`/${locale}`);
              }, { direction: 'backward' });
            }
          }}
        >
          {t('backToTop')}
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-5">{t('heading')}</h1>
        <p className="text-sm text-muted-foreground mt-2">{t('description')}</p>
      </div>

      <div className="mb-6">
        <label htmlFor="projects-q" className="sr-only">{t('searchLabel')}</label>
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="projects-q"
            name="q"
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setPage(1);
            }}
            placeholder={t('searchPlaceholder')}
            autoComplete="off"
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm outline-none focus:border-border-hover"
          />
        </div>
      </div>

      <StaggerContainer
        key={`${keyword}-${normalizedPage}`}
        className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-1 gap-3 sm:gap-4"
        staggerDelay={0.08}
        forceVisible={forceCardVisible}
      >
        {currentItems.map((project) => {
          const showUpdatedAt = !!project.updatedAt && !areSameCalendarDate(project.createdAt, project.updatedAt);
          return (
            <StaggerItem key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                prefetch
                className="block project-card group"
                onClick={(e) => {
                  if (!isPlainLeftClick(e)) {
                    return;
                  }

                  writeSessionValue(navigationStateKeys.projectsReferrer, 'archive');
                  writeSessionValue(navigationStateKeys.projectsScrollY, String(window.scrollY));
                  if (shouldUseMobileRouteTransitions()) {
                    e.preventDefault();
                    runRouteTransition(() => {
                      router.push(`/projects/${project.id}`, { scroll: false });
                    });
                    return;
                  }

                  if (canUseSharedElementTransitions()) {
                    e.preventDefault();
                    transitionRouter.push(`/${locale}/projects/${project.id}`);
                  }
                }}
              >
                <div className="flex flex-col sm:flex-row sm:h-44 sm:overflow-hidden">
                  <div className="aspect-video w-full sm:aspect-auto sm:w-[313px] sm:min-w-[313px] bg-muted overflow-hidden rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none shrink-0 relative">
                    {project.thumbnailUrl ? (
                      <Image
                        src={project.thumbnailUrl}
                        alt={`${project.title} thumbnail`}
                        fill
                        sizes="(max-width: 640px) 50vw, 313px"
                        className="absolute inset-0 object-cover rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none"
                        loading="lazy"
                        style={{ viewTransitionName: `proj-${project.id}`, viewTransitionClass: 'project-media' }}
                      />
                    ) : null}
                  </div>
                  <div className="p-2.5 sm:p-4 flex-1 flex flex-col sm:justify-center overflow-hidden">
                    <h2 className="text-sm sm:text-xl font-semibold tracking-tight mb-1 sm:mb-2 line-clamp-2">{project.title}</h2>
                    <div className="hidden sm:flex mb-2 flex-wrap gap-3">
                      <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wide">
                        {t('createdAt')}: {formatLocaleDate(project.createdAt, locale)}
                      </p>
                      {showUpdatedAt && (
                        <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wide">
                          {t('updatedAt')}: {formatLocaleDate(project.updatedAt, locale)}
                        </p>
                      )}
                    </div>
                    <p className="hidden sm:block text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">{project.description}</p>
                    <div className="flex flex-wrap gap-1 sm:gap-2">
                      {project.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-[10px] sm:text-[11px] font-mono text-muted-foreground bg-muted px-2 sm:px-2.5 py-0.5 sm:py-1 rounded">
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
        {filtered.length === 0 && (
          <p className="col-span-1 min-[420px]:col-span-2 sm:col-span-1 text-sm text-muted-foreground">
            {keyword.trim() ? t('noResults') : t('empty')}
          </p>
        )}
      </StaggerContainer>

      {filtered.length > PAGE_SIZE && (
        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className={`btn-outline px-3 py-1.5 text-xs ${normalizedPage > 1 ? '' : 'pointer-events-none opacity-50'}`}
          >
            {t('prev')}
          </button>
          <p className="text-xs font-mono text-muted-foreground">
            {normalizedPage} / {totalPages}
          </p>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className={`btn-outline px-3 py-1.5 text-xs ${normalizedPage < totalPages ? '' : 'pointer-events-none opacity-50'}`}
          >
            {t('next')}
          </button>
        </div>
      )}
    </section>
  );
}
