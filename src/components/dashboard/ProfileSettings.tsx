import { useEffect, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from '@/hooks/useTranslations';
import { DEFAULT_AVATAR_URL } from '@/lib/content/publicContent';
import { getAdminSiteSettings, updateSiteAvatar } from '@/lib/content/adminContent';
import { uploadImage, UploadValidationError } from '@/lib/appwrite/upload';
import ThumbnailCropModal from './ThumbnailCropModal';

export default function ProfileSettings() {
  const t = useTranslations('Dashboard.profile');
  const tForm = useTranslations('Dashboard.editorForm');
  const [avatarUrl, setAvatarUrl] = useState(DEFAULT_AVATAR_URL);
  const [loading, setLoading] = useState(true);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdminSiteSettings()
      .then((settings) => {
        if (settings.avatarUrl) setAvatarUrl(settings.avatarUrl);
      })
      .finally(() => setLoading(false));
  }, []);

  function handleSelect(file: File | undefined) {
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
  }

  async function handleCropConfirm(file: File) {
    setCropSrc(null);
    setSaving(true);
    try {
      const url = await uploadImage(file);
      await updateSiteAvatar(url);
      setAvatarUrl(url);
      toast.success(t('updated'));
    } catch (error) {
      if (error instanceof UploadValidationError) {
        toast.error(error.message === 'size' ? tForm('uploadSizeError') : tForm('uploadTypeError'));
      } else {
        toast.error(t('updateFailed'));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <label className="group relative block h-28 w-28 shrink-0 cursor-pointer overflow-hidden rounded-full border border-border bg-muted">
          {loading ? (
            <span className="block h-full w-full animate-pulse bg-muted" />
          ) : (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          )}
          <span
            className={`absolute inset-0 flex items-center justify-center transition-colors ${saving ? 'bg-black/40' : 'bg-black/0 group-hover:bg-black/40'}`}
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <ImagePlus className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
            )}
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            className="sr-only"
            disabled={saving || loading}
            onChange={(event) => {
              handleSelect(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </label>
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold">{t('title')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
          </div>
          <label
            className={`inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 text-sm transition-colors hover:bg-muted ${saving || loading ? 'pointer-events-none opacity-60' : ''}`}
          >
            <ImagePlus className="h-3.5 w-3.5" />
            {t('change')}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              className="sr-only"
              disabled={saving || loading}
              onChange={(event) => {
                handleSelect(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
          </label>
        </div>
      </div>

      {cropSrc && (
        <ThumbnailCropModal
          imageSrc={cropSrc}
          aspect={1}
          fileName="avatar.jpg"
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}
    </div>
  );
}
