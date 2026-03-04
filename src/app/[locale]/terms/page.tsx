import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { Link } from '@/i18n/routing';
import { PageTransitionIn } from '@/components/ui/PageTransitionIn';

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
            <PageTransitionIn />
            <article className="legal-document">
                <Link href="/" className="legal-doc-back">
                    ← {t('backHome')}
                </Link>
                <header className="legal-doc-header">
                    <h1 className="legal-doc-title">{t('title')}</h1>
                    <p className="legal-doc-meta">{t('lastUpdated', { date: '2026-02-26' })}</p>
                </header>

                <div className="legal-doc-body">
                    <section className="legal-doc-section">
                        <h2 className="legal-doc-heading">
                            <span className="legal-doc-num">第1条</span>{t('acceptanceTitle')}
                        </h2>
                        <p className="legal-doc-text">{t('acceptanceDescription')}</p>
                    </section>

                    <section className="legal-doc-section">
                        <h2 className="legal-doc-heading">
                            <span className="legal-doc-num">第2条</span>{t('useTitle')}
                        </h2>
                        <p className="legal-doc-text">{t('useDescription')}</p>
                    </section>

                    <section className="legal-doc-section">
                        <h2 className="legal-doc-heading">
                            <span className="legal-doc-num">第3条</span>{t('ipTitle')}
                        </h2>
                        <p className="legal-doc-text">{t('ipDescription')}</p>
                    </section>

                    <section className="legal-doc-section">
                        <h2 className="legal-doc-heading">
                            <span className="legal-doc-num">第4条</span>{t('disclaimerTitle')}
                        </h2>
                        <p className="legal-doc-text">{t('disclaimerDescription')}</p>
                    </section>

                    <section className="legal-doc-section">
                        <h2 className="legal-doc-heading">
                            <span className="legal-doc-num">第5条</span>{t('changesTitle')}
                        </h2>
                        <p className="legal-doc-text">{t('changesDescription')}</p>
                    </section>

                    <section className="legal-doc-section">
                        <h2 className="legal-doc-heading">
                            <span className="legal-doc-num">第6条</span>{t('contactTitle')}
                        </h2>
                        <p className="legal-doc-text">{t('contactDescription')}</p>
                    </section>
                </div>


            </article>
        </div>
    );
}

export default function TermsPage() {
    return <TermsPageContent />;
}
