'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useTranslations } from '@/hooks/useTranslations';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

function AdringWidget() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const widgetThemeRef = useRef<'light' | 'dark'>('dark');

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

    const observer = new MutationObserver(syncTheme);
    observer.observe(container, {
      childList: true,
      attributes: true,
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
      container.replaceChildren();
    };
  }, []);

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

  return (
    <section id="sponsors" className="py-12 sm:py-16 lg:py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal delay={0.1}>
          <div className="mb-8 text-center sm:mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">{t('heading')}</h2>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.16}>
          <div className="bento-card bento-card--static mx-auto max-w-4xl p-4 sm:p-5">
            <AdringWidget />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
