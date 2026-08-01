import { createTheme } from '@shopify/restyle';
import { theme } from '@/theme/restyle';

/** Takas & cüzdan — altın & para yeşili */
export const tradeTheme = createTheme({
  ...theme,
  colors: {
    ...theme.colors,
    tradePrimary: '#EAB308',
    tradePrimaryDark: '#CA8A04',
    tradePrimaryLight: 'rgba(234, 179, 8, 0.16)',
    tradePrimaryBorder: '#1E3324',
    tradeAccent: '#FFD700',
    tradeAccentLight: 'rgba(255, 215, 0, 0.14)',
    tradeAccentBorder: 'rgba(234, 179, 8, 0.35)',
    tradeMoneyGreen: '#22C55E',
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
