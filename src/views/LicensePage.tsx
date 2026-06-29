'use client';

import { Link } from '@/i18n/routing';
import { useTranslations } from '@/hooks/useTranslations';

const libraries = [
  { name: 'React', license: 'MIT', url: 'https://github.com/facebook/react' },
  { name: 'React Router', license: 'MIT', url: 'https://github.com/remix-run/react-router' },
  { name: 'Next.js', license: 'MIT', url: 'https://github.com/vercel/next.js' },
  { name: 'i18next', license: 'MIT', url: 'https://github.com/i18next/i18next' },
  { name: 'Framer Motion', license: 'MIT', url: 'https://github.com/motiondivision/motion' },
  { name: 'Tailwind CSS', license: 'MIT', url: 'https://github.com/tailwindlabs/tailwindcss' },
  { name: 'Lucide Icons', license: 'ISC', url: 'https://github.com/lucide-icons/lucide' },
  { name: 'Sonner', license: 'MIT', url: 'https://github.com/emilkowalski/sonner' },
  { name: 'Appwrite SDK', license: 'BSD-3-Clause', url: 'https://github.com/appwrite/sdk-for-web' },
  { name: 'BlockNote', license: 'MPL-2.0', url: 'https://github.com/TypeCellOS/BlockNote' },
  { name: 'Mantine', license: 'MIT', url: 'https://github.com/mantinedev/mantine' },
  { name: 'dnd kit', license: 'MIT', url: 'https://github.com/clauderic/dnd-kit' },
  { name: 'react-easy-crop', license: 'MIT', url: 'https://github.com/ValentinH/react-easy-crop' },
  { name: 'COBE', license: 'MIT', url: 'https://github.com/shuding/cobe' },
  { name: 'Geist', license: 'OFL-1.1', url: 'https://github.com/vercel/geist-font' },
  { name: 'Noto Sans JP', license: 'OFL-1.1', url: 'https://github.com/notofonts/noto-cjk' },
];

export default function LicensePage() {
  const t = useTranslations('License');
  const sections = [
    ['contentTitle', 'contentDescription'],
    ['brandTitle', 'brandDescription'],
    ['sourceTitle', 'sourceDescription'],
  ] as const;

  return (
    <div className="legal-page">
      <div className="legal-document">
        <Link href="/" className="legal-doc-back">
          ← {t('backHome')}
        </Link>

        <header className="legal-doc-header">
          <h1 className="legal-doc-title">{t('title')}</h1>
          <p className="legal-doc-meta text-sm text-muted-foreground">{t('description')}</p>
        </header>

        <div className="legal-doc-body">
          {sections.map(([titleKey, descriptionKey], index) => (
            <section className="legal-doc-section" key={titleKey}>
              <h2 className="legal-doc-heading">
                <span className="legal-doc-num">{index + 1}.</span>
                {t(titleKey)}
              </h2>
              <p className="legal-doc-text">{t(descriptionKey)}</p>
            </section>
          ))}

          <section className="legal-doc-section">
            <h2 className="legal-doc-heading">
              <span className="legal-doc-num">4.</span>
              {t('thirdPartyTitle')}
            </h2>
            <p className="legal-doc-text">{t('thirdPartyDescription')}</p>

            <div className="overflow-x-auto">
              <table className="legal-doc-table">
                <thead>
                  <tr>
                    <th>{t('tableLibrary')}</th>
                    <th>{t('tableLicense')}</th>
                    <th>{t('tableSource')}</th>
                  </tr>
                </thead>
                <tbody>
                  {libraries.map((lib) => (
                    <tr key={lib.name}>
                      <td>{lib.name}</td>
                      <td><code>{lib.license}</code></td>
                      <td>
                        <a href={lib.url} target="_blank" rel="noopener noreferrer" className="legal-doc-link">
                          GitHub ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
