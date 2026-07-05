import { GeoPoint, Timestamp } from 'firebase/firestore';
import { fetchBusinessProfile } from '../auth/authApi';
import { businessesRepository } from '../data/businessesRepository';
import { demoStore } from '../../lib/demoStore';
import { shouldUseDemoData } from '../../lib/devMode';
import { hasRestAuthSession } from '../../lib/auth/sessionClaims';
import { Business, BusinessCategory, CreateBusiness } from '../../types';

function mapBusinessCategory(raw?: string): BusinessCategory {
  const value = raw?.toUpperCase() ?? '';
  const map: Record<string, BusinessCategory> = {
    FOOD: 'food',
    BEAUTY: 'beauty',
    FITNESS: 'fitness',
    GYM: 'fitness',
    EDUCATION: 'education',
    RETAIL: 'retail',
    SERVICES: 'services',
    ENTERTAINMENT: 'entertainment',
    OTHER: 'other',
  };
  return map[value] ?? 'other';
}

export async function ensureBusinessForOwner(
  ownerUid: string,
  displayName: string
): Promise<Business> {
  if (await hasRestAuthSession()) {
    try {
      const profile = await fetchBusinessProfile();
      return {
        id: profile.id,
        ownerUid,
        name: profile.businessName?.trim() || displayName?.trim() || 'İşletme',
        category: mapBusinessCategory(profile.category),
        logoUrl: profile.logoUrl ?? '',
        address: `${profile.district ?? ''}, ${profile.city ?? ''}`.trim() || 'Türkiye',
        location: new GeoPoint(41.0082, 28.9784),
        isVerified: profile.verified ?? false,
        verificationStatus: profile.verified ? 'verified' : 'none',
        reputationScore: 0,
        totalTasksPublished: 0,
        createdAt: Timestamp.now(),
      };
    } catch {
      // yerel yedeğe düş
    }
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
