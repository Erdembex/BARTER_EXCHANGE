import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { shouldUseDemoData } from '@/lib/devMode';

export interface LocalUploadFile {
  uri: string;
  name: string;
  mimeType: string;
}

export async function uploadFileToStorage(
  storagePath: string,
  localUri: string,
  mimeType: string
): Promise<string> {
  const storageRef = ref(storage, storagePath);
  const response = await fetch(localUri);
  const blob = await response.blob();
  await uploadBytes(storageRef, blob, { contentType: mimeType });
  return getDownloadURL(storageRef);
}

/** Demo modda Storage emülatörüne yükler; hata olursa yerel URI döner. Canlıda gerçek Storage. */
export async function uploadLocalFiles(
  basePath: string,
  files: LocalUploadFile[]
): Promise<string[]> {
  if (files.length === 0) return [];

  if (shouldUseDemoData()) {
    try {
      const urls: string[] = [];
      for (const file of files) {
        const path = `${basePath}/${Date.now()}-${file.name}`;
        urls.push(await uploadFileToStorage(path, file.uri, file.mimeType));
      }
      return urls;
    } catch {
      return files.map((f) => f.uri);
    }
  }

  const urls: string[] = [];
  for (const file of files) {
    const path = `${basePath}/${Date.now()}-${file.name}`;
    urls.push(await uploadFileToStorage(path, file.uri, file.mimeType));
  }
  return urls;
}
