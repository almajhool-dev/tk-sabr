import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';
export default defineConfig(({command})=>({
 base:process.env.VITE_BASE_PATH||'/',
 plugins:[react(),tailwindcss(),{name:'production-security-policy',transformIndexHtml(){
   if(command!=='build')return [];
   return [{tag:'meta',attrs:{'http-equiv':'Content-Security-Policy',content:"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; connect-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self'"},injectTo:'head-prepend'}];
 }}],build:{sourcemap:false},server:{host:'0.0.0.0'},
}));
