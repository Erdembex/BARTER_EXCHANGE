export interface JwtClaims {
  sub: string;
  email?: string;
  userType?: string;
  profileId?: string;
  exp?: number;
}

export function decodeJwtPayload(token: string): JwtClaims | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const json =
      typeof atob === 'function'
        ? atob(base64)
        : Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, skewSeconds = 30): boolean {
  const claims = decodeJwtPayload(token);
  if (!claims?.exp) return true;
  return Date.now() >= claims.exp * 1000 - skewSeconds * 1000;
}
