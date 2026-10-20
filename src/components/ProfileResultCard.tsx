import React from 'react';
import {
  CheckCircle,
  ExternalLink,
  Users,
  Heart,
  Video,
  UserCheck,
  TrendingUp,
  FileText,
  Sparkles,
  Bookmark,
  Share2,
  Lock,
  Globe,
} from 'lucide-react';
import type { TikTokProfile } from '../types/index.ts';
import { formatArabicNumber } from '../utils/tiktok.ts';

interface ProfileResultCardProps {
  profile: TikTokProfile;
  onOpenAIReport: () => void;
  onOpenPdfReport: () => void;
  onAddToMonitor: () => void;
  onCompareAccount: () => void;
  isMonitored?: boolean;
}

export const ProfileResultCard: React.FC<ProfileResultCardProps> = ({
  profile,
  onOpenAIReport,
  onOpenPdfReport,
  onAddToMonitor,
  onCompareAccount,
  isMonitored,
}) => {
  const stats = [
    {
      label: 'المتابعون',
      value: profile.followersCount,
      icon: Users,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
    },
    {
      label: 'مجموع الإعجابات',
      value: profile.likesCount,
      icon: Heart,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
    },
    {
      label: 'مقاطع الفيديو',
      value: profile.videoCount,
      icon: Video,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
    },
    {
      label: 'المتابَعون',
      value: profile.followingCount,
      icon: UserCheck,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
  ];

  return (
    <div className="rounded-2xl bg-gray-950/80 border border-cyan-500/30 backdrop-blur-xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(0,242,254,0.08)]">
      {/* Top Bar: Reliability & Links */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/60 border border-emerald-500/40 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            بيانات عامة مستخرجة من TikTok
          </span>
          {profile.privateAccount ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-amber-950/60 border border-amber-500/40 text-amber-300">
              <Lock className="w-3.5 h-3.5" />
              حساب خاص
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-blue-950/60 border border-blue-500/40 text-blue-300">
              <Globe className="w-3.5 h-3.5" />
              حساب عام (Public)
            </span>
          )}
        </div>

        <div className="text-xs text-gray-400 font-mono">
          وقت الفحص: {new Date(profile.scannedAt).toLocaleTimeString('ar-EG')}
        </div>
      </div>

      {/* Main Profile Header */}
      <div className="pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar with Cyber Glow Ring */}
          <div className="relative group">
            <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-cyan-400 p-0.5 shadow-[0_0_25px_rgba(0,242,254,0.3)] bg-gray-900 shrink-0">
              <img
                src={profile.avatar}
                alt={profile.displayName}
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    profile.username
                  )}&background=00f2fe&color=030712`;
                }}
              />
            </div>
            {profile.verified && (
              <div
                title="حساب موثق رسمياً"
                className="absolute -bottom-1 -right-1 p-1 rounded-full bg-cyan-500 text-gray-950 border-2 border-gray-950 shadow-lg"
              >
                <CheckCircle className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Names and Bio */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {profile.displayName}
              </h2>
              {profile.verified && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-medium">
                  موثق رسمي
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <a
                href={profile.originalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-mono text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1"
              >
                @{profile.username}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              {profile.id && (
                <span className="text-xs font-mono text-gray-400">
                  ID: {profile.id}
                </span>
              )}
            </div>

            <p className="text-sm text-gray-300 max-w-xl leading-relaxed pt-1">
              {profile.bio}
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap md:flex-col gap-2.5 w-full md:w-auto">
          <button
            onClick={onOpenAIReport}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>تحليل TK_SABR AI</span>
          </button>

          <button
            onClick={onOpenPdfReport}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl font-semibold text-sm bg-gray-900 border border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>تحميل التقرير PDF</span>
          </button>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={onAddToMonitor}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isMonitored
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-gray-900 border-gray-800 hover:border-gray-700 text-gray-300'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isMonitored ? 'تتم مراقبته' : 'مراقبة الحساب'}</span>
            </button>

            <button
              onClick={onCompareAccount}
              className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>مقارنة الحساب</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`rounded-xl p-4 sm:p-5 ${item.bgColor} border ${item.borderColor} backdrop-blur-md transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-300 font-medium">
                  {item.label}
                </span>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {formatArabicNumber(item.value)}
              </div>
              <div className="text-[11px] text-gray-400 font-sans mt-0.5" dir="ltr">
                {item.value > 0 ? item.value.toLocaleString('en-US') : 'غير متاح'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Public Metrics (Engagement & Average Likes) */}
      <div className="mt-4 p-4 rounded-xl bg-gray-900/60 border border-gray-800 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span className="text-gray-300 font-medium">معدل التفاعل التقديري:</span>
          <span className="font-bold font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            {profile.engagementRate}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-300 font-medium">متوسط الإعجابات لكل فيديو:</span>
          <span className="font-bold font-mono text-white">
            {formatArabicNumber(profile.avgLikesPerVideo)}
          </span>
        </div>

        <div className="text-xs text-gray-400">
          الحساب: <span className="text-gray-300 font-mono">@{profile.username}</span>
        </div>
      </div>
    </div>
  );
};
