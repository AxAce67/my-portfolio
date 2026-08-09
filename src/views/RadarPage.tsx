'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { Link } from '@/i18n/routing';
import { navigationStateKeys, readSessionValue, writeSessionValue } from '@/lib/navigationState';

const RADAR_URL = 'https://tar1090.aki.quest/tar1090/';

export default function RadarPage() {
  const t = useTranslations('Radar');
  const serversT = useTranslations('Servers');
  const [backLabel, setBackLabel] = useState<string | null>(null);

  useEffect(() => {
    const hash = readSessionValue(navigationStateKeys.homeReferrerHash);
    if (hash === 'about') setBackLabel(serversT('backAbout'));
    else if (hash === 'timeline') setBackLabel(serversT('backTimeline'));
  }, [serversT]);

  return (
    <section className="max-w-5xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
      <div className="mb-10">
        <Link
          href="/"
          className="text-xs font-mono text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => {
            writeSessionValue(navigationStateKeys.returnToProjects, '1');
          }}
        >
          {backLabel ?? serversT('backHome')}
        </Link>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{t('eyebrow')}</p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">{t('heading')}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground leading-relaxed">
              {t('description')}
            </p>
          </div>
          <a
            href={RADAR_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[12px] font-mono text-muted-foreground transition-colors hover:text-foreground"
          >
            <span>{t('openExternal')}</span>
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
          </a>
        </div>
      </div>

      <div className="bento-card bento-card--static overflow-hidden p-0">
        <iframe
          title={t('iframeTitle')}
          src={RADAR_URL}
          className="h-[70vh] min-h-[520px] w-full bg-background sm:min-h-[620px]"
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
