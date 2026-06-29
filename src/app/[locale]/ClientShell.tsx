'use client';

import { type ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AppToaster } from '@/components/ui/AppToaster';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { SeoManager } from '@/components/seo/SeoManager';
import { getLocaleMeta, type AppLocale } from '@/i18n/routing';
import { LocaleProvider, useAppLocale } from '@/i18n/LocaleProvider';

type Props = {
  children: ReactNode;
  locale: AppLocale;
};

export default function ClientShell({ children, locale }: Props) {
  return (
    <LocaleProvider initialLocale={locale}>
      <ClientShellContent>{children}</ClientShellContent>
    </LocaleProvider>
  );
}

function ClientShellContent({ children }: Pick<Props, 'children'>) {
  const locale = useAppLocale();
  return (
    <ThemeProvider>
      <ScrollToTop />
      <SeoManager />
      <div className="flex min-h-screen flex-col">
        <a href="#main-content" className="skip-link">
          {getLocaleMeta(locale).skipToContentLabel}
        </a>
        <Header />
        <main id="main-content" tabIndex={-1} className="flex-1 relative z-10 w-full bg-[var(--background)]">
          {children}
        </main>
        <Footer />
      </div>
      <AppToaster />
    </ThemeProvider>
  );
}
