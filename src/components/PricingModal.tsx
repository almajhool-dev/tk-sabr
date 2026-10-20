import React, { useState } from 'react';
import {
  CreditCard,
  Check,
  ShieldCheck,
  Lock,
  Zap,
  Sparkles,
  Tag,
  Building,
  Receipt,
  Download,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  SUBSCRIPTION_PLANS,
  calculateOrderPrice,
} from '../utils/paymentAdapter.ts';
import type { SubscriptionPlan, PaymentOrder, UserAccount } from '../types/index.ts';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onPlanUpgraded: (newPlan: 'pro' | 'business') => void;
  onRequireAuth: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onPlanUpgraded,
  onRequireAuth,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlanId, setSelectedPlanId] = useState<'pro' | 'business'>('pro');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [currency, setCurrency] = useState<'IQD' | 'USD'>('IQD');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [provider, setProvider] = useState<'areeba' | 'switch'>('areeba');
  const [paymentSuccessOrder, setPaymentSuccessOrder] = useState<PaymentOrder | null>(null);

  if (!isOpen) return null;

  const currentPricing = calculateOrderPrice(
    selectedPlanId,
    billingCycle,
    appliedCoupon || undefined
  );

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'SABR2026' || code === 'IRAQ2026' || code === 'WELCOME50') {
      setAppliedCoupon(code);
      setCouponError(null);
    } else {
      setCouponError('رمز الكوبون غير صالح أو منتهي الصلاحية.');
    }
  };

  const handleCheckout = async (planId: 'pro' | 'business') => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    setSelectedPlanId(planId);
    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          billingCycle,
          couponCode: appliedCoupon || undefined,
          userEmail: currentUser.email,
          paymentMethod: 'visa',
          provider,
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setPaymentSuccessOrder(data.order);
        onPlanUpgraded(planId);
      } else {
        setCheckoutError(data.message || 'بوابة الدفع غير مفعلة. لم يتم خصم أي مبلغ.');
      }
    } catch (e) {
      console.error(e);
      setCheckoutError('تعذر الاتصال بالدفع. لم يتم تأكيد أي خصم.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-3xl bg-gray-950 border border-cyan-500/40 p-6 sm:p-10 shadow-[0_0_80px_rgba(0,242,254,0.15)] my-8">
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-200 text-xs p-3 mb-5 text-center">
          تنبيه: الدفع والاشتراكات المدفوعة غير مفعّلة حالياً حتى ربط بوابة دفع عراقية رسمية. لا تدخل بيانات بطاقتك في هذا الموقع الآن.
          {checkoutError && <p role="alert" className="mt-2 text-red-300">{checkoutError}</p>}
        </div>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 left-6 p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Invoice Modal View */}
        {paymentSuccessOrder ? (
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">
                تم تفعيل الاشتراك والدفع بنجاح!
              </h3>
              <p className="text-sm text-gray-300 max-w-md mx-auto">
                شكراً لاشتراكك في منصة TK_SABR. تمت معالجة المعاملة المالية عبر بوابة الدفع المرخصة في العراق، وحسابك الآن مفعل بالميزات الكاملة.
              </p>
            </div>

            {/* Official Invoice Card */}
            <div className="max-w-md mx-auto rounded-2xl bg-gray-900/90 border border-cyan-500/30 p-6 text-right space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <span className="text-xs text-gray-400 font-mono">
                  رقم الفاتورة: {paymentSuccessOrder.invoiceNumber}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                  مدفوع بالكامل
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">الباقة المختارة:</span>
                  <span className="font-bold text-white uppercase">
                    باقة {paymentSuccessOrder.planId} ({paymentSuccessOrder.billingCycle === 'yearly' ? 'سنوي' : 'شهري'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">مزود الدفع المعتمد:</span>
                  <span className="font-bold text-cyan-400">
                    {paymentSuccessOrder.provider === 'areeba' ? 'Areeba Iraq' : 'Switch Iraq'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">مرجع المعاملة:</span>
                  <span className="font-mono text-gray-300">{paymentSuccessOrder.transactionRef}</span>
                </div>
                {paymentSuccessOrder.discountAppliedIQD ? (
                  <div className="flex justify-between text-emerald-400">
                    <span>الخصم المطبق:</span>
                    <span>-{paymentSuccessOrder.discountAppliedIQD.toLocaleString()} د.ع</span>
                  </div>
                ) : null}
                <div className="border-t border-gray-800 pt-2 flex justify-between text-sm font-black text-white">
                  <span>المبلغ الإجمالي المدفوع:</span>
                  <span className="text-cyan-300 font-mono">
                    {paymentSuccessOrder.amountIQD.toLocaleString()} د.ع (~${paymentSuccessOrder.amountUSD})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-4">
              <button
                onClick={() => {
                  setPaymentSuccessOrder(null);
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-sm shadow-[0_0_20px_rgba(0,242,254,0.4)] transition-all cursor-pointer"
              >
                العودة واستخدام المنصة
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>اشتراكات وباقات TK_SABR للعام 2026</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                اختر الباقة المناسبة لاحتياجاتك
              </h2>
              <p className="text-sm text-gray-400 max-w-lg mx-auto">
                ادفع بأمان عبر بطاقات Visa وMastercard مع تسوية مصرفية معتمدة داخل العراق.
              </p>

              {/* Billing Cycle and Currency Toggles */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                {/* Billing Cycle */}
                <div className="inline-flex p-1 rounded-xl bg-gray-900 border border-gray-800 text-xs">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      billingCycle === 'monthly'
                        ? 'bg-cyan-500 text-gray-950 shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    اشتراك شهري
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-4 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      billingCycle === 'yearly'
                        ? 'bg-cyan-500 text-gray-950 shadow-md'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>اشتراك سنوي</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500 text-gray-950 font-bold">
                      وفر 17%
                    </span>
                  </button>
                </div>

                {/* Currency */}
                <div className="inline-flex p-1 rounded-xl bg-gray-900 border border-gray-800 text-xs">
                  <button
                    onClick={() => setCurrency('IQD')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      currency === 'IQD'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    د.ع (دينار عراقي)
                  </button>
                  <button
                    onClick={() => setCurrency('USD')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      currency === 'USD'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    $ USD
                  </button>
                </div>
              </div>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const isPopular = plan.isPopular;
                const priceIQD =
                  billingCycle === 'yearly' ? plan.priceYearlyIQD : plan.priceMonthlyIQD;
                const priceUSD =
                  billingCycle === 'yearly' ? plan.priceYearlyUSD : plan.priceMonthlyUSD;

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl p-6 flex flex-col justify-between transition-all ${
                      isPopular
                        ? 'bg-gradient-to-b from-gray-900/90 to-gray-950 border-2 border-cyan-400/80 shadow-[0_0_35px_rgba(0,242,254,0.2)]'
                        : 'bg-gray-900/60 border border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-gray-950 text-[11px] font-black uppercase tracking-wider shadow-lg">
                        الأكثر طلباً
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xl font-bold text-white">{plan.nameAr}</h4>
                        <p className="text-xs text-gray-400 mt-1">{plan.tagline}</p>
                      </div>

                      {/* Pricing Tag */}
                      <div className="pt-2">
                        {plan.id === 'free' ? (
                          <div className="text-3xl font-black text-white">0 د.ع</div>
                        ) : (
                          <div>
                            <div className="text-3xl font-black text-cyan-400 font-mono">
                              {currency === 'IQD'
                                ? `${priceIQD.toLocaleString()} د.ع`
                                : `$${priceUSD}`}
                            </div>
                            <span className="text-xs text-gray-400">
                              /{billingCycle === 'yearly' ? 'سنة كاملة' : 'شهر'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Features List */}
                      <ul className="space-y-2.5 pt-4 border-t border-gray-800 text-xs text-gray-300">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-6">
                      {plan.id === 'free' ? (
                        <button
                          onClick={onClose}
                          className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm transition-all cursor-pointer"
                        >
                          الباقة الحالية
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCheckout(plan.id as 'pro' | 'business')}
                          disabled={isCheckingOut}
                          className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            isPopular
                              ? 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-gray-950 shadow-[0_0_20px_rgba(0,242,254,0.4)]'
                              : 'bg-gray-800 hover:bg-cyan-500 hover:text-gray-950 text-white'
                          }`}
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>اشترك الآن</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Iraqi Payment Gateway & Coupon Code Footer */}
            <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Gateway Provider Selection */}
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-gray-400 font-semibold">بوابة الدفع المصرفية:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setProvider('areeba')}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        provider === 'areeba'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-gray-950 border-gray-800 text-gray-400'
                      }`}
                    >
                      Areeba Iraq (Mastercard & Visa)
                    </button>
                    <button
                      onClick={() => setProvider('switch')}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        provider === 'switch'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-gray-950 border-gray-800 text-gray-400'
                      }`}
                    >
                      Switch Iraq (Qi Card / Visa)
                    </button>
                  </div>
                </div>

                {/* Coupon Code Input */}
                <form onSubmit={handleApplyCoupon} className="flex gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="كود الخصم مثلاً SABR2026"
                    className="h-10 px-3 rounded-lg bg-gray-950 border border-gray-800 text-xs text-white placeholder-gray-500 uppercase font-mono focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="h-10 px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    تطبيق
                  </button>
                </form>
              </div>

              {appliedCoupon && (
                <div className="text-xs text-emerald-400 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  <span>تم تطبيق الكوبون {appliedCoupon} بنجاح! تم خصم 20% من إجمالي المبلغ.</span>
                </div>
              )}
              {couponError && <div className="text-xs text-red-400">{couponError}</div>}

              {/* Banking & Security Trust Seals */}
              <div className="pt-3 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>دفع محمي بتشفير 256-bit ونظام 3D Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-cyan-400" />
                  <span>تسوية الأرباح تتم عبر المصرف العراقي للتجارة (TBI)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
