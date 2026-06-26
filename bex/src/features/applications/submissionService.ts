import { uploadLocalFiles } from '@/lib/storageUpload';

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
  return uploadLocalFiles(`submissions/${userId}/${applicationId}`, files);
}
