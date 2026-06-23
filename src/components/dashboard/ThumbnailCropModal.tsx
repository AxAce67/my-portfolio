import { useState } from 'react';
import { createPortal } from 'react-dom';
import Cropper, { type Area } from 'react-easy-crop';
import { useTranslations } from '@/hooks/useTranslations';
import { getCroppedImageFile } from '@/lib/cropImage';

type ThumbnailCropModalProps = {
  imageSrc: string;
  aspect?: number;
  fileName?: string;
  onConfirm: (file: File) => void;
  onCancel: () => void;
};

export default function ThumbnailCropModal({ imageSrc, aspect = 16 / 9, fileName = 'thumbnail.jpg', onConfirm, onCancel }: ThumbnailCropModalProps) {
  const t = useTranslations('Dashboard.editorForm');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const file = await getCroppedImageFile(imageSrc, croppedAreaPixels, fileName);
      onConfirm(file);
    } finally {
      setProcessing(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] bg-black/70 flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card p-4 sm:p-6 space-y-4">
        <h3 className="text-lg font-semibold">{t('cropTitle')}</h3>
        <div className="relative w-full bg-black/40 rounded-lg overflow-hidden" style={{ aspectRatio: aspect }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
          />
        </div>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="w-full"
          aria-label="zoom"
        />
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
          <button type="button" className="btn-outline px-3 py-2 text-xs w-full sm:w-auto" onClick={onCancel}>
            {t('cropCancel')}
          </button>
          <button
            type="button"
            disabled={processing || !croppedAreaPixels}
            onClick={handleConfirm}
            className="btn-primary px-3 py-2 text-xs w-full sm:w-auto disabled:opacity-60"
          >
            {processing ? '…' : t('cropConfirm')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
