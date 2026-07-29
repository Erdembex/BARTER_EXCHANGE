import { API_BASE_URL } from '@/lib/api/config';

const HEALTH_PATH = '/actuator/health';
const TIMEOUT_MS = 5000;

/** Sunucu yanıt veriyorsa true (503 mail servisi kapalı olsa bile). */
export async function checkBackendReachable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(`${API_BASE_URL}${HEALTH_PATH}`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.status === 200 || res.status === 503;
  } catch {
    return false;
  }
}
