import { Timestamp } from 'firebase/firestore';

export function formatRelativeTime(ts?: Timestamp | null): string {
  if (!ts?.toMillis) return '';
  const diffMs = Date.now() - ts.toMillis();
  if (diffMs < 0) return 'Az önce';

  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins} dk önce`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa önce`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;

  return formatShortDate(ts);
}

export function formatShortDate(ts?: Timestamp | null): string {
  if (!ts?.toDate) return '—';
  return ts.toDate().toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDaysUntil(ts?: Timestamp | null): string {
  if (!ts?.toMillis) return '—';
  const diff = Math.ceil((ts.toMillis() - Date.now()) / 86400000);
  if (diff < 0) return 'Süresi doldu';
  if (diff === 0) return 'Bugün bitiyor';
  if (diff === 1) return '1 gün kaldı';
  return `${diff} gün kaldı`;
}
