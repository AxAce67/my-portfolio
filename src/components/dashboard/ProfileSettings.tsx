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
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t('description')}</p>
      </div>

      {!loading && (
        <label className="group relative block w-28 h-28 cursor-pointer rounded-full overflow-hidden border border-border bg-muted">
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            {saving ? (
              <Loader2 className="w-5 h-5 text-white animate-spin" />
            ) : (
              <ImagePlus className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            className="sr-only"
            disabled={saving}
            onChange={(event) => handleSelect(event.target.files?.[0])}
          />
        </label>
      )}

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
