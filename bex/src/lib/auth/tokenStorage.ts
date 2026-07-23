import { deleteSecureItem, getSecureItem, setSecureItem } from '@/lib/secureStorage';

const ACCESS_TOKEN_KEY = 'bex_access_token';
const REFRESH_TOKEN_KEY = 'bex_refresh_token';

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
}

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  await setSecureItem(ACCESS_TOKEN_KEY, accessToken);
  await setSecureItem(REFRESH_TOKEN_KEY, refreshToken);
}

export async function getAccessToken(): Promise<string | null> {
  return getSecureItem(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return getSecureItem(REFRESH_TOKEN_KEY);
}

export async function loadTokens(): Promise<StoredTokens | null> {
  const accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function clearTokens(): Promise<void> {
  await deleteSecureItem(ACCESS_TOKEN_KEY);
  await deleteSecureItem(REFRESH_TOKEN_KEY);
}
