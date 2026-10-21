import { z } from 'zod';
import {normalizeUsername, type PublicProfile, type PublicVideo} from '../../shared/analysis.ts';
export class ApiError extends Error {
  status:number; code:string;
  constructor(status:number, code:string, message:string) { super(message); this.status=status; this.code=code; }
}
const count=z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).nullable();
const text=z.string().max(4000).nullable();
const image=z.string().url().max(4096).refine(s=>new URL(s).protocol==='https:').nullable();
export const providerSchema=z.object({
  username:z.string(), private:z.boolean().nullable(),
  profile:z.object({displayName:text,avatarUrl:image,verified:z.boolean().nullable(),followers:count,following:count,likes:count,videos:count,bio:text}).strict(),
  videos:z.array(z.object({id:z.string().regex(/^\d{1,40}$/),title:text,thumbnailUrl:image,publishedAt:z.string().datetime({offset:true}).nullable(),views:count,likes:count,comments:count,shares:count}).strict()).max(30).nullable(),
}).strict();
export interface ProviderEnv { DATA_PROVIDER_URL?:string; DATA_PROVIDER_KEY?:string; DATA_PROVIDER_NAME?:string; DATA_PROVIDER_APPROVED?:string }
export async function boundedJson(response:Response, max=524288):Promise<unknown> {
  if (Number(response.headers.get('content-length'))>max) throw new ApiError(502,'PROVIDER_RESPONSE','استجابة المزود أكبر من الحد المسموح.');
  if (!response.body) throw new ApiError(502,'PROVIDER_RESPONSE','استجابة المزود فارغة.');
  const reader=response.body.getReader(); const chunks:Uint8Array[]=[]; let size=0;
  try { while(true) { const {value,done}=await reader.read(); if(done)break; size+=value.length; if(size>max) {await reader.cancel();throw new ApiError(502,'PROVIDER_RESPONSE','استجابة المزود أكبر من الحد المسموح.');} chunks.push(value); } }
  finally {reader.releaseLock();}
  const bytes=new Uint8Array(size); let offset=0; for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new ApiError(502,'PROVIDER_RESPONSE','استجابة المزود غير صالحة.');}
}
export function providerConfigured(env:ProviderEnv) {
  if(!env.DATA_PROVIDER_URL || !env.DATA_PROVIDER_KEY || !env.DATA_PROVIDER_NAME || env.DATA_PROVIDER_APPROVED!=='true')return false;
  try {const u=new URL(env.DATA_PROVIDER_URL);return u.protocol==='https:' && !u.username && !u.password;}catch{return false;}
}
export async function fetchProfile(username:string,env:ProviderEnv,fetcher:typeof fetch=fetch):Promise<{profile:PublicProfile;videos:PublicVideo[]|null}> {
  if(!providerConfigured(env)) throw new ApiError(503,'PROVIDER_NOT_CONFIGURED','فحص اليوزر غير مفعّل: لم يتم ربط مزود بيانات مصرح به بعد.');
  for(let attempt=0;attempt<2;attempt++) {
    let res:Response;
    try {res=await fetcher(env.DATA_PROVIDER_URL!,{method:'POST',redirect:'error',signal:AbortSignal.timeout(9000),headers:{'Content-Type':'application/json',Authorization:`Bearer ${env.DATA_PROVIDER_KEY}`},body:JSON.stringify({username})});}
    catch(e){if(e instanceof Error && ['TimeoutError','AbortError'].includes(e.name))throw new ApiError(504,'PROVIDER_TIMEOUT','انتهت مهلة مزود البيانات. حاول لاحقاً.');throw new ApiError(502,'PROVIDER_UNAVAILABLE','تعذر الاتصال بمزود البيانات.');}
    if(res.status===404)throw new ApiError(404,'ACCOUNT_NOT_FOUND','الحساب غير موجود حسب مزود البيانات.');
    if(res.status===403)throw new ApiError(403,'ACCESS_DENIED','المصدر رفض الوصول؛ لا يمكن استنتاج أن الحساب خاص.');
    if(res.status===429)throw new ApiError(429,'PROVIDER_RATE_LIMIT','تم تجاوز حدود مزود البيانات. حاول لاحقاً.');
    if(res.status>=500 && attempt===0){await res.body?.cancel();continue;}
    if(!res.ok)throw new ApiError(502,'PROVIDER_UNAVAILABLE','فشل مزود البيانات في إكمال الطلب.');
    const parsed=providerSchema.safeParse(await boundedJson(res));
    if(!parsed.success)throw new ApiError(502,'PROVIDER_RESPONSE','بيانات المزود لا تطابق العقد المطلوب.');
    const data=parsed.data;
    let returned='';try{returned=normalizeUsername(data.username);}catch{}
    if(returned!==username)throw new ApiError(502,'PROVIDER_MISMATCH','المصدر أعاد بيانات حساب مختلف.');
    if(data.private===true)throw new ApiError(403,'PRIVATE_ACCOUNT','الحساب خاص حسب مزود البيانات؛ لا يتم فحص محتواه.');
    return {profile:data.profile,videos:data.videos};
  }
  throw new ApiError(502,'PROVIDER_UNAVAILABLE','مزود البيانات غير متاح.');
}
