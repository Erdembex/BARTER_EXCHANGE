import { GeoPoint } from 'firebase/firestore';
import { businessesRepository } from '../data/businessesRepository';
import { demoStore } from '../../lib/demoStore';
import { shouldUseDemoData } from '../../lib/devMode';
import { Business, BusinessCategory, CreateBusiness } from '../../types';

export async function ensureBusinessForOwner(
  ownerUid: string,
  displayName: string
): Promise<Business> {
  const existing = await businessesRepository.getByOwner(ownerUid);
  if (existing) return existing;

  if (shouldUseDemoData()) {
    const claimed = demoStore.claimDemoBusiness(ownerUid);
    if (claimed) return claimed;
  }

  const data: CreateBusiness = {
    ownerUid,
    name: displayName ? `${displayName} İşletmesi` : 'Yeni İşletme',
    category: 'services' as BusinessCategory,
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
