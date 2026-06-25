import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { shouldUseDemoData } from '@/lib/devMode';

export interface SubmissionFile {
  uri: string;
  name: string;
  mimeType: string;
}

export async function uploadSubmissionFiles(
  applicationId: string,
  userId: string,
  files: SubmissionFile[]
): Promise<string[]> {
  if (files.length === 0) return [];

  if (shouldUseDemoData()) {
    return files.map((f) => f.uri);
  }

  const urls: string[] = [];
  for (const file of files) {
    const path = `submissions/${userId}/${applicationId}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, path);
    const response = await fetch(file.uri);
    const blob = await response.blob();
    await uploadBytes(storageRef, blob, { contentType: file.mimeType });
    urls.push(await getDownloadURL(storageRef));
  }
  return urls;
}
