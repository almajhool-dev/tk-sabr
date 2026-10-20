import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  Filter,
} from 'lucide-react';
import type { DiagnosticProblem } from '../types/index.ts';

interface ProblemsDiagnosticProps {
  problems: DiagnosticProblem[];
}

export const ProblemsDiagnostic: React.FC<ProblemsDiagnosticProps> = ({ problems }) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const filteredProblems = problems.filter((p) => {
    if (filter === 'all') return true;
    return p.severity === filter;
  });

  const criticalCount = problems.filter((p) => p.severity === 'critical').length;
  const warningCount = problems.filter((p) => p.severity === 'warning').length;
  const infoCount = problems.filter((p) => p.severity === 'info').length;

  return (
    <div className="rounded-2xl bg-gray-950/80 border border-cyan-500/30 backdrop-blur-xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(0,242,254,0.08)]">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">المشاكل المكتشفة والحلول</h3>
              <p className="text-xs text-gray-400">
                تشخيص ذكي يحدد نقاط الضعف الظاهرة في الحساب والخطوات الملموسة لعلاجها
              </p>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-gray-900 border border-gray-800 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            الكل ({problems.length})
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'critical'
                ? 'bg-red-500/20 text-red-300 font-bold border border-red-500/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            حرجة ({criticalCount})
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'warning'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            تحذيرات ({warningCount})
          </button>
          <button
            onClick={() => setFilter('info')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === 'info'
                ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            تحسينات ({infoCount})
          </button>
        </div>
      </div>

      {/* Problems List */}
      <div className="pt-6 space-y-4">
        {filteredProblems.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="text-base font-bold text-gray-200">
              لا توجد مشاكل مطابقة في هذا التصنيف
            </p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              المؤشرات الظاهرة في هذا القسم مستقرة وضمن الحدود الطبيعية لخوارزميات المنصة.
            </p>
          </div>
        ) : (
          filteredProblems.map((problem) => {
            const isCritical = problem.severity === 'critical';
            const isWarning = problem.severity === 'warning';

            return (
              <div
                key={problem.id}
                className={`rounded-xl p-5 border transition-all ${
                  isCritical
                    ? 'bg-red-950/20 border-red-500/30'
                    : isWarning
                    ? 'bg-amber-950/20 border-amber-500/30'
                    : 'bg-blue-950/20 border-blue-500/30'
                }`}
              >
                {/* Problem Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {isCritical ? (
                      <AlertOctagon className="w-5 h-5 text-red-400 shrink-0" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    ) : (
                      <Info className="w-5 h-5 text-blue-400 shrink-0" />
                    )}
                    <h4 className="text-base font-bold text-white">{problem.title}</h4>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-md font-bold font-mono ${
                      isCritical
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : isWarning
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    }`}
                  >
                    {isCritical ? 'أولوية قصوى (حرج)' : isWarning ? 'تنبيه هام' : 'نصيحة نمو'}
                  </span>
                </div>

                {/* Reason / Cause */}
                <div className="mb-3 pl-2 text-xs text-gray-300">
                  <span className="font-semibold text-gray-200">تفسير سبب الظهور: </span>
                  {problem.reason}
                </div>

                {/* Solution Box */}
                <div className="rounded-lg bg-gray-900/90 border border-gray-800 p-3.5 space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-emerald-300">الحل المناسب: </span>
                      <span className="text-gray-300">{problem.solution}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1 border-t border-gray-800/80">
                    <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-cyan-300">نصيحة التحسين: </span>
                      <span className="text-gray-400">{problem.recommendation}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
