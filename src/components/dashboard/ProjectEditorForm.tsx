import { useEffect, useRef, useState } from 'react';
import { Crop, Eye, ImagePlus, Loader2, X } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { useLocale } from '@/hooks/useLocale';
import { areSameCalendarDate, formatLocaleDate, formatRelativeTime } from '@/lib/dates';
import { uploadImage, UploadValidationError } from '@/lib/appwrite/upload';
import { listAdminTags, type ProjectInput, type ProjectKind, type ProjectStatus } from '@/lib/content/adminContent';
import BlockNoteEditorField from './BlockNoteEditorField';
import ThumbnailCropModal from './ThumbnailCropModal';

type ProjectEditorFormProps = {
  draftKey: string;
  submitLabel: string;
  onSubmit: (input: ProjectInput) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
  /** Where the saved version can be previewed (existing projects only). */
  previewHref?: string;
  initialValues?: {
    title?: string;
    description?: string;
    content_md?: string;
    content_json?: unknown;
    status?: ProjectStatus;
    is_published?: boolean;
    thumbnail_url?: string | null;
    kind?: ProjectKind;
    service_url?: string | null;
    tags?: string[];
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
  kind?: ProjectKind;
  service_url?: string;
  tags?: string[];
};

const statusOptions: ProjectStatus[] = ['idea', 'design', 'development', 'running', 'completed', 'on_hold'];
const kindOptions: ProjectKind[] = ['project', 'service'];

function draftStorageKey(draftKey: string) {
  return `portfolio-admin-draft:${draftKey}`;
}

export default function ProjectEditorForm({ draftKey, submitLabel, onSubmit, onDirtyChange, previewHref, initialValues }: ProjectEditorFormProps) {
  const t = useTranslations('Dashboard.editorForm');
  const tDetail = useTranslations('ProjectDetail');
  const locale = useLocale();
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [status, setStatus] = useState<ProjectStatus>(initialValues?.status ?? 'idea');
  const [isPublished, setIsPublished] = useState(initialValues?.is_published ?? false);
  const [kind, setKind] = useState<ProjectKind>(initialValues?.kind ?? 'project');
  const [serviceUrl, setServiceUrl] = useState(initialValues?.service_url ?? '');
  const [tags, setTags] = useState<string[]>(initialValues?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [knownTags, setKnownTags] = useState<string[]>([]);
  const [contentMd, setContentMd] = useState(initialValues?.content_md ?? '');
  const [contentJson, setContentJson] = useState<unknown>(initialValues?.content_json ?? []);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(initialValues?.thumbnail_url ?? null);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  // The uncropped source for re-adjusting: the picked file before cropping,
  // or the saved thumbnail when nothing new has been picked.
  const [cropSource, setCropSource] = useState<string | null>(initialValues?.thumbnail_url ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(initialValues?.updated_at ?? null);
  // Re-render now and then so "saved 3 minutes ago" stays current.
  const [now, setNow] = useState(() => Date.now());
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(intervalId);
  }, []);

  // ⌘S / Ctrl+S saves instead of opening the browser's "save page".
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 's' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
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

  useEffect(() => {
    listAdminTags().then(setKnownTags, () => setKnownTags([]));
  }, []);

  function addTag(raw: string) {
    const tag = raw.trim();
    if (tag && !tags.some((existing) => existing.toLowerCase() === tag.toLowerCase())) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  }

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
    setDirty(true);
    onDirtyChange?.(true);

    const timeoutId = window.setTimeout(() => {
      const draft: DraftState = {
        title,
        description,
        content_md: contentMd,
        content_json: contentJson,
        status,
        is_published: isPublished,
        kind,
        service_url: serviceUrl,
        tags,
      };
      localStorage.setItem(draftStorageKey(draftKey), JSON.stringify(draft));
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [draftKey, title, description, contentMd, contentJson, status, isPublished, kind, serviceUrl, tags, onDirtyChange]);

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
    setKind(draft.kind ?? 'project');
    setServiceUrl(draft.service_url ?? '');
    setTags(draft.tags ?? []);
    setPendingDraft(null);
  }

  function discardDraft() {
    localStorage.removeItem(draftStorageKey(draftKey));
    setPendingDraft(null);
  }

  function handleThumbnailSelect(file: File | undefined) {
    if (!file) return;
    setThumbnailError(null);
    const src = URL.createObjectURL(file);
    setCropSource(src);
    setCropSrc(src);
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

      try {
        await onSubmit({
          title,
          description,
          content_md: contentMd,
          content_json: contentJson,
          status,
          is_published: isPublished,
          kind,
          service_url: serviceUrl,
          tags,
          ...(thumbnailUrl ? { thumbnail_url: thumbnailUrl } : {}),
        });
      } catch {
        // The caller already reported the failure; keep the local draft and
        // the unsaved-changes guard so nothing is lost.
        return;
      }
      localStorage.removeItem(draftStorageKey(draftKey));
      isDirtyRef.current = false;
      setDirty(false);
      setLastSavedAt(new Date().toISOString());
      onDirtyChange?.(false);
      // The editor stays open after saving: the uploaded thumbnail is now the
      // saved one, so the next save must not upload it again.
      if (thumbnailUrl) {
        setThumbnailFile(null);
        setCropSource(thumbnailUrl);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
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

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
        <div className="min-w-0">
          <div className="max-w-3xl mx-auto">
            <header className="mt-7 mb-10">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                placeholder={t('titlePlaceholder')}
                className="w-full bg-transparent border-none text-4xl sm:text-5xl font-bold tracking-tight leading-tight placeholder:text-muted-foreground/40"
              />
              <textarea
                ref={descriptionRef}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={1}
                placeholder={t('descriptionPlaceholder')}
                className="w-full bg-transparent border-none resize-none overflow-hidden text-base sm:text-lg text-muted-foreground leading-relaxed mt-4 placeholder:text-muted-foreground/40"
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
            {thumbnailPreview && cropSource && (
              <div className="flex justify-end border-t border-border bg-card px-3 py-2">
                <button
                  type="button"
                  onClick={() => setCropSrc(cropSource)}
                  className="btn-outline px-3 py-1.5 text-xs inline-flex items-center gap-1.5"
                >
                  <Crop className="w-3.5 h-3.5" />
                  {t('cropAdjust')}
                </button>
              </div>
            )}
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

        </div>
        {/* Settings live beside the article so the writing surface reads
            like the published page. On phones the panel comes first. */}
        <aside className="order-first lg:order-none lg:sticky lg:top-24 rounded-xl border border-border bg-card p-4 space-y-4">
          <div>
            <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60 inline-flex items-center justify-center gap-1.5">
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {submitting ? t('saving') : submitLabel}
            </button>
            <p className={`mt-2 text-center text-[11px] ${dirty ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
              {dirty ? t('unsaved') : lastSavedAt ? t('savedAt', { when: formatRelativeTime(lastSavedAt, locale, now) }) : t('saveShortcut')}
            </p>
            {previewHref && (
              <a href={previewHref} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                <Eye className="w-3.5 h-3.5" />
                {t('preview')}
              </a>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <button
              type="button"
              role="switch"
              aria-checked={isPublished}
              onClick={() => setIsPublished(!isPublished)}
              className="flex w-full items-center justify-between text-sm"
            >
              <span>{t('published')}</span>
              <span className={`relative h-5 w-9 rounded-full transition-colors ${isPublished ? 'bg-emerald-500' : 'bg-muted-foreground/30'}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${isPublished ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </span>
            </button>
          </div>

          <label className="block">
            <span className="text-xs text-muted-foreground">{t('statusLabel')}</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ProjectStatus)}
              className="mt-1 w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {t(`status.${option}` as 'status.idea')}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-muted-foreground">{t('kindLabel')}</span>
            <select
              value={kind}
              onChange={(event) => setKind(event.target.value as ProjectKind)}
              className="mt-1 w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm"
            >
              {kindOptions.map((option) => (
                <option key={option} value={option}>
                  {t(`kind.${option}` as 'kind.project')}
                </option>
              ))}
            </select>
            {kind === 'service' && (
              <input
                type="url"
                value={serviceUrl}
                onChange={(event) => setServiceUrl(event.target.value)}
                placeholder={t('serviceUrlPlaceholder')}
                className="mt-2 w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm"
              />
            )}
          </label>

          <div>
            <span className="text-xs text-muted-foreground">{t('tags')}</span>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-lg border border-border px-2 py-1.5">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-mono">
                  {tag}
                  <button type="button" onClick={() => setTags(tags.filter((existing) => existing !== tag))} aria-label={t('removeTag', { tag })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ',') {
                    event.preventDefault();
                    addTag(tagInput);
                  } else if (event.key === 'Backspace' && !tagInput && tags.length > 0) {
                    setTags(tags.slice(0, -1));
                  }
                }}
                onBlur={() => tagInput && addTag(tagInput)}
                list="known-tags"
                placeholder={t('tagPlaceholder')}
                className="flex-1 min-w-24 bg-transparent text-sm outline-none py-0.5"
              />
              <datalist id="known-tags">
                {knownTags.filter((tag) => !tags.includes(tag)).map((tag) => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
            </div>
          </div>
        </aside>
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
