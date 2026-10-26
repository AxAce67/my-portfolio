import { getLocaleMeta, type AppLocale } from '@/i18n/locales';
import { getMessages } from '@/i18n/messages';

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return 'https://aki.quest';
  return configured.replace(/\/+$/, '');
}

export const DEFAULT_OG_IMAGE_PATH = '/og-default.png';

function buildLocalePath(locale: AppLocale, path = ''): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${normalized === '/' ? '' : normalized}`;
}

export function buildLocaleUrl(locale: AppLocale, path = ''): string {
  return `${getSiteUrl()}${buildLocalePath(locale, path)}`;
}

export function getLocaleSeo(locale: AppLocale) {
  switch (locale) {
    case 'ja':
      return {
        siteName: 'Aki Portfolio',
        homeTitle: 'Aki Portfolio',
        homeDescription: getMessages(locale).Seo.homeDescription,
        projectsTitle: 'Projects Archive | Aki Portfolio',
        projectsDescription: getMessages(locale).ProjectList.description,
      };
    case 'zh-cn':
      return {
        siteName: 'Aki Portfolio',
        homeTitle: 'Aki Portfolio',
        homeDescription: getMessages(locale).Seo.homeDescription,
        projectsTitle: '项目归档 | Aki Portfolio',
        projectsDescription: getMessages(locale).ProjectList.description,
      };
    case 'zh-tw':
      return {
        siteName: 'Aki Portfolio',
        homeTitle: 'Aki Portfolio',
        homeDescription: getMessages(locale).Seo.homeDescription,
        projectsTitle: '專案列表 | Aki Portfolio',
        projectsDescription: getMessages(locale).ProjectList.description,
      };
    case 'ko':
      return {
        siteName: 'Aki Portfolio',
        homeTitle: 'Aki Portfolio',
        homeDescription: getMessages(locale).Seo.homeDescription,
        projectsTitle: '프로젝트 아카이브 | Aki Portfolio',
        projectsDescription: getMessages(locale).ProjectList.description,
      };
    case 'es':
      return {
        siteName: 'Aki Portfolio',
        homeTitle: 'Aki Portfolio',
        homeDescription: getMessages(locale).Seo.homeDescription,
        projectsTitle: 'Archivo de proyectos | Aki Portfolio',
        projectsDescription: getMessages(locale).ProjectList.description,
      };
    case 'fr':
      return {
        siteName: 'Aki Portfolio',
        homeTitle: 'Aki Portfolio',
        homeDescription: getMessages(locale).Seo.homeDescription,
        projectsTitle: 'Archives des projets | Aki Portfolio',
        projectsDescription: getMessages(locale).ProjectList.description,
      };
    case 'pt':
      return {
        siteName: 'Aki Portfolio',
        homeTitle: 'Aki Portfolio',
        homeDescription: getMessages(locale).Seo.homeDescription,
        projectsTitle: 'Arquivo de projetos | Aki Portfolio',
        projectsDescription: getMessages(locale).ProjectList.description,
      };
    case 'en':
    default:
      return {
        siteName: 'Aki Portfolio',
        homeTitle: 'Aki Portfolio',
        homeDescription: getMessages(locale).Seo.homeDescription,
        projectsTitle: 'Projects Archive | Aki Portfolio',
        projectsDescription: getMessages(locale).ProjectList.description,
      };
  }
}

export function getOpenGraphLocale(locale: AppLocale) {
  return getLocaleMeta(locale).ogLocale;
}
