import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { createBox } from '@shopify/restyle';
import { Theme } from '@/theme/restyle';
import { Colors, Shadow } from '@/theme';
import { Text } from './Text';

const Box = createBox<Theme>();

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
}

const SIZE_HEIGHT: Record<Size, number> = {
  sm: 40,
  md: 48,
  lg: 56,
};

type TextVariant = Exclude<keyof Theme['textVariants'], 'defaults'>;

const TEXT_VARIANT: Record<Variant, TextVariant> = {
  primary: 'buttonPrimary',
  secondary: 'buttonSecondary',
  outline: 'buttonOutline',
  ghost: 'buttonOutline',
  danger: 'buttonDanger',
};

const LOADER_COLOR: Record<Variant, string> = {
  primary: Colors.white,
  secondary: Colors.white,
  outline: Colors.primary,
  ghost: Colors.primary,
  danger: Colors.white,
};

function getBoxProps(variant: Variant) {
  switch (variant) {
    case 'primary':
      return { backgroundColor: 'primary' as const };
    case 'secondary':
      return { backgroundColor: 'secondary' as const };
    case 'outline':
      return {
        backgroundColor: 'transparent' as const,
        borderWidth: 1.5,
        borderColor: 'border' as const,
      };
    case 'ghost':
      return { backgroundColor: 'transparent' as const };
    case 'danger':
      return { backgroundColor: 'error' as const };
  }
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  textStyle,
  leftIcon,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.82}
      style={[
        fullWidth && { width: '100%' },
        variant === 'primary' && !isDisabled && Shadow.primary,
        style,
      ]}
    >
      <Box
        borderRadius="lg"
        alignItems="center"
        justifyContent="center"
        flexDirection="row"
        paddingHorizontal="lg"
        height={SIZE_HEIGHT[size]}
        opacity={isDisabled ? 0.45 : 1}
        width={fullWidth ? '100%' : undefined}
        {...getBoxProps(variant)}
      >
        {loading ? (
          <ActivityIndicator color={LOADER_COLOR[variant]} size="small" />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {leftIcon}
            <Text variant={TEXT_VARIANT[variant]} style={textStyle}>
              {title}
            </Text>
          </View>
        )}
      </Box>
    </TouchableOpacity>
  );
}
