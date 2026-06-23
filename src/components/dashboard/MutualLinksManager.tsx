import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { GripVertical, ImageOff, ImagePlus, Pencil, Trash2 } from 'lucide-react';
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
  listAdminMutualLinks,
  updateMutualLink,
  type AdminMutualLink,
} from '@/lib/content/adminContent';
import { uploadImage, UploadValidationError } from '@/lib/appwrite/upload';
import ThumbnailCropModal from './ThumbnailCropModal';

const modalBaseClass = 'fixed inset-0 z-[2147483647] bg-black/45 backdrop-blur-sm flex items-center justify-center p-4';
const BANNER_ASPECT = 3 / 1;

type MutualLinkRowContentProps = {
  link: AdminMutualLink;
  dragHandleLabel: string;
  editLabel: string;
  deleteLabel: string;
  dragHandleProps?: Record<string, unknown>;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

function MutualLinkRowContent({ link, dragHandleLabel, editLabel, deleteLabel, dragHandleProps, onEdit, onDelete }: MutualLinkRowContentProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        {...dragHandleProps}
        title={dragHandleLabel}
        aria-label={dragHandleLabel}
        className="cursor-grab active:cursor-grabbing text-muted-foreground flex-shrink-0 touch-none bg-transparent border-none p-0"
        style={{ touchAction: 'none' }}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      {link.banner_url ? (
        <img src={link.banner_url} alt="" className="w-[72px] h-6 rounded object-cover border border-border flex-shrink-0" />
      ) : (
        <div className="w-[72px] h-6 rounded border border-border bg-muted flex items-center justify-center flex-shrink-0">
          <ImageOff className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{link.name}</p>
        <p className="text-xs text-muted-foreground truncate">{link.url}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
        <button
          type="button"
          title={editLabel}
          aria-label={editLabel}
          className="btn-outline px-3 py-2 text-xs inline-flex items-center justify-center"
          onClick={() => onEdit?.(link.id)}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          title={deleteLabel}
          aria-label={deleteLabel}
          className="min-h-11 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-300 inline-flex items-center justify-center"
          onClick={() => onDelete?.(link.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

type SortableRowProps = Omit<MutualLinkRowContentProps, 'dragHandleProps'>;

const SortableMutualLinkRow = memo(function SortableMutualLinkRow(props: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={`bento-card p-4 ${isDragging ? 'opacity-30' : ''}`}>
      <MutualLinkRowContent {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
});

type BannerPickerProps = {
  label: string;
  bannerUrl: string | null;
  onPick: (file: File) => void;
};

function BannerPicker({ label, bannerUrl, onPick }: BannerPickerProps) {
  return (
    <label className="group relative block w-full aspect-[3/1] cursor-pointer rounded-lg overflow-hidden border border-border bg-muted">
      {bannerUrl ? (
        <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          <ImageOff className="w-5 h-5" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
        <ImagePlus className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        className="sr-only"
        aria-label={label}
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
  const [createOpen, setCreateOpen] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [pendingBannerUrl, setPendingBannerUrl] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
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

  const editingLink = useMemo(() => links.find((link) => link.id === editingLinkId) ?? null, [links, editingLinkId]);
  const deletingLink = useMemo(() => links.find((link) => link.id === deletingLinkId) ?? null, [links, deletingLinkId]);

  function closeCreateModal() {
    setCreateOpen(false);
    setPendingBannerUrl(null);
  }

  function closeEditModal() {
    setEditingLinkId(null);
    setPendingBannerUrl(null);
  }

  function handleBannerPick(file: File) {
    setCropSrc(URL.createObjectURL(file));
  }

  async function handleCropConfirm(file: File) {
    setCropSrc(null);
    try {
      const url = await uploadImage(file);
      setPendingBannerUrl(url);
    } catch (error) {
      if (error instanceof UploadValidationError) {
        toast.error(error.message === 'size' ? tForm('uploadSizeError') : tForm('uploadTypeError'));
      } else {
        toast.error(tToast('active_update_failed'));
      }
    }
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsPending(true);
    closeCreateModal();
    try {
      const nextOrder = links.reduce((max, link) => Math.max(max, link.display_order), -1) + 1;
      await createMutualLink({
        name: String(formData.get('name') ?? ''),
        url: String(formData.get('url') ?? ''),
        description: String(formData.get('description') ?? ''),
        banner_url: pendingBannerUrl,
        display_order: nextOrder,
      });
      toast.success(tToast('links_created'));
      load();
    } catch {
      toast.error(tToast('links_create_failed'));
    } finally {
      setIsPending(false);
    }
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingLink) return;
    const formData = new FormData(event.currentTarget);
    setIsPending(true);
    closeEditModal();
    try {
      await updateMutualLink(editingLink.id, {
        name: String(formData.get('name') ?? ''),
        url: String(formData.get('url') ?? ''),
        description: String(formData.get('description') ?? ''),
        banner_url: pendingBannerUrl ?? editingLink.banner_url,
        display_order: editingLink.display_order,
      });
      toast.success(tToast('links_updated'));
      load();
    } catch {
      toast.error(tToast('links_update_failed'));
    } finally {
      setIsPending(false);
    }
  }

  async function handleDelete() {
    if (!deletingLink) return;
    setIsPending(true);
    setDeletingLinkId(null);
    try {
      await deleteMutualLink(deletingLink.id);
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
    setLinks(reordered);

    Promise.all(
      reordered.map((link) =>
        updateMutualLink(link.id, {
          name: link.name,
          url: link.url,
          description: link.description,
          banner_url: link.banner_url,
          display_order: link.display_order,
        })
      )
    ).catch(() => {
      toast.error(tToast('links_update_failed'));
      load();
    });
  }

  const handleEdit = useCallback((id: string) => setEditingLinkId(id), []);
  const handleDeleteRequest = useCallback((id: string) => setDeletingLinkId(id), []);
  const activeDragLink = activeDragId ? links.find((link) => link.id === activeDragId) ?? null : null;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{t('title')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
        </div>
        <button type="button" className="btn-primary w-full sm:w-auto" onClick={() => setCreateOpen(true)}>
          {t('newButton')}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-3">
        {!loading && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <SortableContext items={links.map((link) => link.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {links.map((link) => (
                  <SortableMutualLinkRow
                    key={link.id}
                    link={link}
                    dragHandleLabel={t('dragHandle')}
                    editLabel={t('actions.edit')}
                    deleteLabel={t('actions.delete')}
                    onEdit={handleEdit}
                    onDelete={handleDeleteRequest}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeDragLink ? (
                <div className="bento-card p-4 shadow-xl">
                  <MutualLinkRowContent
                    link={activeDragLink}
                    dragHandleLabel={t('dragHandle')}
                    editLabel={t('actions.edit')}
                    deleteLabel={t('actions.delete')}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
        {!loading && links.length === 0 && <p className="text-sm text-muted-foreground">{t('empty')}</p>}
      </div>

      {createOpen
        ? createPortal(
            <div className={modalBaseClass} onClick={closeCreateModal}>
              <div className="relative w-full max-w-xl rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="text-lg font-semibold">{t('createModal.title')}</h3>
                  <button type="button" className="btn-outline px-3 py-1.5 text-xs" onClick={closeCreateModal}>
                    {t('actions.close')}
                  </button>
                </div>
                <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">{t('fields.banner')}</label>
                    <BannerPicker label={t('fields.banner')} bannerUrl={pendingBannerUrl} onPick={handleBannerPick} />
                    <p className="mt-1.5 text-[11px] text-muted-foreground">{t('fields.bannerHint')}</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">{t('fields.name')}</label>
                    <input name="name" required placeholder={t('fields.namePlaceholder')} className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">{t('fields.url')}</label>
                    <input name="url" type="url" required placeholder={t('fields.urlPlaceholder')} className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">{t('fields.description')}</label>
                    <input name="description" placeholder={t('fields.descriptionPlaceholder')} className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={isPending} className="btn-primary w-full sm:w-auto disabled:opacity-60">{isPending ? '…' : t('actions.create')}</button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )
        : null}

      {editingLink
        ? createPortal(
            <div className={modalBaseClass} onClick={closeEditModal}>
              <div className="relative w-full max-w-xl rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h3 className="text-lg font-semibold">{t('editModal.title')}</h3>
                  <button type="button" className="btn-outline px-3 py-1.5 text-xs" onClick={closeEditModal}>
                    {t('actions.close')}
                  </button>
                </div>
                <form onSubmit={handleUpdate} className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">{t('fields.banner')}</label>
                    <BannerPicker label={t('fields.banner')} bannerUrl={pendingBannerUrl ?? editingLink.banner_url} onPick={handleBannerPick} />
                    <p className="mt-1.5 text-[11px] text-muted-foreground">{t('fields.bannerHint')}</p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">{t('fields.name')}</label>
                    <input name="name" defaultValue={editingLink.name} className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">{t('fields.url')}</label>
                    <input name="url" type="url" defaultValue={editingLink.url} className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-muted-foreground mb-1 uppercase tracking-wider">{t('fields.description')}</label>
                    <input name="description" defaultValue={editingLink.description} className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" disabled={isPending} className="btn-primary w-full sm:w-auto disabled:opacity-60">{isPending ? '…' : t('actions.update')}</button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )
        : null}

      {deletingLink
        ? createPortal(
            <div className={modalBaseClass} onClick={() => setDeletingLinkId(null)}>
              <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4" onClick={(event) => event.stopPropagation()}>
                <h3 className="text-lg font-semibold">{t('deleteModal.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('deleteModal.description', { name: deletingLink.name })}</p>
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
                  <button type="button" className="btn-outline px-3 py-2 text-xs w-full sm:w-auto" onClick={() => setDeletingLinkId(null)}>
                    {t('actions.cancel')}
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={handleDelete}
                    className="rounded-lg border border-red-600 bg-red-600 px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 w-full sm:w-auto"
                  >
                    {isPending ? '…' : t('actions.delete')}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

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
