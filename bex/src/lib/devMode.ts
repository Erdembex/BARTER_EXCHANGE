import { Timestamp } from 'firebase/firestore';
import { UserRole } from '../types';
import { getDevProfile } from './devProfileStore';

export function isAuthEmulatorActive(): boolean {
  return !!(globalThis as typeof globalThis & { __bexAuthEmulator?: boolean })
    .__bexAuthEmulator;
}

export function isFirestorePermissionError(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  return code === 'permission-denied' || code === 'unauthenticated';
}

/** Geliştirmede Auth emulator varken Firestore'a gitme */
export function shouldUseDemoData(): boolean {
  return __DEV__ && isAuthEmulatorActive();
}

export function buildDevUser(
  uid: string,
  email?: string | null,
  displayName?: string | null
) {
  const profile = getDevProfile(uid);
  const role: UserRole = profile?.role ?? 'user';

  return {
    uid,
    role,
    displayName: profile?.displayName ?? displayName ?? email?.split('@')[0] ?? 'Kullanıcı',
    email: profile?.email ?? email ?? '',
    phone: profile?.phone ?? '',
    phoneVerified: profile?.phoneVerified ?? false,
    avatarUrl: profile?.avatarUrl ?? '',
    reputationScore: profile?.reputationScore ?? 0,
    completedTaskCount: profile?.completedTaskCount ?? 0,
    joinedAt: Timestamp.now(),
    isBanned: profile?.isBanned ?? false,
  };
}
