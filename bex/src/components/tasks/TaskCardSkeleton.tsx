import React from 'react';
import { View } from 'react-native';
import { SkeletonBox } from '@/components/common/Skeleton';
import { Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';

export function TaskCardSkeleton() {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <SkeletonBox width={44} height={44} borderRadius={22} />
        <View style={styles.headerText}>
          <SkeletonBox width="60%" height={14} />
          <SkeletonBox width="40%" height={12} style={{ marginTop: 6 }} />
        </View>
        <SkeletonBox width={52} height={24} borderRadius={Radius.full} />
      </View>
      <SkeletonBox width="90%" height={18} style={{ marginTop: Spacing[3] }} />
      <SkeletonBox width="100%" height={14} style={{ marginTop: Spacing[2] }} />
      <SkeletonBox width="75%" height={14} style={{ marginTop: 6 }} />
      <View style={styles.footer}>
        <SkeletonBox width={100} height={12} />
        <SkeletonBox width={80} height={12} />
      </View>
    </View>
  );
}

export function TaskListSkeleton({ count = 4 }: { count?: number }) {
  const styles = useScreenStyles();
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <TaskCardSkeleton key={i} />
      ))}
    </View>
  );
}

export function TaskDetailSkeleton() {
  const styles = useScreenStyles();
  return (
    <View style={styles.detail}>
      <SkeletonBox width={60} height={16} />
      <SkeletonBox width="85%" height={28} style={{ marginTop: Spacing[4] }} />
      <SkeletonBox width="100%" height={80} style={{ marginTop: Spacing[4], borderRadius: Radius.lg }} />
      <SkeletonBox width="100%" height={120} style={{ marginTop: Spacing[4], borderRadius: Radius.lg }} />
      <SkeletonBox width="100%" height={48} style={{ marginTop: Spacing[6], borderRadius: Radius.md }} />
    </View>
  );
}

export function WalletSkeleton() {
  const styles = useScreenStyles();
  return (
    <View style={styles.wallet}>
      <SkeletonBox width="50%" height={24} />
      <SkeletonBox width="40%" height={14} style={{ marginTop: Spacing[2] }} />
      <TaskCardSkeleton />
      <TaskCardSkeleton />
    </View>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  list: { gap: Spacing[3], paddingHorizontal: Spacing[5] },
  detail: { padding: Spacing[5], flex: 1 },
  wallet: { padding: Spacing[5], gap: Spacing[3], flex: 1 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  headerText: { flex: 1 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing[4],
  },
}));
