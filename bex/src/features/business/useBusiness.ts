import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { ensureBusinessForOwner } from '@/features/business/businessService';
import { Business } from '@/types';

export function useBusiness() {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const role = useAuthStore((s) => s.bexUser?.role);
  const displayName = useAuthStore((s) => s.bexUser?.displayName);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedOnceRef = useRef(false);

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      const uid = firebaseUser?.uid;
      if (!uid || role !== 'business') {
        setLoading(false);
        return;
      }

      const silent = options?.silent ?? loadedOnceRef.current;
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError(null);
      try {
        const biz = await ensureBusinessForOwner(uid, displayName ?? '');
        setBusiness(biz);
        loadedOnceRef.current = true;
      } catch {
        setError('İşletme profili yüklenemedi.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [firebaseUser?.uid, role, displayName]
  );

  useFocusEffect(
    useCallback(() => {
      load({ silent: loadedOnceRef.current });
    }, [load])
  );

  return { business, loading, refreshing, error, reload: () => load({ silent: false }) };
}
