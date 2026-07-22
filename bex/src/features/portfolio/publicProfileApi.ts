import axios from 'axios';
import { Timestamp } from 'firebase/firestore';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { isBackendId } from '@/lib/api/backendId';
import { getSessionClaims, hasRestAuthSession } from '@/lib/auth/sessionClaims';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { PortfolioItem } from '@/types';

export type PublicProfileDto = {
  profileId?: string;
  fullName?: string;
  avatarUrl?: string | null;
  completedTaskCount?: number;
  portfolioItems?: Array<{
    applicationId?: string;
    listingTitle?: string;
    imageUrl?: string;
    approvedAt?: string;
  }>;
};

export type PublicUserProfile = {
  profileId: string;
  fullName: string;
  avatarUrl: string | null;
  completedTaskCount: number;
  portfolio: PortfolioItem[];
};

function toTimestamp(value?: string): Timestamp {
  if (!value) return Timestamp.now();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? Timestamp.now() : Timestamp.fromDate(date);
}

function mapPublicProfile(dto: PublicProfileDto): PublicUserProfile {
  const profileId = String(dto.profileId ?? '');
  const portfolio = (dto.portfolioItems ?? []).map((item, index) => ({
    id: `${item.applicationId ?? 'app'}-${index}`,
    imageUrl: resolveMediaUrl(String(item.imageUrl ?? '')),
    taskTitle: item.listingTitle?.trim() || 'Görev',
    applicationId: String(item.applicationId ?? ''),
    approvedAt: toTimestamp(item.approvedAt),
  }));

  return {
    profileId,
    fullName: dto.fullName?.trim() || 'Kullanıcı',
    avatarUrl: dto.avatarUrl?.trim() || null,
    completedTaskCount: dto.completedTaskCount ?? 0,
    portfolio,
  };
}

function mapError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    return new Error(getApiErrorMessage(error, fallback));
  }
  if (error instanceof Error && error.message) return error;
  return new Error(fallback);
}

/** profileId ile herkese açık profil */
export async function fetchPublicProfileByProfileId(
  profileId: string
): Promise<PublicUserProfile | null> {
  if (!isBackendId(profileId)) return null;
  try {
    const { data } = await apiClient.get<PublicProfileDto>(
      `/api/individual/profiles/${profileId}/public`
    );
    return mapPublicProfile(data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw mapError(error, 'Profil yüklenemedi.');
  }
}

/** userId ile herkese açık profil */
export async function fetchPublicProfileByUserId(
  userId: string
): Promise<PublicUserProfile | null> {
  if (!isBackendId(userId)) return null;
  try {
    const { data } = await apiClient.get<PublicProfileDto>(
      `/api/users/${userId}/public-profile`
    );
    return mapPublicProfile(data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw mapError(error, 'Profil yüklenemedi.');
  }
}

/**
 * id hem userId hem profileId olabilir.
 * Önce profileId dener; bulunamazsa userId endpoint'ine düşer.
 */
export async function fetchPublicProfile(id: string): Promise<PublicUserProfile | null> {
  if (!(await hasRestAuthSession()) || !isBackendId(id)) return null;

  const byProfile = await fetchPublicProfileByProfileId(id);
  if (byProfile) return byProfile;

  return fetchPublicProfileByUserId(id);
}

/** Oturum açmış kullanıcının kendi public profilini döndürür */
export async function fetchMyPublicProfile(): Promise<PublicUserProfile | null> {
  const claims = await getSessionClaims();
  const profileId = claims?.profileId;
  if (!profileId) return null;
  return fetchPublicProfileByProfileId(profileId);
}
