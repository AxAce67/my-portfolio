import type { Metadata } from 'next';
import RequireAuth from '@/components/auth/RequireAuth';
import { getValidLocale } from '@/i18n/locales';
import { createPageMetadata } from '@/lib/metadata';
import PreviewProjectPage from '@/views/PreviewProjectPage';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  return { ...createPageMetadata(getValidLocale(locale), 'admin', `/admin/projects/${id}/preview`), robots: { index: false } };
}

export default function Page() {
  return (
    <RequireAuth>
      <PreviewProjectPage />
    </RequireAuth>
  );
}
