import AsyncStorage from '@react-native-async-storage/async-storage';
import { BexUser, UserRole } from '../types';

const STORAGE_KEY = 'bex_dev_profiles';

const profiles = new Map<string, Partial<BexUser>>();
let loadPromise: Promise<void> | null = null;

async function persistProfiles() {
  const obj: Record<string, Partial<BexUser>> = {};
  profiles.forEach((value, key) => {
    obj[key] = value;
  });
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
}

export async function loadDevProfiles(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, Partial<BexUser>>;
      Object.entries(parsed).forEach(([uid, data]) => {
        profiles.set(uid, data);
      });
    } catch {
      // Bozuk cache — sessizce devam et
    }
  })();

  return loadPromise;
}

export async function setDevProfile(uid: string, data: Partial<BexUser>) {
  await loadDevProfiles();
  profiles.set(uid, { ...profiles.get(uid), ...data });
  await persistProfiles();
}

export function getDevProfile(uid: string): Partial<BexUser> | undefined {
  return profiles.get(uid);
}

export function getDevRole(uid: string): UserRole {
  return profiles.get(uid)?.role ?? 'user';
}

export function getUidsByRole(role: UserRole): string[] {
  const uids: string[] = [];
  profiles.forEach((profile, uid) => {
    if (profile.role === role) uids.push(uid);
  });
  return uids;
}
