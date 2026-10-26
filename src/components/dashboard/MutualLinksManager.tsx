'use client';

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ExternalLink, GripVertical, ImageOff, ImagePlus, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslations } from '@/hooks/useTranslations';
import {
  createMutualLink,
  deleteMutualLink,
  discardUploadedImage,
  listAdminMutualLinks,
  updateMutualLink,
  type AdminMutualLink,
  type MutualLinkInput,
} from '@/lib/content/adminContent';
import { uploadImage, UploadValidationError } from '@/lib/appwrite/upload';
import ThumbnailCropModal from './ThumbnailCropModal';
import {
  AdminModal,
  ConfirmDeleteModal,
  DANGER_ICON_BUTTON_CLASS,
  FIELD_LABEL_CLASS,
  ICON_BUTTON_CLASS,
  INPUT_CLASS,
  PRIMARY_BUTTON_CLASS,
  ROW_CLASS,
  RowSkeleton,
} from './adminUi';

const BANNER_ASPECT = 3 / 1;

type FormState = { id: string | null; name: string; url: string; description: string; banner_url: string | null };

function toInput(link: AdminMutualLink): MutualLinkInput {
  return { name: link.name, url: link.url, description: link.description, banner_url: link.banner_url, display_order: link.display_order };
}

type RowLabels = { dragHandle: string; open: string; edit: string; delete: string };

type MutualLinkRowContentProps = {
  link: AdminMutualLink;
  labels: RowLabels;
  dragHandleProps?: Record<string, unknown>;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

function MutualLinkRowContent({ link, labels, dragHandleProps, onEdit, onDelete }: MutualLinkRowContentProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        {...dragHandleProps}
        title={labels.dragHandle}
        aria-label={labels.dragHandle}
        className="shrink-0 cursor-grab touch-none border-none bg-transparent p-0 text-muted-foreground active:cursor-grabbing"
        style={{ touchAction: 'none' }}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => onEdit?.(link.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        {link.banner_url ? (
          <img src={link.banner_url} alt="" className="h-8 w-24 shrink-0 rounded-sm border border-border object-cover" />
        ) : (
          <span className="flex h-8 w-24 shrink-0 items-center justify-center rounded-sm border border-border bg-muted">
            <ImageOff className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium underline-offset-4 group-hover:underline">{link.name}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {link.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            {link.description && <> · {link.description}</>}
          </span>
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-1.5">
        <a href={link.url} target="_blank" rel="noopener noreferrer" title={labels.open} aria-label={labels.open} className={`${ICON_BUTTON_CLASS} hidden sm:inline-flex`}>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <button type="button" title={labels.edit} aria-label={labels.edit} className={ICON_BUTTON_CLASS} onClick={() => onEdit?.(link.id)}>
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button type="button" title={labels.delete} aria-label={labels.delete} className={DANGER_ICON_BUTTON_CLASS} onClick={() => onDelete?.(link.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

type SortableRowProps = Omit<MutualLinkRowContentProps, 'dragHandleProps'>;

const SortableMutualLinkRow = memo(function SortableMutualLinkRow(props: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.link.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`${ROW_CLASS} ${isDragging ? 'opacity-30' : ''}`}>
      <MutualLinkRowContent {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
});

type BannerPickerProps = {
  label: string;
  bannerUrl: string | null;
  uploading: boolean;
  onPick: (file: File) => void;
};

function BannerPicker({ label, bannerUrl, uploading, onPick }: BannerPickerProps) {
  return (
    <label className="group relative block aspect-3/1 w-full cursor-pointer overflow-hidden rounded-lg border border-dashed border-border bg-muted transition-colors hover:border-foreground/40">
      {bannerUrl ? (
        <img src={bannerUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
          <ImagePlus className="h-5 w-5" />
        </span>
      )}
      <span
        className={`absolute inset-0 flex items-center justify-center transition-colors ${uploading ? 'bg-black/40' : 'bg-black/0 group-hover:bg-black/40'}`}
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-white" />
        ) : (
          bannerUrl && <ImagePlus className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
        )}
      </span>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        className="sr-only"
        aria-label={label}
        disabled={uploading}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onPick(file);
          event.target.value = '';
        }}
      />
    </label>
  );
}

export default function MutualLinksManager() {
  const t = useTranslations('Dashboard.mutualLinks');
  const tForm = useTranslations('Dashboard.editorForm');
  const tToast = useTranslations('Dashboard.toast');
  const [links, setLinks] = useState<AdminMutualLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState | null>(null);
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  // A banner uploaded in the open form that no saved row points at yet.
  const [unsavedBanner, setUnsavedBanner] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const labels: RowLabels = useMemo(
    () => ({ dragHandle: t('dragHandle'), open: t('actions.open'), edit: t('actions.edit'), delete: t('actions.delete') }),
    [t]
  );

  function load() {
    setLoading(true);
    listAdminMutualLinks()
      .then(setLinks)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const deletingLink = useMemo(() => links.find((link) => link.id === deletingLinkId) ?? null, [links, deletingLinkId]);

  const closeForm = useCallback(() => {
    void discardUploadedImage(unsavedBanner);
    setUnsavedBanner(null);
    setForm(null);
  }, [unsavedBanner]);

  const handleEdit = useCallback(
    (id: string) => {
      const link = links.find((l) => l.id === id);
      if (link) setForm({ id, name: link.name, url: link.url, description: link.description, banner_url: link.banner_url });
    },
    [links]
  );
  const handleDeleteRequest = useCallback((id: string) => setDeletingLinkId(id), []);

  async function handleCropConfirm(file: File) {
    setCropSrc(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      void discardUploadedImage(unsavedBanner);
      setUnsavedBanner(url);
      setForm((current) => (current ? { ...current, banner_url: url } : current));
    } catch (error) {
      if (error instanceof UploadValidationError) {
        toast.error(error.message === 'size' ? tForm('uploadSizeError') : tForm('uploadTypeError'));
      } else {
        toast.error(tToast('links_update_failed'));
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    const editing = form.id ? links.find((link) => link.id === form.id) : null;
    const fields = { name: form.name, url: form.url, description: form.description, banner_url: form.banner_url };
    setIsPending(true);
    try {
      if (editing) {
        await updateMutualLink(editing.id, { ...fields, display_order: editing.display_order });
        toast.success(tToast('links_updated'));
      } else {
        const nextOrder = links.reduce((max, link) => Math.max(max, link.display_order), -1) + 1;
        await createMutualLink({ ...fields, display_order: nextOrder });
        toast.success(tToast('links_created'));
      }
      setUnsavedBanner(null);
      setForm(null);
      load();
    } catch {
      toast.error(tToast(editing ? 'links_update_failed' : 'links_create_failed'));
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete() {
    if (!deletingLink) return;
    setIsPending(true);
    try {
      await deleteMutualLink(deletingLink.id);
      setDeletingLinkId(null);
      toast.success(tToast('links_deleted'));
      load();
    } catch {
      toast.error(tToast('links_delete_failed'));
    } finally {
      setIsPending(false);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = links.findIndex((link) => link.id === active.id);
    const toIndex = links.findIndex((link) => link.id === over.id);
    if (fromIndex === -1 || toIndex === -1) return;

    const reordered = arrayMove(links, fromIndex, toIndex).map((link, index) => ({ ...link, display_order: index }));
    const moved = reordered.filter((link) => links.find((l) => l.id === link.id)?.display_order !== link.display_order);
    setLinks(reordered);

    Promise.all(moved.map((link) => updateMutualLink(link.id, toInput(link)))).catch(() => {
      toast.error(tToast('links_update_failed'));
      load();
    });
  }

  const activeDragLink = activeDragId ? links.find((link) => link.id === activeDragId) ?? null : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="text-xl font-semibold">{t('title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
        </div>
        <button
          type="button"
          className={`${PRIMARY_BUTTON_CLASS} w-full sm:w-auto`}
          onClick={() => setForm({ id: null, name: '', url: '', description: '', banner_url: null })}
        >
          <Plus className="h-4 w-4" />
          {t('newButton')}
        </button>
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-card p-4 sm:p-6">
        {loading && <RowSkeleton count={2} thumb />}
        {!loading && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={links.map((link) => link.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {links.map((link) => (
                  <SortableMutualLinkRow key={link.id} link={link} labels={labels} onEdit={handleEdit} onDelete={handleDeleteRequest} />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeDragLink ? (
                <div className={`${ROW_CLASS} shadow-xl`}>
                  <MutualLinkRowContent link={activeDragLink} labels={labels} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
        {!loading && links.length === 0 && <p className="text-sm text-muted-foreground">{t('empty')}</p>}
      </div>

      {form && (
        <AdminModal title={form.id ? t('editModal.title') : t('createModal.title')} closeLabel={t('actions.close')} onClose={closeForm}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className={FIELD_LABEL_CLASS}>{t('fields.banner')}</span>
              <BannerPicker label={t('fields.banner')} bannerUrl={form.banner_url} uploading={uploading} onPick={(file) => setCropSrc(URL.createObjectURL(file))} />
              <p className="mt-1.5 text-[11px] text-muted-foreground">{t('fields.bannerHint')}</p>
            </div>
            <div>
              <label htmlFor="link-name" className={FIELD_LABEL_CLASS}>
                {t('fields.name')}
              </label>
              <input
                id="link-name"
                required
                autoFocus
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder={t('fields.namePlaceholder')}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="link-url" className={FIELD_LABEL_CLASS}>
                {t('fields.url')}
              </label>
              <input
                id="link-url"
                type="url"
                required
                value={form.url}
                onChange={(event) => setForm({ ...form, url: event.target.value })}
                placeholder={t('fields.urlPlaceholder')}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label htmlFor="link-description" className={FIELD_LABEL_CLASS}>
                {t('fields.description')}
              </label>
              <input
                id="link-description"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder={t('fields.descriptionPlaceholder')}
                className={INPUT_CLASS}
              />
            </div>
            <div className="flex justify-end border-t border-border pt-4">
              <button type="submit" disabled={isPending || uploading} className={`${PRIMARY_BUTTON_CLASS} w-full sm:w-auto`}>
                {isPending ? '…' : form.id ? t('actions.update') : t('actions.create')}
              </button>
            </div>
          </form>
        </AdminModal>
      )}

      {deletingLink && (
        <ConfirmDeleteModal
          title={t('deleteModal.title')}
          description={t('deleteModal.description', { name: deletingLink.name })}
          cancelLabel={t('actions.cancel')}
          confirmLabel={t('actions.delete')}
          pending={isPending}
          onCancel={() => setDeletingLinkId(null)}
          onConfirm={handleDelete}
        />
      )}

      {cropSrc && (
        <ThumbnailCropModal
          imageSrc={cropSrc}
          aspect={BANNER_ASPECT}
          fileName="banner.jpg"
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </div>
  );
}
