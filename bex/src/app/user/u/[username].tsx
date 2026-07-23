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
import { CompletedTask, PortfolioItem } from '@/types';
import { ProfileAvatar } from '@/components/profile/ProfileAvatar';
import { PublicProfileSections } from '@/components/profile/PublicProfileSections';
import { Colors, Typography, Spacing } from '@/theme';

export default function PublicUserProfileByUsernameScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [profileId, setProfileId] = useState('');
  const [averageRating, setAverageRating] = useState(0);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [isDangerous, setIsDangerous] = useState(false);
  const [approvedComplaintCount, setApprovedComplaintCount] = useState(0);
  const [complaintRate, setComplaintRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    setNotFound(false);
    const stats = await usersRepository.getPublicProfileByUsername(String(username));
    if (stats) {
      setDisplayName(stats.displayName);
      setAvatarUrl(stats.avatarUrl);
      setCompletedCount(stats.completedTaskCount);
      setCompletedTasks(stats.completedTasks);
      setPortfolio(stats.portfolio);
      setProfileId(stats.profileId);
      setAverageRating(stats.averageRating);
      setFeedbackCount(stats.feedbackCount);
      setIsDangerous(stats.isDangerous);
      setApprovedComplaintCount(stats.approvedComplaintCount);
      setComplaintRate(stats.complaintRate);
    } else {
      setNotFound(true);
      setDisplayName('');
      setCompletedTasks([]);
      setPortfolio([]);
    }
    setLoading(false);
  }, [username]);

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

  if (notFound) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.notFoundTitle}>Profil bulunamadı</Text>
          <Text style={styles.notFoundText}>@{username} kullanıcı adına ait profil yok.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Geri dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <ProfileAvatar name={displayName} avatarUrl={avatarUrl} size={72} />
          <Text style={styles.title}>{displayName}</Text>
        </View>

        <PublicProfileSections
          profileId={profileId}
          completedCount={completedCount}
          completedTasks={completedTasks}
          portfolio={portfolio}
          averageRating={averageRating}
          feedbackCount={feedbackCount}
          isDangerous={isDangerous}
          approvedComplaintCount={approvedComplaintCount}
          complaintRate={complaintRate}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[5] },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10], gap: Spacing[4] },
  back: { alignSelf: 'flex-start' },
  backText: { ...Typography.labelMedium, color: Colors.textSecondary },
  hero: { alignItems: 'center', gap: Spacing[2] },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  notFoundTitle: { ...Typography.headingMedium, color: Colors.textPrimary, marginBottom: Spacing[2] },
  notFoundText: { ...Typography.bodyMedium, color: Colors.textMuted, marginBottom: Spacing[4] },
});
