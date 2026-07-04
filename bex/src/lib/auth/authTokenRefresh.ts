import axios from 'axios';
import { API_BASE_URL } from '@/lib/api/config';
import { saveTokens, getRefreshToken, clearTokens } from '@/lib/auth/tokenStorage';
import type { AuthResponseDto } from '@/features/auth/authTypes';

let refreshInFlight: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    try {
      const { data } = await axios.post<AuthResponseDto>(
        `${API_BASE_URL}/api/auth/refresh`,
        { refreshToken },
        {
          timeout: 20_000,
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        }
      );
      await saveTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch {
      await clearTokens();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}
