import { create } from 'zustand';

interface MessagingInboxState {
  userTotalUnread: number;
  businessTotalUnread: number;
  /** Artınca tüm useMessagingInbox örnekleri yeniden yükler */
  refreshToken: number;
  /** Eski inbox isteklerinin sonucunu yok saymak için */
  userFetchGen: number;
  businessFetchGen: number;
  setUserTotalUnread: (count: number) => void;
  setBusinessTotalUnread: (count: number) => void;
  beginUserFetch: () => number;
  beginBusinessFetch: () => number;
  isUserFetchCurrent: (gen: number) => boolean;
  isBusinessFetchCurrent: (gen: number) => boolean;
  /** Okundu işaretinden hemen sonra rozeti düşür (yarış koşulunu önler) */
  decrementUserUnread: (by: number) => void;
  decrementBusinessUnread: (by: number) => void;
  invalidate: () => void;
}

export const useMessagingInboxStore = create<MessagingInboxState>((set, get) => ({
  userTotalUnread: 0,
  businessTotalUnread: 0,
  refreshToken: 0,
  userFetchGen: 0,
  businessFetchGen: 0,
  setUserTotalUnread: (count) => set({ userTotalUnread: Math.max(0, count) }),
  setBusinessTotalUnread: (count) => set({ businessTotalUnread: Math.max(0, count) }),
  beginUserFetch: () => {
    const gen = get().userFetchGen + 1;
    set({ userFetchGen: gen });
    return gen;
  },
  beginBusinessFetch: () => {
    const gen = get().businessFetchGen + 1;
    set({ businessFetchGen: gen });
    return gen;
  },
  isUserFetchCurrent: (gen) => get().userFetchGen === gen,
  isBusinessFetchCurrent: (gen) => get().businessFetchGen === gen,
  decrementUserUnread: (by) =>
    set((state) => ({
      userTotalUnread: Math.max(0, state.userTotalUnread - Math.max(0, by)),
    })),
  decrementBusinessUnread: (by) =>
    set((state) => ({
      businessTotalUnread: Math.max(0, state.businessTotalUnread - Math.max(0, by)),
    })),
  invalidate: () => set((state) => ({ refreshToken: state.refreshToken + 1 })),
}));

export function notifyMessagingInboxRead(unreadCleared = 0, audience: 'user' | 'business' = 'user'): void {
  const store = useMessagingInboxStore.getState();
  if (unreadCleared > 0) {
    if (audience === 'business') {
      store.decrementBusinessUnread(unreadCleared);
    } else {
      store.decrementUserUnread(unreadCleared);
    }
  }
  store.invalidate();
}
