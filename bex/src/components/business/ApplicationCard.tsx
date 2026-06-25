import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Application, ApplicationStatus } from '@/types';
import { APPLICATION_STATUS_LABELS } from '@/constants/taskLabels';
import { Colors, Typography, Spacing, Radius } from '@/theme';

interface ApplicationCardProps {
  application: Application;
  taskTitle: string;
  applicantName?: string;
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
  applicantName = 'Kullanıcı',
  onPress,
}: ApplicationCardProps) {
  const statusColor = STATUS_COLORS[application.status];

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
      <Text style={styles.applicant}>{applicantName}</Text>
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
  preview: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    lineHeight: 18,
  },
});
