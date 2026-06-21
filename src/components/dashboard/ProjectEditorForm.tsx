import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { useLocale } from '@/hooks/useLocale';
import { areSameCalendarDate, formatLocaleDate } from '@/lib/dates';
import { uploadImage, UploadValidationError } from '@/lib/appwrite/upload';
import type { ProjectInput, ProjectStatus } from '@/lib/content/adminContent';
import BlockNoteEditorField from './BlockNoteEditorField';
import ThumbnailCropModal from './ThumbnailCropModal';

type ProjectEditorFormProps = {
  draftKey: string;
  submitLabel: string;
  onSubmit: (input: ProjectInput) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
  initialValues?: {
    title?: string;
    description?: string;
    content_md?: string;
    content_json?: unknown;
    status?: ProjectStatus;
    is_published?: boolean;
    thumbnail_url?: string | null;
    created_at?: string;
    updated_at?: string;
  };
};

type DraftState = {
  title: string;
  description: string;
  content_md: string;
  content_json: unknown;
  status: ProjectStatus;
  is_published: boolean;
};

const statusOptions: ProjectStatus[] = ['idea', 'design', 'development', 'completed', 'on_hold'];

function draftStorageKey(draftKey: string) {
  return `portfolio-admin-draft:${draftKey}`;
}

export default function ProjectEditorForm({ draftKey, submitLabel, onSubmit, onDirtyChange, initialValues }: ProjectEditorFormProps) {
  const t = useTranslations('Dashboard.editorForm');
  const tDetail = useTranslations('ProjectDetail');
  const locale = useLocale();
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [status, setStatus] = useState<ProjectStatus>(initialValues?.status ?? 'idea');
  const [isPublished, setIsPublished] = useState(initialValues?.is_published ?? false);
  const [contentMd, setContentMd] = useState(initialValues?.content_md ?? '');
  const [contentJson, setContentJson] = useState<unknown>(initialValues?.content_json ?? []);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(initialValues?.thumbnail_url ?? null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<DraftState | null>(null);
  const isDirtyRef = useRef(false);
  const hasMountedRef = useRef(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the description to exactly fit its content, like the <p> tag
  // the published page renders — a fixed `rows` count leaves a gap when the
  // text is shorter than that.
  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [description]);

  // Offer to restore a draft left over from a tab close / crash before the
  // user ever saved.
  useEffect(() => {
    const raw = localStorage.getItem(draftStorageKey(draftKey));
    if (raw) {
      try {
        setPendingDraft(JSON.parse(raw));
      } catch {
        localStorage.removeItem(draftStorageKey(draftKey));
      }
    }
  }, [draftKey]);

  // Debounced autosave of the current field state to localStorage.
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    isDirtyRef.current = true;
    onDirtyChange?.(true);

    const timeoutId = window.setTimeout(() => {
      const draft: DraftState = { title, description, content_md: contentMd, content_json: contentJson, status, is_published: isPublished };
      localStorage.setItem(draftStorageKey(draftKey), JSON.stringify(draft));
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [draftKey, title, description, contentMd, contentJson, status, isPublished, onDirtyChange]);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirtyRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  function applyDraft(draft: DraftState) {
    setTitle(draft.title);
    setDescription(draft.description);
    setContentMd(draft.content_md);
    setContentJson(draft.content_json);
    setStatus(draft.status);
    setIsPublished(draft.is_published);
    setPendingDraft(null);
  }

  function discardDraft() {
    localStorage.removeItem(draftStorageKey(draftKey));
    setPendingDraft(null);
  }

  function handleThumbnailSelect(file: File | undefined) {
    if (!file) return;
    setThumbnailError(null);
    setCropSrc(URL.createObjectURL(file));
  }

  function handleCropConfirm(croppedFile: File) {
    setThumbnailFile(croppedFile);
    setThumbnailPreview(URL.createObjectURL(croppedFile));
    setCropSrc(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      let thumbnailUrl: string | undefined;
      if (thumbnailFile) {
        try {
          thumbnailUrl = await uploadImage(thumbnailFile);
        } catch (error) {
          setThumbnailError(error instanceof UploadValidationError && error.message === 'size' ? t('uploadSizeError') : t('uploadTypeError'));
          setSubmitting(false);
          return;
        }
      }

      await onSubmit({
        title,
        description,
        content_md: contentMd,
        content_json: contentJson,
        status,
        is_published: isPublished,
        ...(thumbnailUrl ? { thumbnail_url: thumbnailUrl } : {}),
      });
      localStorage.removeItem(draftStorageKey(draftKey));
      isDirtyRef.current = false;
      onDirtyChange?.(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {pendingDraft && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">{t('draftRestoredTitle')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t('draftRestoredDescription')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={discardDraft} className="btn-outline px-3 py-1.5 text-xs">
              {t('draftDiscard')}
            </button>
            <button type="button" onClick={() => applyDraft(pendingDraft)} className="btn-primary px-3 py-1.5 text-xs">
              {t('draftRestore')}
            </button>
          </div>
        </div>
      )}

      {/* Meta bar — kept visually separate from the article so the writing
          surface below reads like the published page, not a form. */}
      <div className="mb-8 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 rounded-xl border border-border bg-card p-3 sm:p-4">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as ProjectStatus)}
          className="w-full sm:w-auto bg-transparent border border-border rounded-lg px-3 py-2 text-sm"
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {t(`status.${option}` as 'status.idea')}
            </option>
          ))}
        </select>
        <label className="text-sm text-muted-foreground flex items-center gap-2">
          <input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} />
          {t('published')}
        </label>
        <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto sm:ml-auto disabled:opacity-60 inline-flex items-center justify-center gap-1.5">
          {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {submitting ? t('saving') : submitLabel}
        </button>
      </div>

      <div className="max-w-3xl mx-auto">
        <header className="mt-7 mb-10">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            placeholder={t('titlePlaceholder')}
            className="w-full bg-transparent border-none outline-none text-4xl sm:text-5xl font-bold tracking-tight leading-tight placeholder:text-muted-foreground/40"
          />
          <textarea
            ref={descriptionRef}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={1}
            placeholder={t('descriptionPlaceholder')}
            className="w-full bg-transparent border-none outline-none resize-none overflow-hidden text-base sm:text-lg text-muted-foreground leading-relaxed mt-4 placeholder:text-muted-foreground/40"
          />
          {initialValues?.created_at && (
            <div className="mt-6 flex flex-wrap gap-4">
              <p className="text-xs text-muted-foreground font-mono tracking-wide uppercase">
                {tDetail('createdAt')}: {formatLocaleDate(initialValues.created_at, locale)}
              </p>
              {initialValues.updated_at && !areSameCalendarDate(initialValues.created_at, initialValues.updated_at) && (
                <p className="text-xs text-muted-foreground font-mono tracking-wide uppercase">
                  {tDetail('updatedAt')}: {formatLocaleDate(initialValues.updated_at, locale)}
                </p>
              )}
            </div>
          )}
        </header>
      </div>

      <div className="mb-10 overflow-hidden rounded-2xl border border-border max-w-3xl mx-auto">
        <label className="group relative block cursor-pointer aspect-video bg-muted">
          {thumbnailPreview ? (
            <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ImagePlus className="w-8 h-8" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
              <ImagePlus className="w-3.5 h-3.5" />
              {t('thumbnail')}
            </span>
          </div>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            className="sr-only"
            onChange={(event) => handleThumbnailSelect(event.target.files?.[0])}
          />
        </label>
        {thumbnailError && <p className="mt-2 text-xs text-red-500 px-px">{thumbnailError}</p>}
      </div>

      <div className="max-w-3xl mx-auto border-t border-border pt-8">
        <BlockNoteEditorField
          initialMarkdown={initialValues?.content_md ?? ''}
          initialContentJson={initialValues?.content_json}
          onContentChange={({ contentJson: nextContentJson, contentMd: nextContentMd }) => {
            setContentJson(nextContentJson);
            setContentMd(nextContentMd);
          }}
        />
      </div>

      {cropSrc && (
        <ThumbnailCropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </form>
  );
}
