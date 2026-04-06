import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ViewTransitions } from 'next-view-transitions';
import { getLocaleMeta, getValidLocale, isAppLocale, routing } from '@/i18n/routing';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AppToaster } from '@/components/ui/AppToaster';
import { MobilePageMotion } from '@/components/ui/MobilePageMotion';
import { buildLocalePath, buildLocaleUrl, buildLocaleUrlAlternates, DEFAULT_OG_IMAGE_PATH, getLocaleSeo, getOpenGraphLocale, getSiteUrl } from '@/lib/seo';
import '../globals.css';

const inter = localFont({
    src: '../fonts/GeistVF.woff',
    variable: '--font-sans',
    display: 'optional',
    weight: '100 900',
});

const jetbrainsMono = localFont({
    src: '../fonts/GeistMonoVF.woff',
    variable: '--font-mono',
    display: 'optional',
    weight: '100 900',
});

type Props = {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale: rawLocale } = await params;
    const locale = getValidLocale(rawLocale);
    const seo = getLocaleSeo(locale);
    const siteUrl = getSiteUrl();
    const canonicalPath = buildLocalePath(locale);
    const canonical = buildLocaleUrl(locale);

    return {
        metadataBase: new URL(siteUrl),
        title: {
            default: seo.homeTitle,
            template: '%s | Akiz.',
        },
        description: seo.homeDescription,
        alternates: {
            canonical,
            languages: buildLocaleUrlAlternates(),
        },
        openGraph: {
            type: 'website',
            locale: getOpenGraphLocale(locale),
            url: canonicalPath,
            title: seo.homeTitle,
            description: seo.homeDescription,
            siteName: seo.siteName,
            images: [{ url: DEFAULT_OG_IMAGE_PATH, width: 1200, height: 630 }],
        },
        twitter: {
            card: 'summary_large_image',
            title: seo.homeTitle,
            description: seo.homeDescription,
            images: [DEFAULT_OG_IMAGE_PATH],
        },
        icons: {
            icon: [{ url: '/icon.png', type: 'image/png' }],
            apple: [{ url: '/icon.png', type: 'image/png' }],
        },
    };
}

export default async function LocaleLayout({ children, params }: Props) {
    const { locale } = await params;

    if (!isAppLocale(locale)) {
        notFound();
    }

    const validLocale = locale;
    const messages = await getMessages();
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercelRuntime = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
    const skipToContentLabel = getLocaleMeta(validLocale).skipToContentLabel;

    return (
        <ViewTransitions>
        <html lang={locale} suppressHydrationWarning>
            <head>
                <Script
                    id="theme-init"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{
                        __html: "(()=>{let t='light';try{const s=localStorage.getItem('theme');const d=window.matchMedia('(prefers-color-scheme: dark)').matches;t=s==='light'||s==='dark'?s:(d?'dark':'light');const r=document.documentElement;r.classList.remove('light','dark');r.classList.add(t);}catch{const d=window.matchMedia('(prefers-color-scheme: dark)').matches;t=d?'dark':'light';document.documentElement.classList.add(t);}})();",
                    }}
                />
            </head>
            <body
                className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen`}
            >
                <ThemeProvider>
                    <NextIntlClientProvider messages={messages}>
                        <div className="app-shell relative z-10 flex flex-col min-h-screen">
                            <AppToaster />
                            <a href="#main-content" className="skip-link">
                                {skipToContentLabel}
                            </a>
                            <Header />
                            <main id="main-content" className="flex-1">
                                <MobilePageMotion>{children}</MobilePageMotion>
                            </main>
                            <Footer />
                        </div>
                    </NextIntlClientProvider>
                </ThemeProvider>
                {isProduction && isVercelRuntime ? (
                    <>
                        <Analytics />
                        <SpeedInsights />
                    </>
                ) : null}
            </body>
        </html>
        </ViewTransitions>
    );
}
