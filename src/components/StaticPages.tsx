import React, { useState } from 'react';
import { Shield, Lock, FileText, CheckCircle, Info, ChevronRight } from 'lucide-react';

interface StaticPagesProps {
  initialSubTab?: 'about' | 'privacy' | 'terms';
}

export const StaticPages: React.FC<StaticPagesProps> = ({ initialSubTab = 'about' }) => {
  const [subTab, setSubTab] = useState<'about' | 'privacy' | 'terms'>(initialSubTab);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      {/* Sub navigation tabs */}
      <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-gray-950/80 border border-gray-800 backdrop-blur-md max-w-md mx-auto text-xs font-semibold">
        <button
          onClick={() => setSubTab('about')}
          className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
            subTab === 'about'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          عن المنصة
        </button>
        <button
          onClick={() => setSubTab('privacy')}
          className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
            subTab === 'privacy'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          سياسة الخصوصية
        </button>
        <button
          onClick={() => setSubTab('terms')}
          className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
            subTab === 'terms'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          شروط الاستخدام
        </button>
      </div>

      {/* Content Container */}
      <div className="rounded-3xl bg-gray-950/80 border border-cyan-500/30 backdrop-blur-xl p-8 sm:p-12 shadow-2xl space-y-6 text-gray-300 text-sm leading-relaxed">
        {subTab === 'about' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
              <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">عن منصة TK_SABR</h2>
                <p className="text-xs text-gray-400">
                  المنظومة السيبرانية الذكية لتحليل ونمو حسابات TikTok
                </p>
              </div>
            </div>

            <p>
              منصة <strong>TK_SABR</strong> هي منصة استخبارات رقمية وأمنية رائدة متخصصة حصرياً في فحص وتحليل حسابات منصة تيك توك العامة. تم تصميم المنصة لتمكين صناع المحتوى والمسوقين والشركات من استقراء المؤشرات الحقيقية لأي حساب عام دون الحاجة إطلاقاً إلى طلب كلمة المرور أو تسجيل الدخول إلى TikTok.
            </p>

            <h3 className="text-base font-bold text-white pt-2">أهم ركائز النظام:</h3>
            <ul className="space-y-2 text-xs">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <span><strong>جلب البيانات الحقيقية:</strong> قراءة بيانات عامة متاحة؛ وقد يمنع TikTok الوصول لبعض المعلومات أو جميعها.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <span><strong>مؤشر أمان الحساب:</strong> خوارزمية ذكية تقيم اكتمال الحساب، نزاهة التفاعل، ونمط المتابعة على مقياس من 0 إلى 100%.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <span><strong>تحليل Gemini 3.8 Flash:</strong> استراتيجيات نمو مخصصة وخطة تطوير 30 يوماً واقتراحات للأوقات الذهبية للنشر.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <span><strong>بوابة دفع وتسوية مصرفية:</strong> دعم كامل لبطاقات Visa وMastercard مع تسوية قانونية للأرباح إلى المصارف العراقية.</span>
              </li>
            </ul>
          </div>
        )}

        {subTab === 'privacy' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
              <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">سياسة الخصوصية وأمن البيانات</h2>
                <p className="text-xs text-gray-400">آخر تحديث: أكتوبر 2026</p>
              </div>
            </div>

            <p>
              تلتزم منصة TK_SABR بأعلى معايير حماية الخصوصية والأمن السيبراني. نحن نؤمن بأن خصوصية المستخدم وشفافية البيانات هما أساس الثقة:
            </p>

            <h3 className="text-base font-bold text-white pt-2">1. عدم جمع كلمات المرور</h3>
            <p className="text-xs">
              منصة TK_SABR لا تطلب ولن تطلب أبداً كلمات مرور حسابات TikTok الخاصة بك أو بأي مستخدم آخر. جميع عمليات الفحص تتم حصرياً على البيانات المتاحة علناً على شبكة الإنترنت.
            </p>

            <h3 className="text-base font-bold text-white pt-2">2. أمن المعاملات المالية</h3>
            <p className="text-xs">
              لا نقوم بحفظ أو تخزين أي أرقام بطاقات مصرفية كاملة أو رموز CVV أو PIN في قواعد بياناتنا. لا يوجد تكامل دفع مباشر مفعل حالياً. سيتم تفعيل الدفع فقط بعد الاتفاق مع مزود دفع مرخص وتنفيذ التكامل والتحقق الأمني.
            </p>

            <h3 className="text-base font-bold text-white pt-2">3. حماية الحسابات وسجلات التدقيق</h3>
            <p className="text-xs">
              تخضع أنشطة المنصة لتدقيق أمني مستمر لمنع محاولات إساءة الاستخدام وهجمات حجب الخدمة (DDoS) وحقن البيانات، مع تطبيق Rate Limiting صارم.
            </p>
          </div>
        )}

        {subTab === 'terms' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-800">
              <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">شروط الاستخدام والاتفاقية القانونية</h2>
                <p className="text-xs text-gray-400">القواعد المنظمة لاستخدام منصة TK_SABR</p>
              </div>
            </div>

            <p>
              باستخدامك لمنصة TK_SABR، فإنك توافق على الالتزام بالشروط والأحكام التالية:
            </p>

            <h3 className="text-base font-bold text-white pt-2">1. طبيعة المؤشرات والتقارير</h3>
            <p className="text-xs">
              نسبة أمان الحساب والتقارير الصادرة عن المنصة هي مؤشرات تقديرية مبنية على قراءة إحصائية للخوارزميات والبيانات العامة المتاحة، ولا تدعي المنصة اكتشاف مخالفات داخلية سرية أو حظر خفي (Shadowban) دون توفر أدلة موثوقة.
            </p>

            <h3 className="text-base font-bold text-white pt-2">2. الاستخدام العادل والاشتراكات</h3>
            <p className="text-xs">
              يلتزم المشترك بالحدود المخصصة لباقته (Free, Pro, Business). يمنع استخدام برمجيات الكشط العنيف أو الروبوتات الآلية للضغط على البنية التحتية للموقع.
            </p>

            <h3 className="text-base font-bold text-white pt-2">3. الاسترداد والإلغاء</h3>
            <p className="text-xs">
              يمكن للمشترك إلغاء تجديد الاشتراك في أي وقت عبر لوحة التحكم الشخصية. تخضع سياسة الاسترداد للقوانين المصرفية المعمول بها من قبل مزود بوابة الدفع في العراق.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
