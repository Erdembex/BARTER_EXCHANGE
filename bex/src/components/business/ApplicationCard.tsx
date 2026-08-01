import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Application, ApplicationStatus } from '@/types';
import { APPLICATION_STATUS_LABELS } from '@/constants/taskLabels';
import { AuthenticatedImage } from '@/components/common/AuthenticatedImage';
import { Colors, Typography, Spacing, Radius } from '@/theme';
import { useTranslation } from '@/i18n';

interface ApplicationCardProps {
  application: Application;
  taskTitle: string;
  applicantName?: string;
  portfolioThumbs?: string[];
  onPress: () => void;
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  pending: Colors.warning,
  approved: Colors.info,
  rejected: Colors.error,
  submitted: Colors.primary,
  submission_approved: Colors.success,
  rewarded: Colors.success,
  cancelled: Colors.textTertiary,
};

export function ApplicationCard({
  application,
  taskTitle,
  applicantName,
  portfolioThumbs = [],
  onPress,
}: ApplicationCardProps) {
  const { t } = useTranslation();
  const statusColor = STATUS_COLORS[application.status];
  const thumbs = portfolioThumbs.slice(0, 3);
  const resolvedApplicantName = applicantName ?? t('applicationCard.defaultApplicant');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {taskTitle}
        </Text>
        <View style={[styles.badge, { backgroundColor: statusColor + '22' }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {APPLICATION_STATUS_LABELS[application.status]}
          </Text>
        </View>
      </View>
      <Text style={styles.applicant}>{resolvedApplicantName}</Text>
      {thumbs.length > 0 ? (
        <View style={styles.thumbRow}>
          {thumbs.map((url, i) => (
            <AuthenticatedImage key={`${url}-${i}`} uri={url} style={styles.thumb} />
          ))}
          <Text style={styles.thumbHint}>
            {t('applicationCard.approvedWorkCount', { count: thumbs.length })}
          </Text>
        </View>
      ) : application.status === 'pending' ? (
        <Text style={styles.portfolioHint}>{t('applicationCard.portfolioHint')}</Text>
      ) : null}
      <Text style={styles.preview} numberOfLines={2}>
        {application.submissionText || application.coverLetter}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: Spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing[2],
    marginBottom: Spacing[1],
  },
  title: {
    ...Typography.labelLarge,
    color: Colors.textPrimary,
    flex: 1,
  },
  badge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  applicant: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing[1],
  },
  portfolioHint: {
    ...Typography.caption,
    color: Colors.primary,
    marginBottom: Spacing[1],
    fontWeight: '600',
  },
  thumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.borderLight,
  },
  thumbHint: {
    ...Typography.caption,
    color: Colors.textMuted,
    flex: 1,
  },
  preview: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    lineHeight: 18,
  },
});
