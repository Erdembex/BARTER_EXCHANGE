import axios from 'axios';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { hasRestAuthSession } from '@/lib/auth/sessionClaims';
import type { LocalUploadFile } from '@/lib/storageUpload';

type UploadResponseDto = {
  urls?: string[];
};

function mapUploadError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    return new Error(getApiErrorMessage(error, fallback));
  }
  if (error instanceof Error && error.message) return error;
  return new Error(fallback);
}

/** POST /api/individual/uploads veya /api/business/uploads (multipart) */
export async function uploadMediaFiles(
  files: LocalUploadFile[],
  audience: 'individual' | 'business' = 'individual'
): Promise<string[]> {
  if (files.length === 0) return [];

  const formData = new FormData();
  for (const file of files) {
    formData.append('files', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as unknown as Blob);
  }

  const path =
    audience === 'business' ? '/api/business/uploads' : '/api/individual/uploads';

  try {
    const { data } = await apiClient.post<UploadResponseDto>(path, formData, {
      timeout: 60_000,
    });
    const urls = Array.isArray(data.urls) ? data.urls : [];
    if (urls.length === 0) {
      throw new Error('Sunucu dosya URL\'si döndürmedi.');
    }
    return urls;
  } catch (error) {
    throw mapUploadError(error, 'Fotoğraflar yüklenemedi.');
  }
}

export async function usesMediaRestUpload(): Promise<boolean> {
  return hasRestAuthSession();
}
