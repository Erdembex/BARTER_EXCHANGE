import { createTheme } from '@shopify/restyle';
import { theme } from '@/theme/restyle';

/** Takas & cüzdan — dark siyah & sarı */
export const tradeTheme = createTheme({
  ...theme,
  colors: {
    ...theme.colors,
    tradePrimary: '#FACC15',
    tradePrimaryDark: '#CA8A04',
    tradePrimaryLight: 'rgba(250, 204, 21, 0.12)',
    tradePrimaryBorder: '#262626',
    tradeAccent: '#FFD700',
    tradeAccentLight: 'rgba(255, 215, 0, 0.12)',
    tradeAccentBorder: 'rgba(250, 204, 21, 0.25)',
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
