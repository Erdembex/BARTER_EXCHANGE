import { GeoPoint, Timestamp } from 'firebase/firestore';
import { businessesRepository } from '../data/businessesRepository';
import { demoStore } from '../../lib/demoStore';
import { shouldUseDemoData } from '../../lib/devMode';
import { hasRestAuthSession } from '../../lib/auth/sessionClaims';
import { fetchBusinessWithVerification } from './businessVerificationApi';
import { Business, CreateBusiness } from '../../types';

export async function ensureBusinessForOwner(
  ownerUid: string,
  displayName: string
): Promise<Business> {
  if (await hasRestAuthSession()) {
    const business = await fetchBusinessWithVerification(ownerUid);
    if (business) return business;
  }

  const existing = await businessesRepository.getByOwner(ownerUid);
  if (existing) {
    // Eski demo ataması (Studio Cut) — kayıt adını kullan
    if (
      shouldUseDemoData() &&
      displayName?.trim() &&
      existing.id === 'demo-b1' &&
      existing.name === 'Studio Cut'
    ) {
      const fixed =
        demoStore.updateBusiness(existing.id, { name: displayName.trim() }) ??
        existing;
      return fixed;
    }
    return existing;
  }

  const data: CreateBusiness = {
    ownerUid,
    name: displayName?.trim() || 'Yeni İşletme',
    category: 'services',
    logoUrl: '',
    address: 'İstanbul',
    location: shouldUseDemoData()
      ? demoStore.defaultLocation
      : new GeoPoint(41.0082, 28.9784),
  };

  const id = await businessesRepository.create(data);
  const business = await businessesRepository.getById(id);
  if (!business) throw new Error('İşletme oluşturulamadı');
  return business;
}
