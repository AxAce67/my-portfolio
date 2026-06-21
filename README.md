# Akiz Portfolio

個人ポートフォリオサイトのソースコードです。  
Vite + React (SPA) をベースに、多言語対応、記事ページ、問い合わせフォーム、管理画面を含む構成で運用しています。

公開サイト:

- https://aki.quest

## Overview

このリポジトリは、作品やプロフィールをまとめた公開用サイトです。  
単なる LP ではなく、次のような機能を持っています。

- 多言語切り替え
- プロジェクト一覧と詳細ページ
- 問い合わせフォーム
- Appwrite を使ったコンテンツ管理
- 管理画面からの公開反映

## Stack

- Vite
- React + React Router
- TypeScript
- Tailwind CSS
- react-i18next
- Appwrite
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
- Appwrite のプロジェクト ID / エンドポイントは公開向けの値で、書き込み権限はありません

## Local Development

必要最小限のローカル実行手順です。

```bash
npm install
npm run dev
```

必要に応じて `.env.example` を元に `.env.local` を作成してください。

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```
