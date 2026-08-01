import { useMemo } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { Colors as DarkColors } from './colors';
import { LightColors } from './colorsLight';

/**
 * Aktif temaya (koyu/açık) göre renk paletini döner. Renkler `mode` değiştiğinde
 * yeni referansla döner, bu sayede `useMemo`/`StyleSheet` yeniden hesaplanır.
 */
export function useThemeColors() {
  const mode = useThemeStore((s) => s.mode);
  return useMemo(() => (mode === 'light' ? LightColors : DarkColors), [mode]);
}

export function useIsDarkMode(): boolean {
  return useThemeStore((s) => s.mode === 'dark');
}
