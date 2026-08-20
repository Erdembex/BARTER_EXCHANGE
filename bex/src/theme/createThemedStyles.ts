import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useThemeColors } from './useThemeColors';
import type { ColorKey } from './colors';

type ColorPalette = Record<ColorKey, string>;

/**
 * Tema değişince otomatik yenilenen StyleSheet hook'u üretir.
 * `StyleSheet.create` içinde `Colors` parametresini kullanın.
 */
export function createThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: ColorPalette) => T
) {
  return function useStyles(): T {
    const colors = useThemeColors();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
