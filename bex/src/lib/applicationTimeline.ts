import { Timestamp } from 'firebase/firestore';
import { Application } from '@/types';
import { formatRelativeTime, formatShortDate } from '@/lib/dateUtils';

export interface ApplicationTimelineEvent {
  label: string;
  at?: Timestamp;
  relative?: string;
}

export function getApplicationTimeline(app: Application): ApplicationTimelineEvent[] {
  const events: ApplicationTimelineEvent[] = [
    {
      label: 'Başvuru gönderildi',
      at: app.createdAt,
      relative: formatRelativeTime(app.createdAt),
    },
  ];

  if (app.submittedAt) {
    events.push({
      label: 'Görev teslim edildi',
      at: app.submittedAt,
      relative: formatRelativeTime(app.submittedAt),
    });
  }

  if (app.reviewedAt && ['approved', 'rejected', 'submission_approved'].includes(app.status)) {
    events.push({
      label:
        app.status === 'rejected'
          ? 'Başvuru reddedildi'
          : app.status === 'submission_approved'
            ? 'Admin teslimi onayladı'
            : 'İnceleme tamamlandı',
      at: app.reviewedAt,
      relative: formatRelativeTime(app.reviewedAt),
    });
  }

  if (app.status === 'rewarded') {
    events.push({
      label: 'Kupon verildi',
      relative: app.reviewedAt ? formatRelativeTime(app.reviewedAt) : 'Yakın zamanda',
    });
  }

  return events.map((e) => ({
    ...e,
    relative: e.relative || (e.at ? formatShortDate(e.at) : ''),
  }));
}
