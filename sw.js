/* sw v49 2026-11-22: NJH offline single-player preview (NOT LIVE).
 * Do not replace the production v48 service worker without release approval.
 * Caches game resources for offline continuation after an online install.
 */
'use strict';
const PREFIX='njh-offline-';
const CACHE=PREFIX+'v1-20261122';
const SCOPE=self.registration.scope;
const BASE=new URL(SCOPE).pathname;
const CORE=[
 'mainkan/','mainkan/index.html','mainkan/app.js','mainkan/flow-model.js',
 'mainkan/local-character.js','mainkan/offline-save.js','mainkan/offline-ui.js',
 'mainkan/offline-assets.js','mainkan/njh98.js','mainkan/njh98.css',
 'mainkan/njh98-mock.js','mainkan/njh98-step2.js','mainkan/njh98-step2-catalog.js',
 'world-builder/','world-builder/index.html','world-builder/builder.js',
 'world-builder/semesta-life-play.js','world-builder/semesta-life-hooks.js',
 'world-builder/semesta-daynight.js','shared/genesis-player.js',
 'jiwa/life-economy.js','content/balancing.json'
];
const VENDORS=new Set(['cdn.jsdelivr.net','unpkg.com','raw.githubusercontent.com']);
function allowed(url,req){
 const origin=self.location?.origin||(typeof location!=='undefined'?location.origin:'');
 if(url.origin===origin){
  if(url.pathname.startsWith('/virtual-life-asset-pipeline/'))return true;
  if(!url.pathname.startsWith(BASE))return false;
  const rel=url.pathname.slice(BASE.length);
  // Only the Mainkan game and its native player iframe are offline navigations.
  // Jiwa, Semesta editor, Membangun and other authoring apps stay network-only.
  if(req?.mode==='navigate'&&!rel.startsWith('mainkan/')&&
     !(rel.startsWith('world-builder/')&&url.searchParams.get('player')==='1'))return false;
  return /^(mainkan|world-builder|shared|jiwa|content)\//.test(rel);
 }
 return url.protocol==='https:'&&VENDORS.has(url.hostname);
}
async function put(cache,req){
 const existing=await cache.match(req,{ignoreSearch:true});
 if(existing)return true;
 const response=await fetch(req);
 if(!response.ok||response.type==='opaque')throw Error('HTTP '+response.status);
 await cache.put(req,response.clone());return true;
}
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  // Individual failures must not make the worker un-installable.
  await Promise.allSettled(CORE.map(p=>put(cache,new Request(new URL(p,SCOPE)))));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const names=await caches.keys();
  await Promise.all(names.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||!allowed(url,req))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const cached=await cache.match(req,{ignoreSearch:true});
  if(cached)return cached;
  try{
   const response=await fetch(req);
   if(response.ok&&response.type!=='opaque')event.waitUntil(cache.put(req,response.clone()).catch(()=>{}));
   return response;
  }catch(error){
   if(req.mode==='navigate'){
    const fallback=url.pathname.includes('/world-builder/')?'world-builder/index.html':'mainkan/index.html';
    const saved=await cache.match(new URL(fallback,SCOPE),{ignoreSearch:true});
    if(saved)return saved;
   }
   return new Response('NJH offline: file belum tersedia di cache. Sambungkan internet dan jalankan Siapkan Offline.',{
    status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}
   });
  }
 })());
});
self.addEventListener('message',event=>{
 if(event.data?.type!=='NJH_PREFETCH'||!event.ports?.[0])return;
 const port=event.ports[0],urls=Array.isArray(event.data.urls)?event.data.urls.slice(0,350):[];
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  let done=0,failed=0;
  for(let i=0;i<urls.length;i+=5){
   const batch=urls.slice(i,i+5);
   await Promise.all(batch.map(async raw=>{
    try{
     const url=new URL(raw,SCOPE);
     if(!allowed(url,{mode:'cors'}))throw Error('url not allowed');
     await put(cache,new Request(url.href));
    }catch(_e){failed++;}
    finally{done++;try{port.postMessage({type:'progress',done,total:urls.length,failed});}catch{}}
   }));
  }
  try{port.postMessage({type:'complete',done,total:urls.length,failed});}catch{}
 })());
});
