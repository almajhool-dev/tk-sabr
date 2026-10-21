import { z } from "zod";
import { cleanTikTokUsername } from "../src/utils/tiktok.ts";
const count = z
  .number()
  .int()
  .nonnegative()
  .max(Number.MAX_SAFE_INTEGER)
  .nullable()
  .default(null);
const text = z.string().max(3000).nullable().default(null);
const https = z
  .string()
  .url()
  .refine((s) => new URL(s).protocol === "https:")
  .nullable()
  .default(null);
export const profileSchema = z.object({
  displayName: text,
  avatarUrl: https,
  verified: z.boolean().nullable().default(null),
  followers: count,
  following: count,
  likes: count,
  videos: count,
  bio: text,
  private: z.boolean().nullable().default(null),
});
export const videoSchema = z.object({
  id: z.string().max(100),
  title: text,
  thumbnailUrl: https,
  views: count,
  likes: count,
  comments: count,
  shares: count,
  publishedAt: z.string().datetime().nullable().default(null),
});
export const sourceSchema = z.object({
  username: z.string(),
  profile: profileSchema,
  videos: z.array(videoSchema).max(50).default([]),
});
export type AccountData = z.infer<typeof sourceSchema>;
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function parseUsername(input: unknown) {
  const v = z.object({ username: z.string().min(2).max(300) }).safeParse(input);
  const name = v.success ? cleanTikTokUsername(v.data.username) : "";
  if (!name)
    throw new ApiError(
      400,
      "INVALID_USERNAME",
      "أدخل يوزراً صحيحاً أو رابط حساب TikTok كاملاً. الروابط المختصرة تحتاج الرابط الكامل.",
    );
  return name.toLowerCase();
}
export function analyze(data: AccountData) {
  const p = data.profile,
    issues: Array<{
      type: "fact" | "estimate" | "limitation";
      title: string;
      recommendation: string;
    }> = [];
  const factors: Array<{ name: string; points: number; max: number }> = [];
  const factor = (name: string, ok: boolean, max: number) =>
    factors.push({ name, points: ok ? max : 0, max });
  if (p.displayName !== null)
    factor("وجود اسم ظاهر", !!p.displayName.trim(), 20);
  if (p.bio !== null) {
    factor("وجود وصف تعريفي", p.bio.trim().length >= 5, 30);
    if (p.bio.trim().length < 5)
      issues.push({
        type: "fact",
        title: "الوصف التعريفي فارغ أو قصير",
        recommendation: "اكتب تخصصك والقيمة التي تقدمها بوضوح.",
      });
  }
  if (p.avatarUrl !== null) factor("توفر صورة الملف", !!p.avatarUrl, 20);
  if (p.videos !== null && p.private !== true) {
    factor("توفر منشورات عامة", p.videos > 0, 30);
    if (p.videos === 0)
      issues.push({
        type: "fact",
        title: "لا توجد منشورات متاحة حسب المصدر",
        recommendation: "انشر محتوى عاماً إذا كان هدفك الوصول للجمهور.",
      });
  }
  const sample = data.videos.filter(
    (v) =>
      v.views !== null &&
      v.views > 0 &&
      v.likes !== null &&
      v.comments !== null &&
      v.shares !== null,
  );
  const views = sample.reduce((s, v) => s + v.views!, 0);
  const engagementRate = views
    ? Math.round(
        (sample.reduce((s, v) => s + v.likes! + v.comments! + v.shares!, 0) /
          views) *
          10000,
      ) / 100
    : null;
  if (sample.length < 3)
    issues.push({
      type: "limitation",
      title: "عينة الفيديوهات غير كافية لتحليل الاتجاهات",
      recommendation:
        "لا تستنتج انتظام النشر أو انخفاض الوصول من بيانات ناقصة.",
    });
  const dates = data.videos
    .map((v) => v.publishedAt)
    .filter(Boolean)
    .map((d) => Date.parse(d!))
    .sort((a, b) => a - b);
  const gaps = dates.slice(1).map((d, i) => (d - dates[i]) / 86400000);
  const avgGap = gaps.length
    ? gaps.reduce((a, b) => a + b, 0) / gaps.length
    : null;
  if (p.private)
    issues.push({
      type: "fact",
      title: "المصدر يحدد الحساب كحساب خاص",
      recommendation: "لا تتوفر تحليلات محتوى غير عام.",
    });
  const max = factors.reduce((s, f) => s + f.max, 0);
  return {
    engagementRate,
    engagementFormula: "sum(likes + comments + shares) / sum(views) × 100",
    sampleSize: sample.length,
    estimatedAccountScore:
      max >= 80 && !p.private
        ? Math.round((factors.reduce((s, f) => s + f.points, 0) / max) * 100)
        : null,
    scoreDisclaimer:
      "تقييم تقديري لاكتمال الملف وتوفر المحتوى فقط؛ لا يكشف الاختراق أو العقوبات أو Shadowban أو أمان كلمة المرور.",
    factors,
    averagePostingGapDays: avgGap,
    issues,
    recommendations: issues.map((i) => i.recommendation),
  };
}
