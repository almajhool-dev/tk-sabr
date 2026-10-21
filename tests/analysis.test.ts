import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeUsername, analyze, type PublicProfile} from '../shared/analysis.ts';
const empty: PublicProfile = {displayName:null,avatarUrl:null,verified:null,followers:null,following:null,likes:null,videos:null,bio:null};
test('accept username, @, profile and video URLs', () => {
  for (const input of ['Example','@Example','https://www.tiktok.com/@Example?lang=ar','tiktok.com/@Example/video/123']) assert.equal(normalizeUsername(input),'example');
});
test('reject spoofed hosts, malformed input, unsupported short links', () => {
  for (const input of ['https://evil.com/tiktok.com/@user','https://tiktok.com.evil.com/@user','https://www.tiktok.com@evil.com/@user','@bad-user','@@user','user.','https://vm.tiktok.com/xyz','<script>','a']) assert.throws(()=>normalizeUsername(input));
});
test('missing information never becomes zero or numeric score', () => {
  const result = analyze(empty,null);
  assert.equal(result.estimatedAccountScore,null); assert.equal(result.engagementRate,null);
  assert.ok(result.issues.some(i=>i.id==='insufficient')); assert.ok(!result.issues.some(i=>i.id==='empty'));
});
test('confirmed zero videos and empty bio are facts', () => {
  const result=analyze({...empty,bio:'',videos:0,displayName:'Creator'},[]);
  assert.ok(result.issues.some(i=>i.id==='empty' && i.kind==='fact'));
  assert.equal(result.estimatedAccountScore,33);
});
test('engagement uses complete video samples, never invented shares or aggregate likes',()=>{
  const video={id:'1',title:null,thumbnailUrl:null,publishedAt:null,views:100,likes:5,comments:2,shares:1};
  assert.equal(analyze(empty,[video]).engagementRate,8);
  assert.equal(analyze(empty,[{...video,shares:null}]).engagementRate,null);
  assert.equal(analyze({...empty,likes:999999,followers:100},null).engagementRate,null);
});
