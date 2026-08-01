import React from 'react';
import { StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { BackHeader } from '@/components/navigation/BackHeader';
import { ComplaintSubmitForm } from '@/components/complaint/ComplaintSubmitForm';
import { useToast } from '@/components/common/Toast';
import { Colors, Spacing } from '@/theme';
import { useTranslation } from '@/i18n';

export default function ComplaintSubmitScreen() {
  const { t } = useTranslation();
  const { businessId, applicationId, applicationLabel } = useLocalSearchParams<{
    businessId?: string;
    applicationId?: string;
    applicationLabel?: string;
  }>();
  const { showToast } = useToast();

  return (
    <SafeAreaView style={styles.safe}>
      <BackHeader title={t('complaintSubmitScreen.businessTitle')} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <ComplaintSubmitForm
          businessProfileIdFilter={businessId ? String(businessId) : undefined}
          initialApplicationId={applicationId ? String(applicationId) : ''}
          initialApplicationLabel={applicationLabel ? String(applicationLabel) : ''}
          onSuccess={() => {
            showToast(t('complaintSubmitScreen.businessSuccessToast'));
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
