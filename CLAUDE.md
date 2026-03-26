# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build (run to check type errors)
npm run lint         # ESLint
npm run perf:lighthouse  # Lighthouse performance test
```

There are no automated tests. Verify changes by building (`npm run build`) to catch type errors before pushing.

## Architecture Overview

**Next.js 15 App Router** with locale-prefixed routing (`/ja/...`, `/en/...`). The root `/` redirects to `/ja` via `next.config.mjs`.

### Routing & i18n

- All pages live under `src/app/[locale]/`
- `next-intl` handles locale detection and message loading (`messages/ja.json`, `messages/en.json`)
- Use `next-intl/navigation` exports (`Link`, `redirect`, `useRouter`, `usePathname`) — never Next.js built-ins directly
- Middleware (`src/middleware.ts`) handles both locale routing and CSP headers

### Supabase Clients — Use the Right One

Four clients exist for different contexts:

| Client | File | Use When |
|--------|------|----------|
| Browser | `lib/supabase/client.ts` | Client components needing user auth |
| Server | `lib/supabase/server.ts` | Server components/actions needing user session |
| Public Server | `lib/supabase/public-server.ts` | Server reads with no auth (public data) |
| Admin | `lib/supabase/admin.ts` | Service role operations (bypasses RLS) |

### Data Fetching & Caching

Public data is fetched in `src/lib/content/publicContent.ts` using `unstable_cache()` with tag `'home-page-data'` and 300s revalidation.

After any mutating server action, invalidate with:
```typescript
revalidatePath('/', 'layout');   // clears ALL locales
revalidateTag('home-page-data'); // clears cached public data
```
**Do not** use locale-specific `revalidatePath('/ja/...')` — it misses other locales.

### Dashboard (Admin Area)

`src/app/[locale]/dashboard/page.tsx` is the admin hub with 3 tabs: **projects**, **active**, **audit**.

- Tab is read from `searchParams.tab`; only the active tab's data is fetched (tab-conditional queries) to keep load fast
- Server actions are in `src/app/[locale]/dashboard/actions.ts`
- Admin access is gated by `requireAdminUserId()` in `src/lib/auth/admin.ts`, which checks `portfolio_user_roles` table (fallback: `PORTFOLIO_ADMIN_USER_ID` env var)

### Content Storage

Projects store content in two fields:
- `content_json` — BlockNote JSON (source of truth, rendered by `src/components/content/BlockNoteContent.tsx`)
- `content_md` — Lossy markdown fallback

Article display in `src/app/[locale]/projects/[id]/page.tsx` prefers `content_json` when present. The `BlockNoteContent` server component handles all block types (headings, lists, tables, checkboxes, images, code blocks) without client-side JS.

### Styling

- Tailwind CSS with CSS custom properties (`--background`, `--foreground`, `--muted`, `--border`, etc.)
- Dark mode via `next-themes` (class strategy)
- **Tailwind Preflight resets heading and list styles** — add explicit CSS to `.article-content` in `globals.css` for rich text display
- Mantine components used in dashboard forms and modals (requires its CSS imported in `dashboard/layout.tsx`)

### Toast Notifications

`src/components/dashboard/ToastNotice.tsx` reads `?toast=` and `?toastAt=` from the URL. It uses `sessionStorage` to deduplicate toasts across page transitions (prevents double-firing when both edit page and dashboard render the component during redirect).

### Security

- CSP headers set in middleware, with violation reporting to `/api/security/csp-report`
- Auth actions are rate-limited and audit-logged to `auth_audit_logs` table
- Admin client bypasses RLS — use only for legitimate admin operations

## Key Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY     # Required for admin client
PORTFOLIO_ADMIN_USER_ID       # Fallback if roles table not used
```
