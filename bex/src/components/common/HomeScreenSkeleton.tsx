import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { SkeletonBox } from '@/components/common/Skeleton';
import { Colors, Spacing, Radius } from '@/theme';

export function HomeScreenSkeleton() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <SkeletonBox width="40%" height={22} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <SkeletonBox width={56} height={56} borderRadius={28} />
          <View style={styles.heroText}>
            <SkeletonBox width="75%" height={22} />
            <SkeletonBox width="90%" height={14} style={{ marginTop: Spacing[2] }} />
          </View>
        </View>
        <SkeletonBox height={88} borderRadius={Radius.md} />
        <View style={styles.links}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBox key={i} height={72} borderRadius={Radius.md} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  scroll: {
    padding: Spacing[5],
    paddingTop: Spacing[2],
    paddingBottom: Spacing[10],
    gap: Spacing[5],
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
    padding: Spacing[4],
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  heroText: { flex: 1 },
  links: { gap: Spacing[3] },
});
