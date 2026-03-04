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
    { name: 'Three.js', license: 'MIT', href: 'https://github.com/mrdoob/three.js' },
    { name: 'next-intl', license: 'MIT', href: 'https://github.com/amannn/next-intl' },
    { name: 'next-themes', license: 'MIT', href: 'https://github.com/pacocoursey/next-themes' },
    { name: 'Lucide Icons', license: 'ISC', href: 'https://github.com/lucide-icons/lucide' },
    { name: 'Tailwind CSS', license: 'MIT', href: 'https://github.com/tailwindlabs/tailwindcss' },
    { name: 'Sonner', license: 'MIT', href: 'https://github.com/emilkowalski/sonner' },
];

function LicensePageContent() {
    const t = useTranslations('License');

    return (
        <div className="legal-page">
            <PageTransitionIn />
            <article className="legal-document">
                <Link href="/" className="legal-doc-back">
                    ← {t('backHome')}
                </Link>
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

                    {/* Third-party */}
                    <section className="legal-doc-section">
                        <h2 className="legal-doc-heading">
                            <span className="legal-doc-num">2.</span>{t('thirdPartyTitle')}
                        </h2>
                        <p className="legal-doc-text">{t('thirdPartyDescription')}</p>
                        <table className="legal-doc-table">
                            <thead>
                                <tr>
                                    <th>Library</th>
                                    <th>License</th>
                                    <th>Source</th>
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
