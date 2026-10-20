import React, { useState } from 'react';
import {
  Search,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Lock,
  ArrowRight,
  Terminal,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { cleanTikTokUsername, isValidTikTokUsername } from '../utils/tiktok.ts';

interface TikTokScannerProps {
  onScanStart: (username: string) => void;
  isLoading: boolean;
  scanStep: string;
  errorMessage: string | null;
}

export const TikTokScanner: React.FC<TikTokScannerProps> = ({
  onScanStart,
  isLoading,
  scanStep,
  errorMessage,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const popularUsers = [
    { name: 'Khaby Lame', user: 'khaby.lame' },
    { name: 'MrBeast', user: 'mrbeast' },
    { name: 'Noor Stars', user: 'noorstars' },
    { name: 'TikTok Official', user: 'tiktok' },
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;

    setLocalError(null);
    const cleaned = cleanTikTokUsername(inputVal);

    if (!cleaned) {
      setLocalError('يرجى إدخال اسم مستخدم TikTok أو رابط الحساب المراد فحصه.');
      return;
    }

    if (!isValidTikTokUsername(cleaned)) {
      setLocalError('اسم المستخدم غير متوافق مع صيغة حسابات TikTok (حروف، أرقام، شرطة سفلية ونقطة، بين 2-24 حرفاً).');
      return;
    }

    onScanStart(cleaned);
  };

  const handleChipClick = (username: string) => {
    setInputVal(username);
    setLocalError(null);
    onScanStart(username);
  };

  return (
    <div className="relative max-w-4xl mx-auto px-4 pt-10 pb-16">
      {/* Cybersecurity Top Badge */}
      <div className="flex items-center justify-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs backdrop-blur-md shadow-[0_0_15px_rgba(0,242,254,0.15)]">
          <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>نظام استخبارات وفحص حسابات تيك توك المفتوح المصدر | 2026</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        </div>
      </div>

      {/* Hero Headings */}
      <div className="text-center space-y-4 mb-10">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
          <span className="bg-gradient-to-r from-cyan-400 via-teal-200 to-blue-500 bg-clip-text text-transparent">
            محلل حسابات تيك توك الذكي
          </span>
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
          فحص فوري ودقيق لأي حساب TikTok عام <span className="text-cyan-400 font-semibold">بدون تسجيل دخول وبدون كلمة مرور</span>. احصل على بيانات الحساب الحقيقية، نسبة الأمان، تحليل المشاكل، وتوصيات الذكاء الاصطناعي.
        </p>
      </div>

      {/* Cyber Glassmorphism Input Card */}
      <div className="relative rounded-2xl bg-gray-950/70 border border-cyan-500/30 backdrop-blur-xl p-6 sm:p-8 shadow-[0_10px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(0,242,254,0.1)]">
        {/* Glowing border accents */}
        <div className="absolute -top-[1px] right-10 w-24 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        <div className="absolute -bottom-[1px] left-10 w-24 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative flex flex-col sm:flex-row items-stretch gap-3">
            {/* Input with @ Prefix */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-cyan-400 font-mono text-lg font-bold">
                @
              </div>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  if (localError) setLocalError(null);
                }}
                disabled={isLoading}
                dir={inputVal ? 'ltr' : 'rtl'}
                placeholder="أدخل اليوزر أو رابط الحساب مثلاً: khaby.lame"
                className={`w-full h-14 pr-10 pl-4 rounded-xl bg-gray-900/90 border border-cyan-500/30 text-white placeholder-gray-500 text-base focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all ${
                  inputVal ? 'font-mono text-left' : 'text-right'
                }`}
                autoComplete="off"
              />
            </div>

            {/* Big Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="h-14 px-8 rounded-xl font-bold text-base text-gray-950 bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 hover:from-cyan-300 hover:to-blue-400 active:scale-[0.98] shadow-[0_0_25px_rgba(0,242,254,0.4)] hover:shadow-[0_0_35px_rgba(0,242,254,0.6)] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
                  <span>جاري الفحص...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 group-hover:scale-110 transition-transform text-gray-950" />
                  <span>فحص الحساب</span>
                </>
              )}
            </button>
          </div>

          {/* Quick-Pick Popular Creators */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1 font-medium text-gray-400">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              أمثلة سريعة للفحص:
            </span>
            {popularUsers.map((item) => (
              <button
                key={item.user}
                type="button"
                onClick={() => handleChipClick(item.user)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-800 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors font-mono cursor-pointer"
              >
                @{item.user}
              </button>
            ))}
          </div>
        </form>

        {/* Local Validation Error */}
        {localError && (
          <div className="mt-4 p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-sm flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <span>{localError}</span>
          </div>
        )}

        {/* Server Fetch Error */}
        {errorMessage && (
          <div className="mt-4 p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-300">تنبيه أثناء فحص الحساب</p>
              <p className="text-gray-300">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Security & Privacy Guarantee Badges */}
        <div className="mt-6 pt-6 border-t border-gray-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>فحص للبيانات العامة دون طلب كلمة المرور</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>النتائج تعتمد على توافر بيانات TikTok العامة</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <span>تحليل مدعوم بنموذج Gemini 3.8 Flash</span>
          </div>
        </div>
      </div>

      {/* In-Progress Scanning Pipeline Modal / Overlay */}
      {isLoading && (
        <div className="mt-8 rounded-2xl bg-gray-950/90 border border-cyan-500/40 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,242,254,0.2)] animate-pulse">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            {/* Cyber Radar Animation */}
            <div className="relative w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border border-dashed border-cyan-400 animate-spin" />
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-400/60 flex items-center justify-center shadow-[0_0_20px_rgba(0,242,254,0.4)]">
                <Terminal className="w-8 h-8 text-cyan-400" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">
                جاري جلب بيانات الحساب وتحليلها...
              </h3>
              <p className="text-sm text-cyan-400 font-mono">{scanStep}</p>
            </div>

            {/* Pipeline progress bar */}
            <div className="w-full max-w-md h-2 rounded-full bg-gray-900 border border-cyan-500/30 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
