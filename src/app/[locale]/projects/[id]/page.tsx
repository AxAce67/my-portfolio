import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getProjectById, getProjectsListData } from '@/lib/content/publicContent';
import BackToProjectsLink from '@/components/projects/BackToProjectsLink';
import MarkdownArticle from '@/components/content/MarkdownArticle';
import BlockNoteContent from '@/components/content/BlockNoteContent';
import { getValidLocale } from '@/i18n/routing';
import { buildLocaleAlternates, buildLocalePath, DEFAULT_OG_IMAGE_PATH, getLocaleSeo } from '@/lib/seo';
import { areSameCalendarDate, formatLocaleDate } from '@/lib/dates';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateStaticParams() {
  const projects = await getProjectsListData();
  return projects.map((project) => ({ id: project.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale, id } = await params;
  const locale = getValidLocale(rawLocale);
  const seo = getLocaleSeo(locale);
  const result = await getProjectById(id);
  const project = result.status === 'ok' ? result.project : null;

  const canonical = buildLocalePath(locale, `/projects/${id}`);
  const title = project?.title?.trim() || seo.projectsTitle;
  const description = project?.description?.trim() || seo.projectsDescription;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: buildLocaleAlternates(`/projects/${id}`),
    },
    openGraph: {
      title,
      description,
      url: canonical,
      images: [{ url: DEFAULT_OG_IMAGE_PATH, width: 1200, height: 630 }],
    },
    twitter: {
      title,
      description,
      images: [DEFAULT_OG_IMAGE_PATH],
    },
  };
}

export default async function ProjectArticlePage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations('ProjectDetail');
  const result = await getProjectById(id);

  if (result.status === 'unavailable') {
    return (
      <article className="max-w-5xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
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

  if (result.status === 'not_found') notFound();
  const project = result.project;
  const showUpdatedAt = !!project.updated_at && !areSameCalendarDate(project.created_at, project.updated_at);

  return (
    <article className="max-w-5xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
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

      <div
        className="max-w-3xl mx-auto border-t border-border pt-8 article-content"
      >
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
