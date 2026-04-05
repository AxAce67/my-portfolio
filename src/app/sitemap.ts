import type { MetadataRoute } from 'next';
import { getProjectsListData } from '@/lib/content/publicContent';
import { locales } from '@/i18n/routing';
import { buildLocaleAlternates, buildLocalePath, getSiteUrl } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();
  const rows = await getProjectsListData();

  const staticEntries: MetadataRoute.Sitemap = locales.flatMap((locale) => [
    {
      url: `${siteUrl}${buildLocalePath(locale)}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
      alternates: {
        languages: Object.fromEntries(
          Object.entries(buildLocaleAlternates()).map(([key, value]) => [key, `${siteUrl}${value}`])
        ),
      },
    },
    {
      url: `${siteUrl}${buildLocalePath(locale, '/projects')}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: Object.fromEntries(
          Object.entries(buildLocaleAlternates('/projects')).map(([key, value]) => [key, `${siteUrl}${value}`])
        ),
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
          languages: Object.fromEntries(
            Object.entries(buildLocaleAlternates(path)).map(([key, value]) => [key, `${siteUrl}${value}`])
          ),
        },
      };
    })
  );

  return [...staticEntries, ...projectEntries];
}
