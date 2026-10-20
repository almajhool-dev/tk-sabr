import React from 'react';
import {
  Printer,
  Download,
  X,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  QrCode,
  FileCheck,
} from 'lucide-react';
import type { TikTokProfile, SecurityScore, DiagnosticProblem, GeminiAIReport } from '../types/index.ts';
import { formatArabicNumber } from '../utils/tiktok.ts';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: TikTokProfile;
  securityScore: SecurityScore;
  problems: DiagnosticProblem[];
  aiReport: GeminiAIReport | null;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  profile,
  securityScore,
  problems,
  aiReport,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="relative w-full max-w-4xl rounded-2xl bg-gray-950 border border-cyan-500/40 p-6 sm:p-10 shadow-2xl my-8 print:border-none print:shadow-none print:bg-white print:text-black print:my-0">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-800 print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <span className="text-base font-bold text-white">
              معاينة التقرير الرسمي الشامل - TK_SABR
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-xs flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ كـ PDF</span>
            </button>
            <button
              onClick={onClose}
              aria-label="إغلاق التقرير"
              className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="pt-6 space-y-6 print:space-y-4 print:text-black">
          {/* Header with Official Logo & Stamp */}
          <div className="flex items-start justify-between border-b border-gray-800 pb-6 print:border-gray-300">
            <div>
              <h1 className="text-2xl font-black tracking-wider text-cyan-400 print:text-black font-mono-cyber">
                TK_SABR CYBERSECURITY & INTELLIGENCE
              </h1>
              <p className="text-xs text-gray-400 print:text-gray-600 mt-1">
                تقرير فحص وتحليل الحسابات الاستخباراتي الرقمي لمنصة TikTok
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                تاريخ الإصدار: {new Date(profile.scannedAt).toLocaleDateString('en-US')} {new Date(profile.scannedAt).toLocaleTimeString('en-US')} | معرف التقرير: REP-{Date.now().toString().slice(-6)}
              </p>
            </div>

            <div className="text-center p-3 rounded-xl border border-cyan-500/30 print:border-gray-400 bg-gray-900/40 print:bg-gray-100">
              <span className="text-[10px] uppercase font-bold text-cyan-400 print:text-black block font-mono">
                TK_SABR CERTIFIED
              </span>
              <span className="text-lg font-black font-sans text-emerald-400 print:text-black">
                {securityScore.score}%
              </span>
              <span className="text-[9px] text-gray-400 print:text-gray-600 block">
                درجة الأمان ({securityScore.grade})
              </span>
            </div>
          </div>

          {/* Account Identity */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-900/50 border border-gray-800 print:bg-gray-50 print:border-gray-200">
            <img
              src={profile.avatar}
              alt={profile.displayName}
              className="w-16 h-16 rounded-xl object-cover border border-cyan-400/40 print:border-gray-400"
            />
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white print:text-black flex items-center gap-1.5">
                {profile.displayName}
                {profile.verified && <CheckCircle className="w-4 h-4 text-cyan-400 print:text-black" />}
              </h2>
              <p className="text-xs font-mono text-cyan-400 print:text-gray-700">@{profile.username}</p>
              <p className="text-xs text-gray-300 print:text-gray-600">{profile.bio}</p>
            </div>
          </div>

          {/* Numbers Grid */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 print:bg-gray-100 print:border-gray-300">
              <span className="text-[11px] text-gray-400 print:text-gray-600">المتابعون</span>
              <p className="text-base font-bold text-white print:text-black">
                {formatArabicNumber(profile.followersCount)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 print:bg-gray-100 print:border-gray-300">
              <span className="text-[11px] text-gray-400 print:text-gray-600">الإعجابات</span>
              <p className="text-base font-bold text-white print:text-black">
                {formatArabicNumber(profile.likesCount)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 print:bg-gray-100 print:border-gray-300">
              <span className="text-[11px] text-gray-400 print:text-gray-600">الفيديوهات</span>
              <p className="text-base font-bold text-white print:text-black">
                {formatArabicNumber(profile.videoCount)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gray-900 border border-gray-800 print:bg-gray-100 print:border-gray-300">
              <span className="text-[11px] text-gray-400 print:text-gray-600">معدل التفاعل</span>
              <p className="text-base font-bold text-cyan-300 print:text-black" dir="ltr">
                {profile.engagementRate}%
              </p>
            </div>
          </div>

          {/* Security Score Factors */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white print:text-black">
              محاور تقييم أمان وصحة الحساب ({securityScore.score}%):
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {securityScore.factors.map((f) => (
                <div
                  key={f.id}
                  className="p-2.5 rounded-lg bg-gray-900/60 border border-gray-800 print:bg-gray-50 print:border-gray-200"
                >
                  <div className="flex justify-between font-semibold text-gray-300 print:text-black mb-1">
                    <span>{f.name}</span>
                    <span>{f.score}/{f.maxScore}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 print:text-gray-600">{f.note}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Problems & Solutions Summary */}
          {problems.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white print:text-black">
                أهم المشاكل المكتشفة والحلول:
              </h3>
              <div className="space-y-2 text-xs">
                {problems.slice(0, 3).map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-lg bg-gray-900/40 border border-gray-800 print:bg-gray-50 print:border-gray-200"
                  >
                    <p className="font-bold text-amber-300 print:text-amber-800">{p.title}</p>
                    <p className="text-gray-300 print:text-gray-700 mt-1">الحل: {p.solution}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Strategy Excerpt */}
          {aiReport && (
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 print:bg-gray-50 print:border-gray-300 text-xs space-y-2">
              <h4 className="font-bold text-purple-300 print:text-black">
                خلاصة استراتيجية TK_SABR AI:
              </h4>
              <p className="text-gray-300 print:text-gray-700 leading-relaxed">{aiReport.summary}</p>
            </div>
          )}

          {/* Legal Disclaimer & Footer */}
          <div className="pt-4 border-t border-gray-800 print:border-gray-300 text-[10px] text-gray-400 print:text-gray-500 text-center space-y-1">
            <p>{securityScore.disclaimer}</p>
            <p className="font-semibold text-gray-300">تم إنشاء التقرير آلياً عبر منصة TK_SABR | تم التطوير بواسطة المبرمج المجهول</p>
          </div>
        </div>
      </div>
    </div>
  );
};
