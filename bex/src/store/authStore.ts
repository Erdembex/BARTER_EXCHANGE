import { create } from 'zustand';
import { User } from 'firebase/auth';
import { BexUser } from '../types';

interface AuthState {
  firebaseUser: User | null;
  bexUser: BexUser | null;
  isLoading: boolean;
  isInitialized: boolean;

  setFirebaseUser: (user: User | null) => void;
  setBexUser: (user: BexUser | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  bexUser: null,
  isLoading: false,
  isInitialized: false,

  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setBexUser: (user) => set({ bexUser: user }),
  setLoading: (loading) => set({ isLoading: loading }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),

  signOut: () =>
    set({ firebaseUser: null, bexUser: null, isLoading: false }),
}));
