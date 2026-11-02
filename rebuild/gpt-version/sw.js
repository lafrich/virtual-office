/* GPT Version - isolated beta service worker. Works ONLY under /rebuild/gpt-version/.
   Retrieves the real original AES-GCM source and assets from the existing GitHub Pages root.
   Production Cloudflare Worker/network is never used. */
'use strict';
importScripts('./package-a.js?v=a9'); // GPT beta patch 09 (gate plane, trees and low-power paint)
const ROOT=new URL('../../',self.registration.scope),SUB=new URL(self.registration.scope).pathname;
const ENC_CACHE='vl-gpt-encrypted-v1'; // Only original AES-GCM blobs; never plaintext.
async function immutableBlob(id){
 const url=new URL('b/'+id,ROOT);
 let bucket=null;
 try{if(self.caches)bucket=await caches.open(ENC_CACHE);}catch(e){}
 if(bucket){try{const hit=await bucket.match(url.href);if(hit)return hit.arrayBuffer();}catch(e){}}
 const response=await fetch(url,{cache:'no-store'});
 if(!response.ok)throw Error('encrypted asset '+response.status);
 if(bucket){try{await bucket.put(url.href,response.clone());}catch(e){}}
 return response.arrayBuffer();
}
let key=null,manifestPromise=null;
function b64(v){return Uint8Array.from(atob(v),c=>c.charCodeAt(0))}
async function unlock(v){key=await crypto.subtle.importKey('raw',b64(v),'AES-GCM',false,['decrypt']);manifestPromise=null}
async function decrypt(bytes){const b=new Uint8Array(bytes);return crypto.subtle.decrypt({name:'AES-GCM',iv:b.slice(0,12)},key,b.slice(12))}
async function getKey(){if(key)return key;for(const c of await clients.matchAll({type:'window',includeUncontrolled:true})){const ch=new MessageChannel();const k=await new Promise(resolve=>{const t=setTimeout(()=>resolve(null),1500);ch.port1.onmessage=e=>{clearTimeout(t);resolve(e.data?.key||null)};c.postMessage({type:'need-key'},[ch.port2])});if(k){try{await unlock(k);return key}catch(e){}}}return null}
async function man(){if(!manifestPromise)manifestPromise=(async()=>{const r=await fetch(new URL('manifest.enc',ROOT),{cache:'no-store'});if(!r.ok)throw Error('manifest '+r.status);return JSON.parse(new TextDecoder().decode(await decrypt(await r.arrayBuffer()))).files})();try{return await manifestPromise}catch(e){manifestPromise=null;throw e}}
function patch(html,useV16){
 if(useV16){const result=self.gptApplyA(html);html=result.html;console.info('[gpt-v16a] Package A applied',result.applied,'phone map',result.phoneMap);}
 const old='  MP.me=null; MP.tok=null; showLogin(true);';
 if(!html.includes(old))throw Error('Beta incompatible with current login anchor');
 if(!html.includes('Virtual Life v15a')&&!html.includes('Virtual Life v16a · GPT beta'))throw Error('Beta incompatible with current engine version');
 html=html.replace(old,"  MP.me=(sessionStorage.getItem('vl-gpt-char')==='noorz'?'noorz':'ichsan'); MP.user=MP.me; MP.tok=null; setStatus('live');");
 const tap="const p=toSvg(e), g=toGrid(p.x,p.y); if(okG(g.c,g.r)) goTo({c:g.c,r:g.r});";
 if(html.includes(tap))html=html.replace(tap,'/* GPT beta: empty-floor tap-to-walk disabled */');
 const demos="const DM_SLOTS=[{h:12,dir:1},{h:19,dir:-1}]";
 if(html.includes(demos))html=html.replace(demos,'const DM_SLOTS=[]');
 html=html.replace('</head>',`<script>if('serviceWorker'in navigator)navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.type==='need-key'&&e.ports&&e.ports[0])e.ports[0].postMessage({key:sessionStorage.getItem('vl-gpt-k')})});</script>
<meta http-equiv="Content-Security-Policy" content="default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'">
<style id="gpt-beta-style">body .app>header{display:none!important}html,body{height:100%;min-height:100%;overflow:hidden}body .app{height:100dvh;min-height:0;grid-template-rows:minmax(0,1fr)}#stage{min-height:0;overflow:hidden}@media(max-width:600px){#vj-toast{top:clamp(192px,32dvh,285px)!important;bottom:auto!important;max-width:min(300px,calc(100vw - 28px))}}</style></head>`);
 if(!useV16)html=html.replace('</body>',`<div style="position:fixed;top:4px;left:50%;transform:translateX(-50%);z-index:2147483647;pointer-events:none;background:#172b49df;color:#fff;font:700 10px Tahoma,sans-serif;padding:4px 10px;border-radius:3px;letter-spacing:1px">GPT VERSION · OFFLINE BETA</div></body>`);
 return html;
}
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('message',e=>{if(e.data?.type==='unlock')e.waitUntil(unlock(e.data.key).then(()=>e.ports?.[0]?.postMessage({ok:true}),()=>e.ports?.[0]?.postMessage({ok:false})))});
self.addEventListener('fetch',e=>{
 const url=new URL(e.request.url);
 if(e.request.method!=='GET'||url.origin!==location.origin||!url.pathname.startsWith(SUB))return;
 const path=decodeURIComponent(url.pathname.slice(SUB.length));
 if(path===''||path==='index.html'||path==='sw.js'||path==='package-a.js')return;
 e.respondWith((async()=>{
  if(!await getKey()){if(e.request.mode==='navigate')return Response.redirect(self.registration.scope+'index.html',302);return new Response('beta locked',{status:401})}
  try{
   let bytes,type;
   if(path==='data.json'){const r=await fetch(new URL('data.enc',ROOT),{cache:'no-store'});if(!r.ok)throw Error('data '+r.status);bytes=await decrypt(await r.arrayBuffer());type='application/json'}
   else{
    const m=await man(),entry=m[path];
    if(!entry)return new Response('asset not found '+path,{status:404});
    if(!/^[0-9a-f]{32}\.enc$/.test(entry[0]))throw Error('bad encrypted asset id');
    bytes=await decrypt(await immutableBlob(entry[0]));type=entry[1]||'application/octet-stream';
   }
   if(path==='office.html')return new Response(patch(new TextDecoder().decode(bytes),url.searchParams.get('v16')==='1'),{headers:{'content-type':'text/html;charset=utf-8','cache-control':'no-store','X-GPT-Version':'offline-beta'}});
   return new Response(bytes,{headers:{'content-type':type,'cache-control':'no-store'}});
  }catch(ex){return new Response('GPT beta decode error: '+(ex.message||ex),{status:500,headers:{'content-type':'text/plain'}})}
 })());
});