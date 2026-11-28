// Offline verification of offline-www: every request outside 127.0.0.1 is aborted (and counted).
// Server mimics Capacitor's local server. Runs desktop + phone landscape.
//   node tools/offline/verify-offline.mjs [--www offline-www] [--shots dir] [--sizes desk,land]
import {launch,startServer,bootGuest,waitWorld,sleep,tap,frameOf} from './harness.mjs';
import {scenario} from './gameplay.mjs';
import fs from 'fs';import path from 'path';import {fileURLToPath} from 'url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i>0?process.argv[i+1]:d;};
const WWW=path.resolve(HERE,'../..',arg('--www','offline-www'));const SHOTS=arg('--shots','/workspace/njh-apk/shots');
const PORT=Number(arg('--port','8941'));fs.mkdirSync(SHOTS,{recursive:true});
const srv=await startServer(WWW,PORT,{capacitorLike:true});
const report={www:WWW,runs:{}};
const sizes=(arg('--sizes','desk,land')).split(',');
const waitBtn=async(p,id)=>{for(let i=0;i<60;i++){if(await p.evaluate(id=>{const g=document.getElementById(id);return !!g&&!g.hidden&&g.offsetParent!==null},id).catch(()=>false))return true;await tap(p,'#skipSplash').catch(()=>{});await sleep(400);}return false;};
const menu=p=>p.evaluate(()=>[...document.querySelectorAll('#welcomeScreen button')].filter(b=>b.offsetParent!==null).map(b=>b.textContent.replace(/\s+/g,' ').trim()));
const lifeSnap=fr=>fr.evaluate(()=>{const s=window.SemestaLifePlay.state();return {wallet:s.wallet,elapsed:s.elapsedMinutes,inv:(s.inventory||[]).length,q1:((window.SemestaLifePlay.quests?.()||[]).find(q=>q.id==='q1_makan')||{}).state};});
for(const size of sizes){
  const H=await launch({mode:'offline',size,root:WWW,port:PORT});const p=H.p;const R={size};const tag='off-'+size;
  try{
    // A) first launch: root -> offline menu (no login)
    await p.goto(H.base+'/index.html',{waitUntil:'domcontentloaded'});
    await waitBtn(p,'welcomeGuest');R.url=p.url();R.menuFirst=await menu(p);
    await p.screenshot({path:`${SHOTS}/${tag}-0-menu.png`});
    const t0=Date.now();await bootGuest(p,H.base,R,'Ichsan Offline');R.bootMs=Date.now()-t0;
    // B) gameplay
    await scenario(p,{R,shots:SHOTS,tag});
    // C) save persists across an app restart (reload, no ?fresh) via Lanjutkan
    const fr=frameOf(p);
    await fr.evaluate(()=>{window.VLNjhMapPreviewRuntime.teleport(-20,36);});await sleep(500);
    R.beforeReload=await lifeSnap(fr);
    // simulate the app going to background (save-on-hide), then restart right away
    await fr.evaluate(()=>{Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
    R.savedKeys=await p.evaluate(()=>Object.keys(localStorage).filter(k=>/semesta-life|mainkan-character/.test(k)));
    await p.goto(H.base+'/index.html',{waitUntil:'domcontentloaded'});
    await waitBtn(p,'welcomeContinue');R.menuReturning=await menu(p);
    await p.screenshot({path:`${SHOTS}/${tag}-7-menu-lanjutkan.png`});
    await tap(p,'#welcomeContinue');
    const fr2=await waitWorld(p,R);
    R.afterReload=await lifeSnap(fr2);
    R.nameAfterReload=await p.evaluate(()=>document.body.innerText.includes('Ichsan Offline'));
    R.savePersists=R.afterReload.wallet===R.beforeReload.wallet&&R.afterReload.inv===R.beforeReload.inv&&R.afterReload.q1===R.beforeReload.q1&&R.afterReload.elapsed>=R.beforeReload.elapsed;
    await p.screenshot({path:`${SHOTS}/${tag}-8-after-reload.png`});
    // D) ?fresh=1 path
    const t1=Date.now();await p.goto(H.base+'/virtual-office/mainkan/index.html?fresh=1',{waitUntil:'domcontentloaded'});await waitWorld(p,R);R.freshMs=Date.now()-t1;
    R.freshWallet=await frameOf(p).evaluate(()=>window.SemestaLifePlay.state().wallet);
    await p.screenshot({path:`${SHOTS}/${tag}-9-fresh.png`});
  }catch(e){R.error=String(e).slice(0,400);await p.screenshot({path:`${SHOTS}/${tag}-ERR.png`}).catch(()=>{});}
  R.requests=H.log.reqs.length;R.MB=+(H.log.bytes/1048576).toFixed(2);
  R.externalRequests=[...new Set(H.log.external)];R.http4xx=[...new Set(H.log.bad.filter(x=>/^4\d\d /.test(x)))];
  R.failed=[...new Set(H.log.bad.filter(x=>x.startsWith('FAIL')))].slice(0,30);R.pageErrors=[...new Set(H.log.errs)].slice(0,30);
  report.runs[size]=R;await H.b.close();
  fs.writeFileSync(path.join(SHOTS,'verify-offline.json'),JSON.stringify(report,null,1));
  console.log(size,JSON.stringify({...R,doors:R.doors?{...R.doors,rows:undefined}:R.doors}).slice(0,4000));
}
srv.close();
