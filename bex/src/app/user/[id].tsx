import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { usersRepository } from '@/features/data';
import { PortfolioItem } from '@/types';
import { UserPortfolioGallery } from '@/components/profile/UserPortfolioGallery';
import { Colors, Typography, Spacing } from '@/theme';

export default function PublicUserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [displayName, setDisplayName] = useState('');
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setDisplayName(await usersRepository.getDisplayName(id));
    setPortfolio(await usersRepository.getPortfolio(id));
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{displayName}</Text>
        <Text style={styles.subtitle}>
          {portfolio.length} onaylı çalışma · portföy herkese açık (işletmeler için)
        </Text>

        <UserPortfolioGallery
          items={portfolio}
          title="Onaylı çalışmalar"
          subtitle="Yalnızca admin moderasyonundan geçmiş teslim görselleri gösterilir."
          emptyText="Bu kullanıcının henüz onaylı portföy görseli yok."
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10], gap: Spacing[4] },
  back: { alignSelf: 'flex-start' },
  backText: { ...Typography.labelMedium, color: Colors.textSecondary },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySmall, color: Colors.textMuted },
});
