import axios from 'axios';
import { Timestamp } from 'firebase/firestore';
import { apiClient, getApiErrorMessage } from '@/lib/api';
import { BexUser, UserRole } from '@/types';

export type AdminUserDto = {
  userId: string;
  email: string;
  displayName: string;
  userType: string;
  status: string;
  completedTaskCount: number;
  reputationScore: number;
};

function mapUserType(userType?: string): UserRole {
  switch (userType?.toUpperCase()) {
    case 'ADMIN':
      return 'admin';
    case 'BUSINESS':
      return 'business';
    default:
      return 'user';
  }
}

function mapToBexUser(dto: AdminUserDto): BexUser {
  return {
    uid: dto.userId,
    role: mapUserType(dto.userType),
    displayName: dto.displayName?.trim() || dto.email,
    email: dto.email,
    phone: '',
    phoneVerified: false,
    avatarUrl: '',
    reputationScore: dto.reputationScore ?? 0,
    completedTaskCount: dto.completedTaskCount ?? 0,
    portfolioItems: [],
    joinedAt: Timestamp.now(),
    isBanned: dto.status?.toUpperCase() === 'SUSPENDED',
  };
}

function mapError(error: unknown, fallback: string): Error {
  if (axios.isAxiosError(error)) {
    return new Error(getApiErrorMessage(error, fallback));
  }
  if (error instanceof Error && error.message) return error;
  return new Error(fallback);
}

/** GET /api/admin/users?q=... */
export async function searchAdminUsers(query?: string): Promise<BexUser[]> {
  try {
    const { data } = await apiClient.get<AdminUserDto[]>('/api/admin/users', {
      params: query?.trim() ? { q: query.trim() } : undefined,
    });
    if (!Array.isArray(data)) return [];
    return data.map(mapToBexUser);
  } catch (error) {
    throw mapError(error, 'Kullanıcı listesi yüklenemedi.');
  }
}

/** PATCH /api/admin/users/{userId}/suspend?suspended=true|false */
export async function setAdminUserSuspended(userId: string, suspended: boolean): Promise<void> {
  try {
    await apiClient.patch(`/api/admin/users/${userId}/suspend`, null, {
      params: { suspended },
    });
  } catch (error) {
    throw mapError(error, suspended ? 'Hesap askıya alınamadı.' : 'Askı kaldırılamadı.');
  }
}
