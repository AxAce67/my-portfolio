import type { Metadata } from 'next';
import { getValidLocale } from '@/i18n/locales';
import { createPageMetadata } from '@/lib/metadata';
import TermsPage from '@/views/TermsPage';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return createPageMetadata(getValidLocale(locale), 'terms');
}

export default function Page() {
  return <TermsPage />;
}
