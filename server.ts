import express from 'express';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {localDatabase} from './backend/local-db.ts';
import {createApi,type Env} from './backend/worker/index.ts';
import {cleanExpired} from './backend/worker/db.ts';
const root=path.dirname(fileURLToPath(import.meta.url));
const app=express();app.disable('x-powered-by');
const db=localDatabase(process.env.LOCAL_DATABASE||'local.sqlite');
const env={...process.env,DB:db,ALLOWED_ORIGIN:process.env.ALLOWED_ORIGIN||'http://localhost:3000',RATE_LIMIT_SALT:process.env.RATE_LIMIT_SALT||'local-development-only'} as Env;
const api=createApi();
app.use('/api',async(req,res)=>{
  try {
    const chunks:Buffer[]=[];let size=0;
    for await(const chunk of req){size+=chunk.length;if(size>8192){res.status(413).json({message:'الطلب كبير جداً'});return;}chunks.push(chunk);}
    const headers=new Headers();for(const [k,v]of Object.entries(req.headers))if(typeof v==='string')headers.set(k,v);
    // Never trust a client-supplied Cloudflare IP in the local Node adapter.
    headers.set('CF-Connecting-IP',req.socket.remoteAddress||'local');
    const response=await api(new Request('http://localhost'+req.originalUrl,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})}),env);
    res.status(response.status);response.headers.forEach((v,k)=>res.setHeader(k,v));res.send(Buffer.from(await response.arrayBuffer()));
  }catch{res.status(500).json({message:'خطأ داخلي'});}
});
app.use((_req,res,next)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');next();});
if(process.env.NODE_ENV==='production') {
  app.use(express.static(path.join(root,'dist')));app.get('*',(_req,res)=>res.sendFile(path.join(root,'dist/index.html')));
}else{const{createServer}=await import('vite');const vite=await createServer({server:{middlewareMode:true},appType:'spa'});app.use(vite.middlewares);}
setInterval(()=>{void cleanExpired(db).catch(()=>{});},3600000).unref();
app.listen(Number(process.env.PORT||3000),'0.0.0.0',()=>console.log('TK_SABR listening on port '+(process.env.PORT||3000)));
