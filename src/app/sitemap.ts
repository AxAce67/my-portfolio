import type { MetadataRoute } from 'next';
import { locales, type AppLocale } from '@/i18n/locales';
import { getProjectsListData } from '@/lib/content/publicContent';
import { buildLocaleUrl } from '@/lib/seo';

const staticRoutes = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: '/projects', priority: 0.85, changeFrequency: 'weekly' },
  { path: '/servers', priority: 0.65, changeFrequency: 'weekly' },
  { path: '/terms', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/license', priority: 0.2, changeFrequency: 'yearly' },
] as const;

function localizedUrl(locale: AppLocale, path: string) {
  return buildLocaleUrl(locale, path);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries = locales.flatMap((locale) =>
    staticRoutes.map((route) => ({
      url: localizedUrl(locale, route.path),
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
  );

  const projects = await getProjectsListData();
  const projectEntries = projects.flatMap((project) => {
    const lastModified = project.updated_at ?? project.created_at ?? now;

    return locales.map((locale) => ({
      url: localizedUrl(locale, `/projects/${project.id}`),
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    }));
  });

  return [...staticEntries, ...projectEntries];
}
