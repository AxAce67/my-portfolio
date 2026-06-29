import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  buildLocaleUrl,
  getLocaleSeo,
  getOpenGraphLocale,
  getSiteUrl,
} from '@/lib/seo';
import { useLocale } from '@/hooks/useLocale';
import { locales } from '@/i18n/locales';

function setMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([name, value]) => element?.setAttribute(name, value));
}

function setLink(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLLinkElement>(selector);
  if (!element) {
    element = document.createElement('link');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([name, value]) => element?.setAttribute(name, value));
}

export function SeoManager() {
  const pathname = usePathname() ?? '';
  const segments = pathname.split('/').filter(Boolean);
  const locale = useLocale();
  const localPath = `/${segments.slice(1).join('/')}`.replace(/\/$/, '') || '/';
  const seo = useMemo(() => getLocaleSeo(locale), [locale]);
  const route = segments[1] ?? '';
  const isProjectDetail = route === 'projects' && Boolean(segments[2]);
  const isAdmin = route === 'admin';

  useEffect(() => {
    const routeTitle =
      route === 'projects'
        ? isProjectDetail
          ? `Project | ${seo.siteName}`
          : seo.projectsTitle
        : route === 'servers'
          ? `Servers | ${seo.siteName}`
          : route === 'terms'
            ? `Terms | ${seo.siteName}`
            : route === 'license'
              ? `License | ${seo.siteName}`
              : isAdmin
                ? `Admin | ${seo.siteName}`
                : seo.homeTitle;
    const description = route === 'projects' ? seo.projectsDescription : seo.homeDescription;
    const canonicalUrl = buildLocaleUrl(locale, localPath);

    document.title = routeTitle;
    setMeta('meta[name="description"]', { name: 'description', content: description });
    setMeta('meta[name="robots"]', {
      name: 'robots',
      content: isAdmin ? 'noindex, nofollow' : 'index, follow',
    });
    setMeta('meta[property="og:title"]', { property: 'og:title', content: routeTitle });
    setMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    setMeta('meta[property="og:type"]', { property: 'og:type', content: isProjectDetail ? 'article' : 'website' });
    setMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    setMeta('meta[property="og:locale"]', { property: 'og:locale', content: getOpenGraphLocale(locale) });
    setMeta('meta[property="og:image"]', {
      property: 'og:image',
      content: `${getSiteUrl()}/og-default.png`,
    });
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: routeTitle });
    setMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    setLink('link[rel="canonical"]', { rel: 'canonical', href: canonicalUrl });

    const alternateLinks: HTMLLinkElement[] = [];
    locales.forEach((alternateLocale) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = alternateLocale;
      link.href = buildLocaleUrl(alternateLocale, localPath);
      document.head.appendChild(link);
      alternateLinks.push(link);
    });
    const defaultLink = document.createElement('link');
    defaultLink.rel = 'alternate';
    defaultLink.hreflang = 'x-default';
    defaultLink.href = buildLocaleUrl('ja', localPath);
    document.head.appendChild(defaultLink);
    alternateLinks.push(defaultLink);

    return () => {
      alternateLinks.forEach((link) => link.remove());
    };
  }, [isAdmin, isProjectDetail, localPath, locale, route, seo]);

  return null;
}
