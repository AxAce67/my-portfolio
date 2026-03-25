'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { Search } from 'lucide-react';
import { Link } from '@/i18n/routing';

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
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);

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

  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(locale === 'ja' ? 'ja-JP' : 'en-US') : '-';

  return (
    <section className="max-w-5xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
      <div className="mb-8">
        <Link href="/#projects" className="text-xs font-mono text-muted-foreground hover:text-foreground">
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
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setPage(1);
            }}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-xl border border-border bg-card pl-10 pr-4 py-2.5 text-sm outline-none focus:border-border-hover"
          />
        </div>
      </div>

      <div className="space-y-4">
        {currentItems.map((project) => {
          const showUpdatedAt =
            Boolean(project.updatedAt) &&
            Boolean(project.createdAt) &&
            new Date(project.updatedAt as string).getTime() > new Date(project.createdAt as string).getTime();
          return (
            <Link key={project.id} href={`/projects/${project.id}`} prefetch className="block project-card group">
              <div className="flex flex-col sm:flex-row">
                <div className="w-full aspect-video sm:aspect-auto sm:w-64 sm:min-w-64 bg-muted overflow-hidden rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none relative">
                  {project.thumbnailUrl ? (
                    <Image
                      src={project.thumbnailUrl}
                      alt={`${project.title} thumbnail`}
                      fill
                      sizes="(max-width: 640px) 100vw, 256px"
                      className="absolute inset-0 object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div className="p-6 flex-1">
                  <h2 className="text-xl font-semibold tracking-tight mb-2">{project.title}</h2>
                  <div className="mb-2 flex flex-wrap gap-3">
                    <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wide">
                      {t('createdAt')}: {formatDate(project.createdAt)}
                    </p>
                    {showUpdatedAt && (
                      <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-wide">
                        {t('updatedAt')}: {formatDate(project.updatedAt)}
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span key={tag} className="text-[11px] font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('empty')}</p>
        )}
      </div>

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
