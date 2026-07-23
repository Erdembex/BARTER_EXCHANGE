import { shouldUseDemoData } from '@/lib/devMode';
import { usesMediaRestUpload, uploadMediaFiles } from '@/features/media/mediaApi';
import { getRestUserType } from '@/lib/auth/sessionClaims';

export interface LocalUploadFile {
  uri: string;
  name: string;
  mimeType: string;
}

/**
 * Demo modda yerel URI döner.
 * REST modda dosyalar backend'e yüklenir; dönen `/uploads/...` URL'leri JWT ile okunur.
 */
export async function uploadLocalFiles(
  _basePath: string,
  files: LocalUploadFile[]
): Promise<string[]> {
  if (files.length === 0) return [];

  if (!shouldUseDemoData() && (await usesMediaRestUpload())) {
    const userType = await getRestUserType();
    const audience = userType === 'BUSINESS' ? 'business' : 'individual';
    return uploadMediaFiles(files, audience);
  }

  return files.map((f) => f.uri);
}
