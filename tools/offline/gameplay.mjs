// Gameplay scenario shared by the asset crawl and the offline verification.
import {sleep,frameOf,tap} from './harness.mjs';
export async function scenario(p,{shots,tag,R}){
  const fr=frameOf(p);const L=(f,a)=>fr.evaluate(f,a);
  const shot=async n=>{if(shots)await p.screenshot({path:`${shots}/${tag}-${n}.png`});};
  const money=()=>L(()=>window.SemestaLifePlay.money?.());
  const q1=()=>L(()=>{const q=(window.SemestaLifePlay.quests?.()||[]).find(x=>x.id==='q1_makan');return q?{state:q.state,progress:q.progress,status:q.status}:null;});
  const tp=async(x,z,ms=1100)=>{await L(([x,z])=>window.VLNjhMapPreviewRuntime.teleport(x,z),[x,z]);await sleep(ms);};
  const visibleButtons=()=>p.evaluate(()=>[...document.querySelectorAll('button')].filter(b=>b.offsetParent!==null).map(b=>((b.getAttribute('data-njh-act')||'')+'|'+(b.title||'')+'|'+b.textContent.trim()).slice(0,60)));
  const clickBtn=re=>p.evaluate(src=>{const rx=new RegExp(src,'i');const b=[...document.querySelectorAll('button')].find(b=>b.offsetParent!==null&&!b.disabled&&rx.test((b.getAttribute('data-njh-act')||'')+'|'+(b.title||'')+'|'+b.textContent));if(b){b.click();return b.textContent.trim().slice(0,40)}return null},re.source);
  const focusGame=async()=>{const box=await p.evaluate(()=>{const f=document.getElementById('semestaFrame');const r=f.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height*0.6};});await p.mouse.click(box.x,box.y);await sleep(200);};
  const step=async(name,fn)=>{const t=Date.now();try{R[name]=await fn();}catch(e){R[name]={error:String(e).slice(0,300)};}R[name+'_ms']=Date.now()-t;};
  await p.evaluate(()=>{try{document.getElementById('njhHowtoWinSkip')?.click();window.NJH98?.closeWindows?.();}catch{}});
  R.start={money:await money(),q1:await q1(),name:await p.evaluate(()=>window.NJH98?.profile?.()?.name||document.querySelector('#njhName,.njh-name')?.textContent||null).catch(()=>null)};
  await shot('1-city');
  // 1) walk with the real keyboard
  await step('walk',async()=>{await focusGame();const a=await L(()=>window.SemestaLifePlay.playerPosition?.()||window.VLNjhMapPreviewRuntime?.position?.()||null);
    await p.keyboard.down('d');await sleep(1600);await p.keyboard.up('d');await p.keyboard.down('s');await sleep(800);await p.keyboard.up('s');await sleep(300);
    const b=await L(()=>window.SemestaLifePlay.playerPosition?.()||window.VLNjhMapPreviewRuntime?.position?.()||null);
    await shot('2-walk');
    return {a,b,moved:a&&b?+Math.hypot((b.x-a.x),(b.z-a.z)).toFixed(2):null};});
  // 2) character clothed: render the player's own profile vs a nude look and compare pixels
  await step('clothed',async()=>{const saved=await p.evaluate(()=>{try{return JSON.parse(localStorage.getItem('mainkan-character-v1:offline-guest')||'null')}catch{return null}});return L(async(saved)=>{const G=window.LGRGame;if(!G)return {err:'no LGRGame'};
    const prof=saved?window.VLGenesisPlayer.normalizeProfile(saved):null;
    const ap=prof?.appearance||{};const base={gender:/female/.test(prof?.base||'')?'female':'male'};
    const get=async pr=>{let c=null;for(let k=0;k<60&&!c;k++){try{c=G.frame(pr,'se','idle',0,null,0);}catch{}if(!c)await new Promise(r=>setTimeout(r,100));}return c?c.toDataURL():null;};
    const me=await get({...base,appearance:{...ap}});const nude=await get({...base,appearance:{...ap,topStyle:'nude',pantsStyle:'nude',shoesStyle:'nude'}});
    return {savedChar:!!saved,top:ap.topStyle||null,pants:ap.pantsStyle||null,haveFrame:!!me,differsFromNude:!!me&&!!nude&&me!==nude};},saved);});
  // 3) door census + enter every door (loads every interior)
  await step('doors',async()=>{
    const list=await p.evaluate(()=>window.NJH98.doorList().map(d=>({id:d.id,name:d.name,closed:!!d.closed,x:d.x,z:d.z})));
    const rows=[];
    for(const d of list){
      await tp(d.x,d.z+0.4,700);
      const en=await L(()=>{try{const r=window.__njhPlayInteriors.enterNearby();return r&&typeof r==='object'?(r.ok===false?'no:'+(r.reason||''):'ok'):String(r)}catch(e){return 'ERR '+e}});
      let room=null;for(let i=0;i<20&&!room;i++){await sleep(250);room=await L(()=>window.__njhPlayInteriors.active?.()?.roomId||null);}
      rows.push({name:d.name,closed:d.closed,en:String(en).slice(0,60),room});
      if(room){await L(()=>window.__njhPlayInteriors.exit());await sleep(600);}
      await p.evaluate(()=>{try{window.NJH98.closeWindows()}catch{}});
    }
    const open=list.filter(d=>!d.closed).length,closed=list.length-open;
    const kopi=rows.filter(r=>/kopi/i.test(r.name));
    return {total:list.length,open,closed,entered:rows.filter(r=>r.room).length,kopi,rows};});
  // 4) q1: accept at Pak Ogah, eat at Warteg (real E + Makan button), claim
  await step('q1',async()=>{
    const out={};
    const og=(await L(()=>(window.SemestaLifePlay.npcs?.()||[]).map(n=>({id:n.id,label:n.label||n.name,x:n.x,z:n.z})).filter(n=>/ogah/i.test(n.id+n.label))))[0]||{x:-26.5,z:41.5};
    await tp(og.x,og.z+0.8);
    const mark=async()=>{const bb=await p.evaluate(()=>{const m0=[...document.querySelectorAll('#njhMarks .njh-qmark')].find(m=>/Ogah/i.test(m._q?.npc?.name||''));const m=m0&&m0.querySelector('b');if(!m)return null;const r=m.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});if(bb){await p.mouse.click(bb.x,bb.y);await sleep(900);}return !!bb;};
    out.markClicked=await mark();
    const acc=await p.$('#njhQAccept');if(acc&&await acc.isVisible()){await acc.click();await sleep(700);out.accept='ui';}
    else{out.accept='api:'+JSON.stringify(await L(()=>window.SemestaLifePlay.acceptQuest('job_pak_ogah','q1_makan'))).slice(0,80);}
    await p.keyboard.press('Escape');await p.evaluate(()=>{try{window.NJH98.closeWindows()}catch{}});
    out.qAccepted=await q1();
    const d=(await L(()=>window.VLNjhMapPreview.report().wired)).find(x=>/Warteg/.test(x.label));
    await tp(...d.usePoint);await focusGame();await p.keyboard.press('e');
    let room=null;for(let i=0;i<40&&!room;i++){await sleep(250);room=await L(()=>window.__njhPlayInteriors.active?.()?.roomId||null);}
    out.room=room;await sleep(1200);
    await L(()=>{const I=window.__njhPlayInteriors;const f=I.active().furniture.find(f=>/ibu_warteg/.test(f.assetId));I.place(f.x,f.z+1);});
    await sleep(500);await p.keyboard.down('ArrowUp');await sleep(60);await p.keyboard.up('ArrowUp');await sleep(700);
    out.near=await L(()=>(window.SemestaLifePlay.nearbyActions()||[]).map(a=>a.id));
    const m1=await money();await p.keyboard.press('e');await sleep(700);
    out.clicked=await clickBtn(/Makan Warteg|\|Makan/);await sleep(500);
    const conf=await clickBtn(/^\|?\|?(Ya|OK|Bayar)/);if(conf)out.confirm=conf;
    await sleep(1500);await shot('3-warteg-makan');
    out.money={before:m1,after:await money()};out.qAfterEat=await q1();
    await L(()=>window.__njhPlayInteriors.exit());await sleep(1200);
    await tp(og.x,og.z+0.8);const mm0=await money();await mark();
    const ti=await p.$('#njhQTurnIn');
    if(ti&&await ti.isVisible()&&!(await ti.isDisabled())){await ti.click();await sleep(1200);out.claim='ui';}
    else{out.claim='api:'+JSON.stringify(await L(()=>window.SemestaLifePlay.turnInQuest('job_pak_ogah','q1_makan'))).slice(0,100);}
    out.claimDelta=(await money())-mm0;out.qFinal=await q1();
    await p.keyboard.press('Escape');await p.evaluate(()=>{try{window.NJH98.closeWindows()}catch{}});
    return out;});
  // 5) Mart: E at door, Belanja, buy one drink
  await step('mart',async()=>{
    const out={};
    const d=(await L(()=>window.VLNjhMapPreview.report().wired)).find(x=>/Mart|minimarket/i.test(x.label));
    out.door=d?.label;await tp(...d.usePoint);await focusGame();await p.keyboard.press('e');
    let room=null;for(let i=0;i<40&&!room;i++){await sleep(250);room=await L(()=>window.__njhPlayInteriors.active?.()?.roomId||null);}
    out.room=room;await sleep(1200);
    out.near=await L(()=>(window.SemestaLifePlay.nearbyActions()||[]).map(a=>a.id));
    await p.keyboard.press('e');await sleep(700);
    out.openedVia=await clickBtn(/shop_minimarket|Belanja/);await sleep(900);
    out.shopOpen=await p.evaluate(()=>{const w=document.getElementById('njhShop2');return !!w&&!w.hidden;});
    if(out.shopOpen){
      await p.evaluate(()=>{const t=[...document.querySelectorAll('#njhShop2 [data-scat]')].find(b=>/Minuman/.test(b.textContent));t?.click();});await sleep(300);
      const bag0=await L(()=>(window.SemestaLifePlay.state().inventory||[]).length);const m0=await money();
      out.item=await p.evaluate(()=>{const b=document.querySelector('#njhShop2 [data-buy]');if(!b)return null;const id=b.getAttribute('data-buy');b.click();return id;});await sleep(800);
      out.msg=await p.evaluate(()=>document.getElementById('njhShop2Msg')?.textContent?.trim().slice(0,120));
      await shot('4-mart-beli');
      out.money={before:m0,after:await money()};out.bag={before:bag0,after:await L(()=>(window.SemestaLifePlay.state().inventory||[]).length)};
    }
    await p.evaluate(()=>{try{window.NJH98.closeWindows()}catch{}});await L(()=>window.__njhPlayInteriors.exit());await sleep(1000);
    return out;});
  // 6) work: hold E at Kang Parkir spot
  await step('work',async()=>{
    await tp(-16.5,40.5);await focusGame();
    const near=await L(()=>(window.SemestaLifePlay.nearbyActions()||[]).map(a=>a.id));
    const m0=await money();await p.keyboard.down('e');await sleep(9500);await p.keyboard.up('e');await sleep(1000);
    await shot('5-kerja');
    return {near,money:{before:m0,after:await money()}};});
  // 7) sleep until morning from the tent (clock set to 04:00 like New Bot's harness)
  await step('sleep',async()=>{
    const sp={x:-51.5,z:64.5}; // Tenda Hobo (sleep site)
    await tp(sp.x,sp.z);
    await p.evaluate(()=>{const W=document.getElementById('semestaFrame').contentWindow;const st=W.SemestaLifePlay.state();const target=4*60;st.clockOrigin=target-(Number(st.elapsedMinutes)||0);
      try{const s=W.document.getElementById('timeScrub');if(s){s.value=String(target);s.dispatchEvent(new Event('input',{bubbles:true}));}}catch{}try{W.visualClock?.(target);}catch{}try{window.NJH98?.paintHud?.();}catch{}});
    await sleep(500);await focusGame();await p.keyboard.press('e');await sleep(600);
    const btns=(await visibleButtons()).filter(t=>/sleep|Tidur/i.test(t));
    const clicked=await clickBtn(/sleep_until_morning/);
    const samples=[];for(let i=0;i<25;i++){await sleep(1000);const s=await p.evaluate(()=>({t:document.getElementById('njhTime')?.textContent||null,d:document.getElementById('njhDay')?.textContent||null}));samples.push(s.t+' '+s.d);if(/06:0/.test(s.t||''))break;}
    await shot('6-tidur');
    return {spawn:sp,btns,clicked,final:samples[samples.length-1],ok:/06:0/.test(samples[samples.length-1]||'')};});
  R.end={money:await money(),q1:await q1(),elapsed:await L(()=>window.SemestaLifePlay.state().elapsedMinutes)};
}
