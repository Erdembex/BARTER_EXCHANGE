import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Business } from '../../types';
import { Colors, Typography, Radius, Spacing, Shadow } from '../../theme';
import { useTranslation } from '@/i18n';

interface BusinessCardProps {
  business: Business;
  onPress?: () => void;
}

export function BusinessCard({ business, onPress }: BusinessCardProps) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={[styles.card, Shadow.sm]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={!onPress}
    >
      <View style={styles.logo}>
        <Text style={styles.logoText}>{business.name.charAt(0)}</Text>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {business.name}
      </Text>
      <Text style={styles.address} numberOfLines={1}>
        📍 {business.address}
      </Text>
      <View style={styles.scoreRow}>
        <Text style={styles.score}>⭐ {business.reputationScore}</Text>
        <Text style={styles.tasks}>{t('businessCard.taskCount', { count: business.totalTasksPublished })}</Text>
      </View>
      {business.isVerified && (
        <View style={styles.verified}>
          <Text style={styles.verifiedText}>{t('businessCard.verified')}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing[2],
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textOnPrimary,
  },
  name: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
  },
  address: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  score: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  tasks: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  verified: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  verifiedText: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '600',
  },
});
