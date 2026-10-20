import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  AlertCircle,
  HelpCircle,
  Info,
} from 'lucide-react';
import type { SecurityScore } from '../types/index.ts';

interface SecurityScoreGaugeProps {
  securityScore: SecurityScore;
}

export const SecurityScoreGauge: React.FC<SecurityScoreGaugeProps> = ({ securityScore }) => {
  const { score, color, level, title, factors, confidencePercentage, disclaimer } = securityScore;

  // SVG circular gauge math
  const radius = 64;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="rounded-2xl bg-gray-950/80 border border-cyan-500/30 backdrop-blur-xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(0,242,254,0.08)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            {score >= 70 ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">نسبة أمان وصحة الحساب</h3>
            <p className="text-xs text-gray-400">
              مؤشر سيبراني تحليلي يعتمد على مقاييس النزاهة واكتمال الحساب
            </p>
          </div>
        </div>

        {/* Confidence pill */}
        <div className="flex items-center gap-2 text-xs bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-xl">
          <span className="text-gray-400">مستوى الثقة في التحليل:</span>
          <span className="font-bold text-cyan-400 font-mono">
            {confidencePercentage}%
          </span>
        </div>
      </div>

      <div className="pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Gauge & Main Verdict */}
        <div className="lg:col-span-5 flex flex-col items-center text-center space-y-4">
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
              {/* Background track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-gray-800/80"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Progress stroke */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{
                  transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: `drop-shadow(0 0 10px ${color}88)`,
                }}
              />
            </svg>

            {/* Inner text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-4xl sm:text-5xl font-black font-mono tracking-tighter"
                style={{ color }}
              >
                {score}%
              </span>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">
                {level === 'excellent'
                  ? 'ممتاز'
                  : level === 'moderate'
                  ? 'جيد'
                  : level === 'warning'
                  ? 'متوسط'
                  : 'حرج'}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-lg font-bold text-white">{title}</h4>
            <p className="text-xs text-gray-400 max-w-xs">
              تم احتساب النسبة بناءً على خوارزمية TK_SABR التي تدرس 5 محاور رئيسية للنشاط والتفاعل وموثوقية الحساب.
            </p>
          </div>

          {/* Color Scale Legend */}
          <div className="w-full max-w-xs pt-3 flex items-center justify-between gap-1 text-[11px] font-mono border-t border-gray-800/80">
            <span className="text-red-400">0-39% حرج</span>
            <span className="text-orange-400">40-69% متوسط</span>
            <span className="text-yellow-400">70-89% جيد</span>
            <span className="text-emerald-400">90-100% آمن</span>
          </div>
        </div>

        {/* Right Column: Factor Breakdown */}
        <div className="lg:col-span-7 space-y-3">
          <h4 className="text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" />
            تفاصيل العوامل المؤثرة في النتيجة:
          </h4>

          {factors.map((factor) => {
            const pct = Math.round((factor.score / factor.maxScore) * 100);
            return (
              <div
                key={factor.id}
                className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-gray-200">{factor.name}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                        factor.status === 'good'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          : factor.status === 'average'
                          ? 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/30'
                          : 'bg-red-500/10 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {factor.score}/{factor.maxScore} نقطة
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden mb-1.5">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      factor.status === 'good'
                        ? 'bg-emerald-400'
                        : factor.status === 'average'
                        ? 'bg-yellow-400'
                        : 'bg-red-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <p className="text-[11px] text-gray-400 leading-relaxed">{factor.note}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mandatory Prominent Disclaimer */}
      <div className="mt-8 p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 flex items-start gap-3 text-xs text-blue-200">
        <HelpCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-blue-300">تنويه الشفافية والمسؤولية القانونية:</p>
          <p className="text-gray-300 leading-relaxed">{disclaimer}</p>
        </div>
      </div>
    </div>
  );
};
