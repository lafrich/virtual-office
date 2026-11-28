// Asset crawl: plays the game against the repo tree with pipeline/raw/CDN proxied from the live web,
// caches everything into the mirror and writes tools/offline/asset-manifest.json.
import {launch,startServer,bootGuest,waitWorld,sleep,tap,typeIn,sha} from './harness.mjs';
import {scenario} from './gameplay.mjs';
import fs from 'fs';import path from 'path';
const ROOT=process.env.CRAWL_ROOT||'/workspace/njh-offline-crawlroot';const MIRROR=process.env.MIRROR||'/workspace/njh-offline-mirror';
const PORT=8931;const srv=await startServer(ROOT,PORT);
const all=new Set();const vo=new Set();const res={};
async function run(name,fn,size='desk'){
  const H=await launch({mode:'crawl',size,root:ROOT,port:PORT,mirror:MIRROR});
  const R={};try{await fn(H,R);}catch(e){R.error=String(e).slice(0,300);}
  for(const f of H.log.fetched)all.add(f.key);
  for(const u of H.log.reqs){const x=new URL(u);if(x.hostname==='127.0.0.1'){const pth=decodeURIComponent(x.pathname);if(pth.startsWith('/virtual-life-asset-pipeline/'))all.add(pth.slice(1));else vo.add(pth);}}
  R.external=[...new Set(H.log.external.map(u=>u.split('?')[0]))].filter(u=>!/raw.githubusercontent|jsdelivr|unpkg/.test(u));
  R.bad=[...new Set(H.log.bad)].slice(0,30);R.errs=[...new Set(H.log.errs)].slice(0,20);
  res[name]=R;await H.b.close();console.log(name,JSON.stringify(R).slice(0,1500));
}
await run('creator',async(H,R)=>{
  const p=H.p;
  await p.goto(H.base+'/virtual-office/mainkan/',{waitUntil:'domcontentloaded'});
  for(let i=0;i<60;i++){if(await p.evaluate(()=>{const g=document.getElementById('welcomeGuest');return !!g&&!g.hidden&&g.offsetParent!==null}))break;await tap(p,'#skipSplash');await sleep(400);}
  await tap(p,'#welcomeGuest');await p.waitForFunction(()=>!document.getElementById('characterScreen')?.hidden,{timeout:30000});await sleep(2500);
  // click every creator tool and option so every outfit/hair/skin sheet is fetched
  const tools=await p.evaluate(()=>document.querySelectorAll('#ccTools button').length);R.tools=tools;let opts=0;
  for(let t=0;t<tools;t++){await p.evaluate(i=>document.querySelectorAll('#ccTools button')[i]?.click(),t);await sleep(300);
    const n=await p.evaluate(()=>document.querySelectorAll('#ccOptions button').length);
    for(let o=0;o<n;o++){await p.evaluate(i=>document.querySelectorAll('#ccOptions button')[i]?.click(),o);await sleep(250);opts++;}
    // reset to first option
    await p.evaluate(()=>document.querySelectorAll('#ccOptions button')[0]?.click());}
  R.opts=opts;
  // gender/base switch if present
  await p.evaluate(()=>{for(const s of document.querySelectorAll('#characterScreen select')){for(const o of s.options){s.value=o.value;s.dispatchEvent(new Event('change',{bubbles:true}));}s.selectedIndex=0;s.dispatchEvent(new Event('change',{bubbles:true}));}});await sleep(1500);
});
await run('guest',async(H,R)=>{
  const p=H.p;
  await bootGuest(p,H.base,R,'Crawl');
  await scenario(p,{R});
  // UI windows that may lazy-load icons
  for(const sel of ['Nokia','Tas','Status','Peta','Menu']){await p.evaluate(s=>{const b=[...document.querySelectorAll('button')].find(b=>b.offsetParent!==null&&b.textContent.trim()===s);b?.click();},sel);await sleep(1200);await p.evaluate(()=>{try{window.NJH98.closeWindows()}catch{}});await p.keyboard.press('Escape');}
  await sleep(4000);
});
await run('fresh',async(H,R)=>{
  await H.p.goto(H.base+'/virtual-office/mainkan/?fresh=1',{waitUntil:'domcontentloaded'});await waitWorld(H.p,R);await sleep(5000);
});
await run('female-land',async(H,R)=>{
  const p=H.p;await p.goto(H.base+'/virtual-office/mainkan/',{waitUntil:'domcontentloaded'});
  for(let i=0;i<60;i++){if(await p.evaluate(()=>{const g=document.getElementById('welcomeGuest');return !!g&&!g.hidden&&g.offsetParent!==null}))break;await tap(p,'#skipSplash');await sleep(400);}
  await tap(p,'#welcomeGuest');await p.waitForFunction(()=>!document.getElementById('characterScreen')?.hidden,{timeout:30000});await sleep(2000);
  R.female=await p.evaluate(()=>{const b=[...document.querySelectorAll('#characterScreen button,#characterScreen [data-base]')].find(b=>/female|perempuan|wanita/i.test((b.dataset.base||'')+b.textContent+(b.title||'')));if(b){b.click();return b.textContent.trim().slice(0,30)||b.dataset.base}return null;});await sleep(1500);
  await typeIn(p,'#playerName','Crawl F');await typeIn(p,'#ccDay','15');await typeIn(p,'#ccMonth','01');await typeIn(p,'#ccYear','1990');
  await tap(p,'#ccCreate');await p.waitForFunction(()=>!document.getElementById('confirmScreen')?.hidden,{timeout:20000});await tap(p,'#confirmGo');
  for(let i=0;i<30;i++){for(const s of ['#tutorialSkip','#tutorialDone','#njhHowtoWinSkip'])await tap(p,s);if(await p.evaluate(()=>!document.getElementById('gameScreen')?.hidden))break;await sleep(400);}
  await waitWorld(p,R);await sleep(4000);
},'land');
srv.close();
let prev=[];try{prev=JSON.parse(fs.readFileSync(new URL('./asset-manifest.json',import.meta.url))).files.map(f=>f.path);}catch{}
for(const k of prev)all.add(k);
const keys=[...all].map(k=>k.split('?')[0]).filter(k=>fs.existsSync(path.join(MIRROR,k))).sort();
const files=keys.map(k=>{const b=fs.readFileSync(path.join(MIRROR,k));return {path:k,bytes:b.length,sha256:sha(b)};});
const manifest={generated:new Date().toISOString(),pipelineLiveRef:'c9dc88fa (lafrich/virtual-life-asset-pipeline main, Pages)',note:'Files the play path fetched from the asset pipeline Pages site, raw.githubusercontent main and the three.js CDN. build-offline.mjs bundles these from the mirror (fetch-mirror re-downloads missing ones).',files};
fs.writeFileSync(new URL('./asset-manifest.json',import.meta.url),JSON.stringify(manifest,null,1));
fs.writeFileSync('/workspace/njh-apk/logs/crawl-vo-paths.json',JSON.stringify([...vo].sort(),null,1));
fs.writeFileSync('/workspace/njh-apk/logs/crawl-result.json',JSON.stringify(res,null,1));
console.log('MANIFEST',files.length,'files',(files.reduce((s,f)=>s+f.bytes,0)/1048576).toFixed(2),'MB; vo paths',vo.size);
