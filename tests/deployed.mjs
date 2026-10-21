import assert from 'node:assert/strict';
const base='https://ysnqfihpayxqfiuwgfwe.supabase.co/functions/v1/tksabr-api';
async function call(path,options={}){return fetch(base+path,{...options,signal:AbortSignal.timeout(20000)});}
let status;for(let i=0;i<8;i++){try{const r=await call('/api/status');const d=await r.json();if(r.ok&&d.databaseConfigured){status=d;break;}console.log('Waiting for API readiness:',r.status,d.code||d.status);}catch(e){console.log('Waiting for API readiness:',e.name);}await new Promise(r=>setTimeout(r,2000));}
assert.ok(status?.databaseConfigured,'Published API/database must be reachable');
assert.equal(status.emailConfigured,true,'Email authentication must be enabled');
assert.equal((await call('/api/admin')).status,401);
assert.equal((await call('/api/history')).status,401);
assert.equal((await call('/api/tiktok/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'https://evil.example/@test'})})).status,400);
assert.equal((await call('/api/status',{headers:{Origin:'https://evil.example'}})).status,403);
const cors=await call('/api/status',{method:'OPTIONS',headers:{Origin:'https://almajhool-dev.github.io','Access-Control-Request-Method':'POST'}});
assert.equal(cors.status,204);assert.equal(cors.headers.get('Access-Control-Allow-Origin'),'https://almajhool-dev.github.io');
const settings=await fetch('https://ysnqfihpayxqfiuwgfwe.supabase.co/auth/v1/settings',{headers:{apikey:process.env.TEST_PUBLISHABLE_KEY||''}});
if(process.env.TEST_PUBLISHABLE_KEY)assert.equal(settings.status,200);
console.log('PASS: deployed API, database readiness, email provider setting, CORS, input validation, anonymous access restrictions.');
const scan=await call('/api/tiktok/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'scout2015'})});
const result=await scan.json();
if(scan.ok){assert.equal(result.username,'scout2015');assert.equal(result.dataSource,'TikTok oEmbed — معلومات عرض محدودة');assert.equal(result.profile.followers,null);console.log('PASS: live TikTok official metadata request.');}
else console.log('LIVE TIKTOK UNAVAILABLE:',scan.status,result.code,'— no profile or statistics invented.');
