import { getLocaleMeta, locales, type AppLocale } from '@/i18n/routing';

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
        homeDescription: '個人開発者 Aki のポートフォリオ。Web制作・開発実績や取り組みを紹介します。',
        projectsTitle: 'Projects Archive | Aki Portfolio',
        projectsDescription: '公開中プロジェクトの一覧です。',
      };
    case 'zh-cn':
      return {
        siteName: 'Aki Portfolio',
        homeTitle: 'Aki Portfolio',
        homeDescription: '独立开发者 Aki 的作品集，展示网页制作、开发项目与持续进行中的工作。',
        projectsTitle: '项目档案 | Aki Portfolio',
        projectsDescription: '已公开项目的完整列表。',
      };
    case 'zh-tw':
      return {
        siteName: 'Aki Portfolio',
        homeTitle: 'Aki Portfolio',
        homeDescription: '獨立開發者 Aki 的作品集，展示網站製作、開發作品與持續中的專案。',
        projectsTitle: '專案檔案 | Aki Portfolio',
        projectsDescription: '所有已公開專案的列表。',
      };
    case 'ko':
      return {
        siteName: 'Aki Portfolio',
        homeTitle: 'Aki Portfolio',
        homeDescription: '인디 개발자 Aki의 포트폴리오로, 웹 제작과 개발 프로젝트 및 진행 중인 작업을 소개합니다.',
        projectsTitle: '프로젝트 아카이브 | Aki Portfolio',
        projectsDescription: '공개된 프로젝트 전체 목록입니다.',
      };
    case 'es':
      return {
        siteName: 'Aki Portfolio',
        homeTitle: 'Aki Portfolio',
        homeDescription: 'Portafolio de Aki, desarrollador independiente, con proyectos web y trabajos de desarrollo en curso.',
        projectsTitle: 'Archivo de proyectos | Aki Portfolio',
        projectsDescription: 'Lista completa de proyectos publicados.',
      };
    case 'fr':
      return {
        siteName: 'Aki Portfolio',
        homeTitle: 'Aki Portfolio',
        homeDescription: 'Portfolio de Aki, développeur indépendant, présentant ses projets web et ses travaux en cours.',
        projectsTitle: 'Archives des projets | Aki Portfolio',
        projectsDescription: 'Liste complète des projets publiés.',
      };
    case 'pt':
      return {
        siteName: 'Aki Portfolio',
        homeTitle: 'Aki Portfolio',
        homeDescription: 'Portfólio de Aki, desenvolvedor independente, com projetos web e trabalhos de desenvolvimento em andamento.',
        projectsTitle: 'Arquivo de projetos | Aki Portfolio',
        projectsDescription: 'Lista completa de projetos publicados.',
      };
    case 'en':
    default:
      return {
        siteName: 'Aki Portfolio',
        homeTitle: 'Aki Portfolio',
        homeDescription: 'Portfolio of indie developer Aki featuring web projects and development work.',
        projectsTitle: 'Projects Archive | Aki Portfolio',
        projectsDescription: 'A full list of published projects.',
      };
  }
}

export function getOpenGraphLocale(locale: AppLocale) {
  return getLocaleMeta(locale).ogLocale;
}
