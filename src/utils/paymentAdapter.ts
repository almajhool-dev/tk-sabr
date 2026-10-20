import type { SubscriptionPlan, PaymentOrder, MerchantSettlementInfo } from '../types/index.ts';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    nameAr: 'الباقة المجانية',
    nameEn: 'Free Starter',
    tagline: 'للتجربة والفحص السريع للأفراد',
    priceMonthlyIQD: 0,
    priceYearlyIQD: 0,
    priceMonthlyUSD: 0,
    priceYearlyUSD: 0,
    scansMonthly: 3 * 30, // 3 per day
    monitoredAccountsLimit: 0,
    features: [
      '3 فحوصات يومياً للحسابات العامة',
      'فحص فوري بدون إدخال كلمة مرور',
      'عرض صورة الحساب والإحصائيات العامة',
      'حساب مؤشر أمان الحساب التقديري',
      'تشخيص المشاكل والحلول المتاحة',
      'تقارير مبسطة داخل المنصة',
    ],
  },
  {
    id: 'pro',
    nameAr: 'الباقة الاحترافية (Pro)',
    nameEn: 'Professional',
    tagline: 'لصناع المحتوى والمسوقين المحترفين',
    priceMonthlyIQD: 19000,
    priceYearlyIQD: 190000,
    priceMonthlyUSD: 14.99,
    priceYearlyUSD: 149.9,
    scansMonthly: 100,
    monitoredAccountsLimit: 5,
    isPopular: true,
    features: [
      '100 فحص شهرياً فائق السرعة',
      'تحليل الذكاء الاصطناعي التوليدي عبر Gemini',
      'خطة تطوير الحساب لمدة 30 يوماً',
      'تحميل وتصدير تقرير PDF احترافي معتمد',
      'نظام مقارنة الحسابات والمنافسين',
      'مراقبة 5 حسابات مع تنبيهات التغيرات',
      'اقتراحات أفضل أوقات النشر وأفكار الفيديوهات',
      'دعم فني عبر البريد الإلكتروني',
    ],
  },
  {
    id: 'business',
    nameAr: 'باقة الأعمال (Business)',
    nameEn: 'Enterprise & Agency',
    tagline: 'للوكالات الإعلانية والشركات وفرق العمل',
    priceMonthlyIQD: 59000,
    priceYearlyIQD: 590000,
    priceMonthlyUSD: 45.0,
    priceYearlyUSD: 450.0,
    scansMonthly: 1000,
    monitoredAccountsLimit: 50,
    features: [
      '1,000 فحص شهرياً مع أولوية المعالجة',
      'مراقبة متقدمة حتى 50 حساب TikTok',
      'مقارنة جماعية متعددة بين الحسابات',
      'تقارير PDF غير محدودة مع شعار مخصص',
      'تحليلات دورية وإشعارات ذكية فورية',
      'إمكانية إدارة وتصدير بيانات الفرق',
      'أعلى مستوى دقة وسرعة في جلب البيانات',
      'مدير حساب ودعم ذو أولوية 24/7',
    ],
  },
];

export const VALID_COUPONS: Record<string, { discountPercent: number; code: string; label: string }> = {
  SABR2026: {
    discountPercent: 20,
    code: 'SABR2026',
    label: 'خصم خاص 20% لرواد منصة TK_SABR',
  },
  IRAQ2026: {
    discountPercent: 25,
    code: 'IRAQ2026',
    label: 'عرض العراق الحصري خصم 25%',
  },
  WELCOME50: {
    discountPercent: 50,
    code: 'WELCOME50',
    label: 'خصم نصف السعر للشهر الأول للمستخدمين الجدد',
  },
};

/**
 * Calculates final pricing with discounts
 */
export function calculateOrderPrice(
  planId: 'pro' | 'business',
  cycle: 'monthly' | 'yearly',
  couponCode?: string
): {
  baseAmountIQD: number;
  discountIQD: number;
  finalAmountIQD: number;
  baseAmountUSD: number;
  finalAmountUSD: number;
  couponApplied?: { code: string; percent: number; label: string };
} {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId) || SUBSCRIPTION_PLANS[1];
  const isYearly = cycle === 'yearly';

  const baseAmountIQD = isYearly ? plan.priceYearlyIQD : plan.priceMonthlyIQD;
  const baseAmountUSD = isYearly ? plan.priceYearlyUSD : plan.priceMonthlyUSD;

  let discountPercent = 0;
  let couponApplied;

  if (couponCode && VALID_COUPONS[couponCode.trim().toUpperCase()]) {
    const cp = VALID_COUPONS[couponCode.trim().toUpperCase()];
    discountPercent = cp.discountPercent;
    couponApplied = {
      code: cp.code,
      percent: cp.discountPercent,
      label: cp.label,
    };
  }

  const discountIQD = Math.round((baseAmountIQD * discountPercent) / 100);
  const finalAmountIQD = Math.max(0, baseAmountIQD - discountIQD);
  const finalAmountUSD = Number((baseAmountUSD * (1 - discountPercent / 100)).toFixed(2));

  return {
    baseAmountIQD,
    discountIQD,
    finalAmountIQD,
    baseAmountUSD,
    finalAmountUSD,
    couponApplied,
  };
}

/**
 * Payment Gateway Adapter Interface
 * Enables plugging in Areeba Iraq, Switch Iraq, or another provider smoothly
 */
export interface PaymentGatewayAdapter {
  providerName: string;
  createCheckoutSession(order: PaymentOrder): Promise<{
    checkoutUrl: string;
    transactionRef: string;
    gatewayOrderId: string;
  }>;
  verifyWebhookSignature(payload: string, signature: string): boolean;
  processSettlementCheck(): Promise<Partial<MerchantSettlementInfo>>;
}

/**
 * Default settlement information for the Iraqi Bank account configuration
 */
export const INITIAL_MERCHANT_SETTLEMENT: MerchantSettlementInfo = {
  providerName: 'غير مرتبط',
  beneficiaryBank: 'غير محدد',
  merchantAccountName: 'غير محدد',
  merchantId: 'غير محدد',
  maskedIban: 'غير متاح',
  currency: 'IQD',
  connectionStatus: 'pending_verification',
  totalSettledIQD: 0,
  pendingSettlementIQD: 0,
  lastSettlementDate: '',
  grossRevenueIQD: 0,
  gatewayFeesIQD: 0,
  netRevenueIQD: 0,
};
