import { API_BASE_URL } from '@/lib/api/config';

/** Tam URL'den `/uploads/...` yolunu çıkarır; backend erişim kontrolü için gerekli. */
export function normalizeUploadPath(url: string): string {
  if (!url?.trim()) return '';
  const trimmed = url.trim();
  const uploadsIndex = trimmed.indexOf('/uploads/');
  if (uploadsIndex >= 0) {
    return trimmed.slice(uploadsIndex);
  }
  return trimmed;
}

/** Backend localhost URL'lerini cihazdan erişilebilir API adresine çevirir. */
export function resolveMediaUrl(url: string): string {
  if (!url?.trim()) return url;
  const trimmed = url.trim();

  if (
    trimmed.startsWith('file:') ||
    trimmed.startsWith('content:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  if (trimmed.startsWith('/uploads/')) {
    return `${API_BASE_URL.replace(/\/$/, '')}${trimmed}`;
  }

  try {
    const media = new URL(trimmed);
    if (media.hostname === 'localhost' || media.hostname === '127.0.0.1') {
      const api = new URL(API_BASE_URL);
      media.protocol = api.protocol;
      media.hostname = api.hostname;
      media.port = api.port;
      return media.toString();
    }
    return media.toString();
  } catch {
    return trimmed;
  }
}
