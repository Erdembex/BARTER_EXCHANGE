/** Oturum bilgisi — eski firebaseUser alanıyla uyumlu */
export interface AuthSession {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  userType: 'BUSINESS' | 'INDIVIDUAL' | string;
  profileId: string;
}

export interface IndividualProfileDto {
  id: string;
  username: string;
  fullName: string;
  city: string;
  district: string;
  avatarUrl?: string | null;
  bio?: string | null;
  skills?: string[];
}

export interface BusinessProfileDto {
  id: string;
  businessName: string;
  category: string;
  city: string;
  district: string;
  phone?: string | null;
  logoUrl?: string | null;
  bio?: string | null;
  verified?: boolean;
}
