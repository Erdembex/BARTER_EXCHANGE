import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../theme';

interface BexLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export function BexLogo({ size = 'md', showTagline = false }: BexLogoProps) {
  const logoSize = size === 'sm' ? 40 : size === 'md' ? 56 : 72;
  const fontSize = size === 'sm' ? 20 : size === 'md' ? 28 : 36;

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { width: logoSize, height: logoSize, borderRadius: logoSize * 0.28 }]}>
        <Text style={[styles.badgeText, { fontSize }]}>B</Text>
      </View>
      {showTagline && (
        <Text style={styles.tagline}>Görev Tamamla, Ödül Kazan</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontWeight: '900',
    color: Colors.textOnPrimary,
    letterSpacing: -1,
    transform: [{ rotate: '-14deg' }],
  },
  tagline: {
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
});
