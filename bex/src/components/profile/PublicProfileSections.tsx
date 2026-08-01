import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CompletedTask, PortfolioItem } from '@/types';
import { CompletedTasksList, CompletedTasksStat } from '@/components/profile/CompletedTasksList';
import { UserPortfolioGallery } from '@/components/profile/UserPortfolioGallery';
import { ProfileFeedbackList } from '@/components/profile/ProfileFeedbackList';
import { DangerBadge } from '@/components/profile/DangerBadge';
import { fetchProfileFeedback } from '@/features/feedback/feedbackApi';
import { PORTFOLIO_GALLERY_LIMIT } from '@/features/portfolio/profileLimits';
import { Colors, Typography, Spacing } from '@/theme';
import { useTranslation } from '@/i18n';

interface PublicProfileSectionsProps {
  profileId?: string;
  completedCount: number;
  completedTasks: CompletedTask[];
  portfolio: PortfolioItem[];
  averageRating?: number;
  feedbackCount?: number;
  isDangerous?: boolean;
  approvedComplaintCount?: number;
  complaintRate?: number;
}

export function PublicProfileSections({
  profileId,
  completedCount,
  completedTasks,
  portfolio,
  averageRating = 0,
  feedbackCount = 0,
  isDangerous = false,
  approvedComplaintCount = 0,
  complaintRate = 0,
}: PublicProfileSectionsProps) {
  const { t } = useTranslation();
  const [feedbackItems, setFeedbackItems] = useState<
    Awaited<ReturnType<typeof fetchProfileFeedback>>['recent']
  >([]);
  const [feedbackAvg, setFeedbackAvg] = useState(averageRating);
  const [feedbackTotal, setFeedbackTotal] = useState(feedbackCount);

  useEffect(() => {
    if (!profileId) return;
    fetchProfileFeedback(profileId, 5)
      .then((summary) => {
        setFeedbackItems(summary.recent);
        setFeedbackAvg(summary.averageStars || averageRating);
        setFeedbackTotal(summary.totalCount || feedbackCount);
      })
      .catch(() => {});
  }, [profileId, averageRating, feedbackCount]);

  return (
    <>
      {isDangerous ? (
        <View style={styles.dangerWrap}>
          <DangerBadge />
          <Text style={styles.dangerHint}>
            {t('publicProfile.dangerHint', {
              completed: completedCount,
              approved: approvedComplaintCount,
              rate: Math.round(complaintRate * 100),
            })}
          </Text>
        </View>
      ) : null}

      <View style={styles.statsRow}>
        <CompletedTasksStat
          count={completedCount}
          tasks={completedTasks}
          totalCount={completedCount}
        />
        <Text style={styles.statsDivider}>·</Text>
        <Text style={styles.statsMuted}>{t('publicProfile.approvedPhotos', { count: portfolio.length })}</Text>
        {feedbackTotal > 0 ? (
          <>
            <Text style={styles.statsDivider}>·</Text>
            <Text style={styles.statsMuted}>
              ⭐ {feedbackAvg.toFixed(1)} ({feedbackTotal})
            </Text>
          </>
        ) : null}
      </View>

      <CompletedTasksList tasks={completedTasks} totalCount={completedCount} />

      {profileId ? (
        <ProfileFeedbackList
          averageStars={feedbackAvg}
          totalCount={feedbackTotal}
          items={feedbackItems}
          title={t('publicProfile.feedbackTitle')}
        />
      ) : null}

      <UserPortfolioGallery
        items={portfolio}
        maxItems={PORTFOLIO_GALLERY_LIMIT}
        title={t('publicProfile.portfolioTitle')}
        subtitle={t('publicProfile.portfolioSubtitle')}
        emptyText={t('publicProfile.portfolioEmpty')}
      />
    </>
  );
}

const styles = StyleSheet.create({
  dangerWrap: { alignItems: 'center', gap: Spacing[2] },
  dangerHint: { ...Typography.caption, color: Colors.error, textAlign: 'center' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    flexWrap: 'wrap',
  },
  statsDivider: { ...Typography.bodySmall, color: Colors.textMuted },
  statsMuted: { ...Typography.bodySmall, color: Colors.textMuted },
});
