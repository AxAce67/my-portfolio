import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { loginAction } from './actions';
import { sanitizeInternalPath } from '@/lib/security';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string | string[]; error?: string | string[] }>;
};

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const query = await searchParams;
  const t = await getTranslations({ locale, namespace: 'Login' });
  const rawNext = Array.isArray(query.next) ? query.next[0] : query.next;
  const errorCode = Array.isArray(query.error) ? query.error[0] : query.error;
  const nextPath = sanitizeInternalPath(rawNext, `/${locale}/dashboard`);
  const hasError = errorCode === 'invalid_credentials';
  const isRateLimited = errorCode === 'rate_limited';

  return (
    <section className="max-w-md mx-auto px-6 lg:px-8 py-24">
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>

        {hasError && (
          <p className="text-sm text-red-500">{t('errorInvalid')}</p>
        )}
        {isRateLimited && (
          <p className="text-sm text-red-500">{t('errorRateLimit')}</p>
        )}

        <form action={loginAction.bind(null, locale)} className="space-y-3">
          <input type="hidden" name="next" value={nextPath} />
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">{t('email')}</label>
            <input name="email" type="email" required className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">{t('password')}</label>
            <input name="password" type="password" required className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm" />
          </div>

          <button type="submit" className="btn-primary w-full">{t('submit')}</button>
        </form>

      </div>
      <Link href={`/${locale}`} className="mt-4 inline-block text-xs font-mono text-muted-foreground hover:text-foreground">
        {t('backToSite')}
      </Link>
    </section>
  );
}
