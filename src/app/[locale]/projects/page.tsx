import type { Metadata } from 'next';
import ProjectsListClient, { type ProjectListItem } from '@/components/projects/ProjectsListClient';
import { getProjectsListData } from '@/lib/content/publicContent';
import { buildLocalePath, DEFAULT_OG_IMAGE_PATH, getLocaleSeo } from '@/lib/seo';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = (rawLocale === 'en' ? 'en' : 'ja') as 'ja' | 'en';
  const seo = getLocaleSeo(locale);
  const canonical = buildLocalePath(locale, '/projects');

  return {
    title: seo.projectsTitle,
    description: seo.projectsDescription,
    alternates: {
      canonical,
      languages: {
        ja: buildLocalePath('ja', '/projects'),
        en: buildLocalePath('en', '/projects'),
      },
    },
    openGraph: {
      title: seo.projectsTitle,
      description: seo.projectsDescription,
      url: canonical,
      images: [{ url: DEFAULT_OG_IMAGE_PATH, width: 1200, height: 630 }],
    },
    twitter: {
      title: seo.projectsTitle,
      description: seo.projectsDescription,
      images: [DEFAULT_OG_IMAGE_PATH],
    },
  };
}

export default async function ProjectsListPage({ params }: Props) {
  await params;
  const rows = await getProjectsListData();
  const projects: ProjectListItem[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    thumbnailUrl: row.thumbnail_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: row.tags,
  }));

  return <ProjectsListClient projects={projects} />;
}
