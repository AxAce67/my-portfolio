import type { Metadata } from 'next';
import RequireAuth from '@/components/auth/RequireAuth';
import { getValidLocale } from '@/i18n/locales';
import { createPageMetadata } from '@/lib/metadata';
import EditProjectPage from '@/views/EditProjectPage';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  return createPageMetadata(getValidLocale(locale), 'admin', `/admin/projects/${id}`);
}

export default function Page() {
  return (
    <RequireAuth>
      <EditProjectPage />
    </RequireAuth>
  );
}
