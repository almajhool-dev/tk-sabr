import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { cleanTikTokUsername, isValidTikTokUsername, calculateEngagementRate } from './src/utils/tiktok.ts';
import { calculateSecurityScore } from './src/utils/securityScore.ts';
import { diagnoseProfileProblems } from './src/utils/diagnostics.ts';
import {
  SUBSCRIPTION_PLANS,
} from './src/utils/paymentAdapter.ts';
import type {
  TikTokProfile,
  GeminiAIReport,
} from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));
// Small in-memory throttle for public endpoints; deploy an external rate limiter for multi-instance production.
const requestTimes = new Map<string, number[]>();
const throttleApi = (req: Request, res: Response, next: () => void) => {
  const key = `${req.socket.remoteAddress || 'unknown'}:${req.path}`;
  const now = Date.now();
  const active = (requestTimes.get(key) || []).filter(t => now - t < 60_000);
  if (active.length >= 15) {
    res.status(429).json({ success: false, message: 'تم تجاوز عدد الطلبات المؤقت. حاول بعد دقيقة.' });
    return;
  }
  active.push(now);
  requestTimes.set(key, active);
  next();
};
app.use('/api/tiktok', throttleApi);
app.use('/api/gemini', throttleApi);


// Initialize Gemini Client
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
}) : null;

// In-Memory Database for Platform State
const cache = new Map<string, { profile: TikTokProfile; expires: number }>();


// Helper: Scrape or retrieve real public TikTok account data
async function fetchRealTikTokProfile(username: string): Promise<{ profile?: TikTokProfile; error?: string; status: number }> {
  const clean = cleanTikTokUsername(username);
  if (!clean || !isValidTikTokUsername(clean)) {
    return { error: 'اسم المستخدم غير صالح أو يحتوي على رموز غير مقبولة في TikTok.', status: 400 };
  }

  // Check cache (TTL: 5 minutes)
  const cached = cache.get(clean.toLowerCase());
  if (cached && cached.expires > Date.now()) {
    return { profile: cached.profile, status: 200 };
  }

  const profileUrl = `https://www.tiktok.com/@${clean}`;
  let rawHtml = '';
  let oembedData: any = null;

  try {
    // 1. Check TikTok oEmbed official public API first
    const oembedRes = await fetch(`https://www.tiktok.com/oembed?url=https://www.tiktok.com/@${clean}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (oembedRes.ok) {
      oembedData = await oembedRes.json();
    } else if (oembedRes.status === 404) {
      return { error: `الحساب @${clean} غير موجود على منصة TikTok. يرجى التأكد من كتابة اليوزر بشكل صحيح.`, status: 404 };
    }
  } catch (err) {
    console.warn(`oEmbed check warning for @${clean}:`, err);
  }

  try {
    // 2. Fetch public TikTok Web profile page
    const pageRes = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(7000),
    });

    if (pageRes.status === 404) {
      return { error: `الحساب @${clean} غير موجود على TikTok أو تم حذفه/تغيير معرفه.`, status: 404 };
    }

    rawHtml = await pageRes.text();
  } catch (err: any) {
    console.warn(`Fetch error for @${clean}:`, err?.message);
  }

  // 3. Extract profile metadata from SIGI_STATE or __UNIVERSAL_DATA_FOR_REHYDRATION__ or HTML Meta
  let displayName = oembedData?.author_name || clean;
  let bio = '';
  let avatar = oembedData?.thumbnail_url || '';
  let verified = false;
  let privateAccount = false;
  let followersCount = 0;
  let followingCount = 0;
  let likesCount = 0;
  let videoCount = 0;
  let secUid = '';
  let userId = '';
  let extractedReliable = false;
  let hasVerifiedStats = false;

  // Try extracting universal rehydration data
  if (rawHtml) {
    try {
      const universalMatch = rawHtml.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
      if (universalMatch && universalMatch[1]) {
        const parsed = JSON.parse(universalMatch[1]);
        const userDetail = parsed?.['__DEFAULT_SCOPE__']?.['webapp.user-detail']?.userInfo;
        if (userDetail) {
          const u = userDetail.user || {};
          const s = userDetail.stats || {};
          displayName = u.nickname || displayName;
          bio = u.signature || '';
          avatar = u.avatarLarger || u.avatarMedium || avatar;
          verified = Boolean(u.verified);
          privateAccount = Boolean(u.privateAccount);
          secUid = u.secUid || '';
          const toUnsigned = (n: any) => {
            const v = Number(n) || 0;
            return v < 0 ? (v >>> 0) : v;
          };
          followersCount = toUnsigned(s.followerCount);
          followingCount = toUnsigned(s.followingCount);
          likesCount = toUnsigned(s.heartCount);
          videoCount = toUnsigned(s.videoCount);
          extractedReliable = true;
          hasVerifiedStats = userDetail.stats && [s.followerCount,s.followingCount,s.heartCount,s.videoCount].every((n: any) => n !== undefined && n !== null && Number.isFinite(Number(n)));
        }
      }
    } catch (e) {
      // Fall through to SIGI_STATE
    }

    if (!extractedReliable) {
      try {
        const sigiMatch = rawHtml.match(/<script id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/);
        if (sigiMatch && sigiMatch[1]) {
          const sigi = JSON.parse(sigiMatch[1]);
          const userObj = sigi?.UserModule?.users?.[clean] || Object.values(sigi?.UserModule?.users || {})[0] as any;
          const statsObj = sigi?.UserModule?.stats?.[clean] || Object.values(sigi?.UserModule?.stats || {})[0] as any;
          if (userObj) {
            displayName = userObj.nickname || displayName;
            bio = userObj.signature || '';
            avatar = userObj.avatarLarger || userObj.avatarMedium || avatar;
            verified = Boolean(userObj.verified);
            privateAccount = Boolean(userObj.privateAccount);
            secUid = userObj.secUid || '';
            userId = userObj.id || '';
          }
          if (statsObj) {
            const toUnsigned = (n: any) => {
              const v = Number(n) || 0;
              return v < 0 ? (v >>> 0) : v;
            };
            followersCount = toUnsigned(statsObj.followerCount) || followersCount;
            followingCount = toUnsigned(statsObj.followingCount) || followingCount;
            likesCount = toUnsigned(statsObj.heartCount) || likesCount;
            videoCount = toUnsigned(statsObj.videoCount) || videoCount;
            extractedReliable = true;
            hasVerifiedStats = [statsObj.followerCount,statsObj.followingCount,statsObj.heartCount,statsObj.videoCount].every((n: any) => n !== undefined && n !== null && Number.isFinite(Number(n)));
          }
        }
      } catch (e) {
        // Fall through to OpenGraph tags
      }
    }

    // Try OpenGraph Meta tags
    if (!extractedReliable) {
      const ogTitle = rawHtml.match(/<meta property="og:title" content="([^"]*)"/i);
      const ogDesc = rawHtml.match(/<meta property="og:description" content="([^"]*)"/i);
      const ogImg = rawHtml.match(/<meta property="og:image" content="([^"]*)"/i);

      if (ogTitle && ogTitle[1]) {
        displayName = ogTitle[1].split('(')[0].trim() || displayName;
      }
      if (ogImg && ogImg[1]) {
        avatar = ogImg[1];
      }
      if (ogDesc && ogDesc[1]) {
        bio = ogDesc[1];
        // Sometimes description has: "X Followers, Y Following, Z Likes - Watch videos..."
        const statsMatch = ogDesc[1].match(/([0-9.KMB]+)\s*Followers.*?([0-9.KMB]+)\s*Following.*?([0-9.KMB]+)\s*Likes/i);
        if (statsMatch) {
          const parseStat = (str: string) => {
            const num = parseFloat(str);
            if (str.toUpperCase().includes('B')) return Math.round(num * 1000000000);
            if (str.toUpperCase().includes('M')) return Math.round(num * 1000000);
            if (str.toUpperCase().includes('K')) return Math.round(num * 1000);
            return Math.round(num);
          };
          followersCount = parseStat(statsMatch[1]);
          followingCount = parseStat(statsMatch[2]);
          likesCount = parseStat(statsMatch[3]);
          extractedReliable = true;
          hasVerifiedStats = false; // OG description omits video count; do not pretend full analysis is available.
        }
      }
    }
  }

  // If TikTok blocked or couldn't parse live HTML, but oEmbed succeeded:
  if (!extractedReliable && oembedData) {
    displayName = oembedData.author_name || clean;
    avatar = oembedData.thumbnail_url || avatar;
    extractedReliable = true;
  }

  // If not found anywhere
  if (!extractedReliable && !rawHtml.includes('tiktok.com')) {
    return {
      error: `تعذر الاتصال بخوادم TikTok أو الحساب @${clean} غير متاح حالياً. يرجى المحاولة لاحقاً.`,
      status: 502,
    };
  }

  if (!hasVerifiedStats) {
    return { error: 'تعذر استخراج الإحصائيات الموثوقة من TikTok حالياً. قد يمنع TikTok الوصول من السيرفر؛ لا يمكن عرض نسبة أمان دقيقة دون إحصائيات.', status: 502 };
  }

  // Avatar placeholder is visual-only; never imply it is an original TikTok picture
  if (!avatar) {
    avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(clean)}&background=00f2fe&color=030712&bold=true`;
  }

  const engagementRate = calculateEngagementRate(followersCount, likesCount, videoCount);
  const avgLikesPerVideo = videoCount > 0 ? Math.round(likesCount / videoCount) : 0;

  const profile: TikTokProfile = {
    username: clean,
    displayName: displayName || clean,
    avatar,
    id: userId || undefined,
    secUid: secUid || undefined,
    bio: bio || 'لا يوجد وصف متاح للحساب',
    verified,
    privateAccount,
    followersCount,
    followingCount,
    likesCount,
    videoCount,
    originalUrl: profileUrl,
    engagementRate,
    avgLikesPerVideo,
    dataReliability: extractedReliable ? 'verified_public' : 'partial_public',
    scannedAt: new Date().toISOString(),
  };

  // Cache for 5 minutes
  cache.set(clean.toLowerCase(), {
    profile,
    expires: Date.now() + 5 * 60 * 1000,
  });

  return { profile, status: 200 };
}

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------

// 1. TikTok Scanner Endpoint
app.post('/api/tiktok/scan', async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, message: 'اسم المستخدم مطلوب' });
    }

    const result = await fetchRealTikTokProfile(username);
    if (result.error || !result.profile) {
      return res.status(result.status).json({ success: false, message: result.error });
    }

    const securityScore = calculateSecurityScore(result.profile);
    const problems = diagnoseProfileProblems(result.profile);

    return res.json({
      success: true,
      profile: result.profile,
      securityScore,
      problems,
    });
  } catch (error: any) {
    console.error('Scan API error:', error);
    return res.status(500).json({ success: false, message: 'حدث خطأ داخلي أثناء معالجة فحص الحساب.' });
  }
});

// 2. TikTok Compare Endpoint
app.post('/api/tiktok/compare', async (req: Request, res: Response) => {
  try {
    const { usernames } = req.body;
    if (!Array.isArray(usernames) || usernames.length < 2) {
      return res.status(400).json({ success: false, message: 'يرجى تقديم اسمي مستخدم على الأقل للمقارنة.' });
    }

    const profiles: TikTokProfile[] = [];
    for (const u of usernames.slice(0, 3)) {
      const r = await fetchRealTikTokProfile(u);
      if (r.profile) {
        profiles.push(r.profile);
      }
    }

    if (profiles.length === 0) {
      return res.status(404).json({ success: false, message: 'لم يتم العثور على الحسابات المدخلة للمقارنة.' });
    }

    return res.json({
      success: true,
      profiles,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'فشلت عملية المقارنة.' });
  }
});

// 3. TK_SABR AI Engine via Gemini API
app.post('/api/gemini/analyze', async (req: Request, res: Response) => {
  try {
    if (!ai) return res.status(503).json({success:false,message:'تحليل الذكاء الاصطناعي غير مفعّل بعد. يجب إعداد GEMINI_API_KEY على السيرفر.'});
    const { profile, securityScore } = req.body;
    if (!profile || !profile.username) {
      return res.status(400).json({ success: false, message: 'بيانات الملف الشخصي مطلوبة للتحليل الذكي.' });
    }

    const prompt = `
أنت كبير محللي منصة TK_SABR الاستخباراتية المتخصصة في تحليل وتطوير حسابات TikTok بالذكاء الاصطناعي.
قم بتحليل بيانات الحساب الحقيقي التالية بدقة وواقعية دون اختلاق أرقام ليست موجودة:

- اسم المستخدم: @${profile.username}
- الاسم الظاهر: ${profile.displayName}
- المتابعون: ${profile.followersCount}
- المتابَعون: ${profile.followingCount}
- مجموع الإعجابات: ${profile.likesCount}
- عدد الفيديوهات: ${profile.videoCount}
- الوصف (Bio): "${profile.bio}"
- التوثيق: ${profile.verified ? 'موثق' : 'غير موثق'}
- معدل التفاعل التقديري: ${profile.engagementRate}%
- نسبة أمان وصحة الحساب المقدرة: ${securityScore?.score || 'غير محدد'}%

المطلوب: توليد تقرير تحليلي شامل باللغة العربية بصيغة JSON فقط، متوافق مع الحقول التالية:
{
  "summary": "ملخص تنفيذي مركز عن وضع الحساب وفرصه في الانتشار",
  "strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3"],
  "weaknesses": ["نقطة ضعف 1", "نقطة ضعف 2", "نقطة ضعف 3"],
  "engagementAnalysis": "تحليل معمق لتفاعل الجمهور ومعدل التحويل مع توصيات لزيادة التعليقات والمشاركات",
  "contentStrategyIdeas": ["فكرة فيديو إبداعية 1 مع Hook", "فكرة فيديو 2", "فكرة فيديو 3", "فكرة فيديو 4"],
  "optimalPostingTimes": [
    {"day": "الأحد - الثلاثاء", "timeWindow": "7:00 م - 10:00 م", "reason": "ذروة تصفح المستخدمين المسائية"},
    {"day": "الخميس - الجمعة", "timeWindow": "2:00 م - 5:00 م و 9:00 م - 12:00 ص", "reason": "عطلة نهاية الأسبوع وزيادة وقت المشاهدة"}
  ],
  "thirtyDayPlan": [
    {
      "week": 1,
      "focus": "إعادة هيكلة الهوية وتحسين الملف الشخصي وخطافات أول 3 ثوانٍ",
      "milestones": ["تحديث الـ Bio والروابط", "نشر 4 مقاطع وفق هيكل Hook-Story-Offer"],
      "actions": ["تحديد الكلمات المفتاحية لمجال الحساب", "استخدام أصوات الترند المناسبة"]
    },
    {
      "week": 2,
      "focus": "تثبيت جدول النشر وتحفيز الحفظ والمشاركات (Saves & Shares)",
      "milestones": ["إنشاء سلسلة فيديوهات من 3 أجزاء", "تحقيق زيادة 20% في معدل التعليقات"],
      "actions": ["طرح سؤال جدلي أو ملهم في نهاية كل مقطع", "الرد السريع على أول 50 تعليق بالفيديو"]
    },
    {
      "week": 3,
      "focus": "الاستفادة من ميزة الدويتو (Duet) والستيتش (Stitch) وتحليل الأكثر انتشاراً",
      "milestones": ["مضاعفة المشاهدات عبر التفاعل مع محتوى رائج في نفس النيش"],
      "actions": ["مراجعة إحصائيات المقاطع في TikTok Analytics ومضاعفة النمط الناجح"]
    },
    {
      "week": 4,
      "focus": "التحويل وبناء المجتمع والولاء وقياس المؤشرات الشهرية",
      "milestones": ["تقييم نمو المتابعين وصحة الحساب العامة", "إطلاق استطلاع رأي للجمهور"],
      "actions": ["تثبيت أفضل 3 مقاطع في أعلى الصفحة", "جدولة خطة الشهر التالي بناءً على البيانات"]
    }
  ],
  "toneAndNiche": "طبيعة المحتوى والأسلوب المقترح",
  "growthVerdict": "حكم نهائي موجز وتوقعات النمو عند الالتزام بالتوصيات",
  "aiDisclaimer": "هذا التقرير تم توليده بواسطة محرك TK_SABR AI بالاعتماد على البيانات العامة لحساب TikTok والممارسات القياسية لنمو المحتوى."
}
`;

    let reportJson: GeminiAIReport | null = null;

    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI timeout')), 6500)
        ),
      ]);

      if (response && response.text) {
        reportJson = JSON.parse(response.text);
      }
    } catch (modelErr: any) {
      console.warn('Gemini generateContent fallback triggered:', modelErr?.message);
    }

    if (!reportJson || !reportJson.summary) {
      return res.status(502).json({success:false,message:'لم يتمكن Gemini من توليد تحليل موثوق حالياً. حاول لاحقاً.'});
    }

    return res.json({ success: true, report: reportJson });
  } catch (error: any) {
    console.error('Gemini Analysis error:', error);
    return res.status(500).json({
      success: false,
      message: 'تعذر توليد تقرير الذكاء الاصطناعي حالياً. يرجى التحقق من اتصال الخادم.',
    });
  }
});

// 4. Gemini AI Interactive Follow-up Chat
app.post('/api/gemini/chat', async (req: Request, res: Response) => {
  try {
    if (!ai) return res.status(503).json({success:false,message:'المحادثة الذكية غير مفعّلة بعد.'});
    const { question, profileContext } = req.body;
    if (!question) {
      return res.status(400).json({ success: false, message: 'السؤال مطلوب' });
    }

    const prompt = `
أنت مستشار استراتيجي لخوارزميات TikTok في منصة TK_SABR.
معلومات الحساب: ${JSON.stringify(profileContext || {})}
سؤال المستخدم: "${question}"

أجب باللغة العربية باحترافية، وقدم نصائح عملية ومباشرة ومبنية على أحدث ممارسات خوارزميات TikTok لعام 2026.
`;

    let answer = '';
    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Chat timeout')), 5000)
        ),
      ]);
      answer = response?.text || '';
    } catch (e: any) {
      console.warn('Chat fallback triggered:', e?.message);
    }

    if (!answer) return res.status(502).json({success:false,message:'تعذر الحصول على رد حقيقي من Gemini. حاول لاحقاً.'});

    return res.json({ success: true, answer });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'تعذر معالجة السؤال.' });
  }
});

// Monitoring requires authenticated, per-user persistent storage and a scheduler.
// Keeping it disabled prevents cross-user access and fictitious automatic tracking.
app.get('/api/monitor/list', (_req: Request, res: Response) => res.status(503).json({success:false,message:'المراقبة الدورية غير مفعّلة حتى ربط قاعدة بيانات ومصادقة حقيقية.'}));
app.post('/api/monitor/add', (_req: Request, res: Response) => res.status(503).json({success:false,message:'المراقبة الدورية غير مفعّلة حالياً.'}));
app.delete('/api/monitor/:id', (_req: Request, res: Response) => res.status(503).json({success:false,message:'المراقبة الدورية غير مفعّلة حالياً.'}));

// IMPORTANT: The archive had fabricated payment successes and an unauthenticated
// bank payout API. They are disabled pending a verified merchant gateway,
// webhook validation, persistent ledgers and server-side admin authorization.
app.post('/api/payment/checkout', (_req: Request, res: Response) => res.status(503).json({success:false,message:'الدفع الإلكتروني غير مفعّل بعد؛ لم يتم الخصم من البطاقة أو تفعيل أي اشتراك.'}));
app.get('/api/admin/overview', (_req: Request, res: Response) => res.status(403).json({success:false,message:'لوحة الإدارة تحتاج تسجيل دخول إداري موثق من السيرفر.'}));
app.post('/api/admin/settlement/payout', (_req: Request, res: Response) => res.status(403).json({success:false,message:'التحويلات المصرفية غير متاحة قبل ربط مزود دفع رسمي وصلاحيات إدارية.'}));

// 8. Plans and Coupons endpoints for Frontend
app.get('/api/plans', (_req: Request, res: Response) => {
  return res.json({ success: true, plans: SUBSCRIPTION_PLANS });
});

// Configure Vite integration for Full-Stack dev mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`TK_SABR Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
