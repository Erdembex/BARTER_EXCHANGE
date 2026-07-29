import axios from 'axios';
import { apiClient, getApiErrorMessage } from '@/lib/api';

let pendingRestPhone: string | null = null;

function mapPhoneError(error: unknown, fallback: string): Error & { code?: string } {
  if (axios.isAxiosError(error)) {
    const message = getApiErrorMessage(error, fallback);
    if (message.includes('Geçerli bir telefon')) {
      return Object.assign(new Error(message), { code: 'invalid-phone' });
    }
    if (message.includes('süresi dolmuş')) {
      return Object.assign(new Error(message), { code: 'auth/code-expired' });
    }
    if (message.includes('hatalı')) {
      return Object.assign(new Error(message), { code: 'auth/invalid-verification-code' });
    }
    if (!error.response) {
      return Object.assign(new Error('Sunucuya bağlanılamadı.'), {
        code: 'auth/network-request-failed',
      });
    }
    return Object.assign(new Error(message), { code: 'auth/unknown' });
  }
  if (error instanceof Error) return error;
  return Object.assign(new Error(fallback), { code: 'auth/unknown' });
}

/** POST /api/auth/phone/send-code — geliştirmede devCode dönebilir */
export async function sendRestPhoneCode(phone: string): Promise<string | null> {
  try {
    const { data } = await apiClient.post<{ devCode?: string }>(
      '/api/auth/phone/send-code',
      { phone }
    );
    pendingRestPhone = phone;
    return data?.devCode?.trim() || null;
  } catch (error) {
    throw mapPhoneError(error, 'Doğrulama kodu gönderilemedi.');
  }
}

/** POST /api/auth/phone/verify */
export async function verifyRestPhoneCode(phone: string, code: string): Promise<void> {
  try {
    await apiClient.post('/api/auth/phone/verify', { phone, code });
    pendingRestPhone = null;
  } catch (error) {
    throw mapPhoneError(error, 'Telefon doğrulanamadı.');
  }
}

export function getPendingRestPhone(): string | null {
  return pendingRestPhone;
}

export function clearPendingRestPhone(): void {
  pendingRestPhone = null;
}
