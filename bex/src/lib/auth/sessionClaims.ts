import { getAccessToken } from './tokenStorage';
import { decodeJwtPayload, JwtClaims } from './jwtUtils';

export async function getSessionClaims(): Promise<JwtClaims | null> {
  const token = await getAccessToken();
  if (!token) return null;
  return decodeJwtPayload(token);
}

export async function hasRestAuthSession(): Promise<boolean> {
  return !!(await getAccessToken());
}

export async function getRestProfileId(): Promise<string | null> {
  const claims = await getSessionClaims();
  return claims?.profileId ?? null;
}

export async function getRestUserType(): Promise<string | null> {
  const claims = await getSessionClaims();
  return claims?.userType ?? null;
}
