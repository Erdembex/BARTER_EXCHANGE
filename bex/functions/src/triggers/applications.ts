import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { Timestamp } from 'firebase-admin/firestore';
import {
  getAdminUids,
  notifyBusinessOwner,
  pushNotification,
  pushNotificationToMany,
} from '../lib/notifications';
import { appendPortfolioFromApplication } from '../lib/portfolio';

type ApplicationDoc = {
  userId: string;
  businessId: string;
  taskId: string;
  status: string;
  submissionFiles?: string[];
};

/** Yeni başvuru → işletmeye bildirim */
export const onApplicationCreated = onDocumentCreated(
  'applications/{applicationId}',
  async (event) => {
    const data = event.data?.data() as ApplicationDoc | undefined;
    const applicationId = event.params.applicationId;
    if (!data || data.status !== 'pending') return;

    await notifyBusinessOwner(data.businessId, {
      title: 'Yeni başvuru',
      body: 'Görevine yeni bir başvuru geldi. İncelemen bekleniyor.',
      type: 'general',
      data: { applicationId, taskId: data.taskId },
    });
  }
);

/** Başvuru durumu değişince bildirim + portföy */
export const onApplicationUpdated = onDocumentUpdated(
  'applications/{applicationId}',
  async (event) => {
    const before = event.data?.before.data() as ApplicationDoc | undefined;
    const after = event.data?.after.data() as ApplicationDoc | undefined;
    const applicationId = event.params.applicationId;

    if (!before || !after || before.status === after.status) return;

    const data = { applicationId, taskId: after.taskId };

    switch (`${before.status}->${after.status}`) {
      case 'pending->approved':
        await pushNotification({
          userId: after.userId,
          title: 'Başvurun onaylandı',
          body: 'Görevi tamamlayıp teslim edebilirsin. Başvurularım sekmesinden devam et.',
          type: 'application_approved',
          data,
        });
        break;

      case 'pending->rejected':
        await pushNotification({
          userId: after.userId,
          title: 'Başvurun reddedildi',
          body: 'İşletme başvurunu uygun bulmadı. Başka görevlere göz atabilirsin.',
          type: 'application_rejected',
          data,
        });
        break;

      case 'approved->submitted':
        await pushNotification({
          userId: after.userId,
          title: 'Teslimin alındı',
          body: 'Admin ekibimiz içeriği inceliyor. Uygunsuz içerik kontrolünden sonra süreç devam eder.',
          type: 'general',
          data,
        });
        await notifyBusinessOwner(after.businessId, {
          title: 'Görev teslimi geldi',
          body: 'Kullanıcı teslim yaptı. Admin onayı bekleniyor.',
          type: 'general',
          data,
        });
        await pushNotificationToMany(await getAdminUids(), {
          title: 'Yeni teslim incelemesi',
          body: 'Kullanıcı görev teslimi yükledi. Moderasyon bekliyor.',
          type: 'general',
          data,
        });
        break;

      case 'submitted->submission_approved': {
        await pushNotification({
          userId: after.userId,
          title: 'Teslimin onaylandı',
          body: 'Admin içeriği onayladı. Görsellerin portföyünde görünür; işletme kupon verebilir.',
          type: 'general',
          data,
        });
        await notifyBusinessOwner(after.businessId, {
          title: 'Teslim admin onayladı',
          body: 'Kullanıcı teslimi uygun bulundu. Başvurularından kupon verebilirsin.',
          type: 'general',
          data,
        });

        const approvedAt = Timestamp.now();
        await appendPortfolioFromApplication({
          userId: after.userId,
          applicationId,
          taskId: after.taskId,
          submissionFiles: after.submissionFiles ?? [],
          approvedAt,
        });
        break;
      }

      case 'submitted->approved':
        await pushNotification({
          userId: after.userId,
          title: 'Teslimin reddedildi',
          body: 'Admin içeriği uygun bulmadı. Düzeltip tekrar teslim edebilirsin.',
          type: 'general',
          data,
        });
        break;

      default:
        break;
    }
  }
);
