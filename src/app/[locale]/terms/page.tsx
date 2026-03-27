import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { FadeLink } from '@/components/ui/FadeLink';

type Props = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Terms' });
    return {
        title: t('title'),
        description: t('description'),
    };
}

function TermsPageContent() {
    const t = useTranslations('Terms');

    return (
        <div className="legal-page">
            <article className="legal-document">
                <FadeLink href="/" className="legal-doc-back">
                    ← {t('backHome')}
                </FadeLink>
                <header className="legal-doc-header">
                    <h1 className="legal-doc-title">{t('title')}</h1>
                    <p className="legal-doc-meta">{t('lastUpdated', { date: '2026-03-27' })}</p>
                </header>

                <div className="legal-doc-body">
                    <section className="legal-doc-section">
                        <h2 className="legal-doc-heading">
                            <span className="legal-doc-num">{t('sectionNum', { n: 1 })}</span>{t('acceptanceTitle')}
                        </h2>
                        <p className="legal-doc-text">{t('acceptanceDescription')}</p>
                    </section>

                    <section className="legal-doc-section">
                        <h2 className="legal-doc-heading">
                            <span className="legal-doc-num">{t('sectionNum', { n: 2 })}</span>{t('useTitle')}
                        </h2>
                        <p className="legal-doc-text">{t('useDescription')}</p>
                    </section>

                    <section className="legal-doc-section">
                        <h2 className="legal-doc-heading">
                            <span className="legal-doc-num">{t('sectionNum', { n: 3 })}</span>{t('ipTitle')}
                        </h2>
                        <p className="legal-doc-text">{t('ipDescription')}</p>
                    </section>

                    <section className="legal-doc-section">
                        <h2 className="legal-doc-heading">
                            <span className="legal-doc-num">{t('sectionNum', { n: 4 })}</span>{t('disclaimerTitle')}
                        </h2>
                        <p className="legal-doc-text">{t('disclaimerDescription')}</p>
                    </section>

                    <section className="legal-doc-section">
                        <h2 className="legal-doc-heading">
                            <span className="legal-doc-num">{t('sectionNum', { n: 5 })}</span>{t('changesTitle')}
                        </h2>
                        <p className="legal-doc-text">{t('changesDescription')}</p>
                    </section>

                    <section className="legal-doc-section">
                        <h2 className="legal-doc-heading">
                            <span className="legal-doc-num">{t('sectionNum', { n: 6 })}</span>{t('contactTitle')}
                        </h2>
                        <p className="legal-doc-text">{t('contactDescription')}</p>
                    </section>

                    <section className="legal-doc-section">
                        <h2 className="legal-doc-heading">
                            <span className="legal-doc-num">{t('sectionNum', { n: 7 })}</span>{t('privacyTitle')}
                        </h2>
                        <p className="legal-doc-text">{t('privacyDescription')}</p>
                    </section>

                    <section className="legal-doc-section">
                        <h2 className="legal-doc-heading">
                            <span className="legal-doc-num">{t('sectionNum', { n: 8 })}</span>{t('governingTitle')}
                        </h2>
                        <p className="legal-doc-text">{t('governingDescription')}</p>
                    </section>
                </div>


            </article>
        </div>
    );
}

export default function TermsPage() {
    return <TermsPageContent />;
}
