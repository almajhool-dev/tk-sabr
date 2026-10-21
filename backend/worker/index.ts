import {z} from 'zod';
import {analyze,normalizeUsername,type Scan} from '../../shared/analysis.ts';
import {ApiError,fetchProfile,providerConfigured,boundedJson,type ProviderEnv} from './provider.ts';
import {createReport} from './report.ts';
import {cleanExpired,type Database} from './db.ts';
export interface Env extends ProviderEnv {
  DB:Database; ALLOWED_ORIGIN:string; SUPABASE_URL?:string; SUPABASE_PUBLISHABLE_KEY?:string;
  ADMIN_USER_IDS?:string; GEMINI_API_KEY?:string; GEMINI_MODEL?:string; RATE_LIMIT_SALT:string;
}
interface Settings {maintenance:number;scanning:number;per_minute:number;notice:string}
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
export function createApi(fetcher:typeof fetch=fetch) {
  async function identity(req:Request,env:Env) {
    const token=req.headers.get('Authorization');
    if(!token?.startsWith('Bearer '))throw new ApiError(401,'UNAUTHENTICATED','سجّل دخولك أولاً.');
    if(!env.SUPABASE_URL||!env.SUPABASE_PUBLISHABLE_KEY)throw new ApiError(503,'AUTH_NOT_CONFIGURED','تسجيل الدخول غير مهيأ.');
    let response:Response;
    try{response=await fetcher(`${env.SUPABASE_URL}/auth/v1/user`,{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:token},signal:AbortSignal.timeout(5000),redirect:'error'});}catch{throw new ApiError(503,'AUTH_UNAVAILABLE','خدمة الدخول غير متاحة.');}
    if(!response.ok)throw new ApiError(401,'UNAUTHENTICATED','جلسة الدخول غير صالحة.');
    const user=z.object({id:z.string().uuid()}).safeParse(await boundedJson(response,32768));
    if(!user.success)throw new ApiError(401,'UNAUTHENTICATED','جلسة الدخول غير صالحة.');
    return {id:user.data.id,admin:(env.ADMIN_USER_IDS||'').split(',').map(s=>s.trim()).includes(user.data.id)};
  }
  async function body(req:Request) {
    if(!req.headers.get('content-type')?.startsWith('application/json'))throw new ApiError(415,'CONTENT_TYPE','أرسل JSON صالحاً.');
    try{return await boundedJson(new Response(req.body,{headers:req.headers}),8192);}catch{throw new ApiError(400,'INVALID_JSON','بيانات الطلب غير صالحة أو كبيرة جداً.');}
  }
  async function limit(req:Request,env:Env,path:string,max:number) {
    if(!env.RATE_LIMIT_SALT)throw new ApiError(503,'SECURITY_NOT_CONFIGURED','الخادم يحتاج إعداد الأمان.');
    const ip=req.headers.get('CF-Connecting-IP')||'local';
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${env.RATE_LIMIT_SALT}:${ip}`));
    const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
    const now=Date.now(),minute=Math.floor(now/60000);
    const row=await env.DB.prepare('INSERT INTO rate_limits(key,count,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(`${hash}:${path}:${minute}`,(minute+1)*60000).first<{count:number}>();
    if(!row||row.count>max)throw new ApiError(429,'RATE_LIMIT','طلبات كثيرة؛ حاول بعد دقيقة.');
  }
  async function route(req:Request,env:Env) {
    const url=new URL(req.url),path=url.pathname;
    if(path==='/api/health'&&req.method==='GET')return json({status:'ok',providerConfigured:providerConfigured(env),authConfigured:!!(env.SUPABASE_URL&&env.SUPABASE_PUBLISHABLE_KEY),aiConfigured:!!env.GEMINI_API_KEY});
    if(!env.DB)throw new ApiError(503,'DATABASE_NOT_CONFIGURED','قاعدة البيانات غير مهيأة.');
    if(path==='/api/status'&&req.method==='GET'){
      const settings=await env.DB.prepare('SELECT * FROM settings WHERE id=1').first<Settings>();
      return json({providerConfigured:providerConfigured(env),authConfigured:!!(env.SUPABASE_URL&&env.SUPABASE_PUBLISHABLE_KEY),aiConfigured:!!env.GEMINI_API_KEY,maintenance:!!settings?.maintenance,scanning:!!settings?.scanning,notice:settings?.notice||''});
    }
    if(path==='/api/me'&&req.method==='GET')return json(await identity(req,env));
    if(path.startsWith('/api/admin')){
      const user=await identity(req,env); if(!user.admin)throw new ApiError(403,'FORBIDDEN','الوصول للإدارة غير مسموح.');
      await limit(req,env,'admin',30);
      if(path==='/api/admin'&&req.method==='GET'){
        const settings=await env.DB.prepare('SELECT * FROM settings WHERE id=1').first();
        const events=(await env.DB.prepare('SELECT code,COUNT(*) AS count FROM events GROUP BY code').all()).results;
        const users=await env.DB.prepare('SELECT COUNT(*) AS count FROM users').first();
        const recent=(await env.DB.prepare('SELECT code,created_at FROM events ORDER BY id DESC LIMIT 20').all()).results;
        return json({settings,events,users,recent,services:{providerConfigured:providerConfigured(env),aiConfigured:!!env.GEMINI_API_KEY},retentionDays:7});
      }
      if(path==='/api/admin/settings'&&req.method==='PUT'){
        const value=z.object({maintenance:z.boolean(),scanning:z.boolean(),per_minute:z.number().int().min(1).max(60),notice:z.string().max(300)}).strict().safeParse(await body(req));
        if(!value.success)throw new ApiError(400,'INVALID_SETTINGS','الإعدادات غير صالحة.');
        const s=value.data;
        await env.DB.prepare('UPDATE settings SET maintenance=?,scanning=?,per_minute=?,notice=? WHERE id=1').bind(+s.maintenance,+s.scanning,s.per_minute,s.notice).run();
        return json({status:'success'});
      }
    }
    if(path==='/api/tiktok/analyze'&&req.method==='POST'){
      const parsed=z.object({username:z.string().min(2).max(500)}).strict().safeParse(await body(req));
      if(!parsed.success)throw new ApiError(400,'INVALID_USERNAME','أدخل يوزر أو رابط حساب TikTok صحيح.');
      let username:string;try{username=normalizeUsername(parsed.data.username);}catch{throw new ApiError(400,'INVALID_USERNAME','يوزر غير صالح. الروابط المختصرة تحتاج رابط الحساب الكامل.');}
      const settings=await env.DB.prepare('SELECT * FROM settings WHERE id=1').first<Settings>();
      if(!settings||settings.maintenance||!settings.scanning)throw new ApiError(503,'MAINTENANCE',settings?.notice||'الفحص متوقف مؤقتاً للصيانة.');
      await limit(req,env,'scan',settings.per_minute);
      const cached=await env.DB.prepare('SELECT payload FROM scans WHERE username=? AND expires_at>? ORDER BY expires_at DESC LIMIT 1').bind(username,Date.now()).first<{payload:string}>();
      if(cached)return json(JSON.parse(cached.payload));
      const {profile,videos}=await fetchProfile(username,env,fetcher);
      const scan:Scan={id:crypto.randomUUID(),status:'success',username,profile,videos,analysis:analyze(profile,videos),dataSource:env.DATA_PROVIDER_NAME!,fetchedAt:new Date().toISOString()};
      await env.DB.prepare('INSERT INTO scans(id,username,payload,expires_at) VALUES(?,?,?,?)').bind(scan.id,username,JSON.stringify(scan),Date.now()+300000).run();
      await env.DB.prepare('INSERT INTO events(code,created_at) VALUES(?,?)').bind('SCAN_SUCCESS',Date.now()).run();
      return json(scan);
    }
    if(path==='/api/reports/generate'&&req.method==='POST'){
      await limit(req,env,'report',3);
      const value=z.object({scanId:z.string().uuid()}).strict().safeParse(await body(req));
      if(!value.success)throw new ApiError(400,'INVALID_SCAN','معرف الفحص غير صالح.');
      const scan=await env.DB.prepare('SELECT payload FROM scans WHERE id=? AND expires_at>?').bind(value.data.scanId,Date.now()).first<{payload:string}>();
      if(!scan)throw new ApiError(410,'SCAN_EXPIRED','انتهت صلاحية الفحص؛ افحص الحساب مرة ثانية.');
      return json(await createReport(JSON.parse(scan.payload),env,fetcher));
    }
    if(path==='/api/history'||path.startsWith('/api/history/')){
      const user=await identity(req,env);await limit(req,env,'history',20);
      if(path==='/api/history'&&req.method==='GET')return json((await env.DB.prepare('SELECT id,payload,created_at FROM reports WHERE user_id=? ORDER BY created_at DESC LIMIT 50').bind(user.id).all()).results.map((r:any)=>({...r,payload:JSON.parse(r.payload)})));
      if(path==='/api/history'&&req.method==='POST'){
        const value=z.object({scanId:z.string().uuid()}).strict().safeParse(await body(req));
        if(!value.success)throw new ApiError(400,'INVALID_SCAN','معرف الفحص غير صالح.');
        const scan=await env.DB.prepare('SELECT payload FROM scans WHERE id=? AND expires_at>?').bind(value.data.scanId,Date.now()).first<{payload:string}>();
        if(!scan)throw new ApiError(410,'SCAN_EXPIRED','انتهت صلاحية الفحص.');
        const id=crypto.randomUUID();
        await env.DB.batch([env.DB.prepare('INSERT OR IGNORE INTO users(id,created_at) VALUES(?,?)').bind(user.id,Date.now()),env.DB.prepare('INSERT INTO reports(id,user_id,scan_id,payload,created_at) VALUES(?,?,?,?,?)').bind(id,user.id,value.data.scanId,scan.payload,Date.now())]);
        return json({id},201);
      }
      if(req.method==='DELETE'){
        const id=path.split('/')[3];if(!z.string().uuid().safeParse(id).success)throw new ApiError(400,'INVALID_ID','معرف غير صالح.');
        await env.DB.prepare('DELETE FROM reports WHERE id=? AND user_id=?').bind(id,user.id).run();return json({status:'success'});
      }
    }
    throw new ApiError(404,'NOT_FOUND','المسار غير موجود.');
  }
  return async function handle(req:Request,env:Env):Promise<Response>{
    let response:Response;
    const origin=req.headers.get('Origin');
    if(origin&&origin!==env.ALLOWED_ORIGIN)response=json({code:'ORIGIN_DENIED',message:'مصدر الطلب غير مسموح.'},403);
    else if(req.method==='OPTIONS')response=new Response(null,{status:204});
    else try{response=await route(req,env);}catch(e){
      const err=e instanceof ApiError?e:new ApiError(500,'INTERNAL_ERROR','خطأ داخلي؛ حاول لاحقاً.');
      response=json({status:'error',code:err.code,message:err.message},err.status);
      if(env.DB && new URL(req.url).pathname==='/api/tiktok/analyze')try{await env.DB.prepare('INSERT INTO events(code,created_at) VALUES(?,?)').bind(err.code,Date.now()).run();}catch{}
    }
    const headers=new Headers(response.headers);
    headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','no-referrer');headers.set('X-Frame-Options','DENY');
    headers.set('Strict-Transport-Security','max-age=31536000; includeSubDomains');
    headers.set('Content-Security-Policy',"default-src 'none'; frame-ancestors 'none'");
    headers.set('Vary','Origin');
    if(origin===env.ALLOWED_ORIGIN){headers.set('Access-Control-Allow-Origin',origin);headers.set('Access-Control-Allow-Headers','Content-Type,Authorization');headers.set('Access-Control-Allow-Methods','GET,POST,PUT,DELETE,OPTIONS');}
    if(response.status===429)headers.set('Retry-After','60');
    return new Response(response.body,{status:response.status,headers});
  };
}
export default {fetch:createApi(),async scheduled(_event:unknown,env:Env){await cleanExpired(env.DB);}};
