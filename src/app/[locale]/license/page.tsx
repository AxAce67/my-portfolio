import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { FadeLink } from '@/components/ui/FadeLink';

type Props = {
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'License' });
    return {
        title: t('title'),
        description: t('description'),
    };
}

const thirdPartyLibraries = [
    { name: 'Next.js', license: 'MIT', href: 'https://github.com/vercel/next.js' },
    { name: 'React', license: 'MIT', href: 'https://github.com/facebook/react' },
    { name: 'Framer Motion', license: 'MIT', href: 'https://github.com/framer/motion' },
    { name: 'next-intl', license: 'MIT', href: 'https://github.com/amannn/next-intl' },
    { name: 'next-themes', license: 'MIT', href: 'https://github.com/pacocoursey/next-themes' },
    { name: 'next-view-transitions', license: 'MIT', href: 'https://github.com/shuding/next-view-transitions' },
    { name: 'Tailwind CSS', license: 'MIT', href: 'https://github.com/tailwindlabs/tailwindcss' },
    { name: 'Lucide Icons', license: 'ISC', href: 'https://github.com/lucide-icons/lucide' },
    { name: 'Sonner', license: 'MIT', href: 'https://github.com/emilkowalski/sonner' },
    { name: '@supabase/supabase-js', license: 'MIT', href: 'https://github.com/supabase/supabase-js' },
    { name: 'BlockNote', license: 'MPL-2.0', href: 'https://github.com/TypeCellOS/BlockNote' },
    { name: 'Mantine', license: 'MIT', href: 'https://github.com/mantinedev/mantine' },
    { name: 'Geist', license: 'MIT', href: 'https://github.com/vercel/geist-font' },
];

function LicensePageContent() {
    const t = useTranslations('License');

    return (
        <div className="legal-page">
            <article className="legal-document">
                <FadeLink href="/" className="legal-doc-back">
                    ← {t('backHome')}
                </FadeLink>
                <header className="legal-doc-header">
                    <h1 className="legal-doc-title">{t('title')}</h1>
                    <p className="legal-doc-meta">{t('description')}</p>
                </header>

                <div className="legal-doc-body">
                    {/* Content Copyright */}
                    <section className="legal-doc-section">
                        <h2 className="legal-doc-heading">
                            <span className="legal-doc-num">1.</span>{t('contentTitle')}
                        </h2>
                        <p className="legal-doc-text">{t('contentDescription')}</p>
                    </section>

                    <section className="legal-doc-section">
                        <h2 className="legal-doc-heading">
                            <span className="legal-doc-num">2.</span>{t('brandTitle')}
                        </h2>
                        <p className="legal-doc-text">{t('brandDescription')}</p>
                    </section>

                    {/* Source Code */}
                    <section className="legal-doc-section">
                        <h2 className="legal-doc-heading">
                            <span className="legal-doc-num">3.</span>{t('sourceTitle')}
                        </h2>
                        <p className="legal-doc-text">{t('sourceDescription')}</p>
                    </section>

                    {/* Third-party */}
                    <section className="legal-doc-section">
                        <h2 className="legal-doc-heading">
                            <span className="legal-doc-num">4.</span>{t('thirdPartyTitle')}
                        </h2>
                        <p className="legal-doc-text">{t('thirdPartyDescription')}</p>
                        <table className="legal-doc-table">
                            <thead>
                                <tr>
                                    <th>{t('tableLibrary')}</th>
                                    <th>{t('tableLicense')}</th>
                                    <th>{t('tableSource')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {thirdPartyLibraries.map((lib) => (
                                    <tr key={lib.name}>
                                        <td>{lib.name}</td>
                                        <td><code>{lib.license}</code></td>
                                        <td>
                                            <a
                                                href={lib.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="legal-doc-link"
                                            >
                                                GitHub ↗
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                </div>

            </article>
        </div>
    );
}

export default function LicensePage() {
    return <LicensePageContent />;
}
