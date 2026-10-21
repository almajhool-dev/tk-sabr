import React,{lazy,Suspense,useEffect,useRef,useState} from 'react';
import {Shield,ArrowUpLeft,ScanLine,Globe,LogOut,History,Activity,Lock,FileCheck,ChevronLeft,Menu,Minus,Plus} from 'lucide-react';
import {motion,MotionConfig} from 'motion/react';
import {CyberBackground} from './components/CyberBackground.tsx';
import {watchAuth,logout,firebaseConfigured} from './utils/firebaseAuth.ts';
import {request} from './utils/api.ts';
import {normalizeUsername,type Scan} from '../shared/analysis.ts';
import type {UserAccount} from './types/index.ts';
const Results=lazy(()=>import('./components/Results.tsx'));
const AccountPanel=lazy(()=>import('./components/AccountPanel.tsx'));
const AuthModal=lazy(()=>import('./components/AuthModal.tsx').then(m=>({default:m.AuthModal})));
interface Status {providerConfigured:boolean;authConfigured:boolean;aiConfigured:boolean;maintenance:boolean;scanning:boolean;notice:string}
export default function App(){
  const[en,setEn]=useState(false),[reduced,setReduced]=useState(()=>localStorage.getItem('tk-motion')==='off'||matchMedia('(prefers-reduced-motion: reduce)').matches);
  const[user,setUser]=useState<UserAccount|null>(null),[admin,setAdmin]=useState(false),[authOpen,setAuthOpen]=useState(false),[page,setPage]=useState<'scan'|'history'|'admin'>('scan');
  const[status,setStatus]=useState<Status|null>(null),[input,setInput]=useState(''),[busy,setBusy]=useState(false),[phase,setPhase]=useState(''),[error,setError]=useState(''),[scan,setScan]=useState<Scan|null>(null),[showHelp,setShowHelp]=useState(false);
  const[boot,setBoot]=useState(()=>!sessionStorage.getItem('tk-intro'));
  const lock=useRef(false),alive=useRef(true),abort=useRef<AbortController|null>(null);
  const t=(ar:string,english:string)=>en?english:ar;
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;abort.current?.abort();};},[]);
  useEffect(()=>watchAuth(setUser),[]);
  useEffect(()=>{document.documentElement.lang=en?'en':'ar';document.documentElement.dir=en?'ltr':'rtl';},[en]);
  useEffect(()=>{document.documentElement.dataset.motion=reduced?'off':'on';localStorage.setItem('tk-motion',reduced?'off':'on');},[reduced]);
  useEffect(()=>{const timer=setTimeout(()=>{setBoot(false);sessionStorage.setItem('tk-intro','1');},reduced?0:950);return()=>clearTimeout(timer);},[]);
  useEffect(()=>{void request<Status>('/api/status').then(setStatus).catch(()=>setStatus(null));},[]);
  useEffect(()=>{setAdmin(false);if(user)void request<{admin:boolean}>('/api/me').then(v=>setAdmin(v.admin)).catch(()=>{});},[user?.id]);
  async function submit(e:React.FormEvent){
    e.preventDefault();if(lock.current)return;
    try{normalizeUsername(input);}catch{setError(t('أدخل يوزر صحيحاً أو رابط حساب TikTok كاملاً. الروابط المختصرة غير مدعومة.','Enter a valid username or full TikTok profile URL. Short links are unsupported.'));return;}
    lock.current=true;setBusy(true);setError('');setScan(null);setPhase(t('تم التحقق من اليوزر • بانتظار بيانات المصدر','Username validated • Waiting for the provider'));
    abort.current=new AbortController();const timer=setTimeout(()=>abort.current?.abort(),24000);
    try{const result=await request<Scan>('/api/tiktok/analyze',{method:'POST',body:JSON.stringify({username:input}),signal:abort.current.signal});if(alive.current){setPhase(t('اكتمل التحليل','Analysis complete'));setScan(result);}}
    catch(e){if(alive.current)setError(e instanceof Error?e.message:t('فشل الفحص','Scan failed'));}
    finally{clearTimeout(timer);lock.current=false;if(alive.current)setBusy(false);}
  }
  const unavailable=status?.maintenance||status?.scanning===false;
  return <MotionConfig reducedMotion={reduced?'always':'user'}><div className="app-shell" dir={en?'ltr':'rtl'}>
    <CyberBackground reduced={reduced}/>
    {boot&&!reduced&&<div className="intro" aria-hidden="true"><Shield size={55}/><b>TK_SABR</b><span>PUBLIC SIGNALS. CLEAR INSIGHTS.</span></div>}
    <header className="site-header"><div className="header-inner"><a className="brand" href="#" onClick={()=>setPage('scan')} aria-label="TK_SABR home"><span className="brand-icon"><Shield size={23}/></span><b>TK<span>_</span>SABR</b><small>ACCOUNT INTELLIGENCE</small></a>
    <nav aria-label={t('القائمة الرئيسية','Main navigation')}><button className={page==='scan'?'active':''} onClick={()=>setPage('scan')}>{t('محلل الحسابات','Analyzer')}</button>{user&&<button className={page==='history'?'active':''} onClick={()=>setPage('history')}>{t('تقاريري','My reports')}</button>}{admin&&<button onClick={()=>setPage('admin')}>{t('الإدارة','Admin')}</button>}</nav>
    <div className="header-actions"><button className="icon-button" onClick={()=>setEn(!en)} aria-label="Change language"><Globe size={16}/>{en?'عربي':'EN'}</button><button className="icon-button motion-toggle" aria-pressed={reduced} onClick={()=>setReduced(!reduced)}>{t(reduced?'الحركة متوقفة':'تقليل الحركة',reduced?'Motion off':'Reduce motion')}</button>{user?<button className="quiet-button" onClick={()=>{void logout().catch(()=>setError(t('تعذر تسجيل الخروج','Sign-out failed')));setPage('scan');}} aria-label={t('تسجيل الخروج','Sign out')}><LogOut size={16}/></button>:<button className="login-button" onClick={()=>setAuthOpen(true)}>{t('تسجيل الدخول','Sign in')}<ArrowUpLeft size={15}/></button>}</div></div></header>
    <main id="main-content">
    {page==='scan'?<>
      <section className="hero"><motion.div initial={reduced?false:{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{duration:.45}}>
      <div className="eyebrow"><span className="signal-dot"/>{t('اقرأ البيانات. افهم حسابك.','READ THE SIGNALS. UNDERSTAND YOUR ACCOUNT.')}</div>
      <h1>{t('كل حساب يحچي قصة.','Every account tells a story.')}<br/><span>{t('اكتشف قصّة حسابك.','Discover yours.')}</span></h1>
      <p className="hero-copy">{t('حوّل بيانات حساب TikTok العامة إلى رؤى واضحة وتوصيات عملية. تحليل مبني على الأدلة، من دون تخمين الأرقام.','Turn public TikTok data into clear insights and practical recommendations. Evidence-led analysis, without invented numbers.')}</p>
      </motion.div>
      <section className="scan-card" aria-labelledby="scan-title"><div className="scan-heading"><span className="small-icon"><ScanLine size={22}/></span><div><h2 id="scan-title">{t('محلل حسابات TikTok الذكي','Smart TikTok account analyzer')}</h2><p>{t('ابدأ باسم المستخدم أو رابط الحساب','Start with a username or profile URL')}</p></div><span className="public-pill">PUBLIC DATA</span></div>
      <form onSubmit={submit}><label className="sr-only" htmlFor="username">{t('أدخل يوزر حساب تيك توك','TikTok username')}</label><div className="scan-input-row"><span className="at" aria-hidden="true">@</span><input id="username" dir="ltr" autoComplete="off" spellCheck={false} maxLength={500} value={input} onChange={e=>setInput(e.target.value)} placeholder={t('أدخل يوزر حساب تيك توك','Enter a TikTok username')} disabled={busy} aria-describedby="input-hint scan-error"/><button className="primary-button" disabled={busy||!!unavailable} type="submit">{busy?<span className="spinner"/>:<ScanLine size={18}/>}<span>{busy?t('جاري الفحص…','Analyzing…'):t('ابدأ فحص الحساب','Analyze account')}</span><ArrowUpLeft size={17}/></button></div><p id="input-hint" className="input-hint"><Lock size={12}/>{t('بدون كلمة مرور TikTok • الحسابات العامة فقط','No TikTok password • Public accounts only')}<span>username / @username / tiktok.com/@username</span></p></form>
      {busy&&<p role="status" className="progress-message"><span className="spinner"/>{phase}</p>}
      <div id="scan-error" aria-live="polite">{error&&<p role="alert" className="error-box">{error}</p>}</div>
      <div className={'provider-notice '+(status?.providerConfigured?'ready':'')}><span className="status-light"/><div><strong>{status?.providerConfigured?t('مصدر البيانات مهيأ','Data provider configured'):t('بانتظار ربط مصدر بيانات مصرح به','Authorized data provider setup required')}</strong><p>{unavailable?status?.notice||t('الفحص متوقف مؤقتاً للصيانة.','Scanning is temporarily paused.'):status?.providerConfigured?t('النتائج تعتمد على البيانات التي يسمح المصدر بإتاحتها.','Results depend on the data permitted by the source.'):t('لن نعرض أرقاماً تجريبية. يظهر الفحص الحقيقي بعد تهيئة المزود والخادم.','We never show demo statistics. Live scans require a configured provider and backend.')}</p></div></div>
      </section>
      <div className="trust-line"><span><Shield size={14}/>{t('بيانات حقيقية فقط','Real data only')}</span><i/><span><FileCheck size={14}/>{t('تقرير واضح المصدر','Transparent sources')}</span><i/><span><Activity size={14}/>{t('تحليل قابل للتفسير','Explainable analysis')}</span></div>
      </section>
      {scan&&<Suspense fallback={<p className="loading-text">{t('تحضير النتائج…','Preparing results…')}</p>}><Results scan={scan} en={en} user={user} onNew={()=>{setScan(null);setInput('');document.getElementById('username')?.focus();}} onLogin={()=>setAuthOpen(true)}/></Suspense>}
      {!scan&&<section className="method-section"><div className="section-label">THE PROCESS / {t('طريقة العمل','HOW IT WORKS')}</div><h2>{t('من اليوزر إلى الصورة الأوضح.','From a username to the bigger picture.')}</h2><div className="steps-grid">{[[ScanLine,t('أدخل الحساب','Enter the account'),t('يوزر أو رابط مباشر لحساب TikTok عام.','A username or direct public TikTok profile URL.')],[Activity,t('نقرأ الإشارات','Read the signals'),t('بيانات مصرح بها، ومقاييس محسوبة بوضوح.','Authorized data and clearly defined metrics.')],[FileCheck,t('استلم رؤى قابلة للتطبيق','Get actionable insights'),t('ملاحظات مفسّرة وتوصيات تساعدك تتطور.','Explained observations and practical next steps.')]].map(([Icon,title,copy]:any,i)=><article key={title}><div className="step-top"><Icon size={23}/><span>0{i+1}</span></div><h3>{title}</h3><p>{copy}</p></article>)}</div></section>}
      <section className="scope-section"><button onClick={()=>setShowHelp(!showHelp)} aria-expanded={showHelp}><span><Shield size={19}/>{t('شنو يگدر التحليل يعرف؟','What can this analysis tell you?')}</span>{showHelp?<Minus size={18}/>:<Plus size={18}/>}</button>{showHelp&&<p>{t('نحلل الملف والنشاط والتفاعل عند توفر بيانات كافية. «نسبة أمان الحساب» تقييم تقديري للمؤشرات العامة فقط. لا يمكن إثبات الاختراق أو الانتهاكات أو Shadowban أو أمان كلمة المرور من اليوزر.','We analyze profile, activity, and engagement when sufficient data exists. The account safety score estimates public profile signals only. A username cannot prove hacks, violations, shadowbans, or password security.')}</p>}</section>
    </>:<Suspense fallback={<p className="loading-text">{t('جاري التحميل…','Loading…')}</p>}><AccountPanel mode={page} en={en} admin={admin} onLoad={s=>{setScan(s);setPage('scan');}}/></Suspense>}
    </main>
    <footer className="site-footer"><div><b>TK_SABR</b><p>{t('تم التطوير بواسطة المبرمج المجهول','Developed by المبرمج المجهول')}</p></div><p>{t('تحليل عام، قرارات أوضح. غير تابع لشركة TikTok.','Public insights. Clearer decisions. Not affiliated with TikTok.')}</p><span>© {new Date().getFullYear()} TK_SABR</span></footer>
    {authOpen&&<Suspense fallback={<p role="status">Loading…</p>}><AuthModal isOpen={authOpen} onClose={()=>setAuthOpen(false)} onLoginSuccess={setUser}/></Suspense>}
    </div></MotionConfig>;
}
