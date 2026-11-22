'use strict';
// NJH slice-1.0 r2 (New Bot decisions on e27e395): timed sleep, fish rot 720, hunger -5/h,
// one time source for the fishing minigame, and no softlock from Rp0 / hygiene 0.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const R=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(R,rel),'utf8');
const FILE=JSON.parse(read('content/balancing.json'));
const P=Object.fromEntries(FILE.params.map(p=>[p.key,p.value]));
const B=require(path.join(R,'shared/njh-balancing.js'));
const Life=require(path.join(R,'jiwa/life-economy.js'));
const Hooks=require(path.join(R,'world-builder/semesta-life-hooks.js'));
const harness=require('./helpers/life-play-harness.cjs');
const cfg=()=>Life.normalize(B.applyToLifeConfig(Life.defaults()));
const SPM=P['clock.realSecondsPerGameMinute'];
const ticks=(h,seconds)=>{for(let t=0;t<seconds-1e-9;t+=0.1)h.P.tick(0.1);};
const untilHours=(h,n)=>{let t=0;while(h.P.sleepInfo()&&h.P.sleepInfo().hours<n&&t<600){h.P.tick(0.05);t+=0.05;}};
const untilAwake=(h,cap)=>{let t=0;while(h.P.sleepInfo()&&t<cap){h.P.tick(0.1);t+=0.1;}return t;};
const hhmm=s=>((s.elapsedMinutes+s.clockOrigin)%1440+1440)%1440;

test('sleep runs 60 game minutes on the normal clock (30 s real) with a progress bar, not instantly',()=>{
 const h=harness();assert.ok(h.P.start());
 const s0=h.P.state();s0.energy=20;const e0=s0.energy,t0=s0.elapsedMinutes,hy0=s0.hygiene,vis0=h.clock().minute;
 const r=h.P.runAction('sleep',{});
 assert.equal(r.ok,true);assert.equal(r.sleeping,true);
 assert.equal(r.neededMs,P['sleep.actionMinutes']*SPM*1000); // 30 000 ms from the table
 assert.equal(h.P.state().elapsedMinutes,t0,'no instant jump');
 ticks(h,r.neededMs/1000/2);
 const mid=h.P.sleepInfo();assert.ok(mid&&mid.pct>0.45&&mid.pct<0.55,JSON.stringify(mid));
 assert.equal(h.P.state().elapsedMinutes,t0,'passive tick paused while the sleep carries its minutes');
 ticks(h,r.neededMs/1000/2+0.05);
 const s=h.P.state();
 assert.equal(h.P.sleepInfo(),null,'single sleep ends after one hour');
 assert.equal(s.elapsedMinutes,t0+P['sleep.actionMinutes']);
 assert.equal(s.energy,Math.min(100,e0+P['sleep.tent.energy']));
 // tent hygiene -2 plus the passive hygiene drain of that hour, counted once
 assert.equal(s.hygiene,hy0+P['sleep.tent.hygiene']-Math.floor(60/P['needs.passiveHygieneMinutes']));
 assert.equal(h.clock().minute,hhmm(s),'HUD clock matches the life clock after manual sleep');
});

test('wake anytime: minutes and recovery are pro rata; moving also wakes',()=>{
 const h=harness();h.P.start();
 const s0=h.P.state();s0.energy=20;const t0=s0.elapsedMinutes;
 h.P.runAction('sleep',{});ticks(h,15);
 const w=h.P.runAction('wake');
 assert.equal(w.woke,true);assert.equal(w.minutes,30);
 assert.equal(h.P.state().elapsedMinutes,t0+30);
 assert.equal(h.P.state().energy,20+Math.floor(P['sleep.tent.energy']*30/60));
 h.P.runAction('sleep',{});ticks(h,5);
 h.setPos({x:1,z:0});h.P.tick(0.1);
 assert.equal(h.P.sleepInfo(),null,'moving wakes the player');
});

test('"Tidur sampai pagi" ALWAYS continues to 06:00 (energy caps at max, no early stop, no quota condition)',()=>{
 const h=harness();h.P.start();
 // 04:00, energy 10 -> 2 hours, ends exactly 06:00
 let s=h.P.state();s.energy=10;s.clockOrigin=4*60-s.elapsedMinutes;
 const r=h.P.runAction('sleep_until_morning',{});assert.equal(r.ok,true);assert.equal(r.untilMorning,true);
 untilAwake(h,20*30);
 s=h.P.state();
 assert.equal(h.P.sleepInfo(),null);
 assert.equal(hhmm(s),6*60);
 assert.equal(s.energy,10+2*P['sleep.tent.energy']);
 // 22:00, energy 10: energy is full after 3 hours but sleep goes on to 06:00 (8 hours), energy capped at 100
 s.energy=10;s.clockOrigin=22*60-s.elapsedMinutes;
 let t0=s.elapsedMinutes;
 h.P.runAction('sleep_until_morning',{});
 for(let i=0;i<5;i++){untilHours(h,i+1);}
 assert.ok(h.P.sleepInfo(),'still asleep after energy is full (5 h)');
 assert.equal(h.P.state().energy,100);
 untilAwake(h,20*30);
 s=h.P.state();
 assert.equal(hhmm(s),6*60);assert.equal(s.elapsedMinutes-t0,8*60);assert.equal(s.energy,100);
 // full energy at the start is no reason to refuse; started at 22:30 the last chunk is 30 min and ends at 06:00
 s.energy=100;s.clockOrigin=(22*60+30)-s.elapsedMinutes;t0=s.elapsedMinutes;
 assert.equal(h.P.runAction('sleep_until_morning',{}).ok,true);
 untilAwake(h,20*30);
 s=h.P.state();
 assert.equal(hhmm(s),6*60);assert.equal(s.elapsedMinutes-t0,7*60+30);assert.equal(s.energy,100);
 // at exactly 06:00 there is nothing to sleep to
 assert.equal(h.P.runAction('sleep_until_morning',{}).ok,false);
 // Bangun stops it anytime
 s.clockOrigin=23*60-s.elapsedMinutes;h.P.runAction('sleep_until_morning',{});untilHours(h,2);
 assert.equal(h.P.runAction('wake').woke,true);assert.equal(h.P.sleepInfo(),null);
 // offered next to the tent sleep in the action list
 const acts=h.P.nearbyActions().map(a=>a.id);
 assert.ok(acts.includes('sleep')&&acts.includes('sleep_until_morning'),acts.join(','));
 h.P.runAction('sleep',{});
 assert.equal(h.P.nearbyActions().map(a=>a.id).filter(a=>/sleep|wake/.test(a)).join(','),'wake');
 h.P.runAction('wake');
});

test('fish rot is 720 game minutes and hunger drain (-2 every needs.passiveFullnessMinutes) both come from the table',()=>{
 assert.equal(P['fish.spoilMinutes'],720);
 const c=cfg();
 assert.ok(c.fish.every(f=>f.spoilMinutes===720));
 let s=Life.stateFrom({},c);
 s=Life.run(c,s,'fish',{spotId:'dock',roll:.9}).state;
 assert.equal(s.itemMeta[s.inventory[0]].expiresAt-s.elapsedMinutes,720-0);
 // r2 set -2 every 24 min (-5/h); r3 (New Bot lever L2) moved it to -2 every 30 min (-4/h). Always from the table.
 const every=P['needs.passiveFullnessMinutes'];
 assert.equal(c.settings.passiveFullnessMinutes,every);
 const f0=Life.stateFrom({},c);
 const f2=Life.run(c,f0,'advance_time',{minutes:120}).state;
 assert.equal(f0.fullness-f2.fullness,Math.floor(120/every)*2);
});

test('fishing minigame: one time source (live clock), fish_catch only adds the minutes still owed',()=>{
 const fishMinutes=cfg().settings.fishMinutes;
 { // long minigame: 20 s real = 40 game min already ticked -> catch adds 0
  const h=harness();h.P.start();const t0=h.P.state().elapsedMinutes,v0=h.clock().minute;
  assert.equal(h.P.fishStart().ok,true);
  ticks(h,20);
  const r=h.P.fishInput('cancel');assert.equal(r.done,true);
  assert.equal(h.P.state().elapsedMinutes,t0+20/SPM,'no extra '+fishMinutes+' minutes on top of the minigame');
  assert.equal(h.clock().minute,v0,'HUD not jumped');
 }
 { // short minigame: 2 s = 4 min -> catch owes the rest, HUD jumps by the same remainder
  const h=harness();h.P.start();const t0=h.P.state().elapsedMinutes,v0=h.clock().minute;
  h.P.fishStart();ticks(h,2);h.P.fishInput('cancel');
  assert.equal(h.P.state().elapsedMinutes,t0+fishMinutes);
  assert.equal(h.clock().minute,v0+fishMinutes-2/SPM);
 }
 // the rule itself still charges full fishMinutes without the minigame argument
 const c=cfg();const s=Life.stateFrom({},c);
 assert.equal(Life.run(c,s,'fish_catch',{gotAway:true}).state.elapsedMinutes,s.elapsedMinutes+fishMinutes);
});

function questHarness(state,c){
 let st=state,pos={x:0,z:0};
 const sites=[{id:'scavenge',x:0,z:0},{id:'loak',x:5,z:0},{id:'public_bath',x:10,z:0},{id:'job_kang_parkir',jobId:'kang_parkir',x:15,z:0},{id:'tent',x:20,z:0}];
 const ctx={getState:()=>st,setState:x=>{st=x;},getSites:()=>sites,getWorld:()=>({objects:[]}),getPos:()=>pos,
  getConfig:()=>c,questTable:B.quests(),persist:()=>{},
  runEconomy:(a,args)=>{const r=Life.run(c,st,a,args||{});if(r.ok)st=r.state;return r;}};
 return {api:Hooks.create(ctx),get state(){return st;},set state(v){st=v;},setPos:p=>{pos=p;}};
}

test('no softlock: from Rp0 and hygiene 0, Mulung -> Babeh Loak pays for the shower and quest 5 completes',()=>{
 const c=cfg();
 const loak=P['scavenge.sellLoakPrice'],shower=P['facility.publicShower.price'];
 assert.equal(c.settings.loakPrice,loak);assert.equal(c.settings.publicShowerFee,shower);
 let s=Life.stateFrom({},c);
 s.wallet=0;s.hygiene=0;s.energy=60;s.quests={};
 for(const id of ['q1_makan','q2_wc','q3_parkir','q4_loak'])s.quests[id]={id,state:'done'};
 const h=questHarness(s,c);
 assert.equal(h.api.acceptQuest('job_kang_parkir').id,'q5_mandi');
 let row=h.api.quests().find(q=>q.id==='q5_mandi');
 assert.equal(row.state,'active');
 assert.equal(row.hint,'Belum cukup uang? Mulung dulu, jual ke Babeh Loak.');
 assert.equal(Life.run(c,h.state,'public_shower',{facilityId:'bath'}).ok,false,'cannot pay the shower at Rp0');
 let guard=0;
 while(h.state.hygiene<row.target&&guard++<20){
  let r=Life.run(c,h.state,'scavenge',{});assert.equal(r.ok,true,'mulung needs no capital: '+r.reason);h.state=r.state;
  const item=h.state.inventory.find(i=>h.state.itemMeta[i].species==='barang_bekas');
  r=Life.run(c,h.state,'sell_loak',{itemId:item});assert.equal(r.ok,true,r.reason);h.state=r.state;
  if(h.state.wallet>=shower){r=Life.run(c,h.state,'public_shower',{facilityId:'bath'});assert.equal(r.ok,true,r.reason);h.state=r.state;}
 }
 row=h.api.quests().find(q=>q.id==='q5_mandi');
 assert.equal(row.state,'ready');assert.equal(row.hint,undefined);
 const w=h.state.wallet;
 assert.equal(h.api.turnInQuest('job_kang_parkir','q5_mandi').ok,true);
 assert.equal(h.state.wallet,w+P['quest.q5_mandi.reward']);
});

test('total bankruptcy is recoverable: Rp0 + faint -> bed rest -> can still mulung',()=>{
 const c=cfg();
 let s=Life.stateFrom({},c);s.wallet=0;s.energy=2;s.hygiene=0;
 assert.equal(Life.run(c,s,'scavenge',{}).ok,false,'too tired to mulung');
 // energy drains to 0 -> faint (wallet -10% of 0 = 0), bed rest from the table, energy recovers
 let guard=0;while(!s.faintCount&&guard++<50)s=Life.run(c,s,'advance_time',{minutes:15}).state;
 assert.equal(s.faintCount,1);assert.equal(s.wallet,0);
 assert.equal(s.restMinutes>0,true);
 guard=0;while(s.restMinutes>0&&guard++<50)s=Life.run(c,s,'advance_time',{minutes:15}).state;
 assert.ok(s.energy>=P['faint.recoveryEnergy']-1,String(s.energy));
 const r=Life.run(c,s,'scavenge',{});assert.equal(r.ok,true,r.reason);
 const id=r.state.inventory.find(i=>r.state.itemMeta[i].species==='barang_bekas');
 assert.equal(Life.run(c,r.state,'sell_loak',{itemId:id}).state.wallet,P['scavenge.sellLoakPrice']);
});

test('quest window prefers the NPC\'s current quest and shows the hint',()=>{
 const mock=read('mainkan/njh98-mock.js');
 assert.match(mock,/rows\.find\(x=>\['active','ready','available'\]\.includes\(x\.state\)\)/);
 assert.match(mock,/hq\.hint/);
 const q5=B.quests().find(q=>q.id==='q5_mandi');
 assert.equal(q5.hint.walletBelow,P['facility.publicShower.price']);
});

test('after Tidur sampai pagi the HUD clock (time + day) matches the life clock, including a 04:16 start',()=>{
 const h=harness();h.P.start();
 let s=h.P.state();
 s.energy=20;s.clockOrigin=(4*60+16)-s.elapsedMinutes;
 const vis=h.clock();vis.minute=4*60+16;vis.day=1;
 const r=h.P.runAction('sleep_until_morning',{});assert.equal(r.ok,true);
 untilAwake(h,20*30);
 s=h.P.state();
 assert.equal(h.P.sleepInfo(),null);
 assert.equal(hhmm(s),6*60,'life clock is 06:00');
 assert.equal(h.clock().minute,6*60,'HUD clock is 06:00, not stuck at 04:16');
 assert.ok(h.clock().day>=1);
 // manual 1-hour sleep also syncs the HUD (starts 22:00 -> 23:00)
 s.clockOrigin=22*60-s.elapsedMinutes;
 const t0=s.elapsedMinutes;
 h.clock().minute=22*60;h.clock().day=1;
 // restore via the clock API so later sync sees 22:00
 h.P.runAction('sleep',{});
 untilAwake(h,40);
 s=h.P.state();
 assert.equal(s.elapsedMinutes,t0+60);
 assert.equal(hhmm(s),23*60);
 assert.equal(h.clock().minute,23*60,'HUD follows manual sleep too');
});
