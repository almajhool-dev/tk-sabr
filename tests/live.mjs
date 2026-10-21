// Explicit, authorized live integration only. No fixture can satisfy this check.
import assert from 'node:assert/strict';
const base=process.env.LIVE_API_BASE_URL,username=process.env.LIVE_TIKTOK_USERNAME;
if(!base||!username){console.log('SKIP: LIVE_API_BASE_URL and authorized LIVE_TIKTOK_USERNAME are required.');process.exit(0);}
const response=await fetch(base.replace(/\/$/,'')+'/api/tiktok/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username}),signal:AbortSignal.timeout(25000)});
assert.equal(response.status,200);const data=await response.json();assert.equal(data.status,'success');assert.ok(data.dataSource);assert.ok(Date.parse(data.fetchedAt));assert.ok(data.username);assert.ok(data.profile);console.log('PASS: live authorized provider returned a schema-valid profile.');
