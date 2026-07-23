import { ImageSourcePropType } from 'react-native';
import { apiClient } from '@/lib/api/axiosInstance';
import { getAccessToken } from '@/lib/auth/tokenStorage';
import { refreshAccessToken } from '@/lib/auth/authTokenRefresh';
import { isTokenExpired } from '@/lib/auth/jwtUtils';
import { normalizeUploadPath, resolveMediaUrl } from '@/lib/mediaUrl';

const dataUriCache = new Map<string, string>();

export function isProtectedUploadUrl(url: string): boolean {
  if (!url?.trim()) return false;
  return normalizeUploadPath(url).startsWith('/uploads/');
}

async function getValidAccessToken(): Promise<string | null> {
  let token = await getAccessToken();
  if (!token) return null;
  if (isTokenExpired(token)) {
    token = await refreshAccessToken();
  }
  return token;
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof globalThis.btoa === 'function') {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return globalThis.btoa(binary);
  }

  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    const triple = (a << 16) | (b << 8) | c;
    output += alphabet[(triple >> 18) & 63];
    output += alphabet[(triple >> 12) & 63];
    output += i + 1 < bytes.length ? alphabet[(triple >> 6) & 63] : '=';
    output += i + 2 < bytes.length ? alphabet[triple & 63] : '=';
  }
  return output;
}

/** RN Image Authorization header desteği zayıf — korumalı dosyalar axios ile indirilir. */
async function fetchProtectedUploadAsDataUri(
  uploadPath: string,
  forceRefresh = false
): Promise<string | null> {
  const path = normalizeUploadPath(uploadPath);
  if (!path.startsWith('/uploads/')) return null;

  if (!forceRefresh && dataUriCache.has(path)) {
    return dataUriCache.get(path)!;
  }

  if (forceRefresh) {
    await refreshAccessToken();
    dataUriCache.delete(path);
  }

  const token = await getValidAccessToken();
  if (!token) return null;

  try {
    const { data, headers } = await apiClient.get<ArrayBuffer>(path, {
      responseType: 'arraybuffer',
      headers: { Accept: 'image/*,*/*' },
    });
    const contentType =
      (headers['content-type'] as string | undefined)?.split(';')[0]?.trim() ||
      'image/jpeg';
    const base64 = bytesToBase64(new Uint8Array(data));
    const dataUri = `data:${contentType};base64,${base64}`;
    dataUriCache.set(path, dataUri);
    return dataUri;
  } catch {
    return null;
  }
}

export async function buildAuthenticatedImageSource(
  url: string,
  options?: { forceRefresh?: boolean }
): Promise<ImageSourcePropType | null> {
  if (!url?.trim()) return null;

  if (url.startsWith('data:')) {
    return { uri: url };
  }

  if (!isProtectedUploadUrl(url)) {
    return { uri: resolveMediaUrl(url) };
  }

  const dataUri = await fetchProtectedUploadAsDataUri(url, options?.forceRefresh);
  if (dataUri) {
    return { uri: dataUri };
  }

  // Son çare — header ile dene (web vb.)
  const token = await getValidAccessToken();
  const uri = resolveMediaUrl(url);
  if (token) {
    return { uri, headers: { Authorization: `Bearer ${token}` } };
  }
  return { uri };
}

export function clearAuthenticatedImageCache(): void {
  dataUriCache.clear();
}
