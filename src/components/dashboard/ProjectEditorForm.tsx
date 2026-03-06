'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';

const BlockNoteEditorField = dynamic(
  () => import('@/components/dashboard/BlockNoteEditorField'),
  { ssr: false }
);

type ProjectEditorFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  initialValues?: {
    title?: string;
    description?: string;
    content_md?: string;
    content_json?: unknown;
    status?: string;
    is_published?: boolean;
    thumbnail_url?: string | null;
  };
};

const statusOptions = ['idea', 'design', 'development', 'completed', 'on_hold'] as const;

export default function ProjectEditorForm({
  action,
  submitLabel,
  initialValues,
}: ProjectEditorFormProps) {
  const t = useTranslations('Dashboard.editorForm');
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(initialValues?.thumbnail_url ?? null);
  const initialContentJson = useMemo(
    () => (Array.isArray(initialValues?.content_json) ? JSON.stringify(initialValues.content_json) : '[]'),
    [initialValues?.content_json]
  );
  const [contentMd, setContentMd] = useState(initialValues?.content_md ?? '');
  const [contentJson, setContentJson] = useState(initialContentJson);

  return (
    <form action={action} className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <input type="hidden" name="content_md" value={contentMd} />
      <input type="hidden" name="content_json" value={contentJson} />

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">{t('title')}</label>
          <input
            name="title"
            defaultValue={initialValues?.title ?? ''}
            required
            className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm"
            placeholder={t('titlePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">{t('description')}</label>
          <textarea
            name="description"
            defaultValue={initialValues?.description ?? ''}
            rows={3}
            className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm"
            placeholder={t('descriptionPlaceholder')}
          />
        </div>

        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-3 mb-2">
            <label className="block text-xs font-mono text-muted-foreground uppercase tracking-wider">{t('thumbnail')}</label>
            <span className="text-[11px] font-mono text-muted-foreground">{t('thumbnailHint')}</span>
          </div>
          <div className="w-full max-w-2xl rounded-xl border border-dashed border-border p-3 bg-muted/30 mb-3">
            {thumbnailPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailPreview}
                alt="Thumbnail preview"
                className="w-full aspect-video object-cover rounded-lg border border-border"
              />
            ) : (
              <div className="w-full aspect-video rounded-lg border border-border bg-muted flex items-center justify-center text-xs font-mono text-muted-foreground">
                {t('thumbnailPreview')}
              </div>
            )}
          </div>
          <input
            type="file"
            name="thumbnail"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-mono"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const objectUrl = URL.createObjectURL(file);
              setThumbnailPreview(objectUrl);
            }}
          />
          <p className="mt-2 text-[11px] font-mono text-muted-foreground">
            {t('thumbnailRecommended')} <code>1600x900</code> (16:9). {t('thumbnailSafeArea')} <code>1280x720</code>.
          </p>
        </div>

        <div>
          <label className="block text-xs font-mono text-muted-foreground mb-2 uppercase tracking-wider">{t('articleContent')}</label>
          <BlockNoteEditorField
            initialMarkdown={initialValues?.content_md ?? ''}
            initialContentJson={initialValues?.content_json}
            onContentChange={({ contentJson: nextContentJson, contentMd: nextContentMd }) => {
              setContentJson(nextContentJson);
              setContentMd(nextContentMd);
            }}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
          <select
            name="status"
            defaultValue={initialValues?.status ?? 'idea'}
            className="w-full sm:w-auto bg-transparent border border-border rounded-lg px-3 py-2 text-sm"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {t(`status.${status}` as 'status.idea')}
              </option>
            ))}
          </select>
          <label className="text-sm text-muted-foreground flex items-center gap-2">
            <input type="checkbox" name="is_published" defaultChecked={initialValues?.is_published ?? false} />
            {t('published')}
          </label>
          <button type="submit" className="btn-primary w-full sm:w-auto">{submitLabel}</button>
        </div>
      </div>
    </form>
  );
}
