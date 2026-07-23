import React from 'react';
import { StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BackHeader } from '@/components/navigation/BackHeader';
import { ComplaintSubmitForm } from '@/components/complaint/ComplaintSubmitForm';
import { useToast } from '@/components/common/Toast';
import { Colors, Spacing } from '@/theme';

export default function ComplaintSubmitScreen() {
  const { businessId, applicationId, applicationLabel } = useLocalSearchParams<{
    businessId?: string;
    applicationId?: string;
    applicationLabel?: string;
  }>();
  const { showToast } = useToast();

  return (
    <SafeAreaView style={styles.safe}>
      <BackHeader title="İşletme Şikayeti" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <ComplaintSubmitForm
          businessProfileIdFilter={businessId ? String(businessId) : undefined}
          initialApplicationId={applicationId ? String(applicationId) : ''}
          initialApplicationLabel={applicationLabel ? String(applicationLabel) : ''}
          onSuccess={() => {
            showToast('Şikayetin alındı. Admin incelemesinden sonra yayınlanabilir.');
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/complaints' as never);
            }
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
