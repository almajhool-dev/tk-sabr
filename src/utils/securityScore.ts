import type { SecurityScore, SecurityFactor, TikTokProfile } from '../types/index.ts';

/**
 * Calculates Account Security & Health Score ("نسبة أمان الحساب")
 * Score range: 0 to 100%
 * Colors per prompt specifications:
 * - 0–39%  أحمر (Red)
 * - 40–69% برتقالي (Orange)
 * - 70–89% أصفر (Yellow)
 * - 90–100% أخضر (Green)
 */
export function calculateSecurityScore(profile: Partial<TikTokProfile>): SecurityScore {
  const factors: SecurityFactor[] = [];
  let totalScore = 0;

  // 1. Profile Completeness (Max 25 pts)
  let profilePts = 0;
  const hasAvatar = !!profile.avatar && !profile.avatar.includes('default-avatar');
  const hasBio = !!profile.bio && profile.bio.trim().length > 3;
  const hasDisplayName = !!profile.displayName && profile.displayName.trim().length > 0;
  const bioLength = profile.bio ? profile.bio.length : 0;

  if (hasAvatar) profilePts += 10;
  if (hasBio) {
    profilePts += 8;
    if (bioLength > 20) profilePts += 2;
  }
  if (hasDisplayName) profilePts += 5;

  factors.push({
    id: 'profile_completeness',
    name: 'اكتمال الملف التعريفي والبيانات الأساسية',
    score: profilePts,
    maxScore: 25,
    status: profilePts >= 20 ? 'good' : profilePts >= 12 ? 'average' : 'poor',
    note: profilePts >= 20
      ? 'الملف الشخصي مكتمل ومزود بصورة ووصف واضحين.'
      : profilePts >= 12
      ? 'الملف الشخصي بحاجة إلى تحسين الوصف والصورة الشخصية.'
      : 'الملف الشخصي يفتقر للصورة أو الوصف التعريفي (Bio).',
  });
  totalScore += profilePts;

  // 2. Engagement Authenticity & Ratio (Max 30 pts)
  let engagementPts = 0;
  const followers = profile.followersCount || 0;
  const likes = profile.likesCount || 0;
  const engagementRate = profile.engagementRate || 0;

  if (followers > 0) {
    const likesRatio = likes / followers;
    // Healthy organic TikTok accounts generally have likes > 2x to 50x followers
    if (likesRatio >= 2 && likesRatio <= 200) {
      engagementPts += 20;
    } else if (likesRatio > 0.5) {
      engagementPts += 12;
    } else {
      engagementPts += 4;
    }

    if (engagementRate >= 3.0) {
      engagementPts += 10;
    } else if (engagementRate >= 1.0) {
      engagementPts += 6;
    } else {
      engagementPts += 2;
    }
  } else {
    // New or private
    engagementPts = 8;
  }

  factors.push({
    id: 'engagement_ratio',
    name: 'توازن ونشاط التفاعل (الإعجابات والمتابعين)',
    score: engagementPts,
    maxScore: 30,
    status: engagementPts >= 24 ? 'good' : engagementPts >= 15 ? 'average' : 'poor',
    note: engagementPts >= 24
      ? 'معدل التفاعل متناسق وطبيعي مع قاعدة المتابعين.'
      : engagementPts >= 15
      ? 'معدل التفاعل مقبول مع وجود تفاوت طفيف.'
      : 'تفاوت ملحوظ بين عدد المتابعين وحجم التفاعل الفعلي.',
  });
  totalScore += engagementPts;

  // 3. Publishing & Content Activity (Max 20 pts)
  let activityPts = 0;
  const videoCount = profile.videoCount || 0;

  if (videoCount >= 30) {
    activityPts = 20;
  } else if (videoCount >= 10) {
    activityPts = 15;
  } else if (videoCount >= 3) {
    activityPts = 10;
  } else if (videoCount >= 1) {
    activityPts = 5;
  } else {
    activityPts = 2;
  }

  factors.push({
    id: 'content_activity',
    name: 'كثافة النشر والنشاط المحتوى',
    score: activityPts,
    maxScore: 20,
    status: activityPts >= 16 ? 'good' : activityPts >= 10 ? 'average' : 'poor',
    note: activityPts >= 16
      ? 'الحساب نشط ويحتوي على سجل كافٍ من مقاطع الفيديو المنشورة.'
      : activityPts >= 10
      ? 'الحساب لديه نشاط متواضع يمكن دعمه بالمزيد من المحتوى.'
      : 'قلة أو انعدام مقاطع الفيديو المتاحة للتحليل.',
  });
  totalScore += activityPts;

  // 4. Verification and Authority Signals (Max 15 pts)
  let authPts = 0;
  if (profile.verified) {
    authPts = 15;
  } else {
    // Regular public account with established followers
    if (followers > 50000) authPts = 12;
    else if (followers > 5000) authPts = 9;
    else if (followers > 500) authPts = 6;
    else authPts = 3;
  }

  factors.push({
    id: 'authority_signal',
    name: 'إشارات التوثيق وموثوقية الهوية',
    score: authPts,
    maxScore: 15,
    status: authPts >= 12 ? 'good' : authPts >= 7 ? 'average' : 'poor',
    note: profile.verified
      ? 'الحساب موثق رسمياً بعلامة التوثيق الزرقاء لدى TikTok.'
      : authPts >= 9
      ? 'الحساب يحظى بموثوقية مجتمعية جيدة.'
      : 'الحساب غير موثق وقيد بناء المصداقية.',
  });
  totalScore += authPts;

  // 5. Follower-to-Following Natural Ratio (Max 10 pts)
  let ratioPts = 0;
  const following = profile.followingCount || 0;
  if (followers > 0) {
    const followingRatio = following / Math.max(1, followers);
    if (followingRatio <= 1.0) {
      ratioPts = 10; // normal healthy creator pattern
    } else if (followingRatio <= 3.0) {
      ratioPts = 6;
    } else {
      ratioPts = 3; // follow-for-follow or spam-like ratio
    }
  } else {
    ratioPts = 5;
  }

  factors.push({
    id: 'ratio_balance',
    name: 'نسبة المتابَعين الطبيعية (منع سلوكيات المتابعة الآلية)',
    score: ratioPts,
    maxScore: 10,
    status: ratioPts >= 8 ? 'good' : ratioPts >= 5 ? 'average' : 'poor',
    note: ratioPts >= 8
      ? 'نسبة المتابعة سليمة وتعكس نمواً حقيقياً مستقلاً.'
      : 'نسبة المتابَعين مرتفعة مقارنة بالمتابعين.',
  });
  totalScore += ratioPts;

  // Clamp totalScore to 0-100
  const score = Math.max(0, Math.min(100, Math.round(totalScore)));

  // Determine Level and Exact Color based on prompt rules:
  // 0–39% أحمر.
  // 40–69% برتقالي.
  // 70–89% أصفر.
  // 90–100% أخضر.
  let level: SecurityScore['level'];
  let color: string;
  let grade: string;
  let title: string;

  if (score >= 90) {
    level = 'excellent';
    color = '#10b981'; // Green
    grade = 'A+';
    title = 'مؤشر أمان ممتاز وموثوقية عالية';
  } else if (score >= 70) {
    level = 'moderate';
    color = '#eab308'; // Yellow
    grade = 'B';
    title = 'مؤشر أمان جيد وصحة مقبولة';
  } else if (score >= 40) {
    level = 'warning';
    color = '#f97316'; // Orange
    grade = 'C';
    title = 'مؤشر أمان متوسط يتطلب تحسينات';
  } else {
    level = 'critical';
    color = '#ef4444'; // Red
    grade = 'D-';
    title = 'مؤشر أمان منخفض ومشاكل ظاهرة';
  }

  // Calculate confidence percentage based on data completeness
  let confidence = 85;
  if (profile.dataReliability === 'verified_public') confidence = 95;
  if (profile.privateAccount) confidence = 40;

  const disclaimer =
    'تنبيه نظام TK_SABR: هذه النسبة تقديرية لصحة الحساب ومؤشراته العامة القابلة للقياس علناً، ولا تعني إثبات حماية الحساب من الاختراق أو اكتشاف أي عقوبات ومخالفات داخلية لدى خوارزميات TikTok.';

  return {
    score,
    level,
    color,
    grade,
    title,
    factors,
    confidencePercentage: confidence,
    disclaimer,
  };
}
