'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from '@/hooks/useTranslations';
import { useLocale } from '@/hooks/useLocale';
import { TransitionLink } from '@/components/ui/TransitionLink';
import ProjectDetailPage from '@/views/ProjectDetailPage';
import { getAdminProjectById } from '@/lib/content/adminContent';
import type { ProjectDetailResult } from '@/lib/content/publicContent';

// The published article layout, fed from the admin read so drafts can be
// checked before they go public.
export default function PreviewProjectPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const t = useTranslations('Dashboard.projects');
  const locale = useLocale();
  const [result, setResult] = useState<ProjectDetailResult | null>(null);

  useEffect(() => {
    if (!id) return;
    getAdminProjectById(id).then(
      (project) =>
        setResult(
          project
            ? {
                status: 'ok',
                project: {
                  id: project.id,
                  title: project.title,
                  description: project.description,
                  content_md: project.content_md,
                  content_json: project.content_json,
                  created_at: project.created_at,
                  updated_at: project.updated_at,
                  is_published: project.is_published,
                  thumbnail_url: project.thumbnail_url,
                  tags: project.tags,
                  kind: project.kind,
                  status: project.status,
                  service_url: project.service_url,
                },
              }
            : { status: 'not_found', project: null },
        ),
      () => setResult({ status: 'unavailable', project: null }),
    );
  }, [id]);

  return (
    <>
      <div className="sticky top-16 z-30 mx-auto mt-20 max-w-3xl px-4">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-700 dark:text-amber-300 backdrop-blur">
          <span>{t('previewNotice')}</span>
          <TransitionLink href={`/${locale}/admin/projects/${id}`} className="underline underline-offset-4 shrink-0">
            {t('backToEditor')}
          </TransitionLink>
        </div>
      </div>
      {result === null ? (
        <div className="min-h-[50vh] flex items-center justify-center text-sm text-muted-foreground">Loading…</div>
      ) : result.status === 'not_found' ? (
        <p className="py-20 text-center text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <ProjectDetailPage initialResult={result} />
      )}
    </>
  );
}
