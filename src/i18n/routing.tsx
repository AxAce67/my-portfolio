export {
    defaultLocale,
    getLocaleMeta,
    getValidLocale,
    isAppLocale,
    localeMeta,
    locales,
    routing,
    type AppLocale,
} from './locales';

import { isAppLocale, type AppLocale } from './locales';

import NextLink, { type LinkProps } from 'next/link';
import { redirect as nextRedirect, usePathname as useNextPathname, useRouter as useNextRouter } from 'next/navigation';
import type { AnchorHTMLAttributes } from 'react';
import { useAppLocale } from '@/i18n/LocaleProvider';

function useCurrentLocale(): AppLocale {
    return useAppLocale();
}

// Paths passed around the app are written without a locale prefix
// (e.g. "/projects"), matching the old next-intl convention where the
// framework added it automatically. This helper does that for Next links:
// paths that already start with a known locale segment (or
// are external/anchor/mailto links) are left untouched.
function withLocale(path: string, locale: AppLocale): string {
    if (!path.startsWith('/') || path.startsWith('//')) return path;

    // Split off the hash before prefixing so "/#projects" becomes
    // "/ja#projects", not "/ja/#projects" (which leaves a trailing slash
    // on the pathname and breaks home-page detection elsewhere).
    const hashIndex = path.indexOf('#');
    const pathAndSearch = hashIndex === -1 ? path : path.slice(0, hashIndex);
    const hash = hashIndex === -1 ? '' : path.slice(hashIndex);
    const searchIndex = pathAndSearch.indexOf('?');
    const pathname = searchIndex === -1 ? pathAndSearch : pathAndSearch.slice(0, searchIndex);
    const search = searchIndex === -1 ? '' : pathAndSearch.slice(searchIndex);

    const firstSegment = pathname.split('/')[1] ?? '';
    if (isAppLocale(firstSegment)) return path;

    const localizedPathname = pathname === '/' ? `/${locale}` : `/${locale}${pathname}`;
    return `${localizedPathname}${search}${hash}`;
}

export type CompatibleLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> &
    Omit<LinkProps, 'href' | 'as'> & {
        href: string;
    };
export const Link = ({ href, prefetch: _prefetch, ...props }: CompatibleLinkProps) => {
    const locale = useCurrentLocale();
    const resolved = href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')
        ? href
        : withLocale(href, locale);
    return <NextLink href={resolved} prefetch={_prefetch} {...props} />;
};

export const redirect = nextRedirect;

export function usePathname() {
    return useNextPathname() ?? '';
}

export function useRouter() {
    const router = useNextRouter();
    const locale = useCurrentLocale();
    return {
        push: (path: string, options?: { scroll?: boolean }) => router.push(withLocale(path, locale), options),
        replace: (path: string, options?: { scroll?: boolean }) => router.replace(withLocale(path, locale), options),
        back: () => router.back(),
        prefetch: (path: string) => router.prefetch(withLocale(path, locale)),
    };
}
