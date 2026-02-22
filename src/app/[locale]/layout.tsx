import type { Metadata } from 'next';
import localFont from 'next/font/local';
import Script from 'next/script';
import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';
import { routing } from '@/i18n/routing';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AppToaster } from '@/components/ui/AppToaster';
import { buildLocalePath, DEFAULT_OG_IMAGE_PATH, getLocaleSeo, getSiteUrl } from '@/lib/seo';
import '../globals.css';

const inter = localFont({
    src: '../fonts/GeistVF.woff',
    variable: '--font-sans',
    display: 'swap',
    weight: '100 900',
});

const jetbrainsMono = localFont({
    src: '../fonts/GeistMonoVF.woff',
    variable: '--font-mono',
    display: 'swap',
    weight: '100 900',
});

type Props = {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale: rawLocale } = await params;
    const locale = (rawLocale === 'en' ? 'en' : 'ja') as 'ja' | 'en';
    const seo = getLocaleSeo(locale);
    const siteUrl = getSiteUrl();
    const canonical = buildLocalePath(locale);

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
                ja: buildLocalePath('ja'),
                en: buildLocalePath('en'),
            },
        },
        openGraph: {
            type: 'website',
            locale: locale === 'ja' ? 'ja_JP' : 'en_US',
            url: canonical,
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
    const nonce = (await cookies()).get('csp-nonce')?.value;

    // Validate locale
    if (!routing.locales.includes(locale as 'ja' | 'en')) {
        notFound();
    }

    const messages = await getMessages();

    return (
        <html lang={locale} suppressHydrationWarning>
            <head>
                <Script
                    src="/theme-init.js"
                    nonce={nonce}
                    strategy="beforeInteractive"
                    suppressHydrationWarning
                />
            </head>
            <body
                className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen`}
            >
                <ThemeProvider nonce={nonce}>
                    <NextIntlClientProvider messages={messages}>
                        <div className="relative z-10 flex flex-col min-h-screen">
                            <AppToaster />
                            <Header />
                            <main className="flex-1">{children}</main>
                            <Footer />
                        </div>
                    </NextIntlClientProvider>
                </ThemeProvider>
                <Analytics />
            </body>
        </html>
    );
}
