import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Image from '@/components/ui/Image';
import { getProjectById, type ProjectDetailResult } from '@/lib/content/publicContent';
import BackToProjectsLink from '@/components/projects/BackToProjectsLink';
import ScrollToTopOnMount from '@/components/projects/ScrollToTopOnMount';
import MarkdownArticle from '@/components/content/MarkdownArticle';
import BlockNoteContent from '@/components/content/BlockNoteContent';
import { areSameCalendarDate, formatLocaleDate } from '@/lib/dates';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation('ProjectDetail');
  const navigate = useNavigate();
  const locale = i18n.language;

  const [result, setResult] = useState<ProjectDetailResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getProjectById(id).then((res) => {
      if (res.status === 'not_found') {
        navigate(`/${locale}/projects`, { replace: true });
        return;
      }
      setResult(res);
      setLoading(false);
    });
  }, [id, locale, navigate]);

  if (loading || !result) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

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
            className="text-xs font-mono text-muted-foreground hover:text-foreground"
          />
          <div className="mt-10 rounded-2xl border border-border bg-card/70 p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t('unavailableTitle')}</h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              {t('unavailableDescription')}
            </p>
          </div>
        </div>
      </article>
    );
  }

  const project = result.project;
  if (!project) return null;

  const showUpdatedAt = !!project.updated_at && !areSameCalendarDate(project.created_at, project.updated_at);

  return (
    <article className="max-w-5xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
      <ScrollToTopOnMount />
      <div className="max-w-3xl mx-auto">
        <BackToProjectsLink
          homeHref={`/${locale}`}
          archiveHref={`/${locale}/projects`}
          homeLabel={t('backToProjects')}
          archiveLabel={t('backToArchive')}
          className="text-xs font-mono text-muted-foreground hover:text-foreground"
        />

        <header className="mt-7 mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">{project.title}</h1>
          {project.description && (
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mt-4">
              {project.description}
            </p>
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
        <div className="mb-10 overflow-hidden rounded-2xl border border-border max-w-3xl mx-auto">
          <Image
            src={project.thumbnail_url}
            alt={`${project.title} thumbnail`}
            width={1600}
            height={900}
            sizes="(max-width: 768px) 100vw, 768px"
            className="w-full h-auto object-cover rounded-2xl"
            priority
            style={{ viewTransitionName: `proj-${project.id}`, viewTransitionClass: 'project-media' }}
          />
        </div>
      ) : null}

      <div className="max-w-3xl mx-auto border-t border-border pt-8 article-content">
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
