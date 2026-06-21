import { ID } from 'appwrite';
import { storage, ASSETS_BUCKET_ID } from '@/lib/appwrite/client';

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif']);

export class UploadValidationError extends Error {}

function getFileExtension(fileName: string, fallback = 'jpg') {
  const rawExt = fileName.split('.').pop()?.toLowerCase() ?? fallback;
  return rawExt.replace(/[^a-z0-9]/g, '') || fallback;
}

export function assertImageFile(file: File) {
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new UploadValidationError('size');
  }
  const extension = getFileExtension(file.name);
  if (!ALLOWED_MIME_TYPES.has(file.type) || !ALLOWED_EXTENSIONS.has(extension)) {
    throw new UploadValidationError('type');
  }
}

export async function uploadImage(file: File): Promise<string> {
  assertImageFile(file);
  const created = await storage.createFile({ bucketId: ASSETS_BUCKET_ID, fileId: ID.unique(), file });
  return storage.getFileView({ bucketId: ASSETS_BUCKET_ID, fileId: created.$id });
}
