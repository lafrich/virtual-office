// Shared Playwright harness for the NJH offline build (crawl + offline verification).
// MODE=crawl : serve the repo tree locally, proxy pipeline/raw/CDN to the live web and cache into the mirror.
// MODE=offline: serve offline-www only; every request outside 127.0.0.1 is aborted and recorded.
import { chromium } from 'playwright-core';
import fs from 'fs'; import path from 'path'; import http from 'http'; import crypto from 'crypto';
export const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary','.wasm':'application/wasm','.txt':'text/plain','.mp3':'audio/mpeg','.ogg':'audio/ogg','.wav':'audio/wav','.ico':'image/x-icon','.woff2':'font/woff2'};
// capacitorLike: mimic Capacitor's Android WebViewLocalServer (an extensionless path serves the ROOT index.html).
export function startServer(root,port,{capacitorLike=false}={}){
  const srv=http.createServer((req,res)=>{
    const u=new URL(req.url,'http://x');let f=path.join(root,decodeURIComponent(u.pathname));
    if(capacitorLike&&!path.basename(u.pathname).includes('.'))f=path.join(root,'index.html');
    if(!f.startsWith(root)){res.writeHead(403);return res.end();}
    try{if(fs.statSync(f).isDirectory())f=path.join(f,'index.html');const body=fs.readFileSync(f);
      res.writeHead(200,{'content-type':MIME[path.extname(f).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});res.end(body);}
    catch{res.writeHead(404,{'content-type':'text/plain'});res.end('nf '+u.pathname);}
  });
  return new Promise(r=>srv.listen(port,'127.0.0.1',()=>r(srv)));
}
export const SIZES={desk:{viewport:{width:1280,height:800}},land:{viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:2,userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'}};
// Map a live URL to a mirror-relative key.
export function mirrorKey(u){
  const url=new URL(u);
  if(url.hostname==='lafrich.github.io'&&url.pathname.startsWith('/virtual-life-asset-pipeline/'))return 'virtual-life-asset-pipeline/'+url.pathname.slice('/virtual-life-asset-pipeline/'.length);
  if(url.hostname==='raw.githubusercontent.com'){const m=url.pathname.match(/^\/lafrich\/virtual-life-asset-pipeline\/[^/]+\/(.*)$/);if(m)return 'vlap-raw/'+m[1];}
  if(/^(cdn\.jsdelivr\.net|unpkg\.com)$/.test(url.hostname)){const m=url.pathname.match(/three@0\.181\.0\/(.*)$/);if(m)return 'vendor/three@0.181.0/'+m[1].replace(/^npm\//,'');}
  return null;
}
export async function launch({mode,size='desk',root,port,mirror,live='https://lafrich.github.io'}){
  const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const ctx=await b.newContext({...SIZES[size],serviceWorkers:'block'});
  const log={reqs:[],external:[],bad:[],errs:[],fetched:[],bytes:0};
  await ctx.route('**/*',async route=>{
    const u=route.request().url();const url=new URL(u);
    if(url.hostname==='127.0.0.1'||url.protocol==='data:'||url.protocol==='blob:'){
      if(mode==='crawl'&&url.pathname.startsWith('/virtual-life-asset-pipeline/'))return proxy(route,live+url.pathname+url.search);
      return route.continue();
    }
    log.external.push(u);
    if(mode==='offline')return route.abort('internetdisconnected');
    const key=mirrorKey(u);
    if(key)return proxy(route,u);
    // crawl mode: allow nothing else (record only)
    return route.abort('blockedbyclient');
  });
  async function proxy(route,liveUrl){
    const key=mirrorKey(liveUrl);const f=path.join(mirror,key.split('?')[0]);
    let body,status=200;
    if(fs.existsSync(f)&&fs.statSync(f).isFile())body=fs.readFileSync(f);
    else{
      try{const r=await fetch(liveUrl);status=r.status;body=Buffer.from(await r.arrayBuffer());
        if(r.ok){fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,body);log.fetched.push({key:key.split('?')[0],url:liveUrl.split('?')[0],bytes:body.length});}
      }catch(e){return route.abort('failed');}
    }
    if(status===200)log.fetched.push({key:key.split('?')[0],url:liveUrl.split('?')[0],cached:true});
    return route.fulfill({status,body,headers:{'content-type':MIME[path.extname(f).toLowerCase()]||'application/octet-stream','access-control-allow-origin':'*'}});
  }
  const p=await ctx.newPage();
  p.on('request',r=>log.reqs.push(r.url()));
  p.on('requestfinished',async r=>{try{const s=await r.sizes();log.bytes+=s.responseBodySize;}catch{}});
  p.on('response',r=>{if(r.status()>=400)log.bad.push(r.status()+' '+r.url());});
  p.on('requestfailed',r=>{const u=r.url();if(!/^(data|blob):/.test(u))log.bad.push('FAIL '+(r.failure()?.errorText||'')+' '+u);});
  p.on('pageerror',e=>log.errs.push('pageerror: '+e.message.slice(0,240)));
  p.on('console',m=>{if(m.type()==='error')log.errs.push('console: '+m.text().slice(0,240));});
  p.on('dialog',d=>d.accept().catch(()=>{}));
  return {b,ctx,p,log,base:`http://127.0.0.1:${port}`};
}
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export async function tap(p,sel){return p.evaluate(s=>{const el=document.querySelector(s);if(el){el.click();return true}return false},sel);}
export async function typeIn(p,sel,val){return p.evaluate(({s,v})=>{const el=document.querySelector(s);if(!el)return;el.focus();el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},{s:sel,v:val});}
export function frameOf(p){return p.frames().find(f=>/world-builder/.test(f.url()));}
export async function waitWorld(p,out){
  await p.waitForFunction(()=>{try{const w=document.getElementById('semestaFrame')?.contentWindow;return !!(w&&w.SemestaLifePlay&&w.SemestaLifePlay.state?.());}catch{return false;}},{timeout:180000});
  await p.waitForFunction(()=>{const e=document.getElementById('worldLoading');return !e||e.hidden},null,{timeout:180000}).catch(()=>{if(out)out.loadingStuck=true;});
  await sleep(6000);
  for(const s of ['#njhHowtoWinSkip','#tutorialSkip','#tutorialDone'])await tap(p,s).catch(()=>{});
  return frameOf(p);
}
// Guest path without ?fresh: splash -> Main Tanpa Akun -> creator -> confirm -> game.
export async function bootGuest(p,base,out,name='Tes Offline'){
  await p.goto(base+'/virtual-office/mainkan/',{waitUntil:'domcontentloaded',timeout:60000});
  for(let i=0;i<60;i++){if(await p.evaluate(()=>{const g=document.getElementById('welcomeGuest');return !!g&&!g.hidden&&g.offsetParent!==null}))break;await tap(p,'#skipSplash');await sleep(400);}
  out.welcomeButtons=await p.evaluate(()=>[...document.querySelectorAll('button')].filter(b=>b.offsetParent!==null).map(b=>b.id+'|'+b.textContent.trim().slice(0,30)));
  await tap(p,'#welcomeGuest');
  await p.waitForFunction(()=>!document.getElementById('characterScreen')?.hidden,{timeout:30000});
  await sleep(2500);
  await typeIn(p,'#playerName',name);await typeIn(p,'#ccDay','15');await typeIn(p,'#ccMonth','01');await typeIn(p,'#ccYear','1990');
  await tap(p,'#ccCreate');await p.waitForFunction(()=>!document.getElementById('confirmScreen')?.hidden,{timeout:20000});await tap(p,'#confirmGo');
  for(let i=0;i<30;i++){for(const s of ['#tutorialSkip','#tutorialDone','#njhHowtoWinSkip']){if(await p.evaluate(sel=>{const el=document.querySelector(sel);return!!el&&el.offsetParent!==null;},s).catch(()=>false))await tap(p,s);}if(await p.evaluate(()=>!document.getElementById('gameScreen')?.hidden).catch(()=>false))break;await sleep(400);}
  return waitWorld(p,out);
}
export function sha(buf){return crypto.createHash('sha256').update(buf).digest('hex');}
