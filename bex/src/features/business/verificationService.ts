import {
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { shouldUseDemoData } from '@/lib/devMode';
import { demoStore } from '@/lib/demoStore';
import { businessesRepository } from '@/features/data/businessesRepository';
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
  if (shouldUseDemoData()) {
    const updated = demoStore.submitVerification(business.id, file.uri, file.name);
    await notifyAdmins({
      title: 'Yeni KYC evrakı',
      body: `${business.name} doğrulama evrakı yükledi. İnceleme bekliyor.`,
      type: 'general',
      data: { businessId: business.id },
    });
    return updated;
  }

  const path = `business-documents/${business.id}/${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  const response = await fetch(file.uri);
  const blob = await response.blob();
  await uploadBytes(storageRef, blob, { contentType: file.mimeType });
  const fileUrl = await getDownloadURL(storageRef);

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
