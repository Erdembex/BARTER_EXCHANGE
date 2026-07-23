import React from 'react';
import { StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BackHeader } from '@/components/navigation/BackHeader';
import { IndividualComplaintSubmitForm } from '@/components/complaint/IndividualComplaintSubmitForm';
import { useToast } from '@/components/common/Toast';
import { Colors, Spacing } from '@/theme';

export default function IndividualComplaintSubmitScreen() {
  const { applicationId, applicationLabel } = useLocalSearchParams<{
    applicationId?: string;
    applicationLabel?: string;
  }>();
  const { showToast } = useToast();

  return (
    <SafeAreaView style={styles.safe}>
      <BackHeader title="Kullanıcı Şikayeti" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <IndividualComplaintSubmitForm
          initialApplicationId={applicationId ? String(applicationId) : ''}
          initialApplicationLabel={applicationLabel ? String(applicationLabel) : ''}
          onSuccess={() => {
            showToast('Şikayetin alındı. Admin incelemesinden sonra değerlendirilecek.');
            if (router.canGoBack()) router.back();
            else router.replace('/(business)/panel' as never);
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing[5], paddingBottom: Spacing[10] },
});
