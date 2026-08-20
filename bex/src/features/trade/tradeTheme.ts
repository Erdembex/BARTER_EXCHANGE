import { useMemo } from 'react';
import { createTheme } from '@shopify/restyle';
import { Colors as DarkColors } from '@/theme/colors';
import { LightColors } from '@/theme/colorsLight';
import type { ColorKey } from '@/theme/colors';
import { getTheme } from '@/theme/restyle';
import { useThemeColors } from '@/theme';
import { useThemeStore } from '@/store/themeStore';

/** Takas & cüzdan — aktif uygulama temasına göre üretilir */
export function getTradeTheme(palette: Record<ColorKey, string>) {
  const base = getTheme(palette);
  return createTheme({
    ...base,
    colors: {
      ...base.colors,
      tradePrimary: palette.primary,
      tradePrimaryDark: palette.primaryDark,
      tradePrimaryLight: palette.primaryLight,
      tradePrimaryBorder: palette.border,
      tradeAccent: palette.accent,
      tradeAccentLight: palette.accentLight,
      tradeAccentBorder: palette.borderGold,
      tradeMoneyGreen: palette.moneyGreen,
    },
    borderRadii: {
      ...base.borderRadii,
      xs: 4,
      sm: 6,
      md: 8,
      lg: 10,
      xl: 12,
      '2xl': 14,
    },
  });
}

export type TradeTheme = ReturnType<typeof getTradeTheme>;

/** Aktif uygulama temasına göre takas ekranı restyle teması */
export function useTradeTheme() {
  const colors = useThemeColors();
  return useMemo(() => getTradeTheme(colors), [colors]);
}

/** Modül düzeyi referanslar — tema store ile senkron kalır */
let activeTradeTheme = getTradeTheme(DarkColors);

useThemeStore.subscribe((state) => {
  activeTradeTheme = getTradeTheme(state.mode === 'light' ? LightColors : DarkColors);
});

export const tradeTheme: TradeTheme = new Proxy({} as TradeTheme, {
  get(_target, prop, receiver) {
    return Reflect.get(activeTradeTheme, prop, receiver);
  },
});
