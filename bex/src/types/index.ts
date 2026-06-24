import { GeoPoint, Timestamp } from 'firebase/firestore';

// ─── Kullanıcı ───────────────────────────────────────────────
export type UserRole = 'user' | 'business' | 'admin';

export interface BexUser {
  uid: string;
  role: UserRole;
  displayName: string;
  email: string;
  phone: string;
  phoneVerified: boolean;
  avatarUrl: string;
  reputationScore: number;
  completedTaskCount: number;
  joinedAt: Timestamp;
  isBanned: boolean;
}

export type CreateBexUser = Omit<BexUser, 'joinedAt'> & {
  joinedAt: ReturnType<typeof import('firebase/firestore').serverTimestamp>;
};

// ─── İşletme ─────────────────────────────────────────────────
export type BusinessCategory =
  | 'food'
  | 'beauty'
  | 'fitness'
  | 'education'
  | 'retail'
  | 'services'
  | 'entertainment'
  | 'other';

export interface Business {
  id: string;
  ownerUid: string;
  name: string;
  category: BusinessCategory;
  logoUrl: string;
  address: string;
  location: GeoPoint;
  isVerified: boolean;
  reputationScore: number;
  totalTasksPublished: number;
  createdAt: Timestamp;
}

export type CreateBusiness = Omit<Business, 'id' | 'createdAt' | 'isVerified' | 'reputationScore' | 'totalTasksPublished'>;

// ─── Görev ───────────────────────────────────────────────────
export type TaskCategory =
  | 'design'
  | 'development'
  | 'marketing'
  | 'content'
  | 'photography'
  | 'video'
  | 'translation'
  | 'consulting'
  | 'other';

export type TaskDifficulty = 'easy' | 'medium' | 'hard';
export type TaskStatus = 'draft' | 'active' | 'paused' | 'completed';

export interface Task {
  id: string;
  businessId: string;
  title: string;
  description: string;
  category: TaskCategory;
  difficulty: TaskDifficulty;
  estimatedHours: number;
  rewardDescription: string;
  rewardQuantity: number;
  maxApplicants: number;
  currentApplicantCount: number;
  status: TaskStatus;
  location: GeoPoint;
  deadline: Timestamp;
  createdAt: Timestamp;
  approvedByAdmin: boolean;
  featured?: boolean;
  imageUrl?: string;
}

export type CreateTask = Omit<
  Task,
  'id' | 'currentApplicantCount' | 'createdAt' | 'approvedByAdmin' | 'featured'
>;

// ─── Başvuru ─────────────────────────────────────────────────
export type ApplicationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'submitted'
  | 'rewarded';

export interface Application {
  id: string;
  taskId: string;
  userId: string;
  businessId: string;
  status: ApplicationStatus;
  coverLetter: string;
  portfolioUrl?: string;
  submissionText: string;
  submissionFiles: string[];
  submittedAt?: Timestamp;
  reviewedAt?: Timestamp;
  reviewNote?: string;
  createdAt: Timestamp;
}

export type CreateApplication = Pick<
  Application,
  'taskId' | 'businessId' | 'coverLetter' | 'portfolioUrl'
>;

// ─── Kupon ───────────────────────────────────────────────────
export type CouponStatus = 'active' | 'exhausted' | 'expired';

export interface CouponUsage {
  usedAt: Timestamp;
  verifiedBy: string;
}

export interface Coupon {
  id: string;
  userId: string;
  businessId: string;
  taskId: string;
  applicationId: string;
  rewardDescription: string;
  totalUses: number;
  usedCount: number;
  qrCode: string;
  couponCode: string;
  expiresAt: Timestamp;
  usageHistory: CouponUsage[];
  status: CouponStatus;
  createdAt: Timestamp;
}

// ─── Auth form ───────────────────────────────────────────────
export interface AuthFormData {
  email: string;
  password: string;
  displayName?: string;
  role?: UserRole;
  phone?: string;
}

// ─── Firestore koleksiyon isimleri ───────────────────────────
export const COLLECTIONS = {
  USERS: 'users',
  BUSINESSES: 'businesses',
  TASKS: 'tasks',
  APPLICATIONS: 'applications',
  COUPONS: 'coupons',
} as const;
