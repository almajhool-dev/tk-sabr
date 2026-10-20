import React, { useState } from 'react';
import {
  Sparkles,
  Target,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  Send,
  Bot,
  Lightbulb,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { GeminiAIReport, TikTokProfile } from '../types/index.ts';

interface AIAnalysisReportProps {
  report: GeminiAIReport | null;
  isLoading: boolean;
  onGenerateReport: () => void;
  profile: TikTokProfile;
}

export const AIAnalysisReport: React.FC<AIAnalysisReportProps> = ({
  report,
  isLoading,
  onGenerateReport,
  profile,
}) => {
  const [activePlanWeek, setActivePlanWeek] = useState<number>(1);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: 'user' | 'bot'; text: string; time: string }>
  >([]);
  const [isSendingChat, setIsSendingChat] = useState(false);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuestion.trim() || isSendingChat) return;

    const userText = chatQuestion.trim();
    setChatQuestion('');
    setChatMessages((prev) => [
      ...prev,
      { sender: 'user', text: userText, time: new Date().toLocaleTimeString('ar-EG') },
    ]);
    setIsSendingChat(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userText,
          profileContext: {
            username: profile.username,
            followers: profile.followersCount,
            likes: profile.likesCount,
            videos: profile.videoCount,
            engagementRate: profile.engagementRate,
            bio: profile.bio,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.answer) {
        setChatMessages((prev) => [
          ...prev,
          { sender: 'bot', text: data.answer, time: new Date().toLocaleTimeString('ar-EG') },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: 'عذراً، حدث خطأ أثناء معالجة السؤال. يرجى المحاولة مرة أخرى.',
            time: new Date().toLocaleTimeString('ar-EG'),
          },
        ]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'تعذر الاتصال بالخادم الذكي. تأكد من اتصال الإنترنت.',
          time: new Date().toLocaleTimeString('ar-EG'),
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  return (
    <div className="rounded-2xl bg-gray-950/80 border border-purple-500/30 backdrop-blur-xl p-6 sm:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(168,85,247,0.12)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/40 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl sm:text-2xl font-black text-white">
                تقرير TK_SABR AI الذكي
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-gray-400">
              تحليل خوارزمي عميق ومقترحات نمو مخصصة لحساب @{profile.username}
            </p>
          </div>
        </div>

        {!report && !isLoading && (
          <button
            onClick={onGenerateReport}
            className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>توليد التقرير الذكي الآن</span>
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-16 text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" />
            <div className="w-16 h-16 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Bot className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-white">جاري صياغة التقرير عبر TK_SABR AI...</h4>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              يتم الآن فحص توازن التفاعل، صياغة أفكار المحتوى، وتوليد خطة الـ 30 يوماً باللغة العربية.
            </p>
          </div>
        </div>
      )}

      {/* Report Content */}
      {report && !isLoading && (
        <div className="pt-6 space-y-8">
          {/* Executive Summary */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-purple-950/30 to-indigo-950/20 border border-purple-500/30">
            <h4 className="text-sm font-bold text-purple-300 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-purple-400" />
              الملخص التنفيذي وفرص النمو:
            </h4>
            <p className="text-sm text-gray-200 leading-relaxed">{report.summary}</p>
            {report.growthVerdict && (
              <div className="mt-3 pt-3 border-t border-purple-500/20 text-xs text-purple-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>
                  <strong className="text-white">حكم النمو:</strong> {report.growthVerdict}
                </span>
              </div>
            )}
          </div>

          {/* Strengths & Weaknesses SWOT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-5 rounded-xl bg-gray-900/60 border border-emerald-500/30 space-y-3">
              <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                نقاط القوة الظاهرة بالحساب:
              </h4>
              <ul className="space-y-2 text-xs text-gray-300">
                {report.strengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="p-5 rounded-xl bg-gray-900/60 border border-rose-500/30 space-y-3">
              <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                نقاط الضعف وفرص التحسين:
              </h4>
              <ul className="space-y-2 text-xs text-gray-300">
                {report.weaknesses.map((weak, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    <span>{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Content Ideas & Hook Strategies */}
          <div className="space-y-3">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              أفكار فيديوهات واستراتيجية محتوى مقترحة:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {report.contentStrategyIdeas.map((idea, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-gray-900/80 border border-gray-800 hover:border-cyan-500/40 transition-colors text-xs text-gray-200 flex items-start gap-3"
                >
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-bold font-mono shrink-0">
                    {idx + 1}
                  </span>
                  <p className="leading-relaxed">{idea}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Optimal Posting Times */}
          <div className="p-5 rounded-xl bg-gray-900/60 border border-gray-800 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              أفضل نوافذ النشر المقترحة لجمهور الحساب:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {report.optimalPostingTimes.map((time, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-gray-950/80 border border-gray-800 flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-bold text-amber-300">{time.day}</p>
                    <p className="text-gray-400 mt-0.5">{time.reason}</p>
                  </div>
                  <span className="font-mono text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20 whitespace-nowrap">
                    {time.timeWindow}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 30-Day Account Development Plan (خطة الـ 30 يوماً) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                خطة تطوير الحساب لمدة 30 يوماً:
              </h4>
              <span className="text-xs text-gray-400 font-mono">4 أسابيع نمو متتالية</span>
            </div>

            {/* Week Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {report.thirtyDayPlan.map((week) => (
                <button
                  key={week.week}
                  onClick={() => setActivePlanWeek(week.week)}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                    activePlanWeek === week.week
                      ? 'bg-purple-950/50 border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                      : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <p className="text-xs font-mono font-bold text-purple-400">
                    الأسبوع {week.week}
                  </p>
                  <p className="text-[11px] truncate mt-0.5 text-gray-300">{week.focus}</p>
                </button>
              ))}
            </div>

            {/* Active Week Details Card */}
            {report.thirtyDayPlan.find((w) => w.week === activePlanWeek) && (
              <div className="p-5 rounded-xl bg-gray-900/80 border border-purple-500/30 space-y-4">
                {(() => {
                  const currentWeek = report.thirtyDayPlan.find((w) => w.week === activePlanWeek)!;
                  return (
                    <>
                      <div>
                        <span className="text-xs text-purple-400 font-mono font-semibold">
                          تركيز الأسبوع {currentWeek.week}:
                        </span>
                        <h5 className="text-base font-bold text-white mt-0.5">
                          {currentWeek.focus}
                        </h5>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {/* Milestones */}
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5" />
                            الأهداف والإنجازات المطلوبة:
                          </p>
                          <ul className="space-y-1.5 text-xs text-gray-300">
                            {currentWeek.milestones.map((m, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                <span>{m}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            المهام العملية اليومية:
                          </p>
                          <ul className="space-y-1.5 text-xs text-gray-300">
                            {currentWeek.actions.map((act, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                                <span>{act}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Interactive Follow-up Chat with TK_SABR AI */}
          <div className="p-5 rounded-xl bg-gray-900/90 border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white">
                  اسأل المحلل الذكي عن تقرير هذا الحساب
                </h4>
              </div>
              <span className="text-[11px] text-gray-400">استشارات فورية</span>
            </div>

            {/* Chat Messages */}
            {chatMessages.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-3 p-3 rounded-lg bg-gray-950/80 border border-gray-800">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col text-xs ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-xl leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-cyan-600/30 border border-cyan-500/40 text-cyan-100 rounded-br-none'
                          : 'bg-gray-900 border border-purple-500/30 text-gray-200 rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 px-1 font-mono">
                      {msg.time}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={chatQuestion}
                onChange={(e) => setChatQuestion(e.target.value)}
                placeholder="اسأل مثلاً: كيف أحول المتابعين إلى مبيعات؟ أو ما أفضل Hook لمجالي؟"
                disabled={isSendingChat}
                className="flex-1 h-11 px-4 rounded-xl bg-gray-950 border border-gray-800 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={isSendingChat || !chatQuestion.trim()}
                className="h-11 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                {isSendingChat ? (
                  <div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>

          {/* AI Legal Disclaimer */}
          <div className="text-[11px] text-gray-400 text-center">
            {report.aiDisclaimer}
          </div>
        </div>
      )}
    </div>
  );
};
