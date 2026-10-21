import {z} from 'zod';
import {normalizeUsername,type PublicProfile} from '../../shared/analysis.ts';
import {ApiError,boundedJson} from './provider.ts';
const metadata=z.object({author_name:z.string().min(1).max(200),author_url:z.string().url(),provider_name:z.literal('TikTok'),type:z.literal('rich')});
export async function fetchOfficialEmbed(username:string,fetcher:typeof fetch=fetch):Promise<PublicProfile>{
 let response:Response;
 try{response=await fetcher('https://www.tiktok.com/oembed?url='+encodeURIComponent('https://www.tiktok.com/@'+username),{redirect:'error',signal:AbortSignal.timeout(9000),headers:{Accept:'application/json'}});}
 catch(e){throw new ApiError(e instanceof Error&&['TimeoutError','AbortError'].includes(e.name)?504:502,'TIKTOK_UNAVAILABLE','تعذر الوصول إلى واجهة TikTok الرسمية حالياً.');}
 if(response.status===429)throw new ApiError(429,'TIKTOK_RATE_LIMIT','TikTok يحد الطلبات حالياً. حاول لاحقاً.');
 if(!response.ok)throw new ApiError(response.status===404?404:502,'EMBED_UNAVAILABLE','TikTok لم يُتح عرض هذا الحساب. قد يكون خاصاً أو غير موجود أو غير متاح للعرض العام؛ لا نستنتج السبب دون دليل.');
 const parsed=metadata.safeParse(await boundedJson(response,65536));
 if(!parsed.success)throw new ApiError(502,'TIKTOK_RESPONSE','بيانات العرض الرسمية غير متاحة بالصيغة المتوقعة.');
 let returned='';try{returned=normalizeUsername(parsed.data.author_url);}catch{}
 if(returned!==username)throw new ApiError(502,'TIKTOK_MISMATCH','المصدر أعاد حساباً مختلفاً.');
 return {displayName:parsed.data.author_name,avatarUrl:null,verified:null,followers:null,following:null,likes:null,videos:null,bio:null};
}
