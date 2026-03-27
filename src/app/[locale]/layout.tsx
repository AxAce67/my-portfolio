import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ViewTransitions } from 'next-view-transitions';
import { routing } from '@/i18n/routing';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AppToaster } from '@/components/ui/AppToaster';
import { PageTransitionIn } from '@/components/ui/PageTransitionIn';
import { buildLocalePath, buildLocaleUrl, DEFAULT_OG_IMAGE_PATH, getLocaleSeo, getSiteUrl } from '@/lib/seo';
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
    const locale = (rawLocale === 'en' ? 'en' : 'ja') as 'ja' | 'en';
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
            languages: {
                ja: buildLocaleUrl('ja'),
                en: buildLocaleUrl('en'),
            },
        },
        openGraph: {
            type: 'website',
            locale: locale === 'ja' ? 'ja_JP' : 'en_US',
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

    // Validate locale
    if (!routing.locales.includes(locale as 'ja' | 'en')) {
        notFound();
    }

    const validLocale = (locale === 'en' ? 'en' : 'ja') as 'ja' | 'en';
    const seo = getLocaleSeo(validLocale);
    const messages = await getMessages();
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercelRuntime = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

    return (
        <ViewTransitions>
        <html lang={locale} suppressHydrationWarning>
            <head>
                <meta name="description" content={seo.homeDescription} />
                <Script
                    id="theme-init"
                    strategy="beforeInteractive"
                    dangerouslySetInnerHTML={{
                        __html: "(()=>{let t='light';try{const s=localStorage.getItem('theme');const d=window.matchMedia('(prefers-color-scheme: dark)').matches;t=s==='light'||s==='dark'?s:(d?'dark':'light');const r=document.documentElement;r.classList.remove('light','dark');r.classList.add(t);}catch{const d=window.matchMedia('(prefers-color-scheme: dark)').matches;t=d?'dark':'light';document.documentElement.classList.add(t);}const bg=t==='dark'?'rgba(10,10,10,0.75)':'rgba(255,255,255,0.75)';const o=document.createElement('div');o.id='__page-fade-overlay__';o.style.cssText='position:fixed;inset:0;background:'+bg+';backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);z-index:99999;opacity:1;pointer-events:all';document.documentElement.appendChild(o);})();",
                    }}
                />
            </head>
            <body
                className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen`}
            >
                <ThemeProvider>
                    <NextIntlClientProvider messages={messages}>
                        <div className="relative z-10 flex flex-col min-h-screen">
                            <AppToaster />
                            <PageTransitionIn />
                            <Header />
                            <main className="flex-1">{children}</main>
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
