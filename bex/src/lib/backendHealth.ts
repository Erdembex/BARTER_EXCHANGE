import { apiClient } from '@/lib/api/axiosInstance';

const HEALTH_PATH = '/actuator/health';

/** Sunucu yanıt veriyorsa true (503 mail servisi kapalı olsa bile). */
export async function checkBackendReachable(): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await apiClient.get(HEALTH_PATH, { timeout: 20_000 });
      if (res.status === 200 || res.status === 503) return true;
    } catch {
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }
  return false;
}
