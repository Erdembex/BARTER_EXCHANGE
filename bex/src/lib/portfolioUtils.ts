const IMAGE_EXT = /\.(jpg|jpeg|png|webp|gif|heic|heif)(\?|$)/i;

export function isPortfolioImageUrl(url: string): boolean {
  if (!url?.trim()) return false;
  if (url.startsWith('file:') || url.startsWith('content:')) return true;
  if (url.startsWith('data:image/')) return true;
  if (url.includes('/uploads/')) return true;
  return IMAGE_EXT.test(url);
}

export const PORTFOLIO_APPROVED_STATUSES = ['submission_approved', 'rewarded'] as const;
