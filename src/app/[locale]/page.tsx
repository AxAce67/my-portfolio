import type { Metadata } from 'next';
import HomePageClient, { type ActiveProject, type CompletedProject } from './HomePageClient';
import { getValidLocale } from '@/i18n/routing';
import { getHomePageData } from '@/lib/content/publicContent';
import { buildLocalePath, buildLocaleUrl, buildLocaleUrlAlternates, DEFAULT_OG_IMAGE_PATH, getLocaleSeo, getSiteUrl } from '@/lib/seo';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = getValidLocale(rawLocale);
  const seo = getLocaleSeo(locale);
  const siteUrl = getSiteUrl();
  const canonicalPath = buildLocalePath(locale);
  const canonical = buildLocaleUrl(locale);

  return {
    metadataBase: new URL(siteUrl),
    title: seo.homeTitle,
    description: seo.homeDescription,
    alternates: {
      canonical,
      languages: buildLocaleUrlAlternates(),
    },
    openGraph: {
      title: seo.homeTitle,
      description: seo.homeDescription,
      url: canonicalPath,
      images: [{ url: DEFAULT_OG_IMAGE_PATH, width: 1200, height: 630 }],
    },
    twitter: {
      title: seo.homeTitle,
      description: seo.homeDescription,
      images: [DEFAULT_OG_IMAGE_PATH],
    },
  };
}

export default async function HomePage({ params }: Props) {
  await params;
  const { projects, activeProjects } = await getHomePageData();
  const initialCompletedProjects: CompletedProject[] = projects.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    tags: row.tags,
    image: row.thumbnail_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  const initialActiveProjects: ActiveProject[] = activeProjects.map((row) => ({
    id: row.id,
    name: row.name,
    stage: row.stage,
  }));

  return (
    <HomePageClient
      initialCompletedProjects={initialCompletedProjects}
      initialActiveProjects={initialActiveProjects}
    />
  );
}
