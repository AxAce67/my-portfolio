import { Link } from '@/i18n/routing';
import { useTranslations } from '@/hooks/useTranslations';

const sections = [
  ['acceptanceTitle', 'acceptanceDescription'],
  ['useTitle', 'useDescription'],
  ['ipTitle', 'ipDescription'],
  ['disclaimerTitle', 'disclaimerDescription'],
  ['changesTitle', 'changesDescription'],
  ['contactTitle', 'contactDescription'],
  ['privacyTitle', 'privacyDescription'],
  ['governingTitle', 'governingDescription'],
] as const;

export default function TermsPage() {
  const t = useTranslations('Terms');

  return (
    <div className="legal-page">
      <div className="legal-document">
        <Link href="/" className="legal-doc-back">
          ← {t('backHome')}
        </Link>

        <header className="legal-doc-header">
          <h1 className="legal-doc-title">{t('title')}</h1>
          <p className="legal-doc-meta text-sm text-muted-foreground">
            {t('lastUpdated', { date: '2026-03-27' })}
          </p>
        </header>

        <div className="legal-doc-body">
          {sections.map(([titleKey, descriptionKey], index) => (
            <section className="legal-doc-section" key={titleKey}>
              <h2 className="legal-doc-heading">
                <span className="legal-doc-num">{t('sectionNum', { n: index + 1 })}</span>
                {t(titleKey)}
              </h2>
              <p className="legal-doc-text">{t(descriptionKey)}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
