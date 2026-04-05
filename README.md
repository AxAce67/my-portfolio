# Akiz Portfolio

Next.js 15 / App Router ベースの多言語ポートフォリオサイトです。公開サイト、プロジェクト詳細、問い合わせフォーム、Supabase 管理画面を含みます。

## Setup

1. `.env.local.example` を元に `.env.local` を作成
2. 公開サイトに必要な環境変数を設定
3. 管理画面や監査ログを使う場合だけ `SUPABASE_SERVICE_ROLE_KEY` を追加
4. 依存関係をインストール
5. 開発サーバーを起動

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run perf:lighthouse
```

## Main Directories

- `src/app`: App Router のページ、レイアウト、API Route
- `src/components`: レイアウト、各セクション、UI コンポーネント
- `src/lib`: SEO、Supabase、セキュリティ、公開データ取得
- `messages`: `next-intl` の翻訳辞書

## Notes

- 公開コンテンツは Supabase から取得します
- 問い合わせフォームは Cloudflare Turnstile と Formspree を使用します
- `NEXT_PUBLIC_SITE_URL` は本番 URL に合わせて設定してください
- `SUPABASE_SERVICE_ROLE_KEY` は公開ページの表示には不要です
- 管理画面からの公開・更新・削除は即時に再検証されます
- アプリ外からDBを直接更新した場合でも、公開面のキャッシュは約30秒で更新されます
