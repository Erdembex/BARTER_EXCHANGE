import React from 'react';
import { View, Text } from 'react-native';
import { Application, ApplicationStatus } from '@/types';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

const STATUS_INDEX: Record<ApplicationStatus, number> = {
  pending: 0,
  rejected: 0,
  cancelled: -1,
  approved: 1,
  submitted: 2,
  submission_approved: 3,
  rewarded: 4,
};

interface ApplicationProgressProps {
  status: ApplicationStatus;
}

export function ApplicationProgress({ status }: ApplicationProgressProps) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const STEPS = [
    { label: t('applicationProgress.stepApplication'), threshold: 0 },
    { label: t('applicationProgress.stepApproval'), threshold: 1 },
    { label: t('applicationProgress.stepSubmission'), threshold: 2 },
    { label: t('applicationProgress.stepAdmin'), threshold: 3 },
    { label: t('applicationProgress.stepCoupon'), threshold: 4 },
  ] as const;

  if (status === 'cancelled') {
    return (
      <View style={styles.bannerMuted}>
        <Text style={styles.bannerText}>{t('applicationProgress.cancelled')}</Text>
      </View>
    );
  }

  if (status === 'rejected') {
    return (
      <View style={styles.bannerError}>
        <Text style={styles.bannerText}>{t('applicationProgress.rejected')}</Text>
      </View>
    );
  }

  const current = STATUS_INDEX[status];

  return (
    <View style={styles.wrap}>
      {STEPS.map((step, index) => {
        const done = current >= step.threshold;
        const active = current === step.threshold;
        const isLast = index === STEPS.length - 1;

        return (
          <View key={step.label} style={styles.stepRow}>
            <View style={styles.stepLeft}>
              <View
                style={[
                  styles.dot,
                  done && styles.dotDone,
                  active && styles.dotActive,
                ]}
              >
                <Text style={[styles.dotText, done && styles.dotTextDone]}>
                  {done ? '✓' : index + 1}
                </Text>
              </View>
              {!isLast ? (
                <View style={[styles.line, done && styles.lineDone]} />
              ) : null}
            </View>
            <Text
              style={[
                styles.stepLabel,
                done && styles.stepLabelDone,
                active && styles.stepLabelActive,
              ]}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  wrap: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    minHeight: 36,
  },
  stepLeft: { alignItems: 'center', width: 28 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: Colors.primary },
  dotActive: { backgroundColor: Colors.primaryDark },
  dotText: { ...Typography.caption, fontWeight: '700', color: Colors.textMuted },
  dotTextDone: { color: Colors.textOnPrimary, fontSize: 12 },
  line: {
    width: 2,
    flex: 1,
    minHeight: 12,
    backgroundColor: Colors.borderLight,
    marginVertical: 2,
  },
  lineDone: { backgroundColor: Colors.primary },
  stepLabel: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    paddingTop: 4,
    flex: 1,
  },
  stepLabelDone: { color: Colors.textSecondary },
  stepLabelActive: { color: Colors.textPrimary, fontWeight: '700' },
  bannerMuted: {
    backgroundColor: Colors.surface,
    padding: Spacing[3],
    borderRadius: Radius.md,
  },
  bannerError: {
    backgroundColor: Colors.errorLight,
    padding: Spacing[3],
    borderRadius: Radius.md,
  },
  bannerText: { ...Typography.bodySmall, color: Colors.textSecondary },
}));
