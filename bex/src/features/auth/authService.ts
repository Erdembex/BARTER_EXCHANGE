import { Timestamp } from 'firebase/firestore';
import { AuthFormData, BexUser, UserRole } from '../../types';
import { resolveEffectiveRole } from '../../lib/devMode';
import { loadTokens, clearTokens, getAccessToken } from '../../lib/auth/tokenStorage';
import { decodeJwtPayload, isTokenExpired } from '../../lib/auth/jwtUtils';
import type { AuthSession } from './authTypes';
import {
  loginRequest,
  registerBusinessRequest,
  registerIndividualRequest,
  logoutRequest,
  fetchIndividualProfile,
  fetchBusinessProfile,
  updateIndividualProfile,
  updateBusinessProfile,
} from './authApi';
import { refreshAccessToken } from '../../lib/auth/authTokenRefresh';
import { uploadLocalFiles } from '../../lib/storageUpload';

export type { AuthSession } from './authTypes';

export function getAuthErrorMessage(code: string): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'Bu e-posta zaten kayıtlı.',
    'auth/invalid-email': 'Geçersiz e-posta adresi.',
    'auth/weak-password': 'Şifre en az 8 karakter, 1 rakam ve 1 büyük harf içermeli.',
    'auth/user-not-found': 'Bu e-posta ile kayıtlı hesap bulunamadı.',
    'auth/wrong-password': 'Şifre hatalı.',
    'auth/invalid-credential': 'E-posta veya şifre hatalı.',
    'auth/too-many-requests': 'Çok fazla başarısız deneme. Lütfen bekleyin.',
    'auth/network-request-failed':
      'Sunucuya bağlanılamadı. Backend çalışıyor mu? EXPO_PUBLIC_API_BASE_URL değerini kontrol et.',
    'auth/user-disabled': 'Bu hesap askıya alınmış.',
    'auth/not-authenticated': 'Oturum bulunamadı.',
    'auth/not-supported-yet': 'Bu özellik henüz yeni backend\'de aktif değil.',
    'invalid-name': 'Ad en az 2 karakter olmalı.',
  };
  return map[code] ?? `Bilinmeyen hata (${code})`;
}

function mapUserTypeToRole(userType: string | undefined, email?: string | null): UserRole {
  if (userType === 'ADMIN') return 'admin';
  const base: UserRole =
    userType === 'BUSINESS' ? 'business' : userType === 'INDIVIDUAL' ? 'user' : 'user';
  return resolveEffectiveRole(email, base);
}

function sessionFromAccessToken(accessToken: string, displayName?: string | null): AuthSession {
  const claims = decodeJwtPayload(accessToken);
  if (!claims?.sub) {
    throw Object.assign(new Error('Geçersiz oturum.'), { code: 'auth/not-authenticated' });
  }
  return {
    uid: claims.sub,
    email: claims.email ?? null,
    displayName: displayName ?? null,
  };
}

function mapProfileToBexUser(
  session: AuthSession,
  userType: string | undefined,
  profile: { displayName: string; phone?: string; avatarUrl?: string; verified?: boolean }
): BexUser {
  const email = session.email ?? '';
  const role = mapUserTypeToRole(userType, email);
  return {
    uid: session.uid,
    role,
    displayName: profile.displayName,
    email,
    phone: profile.phone ?? '',
    phoneVerified: false,
    avatarUrl: profile.avatarUrl ?? '',
    reputationScore: 0,
    completedTaskCount: 0,
    portfolioItems: [],
    joinedAt: Timestamp.now(),
    isBanned: false,
  };
}

async function ensureValidAccessToken(): Promise<string | null> {
  let accessToken = await getAccessToken();
  if (!accessToken) return null;
  if (!isTokenExpired(accessToken)) return accessToken;

  accessToken = await refreshAccessToken();
  return accessToken;
}

async function fetchProfileForSession(
  session: AuthSession,
  userType: string | undefined
): Promise<BexUser | null> {
  const token = await ensureValidAccessToken();
  if (!token) return null;

  try {
    if (userType === 'ADMIN') {
      return mapProfileToBexUser(session, userType, {
        displayName: session.displayName ?? session.email?.split('@')[0] ?? 'Admin',
      });
    }

    if (userType === 'BUSINESS') {
      const profile = await fetchBusinessProfile();
      return mapProfileToBexUser(session, userType, {
        displayName: profile.businessName,
        phone: profile.phone ?? '',
        avatarUrl: profile.logoUrl ?? '',
        verified: profile.verified,
      });
    }

    const profile = await fetchIndividualProfile();
    return mapProfileToBexUser(session, userType, {
      displayName: profile.fullName,
      avatarUrl: profile.avatarUrl ?? '',
    });
  } catch {
    return mapProfileToBexUser(session, userType, {
      displayName: session.displayName ?? session.email?.split('@')[0] ?? 'Kullanıcı',
    });
  }
}

export const authService = {
  async restoreSession(): Promise<{ session: AuthSession | null; bexUser: BexUser | null }> {
    const stored = await loadTokens();
    if (!stored) return { session: null, bexUser: null };

    let accessToken = stored.accessToken;
    if (isTokenExpired(accessToken)) {
      accessToken = (await refreshAccessToken()) ?? '';
      if (!accessToken) {
        await clearTokens();
        return { session: null, bexUser: null };
      }
    }

    const claims = decodeJwtPayload(accessToken);
    const session = sessionFromAccessToken(accessToken);
    const bexUser = await fetchProfileForSession(session, claims?.userType);
    if (bexUser) {
      session.displayName = bexUser.displayName;
    }
    return { session, bexUser };
  },

  async register(data: AuthFormData): Promise<{ user: AuthSession }> {
    const { email, password, displayName, role = 'user' } = data;
    const name = (displayName ?? '').trim();

    const authResponse =
      role === 'business'
        ? await registerBusinessRequest({
            email,
            password,
            businessName: name,
            category: 'OTHER',
            city: 'İstanbul',
            district: 'Merkez',
          })
        : await registerIndividualRequest({
            email,
            password,
            fullName: name,
            city: 'İstanbul',
            district: 'Merkez',
            skills: ['OTHER'],
          });

    const session = sessionFromAccessToken(authResponse.accessToken, name);
    return { user: session };
  },

  async login(email: string, password: string): Promise<{ user: AuthSession }> {
    const authResponse = await loginRequest({ email, password });
    const session = sessionFromAccessToken(authResponse.accessToken);
    return { user: session };
  },

  async logout() {
    const refreshToken = (await loadTokens())?.refreshToken;
    if (refreshToken) {
      await logoutRequest(refreshToken);
    }
    await clearTokens();
  },

  async resetPassword(_email: string) {
    throw Object.assign(
      new Error('Şifre sıfırlama henüz yeni backend\'de aktif değil.'),
      { code: 'auth/not-supported-yet' }
    );
  },

  async updateDisplayName(uid: string, displayName: string): Promise<BexUser | null> {
    const trimmed = displayName.trim();
    if (trimmed.length < 2) {
      throw Object.assign(new Error('Ad en az 2 karakter olmalı.'), { code: 'invalid-name' });
    }

    const token = await ensureValidAccessToken();
    if (!token) {
      throw Object.assign(new Error('Oturum bulunamadı.'), { code: 'auth/not-authenticated' });
    }

    const claims = decodeJwtPayload(token);
    if (claims?.sub !== uid) {
      throw Object.assign(new Error('Oturum bulunamadı.'), { code: 'auth/not-authenticated' });
    }

    if (claims.userType === 'BUSINESS') {
      const current = await fetchBusinessProfile();
      await updateBusinessProfile({ ...current, businessName: trimmed });
    } else {
      const current = await fetchIndividualProfile();
      await updateIndividualProfile({ ...current, fullName: trimmed });
    }

    const session = sessionFromAccessToken(token, trimmed);
    return fetchProfileForSession(session, claims.userType);
  },

  async updateAvatar(
    uid: string,
    localUri: string,
    mimeType: string,
    fileName: string
  ): Promise<BexUser | null> {
    const token = await ensureValidAccessToken();
    if (!token) {
      throw Object.assign(new Error('Oturum bulunamadı.'), { code: 'auth/not-authenticated' });
    }

    const claims = decodeJwtPayload(token);
    if (claims?.sub !== uid) {
      throw Object.assign(new Error('Oturum bulunamadı.'), { code: 'auth/not-authenticated' });
    }

    const [avatarUrl] = await uploadLocalFiles(`avatars/${uid}`, [
      { uri: localUri, name: fileName, mimeType },
    ]);

    if (claims.userType === 'BUSINESS') {
      const current = await fetchBusinessProfile();
      await updateBusinessProfile({ ...current, logoUrl: avatarUrl });
    } else {
      const current = await fetchIndividualProfile();
      await updateIndividualProfile({ ...current, avatarUrl });
    }

    const session = sessionFromAccessToken(token);
    return fetchProfileForSession(session, claims.userType);
  },

  async getUserDocument(
    uid: string,
    fallback?: { email?: string | null; displayName?: string | null }
  ): Promise<BexUser | null> {
    const token = await ensureValidAccessToken();
    if (!token) {
      if (fallback?.email) {
        return {
          uid,
          role: resolveEffectiveRole(fallback.email, 'user'),
          displayName: fallback.displayName ?? fallback.email.split('@')[0] ?? 'Kullanıcı',
          email: fallback.email,
          phone: '',
          phoneVerified: false,
          avatarUrl: '',
          reputationScore: 0,
          completedTaskCount: 0,
          portfolioItems: [],
          joinedAt: Timestamp.now(),
          isBanned: false,
        };
      }
      return null;
    }

    const claims = decodeJwtPayload(token);
    if (claims?.sub && claims.sub !== uid) return null;

    const session: AuthSession = {
      uid: claims?.sub ?? uid,
      email: claims?.email ?? fallback?.email ?? null,
      displayName: fallback?.displayName ?? null,
    };

    return fetchProfileForSession(session, claims?.userType);
  },
};
