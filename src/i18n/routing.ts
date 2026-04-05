import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

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

export const routing = defineRouting({
    locales: [...locales],
    defaultLocale,
    localeDetection: true,
});

export const { Link, redirect, usePathname, useRouter } =
    createNavigation(routing);
