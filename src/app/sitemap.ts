import type { MetadataRoute } from 'next';
import { getProjectsListData } from '@/lib/content/publicContent';
import { buildLocalePath, getSiteUrl } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();
  const locales: Array<'ja' | 'en'> = ['ja', 'en'];
  const rows = await getProjectsListData();

  const staticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) => [
    {
      url: `${siteUrl}${buildLocalePath(locale)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
      alternates: {
        languages: {
          ja: `${siteUrl}${buildLocalePath('ja')}`,
          en: `${siteUrl}${buildLocalePath('en')}`,
        },
      },
    },
    {
      url: `${siteUrl}${buildLocalePath(locale, '/projects')}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: {
          ja: `${siteUrl}${buildLocalePath('ja', '/projects')}`,
          en: `${siteUrl}${buildLocalePath('en', '/projects')}`,
        },
      },
    },
  ]);

  const projectEntries: MetadataRoute.Sitemap = rows.flatMap((project) =>
    locales.map((locale) => {
      const path = `/projects/${project.id}`;
      const updatedAt = project.updated_at ? new Date(project.updated_at) : now;
      return {
        url: `${siteUrl}${buildLocalePath(locale, path)}`,
        lastModified: updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        alternates: {
          languages: {
            ja: `${siteUrl}${buildLocalePath('ja', path)}`,
            en: `${siteUrl}${buildLocalePath('en', path)}`,
          },
        },
      };
    })
  );

  return [...staticEntries, ...projectEntries];
}

