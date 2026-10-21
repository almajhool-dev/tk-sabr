# TK_SABR

منصة عربية/إنجليزية لتحليل حسابات TikTok العامة. تطوير **المبرمج المجهول**.

## الحالة الصريحة

الواجهة والخادم وقاعدة D1 وحساب المؤشرات والتقارير بالقواعد منفذة. **لم يتم ربط مزود بيانات TikTok مرخص أو إعداد مفاتيح Google/Supabase وGemini/Cloudflare في هذه الجلسة.** غياب المصدر ينتج HTTP 503 واضحاً، وليس بيانات تجريبية. لا يمكن ضمان فحص أي يوزر عبر Display API؛ واجهة TikTok الرسمية تتطلب موافقة المستخدم وصلاحيات معتمدة.

اختبارات وحدات وتكامل محلية تستخدم fixtures في `tests/` فقط. هذه ليست إثباتاً لنجاح فحص TikTok حي. `npm run test:live` منفصل ويتطلب مصدراً مصرحاً وحساب اختبار مسموحاً. لا توجد روابط تشغيل مؤكدة داخل هذا المستند.

## التشغيل

Node.js 24 مطلوب (TypeScript stripping وSQLite مدمجان). بعد تنزيل المستودع:

```bash
npm ci
cp .env.example .env
npm run dev
npm test
npm run lint
npm run build
```

الواجهة المحلية: `http://localhost:3000`. يستخدم التطوير SQLite محلياً بنفس مخطط D1، أما الإنتاج فيستخدم Worker وD1. لا تحفظ `local.sqlite` أو `.env` في Git. يُستخدم Node adapter للاختبار والتطوير فقط؛ لا تضعه خلف proxy في الإنتاج، بل انشر Worker ذي حد الطلبات المشترك في D1.

## مصدر البيانات: شرط ضروري للفحص الحقيقي

لم نحدد مورداً خارجياً ولم نثبت أن أي مورد مرخص. يجب على مالك المشروع اختيار مزود يملك حق توفير البيانات المطلوبة، ومراجعة حقوق الاستخدام والتخزين والتكلفة قبل تفعيله. الموصل في `backend/worker/provider.ts` ليس API TikTok رسمياً؛ إنه **عقد تكامل** لمزودك المعتمد. اضبط:

- `DATA_PROVIDER_URL`: عنوان HTTPS ثابت على الخادم، لا يؤخذ من المستخدم.
- `DATA_PROVIDER_KEY`: مفتاح الخادم فقط.
- `DATA_PROVIDER_NAME`: الاسم الظاهر مع النتائج.
- `DATA_PROVIDER_APPROVED=true`: فقط بعد التحقق من حقوق المزود. هذا الإقرار لا يثبت ترخيص المورد آلياً.

يرسل الموصل `POST` مع `Authorization: Bearer ...` وجسم `{"username":"example"}`. يجب أن يعيد مزودك JSON بالعقد التالي، أو تنشئ adapter صغيراً يناسب توثيقه:

```json
{
  "username": "example",
  "private": null,
  "profile": {
    "displayName": null,
    "avatarUrl": null,
    "verified": null,
    "followers": null,
    "following": null,
    "likes": null,
    "videos": null,
    "bio": null
  },
  "videos": null
}
```

`videos:null` تعني بيانات الفيديوهات غير متاحة، و`videos:[]` تعني أن المزود أعاد عينة فارغة. عنصر الفيديو: `id` رقمي كنص، `title`, `thumbnailUrl`, `publishedAt` بصيغة ISO أو null، و`views`, `likes`, `comments`, `shares` أعداد غير سالبة أو null. الحد 30 فيديو. لا تحول الحقول غير المتاحة إلى صفر. `private:true` تنتج رفضاً واضحاً. HTTP 403 من المورد يعني رفض وصول فقط؛ لا يثبت خصوصية الحساب. لا يوجد scraping أو CAPTCHA bypass في مسار الإنتاج الجديد.

الرابط الكامل للحساب أو للفيديو مقبول، ويدعم `@`. الروابط المختصرة لا تحتوي اليوزر ويطلب النظام الرابط الكامل بدلاً من اتباع تحويلات غير موثوقة.

## الحسابات الاختيارية

المصادقة الحالية تستعمل Supabase Auth الرسمي وPKCE، وهوية المستخدم تتحقق في الخادم بطلب `/auth/v1/user`، وليس بفك JWT محلياً أو الثقة بدور مرسل من المتصفح.

1. أنشئ مشروع Supabase للموقع أو اختر مشروعاً مخصصاً له. لم نعدل مشاريع البوتات الموجودة بحسابك.
2. فعّل Google عبر Google Cloud OAuth client في إعدادات Supabase Authentication. أضف callback الذي يعرضه Supabase في Google.
3. اضبط Site URL وRedirect URLs للعنوان الفعلي مع `/tk-sabr/`، وللتطوير `http://localhost:3000/`.
4. فعّل البريد وتأكيده وSMTP المناسب وحدود الإرسال. الإعداد وحده لا يثبت تسليم الرسائل.
5. ضع URL والمفتاح **العام فقط** في `VITE_SUPABASE_URL` و`VITE_SUPABASE_PUBLISHABLE_KEY` وأيضاً نظيريهما على Worker. لا حاجة إلى service-role key.
6. ضع UUID المدير في `ADMIN_USER_IDS` على الخادم. لا تستخدم user_metadata للدور.

التقارير محفوظة في D1، مع شرط `user_id` في كل استعلام، فلا يحتاج المتصفح وصولاً مباشراً إلى قاعدة التقارير. تسجيل Google والبريد يحتاج اختباراً حياً بعد إعداد OAuth؛ لا يوجد تسجيل دخول وهمي.

## التقرير والمؤشرات

- معدل التفاعل للعينة = (الإعجابات + التعليقات + المشاركات) / المشاهدات × 100، للفيديوهات ذات الحقول المكتملة فقط. لا نشتقه من إجمالي إعجابات الحساب.
- الدرجة اسمها «نسبة أمان الحساب»، لكنها تقييم عام لوجود الاسم والصورة والوصف والمنشورات. لا تعرض رقماً إلا عند توفر ثلاثة عوامل معلومة على الأقل؛ لا تقيس أمان تسجيل الدخول.
- لا اكتشاف للاختراق/Shadowban/العقوبات/كلمة المرور. لا رسوم تاريخية مختلقة.
- AI اختياري: `GEMINI_API_KEY` على الخادم و`GEMINI_MODEL`. نرسل إشارات مشتقة فقط، لا الاسم والوصف كتعليمات. حقائق التقرير برمجية؛ AI يقدم توصيات مرتبطة بالملاحظات فقط. فشله يعيد قواعد موضحة النوع.
- PDF عبر نافذة طباعة المتصفح: اختر «حفظ بصيغة PDF». لا تنزيل صامت مضمون على كل هاتف.
- المقارنة تستعمل عمليتي رصد محفوظتين لنفس اليوزر بأوقات مختلفة فقط.

## REST API

كل خطأ: `{ "status":"error", "code":"...", "message":"..." }`.

| المسار | الوظيفة |
| --- | --- |
| GET /api/health | حالة الخدمة والإعداد فقط، دون اتصال مدفوع بالمورد |
| GET /api/status | صيانة/فحص وخدمات مهيأة |
| POST /api/tiktok/analyze | `{username}`؛ بيانات المصدر والتحليل و`id` |
| POST /api/reports/generate | `{scanId}` لفحص محفوظ على الخادم وغير منتهٍ؛ لا يقبل حقائق من العميل |
| GET /api/me | هوية ودور متحققان عبر Bearer token |
| GET /api/history | تقارير المستخدم الحالي فقط |
| POST /api/history | `{scanId}` لحفظ نتيجة حقيقية مخزنة |
| DELETE /api/history/:id | حذف تقرير مملوك للمستخدم |
| GET /api/admin | إحصاءات أحداث آخر 7 أيام، مستخدمون حفظوا تقارير، الإعداد والسجلات |
| PUT /api/admin/settings | `{maintenance, scanning, per_minute, notice}`؛ مدير فقط |

400 مدخل غير صالح، 401 جلسة غير صالحة، 403 منع/خاص صريح، 404 غير موجود حسب المورد، 410 فحص منتهٍ، 415 نوع محتوى، 429 حد الاستخدام، 502 مزود فاشل/استجابة غير صالحة، 503 إعداد ناقص/صيانة، 504 مهلة. صلاحية نتيجة الفحص المؤقتة خمس دقائق؛ افحص مجدداً إذا انتهت قبل توليد التقرير.

## النشر: GitHub Pages + Cloudflare

لا يمكن لـGitHub Pages تنفيذ Backend. لا تغير خصوصية المستودع دون قرار منك؛ Pages مجاني للمستودعات العامة، أما الخاص فيحتاج خطة GitHub تدعمه.

1. `npm ci` ثم `npx wrangler login` لحساب Cloudflare الذي تملكه.
2. أنشئ قاعدة: `npx wrangler d1 create tk-sabr`، واستبدل UUID التجريبي في `wrangler.toml` بمعرفك الحقيقي.
3. `npx wrangler d1 execute tk-sabr --remote --file=database/schema.sql`.
4. أضف الأسرار بالأمر `npx wrangler secret put NAME` واحداً لكل من `RATE_LIMIT_SALT` (قيمة عشوائية قوية)، مفاتيح المورد، إعدادات Supabase، وGemini إن رغبت. لا ترفعها إلى GitHub أو المتصفح.
5. اضبط `ALLOWED_ORIGIN` على أصل الواجهة بدون المسار، مثال `https://almajhool-dev.github.io`. طبّق بقية الإعدادات غير السرية قبل النشر.
6. `npm run deploy:api`. احصل على عنوان Worker الفعلي واختبر `/api/health` ثم `/api/status`.
7. في GitHub Repository Variables ضع `VITE_API_BASE_URL` بعنوان Worker، وحقلي Supabase العامين. فعل Pages بمصدر GitHub Actions.
8. Workflow `Test and publish TK_SABR` يبني ويختبر وينشر الواجهة، ويضبط base path للمستودع تلقائياً. لا يكفي نجاح build لإثبات النشر.
9. النشر اليدوي الآلي للخادم عبر `Deploy Cloudflare API` يتطلب Variables: `CLOUDFLARE_ACCOUNT_ID`, `D1_DATABASE_ID` وSecret `CLOUDFLARE_API_TOKEN` بأقل صلاحيات Workers/D1. أسرار التطبيق تظل في Worker.
10. تحقق من فتح عنوان Pages، اتصال API، OAuth، فحص حساب مسموح، والحفظ بين مستخدمين مختلفين.

تراجع عن إصدار بنشر commit سابق. المخطط إضافي؛ لا تحذف قاعدة الإنتاج للتراجع عن الواجهة.

## الأمان والتكلفة

تحقق Zod، CORS لأصل واحد، Bearer دون cookies تلقائية، صلاحية مدير على الخادم، SQL parametrized، حدود مشتركة عبر D1، مهلات وحد أقصى لحجم الأجسام، إعادة محاولة واحدة لأخطاء مزود 5xx فقط، ولا تعرض المفاتيح أو السجلات الخام. لا تسجل IP أو bio؛ حد الاستخدام يخزن hash مملحاً مؤقتاً. رؤوس الأمان على API. GitHub Pages يدير رؤوسه؛ لا ندعي التحكم الكامل بها.

Cron يحذف cache المنتهي، التقارير بعد 30 يوماً والأحداث بعد 7 أيام. قبل الإطلاق عدّل الاحتفاظ بما يسمح به عقد المورد، وأعلن سياسة الخصوصية الملائمة، واختبر الحذف على الإنتاج.

خطط الخدمات المجانية محدودة وقد تتغير. المورد وAI قد يتطلبان اشتراكاً منفصلاً. المراقبة المتقدمة وWAF ونسخ D1 الاحتياطية وضبط مصادقة الإنتاج تحتاج مراجعة إعدادات الحساب الفعلية.

مصادر رسمية: [TikTok Display API](https://developers.tiktok.com/doc/display-api-get-started/)، [Supabase getUser](https://supabase.com/docs/reference/javascript/auth-getuser)، [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)، [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).
