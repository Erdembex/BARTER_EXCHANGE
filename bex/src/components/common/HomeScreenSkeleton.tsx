import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { SkeletonBox } from '@/components/common/Skeleton';
import { TaskCardSkeleton } from '@/components/tasks/TaskCardSkeleton';
import { Colors, Spacing } from '@/theme';

export function HomeScreenSkeleton() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SkeletonBox width="70%" height={28} />
        <SkeletonBox width="85%" height={16} style={{ marginTop: Spacing[2] }} />
        <SkeletonBox height={48} style={{ marginTop: Spacing[5], borderRadius: 12 }} />
        <View style={styles.chips}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBox key={i} width={72} height={32} borderRadius={16} />
          ))}
        </View>
        <SkeletonBox width="45%" height={18} style={{ marginTop: Spacing[6], marginBottom: Spacing[3] }} />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <SkeletonBox width="50%" height={18} style={{ marginTop: Spacing[6], marginBottom: Spacing[3] }} />
        <View style={styles.businessRow}>
          {[1, 2, 3].map((i) => (
            <SkeletonBox key={i} width={120} height={100} borderRadius={12} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10] },
  chips: { flexDirection: 'row', gap: Spacing[2], marginTop: Spacing[4] },
  businessRow: { flexDirection: 'row', gap: Spacing[3] },
});
