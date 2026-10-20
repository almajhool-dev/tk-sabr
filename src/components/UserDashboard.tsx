import React, { useState } from 'react';
import {
  User,
  Shield,
  CreditCard,
  History,
  Bookmark,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Zap,
  TrendingUp,
  Settings,
  Bell,
  RefreshCw,
} from 'lucide-react';
import type { UserAccount } from '../types/index.ts';

interface UserDashboardProps {
  user: UserAccount;
  onScanAccount: (username: string) => void;
  onOpenPricing: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  user,
  onScanAccount,
  onOpenPricing,
}) => {
  const [copiedRef, setCopiedRef] = useState(false);

  const referralUrl = `https://tksabr.app/?ref=${user.referralCode}`;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const recentScans = [
    { username: 'khaby.lame', displayName: 'Khaby Lame', score: 92, date: 'قبل 20 دقيقة' },
    { username: 'mrbeast', displayName: 'MrBeast', score: 95, date: 'قبل ساعتين' },
    { username: 'noorstars', displayName: 'Noor Stars', score: 86, date: 'أمس' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* User Header Profile Card */}
      <div className="rounded-2xl bg-gray-950/80 border border-cyan-500/30 backdrop-blur-xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-cyan-400/50 shadow-[0_0_20px_rgba(0,242,254,0.3)]"
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white">{user.name}</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold uppercase">
                باقة {user.plan}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono">{user.email}</p>
            <p className="text-xs text-gray-400">عضو منذ أكتوبر 2026</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onOpenPricing}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-gray-950 font-bold text-sm shadow-[0_0_15px_rgba(0,242,254,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>ترقية الخطة</span>
          </button>
        </div>
      </div>

      {/* Scans Quota and Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gray-950/70 border border-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>الفحوصات اليومية المتبقية</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {user.scansLimitToday - user.scansUsedToday} / {user.scansLimitToday}
          </div>
          <div className="w-full h-1.5 rounded-full bg-gray-800 mt-3 overflow-hidden">
            <div
              className="h-full bg-cyan-400 rounded-full"
              style={{
                width: `${Math.round(
                  ((user.scansLimitToday - user.scansUsedToday) / user.scansLimitToday) * 100
                )}%`,
              }}
            />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gray-950/70 border border-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>إجمالي الفحوصات المنفذة</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{user.totalScans}</div>
          <p className="text-[11px] text-gray-400 mt-2">عبر محرك الفحص السيبراني</p>
        </div>

        <div className="p-5 rounded-2xl bg-gray-950/70 border border-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>الدعوات المقبولة (الإحالات)</span>
            <Share2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {user.referralCount}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">حصلت على +{user.bonusScans} فحص إضافي</p>
        </div>

        <div className="p-5 rounded-2xl bg-gray-950/70 border border-gray-800">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>الحسابات المفضلة</span>
            <Bookmark className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {user.favoriteAccounts.length}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">محفوظة للوصول السريع</p>
        </div>
      </div>

      {/* Referral Program Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-gray-950 to-cyan-950/30 border border-purple-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-purple-400" />
              نظام الإحالة وجلب صناع المحتوى
            </h3>
            <p className="text-xs text-gray-300">
              شارك رابط دعوتك الفريد مع أصدقائك أو متابعيك، واحصل على 5 فحوصات مجانية إضافية لكل مستخدم جديد يسجل عبرك!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-purple-500/20 text-purple-300 px-3 py-1.5 rounded-lg border border-purple-500/40">
              كودك: {user.referralCode}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-center">
          <input
            type="text"
            readOnly
            value={referralUrl}
            dir="ltr"
            className="w-full sm:flex-1 h-11 px-4 rounded-xl bg-gray-900 border border-gray-800 text-xs font-mono text-cyan-300 focus:outline-none"
          />
          <button
            onClick={handleCopyReferral}
            className="w-full sm:w-auto h-11 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {copiedRef ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedRef ? 'تم النسخ بنجاح!' : 'نسخ رابط الدعوة'}</span>
          </button>
        </div>
      </div>

      {/* Scan History Table */}
      <div className="rounded-2xl bg-gray-950/80 border border-gray-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            سجل الفحوصات والتحليلات الأخيرة
          </h3>
          <span className="text-xs text-gray-400">إمكانية إعادة الفحص بنقرة واحدة</span>
        </div>

        <div className="divide-y divide-gray-800">
          {recentScans.map((item, idx) => (
            <div
              key={idx}
              className="py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-800 text-cyan-400 flex items-center justify-center font-mono font-bold">
                  @
                </span>
                <div>
                  <h4 className="font-bold text-white">{item.displayName}</h4>
                  <p className="text-gray-400 font-mono">@{item.username}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-gray-400 block text-[11px]">نسبة الأمان</span>
                  <span className="font-bold text-emerald-400 font-mono">{item.score}%</span>
                </div>
                <span className="text-gray-400 text-[11px]">{item.date}</span>
                <button
                  onClick={() => onScanAccount(item.username)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>إعادة فحص</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
