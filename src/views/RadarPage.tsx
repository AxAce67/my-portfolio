'use client';

import { ExternalLink } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

const RADAR_URL = 'https://tar1090.aki.quest/tar1090/';

export default function RadarPage() {
  const t = useTranslations('Radar');

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{t('eyebrow')}</p>
          <h1 className="mt-2 text-3xl sm:text-5xl font-bold tracking-tight">{t('heading')}</h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed">
            {t('description')}
          </p>
        </div>
        <a
          href={RADAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-border-hover hover:bg-muted"
        >
          {t('openExternal')}
          <ExternalLink className="h-4 w-4" strokeWidth={1.5} />
        </a>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-muted">
        <iframe
          title={t('iframeTitle')}
          src={RADAR_URL}
          className="h-[calc(100vh-11rem)] min-h-[620px] w-full bg-background"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {t('fallback')}{' '}
        <a href={RADAR_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-foreground">
          {t('openExternal')}
        </a>
      </p>
    </section>
  );
}
