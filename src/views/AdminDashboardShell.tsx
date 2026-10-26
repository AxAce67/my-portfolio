'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { account } from '@/lib/appwrite/client';
import { useSession } from '@/lib/auth/useSession';
import { useTranslations } from '@/hooks/useTranslations';
import { useLocale } from '@/hooks/useLocale';
import LoginForm from '@/components/auth/LoginForm';

const TABS = [
  { path: '', label: 'tabs.projects' },
  { path: '/active', label: 'tabs.activeProjects' },
  { path: '/profile', label: 'tabs.profile' },
  { path: '/links', label: 'tabs.mutualLinks' },
] as const;

const LEGACY_TABS: Record<string, string> = { projects: '', active: '/active', profile: '/profile', links: '/links' };

/**
 * Login check, heading and tab bar for /admin, /admin/active, /admin/profile
 * and /admin/links. It lives in the layout, so switching tabs keeps the
 * session and only swaps the content below.
 */
export default function AdminDashboardShell({ children }: { children: ReactNode }) {
  const t = useTranslations('Dashboard');
  const locale = useLocale();
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, refresh } = useSession();
  const base = `/${locale}/admin`;

  // Old links used /admin?tab=…
  const legacyTab = searchParams?.get('tab');
  useEffect(() => {
    if (legacyTab && legacyTab in LEGACY_TABS) router.replace(`${base}${LEGACY_TABS[legacyTab]}`);
  }, [base, legacyTab, router]);

  if (loading) return null;
  if (!user) return <LoginForm onSuccess={refresh} />;

  async function handleSignOut() {
    await account.deleteSession({ sessionId: 'current' });
    refresh();
  }

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-10 sm:pb-16 space-y-6 sm:space-y-8">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t('title')}</h1>
            <p className="text-sm text-muted-foreground mt-2">{t('subtitle')}</p>
          </div>
          <button type="button" onClick={handleSignOut} className="btn-outline w-full sm:w-auto px-3 py-2 text-xs">
            {t('signOut')}
          </button>
        </div>
        <nav className="mt-5 inline-flex w-full sm:w-auto rounded-xl border border-border p-1 bg-muted">
          {TABS.map((tab) => {
            const href = `${base}${tab.path}`;
            const current = pathname === href || (tab.path === '' && pathname === `${base}/`);
            return (
              <Link
                key={tab.path}
                href={href}
                scroll={false}
                aria-current={current ? 'page' : undefined}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-center text-xs font-mono transition-colors ${current ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t(tab.label)}
              </Link>
            );
          })}
        </nav>
      </div>

      {children}
    </section>
  );
}
