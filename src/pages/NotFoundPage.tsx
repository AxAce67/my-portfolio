import { ArrowLeft, FolderGit2 } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { Link } from '@/i18n/routing';

export default function NotFoundPage() {
  const t = useTranslations('NotFound');

  return (
    <section className="not-found-section min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-lg w-full text-center">
        <p className="not-found-numeral">404</p>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mb-8">{t('description')}</p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            {t('backHome')}
          </Link>
          <Link href="/projects" className="btn-outline inline-flex items-center gap-2">
            <FolderGit2 className="w-4 h-4" strokeWidth={1.5} />
            {t('goProjects')}
          </Link>
        </div>
      </div>
    </section>
  );
}
