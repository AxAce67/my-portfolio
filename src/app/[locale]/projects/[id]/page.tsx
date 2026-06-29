import type { Metadata } from 'next';
import { getValidLocale } from '@/i18n/locales';
import { createPageMetadata } from '@/lib/metadata';
import ProjectDetailPage from '@/views/ProjectDetailPage';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  return createPageMetadata(getValidLocale(locale), 'projectDetail', `/projects/${id}`);
}

export default function Page() {
  return <ProjectDetailPage />;
}
