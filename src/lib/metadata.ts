import type { Metadata } from 'next';
import { defaultLocale, locales, type AppLocale } from '@/i18n/locales';
import type { ProjectDetailRecord } from '@/lib/content/publicContent';
import { DEFAULT_OG_IMAGE_PATH, buildLocaleUrl, getLocaleSeo, getOpenGraphLocale, getSiteUrl } from '@/lib/seo';

type PageKind = 'home' | 'projects' | 'projectDetail' | 'servers' | 'terms' | 'license' | 'admin';

const routePaths: Record<PageKind, string> = {
  home: '/',
  projects: '/projects',
  projectDetail: '/projects',
  servers: '/servers',
  terms: '/terms',
  license: '/license',
  admin: '/admin',
};

function getAlternateLanguages(path: string) {
  const languages = Object.fromEntries(locales.map((locale) => [locale, buildLocaleUrl(locale, path)]));
  return {
    ...languages,
    'x-default': buildLocaleUrl(defaultLocale, path),
  };
}

function getRouteCopy(locale: AppLocale, kind: PageKind) {
  const seo = getLocaleSeo(locale);

  switch (kind) {
    case 'projects':
      return { title: seo.projectsTitle, description: seo.projectsDescription };
    case 'projectDetail':
      return { title: `Project | ${seo.siteName}`, description: seo.projectsDescription };
    case 'servers':
      return { title: `Servers | ${seo.siteName}`, description: seo.homeDescription };
    case 'terms':
      return { title: `Terms | ${seo.siteName}`, description: seo.homeDescription };
    case 'license':
      return { title: `License | ${seo.siteName}`, description: seo.homeDescription };
    case 'admin':
      return { title: `Admin | ${seo.siteName}`, description: seo.homeDescription };
    case 'home':
    default:
      return { title: seo.homeTitle, description: seo.homeDescription };
  }
}

export function createPageMetadata(locale: AppLocale, kind: PageKind, path = routePaths[kind]): Metadata {
  const seo = getLocaleSeo(locale);
  const { title, description } = getRouteCopy(locale, kind);
  const canonical = buildLocaleUrl(locale, path);
  const imageUrl = `${getSiteUrl()}${DEFAULT_OG_IMAGE_PATH}`;
  const noindex = kind === 'admin';

  return {
    metadataBase: new URL(getSiteUrl()),
    title,
    description,
    alternates: {
      canonical,
      languages: getAlternateLanguages(path),
    },
    robots: noindex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: seo.siteName,
      locale: getOpenGraphLocale(locale),
      type: kind === 'projectDetail' ? 'article' : 'website',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: seo.siteName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

function toAbsoluteUrl(url: string | null | undefined) {
  if (!url) return `${getSiteUrl()}${DEFAULT_OG_IMAGE_PATH}`;

  try {
    return new URL(url, getSiteUrl()).toString();
  } catch {
    return `${getSiteUrl()}${DEFAULT_OG_IMAGE_PATH}`;
  }
}

export function createProjectMetadata(locale: AppLocale, project: ProjectDetailRecord, path: string): Metadata {
  const seo = getLocaleSeo(locale);
  const title = project.title?.trim() ? `${project.title.trim()} | ${seo.siteName}` : `Project | ${seo.siteName}`;
  const description = project.description?.trim() || seo.projectsDescription;
  const canonical = buildLocaleUrl(locale, path);
  const imageUrl = toAbsoluteUrl(project.thumbnail_url);

  return {
    metadataBase: new URL(getSiteUrl()),
    title,
    description,
    alternates: {
      canonical,
      languages: getAlternateLanguages(path),
    },
    robots: {
      index: true,
      follow: true,
    },
    keywords: project.tags.length > 0 ? project.tags : undefined,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: seo.siteName,
      locale: getOpenGraphLocale(locale),
      type: 'article',
      publishedTime: project.created_at ?? undefined,
      modifiedTime: project.updated_at ?? undefined,
      tags: project.tags.length > 0 ? project.tags : undefined,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: project.title?.trim() || seo.siteName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}
