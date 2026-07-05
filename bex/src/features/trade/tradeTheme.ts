import { createTheme } from '@shopify/restyle';
import { theme } from '@/theme/restyle';

/** Takas & cüzdan — kurumsal mavi + altın vurgu */
export const tradeTheme = createTheme({
  ...theme,
  colors: {
    ...theme.colors,
    tradePrimary: '#1A4D8C',
    tradePrimaryDark: '#153E70',
    tradePrimaryLight: 'rgba(26, 77, 140, 0.08)',
    tradePrimaryBorder: '#CBD5E1',
    tradeAccent: '#C9A227',
    tradeAccentLight: 'rgba(201, 162, 39, 0.12)',
    tradeAccentBorder: 'rgba(201, 162, 39, 0.35)',
  },
  borderRadii: {
    ...theme.borderRadii,
    xs: 4,
    sm: 6,
    md: 8,
    lg: 10,
    xl: 12,
    '2xl': 14,
  },
});

export type TradeTheme = typeof tradeTheme;
