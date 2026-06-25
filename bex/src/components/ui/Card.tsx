import React from 'react';
import { createBox } from '@shopify/restyle';
import { Theme } from '@/theme/restyle';

const Box = createBox<Theme>();

type CardVariant = 'default' | 'flat' | 'elevated';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
}

export function Card({ children, variant = 'default' }: CardProps) {
  if (variant === 'flat') {
    return (
      <Box
        backgroundColor="background"
        borderRadius="lg"
        borderWidth={1}
        borderColor="border"
        padding="md"
      >
        {children}
      </Box>
    );
  }

  if (variant === 'elevated') {
    return (
      <Box backgroundColor="surface" borderRadius="lg" padding="md">
        {children}
      </Box>
    );
  }

  return (
    <Box
      backgroundColor="surface"
      borderRadius="lg"
      borderWidth={1}
      borderColor="border"
      padding="md"
    >
      {children}
    </Box>
  );
}
