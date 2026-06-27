import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { shouldUseDemoData } from '@/lib/devMode';

export interface LocalUploadFile {
  uri: string;
  name: string;
  mimeType: string;
}

const UPLOAD_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(
        () => reject(new Error(`${label} zaman aşımına uğradı. Emülatör veya internet bağlantını kontrol et.`)),
        UPLOAD_TIMEOUT_MS
      );
    }),
  ]);
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

/**
 * Demo modda Storage emülatörü (9199) genelde kapalı — yerel URI kullan.
 * Canlıda Firebase Storage'a yükler; hata olursa fırlatır.
 */
export async function uploadLocalFiles(
  basePath: string,
  files: LocalUploadFile[]
): Promise<string[]> {
  if (files.length === 0) return [];

  if (shouldUseDemoData()) {
    return files.map((f) => f.uri);
  }

  const urls: string[] = [];
  for (const file of files) {
    const path = `${basePath}/${Date.now()}-${file.name}`;
    urls.push(
      await withTimeout(
        uploadFileToStorage(path, file.uri, file.mimeType),
        'Fotoğraf yüklemesi'
      )
    );
  }
  return urls;
}
