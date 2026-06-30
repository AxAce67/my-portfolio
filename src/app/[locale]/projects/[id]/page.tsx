import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProjectById } from '@/lib/content/publicContent';
import { getValidLocale } from '@/i18n/locales';
import { createPageMetadata, createProjectMetadata } from '@/lib/metadata';
import { createProjectJsonLd, serializeJsonLd } from '@/lib/structuredData';
import ProjectDetailPage from '@/views/ProjectDetailPage';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const appLocale = getValidLocale(locale);
  const result = await getProjectById(id);

  if (result.status !== 'ok') {
    return createPageMetadata(appLocale, 'projectDetail', `/projects/${id}`);
  }

  return createProjectMetadata(appLocale, result.project, `/projects/${id}`);
}

export default async function Page({ params }: Props) {
  const { locale, id } = await params;
  const appLocale = getValidLocale(locale);
  const result = await getProjectById(id);

  if (result.status === 'not_found') notFound();

  return (
    <>
      {result.status === 'ok' ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(createProjectJsonLd(appLocale, result.project)) }}
        />
      ) : null}
      <ProjectDetailPage initialResult={result} />
    </>
  );
}
