import axios from 'axios';
import { Timestamp, GeoPoint } from 'firebase/firestore';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { isBackendId } from '@/lib/api/backendId';
import { hasRestAuthSession } from '@/lib/auth/sessionClaims';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { Business, BusinessCategory } from '@/types';
import { fetchBusinessProfile } from '@/features/auth/authApi';

type BusinessPublicProfileDto = {
  profileId?: string;
  ownerUserId?: string;
  businessName?: string;
  logoUrl?: string | null;
  category?: string;
  city?: string | null;
  district?: string | null;
  verified?: boolean;
  complaintListed?: boolean;
  isDangerous?: boolean;
  completedTaskCount?: number;
  approvedComplaintCount?: number;
  complaintRate?: number;
  averageRating?: number;
  feedbackCount?: number;
};

function mapBusinessCategory(raw?: string): BusinessCategory {
  const value = raw?.toUpperCase() ?? '';
  const map: Record<string, BusinessCategory> = {
    FOOD: 'food',
    BEAUTY: 'beauty',
    FITNESS: 'fitness',
    GYM: 'fitness',
    EDUCATION: 'education',
    RETAIL: 'retail',
    SERVICES: 'services',
    ENTERTAINMENT: 'entertainment',
    OTHER: 'other',
  };
  return map[value] ?? 'other';
}

function mapPublicBusiness(dto: BusinessPublicProfileDto): Business {
  const district = dto.district?.trim() ?? '';
  const city = dto.city?.trim() ?? '';
  const address = [district, city].filter(Boolean).join(', ') || 'Türkiye';

  return {
    id: String(dto.profileId ?? ''),
    ownerUid: String(dto.ownerUserId ?? ''),
    name: dto.businessName?.trim() || 'İşletme',
    category: mapBusinessCategory(dto.category),
    logoUrl: resolveMediaUrl(dto.logoUrl?.trim() ?? ''),
    address,
    location: new GeoPoint(41.0082, 28.9784),
    isVerified: dto.verified ?? false,
    verificationStatus: dto.verified ? 'verified' : 'none',
    reputationScore: Math.round((dto.averageRating ?? 0) * 10),
    complaintListed: dto.complaintListed ?? false,
    isDangerous: dto.isDangerous ?? false,
    completedTaskCount: dto.completedTaskCount ?? 0,
    approvedComplaintCount: dto.approvedComplaintCount ?? 0,
    complaintRate: dto.complaintRate ?? 0,
    averageRating: dto.averageRating ?? 0,
    feedbackCount: dto.feedbackCount ?? 0,
    totalTasksPublished: 0,
    createdAt: Timestamp.now(),
  };
}

function mapError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    return new Error(getApiErrorMessage(error, fallback));
  }
  if (error instanceof Error && error.message) return error;
  return new Error(fallback);
}

/** Herkese açık işletme profili — GET /api/business/profiles/{profileId}/public */
export async function fetchPublicBusinessProfile(profileId: string): Promise<Business | null> {
  if (!isBackendId(profileId)) return null;
  try {
    const { data } = await apiClient.get<BusinessPublicProfileDto>(
      `/api/business/profiles/${profileId}/public`
    );
    return mapPublicBusiness(data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw mapError(error, 'İşletme profili yüklenemedi.');
  }
}

/** Oturum açmış işletmenin kendi profilini Business tipine çevirir */
export async function fetchOwnBusinessProfile(ownerUid: string): Promise<Business | null> {
  try {
    const profile = await fetchBusinessProfile();
    return {
      id: profile.id,
      ownerUid,
      name: profile.businessName?.trim() || 'İşletme',
      category: mapBusinessCategory(profile.category),
      logoUrl: resolveMediaUrl(profile.logoUrl?.trim() ?? ''),
      address: `${profile.district ?? ''}, ${profile.city ?? ''}`.trim() || 'Türkiye',
      location: new GeoPoint(41.0082, 28.9784),
      isVerified: profile.verified ?? false,
      verificationStatus: profile.verified ? 'verified' : 'none',
      reputationScore: 0,
      totalTasksPublished: 0,
      createdAt: Timestamp.now(),
    };
  } catch {
    return null;
  }
}

export async function canFetchBusinessProfiles(): Promise<boolean> {
  return hasRestAuthSession();
}

export type BusinessSearchHit = {
  profileId: string;
  businessName: string;
  category: BusinessCategory;
  locationLabel: string;
  verified: boolean;
};

type BusinessSearchDto = {
  profileId?: string;
  businessName?: string;
  category?: string;
  city?: string | null;
  district?: string | null;
  verified?: boolean;
};

/** Şikayet formu — işletme adı ile arama */
export async function searchBusinessProfiles(query = ''): Promise<BusinessSearchHit[]> {
  const { data } = await apiClient.get<BusinessSearchDto[]>('/api/business/profiles/search', {
    params: query.trim() ? { q: query.trim() } : undefined,
  });
  if (!Array.isArray(data)) return [];
  return data.map((item) => {
    const district = item.district?.trim() ?? '';
    const city = item.city?.trim() ?? '';
    return {
      profileId: String(item.profileId ?? ''),
      businessName: item.businessName?.trim() || 'İşletme',
      category: mapBusinessCategory(item.category),
      locationLabel: [district, city].filter(Boolean).join(', '),
      verified: item.verified ?? false,
    };
  });
}

export type IndividualSearchHit = {
  profileId: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  completedTaskCount: number;
};

type IndividualSearchDto = {
  profileId?: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string | null;
  completedTaskCount?: number;
};

/** İşletme şikayet formu — kullanıcı adı araması */
export async function searchIndividualProfiles(query = ''): Promise<IndividualSearchHit[]> {
  const { data } = await apiClient.get<IndividualSearchDto[]>('/api/business/individuals/search', {
    params: query.trim() ? { q: query.trim() } : undefined,
  });
  if (!Array.isArray(data)) return [];
  return data.map((item) => ({
    profileId: String(item.profileId ?? ''),
    username: item.username?.trim() || '',
    fullName: item.fullName?.trim() || 'Kullanıcı',
    avatarUrl: item.avatarUrl?.trim() ? resolveMediaUrl(item.avatarUrl.trim()) : null,
    completedTaskCount: item.completedTaskCount ?? 0,
  }));
}
