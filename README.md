# Akiz Portfolio

個人ポートフォリオサイトのソースコードです。  
Next.js 15 / App Router をベースに、多言語対応、記事ページ、問い合わせフォーム、管理画面を含む構成で運用しています。

公開サイト:

- https://akiz.dev

## Overview

このリポジトリは、作品やプロフィールをまとめた公開用サイトです。  
単なる LP ではなく、次のような機能を持っています。

- 多言語切り替え
- プロジェクト一覧と詳細ページ
- 問い合わせフォーム
- Supabase を使ったコンテンツ管理
- 管理画面からの公開反映

## Stack

- Next.js 15
- React
- TypeScript
- Tailwind CSS
- next-intl
- Supabase
- Framer Motion
- Cloudflare Turnstile

## Features

- プロジェクトカードから詳細への shared element transition
- 日本語 / English を含む多言語 UI
- SEO / OGP / sitemap 対応
- 公開面と管理画面を同一リポジトリで管理
- モバイル表示と遷移体験の最適化

## Notes

- このリポジトリは主に自分用・公開用です
- 環境変数や外部サービス設定があるため、そのまま clone しても完全には動きません
- `SUPABASE_SERVICE_ROLE_KEY` は公開ページの表示には不要で、管理系用途のみです

## Local Development

必要最小限のローカル実行手順です。

```bash
npm install
npm run dev
```

必要に応じて `.env.local.example` を元に `.env.local` を作成してください。

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```
