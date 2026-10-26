'use client';

import { useLayoutEffect, useMemo, useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { useLocale } from '@/hooks/useLocale';
import Image from '@/components/ui/Image';
import { Box, Search } from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { useRouter as useTransitionRouter } from '@/i18n/routing';
import { StaggerContainer, StaggerItem } from '@/components/ui/ScrollReveal';
import { canUseSharedElementTransitions, isPlainLeftClick, runRouteTransition, runViewTransition, shouldUseMobileRouteTransitions } from '@/lib/viewTransitions';
import { areSameCalendarDate, formatLocaleDate } from '@/lib/dates';
import { navigationStateKeys, readSessionNumber, removeSessionValue, writeSessionValue } from '@/lib/navigationState';
import { ProjectBadges, TagChip } from '@/components/projects/ProjectBadges';
import type { ProjectKind } from '@/lib/content/publicContent';

const PAGE_SIZE = 12;

export type ProjectListItem = {
  id: string;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  tags: string[];
  kind: ProjectKind;
  status: string | null;
};

type KindFilter = 'all' | ProjectKind;
const KIND_FILTERS: KindFilter[] = ['all', 'project', 'service'];

type Props = {
  projects: ProjectListItem[];
};

export default function ProjectsListClient({ projects }: Props) {
  const t = useTranslations('ProjectList');
  const tKind = useTranslations('ProjectKind');
  const locale = useLocale();
  const router = useRouter();
  const transitionRouter = useTransitionRouter();
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  // 戻りナビゲーション時はカードをすぐに visible にする（viewTransitionName 要素を不透明にするため）
  const [forceCardVisible, setForceCardVisible] = useState(false);

  // 戻り時にスクロール位置を復元（ViewTransitionsのfinishより先に実行される）
  // 注意: projectsScrollY はアーカイブ一覧からプロジェクト詳細に移動する際にのみ
  // 書き込まれる想定。/projects への他の入口（ナビ、About のショートカット等）は
  // 必ず clearProjectReturnState() を呼んで、古い値が残らないようにすること。
  useLayoutEffect(() => {
    const y = readSessionNumber(navigationStateKeys.projectsScrollY);
    if (y !== null) {
      // Read here rather than in useState so hydration matches the server HTML.
      setForceCardVisible(true);
      removeSessionValue(navigationStateKeys.projectsScrollY);
      window.scrollTo(0, y);
    }
  }, []);

  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  // Every tag in use, most-used first, for the tag dropdown.
  const tagOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const project of projects) for (const tag of project.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [projects]);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  // ?kind= and ?tag= (e.g. from a tag clicked on the home page or an article)
  // are read after mount so the first render matches the server HTML.
  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const kind = params.get('kind');
    if (kind === 'project' || kind === 'service') setKindFilter(kind);
    const tag = params.get('tag');
    if (tag) setTagFilter(tag);
  }, []);

  // Keep the filters in the URL so a filtered list can be shared or reloaded.
  useLayoutEffect(() => {
    const url = new URL(window.location.href);
    if (kindFilter === 'all') url.searchParams.delete('kind');
    else url.searchParams.set('kind', kindFilter);
    if (tagFilter) url.searchParams.set('tag', tagFilter);
    else url.searchParams.delete('tag');
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url);
  }, [kindFilter, tagFilter]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const tag = tagFilter?.toLowerCase();
    return projects.filter((project) => {
      if (kindFilter !== 'all' && project.kind !== kindFilter) return false;
      if (tag && !project.tags.some((projectTag) => projectTag.toLowerCase() === tag)) return false;
      if (!q) return true;
      const title = (project.title ?? '').toLowerCase();
      const description = (project.description ?? '').toLowerCase();
      const tags = project.tags.map((tag) => tag.toLowerCase()).join(' ');
      return title.includes(q) || description.includes(q) || tags.includes(q);
    });
  }, [projects, keyword, kindFilter, tagFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const normalizedPage = Math.min(page, totalPages);
  const currentItems = filtered.slice((normalizedPage - 1) * PAGE_SIZE, normalizedPage * PAGE_SIZE);

  const [[backHref, backLabel]] = useState<[string, string | null]>(() => {
    if (typeof window === 'undefined') return ['/', null];
    const hash = sessionStorage.getItem(navigationStateKeys.homeReferrerHash);
    let label = null;
    if (hash === 'about') {
      label = t('backToAbout');
    } else if (hash === 'timeline') {
      label = t('backToActive');
    }
    return ['/', label];
  });

  return (
    <section className="max-w-5xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
      <div className="mb-8">
        <Link
          href={backHref}
          className="back-link"
          onClick={(e) => {
            if (!isPlainLeftClick(e)) {
              return;
            }

            writeSessionValue(navigationStateKeys.returnToProjects, '1');
            if ('startViewTransition' in document) {
              e.preventDefault();
              runRouteTransition(() => {
                router.push(backHref);
              }, { direction: 'backward' });
            }
          }}
        >
          {backLabel ?? t('backToTop')}
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
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm focus:border-border-hover"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {KIND_FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={kindFilter === option}
              onClick={() => {
                setKindFilter(option);
                setPage(1);
              }}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${kindFilter === option
                ? 'border-foreground bg-foreground text-background'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-border-hover'}`}
            >
              {option === 'all' ? t('filterAll') : tKind(option)}
            </button>
          ))}
          <label htmlFor="projects-tag" className="sr-only">{t('tagLabel')}</label>
          <select
            id="projects-tag"
            value={tagFilter ?? ''}
            onChange={(event) => {
              setTagFilter(event.target.value || null);
              setPage(1);
            }}
            className={`ml-auto rounded-full border bg-card px-3 py-1 text-xs font-mono ${tagFilter
              ? 'border-foreground text-foreground'
              : 'border-border text-muted-foreground hover:border-border-hover'}`}
          >
            <option value="">{t('allTags')}</option>
            {tagOptions.map(([tag, count]) => (
              <option key={tag} value={tag}>
                {tag} ({count})
              </option>
            ))}
          </select>
        </div>
      </div>

      <StaggerContainer
        key={`${keyword}-${kindFilter}-${tagFilter}-${normalizedPage}`}
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
                      router.push(`/projects/${project.id}`);
                    });
                    return;
                  }

                  if (canUseSharedElementTransitions()) {
                    e.preventDefault();
                    runViewTransition(() => {
                      transitionRouter.push(`/${locale}/projects/${project.id}`);
                    });
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
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Box className="w-10 h-10 text-muted-foreground/30" strokeWidth={1} />
                      </div>
                    )}
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
                      <ProjectBadges kind={project.kind} status={project.status} />
                      {project.tags.slice(0, 2).map((tag) => (
                        <TagChip
                          key={tag}
                          tag={tag}
                          onSelect={(selected) => {
                            setTagFilter(selected);
                            setPage(1);
                          }}
                        />
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
            {keyword.trim() || tagFilter || kindFilter !== 'all' ? t('noResults') : t('empty')}
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
