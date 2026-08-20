import axios from 'axios';
import { getApiErrorMessage } from '@/lib/api';
import { API_BASE_URL } from '@/lib/api/config';
import { getAccessToken } from '@/lib/auth/tokenStorage';
import { hasRestAuthSession } from '@/lib/auth/sessionClaims';
import type { LocalUploadFile } from '@/lib/storageUpload';

type UploadResponseDto = {
  urls?: string[];
  message?: string;
  error?: string;
};

function mapUploadError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    return new Error(getApiErrorMessage(error, fallback));
  }
  if (error instanceof Error && error.message) return error;
  return new Error(fallback);
}

function appendUploadFile(formData: FormData, field: string, file: LocalUploadFile) {
  formData.append(field, {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);
}

/** RN/Expo: axios multipart bazen boş gider; fetch ile yükle. */
async function postMultipart(
  path: string,
  buildFormData: (formData: FormData) => void
): Promise<UploadResponseDto> {
  const formData = new FormData();
  buildFormData(formData);

  const token = await getAccessToken();
  const url = `${API_BASE_URL.replace(/\/$/, '')}${path}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  let data: UploadResponseDto = {};
  const raw = await response.text();
  if (raw) {
    try {
      data = JSON.parse(raw) as UploadResponseDto;
    } catch {
      if (!response.ok) {
        throw new Error(raw.slice(0, 200) || `HTTP ${response.status}`);
      }
    }
  }

  if (!response.ok) {
    const msg =
      data.message ||
      data.error ||
      (response.status >= 500 ? 'Sunucu hatası. Biraz sonra tekrar dene.' : 'Fotoğraflar yüklenemedi.');
    throw new Error(msg);
  }

  return data;
}

/** POST /api/individual/uploads veya /api/business/uploads (multipart) */
export async function uploadMediaFiles(
  files: LocalUploadFile[],
  audience: 'individual' | 'business' = 'individual'
): Promise<string[]> {
  if (files.length === 0) return [];

  const path =
    audience === 'business' ? '/api/business/uploads' : '/api/individual/uploads';

  try {
    const data = await postMultipart(path, (formData) => {
      for (const file of files) {
        appendUploadFile(formData, 'files', file);
      }
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

/** POST /api/individual/uploads/cv — PDF CV */
export async function uploadCvFile(localUri: string, fileName: string): Promise<string> {
  const normalizedName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;

  try {
    const data = await postMultipart('/api/individual/uploads/cv', (formData) => {
      appendUploadFile(formData, 'file', {
        uri: localUri,
        name: normalizedName,
        mimeType: 'application/pdf',
      });
    });
    const url = data.urls?.[0]?.trim();
    if (!url) throw new Error('Sunucu CV URL\'si döndürmedi.');
    return url;
  } catch (error) {
    throw mapUploadError(error, 'CV yüklenemedi.');
  }
}
