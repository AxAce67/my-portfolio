import type { Metadata } from 'next';
import RequireAuth from '@/components/auth/RequireAuth';
import { getValidLocale } from '@/i18n/locales';
import { createPageMetadata } from '@/lib/metadata';
import NewProjectPage from '@/views/NewProjectPage';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return createPageMetadata(getValidLocale(locale), 'admin', '/admin/projects/new');
}

export default function Page() {
  return (
    <RequireAuth>
      <NewProjectPage />
    </RequireAuth>
  );
}
