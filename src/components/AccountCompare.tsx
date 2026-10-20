import React, { useState } from 'react';
import {
  Layers,
  Search,
  CheckCircle,
  Trophy,
  Users,
  Heart,
  Video,
  TrendingUp,
  ShieldCheck,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import type { TikTokProfile } from '../types/index.ts';
import { calculateSecurityScore } from '../utils/securityScore.ts';
import { formatArabicNumber } from '../utils/tiktok.ts';

interface AccountCompareProps {
  initialProfiles?: TikTokProfile[];
}

export const AccountCompare: React.FC<AccountCompareProps> = ({ initialProfiles = [] }) => {
  const [username1, setUsername1] = useState(initialProfiles[0]?.username || 'khaby.lame');
  const [username2, setUsername2] = useState(initialProfiles[1]?.username || 'mrbeast');
  const [isLoading, setIsLoading] = useState(false);
  const [comparedProfiles, setComparedProfiles] = useState<TikTokProfile[]>(initialProfiles);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRunCompare = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username1.trim() || !username2.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/tiktok/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernames: [username1.trim(), username2.trim()] }),
      });
      const data = await res.json();
      if (data.success && data.profiles && data.profiles.length > 0) {
        setComparedProfiles(data.profiles);
      } else {
        setErrorMsg(data.message || 'تعذر جلب بيانات الحسابات للمقارنة.');
      }
    } catch {
      setErrorMsg('خطأ في الاتصال بالخادم أثناء المقارنة.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs">
          <Layers className="w-3.5 h-3.5" />
          <span>أداة مقارنة الحسابات والمنافسين</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white">
          مقارنة حسابات TikTok المتقدمة
        </h2>
        <p className="text-sm text-gray-300 max-w-xl mx-auto">
          قارن بين أي حسابين عامين لاكتشاف الفروقات في أعداد المتابعين، التفاعل، صحة الحساب، ونقاط التفوق التنافسي.
        </p>
      </div>

      {/* Compare Inputs Card */}
      <div className="p-6 rounded-2xl bg-gray-950/80 border border-cyan-500/30 backdrop-blur-xl shadow-2xl">
        <form onSubmit={handleRunCompare} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-5 relative">
            <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-cyan-400 font-mono font-bold">
              @
            </span>
            <input
              type="text"
              value={username1}
              onChange={(e) => setUsername1(e.target.value)}
              placeholder="الحساب الأول (مثلاً: khaby.lame)"
              className="w-full h-13 pr-10 pl-4 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-400"
              dir="ltr"
            />
          </div>

          <div className="md:col-span-2 text-center">
            <span className="px-3 py-1 rounded-full bg-gray-900 border border-cyan-500/30 text-cyan-400 font-bold text-xs">
              ضد VS
            </span>
          </div>

          <div className="md:col-span-5 relative">
            <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-cyan-400 font-mono font-bold">
              @
            </span>
            <input
              type="text"
              value={username2}
              onChange={(e) => setUsername2(e.target.value)}
              placeholder="الحساب الثاني (مثلاً: mrbeast)"
              className="w-full h-13 pr-10 pl-4 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-500 text-sm font-mono focus:outline-none focus:border-cyan-400"
              dir="ltr"
            />
          </div>

          <div className="md:col-span-12 flex justify-center pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="h-12 px-8 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-gray-950 font-bold text-sm shadow-[0_0_20px_rgba(0,242,254,0.4)] disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
                  <span>جاري المقارنة واستخراج البيانات...</span>
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  <span>بدء المقارنة الفورية</span>
                </>
              )}
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs text-center">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Comparison Results Grid */}
      {comparedProfiles.length >= 2 && (
        <div className="space-y-6">
          {/* Winner Highlights Banner */}
          {(() => {
            const p1 = comparedProfiles[0];
            const p2 = comparedProfiles[1];
            const followerWinner = p1.followersCount >= p2.followersCount ? p1 : p2;
            const engagementWinner = p1.engagementRate >= p2.engagementRate ? p1 : p2;

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-cyan-300 font-semibold">
                      الأعلى في عدد المتابعين:
                    </span>
                    <p className="text-sm font-bold text-white">
                      @{followerWinner.username} ({formatArabicNumber(followerWinner.followersCount)})
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-purple-300 font-semibold">
                      الأعلى في معدل التفاعل:
                    </span>
                    <p className="text-sm font-bold text-white">
                      @{engagementWinner.username} ({engagementWinner.engagementRate}%)
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Side-by-Side Profiles Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparedProfiles.map((p, idx) => {
              const sec = calculateSecurityScore(p);
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-gray-950/80 border border-gray-800 p-6 space-y-6"
                >
                  {/* Account Header */}
                  <div className="flex items-center gap-4">
                    <img
                      src={p.avatar}
                      alt={p.displayName}
                      className="w-16 h-16 rounded-xl object-cover border border-cyan-400/40"
                    />
                    <div>
                      <h4 className="text-lg font-bold text-white flex items-center gap-1.5">
                        {p.displayName}
                        {p.verified && <CheckCircle className="w-4 h-4 text-cyan-400" />}
                      </h4>
                      <a
                        href={p.originalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        @{p.username}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Metrics Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900 border border-gray-800 text-xs">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-cyan-400" />
                        المتابعون:
                      </span>
                      <span className="font-bold text-white font-mono">
                        {p.followersCount.toLocaleString('ar-EG')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900 border border-gray-800 text-xs">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <Heart className="w-4 h-4 text-rose-400" />
                        مجموع الإعجابات:
                      </span>
                      <span className="font-bold text-white font-mono">
                        {p.likesCount.toLocaleString('ar-EG')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900 border border-gray-800 text-xs">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-amber-400" />
                        عدد الفيديوهات:
                      </span>
                      <span className="font-bold text-white font-mono">
                        {p.videoCount.toLocaleString('ar-EG')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900 border border-gray-800 text-xs">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        معدل التفاعل:
                      </span>
                      <span className="font-bold text-emerald-300 font-mono">
                        {p.engagementRate}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900 border border-gray-800 text-xs">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-cyan-400" />
                        مؤشر الأمان والصحة:
                      </span>
                      <span
                        className="font-bold font-mono px-2 py-0.5 rounded"
                        style={{ color: sec.color, backgroundColor: `${sec.color}15` }}
                      >
                        {sec.score}% ({sec.grade})
                      </span>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="p-3.5 rounded-xl bg-gray-900/50 border border-gray-800/80 text-xs text-gray-300">
                    <p className="text-gray-400 text-[11px] mb-1 font-semibold">الوصف (Bio):</p>
                    <p className="line-clamp-2">{p.bio || 'لا يوجد وصف متاح'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
