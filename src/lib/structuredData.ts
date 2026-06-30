import { getLocaleMeta, type AppLocale } from '@/i18n/locales';
import type { ProjectDetailRecord } from '@/lib/content/publicContent';
import { DEFAULT_OG_IMAGE_PATH, buildLocaleUrl, getLocaleSeo, getSiteUrl } from '@/lib/seo';

type JsonLdValue = Record<string, unknown> | Array<Record<string, unknown>>;

export function serializeJsonLd(value: JsonLdValue) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function absoluteUrl(url: string | null | undefined) {
  if (!url) return `${getSiteUrl()}${DEFAULT_OG_IMAGE_PATH}`;
  return new URL(url, getSiteUrl()).toString();
}

export function createHomeJsonLd(locale: AppLocale) {
  const seo = getLocaleSeo(locale);
  const siteUrl = buildLocaleUrl(locale);
  const language = getLocaleMeta(locale).dateLocale;

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: seo.siteName,
      url: siteUrl,
      description: seo.homeDescription,
      inLanguage: language,
      author: {
        '@type': 'Person',
        name: 'Aki',
        url: siteUrl,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Aki',
      url: siteUrl,
      image: absoluteUrl('/images/profile/akiz-profile.jpg'),
      jobTitle: 'Independent Developer',
      sameAs: [
        'https://github.com/AxAce67',
        'https://x.com/real_Aki',
      ],
    },
  ];
}

export function createProjectsCollectionJsonLd(locale: AppLocale) {
  const seo = getLocaleSeo(locale);
  const url = buildLocaleUrl(locale, '/projects');

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: seo.projectsTitle,
    description: seo.projectsDescription,
    url,
    inLanguage: getLocaleMeta(locale).dateLocale,
    isPartOf: {
      '@type': 'WebSite',
      name: seo.siteName,
      url: buildLocaleUrl(locale),
    },
  };
}

export function createProjectJsonLd(locale: AppLocale, project: ProjectDetailRecord) {
  const seo = getLocaleSeo(locale);
  const url = buildLocaleUrl(locale, `/projects/${project.id}`);
  const name = project.title?.trim() || 'Project';

  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name,
    headline: name,
    description: project.description?.trim() || seo.projectsDescription,
    url,
    image: absoluteUrl(project.thumbnail_url),
    dateCreated: project.created_at ?? undefined,
    dateModified: project.updated_at ?? project.created_at ?? undefined,
    keywords: project.tags.length > 0 ? project.tags.join(', ') : undefined,
    inLanguage: getLocaleMeta(locale).dateLocale,
    author: {
      '@type': 'Person',
      name: 'Aki',
      url: buildLocaleUrl(locale),
    },
    isPartOf: {
      '@type': 'WebSite',
      name: seo.siteName,
      url: buildLocaleUrl(locale),
    },
  };
}
