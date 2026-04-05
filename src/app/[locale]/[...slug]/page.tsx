import { getLocale, getTranslations } from 'next-intl/server';
import { TransitionLink } from '@/components/ui/TransitionLink';

export default async function LocaleCatchAllNotFoundPage() {
  const locale = await getLocale();
  const t = await getTranslations('NotFound');

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-10">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{t('code')}</p>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">{t('title')}</h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground">{t('description')}</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <TransitionLink href={`/${locale}`} className="btn-primary" direction="backward">
            {t('backHome')}
          </TransitionLink>
          <TransitionLink href={`/${locale}/projects`} className="btn-outline">
            {t('goProjects')}
          </TransitionLink>
        </div>
      </div>
    </section>
  );
}
