# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # tsc typecheck + production build
npm run lint         # ESLint (flat config, eslint.config.js)
npm run preview      # Preview the production build locally
```

There are no automated tests. Verify changes by building (`npm run build`) to catch type errors before pushing.

## Architecture Overview

**Vite + React SPA** (no SSR, no Next.js). Client-side routing via `react-router-dom`, locale-prefixed (`/ja/...`, `/en/...`). The root `/` redirects to `/ja` (see `src/App.tsx`).

### Routing & i18n

- All pages live under `src/pages/`, wired up in `src/App.tsx`
- i18n is `react-i18next` (NOT next-intl, despite some leftover compat-shim naming) — messages live in `messages/*.json` (8 locales), loaded in `src/i18n/config.ts`
- `useTranslations(namespace)` (`src/hooks/useTranslations.ts`) is a thin wrapper that also supports next-intl-style dotted sub-namespaces (e.g. `useTranslations('Dashboard.active')`) by splitting off the root namespace and prefixing keys — react-i18next's own namespace arg does NOT walk dotted paths, so don't bypass this hook
- Interpolation uses single-brace `{var}` placeholders (configured in `src/i18n/config.ts`), not i18next's default `{{var}}` — matches the existing message files
- `src/shims/` contains compat shims for old Next.js imports (`next/image`, `next/link`, etc.) still referenced by ported components — see `vite.config.ts` aliases

### Appwrite

Single Appwrite project, no SSR — all calls happen directly from the browser.

- `src/lib/appwrite/client.ts` exports `tablesDB`, `account`, `storage`, plus hardcoded IDs: `DATABASE_ID` (`portfolio`), `PROJECTS_TABLE_ID`, `ACTIVE_PROJECTS_TABLE_ID`, `ASSETS_BUCKET_ID` (`portfolio-assets`)
- Public read: `src/lib/content/publicContent.ts` — read-only queries, `is_published`/`status` filtered, no auth required (table permission `read("any")`)
- Admin read/write: `src/lib/content/adminContent.ts` — full CRUD, requires an authenticated Appwrite session (table permissions `create`/`update`/`delete` scoped to `Role.users()`)
- Self-hosted Appwrite instance — when adding a new deploy target/domain, it must be registered as a Web Platform in the Appwrite console (Project > Overview > Platforms) or browser requests get a 403 `Invalid Origin`

### Admin Area (`/admin`)

Single route serves both login and dashboard — `src/pages/AdminPage.tsx` checks the session (`useSession` hook) and renders `LoginForm` or `DashboardPage` accordingly. No separate `/login` route.

- Auth: Appwrite Account API (`account.createEmailPasswordSession`), single/few admin users created manually via the Appwrite console — there is no public signup
- `RequireAuth` (`src/components/auth/RequireAuth.tsx`) gates `/admin/projects/new` and `/admin/projects/:id`, redirecting to `/admin` if unauthenticated
- `DashboardPage` has 2 tabs (projects, active) — no audit-log tab (that depended on Supabase-only rate-limit/audit infra that no longer exists)
- `ProjectEditorForm` mirrors the live article page's typography (`.article-content`) so editing looks like the published result. It autosaves a draft to `localStorage` (debounced) and warns on unsaved navigation/tab-close
- Thumbnails go through a crop step (`react-easy-crop`, locked 16:9) before upload
- Active Projects use `@dnd-kit` for drag-to-reorder (no manual priority field — `display_order` is set automatically)
- Admin pages/components are lazy-loaded (`React.lazy` in `App.tsx`) so BlockNote/Mantine/dnd-kit never ship to public visitors

### Content Storage

Projects store content in two fields:
- `content_json` — BlockNote JSON (source of truth, stored as a JSON **string** column in Appwrite; parse with `parseContentJson` from `publicContent.ts`)
- `content_md` — lossy markdown fallback

Article display (`src/pages/ProjectDetailPage.tsx`) prefers `content_json` when present, rendered by `src/components/content/BlockNoteContent.tsx`.

**Storage cleanup**: deleting a project (`deleteProject`) walks `content_json` (including nested block `children`) to find every uploaded file URL and deletes them from the `portfolio-assets` bucket, plus the thumbnail. Replacing a thumbnail on update also deletes the old file. This is all best-effort (failures don't block the row delete/update). Known gap: removing an inline image from the article body without deleting the whole project does **not** clean up that file — it becomes an orphan in storage.

### Styling

- Tailwind CSS with CSS custom properties (`--background`, `--foreground`, `--muted`, `--border`, etc.)
- Dark mode via a local `ThemeProvider` shim (`src/components/providers/ThemeProvider.tsx`), not the `next-themes` package
- **Tailwind Preflight resets heading and list styles** — `.article-content` in `globals.css` carries the typography for rendered/edited article content (also used directly by the admin editor — see above)
- Mantine + BlockNote CSS imported directly in the admin pages that need them (`NewProjectPage.tsx`/`EditProjectPage.tsx`), not globally

### Removed vs. the old Next.js version

No CSP middleware, no CSP violation reporting endpoint, no login rate-limiting, no auth audit log table — all of that was Supabase/Next.js-server-specific and was not rebuilt when this became a static SPA. Don't assume any backend-side request gate exists; Appwrite's own permission rules are the only enforcement.

## Key Environment Variables

```
VITE_APPWRITE_ENDPOINT
VITE_APPWRITE_PROJECT_ID
NEXT_PUBLIC_SITE_URL          # SEO/OGP base URL fallback (legacy name, read via vite.config.ts define)
```

See `.env.example` for the full list (contact form, GitHub activity card, Tailscale status).
