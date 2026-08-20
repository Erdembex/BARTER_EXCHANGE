export function generateCouponCode(): string {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PS-${part()}-${part()}`;
}
