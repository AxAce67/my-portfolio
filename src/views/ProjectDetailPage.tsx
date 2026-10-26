'use client';

import { useTranslation } from 'react-i18next';
import Image from '@/components/ui/Image';
import type { ProjectDetailResult } from '@/lib/content/publicContent';
import BackToProjectsLink from '@/components/projects/BackToProjectsLink';
import ScrollToTopOnMount from '@/components/projects/ScrollToTopOnMount';
import MarkdownArticle from '@/components/content/MarkdownArticle';
import BlockNoteContent from '@/components/content/BlockNoteContent';
import { areSameCalendarDate, formatLocaleDate } from '@/lib/dates';
import { ProjectBadges, TagChip } from '@/components/projects/ProjectBadges';
import { ArrowUpRight } from 'lucide-react';

type Props = {
  initialResult: ProjectDetailResult;
};

export default function ProjectDetailPage({ initialResult }: Props) {
  const { t, i18n } = useTranslation('ProjectDetail');
  const locale = i18n.language;
  const result = initialResult;
  const project = result?.status === 'ok' ? result.project : null;

  if (result.status === 'unavailable') {
    return (
      <article className="max-w-5xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
        <ScrollToTopOnMount />
        <div className="max-w-3xl mx-auto">
          <BackToProjectsLink
            homeHref={`/${locale}`}
            archiveHref={`/${locale}/projects`}
            homeLabel={t('backToProjects')}
            archiveLabel={t('backToArchive')}
            className="back-link"
          />
          <div className="mt-10 rounded-xl border border-border bg-card/70 p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t('unavailableTitle')}</h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              {t('unavailableDescription')}
            </p>
          </div>
        </div>
      </article>
    );
  }

  if (!project) return null;

  const showUpdatedAt = !!project.updated_at && !areSameCalendarDate(project.created_at, project.updated_at);
  const hasTags = project.tags.length > 0;

  return (
    <article className="max-w-5xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
      <ScrollToTopOnMount />
      <div className="max-w-3xl mx-auto">
        <BackToProjectsLink
          homeHref={`/${locale}`}
          archiveHref={`/${locale}/projects`}
          homeLabel={t('backToProjects')}
          archiveLabel={t('backToArchive')}
          className="back-link"
        />

        <header className="mt-5 mb-8">
          <div className="mb-4 flex flex-wrap items-center gap-2 empty:hidden">
            <ProjectBadges kind={project.kind} status={project.status} />
            {hasTags && project.tags.map((tag) => <TagChip key={tag} tag={tag} />)}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight text-balance">{project.title}</h1>
          {project.description && (
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mt-4 text-pretty">
              {project.description}
            </p>
          )}
          {project.kind === 'service' && project.service_url && (
            <a
              href={project.service_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-6 inline-flex items-center gap-1.5 px-4 py-2 text-sm"
            >
              {t('openService')}
              <ArrowUpRight className="w-4 h-4" />
            </a>
          )}
          <div className="mt-6 flex flex-wrap gap-4">
            <p className="text-xs text-muted-foreground font-mono tracking-wide uppercase">
              {t('createdAt')}: {formatLocaleDate(project.created_at, locale)}
            </p>
            {showUpdatedAt && (
              <p className="text-xs text-muted-foreground font-mono tracking-wide uppercase">
                {t('updatedAt')}: {formatLocaleDate(project.updated_at, locale)}
              </p>
            )}
          </div>
        </header>
      </div>

      {project.thumbnail_url ? (
        <div className="relative mb-8 aspect-video overflow-hidden rounded-xl border border-border max-w-3xl mx-auto bg-muted">
          <Image
            src={project.thumbnail_url}
            alt={`${project.title} thumbnail`}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
            priority
            style={{ viewTransitionName: `proj-${project.id}`, viewTransitionClass: 'project-media' }}
          />
        </div>
      ) : null}

      <div className="max-w-3xl mx-auto border-t border-border pt-7 article-content">
        {Array.isArray(project.content_json) && (project.content_json as unknown[]).length > 0 ? (
          <BlockNoteContent blocks={project.content_json} />
        ) : project.content_md ? (
          <MarkdownArticle content={project.content_md} />
        ) : (
          <p className="text-sm text-muted-foreground">{t('noContent')}</p>
        )}
      </div>
    </article>
  );
}
