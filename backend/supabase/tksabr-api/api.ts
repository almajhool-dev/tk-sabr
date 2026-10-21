import {z} from 'zod';
import {analyze,normalizeUsername,type Scan} from '../../../shared/analysis.ts';
import {ApiError,boundedJson,fetchProfile,providerConfigured,type ProviderEnv} from '../../worker/provider.ts';
import {fetchOfficialEmbed} from '../../worker/embed.ts';
import {createReport} from '../../worker/report.ts';
export interface ServiceEnv extends ProviderEnv {url:string;anonKey:string;salt:string;origin:string;GEMINI_API_KEY?:string;GEMINI_MODEL?:string}
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
const scanInput=z.object({username:z.string().min(2).max(500)}).strict();
const reportInput=z.object({scanId:z.string().uuid(),language:z.enum(['ar','en']).optional()}).strict();
const idInput=z.object({scanId:z.string().uuid()}).strict();
function checked<T>(r:{data:T;error:any}):T {if(r.error)throw new ApiError(503,'DATABASE_UNAVAILABLE','تعذر الوصول إلى قاعدة البيانات.');return r.data;}
export function createSupabaseHandler(db:any,env:ServiceEnv,fetcher:typeof fetch=fetch){
 let lastCleanup=0;
 let authCache:{expires:number;google:boolean;email:boolean}|null=null;
 async function authSettings(){
  if(authCache&&authCache.expires>Date.now())return authCache;
  try{const r=await fetcher(env.url+'/auth/v1/settings',{headers:{apikey:env.anonKey},signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error();const d=await boundedJson(r,32768) as any;authCache={expires:Date.now()+60000,google:d.external?.google===true,email:d.external?.email===true};return authCache;}catch{return {google:false,email:false};}
 }
 async function identity(req:Request){
  const value=req.headers.get('Authorization');if(!value?.startsWith('Bearer '))throw new ApiError(401,'UNAUTHENTICATED','سجل دخولك أولاً.');
  const {data,error}=await db.auth.getUser(value.slice(7));
  if(error||!data?.user?.id)throw new ApiError(401,'UNAUTHENTICATED','جلسة الدخول غير صالحة.');
  const role=checked(await db.from('tksabr_admins').select('uid').eq('uid',data.user.id).maybeSingle());
  return {id:data.user.id,admin:!!role};
 }
 async function body(req:Request){
  if(!req.headers.get('content-type')?.startsWith('application/json'))throw new ApiError(415,'CONTENT_TYPE','أرسل JSON صالحاً.');
  try{return await boundedJson(new Response(req.body,{headers:req.headers}),8192);}catch{throw new ApiError(400,'INVALID_JSON','بيانات الطلب غير صالحة أو كبيرة جداً.');}
 }
 async function limit(req:Request,path:string,max:number){
  const raw=(req.headers.get('x-forwarded-for')||'unknown').split(',').at(-1)!.trim();
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(env.salt+':'+raw));
  const hash=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
  const ok=checked(await db.rpc('tksabr_rate_limit',{p_key:hash+':'+path,p_limit:max,p_window:60}));
  if(!ok)throw new ApiError(429,'RATE_LIMIT','طلبات كثيرة؛ حاول بعد دقيقة.');
 }
 async function getScan(id:string):Promise<Scan>{
  const row=checked<any>(await db.from('tksabr_scans').select('payload').eq('id',id).gt('expires_at',new Date().toISOString()).maybeSingle());
  if(!row)throw new ApiError(410,'SCAN_EXPIRED','انتهت صلاحية الفحص. افحص الحساب مجدداً.');return row.payload;
 }
 async function route(req:Request,path:string){
  if((path==='/api/status'||path==='/api/health')&&req.method==='GET'){
   const result=await db.from('tksabr_settings').select('*').eq('id',1).maybeSingle();
   const auth=await authSettings();
   const ready=!result.error&&!!result.data;
   return json({status:ready?'ok':'degraded',databaseConfigured:ready,providerConfigured:true,providerMode:providerConfigured(env)?'authorized_provider':'official_embed_limited',authConfigured:auth.email||auth.google,googleConfigured:auth.google,emailConfigured:auth.email,aiConfigured:!!env.GEMINI_API_KEY,maintenance:!!result.data?.maintenance,scanning:ready&&!!result.data?.scanning,notice:result.data?.notice||(!ready?'قاعدة البيانات قيد الإعداد.':'')});
  }
  if(path==='/api/me'&&req.method==='GET')return json(await identity(req));
  if(path.startsWith('/api/admin')){
   const user=await identity(req);if(!user.admin)throw new ApiError(403,'FORBIDDEN','غير مسموح بالوصول إلى الإدارة.');await limit(req,'admin',30);
   if(path==='/api/admin'&&req.method==='GET'){
    const settings=checked(await db.from('tksabr_settings').select('maintenance,scanning,per_minute,notice').eq('id',1).single());
    const events=checked<any[]>(await db.from('tksabr_events').select('code,created_at').order('created_at',{ascending:false}).limit(500));
    const counts=new Map<string,number>();for(const e of events)counts.set(e.code,(counts.get(e.code)||0)+1);
    const users=await db.auth.admin.listUsers({page:1,perPage:1});
    return json({settings,events:Array.from(counts,([code,count])=>({code,count})),users:{count:users.data?.total??null},recent:events.slice(0,20).map(e=>({...e,created_at:Date.parse(e.created_at)})),services:{providerConfigured:true,aiConfigured:!!env.GEMINI_API_KEY},retentionDays:7,eventSampleLimit:500});
   }
   if(path==='/api/admin/settings'&&req.method==='PUT'){
    const value=z.object({maintenance:z.boolean(),scanning:z.boolean(),per_minute:z.number().int().min(1).max(60),notice:z.string().max(300)}).strict().safeParse(await body(req));if(!value.success)throw new ApiError(400,'INVALID_SETTINGS','إعدادات غير صالحة.');
    checked(await db.from('tksabr_settings').update(value.data).eq('id',1));return json({status:'success'});
   }
  }
  if(path==='/api/tiktok/analyze'&&req.method==='POST'){
   const parsed=scanInput.safeParse(await body(req));if(!parsed.success)throw new ApiError(400,'INVALID_USERNAME','أدخل يوزر أو رابط حساب صحيح.');
   let username:string;try{username=normalizeUsername(parsed.data.username);}catch{throw new ApiError(400,'INVALID_USERNAME','صيغة اليوزر أو رابط TikTok غير صالحة.');}
   const settings=checked<any>(await db.from('tksabr_settings').select('*').eq('id',1).single());
   if(settings.maintenance||!settings.scanning)throw new ApiError(503,'MAINTENANCE',settings.notice||'الفحص متوقف مؤقتاً.');
   await limit(req,'scan',settings.per_minute);await limit(req,'scan_global',120);
   const row=checked<any[]>(await db.from('tksabr_scans').select('payload').eq('username',username).gt('expires_at',new Date().toISOString()).order('expires_at',{ascending:false}).limit(1));
   if(row[0])return json(row[0].payload);
   const full=providerConfigured(env);
   const observed=full?await fetchProfile(username,env,fetcher):{profile:await fetchOfficialEmbed(username,fetcher),videos:null};
   const scan:Scan={status:'success',id:crypto.randomUUID(),username,profile:observed.profile,videos:observed.videos,analysis:analyze(observed.profile,observed.videos),dataSource:full?env.DATA_PROVIDER_NAME!:'TikTok oEmbed — معلومات عرض محدودة',fetchedAt:new Date().toISOString()};
   checked(await db.from('tksabr_scans').insert({id:scan.id,username,payload:scan,expires_at:new Date(Date.now()+300000).toISOString()}));
   await db.from('tksabr_events').insert({code:'SCAN_SUCCESS'});return json(scan);
  }
  if(path==='/api/reports/generate'&&req.method==='POST'){
   await limit(req,'report',3);const value=reportInput.safeParse(await body(req));if(!value.success)throw new ApiError(400,'INVALID_SCAN','معرف فحص غير صالح.');
   return json(await createReport(await getScan(value.data.scanId),env,fetcher,value.data.language));
  }
  if(path==='/api/history'||path.startsWith('/api/history/')){
   const user=await identity(req);await limit(req,'history',20);
   if(path==='/api/history'&&req.method==='GET'){
    const rows=checked<any[]>(await db.from('tksabr_reports').select('id,payload,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(50));
    return json(rows.map(r=>({...r,created_at:Date.parse(r.created_at)})));
   }
   if(path==='/api/history'&&req.method==='POST'){
    const value=idInput.safeParse(await body(req));if(!value.success)throw new ApiError(400,'INVALID_SCAN','معرف فحص غير صالح.');
    const scan=await getScan(value.data.scanId);
    const saved=checked(await db.from('tksabr_reports').insert({user_id:user.id,scan_id:scan.id,payload:scan}).select('id').single());
    return json(saved,201);
   }
   if(req.method==='DELETE'&&path.startsWith('/api/history/')){
    const id=path.split('/')[3];if(!z.string().uuid().safeParse(id).success)throw new ApiError(400,'INVALID_ID','معرف غير صالح.');
    checked(await db.from('tksabr_reports').delete().eq('id',id).eq('user_id',user.id));return json({status:'success'});
   }
  }
  throw new ApiError(404,'NOT_FOUND','المسار غير موجود.');
 }
 return async function handle(req:Request){
  const pathname=new URL(req.url).pathname;const pos=pathname.indexOf('/api/');const path=pos>=0?pathname.slice(pos):'/api/health';
  let response:Response;const origin=req.headers.get('Origin');
  if(origin&&origin!==env.origin)response=json({code:'ORIGIN_DENIED',message:'مصدر الطلب غير مسموح.'},403);
  else if(req.method==='OPTIONS')response=new Response(null,{status:204});
  else try{if(Date.now()-lastCleanup>3600000){lastCleanup=Date.now();await db.rpc('tksabr_cleanup');}response=await route(req,path);}catch(e){
   const err=e instanceof ApiError?e:new ApiError(500,'INTERNAL_ERROR','تعذر إكمال الطلب حالياً.');
   response=json({status:'error',code:err.code,message:err.message},err.status);
   if(path==='/api/tiktok/analyze')try{await db.from('tksabr_events').insert({code:err.code});}catch{}
  }
  const headers=new Headers(response.headers);headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','no-referrer');headers.set('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'");headers.set('Vary','Origin');
  if(origin===env.origin){headers.set('Access-Control-Allow-Origin',origin);headers.set('Access-Control-Allow-Headers','authorization,apikey,content-type,x-client-info');headers.set('Access-Control-Allow-Methods','GET,POST,PUT,DELETE,OPTIONS');}
  if(response.status===429)headers.set('Retry-After','60');
  return new Response(response.body,{status:response.status,headers});
 };
}
