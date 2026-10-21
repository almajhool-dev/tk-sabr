import {supabase} from './firebaseAuth.ts';
const published=(globalThis as any).__TK_SABR_CONFIG__||{};
const base=(published.apiBaseUrl||import.meta.env.VITE_API_BASE_URL||'').replace(/\/$/,'');
export async function request<T>(path:string,options:RequestInit={}):Promise<T>{
  if(!base && import.meta.env.PROD)throw new Error('الخادم غير مربوط بعد. يجب إعداد عنوان API قبل النشر.');
  const session=await supabase?.auth.getSession();
  const token=session?.data.session?.access_token;
  let response:Response;
  try {response=await fetch(base+path,{...options,signal:options.signal||AbortSignal.timeout(24000),headers:{'Content-Type':'application/json',...(published.supabaseKey?{apikey:published.supabaseKey}:{}),...(token?{Authorization:'Bearer '+token}:{}),...options.headers}});}
  catch(e){throw new Error(!navigator.onLine?'انقطع الإنترنت؛ تحقق من اتصالك وأعد المحاولة.':e instanceof Error&&['TimeoutError','AbortError'].includes(e.name)?'انتهت مهلة الطلب؛ حاول مرة ثانية.':'تعذر الاتصال بالخادم.');}
  let data:any;try{data=await response.json();}catch{throw new Error('استجابة الخادم غير صالحة. تحقق من رابط API.');}
  if(!response.ok)throw new Error(data.message||'فشل الطلب');return data as T;
}
