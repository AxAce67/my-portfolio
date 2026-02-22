export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return 'https://akiz.dev';
  return configured.replace(/\/+$/, '');
}

export const DEFAULT_OG_IMAGE_PATH = '/og-default.png';

export function buildLocalePath(locale: 'ja' | 'en', path = ''): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${normalized === '/' ? '' : normalized}`;
}

export function getLocaleSeo(locale: 'ja' | 'en') {
  if (locale === 'ja') {
    return {
      siteName: 'Akiz. Portfolio',
      homeTitle: 'Akiz. | 個人開発ポートフォリオ',
      homeDescription: '個人開発者 Aki のポートフォリオ。Web制作・開発実績や取り組みを紹介します。',
      projectsTitle: 'Projects Archive | Akiz.',
      projectsDescription: '公開中プロジェクトの一覧です。',
    };
  }

  return {
    siteName: 'Akiz. Portfolio',
    homeTitle: 'Akiz. | Indie Developer Portfolio',
    homeDescription: 'Portfolio of indie developer Aki featuring web projects and development work.',
    projectsTitle: 'Projects Archive | Akiz.',
    projectsDescription: 'A full list of published projects.',
  };
}
