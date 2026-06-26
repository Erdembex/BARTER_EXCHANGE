import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { shouldUseDemoData } from '@/lib/devMode';
import { getDevProfile, loadDevProfiles, setDevProfile } from '@/lib/devProfileStore';
import { COLLECTIONS } from '@/types';
import { getUserPortfolio } from '@/features/portfolio';

export const usersRepository = {
  async getDisplayName(uid: string): Promise<string> {
    await loadDevProfiles();
    const profile = getDevProfile(uid);
    if (profile?.displayName?.trim()) {
      return profile.displayName.trim();
    }

    if (!shouldUseDemoData()) {
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
        if (snap.exists()) {
          const name = snap.data().displayName as string | undefined;
          if (name?.trim()) return name.trim();
        }
      } catch {
        // Yerel profile yeterli
      }
    }

    return `Kullanıcı ${uid.slice(-4)}`;
  },

  async getPortfolio(userId: string) {
    return getUserPortfolio(userId);
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

    if (!shouldUseDemoData()) {
      try {
        await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
          completedTaskCount: count,
          reputationScore,
        });
      } catch {
        // Dev / izin hatası
      }
    }
  },
};
