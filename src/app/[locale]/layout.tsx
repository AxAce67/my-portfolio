import { notFound } from 'next/navigation';
import ClientShell from './ClientShell';
import { isAppLocale, locales, type AppLocale } from '@/i18n/locales';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isAppLocale(locale)) notFound();

  return <ClientShell locale={locale as AppLocale}>{children}</ClientShell>;
}
