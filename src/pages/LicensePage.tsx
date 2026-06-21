import { Link } from '@/i18n/routing';

const libraries = [
  { name: 'Next.js', license: 'MIT', url: 'https://github.com/vercel/next.js' },
  { name: 'React', license: 'MIT', url: 'https://github.com/facebook/react' },
  { name: 'Framer Motion', license: 'MIT', url: 'https://github.com/framer/motion' },
  { name: 'next-intl', license: 'MIT', url: 'https://github.com/amannn/next-intl' },
  { name: 'next-themes', license: 'MIT', url: 'https://github.com/pacocoursey/next-themes' },
  { name: 'next-view-transitions', license: 'MIT', url: 'https://github.com/shuding/next-view-transitions' },
  { name: 'Tailwind CSS', license: 'MIT', url: 'https://github.com/tailwindlabs/tailwindcss' },
  { name: 'Lucide Icons', license: 'ISC', url: 'https://github.com/lucide-icons/lucide' },
  { name: 'Sonner', license: 'MIT', url: 'https://github.com/emilkowalski/sonner' },
  { name: 'Appwrite', license: 'BSD-3-Clause', url: 'https://github.com/appwrite/sdk-for-web' },
  { name: 'BlockNote', license: 'MPL-2.0', url: 'https://github.com/TypeCellOS/BlockNote' },
  { name: 'Mantine', license: 'MIT', url: 'https://github.com/mantinedev/mantine' },
  { name: 'Geist', license: 'MIT', url: 'https://github.com/vercel/geist-font' },
];

export default function LicensePage() {
  return (
    <div className="legal-page">
      <div className="legal-document">
        {/* Back Link */}
        <Link href="/" className="legal-doc-back">
          ← トップへ戻る
        </Link>

        {/* Header */}
        <header className="legal-doc-header">
          <h1 className="legal-doc-title">ライセンス</h1>
          <p className="legal-doc-meta text-sm text-muted-foreground">
            このポートフォリオサイトのライセンス情報
          </p>
        </header>

        {/* Body */}
        <div className="legal-doc-body">
          <section className="legal-doc-section">
            <h2 className="legal-doc-heading">
              <span className="legal-doc-num">1．</span>コンテンツの著作権
            </h2>
            <p className="legal-doc-text">
              本サイトに掲載されているテキスト、写真、イラスト、デザイン、レイアウト、ロゴ、その他の創作物（以下「コンテンツ」）は、特に記載がない限り著作権者（Aki）に帰属します。コンテンツの無断複製・転載・改変・二次利用は禁止されています。個人的な参照・引用の場合は、出典として本サイトの URL を明記してください。商用利用を希望される場合は、事前にお問い合わせフォームよりご連絡ください。
            </p>
          </section>

          <section className="legal-doc-section">
            <h2 className="legal-doc-heading">
              <span className="legal-doc-num">2．</span>第三者ロゴ・商標
            </h2>
            <p className="legal-doc-text">
              本サイト内で使用している第三者サービス名、ロゴ、アイコン、商標等は、それぞれの権利者に帰属します。これらは識別・紹介目的でのみ使用しており、各ブランドのガイドラインや利用条件に従います。
            </p>
          </section>

          <section className="legal-doc-section">
            <h2 className="legal-doc-heading">
              <span className="legal-doc-num">3．</span>ソースコードのライセンス
            </h2>
            <p className="legal-doc-text">
              本サイトのソースコード（デザイン・実装・構成を含む）は、特に記載がない限り All Rights Reserved です。無断での複製・転用・改変・再配布は禁止されています。
            </p>
          </section>

          <section className="legal-doc-section">
            <h2 className="legal-doc-heading">
              <span className="legal-doc-num">4．</span>サードパーティライブラリ
            </h2>
            <p className="legal-doc-text">
              本サイトは以下のオープンソースライブラリおよびフレームワークを使用しています。各ライブラリはそれぞれ固有のライセンスに従っており、詳細は各リポジトリをご確認ください。これらのライブラリの著作権は、それぞれの開発者または組織に帰属します。
            </p>

            <table className="legal-doc-table">
              <thead>
                <tr>
                  <th>ライブラリ</th>
                  <th>ライセンス</th>
                  <th>ソース</th>
                </tr>
              </thead>
              <tbody>
                {libraries.map((lib) => (
                  <tr key={lib.name}>
                    <td>{lib.name}</td>
                    <td><code>{lib.license}</code></td>
                    <td>
                      <a
                        href={lib.url}
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
      </div>
    </div>
  );
}
