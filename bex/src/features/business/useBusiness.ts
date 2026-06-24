import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { ensureBusinessForOwner } from '@/features/business/businessService';
import { Business } from '@/types';

export function useBusiness() {
  const { firebaseUser, bexUser } = useAuthStore();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!firebaseUser || bexUser?.role !== 'business') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const biz = await ensureBusinessForOwner(
        firebaseUser.uid,
        bexUser.displayName
      );
      setBusiness(biz);
    } catch {
      setError('İşletme profili yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, bexUser]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { business, loading, error, reload: load };
}
