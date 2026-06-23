import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  buildLocaleUrl,
  getLocaleSeo,
  getOpenGraphLocale,
  getSiteUrl,
} from '@/lib/seo';
import { getValidLocale, locales } from '@/i18n/routing';

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
  const { pathname } = useLocation();
  const segments = pathname.split('/').filter(Boolean);
  const locale = getValidLocale(segments[0] ?? '');
  const localPath = `/${segments.slice(1).join('/')}`.replace(/\/$/, '') || '/';
  const seo = getLocaleSeo(locale);
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

    document.head.querySelectorAll('link[data-locale-alternate]').forEach((element) => element.remove());
    locales.forEach((alternateLocale) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = alternateLocale;
      link.href = buildLocaleUrl(alternateLocale, localPath);
      link.dataset.localeAlternate = 'true';
      document.head.appendChild(link);
    });
    const defaultLink = document.createElement('link');
    defaultLink.rel = 'alternate';
    defaultLink.hreflang = 'x-default';
    defaultLink.href = buildLocaleUrl('ja', localPath);
    defaultLink.dataset.localeAlternate = 'true';
    document.head.appendChild(defaultLink);
  }, [isAdmin, isProjectDetail, localPath, locale, route, seo]);

  return null;
}
