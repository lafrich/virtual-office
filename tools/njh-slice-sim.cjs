#!/usr/bin/env node
'use strict';
/* NJH slice-1.0 time-to-kos estimate. Drives the REAL engine (jiwa/life-economy.js +
 * world-builder/semesta-life-hooks.js quests) with the numbers from content/balancing.json.
 * Real time = travel + hold-to-work + action animations + menu overhead (all from the table's sim.* rows).
 * Usage: node tools/njh-slice-sim.cjs [--profile normal|cepat|awam] [--runs 200] [--sleep instant|realtime] [--json]
 */
const path=require('path');
const R=path.join(__dirname,'..');
const B=require(path.join(R,'shared/njh-balancing.js'));
const Life=require(path.join(R,'jiwa/life-economy.js'));
const Hooks=require(path.join(R,'world-builder/semesta-life-hooks.js'));
const arg=(k,d)=>{const i=process.argv.indexOf(k);return i>0?process.argv[i+1]:d;};
const PROFILE=arg('--profile','normal'),RUNS=Number(arg('--runs',200)),SLEEP=arg('--sleep','instant');
const RSPM=B.num('clock.realSecondsPerGameMinute');
const TRAVEL=B.num('sim.travelSeconds.'+PROFILE),OVER=B.num('sim.overheadPct.'+PROFILE)/100,WALK=B.num('sim.walkSpeed');
const ANIM_S=4; // pose/animation seconds for a non-hold action (njh98 progress window ~4 s)
const cfg=Life.normalize(B.applyToLifeConfig(Life.defaults()));
const S=cfg.settings;
function mulberry(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function once(seed){
 const rnd=mulberry(seed);
 let st=Life.stateFrom({},cfg),real=0,loc='tent',moves=0,sessions=0,sleeps=0,log=[];
 const sites=['job_pak_ogah','hansip','job_kang_parkir','loak','pasar_ikan','job_silver','kost','warung'].map((id,i)=>({id,x:i*100,z:0,jobId:{job_pak_ogah:'pak_ogah',job_kang_parkir:'kang_parkir',job_silver:'manusia_silver'}[id]}));
 const H=Hooks.create({getState:()=>st,setState:x=>{st=x;},getSites:()=>sites,getWorld:()=>({objects:[]}),getPos:()=>({x:-999,z:0}),
  getConfig:()=>cfg,questTable:B.quests(),persist:()=>{},runEconomy:(a,args)=>{const r=Life.run(cfg,st,a,args||{});if(r.ok)st=r.state;return r;}});
 const tick=sec=>{real+=sec;const m=Math.floor(sec/RSPM);if(m>0){const r=Life.run(cfg,st,'advance_time',{minutes:m});if(r.ok)st=r.state;}};
 const go=to=>{if(loc===to)return;loc=to;moves++;const t=TRAVEL*(0.7+0.6*rnd());
  const units=Math.floor(WALK*t/8);for(let i=0;i<units;i++){const r=Life.run(cfg,st,'walk',{units:1});if(r.ok)st=r.state;}tick(t);};
 const act=(a,args)=>{const r=Life.run(cfg,st,a,args||{});if(r.ok){st=r.state;tick(ANIM_S);}else if(process.env.SIMDEBUG&&dbg++<5)console.error("FAIL",a,r.reason);return r;};let dbg=0;
 const work=job=>{const j=cfg.jobs.find(x=>x.id===job);const m=Life.workMinutes(j.minutes,st.experience);
  if(Life.workBlock(cfg,st,job))return false;real+=m*RSPM;const r=Life.run(cfg,st,'work',{jobId:job});if(r.ok){st=r.state;sessions++;}return r.ok;};
 const siteOf={pak_ogah:'job_pak_ogah',kang_parkir:'job_kang_parkir',manusia_silver:'job_silver'};
 const sleepUntil=(energy,toMorning)=>{go('tent');let guard=0;
  while(guard++<30){
   const hhmm=(st.elapsedMinutes+st.clockOrigin)%1440;
   const morning=toMorning&&!(hhmm>=S.dayStartMinute&&hhmm<S.dayStartMinute+60);
   if(st.energy>=energy&&!morning)break;
   const r=Life.run(cfg,st,'sleep',{});if(!r.ok)break;st=r.state;sleeps++;
   tick(SLEEP==='realtime'?S.sleepMinutes*RSPM:ANIM_S);
  }};
 const needs=()=>{
  if(st.restMinutes>0){while(st.restMinutes>0)tick(15);go('tent');}
  if(st.bladder>=75){go('wc');if(!act('public_toilet',{facilityId:'wc'}).ok)act('wall_pee',{});}
  if(st.fullness<=25&&st.wallet>=S.wartegMealPrice){go('warung');act('eat',{place:'warteg'});}
  if(st.energy<=20){if(st.wallet>=S.coffeePrice+40000&&st.bladder<60&&rnd()<.3){go('warung');act('coffee',{});}else sleepUntil(85,false);}
 };
 const quest=()=>{const rows=H.quests();return rows.find(r=>r.state!=='done');};
 const npcSite={job_pak_ogah:'job_pak_ogah',hansip:'hansip',job_kang_parkir:'job_kang_parkir',loak:'loak',pasar_ikan:'pasar_ikan',job_silver:'job_silver',kost:'kost'};
 let guard=0;
 while(!st.housing.room&&guard++<4000){
  needs();
  const q=quest();
  if(q&&q.state==='available'){go(npcSite[q.npcId]);H.acceptQuest(q.npcId,q.id);tick(ANIM_S);continue;}
  if(q&&q.state==='ready'){go(npcSite[q.npcId]);const t=H.turnInQuest(q.npcId,q.id);tick(ANIM_S);log.push([+(real*(1+OVER)/60).toFixed(1),q.id,st.wallet]);continue;}
  if(q&&q.state==='active'){
   const id=q.id;
   if(id==='q1_makan'){go('warung');if(act('eat',{place:'warteg'}).ok)continue;}
   if(id==='q2_wc'){go('wc');if(act('public_toilet',{facilityId:'wc'}).ok)continue;}
   if(id==='q3_parkir'){go('job_kang_parkir');work('kang_parkir');continue;}
   if(id==='q4_loak'){const n=st.inventory.filter(i=>st.itemMeta[i]?.species==='barang_bekas').length;
    if(n<1){go('scavenge');act('scavenge',{});continue;}go('loak');act('sell_loak',{itemId:st.inventory.find(i=>st.itemMeta[i]?.species==='barang_bekas')});continue;}
   if(id==='q5_mandi'){go('bath');if(act('public_shower',{facilityId:'bath'}).ok)continue;}
   if(id==='q6_ogah'){go('job_pak_ogah');work('pak_ogah');continue;}
   if(id==='q7_ikan'){const fish=st.inventory.filter(i=>['lele','nila','mujair'].includes(st.itemMeta[i]?.species));
    const junk=st.inventory.filter(i=>st.itemMeta[i]?.species==='sapu_sapu');
    // fish.spoilMinutes 180 = 90 real s on the one clock: a normal player sells each catch right away.
    for(const i of st.inventory.slice()){const info=Life.activeItem(cfg,st,i);if(info.ok&&info.fish&&info.spoiled)st=Life.run(cfg,st,'discard_item',{itemId:i}).state;}
    if(fish.length+junk.length<1){go('dock');act('fish',{spotId:'dock',roll:rnd()});continue;}
    const sellable=fish[0]||junk[0];go(fish[0]?'pasar_ikan':'siomay');act('sell_fish',{itemId:sellable,buyerId:fish[0]?'pasar_ikan':'siomay_batagor'});continue;}
   if(id==='q8_silver'){if(st.hygiene<10){go('bath');act('public_shower',{facilityId:'bath'});continue;}go('job_silver');work('manusia_silver');continue;}
   if(id==='q10_kos'&&st.wallet>=S.roomPrice){go('kost');act('buy_room',{});continue;}
  }
  // grind: best job with quota left (Ogah, then Parkir, then Silver when clean enough)
  const order=st.hygiene>=30?['pak_ogah','kang_parkir','manusia_silver']:['pak_ogah','kang_parkir'];
  const job=order.find(j=>!Life.workBlock(cfg,st,j));
  if(job){go(siteOf[job]);let n=0;while(n++<40&&st.energy>20&&st.bladder<75&&(st.fullness>25||(st.wallet<S.wartegMealPrice&&st.fullness>3))&&work(job)){} if(st.hygiene<25){go('bath');act('public_shower',{facilityId:'bath'});}continue;}
  const blocked=order.map(j=>Life.workBlock(cfg,st,j));
  if(blocked.every(b=>/Kuota/.test(b||'')))sleepUntil(60,true);else sleepUntil(85,false);
 }
 if(process.env.SIMDEBUG)console.error(JSON.stringify({q:quest(),inv:st.inventory.map(i=>st.itemMeta[i]?.species),w:st.wallet,e:st.energy,h:st.hygiene,f:st.fullness,b:st.bladder,rest:st.restMinutes,ac:st.actionCounts}));
 return {ok:st.housing.room,realMin:+(real*(1+OVER)/60).toFixed(1),gameDays:+((st.elapsedMinutes+st.clockOrigin)/1440).toFixed(2),
  sessions,sleeps,moves,faints:st.faintCount,log};
}
const res=[];for(let i=0;i<RUNS;i++)res.push(once(1000+i));
const ok=res.filter(r=>r.ok).sort((a,b)=>a.realMin-b.realMin);
const pct=p=>ok.length?ok[Math.min(ok.length-1,Math.floor(p*ok.length))].realMin:null;
const avg=k=>+(ok.reduce((a,r)=>a+r[k],0)/Math.max(1,ok.length)).toFixed(1);
const out={profile:PROFILE,sleep:SLEEP,runs:RUNS,success:ok.length,p10:pct(.1),median:pct(.5),p90:pct(.9),
 gameDays:avg('gameDays'),sessions:avg('sessions'),sleeps:avg('sleeps'),moves:avg('moves'),faints:avg('faints'),
 assumptions:{realSecondsPerGameMinute:RSPM,travelSeconds:TRAVEL,overheadPct:OVER*100,animationSeconds:ANIM_S,walkSpeed:WALK},
 timelineSeed1000:res[0].log};
if(process.argv.includes('--json'))console.log(JSON.stringify(out,null,1));
else{console.log(`${PROFILE} (sleep ${SLEEP}) ${ok.length}/${RUNS} reach kos · p10 ${out.p10} · median ${out.median} · p90 ${out.p90} real min · ${out.gameDays} game days · ${out.sessions} sessions · ${out.sleeps} sleeps · ${out.moves} moves · ${out.faints} faints`);
 console.log('timeline seed 1000:',JSON.stringify(out.timelineSeed1000));}
