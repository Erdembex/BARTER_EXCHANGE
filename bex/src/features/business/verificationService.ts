import {
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { shouldUseDemoData } from '@/lib/devMode';
import { demoStore } from '@/lib/demoStore';
import { businessesRepository } from '@/features/data/businessesRepository';
import { uploadLocalFiles } from '@/lib/storageUpload';
import { COLLECTIONS, Business } from '@/types';
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

  await addDoc(collection(db, COLLECTIONS.BUSINESS_DOCUMENTS), {
    businessId: business.id,
    ownerUid: business.ownerUid,
    fileUrl,
    fileName: file.name,
    mimeType: file.mimeType,
    status: 'pending',
    uploadedAt: serverTimestamp(),
  });

  await updateDoc(doc(db, COLLECTIONS.BUSINESSES, business.id), {
    verificationStatus: 'pending',
    verificationDocumentUrl: fileUrl,
  });

  const updated = await businessesRepository.getById(business.id);
  if (!updated) throw new Error('İşletme güncellenemedi');
  return updated;
}
