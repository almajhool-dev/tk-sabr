/**
 * Core type definitions for TK_SABR TikTok Analysis Platform
 */

export interface TikTokProfile {
  username: string;
  displayName: string;
  avatar: string;
  id?: string;
  secUid?: string;
  bio: string;
  verified: boolean;
  privateAccount: boolean;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  videoCount: number;
  originalUrl: string;
  engagementRate: number; // percentage
  avgLikesPerVideo: number;
  dataReliability: 'verified_public' | 'partial_public' | 'not_found' | 'private' | 'rate_limited';
  scannedAt: string;
}

export interface SecurityFactor {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  status: 'good' | 'average' | 'poor';
  note: string;
}

export interface SecurityScore {
  score: number; // 0 to 100
  level: 'critical' | 'warning' | 'moderate' | 'excellent';
  color: string;
  grade: string;
  title: string;
  factors: SecurityFactor[];
  confidencePercentage: number;
  disclaimer: string;
}

export interface DiagnosticProblem {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info';
  reason: string;
  solution: string;
  recommendation: string;
  category: 'engagement' | 'profile' | 'content' | 'security';
}

export interface AIWeeklyMilestone {
  week: number;
  focus: string;
  milestones: string[];
  actions: string[];
}

export interface GeminiAIReport {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  engagementAnalysis: string;
  contentStrategyIdeas: string[];
  optimalPostingTimes: Array<{
    day: string;
    timeWindow: string;
    reason: string;
  }>;
  thirtyDayPlan: AIWeeklyMilestone[];
  toneAndNiche: string;
  growthVerdict: string;
  aiDisclaimer: string;
}

export interface HistoryPoint {
  timestamp: string;
  followers: number;
  likes: number;
  engagementRate: number;
}

export interface MonitoredAccount {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  history: HistoryPoint[];
  initialFollowers: number;
  currentFollowers: number;
  growthChange: number; // delta percentage
  lastChecked: string;
  status: 'active' | 'warning' | 'stable';
  alertMessage?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro' | 'business';
  scansUsedToday: number;
  scansLimitToday: number;
  scansUsedThisMonth: number;
  scansLimitMonth: number;
  totalScans: number;
  referralCode: string;
  referralCount: number;
  bonusScans: number;
  favoriteAccounts: string[];
  createdAt: string;
}

export interface SubscriptionPlan {
  id: 'free' | 'pro' | 'business';
  nameAr: string;
  nameEn: string;
  tagline: string;
  priceMonthlyIQD: number;
  priceYearlyIQD: number;
  priceMonthlyUSD: number;
  priceYearlyUSD: number;
  scansMonthly: number;
  monitoredAccountsLimit: number;
  features: string[];
  isPopular?: boolean;
}

export interface PaymentOrder {
  orderId: string;
  userId: string;
  userEmail: string;
  planId: 'pro' | 'business';
  billingCycle: 'monthly' | 'yearly';
  amountIQD: number;
  amountUSD: number;
  provider: 'areeba' | 'switch';
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  invoiceNumber: string;
  transactionRef: string;
  paymentMethod: 'visa' | 'mastercard' | 'qi';
  createdAt: string;
  paidAt?: string;
  discountAppliedIQD?: number;
  couponCode?: string;
}

export interface MerchantSettlementInfo {
  providerName: string;
  beneficiaryBank: string;
  merchantAccountName: string;
  merchantId: string;
  maskedIban: string;
  currency: string;
  connectionStatus: 'active' | 'pending_verification';
  totalSettledIQD: number;
  pendingSettlementIQD: number;
  lastSettlementDate: string;
  grossRevenueIQD: number;
  gatewayFeesIQD: number;
  netRevenueIQD: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  eventType: 'scan' | 'login' | 'payment' | 'settlement' | 'plan_change' | 'security_alert';
  description: string;
  ipAddress: string;
  severity: 'low' | 'medium' | 'high';
}
