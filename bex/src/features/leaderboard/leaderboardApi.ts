import { apiClient } from '@/lib/api';

export type LeaderboardEntry = {
  rank: number;
  profileId: string;
  name: string;
  subtitle: string;
  rewardCount: number;
  avatarUrl?: string | null;
};

type LeaderboardEntryDto = {
  rank: number;
  profileId: string;
  name: string;
  subtitle: string;
  rewardCount: number;
  avatarUrl?: string | null;
};

function mapEntry(dto: LeaderboardEntryDto): LeaderboardEntry {
  return {
    rank: dto.rank,
    profileId: dto.profileId,
    name: dto.name,
    subtitle: dto.subtitle ?? '',
    rewardCount: dto.rewardCount,
    avatarUrl: dto.avatarUrl,
  };
}

export async function fetchTopEarners(limit = 20): Promise<LeaderboardEntry[]> {
  const { data } = await apiClient.get<LeaderboardEntryDto[]>('/api/leaderboard/top-earners', {
    params: { limit },
  });
  return Array.isArray(data) ? data.map(mapEntry) : [];
}

export async function fetchTopGivers(limit = 20): Promise<LeaderboardEntry[]> {
  const { data } = await apiClient.get<LeaderboardEntryDto[]>('/api/leaderboard/top-givers', {
    params: { limit },
  });
  return Array.isArray(data) ? data.map(mapEntry) : [];
}
