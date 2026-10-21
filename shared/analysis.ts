export type Count = number | null;
export interface PublicProfile {
  displayName: string | null; avatarUrl: string | null; verified: boolean | null;
  followers: Count; following: Count; likes: Count; videos: Count; bio: string | null;
}
export interface PublicVideo {
  id: string; title: string | null; thumbnailUrl: string | null; publishedAt: string | null;
  views: Count; likes: Count; comments: Count; shares: Count;
}
export interface Observation { id: string; kind: 'fact' | 'estimate'; title: string; explanation: string; recommendation: string }
export interface Scan {
  status: 'success'; username: string; profile: PublicProfile; videos: PublicVideo[] | null;
  dataSource: string; fetchedAt: string; id: string;
  analysis: ReturnType<typeof analyze>;
}
export function normalizeUsername(raw: string): string {
  let input = raw.trim();
  if (/^(https?:\/\/|(?:www\.)?tiktok\.com\/)/i.test(input)) {
    const url = new URL(input.includes('://') ? input : 'https://' + input);
    if (url.protocol !== 'https:' || !['tiktok.com', 'www.tiktok.com', 'm.tiktok.com'].includes(url.hostname) || url.username || url.password || url.port)
      throw new Error('INVALID_USERNAME');
    const match = url.pathname.match(/^\/@([^/]+)(?:\/video\/\d+)?\/?$/);
    if (!match) throw new Error('UNSUPPORTED_LINK');
    input = decodeURIComponent(match[1]);
  } else input = input.replace(/^@/, '');
  if (!/^[a-zA-Z0-9_][a-zA-Z0-9_.]{0,22}[a-zA-Z0-9_]$/.test(input)) throw new Error('INVALID_USERNAME');
  return input.toLowerCase();
}
export function analyze(profile: PublicProfile, videos: PublicVideo[] | null) {
  const issues: Observation[] = [];
  const factors: { name: string; earned: number; possible: number }[] = [];
  const add = (id: string, kind: Observation['kind'], title: string, explanation: string, recommendation: string) => issues.push({id, kind, title, explanation, recommendation});
  if (profile.bio !== null) {
    factors.push({name: 'وضوح وصف الحساب', earned: profile.bio.trim() ? 25 : 0, possible: 25});
    if (!profile.bio.trim()) add('bio', 'fact', 'لا يوجد وصف للحساب', 'المصدر أعاد وصفاً فارغاً.', 'اكتب وصفاً يوضح نوع محتواك وما يقدمه للمتابع.');
  }
  if (profile.avatarUrl !== null) factors.push({name: 'توفر صورة الملف', earned: 25, possible: 25});
  if (profile.videos !== null) {
    factors.push({name: 'وجود منشورات عامة', earned: profile.videos > 0 ? 25 : 0, possible: 25});
    if (profile.videos === 0) add('empty', 'fact', 'لا توجد منشورات عامة حسب المصدر', 'عدد المنشورات الذي أعاده المصدر هو صفر؛ هذا لا يثبت حالة الحساب الداخلية.', 'انشر محتوى عاماً إذا كان هدفك الوصول إلى جمهور.');
  }
  if (profile.displayName !== null) factors.push({name: 'وجود اسم ظاهر', earned: profile.displayName.trim() ? 25 : 0, possible: 25});
  const sample = videos?.filter(v => v.views !== null && v.views > 0 && v.likes !== null && v.comments !== null && v.shares !== null) ?? [];
  const totalViews = sample.reduce((s, v) => s + v.views!, 0);
  const interactions = sample.reduce((s, v) => s + v.likes! + v.comments! + v.shares!, 0);
  const engagementRate = totalViews ? Math.round(interactions / totalViews * 10000) / 100 : null;
  if (engagementRate !== null && engagementRate < 1) add('engagement', 'estimate', 'تفاعل العينة أقل من 1%', 'تقدير للعينة المتاحة حسب المشاهدات، وليس حكماً على الحساب كله.', 'جرّب افتتاحيات أوضح، ثم قارن بعينة لاحقة مماثلة.');
  const dates = (videos ?? []).map(v => v.publishedAt ? Date.parse(v.publishedAt) : NaN).filter(Number.isFinite).sort((a,b) => a-b);
  let averagePostingGapDays: number | null = null;
  if (dates.length >= 3) {
    const gaps = dates.slice(1).map((d,i) => (d-dates[i])/86400000);
    averagePostingGapDays = Math.round(gaps.reduce((a,b) => a+b,0)/gaps.length*10)/10;
    if (Math.max(...gaps) > Math.max(2, Math.min(...gaps)*3)) add('irregular', 'estimate', 'فترات نشر متفاوتة في العينة', 'الاستنتاج مبني على تواريخ الفيديوهات المتاحة فقط.', 'اختبر جدول نشر مستدام وقارنه مع نتائجك الفعلية.');
  }
  if (videos === null || engagementRate === null) add('insufficient', 'fact', 'بيانات غير كافية لتحليل التفاعل الكامل', 'بعض بيانات الفيديوهات المطلوبة غير متاحة.', 'اربط مصدراً مصرحاً يوفر المشاهدات والإعجابات والتعليقات والمشاركات.');
  const possible = factors.reduce((s,f) => s+f.possible,0);
  return {engagementRate, sampleSize: sample.length, averagePostingGapDays,
    estimatedAccountScore: factors.length >= 3 ? Math.round(factors.reduce((s,f) => s+f.earned,0)/possible*100) : null,
    factors, issues, recommendations: issues.map(i => i.recommendation),
    disclaimer: 'نسبة أمان الحساب تقييم تقديري لمؤشرات الملف العامة فقط؛ لا تكشف الاختراق أو الانتهاكات أو العقوبات أو Shadowban أو حالة كلمة المرور.'};
}
