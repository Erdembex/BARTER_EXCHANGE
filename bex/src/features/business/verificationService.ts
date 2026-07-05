import { shouldUseDemoData } from '@/lib/devMode';
import { demoStore } from '@/lib/demoStore';
import { businessesRepository } from '@/features/data/businessesRepository';
import { uploadLocalFiles } from '@/lib/storageUpload';
import { Business } from '@/types';
import { notifyAdmins } from '@/features/notifications/notificationsRepository';

export interface VerificationUpload {
  uri: string;
  name: string;
  mimeType: string;
}

export async function submitBusinessVerification(
  business: Business,
  file: VerificationUpload
): Promise<Business> {
  const [fileUrl] = await uploadLocalFiles(
    `business-documents/${business.id}`,
    [file]
  );

  if (shouldUseDemoData()) {
    const updated = demoStore.submitVerification(business.id, fileUrl, file.name);
    await notifyAdmins({
      title: 'Yeni KYC evrakı',
      body: `${business.name} doğrulama evrakı yükledi. İnceleme bekliyor.`,
      type: 'general',
      data: { businessId: business.id },
    });
    return updated;
  }

  throw new Error('KYC evrak yükleme REST backend\'de henüz desteklenmiyor.');
}
