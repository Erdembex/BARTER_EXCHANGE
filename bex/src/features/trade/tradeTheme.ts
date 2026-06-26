import { createTheme } from '@shopify/restyle';
import { theme } from '@/theme/restyle';

/** Takas pazarı ekranı — mor vurgu (#6B4C9A) global temayı bozmaz */
export const tradeTheme = createTheme({
  ...theme,
  colors: {
    ...theme.colors,
    tradePrimary: '#6B4C9A',
    tradePrimaryDark: '#563D82',
    tradePrimaryLight: 'rgba(107, 76, 154, 0.14)',
    tradePrimaryBorder: 'rgba(107, 76, 154, 0.35)',
  },
});

export type TradeTheme = typeof tradeTheme;
