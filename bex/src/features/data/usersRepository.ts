import { shouldUseDemoData } from '@/lib/devMode';
import { getDevProfile, loadDevProfiles, setDevProfile } from '@/lib/devProfileStore';
import { getUserPortfolio } from '@/features/portfolio';
import { hasRestAuthSession } from '@/lib/auth/sessionClaims';
import {
  fetchMyPublicProfile,
  fetchPublicProfile,
} from '@/features/portfolio/publicProfileApi';
import { PortfolioItem } from '@/types';

export const usersRepository = {
  async getDisplayName(uid: string): Promise<string> {
    if (await hasRestAuthSession()) {
      try {
        const profile = await fetchPublicProfile(uid);
        if (profile?.fullName) return profile.fullName;
      } catch {
        // devProfile yedeğine düş
      }
    }

    await loadDevProfiles();
    const profile = getDevProfile(uid);
    if (profile?.displayName?.trim()) {
      return profile.displayName.trim();
    }
    return `Kullanıcı ${uid.slice(-4)}`;
  },

  async getPortfolio(userId: string): Promise<PortfolioItem[]> {
    if (await hasRestAuthSession()) {
      try {
        const profile = await fetchPublicProfile(userId);
        return profile?.portfolio ?? [];
      } catch {
        return [];
      }
    }

    if (shouldUseDemoData()) {
      return getUserPortfolio(userId);
    }
    return [];
  },

  async getPublicProfileStats(userId: string): Promise<{
    completedTaskCount: number;
    portfolio: PortfolioItem[];
    displayName: string;
  } | null> {
    if (await hasRestAuthSession()) {
      try {
        const profile = await fetchPublicProfile(userId);
        if (!profile) return null;
        return {
          completedTaskCount: profile.completedTaskCount,
          portfolio: profile.portfolio,
          displayName: profile.fullName,
        };
      } catch {
        return null;
      }
    }
    return null;
  },

  async getMyPublicProfileStats(): Promise<{
    profileId: string;
    completedTaskCount: number;
    portfolio: PortfolioItem[];
    displayName: string;
  } | null> {
    if (!(await hasRestAuthSession())) return null;
    try {
      const profile = await fetchMyPublicProfile();
      if (!profile) return null;
      return {
        profileId: profile.profileId,
        completedTaskCount: profile.completedTaskCount,
        portfolio: profile.portfolio,
        displayName: profile.fullName,
      };
    } catch {
      return null;
    }
  },

  async getDisplayNames(uids: string[]): Promise<Record<string, string>> {
    const unique = [...new Set(uids)];
    const result: Record<string, string> = {};
    await Promise.all(
      unique.map(async (uid) => {
        result[uid] = await this.getDisplayName(uid);
      })
    );
    return result;
  },

  async incrementCompletedTasks(uid: string, reputationGain = 10): Promise<void> {
    await loadDevProfiles();
    const profile = getDevProfile(uid);
    const count = (profile?.completedTaskCount ?? 0) + 1;
    const reputationScore = (profile?.reputationScore ?? 0) + reputationGain;
    await setDevProfile(uid, { completedTaskCount: count, reputationScore });
  },
};
