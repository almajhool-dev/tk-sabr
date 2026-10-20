// TK_SABR public-account scanner: only public information, no bypass or synthetic data.
const origins = new Set([
  'https://headless-tjuyduljtmh-qikrsikr-1408.wix-site-host.com',
  'http://localhost:8000', 'http://127.0.0.1:8000'
]);
const reqTimes = new Map<string, number[]>();
const cache = new Map<string, { expires: number; value: unknown }>();
const disclaimer = 'مؤشر تقديري لصحة الحساب ومؤشراته العامة؛ لا يعني الحماية من الاختراق أو اكتشاف مخالفات أو حظر داخلي في TikTok.';
function json(data: unknown, status = 200, origin = '') {
  const headers = new Headers({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'vary': 'Origin', 'x-content-type-options':'nosniff' });
  if (origins.has(origin)) headers.set('access-control-allow-origin', origin);
  return new Response(JSON.stringify(data), {status, headers});
}
function cleanName(v: unknown): string {
  if (typeof v !== 'string') return '';
  const s = v.trim();
  const match = s.match(/(?:https?:\/\/)?(?:www\.|m\.)?tiktok\.com\/@([a-zA-Z0-9_.]+)/i);
  return (match?.[1] || s.replace(/^@/, '').split(/[/?#]/)[0]).trim();
}
function parseNumber(x: unknown): number | null {
  if (x === null || x === undefined || x === '' || !Number.isFinite(Number(x)) || Number(x) < 0) return null;
  return Math.floor(Number(x));
}
function scoreOf(p: Record<string, any>) {
  const factors: any[] = [];
  const add=(id:string,name:string,score:number,maxScore:number,note:string)=> factors.push({id,name,score,maxScore,status: score>=maxScore*.8?'good':score>=maxScore*.5?'average':'poor',note});
  const complete=(p.avatar?10:0)+(p.bio?.trim()?.length>3 ? (p.bio.length>20?10:8) : 0)+(p.displayName?5:0);
  add('profile_completeness','اكتمال الملف الشخصي',complete,25,'صورة الحساب والاسم والوصف التعريفي');
  const followers=p.followersCount, likes=p.likesCount;
  let eng= followers>0?(likes/followers>=2 && likes/followers<=200 ?20: likes/followers>.5?12:4)+(p.engagementRate>=3?10:p.engagementRate>=1?6:2):8;
  add('engagement_ratio','نسبة الإعجابات إلى المتابعين',eng,30,'تقريب يعتمد على إجمالي الإعجابات، وليس تفاعلاً مؤكداً لكل مقطع');
  const videos=p.videoCount;
  const activity=videos>=30?20:videos>=10?15:videos>=3?10:videos>=1?5:2;
  add('content_activity','عدد المنشورات المتاحة',activity,20,'لا يمكن استنتاج انتظام مواعيد النشر من العدد وحده');
  const auth=p.verified?15:followers>50000?12:followers>5000?9:followers>500?6:3;
  add('authority_signal','مؤشر التوثيق والانتشار',auth,15,'عدم التوثيق لا يعني أن الحساب مخترق');
  const ratio=followers>0?(p.followingCount/followers<=1?10:p.followingCount/followers<=3?6:3):5;
  add('ratio_balance','التوازن بين المتابعين والمتابَعين',ratio,10,'ليس دليلاً على مخالفة أو استخدام متابعة آلية');
  const score=Math.max(0,Math.min(100,factors.reduce((n,x)=>n+x.score,0)));
  const level=score>=90?'excellent':score>=70?'moderate':score>=40?'warning':'critical';
  const color=score>=90?'#10b981':score>=70?'#eab308':score>=40?'#f97316':'#ef4444';
  return {score,level,color,grade:score>=90?'A+':score>=70?'B':score>=40?'C':'D-',title:score>=70?'مؤشرات عامة جيدة':score>=40?'هناك فرص لتحسين الحساب':'مؤشرات الحساب تحتاج تحسيناً',factors,confidencePercentage:75,disclaimer};
}
function problemsOf(p:Record<string,any>) {
 const out:any[]=[];
 const add=(id:string,title:string,severity:'warning'|'critical'|'info',category:string,reason:string,solution:string)=>out.push({id,title,severity,category,reason,solution,recommendation:solution});
 if(!p.bio||p.bio.trim().length<5) add('missing_bio','الوصف التعريفي غير مكتمل','warning','profile','الحساب لا يملك وصفاً واضحاً','اكتب وصفاً يشرح اختصاص المحتوى');
 if(p.videoCount<5) add('low_activity','عدد المنشورات قليل','warning','content',`المنشورات المتاحة: ${p.videoCount}`,'جرّب النشر باستمرار لتحسين حضور الحساب');
 if(p.followersCount>100 && p.followingCount>p.followersCount*1.5) add('following_ratio','نسبة المتابَعين مرتفعة','info','engagement','عدد المتابَعين يفوق المتابعين بشكل ملحوظ','راجع استراتيجية متابعة الحسابات المناسبة لمحتواك');
 if(p.followersCount>1000&&p.engagementRate<2) add('likes_ratio','التفاعل التقريبي منخفض','info','engagement','اعتماداً على متوسط الإعجابات للفيديو مقارنة بالمتابعين','حسّن جودة المحتوى وراجع الإحصاءات الرسمية داخل TikTok');
 if(out.length===0) add('keep_improving','لا توجد مشكلات واضحة من المؤشرات المتاحة','info','content','المؤشرات العامة المتاحة لا تكشف جميع مشاكل الحساب','استمر بتحليل أداء المقاطع من لوحة تحليلات TikTok الرسمية');
 return out;
}
async function getPublicProfile(name:string) {
 const tiktok=`https://www.tiktok.com/@${encodeURIComponent(name)}`;
 const response=await fetch(tiktok,{headers:{'accept':'text/html','accept-language':'en-US,en;q=.8','user-agent':'Mozilla/5.0 (compatible; TKSABRPublicAudit/1.0)'},signal:AbortSignal.timeout(10500)});
 if(response.status===404) return {status:404,message:'الحساب غير موجود أو تم تغيير اسم المستخدم'};
 if(!response.ok) return {status:502,message:'تيك توك رفض جلب البيانات العامة من خادم الفحص؛ حاول لاحقاً أو فعّل مصدر بيانات مرخصاً'};
 const raw=await response.text();
 if(raw.length>2_500_000) return {status:502,message:'استجابة TikTok كبيرة بشكل غير اعتيادي'};
 const rehydrate=raw.match(/<script[^>]+id=["']__UNIVERSAL_DATA_FOR_REHYDRATION__["'][^>]*>([\s\S]*?)<\/script>/i);
 const sigi=raw.match(/<script[^>]+id=["']SIGI_STATE["'][^>]*>([\s\S]*?)<\/script>/i);
 let u:any,s:any;
 if(rehydrate) {
  try {const obj=JSON.parse(rehydrate[1]); const info=obj?.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo;u=info?.user;s=info?.stats;}catch { /* no reliable stats */ }
 }
 if((!u||!s)&&sigi){
  try {const obj=JSON.parse(sigi[1]);u=obj.UserModule?.users?.[name];s=obj.UserModule?.stats?.[name];}catch { /* no reliable stats */ }
 }
 if(!u||!s) return {status:502,message:'لا توجد إحصائيات موثوقة ظاهرة للحساب؛ تيك توك قد يحجب الوصول التلقائي للبيانات'};
 if(u.uniqueId && u.uniqueId.toLowerCase()!==name.toLowerCase()) return {status:502,message:'البيانات المرجعة لا تطابق اليوزر المطلوب'};
 const f=parseNumber(s.followerCount),following=parseNumber(s.followingCount),likes=parseNumber(s.heartCount),videos=parseNumber(s.videoCount);
 if([f,following,likes,videos].some(x=>x===null)) return {status:502,message:'تعذر التحقق من صحة إحصائيات المتابعين والمنشورات؛ لن يتم احتساب درجة وهمية'};
 const followers=f!,likesCount=likes!,videoCount=videos!;
 const engagementRate=followers>0&&videoCount>0?Math.min(100,Math.round((likesCount/videoCount/followers)*1000)/10):0;
 const p={username:name,displayName:String(u.nickname||name),avatar:String(u.avatarLarger||u.avatarMedium||''),bio:String(u.signature||''),verified:!!u.verified,privateAccount:!!u.privateAccount,followersCount:followers,followingCount:following!,likesCount,videoCount,id:u.id?String(u.id):undefined,secUid:u.secUid?String(u.secUid):undefined,originalUrl:tiktok,engagementRate,avgLikesPerVideo:videoCount>0?Math.round(likesCount/videoCount):0,dataReliability:'verified_public',scannedAt:new Date().toISOString()};
 return {status:200,profile:p,securityScore:scoreOf(p),problems:problemsOf(p)};
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')||'';
 if(req.method==='OPTIONS') return new Response(null,{status:204,headers:{'access-control-allow-origin':origins.has(origin)?origin:'null','access-control-allow-methods':'POST, OPTIONS','access-control-allow-headers':'content-type','access-control-max-age':'3600','vary':'Origin'}});
 if(req.method!=='POST') return json({success:false,message:'POST only'},405,origin);
 if(origin && !origins.has(origin)) return json({success:false,message:'غير مسموح لهذا المصدر'},403,origin);
 const len=Number(req.headers.get('content-length')||0);
 if(len>2048) return json({success:false,message:'الطلب أكبر من المسموح'},413,origin);
 const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
 const now=Date.now();const recent=(reqTimes.get(ip)||[]).filter(t=>now-t<60000);
 if(recent.length>=6) return json({success:false,message:'وصلت الحد المؤقت للفحوصات؛ حاول بعد دقيقة'},429,origin);
 recent.push(now);reqTimes.set(ip,recent);
 let parsed:any;
 try{parsed=await req.json();}catch{return json({success:false,message:'بيانات الطلب غير صالحة'},400,origin)}
 const username=cleanName(parsed?.username);
 if(!/^[a-zA-Z0-9_][a-zA-Z0-9_.]{0,22}[a-zA-Z0-9_]$/.test(username)) return json({success:false,message:'اسم المستخدم غير صالح'},400,origin);
 const cached=cache.get(username.toLowerCase());
 if(cached&&cached.expires>now)return json(cached.value,200,origin);
 try {
  const result=await getPublicProfile(username);
  const output=result.status===200?{success:true,profile:result.profile,securityScore:result.securityScore,problems:result.problems}:{success:false,message:result.message};
  if(result.status===200)cache.set(username.toLowerCase(),{expires:now+180000,value:output});
  return json(output,result.status,origin);
 } catch (err) {console.error('TikTok public request failed',err instanceof Error?err.message:'unknown');return json({success:false,message:'تعذر الوصول إلى بيانات TikTok الآن؛ حاول مرة أخرى لاحقاً'},502,origin)}
});