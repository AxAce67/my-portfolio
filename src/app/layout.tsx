import type { Metadata } from 'next';
import Script from 'next/script';
import { cookies } from 'next/headers';
import { DEFAULT_OG_IMAGE_PATH, getSiteUrl } from '@/lib/seo';
import '@fontsource-variable/noto-sans-jp';
import './fonts.css';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: 'Aki Portfolio',
  description: 'Portfolio of indie developer Aki featuring web projects and development work.',
  applicationName: 'Aki Portfolio',
  authors: [{ name: 'Aki' }],
  creator: 'Aki',
  publisher: 'Aki',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Aki Portfolio',
    description: 'Portfolio of indie developer Aki featuring web projects and development work.',
    siteName: 'Aki Portfolio',
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: 'Aki Portfolio',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aki Portfolio',
    description: 'Portfolio of indie developer Aki featuring web projects and development work.',
    images: [DEFAULT_OG_IMAGE_PATH],
  },
};

function getThemeInitScript() {
  return `
(() => {
  try {
    const root = document.documentElement;
    const stored = localStorage.getItem('theme');
    const serverTheme = root.classList.contains('light') ? 'light' : root.classList.contains('dark') ? 'dark' : null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored === 'light' || stored === 'dark' ? stored : serverTheme || (prefersDark ? 'dark' : 'light');
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.dataset.theme = theme;
    document.cookie = 'theme=' + theme + '; Path=/; Max-Age=31536000; SameSite=Lax';
  } catch {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
  }
})();
`;
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get('theme')?.value;
  const initialTheme = cookieTheme === 'light' || cookieTheme === 'dark' ? cookieTheme : undefined;

  return (
    <html lang="ja" className={initialTheme} data-theme={initialTheme} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: getThemeInitScript() }} />
        {children}
      </body>
    </html>
  );
}
