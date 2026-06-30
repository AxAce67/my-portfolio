import { getLocaleMeta, locales, type AppLocale } from '@/i18n/locales';

const HOME_DESCRIPTION = 'Building what I love with code.';
const PROJECTS_DESCRIPTION = 'Projects Aki has built.';

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return 'https://aki.quest';
  return configured.replace(/\/+$/, '');
}

export const DEFAULT_OG_IMAGE_PATH = '/og-default.png';

export function buildLocalePath(locale: AppLocale, path = ''): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${normalized === '/' ? '' : normalized}`;
}

export function buildLocaleUrl(locale: AppLocale, path = ''): string {
  return `${getSiteUrl()}${buildLocalePath(locale, path)}`;
}

export function buildLocaleAlternates(path = '') {
  return Object.fromEntries(locales.map((locale) => [locale, buildLocalePath(locale, path)])) as Record<AppLocale, string>;
}

export function buildLocaleUrlAlternates(path = '') {
  return Object.fromEntries(locales.map((locale) => [locale, buildLocaleUrl(locale, path)])) as Record<AppLocale, string>;
}

export function getLocaleSeo(locale: AppLocale) {
  switch (locale) {
    case 'ja':
      return {
        siteName: 'Aki Portfolio',
        homeTitle: 'Aki Portfolio',
        homeDescription: HOME_DESCRIPTION,
        projectsTitle: 'Projects Archive | Aki Portfolio',
        projectsDescription: PROJECTS_DESCRIPTION,
      };
    case 'zh-cn':
      return {
        siteName: 'Aki Portfolio',
        homeTitle: 'Aki Portfolio',
        homeDescription: HOME_DESCRIPTION,
        projectsTitle: '项目档案 | Aki Portfolio',
        projectsDescription: PROJECTS_DESCRIPTION,
      };
    case 'zh-tw':
      return {
        siteName: 'Aki Portfolio',
        homeTitle: 'Aki Portfolio',
        homeDescription: HOME_DESCRIPTION,
        projectsTitle: '專案檔案 | Aki Portfolio',
        projectsDescription: PROJECTS_DESCRIPTION,
      };
    case 'ko':
      return {
        siteName: 'Aki Portfolio',
        homeTitle: 'Aki Portfolio',
        homeDescription: HOME_DESCRIPTION,
        projectsTitle: '프로젝트 아카이브 | Aki Portfolio',
        projectsDescription: PROJECTS_DESCRIPTION,
      };
    case 'es':
      return {
        siteName: 'Aki Portfolio',
        homeTitle: 'Aki Portfolio',
        homeDescription: HOME_DESCRIPTION,
        projectsTitle: 'Archivo de proyectos | Aki Portfolio',
        projectsDescription: PROJECTS_DESCRIPTION,
      };
    case 'fr':
      return {
        siteName: 'Aki Portfolio',
        homeTitle: 'Aki Portfolio',
        homeDescription: HOME_DESCRIPTION,
        projectsTitle: 'Archives des projets | Aki Portfolio',
        projectsDescription: PROJECTS_DESCRIPTION,
      };
    case 'pt':
      return {
        siteName: 'Aki Portfolio',
        homeTitle: 'Aki Portfolio',
        homeDescription: HOME_DESCRIPTION,
        projectsTitle: 'Arquivo de projetos | Aki Portfolio',
        projectsDescription: PROJECTS_DESCRIPTION,
      };
    case 'en':
    default:
      return {
        siteName: 'Aki Portfolio',
        homeTitle: 'Aki Portfolio',
        homeDescription: HOME_DESCRIPTION,
        projectsTitle: 'Projects Archive | Aki Portfolio',
        projectsDescription: PROJECTS_DESCRIPTION,
      };
  }
}

export function getOpenGraphLocale(locale: AppLocale) {
  return getLocaleMeta(locale).ogLocale;
}
