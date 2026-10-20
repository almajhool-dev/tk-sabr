// Rule-based account report, with optional Gemini model when a server-side API key is configured.
// No fake engagement data and no recommendation framed as a guaranteed outcome.
const approved = new Set(['https://headless-tjuyduljtmh-qikrsikr-1408.wix-site-host.com']);
const hits = new Map<string,number[]>();
function response(payload:unknown,status=200,origin=''){const h=new Headers({'content-type':'application/json; charset=utf-8','cache-control':'no-store','vary':'Origin'});if(approved.has(origin))h.set('access-control-allow-origin',origin);return new Response(JSON.stringify(payload),{status,headers:h});}
function validProfile(data:any){return data && /^[A-Za-z0-9_.]{2,24}$/.test(data.username||'') && ['followersCount','likesCount','videoCount','followingCount'].every(k=>Number.isSafeInteger(data[k]) && data[k]>=0 && data[k]<1e12);}
const nfmt=(n:number)=>new Intl.NumberFormat('ar-IQ').format(n);
function describe(p:any) {
 const followers=p.followersCount,likes=p.likesCount,videos=p.videoCount,avg=videos?Math.round(likes/videos):0;
 const strengths:string[]=[];const weaknesses:string[]=[];
 if(p.bio?.length>10)strengths.push('الوصف التعريفي واضح ويدعم اكتشاف اختصاص الحساب');else weaknesses.push('أضف وصفاً تعريفياً يوضح اختصاص المحتوى');
 if(videos>=10)strengths.push(`يتضمن الحساب ${nfmt(videos)} منشوراً`);else weaknesses.push(`المنشورات الظاهرة قليلة (${nfmt(videos)})؛ راجع انتظام النشر`);
 if(p.verified)strengths.push('الحساب يحمل علامة التوثيق الظاهرة من المصدر');
 if(followers>0)strengths.push(`عدد المتابعين المتاح: ${nfmt(followers)}`);
 if(!strengths.length)strengths.push('يمكن البدء بتحسين الملف والمحتوى بناءً على البيانات المتاحة');
 const ideas=['سلسلة فيديوهات قصيرة تجاوب عن الأسئلة المتكررة بمجالك','فيديو يشرح مشكلة شائعة وحلها بخطوات واضحة','مقارنة قبل وبعد لتجربة حقيقية من محتواك','تجربة موضوعين مختلفين وقياس الأداء في تحليلات TikTok الرسمية','إعادة تقديم أفضل موضوع سابق بطريقة أوضح'];
 const plan=[
 {week:1,focus:'تهيئة الملف الشخصي وتحضير المحتوى',milestones:['تحسين الصورة والوصف','اختيار 3 محاور للمحتوى'],actions:['راجع وصف الحساب','حضّر مسودات لثلاثة مقاطع']},
 {week:2,focus:'اختبار أساليب تقديم المحتوى',milestones:['نشر تجارب بمقدمات مختلفة','متابعة زمن المشاهدة'],actions:['جرّب بداية قصيرة وواضحة','دوّن نتائج تحليلات الحساب الرسمية']},
 {week:3,focus:'تحسين المحتوى بناءً على الأداء',milestones:['مقارنة المشاهدات والتفاعل','تحسين الوصف والعناوين'],actions:['أعد إنتاج فكرة نجحت سابقاً','اسأل جمهورك عن مواضيع يريدها']},
 {week:4,focus:'مراجعة النتائج والتخطيط للشهر القادم',milestones:['مراجعة التغير في الإحصائيات','اختيار خطة نشر واقعية'],actions:['قارن الأداء من داخل TikTok Studio','ركّز على الأفكار التي أثبتت نجاحاً فعلياً']}
 ];
 return {summary:`تقرير آلي لحساب @${p.username} اعتماداً على البيانات العامة المتاحة: ${nfmt(followers)} متابع، ${nfmt(likes)} إعجاب إجمالي، ${nfmt(videos)} منشور. لا يمكن من هذه الأرقام وحدها إثبات اختراق أو حظر الحساب.`,
  strengths,weaknesses,engagementAnalysis:videos>0?`متوسط الإعجابات الإجمالي لكل منشور تقريبي: ${nfmt(avg)}، وهو ليس معدل تفاعل رسمي لأننا لا نعرف زمن النشر أو المشاهدات الدقيقة.`:'لا يمكن حساب متوسط إعجابات المنشورات إذا لم تتوفر منشورات.',
  contentStrategyIdeas:ideas,
  optimalPostingTimes:[{day:'الأسبوع الأول',timeWindow:'اختبار',reason:'جرّب توقيتين مختلفين وسجّل النتائج؛ لا تتوفر بيانات الجمهور الفعلية لتحديد الأفضل'},{day:'الأسبوع الثاني',timeWindow:'اختبار',reason:'قارن أداء نفس نوع المحتوى بين فترتين باستخدام TikTok Studio'}],
  thirtyDayPlan:plan,toneAndNiche:'يُحدَّد اختصاص الحساب من وصفه ومحتواه المتاح، ولا يمكن الجزم به من الأرقام فقط.',growthVerdict:'فرص التحسن تعتمد على جودة المحتوى والتجربة الفعلية؛ لا توجد ضمانات للانتشار.',aiDisclaimer:'هذا التقرير ناتج عن قواعد تحليل إحصائية، وليس استشارة رسمية من TikTok أو تقييماً أمنياً للاختراق. لا توجد بيانات داخلية أو توقعات مؤكدة.'};
}
function answerFor(q:string,p:any){const x=q.toLowerCase();if(/حظر|اختراق|أمان|مخالفة|shadow/i.test(x))return 'ما أگدر أتأكد من الاختراق أو الحظر الخفي عن طريق يوزر الحساب. افحص تنبيهات الحساب والأجهزة المتصلة وإعدادات الأمان داخل TikTok.';if(/وقت|توقيت|أنشر|نشر/i.test(x))return 'أفضل وقت نشر ما ينحسب من أعداد المتابعين وحدها. جرّب توقيتين على مدى أسبوعين وقارن المشاهدة والتفاعل داخل TikTok Studio.';if(/تفاعل|إعجاب|مشاهدة/i.test(x))return `حساب @${p.username} عنده ${nfmt(p.followersCount)} متابع و${nfmt(p.likesCount)} إعجاب إجمالي. نحتاج مشاهدات وعدد إعجابات كل فيديو حتى نحسب تفاعله بشكل أدق.`;return 'ابدأ بتحسين الوصف، وجرّب أفكاراً قابلة للقياس مع مقدمات مختصرة، وراجع أداء كل مقطع من تحليلات TikTok الرسمية. هذا رد آلي مبني على المؤشرات العامة.';}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')||'';
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:{'access-control-allow-origin':approved.has(origin)?origin:'null','access-control-allow-methods':'POST,OPTIONS','access-control-allow-headers':'content-type','vary':'Origin','access-control-max-age':'3600'}});
 if(req.method!=='POST')return response({success:false,message:'POST only'},405,origin);
 if(origin&&!approved.has(origin))return response({success:false,message:'غير مسموح لهذا المصدر'},403,origin);
 if(Number(req.headers.get('content-length')||'0')>16000)return response({success:false,message:'بيانات كبيرة جداً'},413,origin);
 const ip=req.headers.get('x-forwarded-for')?.split(',')[0]||'unknown',now=Date.now();const recent=(hits.get(ip)||[]).filter(t=>now-t<60000);if(recent.length>=12)return response({success:false,message:'انتظر دقيقة قبل طلب تقرير جديد'},429,origin);recent.push(now);hits.set(ip,recent);
 let data:any;try{data=await req.json()}catch{return response({success:false,message:'تنسيق الطلب غير صحيح'},400,origin)}
 const p=data.profile||data.profileContext;
 if(!p)return response({success:false,message:'لا توجد بيانات حساب'},400,origin);
 const prof={username:p.username,followersCount:Number(p.followersCount ?? p.followers),likesCount:Number(p.likesCount ?? p.likes),followingCount:Number(p.followingCount ?? 0),videoCount:Number(p.videoCount ?? p.videos),bio:p.bio,verified:p.verified};
 if(!validProfile(prof))return response({success:false,message:'يجب فحص حساب حقيقي أولاً'},400,origin);
 if(data.action==='chat'||typeof data.question==='string')return response({success:true,answer:answerFor(String(data.question||'').slice(0,500),prof),analysisEngine:'rules'},200,origin);
 const report=describe(prof);
 return response({success:true,report,analysisEngine:'rules'},200,origin);
});
