'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useTranslations } from '@/hooks/useTranslations';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

function AdringWidget({ onContentChange }: { onContentChange: (hasContent: boolean) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const widgetThemeRef = useRef<'light' | 'dark'>(resolvedTheme === 'light' ? 'light' : 'dark');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const syncTheme = () => {
      const widgetTheme = widgetThemeRef.current;
      Array.from(container.children).forEach((child) => {
        if (!(child instanceof HTMLElement) || !child.dataset.adringWidget) return;
        const host = child;
        if (host.dataset.adringTheme !== widgetTheme) {
          host.dataset.adringTheme = widgetTheme;
        }
      });
    };

    // The ad network adds its host element even when it has nothing to
    // show, so judge by size: anything taller than a sliver is real content.
    // It can also be briefly tall while loading and then collapse, so follow
    // the size both ways instead of latching on the first measurement.
    const sizeObserver = new ResizeObserver(() => {
      onContentChange(container.getBoundingClientRect().height > 80);
    });
    sizeObserver.observe(container);

    const observer = new MutationObserver(syncTheme);
    observer.observe(container, {
      childList: true,
      attributes: true,
      subtree: true,
      attributeFilter: ['data-adring-theme'],
    });

    const script = document.createElement('script');
    script.src = 'https://adring.net/widget/v1.js';
    script.async = true;
    script.dataset.siteId = 'fbc71748-a5a2-4a85-aa93-a9207450ff08';
    script.dataset.variant = 'carousel';
    container.append(script);

    return () => {
      observer.disconnect();
      sizeObserver.disconnect();
      container.replaceChildren();
    };
  }, [onContentChange]);

  useEffect(() => {
    const widgetTheme = resolvedTheme === 'light' ? 'light' : 'dark';
    widgetThemeRef.current = widgetTheme;
    Array.from(containerRef.current?.children ?? []).forEach((child) => {
      if (!(child instanceof HTMLElement) || !child.dataset.adringWidget) return;
      const host = child;
      host.dataset.adringTheme = widgetTheme;
    });
  }, [resolvedTheme]);

  return <div ref={containerRef} className="flex justify-center" />;
}

export default function SponsorsSection() {
  const t = useTranslations('Sponsors');
  // The ad widget fills in after load (and stays empty on hosts the ad
  // network does not serve, such as localhost). Keep the section collapsed
  // until it has rendered so an empty frame never shows.
  const [rendered, setRendered] = useState(false);
  const handleContentChange = useCallback((hasContent: boolean) => setRendered(hasContent), []);

  return (
    <section id="sponsors" className={rendered ? 'py-10 sm:py-12 lg:py-16' : 'h-0 overflow-hidden'} aria-hidden={!rendered}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal delay={0.1}>
          <h2 className="mb-5 text-2xl sm:mb-6 sm:text-4xl font-bold tracking-tight">{t('heading')}</h2>
        </ScrollReveal>

        <ScrollReveal delay={0.16}>
          <div className="bento-card bento-card--static p-4 sm:p-5">
            <AdringWidget onContentChange={handleContentChange} />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
