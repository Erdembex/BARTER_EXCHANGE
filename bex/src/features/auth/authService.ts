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
import { resolveMediaUrl } from '../../lib/mediaUrl';
import { fetchMyPublicProfile } from '../portfolio/publicProfileApi';

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
    'auth/invalid-reset-token': 'Geçersiz veya süresi dolmuş sıfırlama kodu.',
    'auth/same-password': 'Yeni şifre mevcut şifre ile aynı olamaz.',
    'invalid-name': 'Ad en az 2 karakter olmalı.',
    'invalid-username': 'Kullanıcı adı 3-30 karakter olmalı (a-z, 0-9, _).',
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
  profile: {
    displayName: string;
    username?: string;
    phone?: string;
    phoneVerified?: boolean;
    avatarUrl?: string;
    verified?: boolean;
    completedTaskCount?: number;
    reputationScore?: number;
  }
): BexUser {
  const email = session.email ?? '';
  const role = mapUserTypeToRole(userType, email);
  return {
    uid: session.uid,
    role,
    displayName: profile.displayName,
    username: profile.username,
    email,
    phone: profile.phone ?? '',
    phoneVerified: profile.phoneVerified ?? false,
    avatarUrl: profile.avatarUrl ?? '',
    reputationScore: profile.reputationScore ?? 0,
    completedTaskCount: profile.completedTaskCount ?? 0,
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
        phoneVerified: profile.phoneVerified ?? false,
        avatarUrl: resolveMediaUrl(profile.logoUrl ?? ''),
        verified: profile.verified,
      });
    }

    const profile = await fetchIndividualProfile();
    let completedTaskCount = 0;
    try {
      const publicProfile = await fetchMyPublicProfile();
      if (publicProfile) {
        completedTaskCount = publicProfile.completedTaskCount;
      }
    } catch {
      // istatistikler opsiyonel
    }

    return mapProfileToBexUser(session, userType, {
      displayName: profile.fullName,
      username: profile.username,
      phone: profile.phone ?? '',
      phoneVerified: profile.phoneVerified ?? false,
      avatarUrl: resolveMediaUrl(profile.avatarUrl ?? ''),
      completedTaskCount,
      reputationScore: completedTaskCount,
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

  async resetPassword(email: string) {
    const { forgotPasswordRequest } = await import('./authApi');
    await forgotPasswordRequest(email);
  },

  async completePasswordReset(token: string, newPassword: string) {
    const { resetPasswordRequest } = await import('./authApi');
    await resetPasswordRequest(token, newPassword);
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const { changePasswordRequest } = await import('./authApi');
    await changePasswordRequest(currentPassword, newPassword);
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

  async updateUsername(uid: string, username: string): Promise<BexUser | null> {
    const normalized = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (normalized.length < 3 || normalized.length > 30) {
      throw Object.assign(
        new Error('Kullanıcı adı 3-30 karakter olmalı (a-z, 0-9, _).'),
        { code: 'invalid-username' }
      );
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
      throw Object.assign(new Error('İşletme hesapları kullanıcı adı kullanmaz.'), {
        code: 'not-supported-yet',
      });
    }

    const current = await fetchIndividualProfile();
    await updateIndividualProfile({ ...current, username: normalized });

    const session = sessionFromAccessToken(token);
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
    if (!avatarUrl?.trim()) {
      throw Object.assign(new Error('Fotoğraf yüklenemedi.'), { code: 'upload-failed' });
    }

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

  /** Oturum açıkken profil bilgisini backend'den yeniler (avatar vb.). */
  async refreshProfile(): Promise<BexUser | null> {
    const token = await ensureValidAccessToken();
    if (!token) return null;

    const claims = decodeJwtPayload(token);
    if (!claims?.sub) return null;

    const session = sessionFromAccessToken(token);
    const bexUser = await fetchProfileForSession(session, claims.userType);
    if (bexUser) {
      session.displayName = bexUser.displayName;
    }
    return bexUser;
  },
};
