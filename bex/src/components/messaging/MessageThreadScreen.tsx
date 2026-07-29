import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuthStore } from '@/store/authStore';
import { applicationsRepository, businessesRepository, tasksRepository, usersRepository } from '@/features/data';
import { canUseApplicationMessages } from '@/features/messages';
import { ChatThreadView } from '@/components/messaging/ChatThreadView';
import { Colors, Typography, Spacing } from '@/theme';

interface MessageThreadScreenProps {
  applicationId: string;
}

export function MessageThreadScreen({ applicationId }: MessageThreadScreenProps) {
  const { firebaseUser, bexUser } = useAuthStore();
  const [peerLabel, setPeerLabel] = useState('Sohbet');
  const [taskTitle, setTaskTitle] = useState('Görev');
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!applicationId || !firebaseUser || !bexUser) return;

      void (async () => {
        const app = await applicationsRepository.getById(applicationId);
        if (!app) {
          setAllowed(false);
          return;
        }

        const canChat = canUseApplicationMessages(app.status);
        setAllowed(canChat);
        if (!canChat) return;

        const task = await tasksRepository.getById(app.taskId);
        setTaskTitle(task?.title ?? 'Görev');

        if (bexUser.role === 'business') {
          setPeerLabel(await usersRepository.getDisplayName(app.userId));
        } else {
          const business = await businessesRepository.getById(app.businessId);
          setPeerLabel(business?.name ?? 'İşletme');
        }
      })();
    }, [applicationId, firebaseUser, bexUser])
  );

  if (!applicationId || !firebaseUser || !bexUser) {
    return null;
  }

  if (allowed === null) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!allowed) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sohbet</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}>
          <Text style={styles.blockedTitle}>Sohbet henüz açılmadı</Text>
          <Text style={styles.blockedText}>
            Başvuru onaylandıktan sonra mesajlaşma aktif olur.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerMeta}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {peerLabel}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {taskTitle}
          </Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <ChatThreadView
        applicationId={applicationId}
        currentUserId={firebaseUser.uid}
        currentUserRole={bexUser.role}
        variant="fullscreen"
        peerLabel={peerLabel}
        taskTitle={taskTitle}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing[6] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing[2],
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 22, color: Colors.primary, fontWeight: '700' },
  headerMeta: { flex: 1, alignItems: 'center' },
  headerTitle: { ...Typography.labelLarge, color: Colors.textPrimary, fontWeight: '700' },
  headerSubtitle: { ...Typography.caption, color: Colors.textSecondary },
  blockedTitle: { ...Typography.labelLarge, color: Colors.textPrimary, marginBottom: Spacing[2] },
  blockedText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
