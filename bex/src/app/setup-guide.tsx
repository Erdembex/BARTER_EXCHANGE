import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { isAuthEmulatorActive } from '@/lib/firebase';
import { shouldUseDemoData } from '@/lib/devMode';
import { Colors, Typography, Spacing, Radius } from '@/theme';

type Step = {
  phase: string;
  title: string;
  items: string[];
  done?: boolean;
};

const STEPS: Step[] = [
  {
    phase: 'Şimdi',
    title: 'Geliştirme (senin yaptığın)',
    done: true,
    items: [
      'Terminal 1: cd bex && npm run emulators',
      'Terminal 2: cd bex && npx expo start',
      'Kayıt ol, görev al, teslim et, admin onayı, kupon akışını test et',
      'App Check şu an gerekmez — atla',
    ],
  },
  {
    phase: '1',
    title: 'Firebase kurallarını yayınla',
    done: true,
    items: [
      '✓ Firestore kuralları + index deploy edildi',
      'Güncellenmiş kurallar için tekrar: npm run deploy:rules',
      'KYC evrakları için: Console → Storage → Get Started, sonra npm run deploy:storage',
      'Canlı Firestore boşsa: Admin panel → Demo içerik yükle',
    ],
  },
  {
    phase: '2',
    title: 'Cloud Functions (kupon üretimi)',
    items: [
      'Firebase Console → Blaze plana geç (ücretsiz kotanın üstü ücretli)',
      'https://console.firebase.google.com/project/bexcursor/usage/details',
      'Java JDK 17+ kur, sonra: npm run deploy:functions',
      'Emulator ile test: npm run emulators:full (Java gerekir)',
    ],
  },
  {
    phase: '3',
    title: 'App Check (yayına çıkmadan önce)',
    items: [
      'Firebase Console → App Check → uygulamayı kaydet',
      'Debug token al, .env dosyasına EXPO_PUBLIC_APP_CHECK_DEBUG_TOKEN yaz',
      'Test et, sonra Firestore/Storage için Enforcement aç',
    ],
  },
  {
    phase: '4',
    title: 'Mağaza (App Store / Play Store)',
    items: [
      'npx eas login && npx eas init',
      'Gizlilik politikası URL’si (app.json → extra.privacyPolicyUrl)',
      'npm run build:preview ile test APK/IPA',
      'npm run build:production ile mağaza build’i',
    ],
  },
];

export default function SetupGuideScreen() {
  const demoMode = shouldUseDemoData();
  const emulator = isAuthEmulatorActive();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Geri</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Yayın Checklist</Text>
        <Text style={styles.subtitle}>
          Sırayla ilerle. App Check en sona — şimdilik hiçbir şey yapmana gerek yok.
        </Text>

        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Şu anki mod</Text>
          <Text style={styles.statusLine}>
            {emulator ? '🟢 Auth emulator bağlı' : '🔴 Emulator kapalı'}
          </Text>
          <Text style={styles.statusLine}>
            {demoMode ? '📦 Demo veri (bellekte)' : '☁️ Canlı Firestore'}
          </Text>
        </View>

        {STEPS.map((step) => (
          <View key={step.phase} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.phaseBadge, step.done && styles.phaseDone]}>
                <Text style={[styles.phaseText, step.done && styles.phaseTextDone]}>
                  {step.done ? '✓' : step.phase}
                </Text>
              </View>
              <Text style={styles.cardTitle}>{step.title}</Text>
            </View>
            {step.items.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.note}>
          <Text style={styles.noteText}>
            Sorun yaşarsan önce emulators terminalinin açık olduğundan emin ol, sonra uygulamayı
            yenile (r).
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10], gap: Spacing[4] },
  back: { alignSelf: 'flex-start' },
  backText: { ...Typography.labelMedium, color: Colors.textSecondary },
  title: { ...Typography.headingLarge, color: Colors.textPrimary },
  subtitle: { ...Typography.bodyMedium, color: Colors.textSecondary, lineHeight: 22 },
  statusCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    gap: Spacing[1],
  },
  statusTitle: { ...Typography.labelLarge, color: Colors.textPrimary },
  statusLine: { ...Typography.bodySmall, color: Colors.textSecondary },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[2],
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], marginBottom: Spacing[1] },
  phaseBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseDone: { backgroundColor: Colors.success },
  phaseText: { ...Typography.caption, fontWeight: '700', color: Colors.textSecondary },
  phaseTextDone: { color: Colors.background },
  cardTitle: { ...Typography.labelLarge, color: Colors.textPrimary, flex: 1 },
  itemRow: { flexDirection: 'row', gap: Spacing[2], paddingLeft: Spacing[1] },
  bullet: { ...Typography.bodySmall, color: Colors.primary, fontWeight: '700' },
  itemText: { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1, lineHeight: 20 },
  note: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
  },
  noteText: { ...Typography.caption, color: Colors.textMuted, lineHeight: 18 },
});
