import { useEffect, useRef, useState } from 'react';
import { Box, ChevronDown, Crop, Eye, Globe, ImagePlus, Link2, Loader2 } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';
import { useLocale } from '@/hooks/useLocale';
import { areSameCalendarDate, formatLocaleDate, formatRelativeTime } from '@/lib/dates';
import { uploadImage, UploadValidationError } from '@/lib/appwrite/upload';
import { listAdminTags, type ProjectInput, type ProjectKind, type ProjectStatus } from '@/lib/content/adminContent';
import BlockNoteEditorField from './BlockNoteEditorField';
import ThumbnailCropModal from './ThumbnailCropModal';
import { TagInput } from './TagInput';
import { SwitchTrack } from '@/components/ui/SwitchTrack';
import { PROJECT_STATUS_DOT_CLASS } from '@/lib/projectStatus';

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

const SELECT_CLASS =
  'h-9 w-full appearance-none rounded-lg border border-border bg-background pr-9 text-sm outline-none focus-visible:outline-none transition-colors hover:border-foreground/30 focus:border-foreground/60';
const CHEVRON_CLASS = 'pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground';
const KIND_ICON_CLASS = 'pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground';

function draftStorageKey(draftKey: string) {
  return `portfolio-admin-draft:${draftKey}`;
}

export default function ProjectEditorForm({ draftKey, submitLabel, onSubmit, onDirtyChange, previewHref, initialValues }: ProjectEditorFormProps) {
  const t = useTranslations('Dashboard.editorForm');
  const tDetail = useTranslations('ProjectDetail');
  const tStatus = useTranslations('ProjectStatus');
  const locale = useLocale();
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [status, setStatus] = useState<ProjectStatus>(initialValues?.status ?? 'idea');
  const [isPublished, setIsPublished] = useState(initialValues?.is_published ?? false);
  const [kind, setKind] = useState<ProjectKind>(initialValues?.kind ?? 'project');
  const [serviceUrl, setServiceUrl] = useState(initialValues?.service_url ?? '');
  const [tags, setTags] = useState<string[]>(initialValues?.tags ?? []);
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
  const mountedAtRef = useRef(0);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the description to exactly fit its content, like the <p> tag
  // the published page renders — a fixed `rows` count leaves a gap when the
  // text is shorter than that.
  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [description]);

  // The title wraps like the published <h1> instead of scrolling sideways.
  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [title]);

  useEffect(() => {
    listAdminTags().then(setKnownTags, () => setKnownTags([]));
  }, []);

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
      mountedAtRef.current = Date.now();
      return;
    }
    // The block editor rewrites its content once while loading; that is not
    // an edit, so changes in the first moment after opening are ignored.
    if (Date.now() - mountedAtRef.current < 1000) return;
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

      {/* Settings sit in a bar above the article (sticky, so saving is
          always one click away); the article below reads like the page. */}
      <div className="sticky top-16 z-20 mb-8 rounded-xl border border-border bg-card/95 p-3 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-foreground px-4 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {submitting ? t('saving') : submitLabel}
          </button>
          <span className={`inline-flex items-center gap-1.5 text-xs ${dirty ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dirty ? 'bg-amber-500' : 'bg-emerald-500'}`} aria-hidden />
            {dirty ? t('unsaved') : lastSavedAt ? t('savedAt', { when: formatRelativeTime(lastSavedAt, locale, now) }) : t('saveShortcut')}
          </span>
          <div className="ml-auto flex items-center gap-1">
            {previewHref && (
              <a
                href={previewHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Eye className="h-3.5 w-3.5" />
                {t('preview')}
              </a>
            )}
            <button
              type="button"
              role="switch"
              aria-checked={isPublished}
              onClick={() => setIsPublished(!isPublished)}
              className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm transition-colors hover:bg-muted"
            >
              {t('published')}
              <SwitchTrack on={isPublished} />
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-2 border-t border-border pt-3 sm:grid-cols-[11rem_11rem_1fr] sm:items-start">
          <div className="relative">
            <span className={`pointer-events-none absolute left-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${PROJECT_STATUS_DOT_CLASS[status]}`} aria-hidden />
            <select
              aria-label={t('statusLabel')}
              value={status}
              onChange={(event) => setStatus(event.target.value as ProjectStatus)}
              className={`${SELECT_CLASS} pl-7`}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {tStatus(option)}
                </option>
              ))}
            </select>
            <ChevronDown className={CHEVRON_CLASS} />
          </div>
          <div className="relative">
            {kind === 'service' ? <Globe className={KIND_ICON_CLASS} /> : <Box className={KIND_ICON_CLASS} />}
            <select
              aria-label={t('kindLabel')}
              value={kind}
              onChange={(event) => setKind(event.target.value as ProjectKind)}
              className={`${SELECT_CLASS} pl-8`}
            >
              {kindOptions.map((option) => (
                <option key={option} value={option}>
                  {t(`kind.${option}` as 'kind.project')}
                </option>
              ))}
            </select>
            <ChevronDown className={CHEVRON_CLASS} />
          </div>
          <TagInput
            tags={tags}
            onChange={setTags}
            knownTags={knownTags}
            label={t('tags')}
            placeholder={t('tagPlaceholder')}
            removeLabel={(tag) => t('removeTag', { tag })}
          />
          {kind === 'service' && (
            <div className="relative sm:col-span-3">
              <Link2 className={KIND_ICON_CLASS} />
              <input
                type="url"
                aria-label={t('serviceUrlPlaceholder')}
                value={serviceUrl}
                onChange={(event) => setServiceUrl(event.target.value)}
                placeholder={t('serviceUrlPlaceholder')}
                className="h-9 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm outline-none focus-visible:outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground/60"
              />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        <header className="mt-7 mb-10">
          <textarea
            ref={titleRef}
            value={title}
            onChange={(event) => setTitle(event.target.value.replace(/\n/g, ' '))}
            onKeyDown={(event) => event.key === 'Enter' && event.preventDefault()}
            required
            rows={1}
            placeholder={t('titlePlaceholder')}
            className="w-full bg-transparent border-none resize-none overflow-hidden text-4xl sm:text-5xl font-bold tracking-tight leading-tight text-balance placeholder:text-muted-foreground/40"
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
