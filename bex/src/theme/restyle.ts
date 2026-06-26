import { createTheme } from '@shopify/restyle';
import { Colors } from './colors';
import { FontFamily, FontSize } from './typography';

export const theme = createTheme({
  colors: {
    primary: Colors.primary,
    secondary: Colors.secondary,
    background: Colors.background,
    surface: Colors.surface,
    border: Colors.border,
    text: Colors.text,
    textMuted: Colors.textMuted,
    white: Colors.white,
    transparent: Colors.transparent,
    error: Colors.error,
    errorLight: Colors.errorLight,
    primaryLight: Colors.primaryLight,
    textOnPrimary: Colors.textOnPrimary,
    success: Colors.success,
  },
  spacing: {
    none: 0,
    xs: 4,
    s: 8,
    sm: 8,
    m: 16,
    md: 16,
    l: 20,
    lg: 20,
    xl: 24,
    '2xl': 32,
  },
  borderRadii: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 28,
    full: 9999,
  },
  textVariants: {
    defaults: {
      color: 'text',
      fontFamily: FontFamily.regular,
      fontSize: FontSize.base,
    },
    headingLarge: {
      color: 'text',
      fontFamily: FontFamily.bold,
      fontSize: FontSize['2xl'],
      letterSpacing: -0.4,
    },
    headingMedium: {
      color: 'text',
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.xl,
    },
    headingSmall: {
      color: 'text',
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.lg,
    },
    body: {
      color: 'text',
      fontFamily: FontFamily.regular,
      fontSize: FontSize.base,
    },
    bodyMuted: {
      color: 'textMuted',
      fontFamily: FontFamily.regular,
      fontSize: FontSize.base,
    },
    caption: {
      color: 'textMuted',
      fontFamily: FontFamily.regular,
      fontSize: FontSize.xs,
    },
    label: {
      color: 'text',
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.base,
    },
    buttonPrimary: {
      color: 'textOnPrimary',
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.base,
    },
    buttonSecondary: {
      color: 'white',
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.base,
    },
    buttonOutline: {
      color: 'text',
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.base,
    },
    buttonDanger: {
      color: 'textOnPrimary',
      fontFamily: FontFamily.semiBold,
      fontSize: FontSize.base,
    },
  },
});

export type Theme = typeof theme;
