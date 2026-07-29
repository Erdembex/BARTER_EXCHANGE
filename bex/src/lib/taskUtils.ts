import { Timestamp } from 'firebase/firestore';
import { TaskDifficulty } from '../types';
import { Colors } from '../theme';

export function formatDeadline(deadline: Timestamp | undefined): string {
  if (!deadline?.toDate) return '—';
  const date = deadline.toDate();
  const diff = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'Süresi doldu';
  if (diff === 0) return 'Bugün';
  if (diff === 1) return '1 gün kaldı';
  return `${diff} gün kaldı`;
}

export function isTaskDeadlineExpired(deadline: Timestamp | undefined): boolean {
  if (!deadline?.toMillis) return false;
  return deadline.toMillis() < Date.now();
}

export function isTaskOpenForApplications(task: {
  status: string;
  deadline?: Timestamp;
}): boolean {
  if (task.status !== 'active') return false;
  return !isTaskDeadlineExpired(task.deadline);
}

export function getDifficultyColor(difficulty: TaskDifficulty): string {
  switch (difficulty) {
    case 'easy':
      return Colors.difficultyEasy;
    case 'medium':
      return Colors.difficultyMedium;
    case 'hard':
      return Colors.difficultyHard;
  }
}

export function getGreeting(name?: string): string {
  const hour = new Date().getHours();
  let time = 'Merhaba';
  if (hour < 12) time = 'Günaydın';
  else if (hour < 18) time = 'İyi günler';
  else time = 'İyi akşamlar';
  return name ? `${time}, ${name.split(' ')[0]} 👋` : `${time} 👋`;
}

export function matchesSearch(
  title: string,
  description: string,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    title.toLowerCase().includes(q) ||
    description.toLowerCase().includes(q)
  );
}
