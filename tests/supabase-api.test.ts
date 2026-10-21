import test from 'node:test';import assert from 'node:assert/strict';import {createSupabaseHandler} from '../backend/supabase/tksabr-api/api.ts';
const user='00000000-0000-4000-8000-000000000001';
const env={url:'https://auth.example',anonKey:'public-fixture',salt:'test-fixture',origin:'https://site.example'};
function setup(){
 const queries:any[]=[];
 const db:any={auth:{getUser:async(t:string)=>t==='valid'?{data:{user:{id:user}},error:null}:{data:{user:null},error:{message:'invalid'}}},rpc:async()=>({data:true,error:null}),from:(name:string)=>{
 const q:any={name,filters:[],action:'read',select(){return q},eq(k:string,v:any){q.filters.push([k,v]);return q},gt(){return q},order(){return q},limit(){return q},insert(){q.action='insert';return q},delete(){q.action='delete';return q},single(){return q},maybeSingle(){return q},then(resolve:any){queries.push(q);let data:any=[];if(name==='tksabr_settings')data={maintenance:false,scanning:true,per_minute:10,notice:''};if(name==='tksabr_admins')data=null;resolve({data,error:null});}};return q;
 }};
 const handle=createSupabaseHandler(db,env,async()=>Response.json({external:{email:true,google:false}}));
 const call=(path:string,method='GET',body?:unknown,token?:string,origin=env.origin)=>handle(new Request('https://api.example/tksabr-api'+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})}));
 return {call,queries};
}
test('public status accurately distinguishes email and Google configuration',async()=>{const s=setup(),r=await s.call('/api/status'),d=await r.json();assert.equal(d.databaseConfigured,true);assert.equal(d.googleConfigured,false);assert.equal(d.emailConfigured,true);assert.equal(d.providerMode,'official_embed_limited');});
test('user cannot access admin API and anonymous cannot read reports',async()=>{const s=setup();assert.equal((await s.call('/api/admin')).status,401);assert.equal((await s.call('/api/admin','GET',undefined,'valid')).status,403);assert.equal((await s.call('/api/history')).status,401);});
test('history queries always bind verified user ID',async()=>{const s=setup();assert.equal((await s.call('/api/history','GET',undefined,'valid')).status,200);const q=s.queries.find(q=>q.name==='tksabr_reports');assert.ok(q.filters.some(([k,v]:any[])=>k==='user_id'&&v===user));});
test('hostile origins and client supplied report facts are rejected',async()=>{const s=setup();assert.equal((await s.call('/api/status','GET',undefined,undefined,'https://evil.example')).status,403);assert.equal((await s.call('/api/reports/generate','POST',{scanId:user,profile:{followers:9999}})).status,400);});
test('reject invalid and non TikTok username URLs before provider access',async()=>{const s=setup();assert.equal((await s.call('/api/tiktok/analyze','POST',{username:'https://evil.example/@example'})).status,400);});
