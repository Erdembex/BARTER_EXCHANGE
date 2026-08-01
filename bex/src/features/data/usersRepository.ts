import { shouldUseDemoData } from '@/lib/devMode';
import { isBackendId } from '@/lib/api/backendId';
import { getDevProfile, loadDevProfiles, setDevProfile } from '@/lib/devProfileStore';
import { getUserPortfolio } from '@/features/portfolio';
import { hasRestAuthSession } from '@/lib/auth/sessionClaims';
import {
  fetchMyPublicProfile,
  fetchPublicProfile,
  fetchPublicProfileByProfileId,
  fetchPublicProfileByUsername,
} from '@/features/portfolio/publicProfileApi';
import { PortfolioItem, CompletedTask } from '@/types';

export const usersRepository = {
  async getDisplayName(uid: string): Promise<string> {
    if (await hasRestAuthSession()) {
      try {
        const profile = isBackendId(uid)
          ? await fetchPublicProfileByProfileId(uid)
          : await fetchPublicProfile(uid);
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
        const profile = isBackendId(userId)
          ? await fetchPublicProfileByProfileId(userId)
          : await fetchPublicProfile(userId);
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
    profileId: string;
    username: string;
    completedTaskCount: number;
    completedTasks: CompletedTask[];
    portfolio: PortfolioItem[];
    displayName: string;
    avatarUrl: string | null;
    averageRating: number;
    feedbackCount: number;
    approvedComplaintCount: number;
    complaintRate: number;
    isDangerous: boolean;
  } | null> {
    if (await hasRestAuthSession()) {
      try {
        const profile = await fetchPublicProfile(userId);
        if (!profile) return null;
        return {
          profileId: profile.profileId,
          username: profile.username,
          completedTaskCount: profile.completedTaskCount,
          completedTasks: profile.completedTasks,
          portfolio: profile.portfolio,
          displayName: profile.username ? `@${profile.username}` : profile.fullName,
          avatarUrl: profile.avatarUrl,
          averageRating: profile.averageRating,
          feedbackCount: profile.feedbackCount,
          approvedComplaintCount: profile.approvedComplaintCount,
          complaintRate: profile.complaintRate,
          isDangerous: profile.isDangerous,
        };
      } catch {
        return null;
      }
    }
    return null;
  },

  async getPublicProfileByUsername(username: string): Promise<{
    username: string;
    completedTaskCount: number;
    completedTasks: CompletedTask[];
    portfolio: PortfolioItem[];
    displayName: string;
    avatarUrl: string | null;
    profileId: string;
    averageRating: number;
    feedbackCount: number;
    approvedComplaintCount: number;
    complaintRate: number;
    isDangerous: boolean;
  } | null> {
    if (!(await hasRestAuthSession())) return null;
    try {
      const profile = await fetchPublicProfileByUsername(username);
      if (!profile) return null;
      return {
        profileId: profile.profileId,
        username: profile.username,
        completedTaskCount: profile.completedTaskCount,
        completedTasks: profile.completedTasks,
        portfolio: profile.portfolio,
        displayName: profile.username ? `@${profile.username}` : profile.fullName,
        avatarUrl: profile.avatarUrl,
        averageRating: profile.averageRating,
        feedbackCount: profile.feedbackCount,
        approvedComplaintCount: profile.approvedComplaintCount,
        complaintRate: profile.complaintRate,
        isDangerous: profile.isDangerous,
      };
    } catch {
      return null;
    }
  },

  async getMyPublicProfileStats(): Promise<{
    profileId: string;
    username: string;
    completedTaskCount: number;
    completedTasks: CompletedTask[];
    portfolio: PortfolioItem[];
    displayName: string;
    averageRating: number;
    feedbackCount: number;
  } | null> {
    if (!(await hasRestAuthSession())) return null;
    try {
      const profile = await fetchMyPublicProfile();
      if (!profile) return null;
      return {
        profileId: profile.profileId,
        username: profile.username,
        completedTaskCount: profile.completedTaskCount,
        completedTasks: profile.completedTasks,
        portfolio: profile.portfolio,
        displayName: profile.username ? `@${profile.username}` : profile.fullName,
        averageRating: profile.averageRating,
        feedbackCount: profile.feedbackCount,
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
