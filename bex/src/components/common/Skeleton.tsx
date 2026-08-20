import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';
import { Radius, createThemedStyles } from '@/theme';

interface SkeletonBoxProps {
  width?: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const useStyles = createThemedStyles((Colors) => ({
  box: {
    backgroundColor: Colors.border,
  },
}));

export function SkeletonBox({
  width = '100%',
  height,
  borderRadius = Radius.md,
  style,
}: SkeletonBoxProps) {
  const styles = useStyles();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.box,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}
