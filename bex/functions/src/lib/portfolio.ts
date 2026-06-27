import { Timestamp } from 'firebase-admin/firestore';
import { db, COLLECTIONS } from './firestore';

const IMAGE_EXT = /\.(jpg|jpeg|png|webp|gif|heic|heif)(\?|$)/i;

function isPortfolioImageUrl(url: string): boolean {
  if (!url?.trim()) return false;
  if (url.startsWith('file:') || url.startsWith('content:')) return true;
  if (url.startsWith('data:image/')) return true;
  return IMAGE_EXT.test(url);
}

type PortfolioItemDoc = {
  id: string;
  imageUrl: string;
  taskTitle: string;
  applicationId: string;
  approvedAt: Timestamp;
};

export async function appendPortfolioFromApplication(params: {
  userId: string;
  applicationId: string;
  taskId: string;
  submissionFiles: string[];
  approvedAt: Timestamp;
}): Promise<void> {
  const taskSnap = await db.collection(COLLECTIONS.TASKS).doc(params.taskId).get();
  const taskTitle = (taskSnap.data()?.title as string) ?? 'Görev';

  const incoming: PortfolioItemDoc[] = params.submissionFiles
    .filter(isPortfolioImageUrl)
    .map((imageUrl, index) => ({
      id: `${params.applicationId}-${index}`,
      imageUrl,
      taskTitle,
      applicationId: params.applicationId,
      approvedAt: params.approvedAt,
    }));

  if (incoming.length === 0) return;

  const userRef = db.collection(COLLECTIONS.USERS).doc(params.userId);

  await db.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef);
    if (!userSnap.exists) return;

    const existing = (userSnap.data()?.portfolioItems ?? []) as PortfolioItemDoc[];
    const seen = new Set(existing.map((item) => item.imageUrl));
    const merged = [...existing];

    for (const item of incoming) {
      if (seen.has(item.imageUrl)) continue;
      seen.add(item.imageUrl);
      merged.push(item);
    }

    merged.sort((a, b) => b.approvedAt.toMillis() - a.approvedAt.toMillis());
    tx.update(userRef, { portfolioItems: merged });
  });
}
