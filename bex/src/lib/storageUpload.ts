import { shouldUseDemoData } from '@/lib/devMode';
import { usesMediaRestUpload, uploadMediaFiles } from '@/features/media/mediaApi';

export interface LocalUploadFile {
  uri: string;
  name: string;
  mimeType: string;
}

/**
 * Demo modda yerel URI döner.
 * REST modda dosyalar backend'e yüklenir ve public URL döner.
 */
export async function uploadLocalFiles(
  _basePath: string,
  files: LocalUploadFile[]
): Promise<string[]> {
  if (files.length === 0) return [];

  if (!shouldUseDemoData() && (await usesMediaRestUpload())) {
    return uploadMediaFiles(files);
  }

  return files.map((f) => f.uri);
}
