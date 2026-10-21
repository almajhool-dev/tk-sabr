const {chromium,devices}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH,args:['--no-sandbox','--disable-dev-shm-usage']}: {})});
 const errors=[];let scans=0;let offlineTest=false;
 const page=await browser.newPage({viewport:{width:1365,height:1000},reducedMotion:'reduce'});
 page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.TEST_BASE_URL||'http://localhost:3000';
 await page.goto(base);await page.locator('h1').waitFor();
 assert.equal(await page.locator('h1').count(),1);
 await page.screenshot({path:'/tmp/tksabr-desktop.png',fullPage:true});
 await page.locator('#username').fill('https://evil.example/tiktok.com/@test');
 await page.locator('button[type=submit]').click();await page.getByRole('alert').waitFor();
 await page.locator('#username').fill('@example');await page.locator('button[type=submit]').click();await page.getByRole('alert').filter({hasText:'مزود'}).waitFor();
 await page.getByRole('button',{name:'تسجيل الدخول',exact:true}).click();
 await page.getByText('خدمة الحسابات').first().waitFor({timeout:3000}).catch(()=>{});
 await page.keyboard.press('Escape');
 // A separate context intercepts API responses solely as UI fixtures; never production data.
 const context=await browser.newContext({...devices['Pixel 5'],reducedMotion:'reduce'});
 const mobile=await context.newPage();mobile.on('pageerror',e=>errors.push(e.message));
 const scan={id:'00000000-0000-4000-8000-000000000004',username:'example',status:'success',profile:{displayName:'Test fixture',avatarUrl:null,verified:null,followers:1234,following:null,likes:90,videos:0,bio:''},videos:[],dataSource:'Automated UI fixture only',fetchedAt:new Date().toISOString(),analysis:{engagementRate:null,sampleSize:0,averagePostingGapDays:null,estimatedAccountScore:33,factors:[{name:'الاسم',earned:25,possible:25},{name:'الوصف',earned:0,possible:25},{name:'المنشورات',earned:0,possible:25}],issues:[{id:'empty',kind:'fact',title:'لا توجد منشورات عامة',explanation:'المصدر أعاد صفراً.',recommendation:'جرّب نشر محتوى عاماً.'}],recommendations:['جرّب نشر محتوى عاماً.'],disclaimer:'تقييم تقديري للمؤشرات العامة فقط.'}};
 await mobile.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/api/status')return route.fulfill({json:{providerConfigured:true,authConfigured:false,aiConfigured:false,maintenance:false,scanning:true,notice:''}});
  if(path==='/api/tiktok/analyze'){if(offlineTest)return route.abort('internetdisconnected');scans++;await new Promise(r=>setTimeout(r,100));return route.fulfill({json:scan});}
  if(path==='/api/reports/generate')return route.fulfill({json:{type:'rules',summary:'تقرير اختبار',recommendations:['اختبر محتوى جديداً.'],limitations:['تقييم عام فقط.']}});
  return route.continue();
 });
 await mobile.goto(base);await mobile.locator('#username').fill('@example');await mobile.locator('button[type=submit]').click();
 await mobile.locator('#results').waitFor();assert.equal(scans,1);
 assert.ok(await mobile.getByText('البيانات غير متاحة',{exact:true}).count()>0);
 await mobile.getByRole('button',{name:'توليد التقرير الذكي',exact:true}).click();await mobile.getByText('RULES-BASED REPORT',{exact:true}).waitFor();
 assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await mobile.screenshot({path:'/tmp/tksabr-mobile.png',fullPage:true});
 await mobile.pdf({path:'/tmp/tksabr-test-report.pdf',format:'A4',printBackground:true});
 assert.ok(fs.statSync('/tmp/tksabr-test-report.pdf').size>1000);
 await mobile.getByRole('button',{name:'فحص حساب آخر',exact:true}).click();assert.equal(await mobile.locator('#results').count(),0);
 offlineTest=true;await context.setOffline(true);await mobile.locator('#username').fill('@example');await mobile.locator('button[type=submit]').click();await mobile.getByRole('alert').filter({hasText:'الإنترنت'}).waitFor();await context.setOffline(false);
 await mobile.getByRole('button',{name:'Change language'}).click();assert.equal(await mobile.locator('html').getAttribute('dir'),'ltr');
 await mobile.setViewportSize({width:320,height:740});assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await context.close();await browser.close();assert.deepEqual(errors,[]);console.log('PASS: desktop, Android viewport, small screens, parsing errors, provider failure, results, duplicate prevention, report, PDF, English/RTL and runtime errors.');
})().catch(e=>{console.error(e);process.exit(1)});
