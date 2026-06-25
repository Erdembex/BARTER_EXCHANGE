import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';

initializeApp();
const db = getFirestore();

const COLLECTIONS = {
  APPLICATIONS: 'applications',
  BUSINESSES: 'businesses',
  TASKS: 'tasks',
  COUPONS: 'coupons',
} as const;

function generateCouponCode(): string {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BEX-${part()}-${part()}`;
}

async function assertBusinessOwner(businessId: string, uid: string): Promise<void> {
  const bizSnap = await db.collection(COLLECTIONS.BUSINESSES).doc(businessId).get();
  if (!bizSnap.exists) {
    throw new HttpsError('not-found', 'İşletme bulunamadı.');
  }
  if (bizSnap.data()?.ownerUid !== uid) {
    throw new HttpsError('permission-denied', 'Bu işlem için yetkiniz yok.');
  }
}

/** İşletme başvuruyu onaylar — kupon oluşturulmaz. */
export const approveApplication = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Giriş yapmalısınız.');
  }

  const applicationId = request.data?.applicationId as string | undefined;
  const reviewNote = (request.data?.reviewNote as string | undefined) ?? '';

  if (!applicationId?.trim()) {
    throw new HttpsError('invalid-argument', 'applicationId gerekli.');
  }

  const appRef = db.collection(COLLECTIONS.APPLICATIONS).doc(applicationId);
  const appSnap = await appRef.get();
  if (!appSnap.exists) {
    throw new HttpsError('not-found', 'Başvuru bulunamadı.');
  }

  const app = appSnap.data()!;
  if (app.status !== 'pending') {
    throw new HttpsError('failed-precondition', 'Bu başvuru onaylanamaz.');
  }

  await assertBusinessOwner(app.businessId, request.auth.uid);

  await appRef.update({
    status: 'approved',
    reviewNote,
    reviewedAt: FieldValue.serverTimestamp(),
  });

  return { ok: true };
});

/** Teslim onaylandıktan sonra kupon üretir. */
export const issueCouponForSubmission = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Giriş yapmalısınız.');
  }

  const applicationId = request.data?.applicationId as string | undefined;
  const reviewNote = (request.data?.reviewNote as string | undefined) ?? '';

  if (!applicationId?.trim()) {
    throw new HttpsError('invalid-argument', 'applicationId gerekli.');
  }

  const appRef = db.collection(COLLECTIONS.APPLICATIONS).doc(applicationId);
  const appSnap = await appRef.get();
  if (!appSnap.exists) {
    throw new HttpsError('not-found', 'Başvuru bulunamadı.');
  }

  const app = appSnap.data()!;
  if (app.status !== 'submission_approved') {
    throw new HttpsError('failed-precondition', 'Teslim onaylanamaz.');
  }

  await assertBusinessOwner(app.businessId, request.auth.uid);

  const taskSnap = await db.collection(COLLECTIONS.TASKS).doc(app.taskId).get();
  if (!taskSnap.exists) {
    throw new HttpsError('not-found', 'Görev bulunamadı.');
  }
  const task = taskSnap.data()!;

  const couponRef = db.collection(COLLECTIONS.COUPONS).doc();
  const couponCode = generateCouponCode();
  const expiresAt = Timestamp.fromMillis(Date.now() + 90 * 86400000);

  await db.runTransaction(async (tx) => {
    const freshApp = await tx.get(appRef);
    if (!freshApp.exists) {
      throw new HttpsError('not-found', 'Başvuru bulunamadı.');
    }
    if (freshApp.data()!.status !== 'submission_approved') {
      throw new HttpsError('failed-precondition', 'Teslim zaten işlenmiş.');
    }

    tx.update(appRef, {
      status: 'rewarded',
      reviewNote,
      reviewedAt: FieldValue.serverTimestamp(),
    });

    tx.set(couponRef, {
      userId: app.userId,
      businessId: app.businessId,
      taskId: app.taskId,
      applicationId,
      rewardDescription: task.rewardDescription,
      totalUses: task.rewardQuantity ?? 1,
      usedCount: 0,
      qrCode: `qr-${Date.now()}`,
      couponCode,
      expiresAt,
      usageHistory: [],
      status: 'active',
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  const couponSnap = await couponRef.get();
  return {
    coupon: { id: couponRef.id, ...couponSnap.data() },
  };
});

/** @deprecated issueCouponForSubmission kullan */
export const approveApplicationAndIssueCoupon = issueCouponForSubmission;

/** İşletme kupon kullanımını onaylar. */
export const redeemCoupon = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Giriş yapmalısınız.');
  }

  const couponId = request.data?.couponId as string | undefined;
  if (!couponId?.trim()) {
    throw new HttpsError('invalid-argument', 'couponId gerekli.');
  }

  const couponRef = db.collection(COLLECTIONS.COUPONS).doc(couponId);
  const couponSnap = await couponRef.get();
  if (!couponSnap.exists) {
    throw new HttpsError('not-found', 'Kupon bulunamadı.');
  }

  const coupon = couponSnap.data()!;
  await assertBusinessOwner(coupon.businessId, request.auth.uid);

  if (coupon.status !== 'active') {
    throw new HttpsError('failed-precondition', 'Kupon aktif değil.');
  }
  if ((coupon.usedCount ?? 0) >= (coupon.totalUses ?? 1)) {
    throw new HttpsError('failed-precondition', 'Kupon tükenmiş.');
  }

  const expiresAt = coupon.expiresAt as Timestamp | undefined;
  if (expiresAt && expiresAt.toMillis() < Date.now()) {
    throw new HttpsError('failed-precondition', 'Kuponun süresi dolmuş.');
  }

  const scannedBy = request.auth.uid;
  const usedCount = (coupon.usedCount ?? 0) + 1;
  const status = usedCount >= (coupon.totalUses ?? 1) ? 'exhausted' : 'active';
  const usageEntry = { usedAt: FieldValue.serverTimestamp(), scannedBy };

  await couponRef.update({
    usedCount,
    status,
    usageHistory: FieldValue.arrayUnion(usageEntry),
  });

  const updated = await couponRef.get();
  return {
    coupon: { id: couponRef.id, ...updated.data() },
  };
});
