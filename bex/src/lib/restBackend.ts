import { shouldUseDemoData } from '@/lib/devMode';
import { hasRestAuthSession } from '@/lib/auth/sessionClaims';

/** Firebase emülatör demo modu — yalnızca yerel demoStore kullanılır. */
export function usesDemoStore(): boolean {
  return shouldUseDemoData();
}

/** Canlı REST backend (Firebase devre dışı). */
export async function usesRestBackend(): Promise<boolean> {
  return !shouldUseDemoData();
}

/** REST oturumu var mı (yazma işlemleri için). */
export async function hasRestSession(): Promise<boolean> {
  if (shouldUseDemoData()) return false;
  return hasRestAuthSession();
}
