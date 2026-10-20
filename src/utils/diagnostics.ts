import type { DiagnosticProblem, TikTokProfile } from '../types/index.ts';

/**
 * Evaluates TikTok profile metrics to produce transparent, actionable diagnostics
 */
export function diagnoseProfileProblems(profile: TikTokProfile): DiagnosticProblem[] {
  const problems: DiagnosticProblem[] = [];

  // 1. Missing or Short Bio
  if (!profile.bio || profile.bio.trim().length < 5) {
    problems.push({
      id: 'missing_bio',
      title: 'عدم وجود وصف تعريفي واضح (Bio)',
      severity: 'warning',
      category: 'profile',
      reason: 'الوصف التعريفي فارغ أو قصير جداً، مما يصعّب على خوارزميات تيك توك تصنيف اهتمامات الحساب وجمهوره المستهدف.',
      solution: 'اكتب سيرة ذاتية موجزة تشرح تخصصك، القيمة التي تقدمها، ودعوة لاتخاذ إجراء (Call to Action) مثل رابط موقعك أو قناتك.',
      recommendation: 'استخدم كلمات مفتاحية واضحة في الـ Bio تساعد في تحسين ظهور حسابك في نتائج بحث تيك توك (TikTok SEO).',
    });
  }

  // 2. Engagement Rate Issues
  if (profile.followersCount > 1000 && profile.engagementRate < 2.0) {
    problems.push({
      id: 'low_engagement',
      title: 'انخفاض معدل التفاعل مقارنة بعدد المتابعين',
      severity: 'critical',
      category: 'engagement',
      reason: `معدل التفاعل المقدر حالياً هو (${profile.engagementRate}%) وهو أدنى من المعدل الصحي لحسابات التيك توك النشطة (3% - 8%).`,
      solution: 'ركز على الـ Hook القوي في أول 3 ثوانٍ من الفيديو واطرح أسئلة تحفز المتابعين على التعليق وإعادة النشر (Repost).',
      recommendation: 'قم بتحليل مقاطعك التي حصدت أعلى عدد حفظ (Saves) ومشاركات وكرر أسلوبها في الفيديوهات القادمة.',
    });
  }

  // 3. Follower to Following Disproportion (Follow-for-Follow signal)
  if (profile.followersCount > 100 && profile.followingCount > profile.followersCount * 1.5) {
    problems.push({
      id: 'unbalanced_following',
      title: 'تفاوت كبير في نسبة المتابَعين (Followings)',
      severity: 'warning',
      category: 'security',
      reason: `عدد الذين تتابعهم (${profile.followingCount}) يفوق عدد متابعيك بشكل ملحوظ، مما يعطي إشارة لخوارزميات المنصة بنمط متابعة عشوائي.`,
      solution: 'نظف قائمة المتابعين وألغِ متابعة الحسابات غير النشطة أو غير المرتبطة بمجال محتواك.',
      recommendation: 'احتفظ بمتابعة الحسابات الرائدة في مجالك فقط لتدريب خوارزميات تيك توك على نوع المحتوى الذي تتقنه.',
    });
  }

  // 4. Low Video Count / Low Activity
  if (profile.videoCount < 5 && !profile.privateAccount) {
    problems.push({
      id: 'low_activity',
      title: 'ضعف النشاط أو قلة المنشورات المتاحة',
      severity: 'warning',
      category: 'content',
      reason: `عدد مقاطع الفيديو المتاحة (${profile.videoCount}) غير كافٍ لخوارزميات التوصية (FYP) لبناء ملف تفاعل ثابت لجمهورك.`,
      solution: 'التزم بجدول نشر أسبوعي ثابت، بمعدل لا يقل عن 3 إلى 5 مقاطع فيديو أسبوعياً في أوقات الذروة.',
      recommendation: 'استغل المقاطع القصيرة والأصوات الرائجة (Trending Sounds) لزيادة سرعة انتشار الحساب بين المشاهدين الجدد.',
    });
  }

  // 5. Huge Followers with very low Total Likes
  if (profile.followersCount > 5000 && profile.likesCount < profile.followersCount * 0.5) {
    problems.push({
      id: 'ghost_followers_risk',
      title: 'تفاوت غير متوازن بين المتابعين ومجموع الإعجابات',
      severity: 'critical',
      category: 'engagement',
      reason: 'نسبة الإعجابات الإجمالية أقل بكثير من المتوقع لحساب بهذا الحجم من المتابعين، مما قد يشير إلى متابعين غير متفاعلين أو حسابات قديمة خاملة.',
      solution: 'أعد إحياء الحساب بحملة محتوى تفاعلي جديد ومسابقات واستطلاعات رأي لاستعادة اهتمام الجمهور.',
      recommendation: 'تجنب شراء المتابعين أو تبادل المتابعة الوهمي نهائياً لأن ذلك يضر بدرجة ثقة الحساب في خوارزميات الاقتراح.',
    });
  }

  // 6. Private Account Warning
  if (profile.privateAccount) {
    problems.push({
      id: 'private_account',
      title: 'الحساب مضبوط على الوضع الخاص (Private)',
      severity: 'info',
      category: 'profile',
      reason: 'الحساب مغلق ولا يمكن للجمهور العام أو أدوات التحليل الوصول إلى مقاطع الفيديو وإحصائيات المشاهدات.',
      solution: 'إذا كان الحساب لعلامة تجارية أو صانع محتوى يبحث عن النمو، ينصح بتحويله إلى حساب عام واحترافي (Business / Creator).',
      recommendation: 'الحسابات العامة فقط هي المؤهلة للظهور في صفحة لك (For You Page) واستقطاب متابعين جدد.',
    });
  }

  // 7. Unverified Authority Status
  if (!profile.verified && profile.followersCount > 100000) {
    problems.push({
      id: 'unverified_status',
      title: 'الحساب غير موثق رسمياً رغم الوصول لقاعدة جماهيرية واسعة',
      severity: 'info',
      category: 'security',
      reason: 'الحساب تجاوز 100 ألف متابع دون طلب توثيق رسمي، مما قد يجعله عرضة لإنشاء حسابات انتحال شخصية.',
      solution: 'قدم طلب التوثيق الرسمي عبر إعدادات تطبيق تيك توك بعد استيفاء الشروط وتوفير إثبات الهوية والتغطية الإعلامية.',
      recommendation: 'أضف قنواتك الرسمية الأخرى (YouTube, Instagram) في الملف الشخصي لتأكيد ملكيتك وهويتك الحقيقية.',
    });
  }

  // 8. If everything is great, provide proactive optimization
  if (problems.length === 0) {
    problems.push({
      id: 'optimization_advice',
      title: 'المؤشرات الأساسية للحساب ممتازة وصحية',
      severity: 'info',
      category: 'content',
      reason: 'البيانات العامة الحالية تظهر تناسقاً رائعاً في التفاعل واكتمال الملف الشخصي.',
      solution: 'واصل النشر المنتظم وطبق استراتيجيات سلاسل الفيديوهات (Multi-part series) لزيادة وقت المشاهدة ومعدل الإكمال.',
      recommendation: 'استخدم خطة الـ 30 يوماً المقترحة من TK_SABR AI لتطوير المحتوى ومضاعفة الوصول.',
    });
  }

  return problems;
}
