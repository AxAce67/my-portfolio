import { Link } from '@/i18n/routing';

export default function TermsPage() {
  return (
    <div className="legal-page">
      <div className="legal-document">
        {/* Back Link */}
        <Link href="/" className="legal-doc-back">
          ← トップへ戻る
        </Link>

        {/* Header */}
        <header className="legal-doc-header">
          <h1 className="legal-doc-title">利用規約</h1>
          <p className="legal-doc-meta text-sm text-muted-foreground">
            最終更新日：2026-03-27
          </p>
        </header>

        {/* Body */}
        <div className="legal-doc-body">
          <section className="legal-doc-section">
            <h2 className="legal-doc-heading">
              <span className="legal-doc-num">第1条</span>規約への同意
            </h2>
            <p className="legal-doc-text">
              本サイト（以下「当サイト」）にアクセスし、閲覧、利用することにより、利用者は本利用規約（以下「本規約」）のすべての条項に同意したものとみなされます。本規約に同意いただけない場合は、直ちに当サイトの利用を中止してください。本規約は、当サイトを利用するすべてのユーザーに適用されます。
            </p>
          </section>

          <section className="legal-doc-section">
            <h2 className="legal-doc-heading">
              <span className="legal-doc-num">第2条</span>サイトの利用
            </h2>
            <p className="legal-doc-text">
              当サイトは個人ポートフォリオとして公開されており、運営者のスキル、プロジェクト実績、技術情報などの情報提供を目的としています。掲載情報の正確性・最新性には努めていますが、その完全性・正確性・有用性を保証するものではありません。当サイトの利用にあたっては、以下の行為を禁止します。（1）当サイトの正常な運営を妨害する行為、（2）不正アクセスまたはそれを試みる行為、（3）他者になりすます行為、（4）当サイトのコンテンツを無断で商用利用する行為、（5）その他、法令または公序良俗に反する行為。
            </p>
          </section>

          <section className="legal-doc-section">
            <h2 className="legal-doc-heading">
              <span className="legal-doc-num">第3条</span>知的財産権
            </h2>
            <p className="legal-doc-text">
              当サイトのデザイン、テキスト、画像、ロゴ、アイコン、コード、その他すべてのコンテンツに関する知的財産権（著作権、商標権を含む）は、特に記載がない限り運営者に帰属します。これらのコンテンツを運営者の事前の書面による許諾なく、複製、改変、公衆送信、頒布、譲渡、貸与、翻訳、翻案その他の方法で利用することを禁止します。
            </p>
          </section>

          <section className="legal-doc-section">
            <h2 className="legal-doc-heading">
              <span className="legal-doc-num">第4条</span>免責事項
            </h2>
            <p className="legal-doc-text">
              当サイトの利用は利用者自身の責任において行われるものとし、当サイトの利用（利用不能を含む）により利用者または第三者に生じた損害について、運営者は一切の責任を負いません。当サイトからリンクされた外部サイトの内容・安全性・正確性について、運営者は一切保証せず、責任を負いません。また、当サイトは予告なくサービスの中断、変更、終了を行うことがあります。
            </p>
          </section>

          <section className="legal-doc-section">
            <h2 className="legal-doc-heading">
              <span className="legal-doc-num">第5条</span>規約の変更
            </h2>
            <p className="legal-doc-text">
              運営者は、必要に応じて本規約を予告なく改定することがあります。改定後の規約は、当サイトに掲載された時点で効力が生じます。重要な変更が行われた場合は、当サイト上で通知するよう努めますが、利用者は定期的に本規約を確認する責任を負います。改定後に当サイトを継続して利用した場合、利用者は改定後の規約に同意したものとみなされます。
            </p>
          </section>

          <section className="legal-doc-section">
            <h2 className="legal-doc-heading">
              <span className="legal-doc-num">第6条</span>お問い合わせ
            </h2>
            <p className="legal-doc-text">
              本規約に関するご質問・ご意見、またはコンテンツの利用許諾に関するお問い合わせは、当サイト内のお問い合わせフォームよりご連絡ください。お問い合わせ内容によっては、回答までにお時間をいただく場合があります。
            </p>
          </section>

          <section className="legal-doc-section">
            <h2 className="legal-doc-heading">
              <span className="legal-doc-num">第7条</span>個人情報の取扱い
            </h2>
            <p className="legal-doc-text">
              当サイトのお問い合わせフォームを通じて取得した氏名・メールアドレスなどの個人情報は、お問い合わせへの回答および連絡のみを目的として使用します。ご本人の同意なく第三者に提供することはありません。また、法令に基づく場合を除き、目的外での利用は行いません。
            </p>
          </section>

          <section className="legal-doc-section">
            <h2 className="legal-doc-heading">
              <span className="legal-doc-num">第8条</span>準拠法・管轄裁判所
            </h2>
            <p className="legal-doc-text">
              本規約の解釈および適用は、日本法に準拠するものとします。本規約に関する一切の紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
