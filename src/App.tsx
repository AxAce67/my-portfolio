import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import HomePage from './pages/HomePage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ServersPage from './pages/ServersPage';
import TermsPage from './pages/TermsPage';
import LicensePage from './pages/LicensePage';
import NotFoundPage from './pages/NotFoundPage';
import RequireAuth from '@/components/auth/RequireAuth';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { AppToaster } from './components/ui/AppToaster';
import { ScrollToTop } from './components/ui/ScrollToTop';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { defaultLocale, isAppLocale } from '@/i18n/routing';

// Admin-only pages pull in BlockNote/Mantine — lazy-load so public
// visitors never download that weight.
const AdminPage = lazy(() => import('./pages/AdminPage'));
const NewProjectPage = lazy(() => import('./pages/NewProjectPage'));
const EditProjectPage = lazy(() => import('./pages/EditProjectPage'));

function LocaleWrapper({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const { pathname } = useLocation();
  const segment = pathname.split('/')[1] ?? '';
  const locale = isAppLocale(segment) ? segment : defaultLocale;

  useEffect(() => {
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
    // index.html hardcodes lang="ja" — keep it in sync with the actual
    // locale so :lang(ja) CSS (and screen readers/SEO) reflect reality.
    document.documentElement.lang = locale;
  }, [locale, i18n]);

  return <>{children}</>;
}

// Gates the nested locale routes — `:locale` matches any single segment, so
// without this, a bogus path like "/foobar" would silently render the
// homepage (treating "foobar" as an unrecognized locale that falls back to
// the default) instead of a 404.
function LocaleGate() {
  const { pathname } = useLocation();
  const segment = pathname.split('/')[1] ?? '';
  if (!isAppLocale(segment)) {
    return <NotFoundPage />;
  }
  return <Outlet />;
}

function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 relative z-10 w-full bg-[var(--background)]">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        <LocaleWrapper>
          <Routes>
            <Route path="/" element={<Navigate to="/ja" replace />} />
            <Route path="/admin" element={<Navigate to={`/${defaultLocale}/admin`} replace />} />
            <Route path="/:locale" element={<Layout />}>
              <Route element={<LocaleGate />}>
                <Route index element={<HomePage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="projects/:id" element={<ProjectDetailPage />} />
                <Route path="servers" element={<ServersPage />} />
                <Route path="terms" element={<TermsPage />} />
                <Route path="license" element={<LicensePage />} />
                <Route
                  path="admin"
                  element={
                    <Suspense fallback={null}>
                      <AdminPage />
                    </Suspense>
                  }
                />
                <Route element={<RequireAuth />}>
                  <Route
                    path="admin/projects/new"
                    element={
                      <Suspense fallback={null}>
                        <NewProjectPage />
                      </Suspense>
                    }
                  />
                  <Route
                    path="admin/projects/:id"
                    element={
                      <Suspense fallback={null}>
                        <EditProjectPage />
                      </Suspense>
                    }
                  />
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Layout />}>
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </LocaleWrapper>
        <AppToaster />
      </BrowserRouter>
    </ThemeProvider>
  );
}
