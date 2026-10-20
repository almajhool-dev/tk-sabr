import React, { useState, useEffect } from 'react';
import {
  Activity,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Bell,
  CheckCircle,
  ExternalLink,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import type { MonitoredAccount } from '../types/index.ts';
import { formatArabicNumber } from '../utils/tiktok.ts';

interface AccountMonitorProps {
  onScanAccount: (username: string) => void;
}

export const AccountMonitor: React.FC<AccountMonitorProps> = ({ onScanAccount }) => {
  const [monitoredList, setMonitoredList] = useState<MonitoredAccount[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/monitor/list')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.monitoredAccounts) {
          setMonitoredList(data.monitoredAccounts);
        }
      })
      .catch((err) => console.error('Failed to load monitored accounts:', err));
  }, []);

  const handleAddMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/monitor/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUsername.trim() }),
      });
      const data = await res.json();
      if (data.success && data.account) {
        setMonitoredList((prev) => [data.account, ...prev]);
        setNewUsername('');
      } else {
        setErrorMsg(data.message || 'تعذر إضافة الحساب للمراقبة.');
      }
    } catch {
      setErrorMsg('خطأ في الاتصال بالسيرفر أثناء إضافة الحساب.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await fetch(`/api/monitor/${id}`, { method: 'DELETE' });
      setMonitoredList((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>نظام الرصد والمتابعة الدورية</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black text-white">
          TK_SABR Monitor: مراقبة الحسابات والتنبيهات الذكية
        </h2>
        <p className="text-sm text-gray-300 max-w-xl mx-auto">
          هذه الميزة قيد الإعداد وتحتاج قاعدة بيانات آمنة وخدمة مهام مجدولة. لن يبدأ التتبع قبل تفعيلها.
        </p>
      </div>

      {/* Add New Monitor Card */}
      <div className="p-6 rounded-2xl bg-gray-950/80 border border-cyan-500/30 backdrop-blur-xl shadow-2xl">
        <form onSubmit={handleAddMonitor} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <span className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-cyan-400 font-mono font-bold">
              @
            </span>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="أدخل يوزر TikTok لبدء المراقبة الآلية (مثلاً: khaby.lame)"
              className="w-full h-12 pr-10 pl-4 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-400"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !newUsername.trim()}
            className="w-full sm:w-auto h-12 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-sm shadow-[0_0_20px_rgba(0,242,254,0.3)] disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>إضافة للمراقبة</span>
          </button>
        </form>

        {errorMsg && (
          <p className="mt-3 text-xs text-red-400 text-right">{errorMsg}</p>
        )}
      </div>

      {/* Monitored Accounts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" />
            الحسابات قيد المراقبة الآن ({monitoredList.length})
          </h3>
          <span className="text-xs text-gray-400">
            التحديث الدوري غير مفعّل حالياً
          </span>
        </div>

        {monitoredList.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-gray-950/60 border border-gray-800 text-gray-400 space-y-2">
            <Activity className="w-10 h-10 text-gray-600 mx-auto" />
            <p className="text-sm font-bold text-gray-300">لم تضف أي حسابات للمراقبة بعد</p>
            <p className="text-xs">أدخل اسم المستخدم أعلاه لحفظه ومتابعة مؤشراته الأسبوعية.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {monitoredList.map((acc) => (
              <div
                key={acc.id}
                className="rounded-2xl bg-gray-950/80 border border-gray-800 hover:border-cyan-500/40 p-5 space-y-4 transition-all"
              >
                {/* Account Top Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={acc.avatar}
                      alt={acc.displayName}
                      className="w-12 h-12 rounded-xl object-cover border border-cyan-400/30"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-white">{acc.displayName}</h4>
                      <p className="text-xs font-mono text-cyan-400">@{acc.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onScanAccount(acc.username)}
                      className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      فحص فوري
                    </button>
                    <button
                      onClick={() => handleRemove(acc.id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="حذف من المراقبة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Growth and Metrics */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-gray-900 border border-gray-800">
                    <p className="text-[11px] text-gray-400">المتابعون</p>
                    <p className="text-sm font-bold text-white mt-0.5">
                      {formatArabicNumber(acc.currentFollowers)}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-gray-900 border border-gray-800">
                    <p className="text-[11px] text-gray-400">نسبة النمو</p>
                    <p
                      className={`text-sm font-bold mt-0.5 flex items-center justify-center gap-0.5 ${
                        acc.growthChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                      dir="ltr"
                    >
                      {acc.growthChange >= 0 ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {acc.growthChange > 0 ? `+${acc.growthChange}%` : `${acc.growthChange}%`}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-gray-900 border border-gray-800">
                    <p className="text-[11px] text-gray-400">الحالة</p>
                    <span className="text-xs font-semibold text-cyan-300">نشط ومستقر</span>
                  </div>
                </div>

                {/* History Sparkline Points */}
                {acc.history && acc.history.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      سجل القراءات التاريخية:
                    </p>
                    <div className="flex items-center gap-1.5 pt-1 overflow-x-auto">
                      {acc.history.map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 min-w-[70px] p-1.5 rounded-lg bg-gray-900/60 border border-gray-800/80 text-[10px] text-center"
                        >
                          <span className="text-gray-400 block font-mono">{h.timestamp.slice(5)}</span>
                          <span className="text-cyan-300 font-bold block">
                            {formatArabicNumber(h.followers)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alert Notification Message */}
                {acc.alertMessage && (
                  <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-200 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{acc.alertMessage}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
