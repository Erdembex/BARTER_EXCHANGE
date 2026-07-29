import { useCallback, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { checkBackendReachable } from '@/lib/backendHealth';
import { shouldUseDemoData } from '@/lib/devMode';

const POLL_MS = 30_000;

export function useBackendHealth() {
  const [reachable, setReachable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const skip = shouldUseDemoData();

  const refresh = useCallback(async () => {
    if (skip) {
      setReachable(null);
      return;
    }
    setChecking(true);
    const ok = await checkBackendReachable();
    setReachable(ok);
    setChecking(false);
  }, [skip]);

  useEffect(() => {
    refresh();
    if (skip) return;

    const interval = setInterval(refresh, POLL_MS);
    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') refresh();
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [refresh, skip]);

  return { reachable, checking, refresh, skip };
}
