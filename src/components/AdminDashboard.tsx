import React, { useEffect, useState } from 'react';
import { ShieldCheck, Power, RotateCw, Lock, AlertTriangle } from 'lucide-react';
import { supabase } from '../utils/firebaseAuth.ts';
import type { UserAccount } from '../types/index.ts';

type SiteSettings = { enabled: boolean; notice: string };
export const AdminDashboard: React.FC<{ user: UserAccount }> = ({ user }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const refresh = async () => {
    if (!supabase || user.role !== 'admin') return;
    const { data, error } = await supabase.from('tksabr_site_settings').select('enabled,notice').eq('id',1).single();
    if (error) { setError(error.message); return; }
    setSettings(data as SiteSettings);
  };
  useEffect(() => { void refresh(); }, [user.id]);
  const switchMode = async () => {
    if (!supabase || user.role !== 'admin' || !settings || loading) return;
    const next = !settings.enabled;
    if (!window.confirm(next ? 'تريد ترجع تفتح الموقع للزوار؟' : 'تريد توقف الفحص للزوار وتعرض صفحة الصيانة؟')) return;
    setLoading(true); setError('');
    const { error } = await supabase.rpc('tksabr_set_enabled', { p_enabled: next });
    if (error) setError('فشل تحديث السيرفر: ' + error.message);
    else await refresh();
    setLoading(false);
  };
  if (user.role !== 'admin') return <div className="max-w-xl mx-auto my-16 border border-rose-700 rounded-2xl p-7 text-red-200">غير مسموح بالوصول للوحة الإدارة.</div>;
  return (
    <section className="max-w-3xl mx-auto px-4 py-14 space-y-6" dir="rtl">
      <div className="rounded-3xl border border-cyan-500/30 bg-slate-950/90 p-6 sm:p-8 space-y-6">
        <h1 className="text-2xl font-black flex items-center gap-3 text-cyan-300"><ShieldCheck/> لوحة تحكم مالك TK_SABR</h1>
        <p className="text-sm text-gray-400">هذي اللوحة متاحة فقط للحسابات اللي عندها صلاحية إدارة محفوظة على السيرفر. لا تعتمد على إخفاء زر بالإعدادات.</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-700 bg-slate-900 p-5">
          <div><div className="text-lg font-bold text-white">حالة الموقع للزوار</div><div className={settings?.enabled ? 'text-green-400' : 'text-amber-300'}>{settings ? (settings.enabled ? 'متاح: الفحص يعمل عند توفر بيانات TikTok' : 'وضع الصيانة: الفحص متوقف') : 'جاري تحميل الحالة...'}</div></div>
          <button onClick={switchMode} disabled={!settings || loading} className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 text-slate-950 disabled:opacity-50 font-bold">
            {loading ? <RotateCw className="animate-spin"/> : <Power size={18}/>}{settings?.enabled ? 'إيقاف الفحص للزوار' : 'إعادة تشغيل الفحص'}
          </button>
        </div>
        {error && <p role="alert" className="text-rose-300">{error}</p>}
        <p className="text-xs text-gray-400 flex items-start gap-2"><Lock size={15}/> يتم تنفيذ التغيير على قاعدة البيانات، ويتحقق السيرفر من الصلاحية قبل قبول الطلب. الوصول إلى صفحة الإدارة فقط لا يمنح صلاحيات.</p>
        <p className="text-xs text-amber-200 flex items-start gap-2"><AlertTriangle size={15}/> إيقاف الفحص لا يوقف استضافة الصفحة بالكامل؛ يوقف فحوصات الموقع ويعرض رسالة الصيانة.</p>
      </div>
    </section>
  );
};
