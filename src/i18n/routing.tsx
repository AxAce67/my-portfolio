// routing.ts

export const locales = [
    'ja',
    'en',
    'zh-cn',
    'zh-tw',
    'ko',
    'es',
    'fr',
    'pt',
] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'ja';

type LocaleMeta = {
    label: string;
    shortLabel: string;
    dateLocale: string;
    ogLocale: string;
    skipToContentLabel: string;
};

export const localeMeta: Record<AppLocale, LocaleMeta> = {
    ja: {
        label: '日本語',
        shortLabel: 'JA',
        dateLocale: 'ja-JP',
        ogLocale: 'ja_JP',
        skipToContentLabel: 'メインコンテンツへ移動',
    },
    en: {
        label: 'English',
        shortLabel: 'EN',
        dateLocale: 'en-US',
        ogLocale: 'en_US',
        skipToContentLabel: 'Skip to main content',
    },
    'zh-cn': {
        label: '简体中文',
        shortLabel: 'CN',
        dateLocale: 'zh-CN',
        ogLocale: 'zh_CN',
        skipToContentLabel: '跳到主要内容',
    },
    'zh-tw': {
        label: '繁體中文',
        shortLabel: 'TW',
        dateLocale: 'zh-TW',
        ogLocale: 'zh_TW',
        skipToContentLabel: '跳至主要內容',
    },
    ko: {
        label: '한국어',
        shortLabel: 'KO',
        dateLocale: 'ko-KR',
        ogLocale: 'ko_KR',
        skipToContentLabel: '본문으로 건너뛰기',
    },
    es: {
        label: 'Español',
        shortLabel: 'ES',
        dateLocale: 'es-ES',
        ogLocale: 'es_ES',
        skipToContentLabel: 'Saltar al contenido principal',
    },
    fr: {
        label: 'Français',
        shortLabel: 'FR',
        dateLocale: 'fr-FR',
        ogLocale: 'fr_FR',
        skipToContentLabel: 'Aller au contenu principal',
    },
    pt: {
        label: 'Português',
        shortLabel: 'PT',
        dateLocale: 'pt-BR',
        ogLocale: 'pt_BR',
        skipToContentLabel: 'Ir para o conteúdo principal',
    },
};

export function isAppLocale(value: string): value is AppLocale {
    return locales.includes(value as AppLocale);
}

export function getValidLocale(value: string): AppLocale {
    return isAppLocale(value) ? value : defaultLocale;
}

export function getLocaleMeta(value: string): LocaleMeta {
    return localeMeta[getValidLocale(value)];
}

export const routing = {
    locales: [...locales],
    defaultLocale,
    localeDetection: true,
};

import { Link as ReactRouterLink, useNavigate, useLocation, Navigate, LinkProps as RouterLinkProps } from 'react-router-dom';

function useCurrentLocale(): AppLocale {
    const { pathname } = useLocation();
    const segment = pathname.split('/')[1] ?? '';
    return getValidLocale(segment);
}

// Paths passed around the app are written without a locale prefix
// (e.g. "/projects"), matching the old next-intl convention where the
// framework added it automatically. This Vite/react-router shim has to do
// that itself — paths that already start with a known locale segment (or
// are external/anchor/mailto links) are left untouched.
function withLocale(path: string, locale: AppLocale): string {
    if (!path.startsWith('/') || path.startsWith('//')) return path;

    // Split off the hash before prefixing so "/#projects" becomes
    // "/ja#projects", not "/ja/#projects" (which leaves a trailing slash
    // on the pathname and breaks home-page detection elsewhere).
    const hashIndex = path.indexOf('#');
    const pathname = hashIndex === -1 ? path : path.slice(0, hashIndex);
    const hash = hashIndex === -1 ? '' : path.slice(hashIndex);

    const firstSegment = pathname.split('/')[1] ?? '';
    if (isAppLocale(firstSegment)) return path;

    const localizedPathname = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
    return `${localizedPathname}${hash}`;
}

export type CompatibleLinkProps = Omit<RouterLinkProps, 'to' | 'prefetch'> & { href: string; prefetch?: boolean };
export const Link = ({ href, prefetch: _prefetch, ...props }: CompatibleLinkProps) => {
    const locale = useCurrentLocale();
    const resolved = href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')
        ? href
        : withLocale(href, locale);
    return <ReactRouterLink to={resolved} {...props} />;
};

export const redirect = (path: string) => <Navigate to={path} />;

export function usePathname() {
    return useLocation().pathname;
}

export function useRouter() {
    const navigate = useNavigate();
    const locale = useCurrentLocale();
    return {
        push: (path: string, options?: { state?: unknown }) => navigate(withLocale(path, locale), options),
        replace: (path: string) => navigate(withLocale(path, locale), { replace: true }),
        back: () => navigate(-1),
        prefetch: (_path: string) => {}, // No-op for Vite SPA
    };
}
