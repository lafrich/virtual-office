'use strict';
// NJH slice-1.0 balancing: every number the slice uses is read from content/balancing.json.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const R=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(R,rel),'utf8');
const FILE=JSON.parse(read('content/balancing.json'));
const P=Object.fromEntries(FILE.params.map(p=>[p.key,p.value]));
const B=require(path.join(R,'shared/njh-balancing.js'));
const Life=require(path.join(R,'jiwa/life-economy.js'));
const Hooks=require(path.join(R,'world-builder/semesta-life-hooks.js'));
const cfg=()=>Life.normalize(B.applyToLifeConfig(Life.defaults()));
const fresh=c=>Life.stateFrom({},c||cfg());
const run=(c,s,a,args)=>{const r=Life.run(c,s,a,args||{});assert.equal(r.ok,true,a+': '+r.reason);return r.state;};
// Load the loader in a browser-like sandbox with an injected (edited) table.
function loaderWith(mutate){
 const doc=JSON.parse(JSON.stringify(FILE));mutate(doc);
 const win={__NJH_BALANCING_DOC__:doc,console};
 vm.runInNewContext(read('shared/njh-balancing.js'),{window:win,globalThis:win,URL,console});
 return win.NJHBalancing;
}

test('content/balancing.json is the versioned slice-1.0 table and the loader reads it',()=>{
 assert.equal(FILE.version,'slice-1.0');
 assert.equal(FILE.format,'njh-balancing-v1');
 assert.match(FILE.contentRevision,/^slice-1\.0-r\d+$/);
 const info=B.info();
 assert.equal(info.loaded,true);assert.equal(info.version,'slice-1.0');assert.equal(info.params,FILE.params.length);
 // Every mapped key exists in the file (a typo would silently fall back to code defaults).
 for(const [key] of B.SETTINGS_MAP)assert.ok(key in P,'missing in balancing.json: '+key);
 for(const k of ['jobs.dailyWageCapScope','clock.dayStartTime','clock.newGameStartTime','kos.guestRoomIncludesStove','shop.coffeeAt','doors.sliceLocked','fish.weights'])
  assert.ok(k in P,k);
});

test('values come from the file: editing the table changes the runtime config',()=>{
 const L=loaderWith(doc=>{
  const set=(k,v)=>{doc.params.find(p=>p.key===k).value=v;};
  set('kos.price',123456);set('jobs.pak_ogah.wage',4321);set('clock.realSecondsPerGameMinute',0.25);
  set('fish.price.lele.pasar',9999);set('quest.q1_makan.reward',777);set('start.wallet',1);
 });
 const c=Life.normalize(L.applyToLifeConfig(Life.defaults()));
 assert.equal(c.settings.roomPrice,123456);
 assert.equal(c.jobs.find(j=>j.id==='pak_ogah').wage,4321);
 assert.equal(c.settings.realSecondsPerGameMinute,0.25);
 assert.equal(c.fish.find(f=>f.id==='lele').buyers.pasar_ikan,9999);
 assert.equal(L.quests()[0].reward,777);
 assert.equal(Life.stateFrom({},c).wallet,1);
 assert.equal(L.holdMs(16),4000);
 // and the real file gives the slice numbers
 const real=cfg();
 assert.equal(real.settings.roomPrice,P['kos.price']);
 assert.equal(real.settings.realSecondsPerGameMinute,P['clock.realSecondsPerGameMinute']);
});

test('one clock: visual day/night and life clock both run at clock.realSecondsPerGameMinute',()=>{
 const win={NJHBalancing:B};
 vm.runInNewContext(read('world-builder/semesta-daynight.js'),{window:win});
 const D=win.VLSemestaDayNight;
 assert.equal(D.SECONDS_PER_MINUTE,P['clock.realSecondsPerGameMinute']);
 assert.equal(D.DAY_REAL_SECONDS,P['clock.gameMinutesPerDay']*P['clock.realSecondsPerGameMinute']); // 720 s = 12 min
 const clock=D.makeClock({day:1,minute:390});
 clock.tick(30);assert.equal(clock.label(),'07:30','30 real s = 1 game hour');
 assert.equal(cfg().settings.realSecondsPerGameMinute,D.SECONDS_PER_MINUTE,'life tick period == visual rate');
 const play=read('world-builder/semesta-life-play.js');
 assert.match(play,/const period=Math\.max\(\.05,Number\(config\.settings\.realSecondsPerGameMinute\)/);
 assert.doesNotMatch(play,/Math\.max\(1,config\.settings\.realSecondsPerGameMinute/);
 // Without the table the old rates stay (Semesta editor, other apps).
 const bare={};vm.runInNewContext(read('world-builder/semesta-daynight.js'),{window:bare});
 assert.equal(bare.VLSemestaDayNight.DAY_REAL_SECONDS,1440);
 assert.equal(Life.normalize(Life.defaults()).settings.realSecondsPerGameMinute,8);
});

test('new Guest save: Hari 1 06:30, Rp15.000 and start stats from the table',()=>{
 const c=cfg(),s=fresh(c);
 assert.equal(s.wallet,P['start.wallet']);assert.equal(s.energy,P['start.energy']);
 assert.equal(s.fullness,P['start.fullness']);assert.equal(s.hygiene,P['start.hygiene']);
 assert.equal(s.bladder,P['start.bladder']);assert.equal(s.moral,P['start.moral']);
 assert.equal(s.clockOrigin,6*60+30);
 assert.deepEqual(B.clock(),{realSecondsPerGameMinute:.5,gameMinutesPerDay:1440,newGameStartMinute:390,dayStartMinute:360});
 const play=read('world-builder/semesta-life-play.js');
 assert.match(play,/state=RULES\.stateFrom\(saved\|\|\{\},config\)/);
 assert.match(play,/function freshClock\(\)/);
 assert.doesNotMatch(play,/wallet:6000/);
});

test('jobs: per-session pay/costs/minutes and hold time 8/12/20 s from the table',()=>{
 const c=cfg();
 for(const [id,hold] of [['kang_parkir',8000],['pak_ogah',12000],['manusia_silver',20000]]){
  const job=c.jobs.find(j=>j.id===id);
  assert.equal(job.wage,P['jobs.'+id+'.wage']);assert.equal(job.minutes,P['jobs.'+id+'.minutes']);
  assert.equal(job.energyCost,P['jobs.'+id+'.energyCost']);assert.equal(job.hygieneCost,P['jobs.'+id+'.hygieneCost']);
  assert.equal(B.holdMs(Life.workMinutes(job.minutes,0)),hold,id);
  const s0=Object.assign(fresh(c),{energy:80,hygiene:80});
  const r=Life.run(c,s0,'work',{jobId:id});
  assert.equal(r.ok,true);
  assert.equal(r.state.wallet-s0.wallet,job.wage);
  // session cost + passive decay over the session's game minutes
  assert.equal(s0.energy-r.state.energy,job.energyCost+Math.floor(job.minutes/P['needs.passiveEnergyMinutes']));
  assert.equal(s0.hygiene-r.state.hygiene,job.hygieneCost+Math.floor(job.minutes/P['needs.passiveHygieneMinutes']));
  assert.equal(r.state.elapsedMinutes,job.minutes);
  assert.equal(r.state.actionCounts['work:'+id],1);
 }
 // Each job's daily quota = Rp150.000 = 8 game hours at Rp312,5 per game minute.
 for(const id of ['kang_parkir','pak_ogah','manusia_silver']){
  const j=c.jobs.find(x=>x.id===id);
  assert.equal(j.wage/j.minutes,P['jobs.dailyWageCap']/(P['jobs.shiftGameHoursForCap']*60),id);
 }
 const play=read('world-builder/semesta-life-play.js');
 assert.match(play,/BAL\(\)\?\.holdMs\?\.\(sessionMinutes\)/);
});

test('daily wage quota is per job, resets at 06:00, and the 31st Parkir session is refused',()=>{
 const c=cfg();
 let s=Object.assign(fresh(c),{energy:100,hygiene:100});
 let earned=0;
 for(let i=0;i<30;i++){s.energy=100;const before=s.wallet;s=run(c,s,'work',{jobId:'kang_parkir'});earned+=s.wallet-before;}
 assert.equal(earned,P['jobs.dailyWageCap']);
 s.energy=100;
 const no=Life.run(c,s,'work',{jobId:'kang_parkir'});
 assert.equal(no.ok,false);
 assert.equal(no.reason,'Kuota Kang Parkir hari ini habis. Buka lagi besok 06:00.');
 assert.equal(Life.workBlock(c,s,'kang_parkir'),no.reason);
 // another job still pays today (per_job scope)
 const ogah=Life.run(c,s,'work',{jobId:'pak_ogah'});assert.equal(ogah.ok,true);
 // after the 06:00 boundary the quota is open again
 const day=Life.wageDay(c.settings,s);
 const mins=(day+1)*1440+c.settings.dayStartMinute-s.clockOrigin-s.elapsedMinutes;
 s=run(c,s,'advance_time',{minutes:Math.min(100000,mins)});
 s.energy=100;s.restMinutes=0;s.fullness=80;
 assert.equal(Life.workBlock(c,s,'kang_parkir'),null);
});

test('premium work frozen; requirement 60 checked only when a session starts',()=>{
 const c=cfg(),pre=c.jobs.find(j=>j.id==='kantor_premium');
 assert.equal(pre.enabled,P['jobs.kantor_premium.enabled']);assert.equal(pre.minHygiene,P['jobs.kantor_premium.minHygiene']);
 const r=Life.run(c,Object.assign(fresh(c),{hygiene:100}),'work',{jobId:'kantor_premium'});
 assert.equal(r.ok,false);assert.equal(r.reason,'Belum buka');
});

test('needs, food, facilities, sleep, loak and fish follow the table',()=>{
 const c=cfg(),S=c.settings;
 let s=fresh(c);
 // warteg / gorengan / coffee
 let r=Life.run(c,Object.assign(fresh(c),{fullness:10,energy:50,bladder:0}),'eat',{place:'warteg'});
 assert.equal(r.state.fullness,10+P['food.warteg.fullness']);assert.equal(r.state.bladder,P['food.warteg.bladder']);
 assert.equal(r.state.wallet,P['start.wallet']-P['food.warteg.price']);
 r=Life.run(c,Object.assign(fresh(c),{fullness:10,bladder:0}),'eat',{});
 assert.equal(r.state.fullness,10+P['food.gorengan.fullness']);assert.equal(r.state.wallet,P['start.wallet']-P['food.gorengan.price']);
 r=Life.run(c,Object.assign(fresh(c),{energy:50,bladder:0}),'coffee',{});
 assert.equal(r.state.energy,50+P['food.coffee.energy']);assert.equal(r.state.bladder,P['food.coffee.bladder']);
 // WC umum Rp2.000, mandi umum Rp4.000 +35
 r=Life.run(c,fresh(c),'public_toilet',{facilityId:'wc'});
 assert.equal(r.state.wallet,P['start.wallet']-P['facility.publicToilet.price']);assert.equal(r.state.bladder,0);
 r=Life.run(c,fresh(c),'public_shower',{facilityId:'bath'});
 assert.equal(r.state.wallet,P['start.wallet']-P['facility.publicShower.price']);
 // tent sleep hygiene -2, energy +30
 r=Life.run(c,Object.assign(fresh(c),{energy:40,hygiene:50}),'sleep',{});
 assert.equal(r.state.energy,40+P['sleep.tent.energy']);
 assert.equal(50-r.state.hygiene,Math.abs(P['sleep.tent.hygiene'])+Math.floor(P['sleep.actionMinutes']/P['needs.passiveHygieneMinutes']));
 // loak Rp4.000
 s=run(c,fresh(c),'scavenge',{});const item=s.inventory[0];
 r=Life.run(c,s,'sell_loak',{itemId:item});assert.equal(r.state.wallet-s.wallet,P['scavenge.sellLoakPrice']);
 // fish v2.1 prices (Pasar Ikan rejects sapu-sapu)
 for(const f of ['lele','nila','mujair']){
  assert.equal(c.fish.find(x=>x.id===f).buyers.pasar_ikan,P['fish.price.'+f+'.pasar']);
  assert.equal(c.fish.find(x=>x.id===f).buyers.siomay_batagor,P['fish.price.'+f+'.siomay']);
 }
 assert.equal(c.fish.find(x=>x.id==='sapu_sapu').buyers.pasar_ikan,null);
 assert.equal(S.fishEnergy,P['fish.energy']);
 // passive decay for one game hour
 s=Object.assign(fresh(c),{energy:80,fullness:80,bladder:0,hygiene:80});
 s=run(c,s,'advance_time',{minutes:60});
 assert.equal(80-s.energy,Math.floor(60/P['needs.passiveEnergyMinutes']));
 assert.equal(80-s.hygiene,Math.floor(60/P['needs.passiveHygieneMinutes']));
 // toilet accident: hygiene -20, no moral penalty (decision)
 r=Life.run(c,Object.assign(fresh(c),{bladder:99,moral:50,hygiene:60}),'coffee',{});
 assert.equal(r.state.moral,50);assert.equal(P['needs.bladderAccident.moral'],0);
 assert.ok(r.changes.some(x=>/KENCING DI CELANA · hygiene -20$/.test(x)));
});

test('faint: 240 game min bed rest (= 2 real min) and wallet -10% capped at Rp20.000',()=>{
 const c=cfg();
 assert.equal(P['faint.restMinutes']*P['clock.realSecondsPerGameMinute'],120);
 let r=Life.run(c,Object.assign(fresh(c),{energy:3,hygiene:90,wallet:50000}),'work',{jobId:'pak_ogah'});
 assert.equal(r.ok,true);assert.equal(r.state.restMinutes,P['faint.restMinutes']);
 const wage=P['jobs.pak_ogah.wage'],loss=Math.floor((50000+wage)*0.10);
 assert.equal(r.state.wallet,50000+wage-loss);assert.equal(r.faintLoss,loss);
 assert.equal(r.state.actionCounts.workEarn,wage,'wage row is not netted against the loss');
 assert.ok(r.state.transactions.some(t=>t.action==='faint'&&t.delta===-loss));
 r=Life.run(c,Object.assign(fresh(c),{energy:3,hygiene:90,wallet:900000}),'work',{jobId:'pak_ogah'});
 assert.equal(r.faintLoss,P['faint.moneyLossMax']);
});

test('kos Rp750.000 one-time, permanent, and the Guest room includes a stove',()=>{
 const c=cfg();
 const r=Life.run(c,Object.assign(fresh(c),{wallet:P['kos.price']}),'buy_room',{});
 assert.equal(r.ok,true);assert.equal(r.state.wallet,0);assert.equal(r.state.housing.room,true);
 assert.ok(r.state.furniture.includes('stove'));
 assert.equal(Life.run(c,r.state,'buy_room',{}).ok,false);
});

function hooksHarness(state,c){
 let st=state;
 const sites=[{id:'job_pak_ogah',jobId:'pak_ogah',x:0,z:0},{id:'hansip',x:5,z:0},{id:'job_kang_parkir',jobId:'kang_parkir',x:10,z:0},
  {id:'loak',x:15,z:0},{id:'pasar_ikan',x:20,z:0},{id:'job_silver',jobId:'manusia_silver',x:25,z:0},{id:'kost',x:30,z:0},{id:'warung',x:35,z:0}];
 let pos={x:0,z:0};
 const ctx={getState:()=>st,setState:x=>{st=x;},getSites:()=>sites,getWorld:()=>({objects:[]}),getPos:()=>pos,
  getConfig:()=>c,questTable:B.quests(),coffeeAtWarteg:B.coffeeAt()==='warteg',persist:()=>{},
  runEconomy:(a,args)=>{const r=Life.run(c,st,a,args||{});if(r.ok)st=r.state;return r;}};
 return {api:Hooks.create(ctx),get state(){return st;},set state(v){st=v;},setPos:p=>{pos=p;}};
}

test('10 data-driven quests from the table; empty save starts at quest 1, rewards total Rp114.000',()=>{
 const qs=B.quests();
 assert.deepEqual(qs.map(q=>q.id),['q1_makan','q2_wc','q3_parkir','q4_loak','q5_mandi','q6_ogah','q7_ikan','q8_silver','q9_tabungan','q10_kos']);
 for(const q of qs)assert.equal(q.reward,P['quest.'+q.id+'.reward']);
 assert.equal(qs.reduce((a,q)=>a+q.reward,0),114000);
 assert.equal(qs[9].goal,'Bayar kos Rp750.000');
 const c=cfg(),h=hooksHarness(fresh(c),c);
 const rows=h.api.quests();
 assert.equal(rows[0].state,'available');
 assert.ok(rows.slice(1).every(r=>r.state==='locked'));
 assert.deepEqual(h.api.questMarkers(),[{npcId:'job_pak_ogah',state:'available'}]);
 // Pak Ogah offers q1 first (not q6), locked quests cannot be accepted
 assert.equal(h.api.acceptQuest('hansip').ok,false);
 assert.equal(h.api.acceptQuest('job_pak_ogah').id,'q1_makan');
 h.state=Life.run(c,h.state,'eat',{place:'warteg'}).state;
 const t=h.api.turnInQuest('job_pak_ogah');
 assert.equal(t.ok,true);assert.equal(t.reward,P['quest.q1_makan.reward']);
 assert.equal(h.api.quests()[1].state,'available');
 // q3 counts only Kang Parkir sessions
 h.state.quests.q2_wc={id:'q2_wc',state:'done'};
 assert.equal(h.api.acceptQuest('job_kang_parkir').id,'q3_parkir');
 h.state.energy=100;h.state=Life.run(c,h.state,'work',{jobId:'pak_ogah'}).state;
 assert.equal(h.api.quests()[2].progress,0);
 for(let i=0;i<3;i++){h.state.energy=100;h.state=Life.run(c,h.state,'work',{jobId:'kang_parkir'}).state;}
 assert.equal(h.api.quests()[2].state,'ready');
 // q9 = total wage since the start (not since accepting)
 assert.equal(qs[8].kind,'earn');assert.equal(qs[8].scope,'total');assert.equal(qs[8].target,450000);
 // Pak Ogah's second quest is q6 once q1 is done
 for(const id of ['q3_parkir','q4_loak','q5_mandi'])h.state.quests[id]={id,state:'done'};
 assert.equal(h.api.acceptQuest('job_pak_ogah').id,'q6_ogah');
});

test('Warung Kopi locked "Belum buka" (no interior request) and coffee sold at the Warteg',()=>{
 assert.deepEqual(B.lockedTemplates(),['njh_warung_kopi']);
 const win={NJHBalancing:B,document:null,location:{href:'http://x/world-builder/'}};
 const src=read('world-builder/njh-map-preview.js');
 assert.match(src,/const sliceLocked=sliceLockedTemplates\(\)\.includes\(template\)/);
 assert.match(src,/NJH_READY\.filter\(id=>!locked\.has\(id\)\)/);
 // wireDoors with the real meta: warung kopi stays pending even if a scene is supplied
 vm.runInNewContext(src,{window:win,globalThis:win,URL,console,setTimeout,fetch:()=>Promise.reject(Error('no fetch'))});
 const P2=win.VLNjhMapPreview;
 assert.ok(P2&&P2.wireDoors,'VLNjhMapPreview loaded');
 {
  const meta=JSON.parse(read('world-builder/njh-map-preview/njh-map-meta.json'));
  const door=meta.doors.find(d=>d.interiorTemplate==='njh_warung_kopi');
  const doc={objects:[{id:door.objectId,x:0,z:0}]};
  const rep=P2.wireDoors(doc,{doors:[door]},{njh_warung_kopi:{id:'x',width:8,depth:6,items:[]}});
  assert.equal(rep.pending.length,1);assert.equal(doc.objects[0].njhInteriorPending,true);
  assert.equal(P2.isClosedDoor(doc.objects[0]),true);
  // tooltip / E toast path: closedDoorsNear reports "Belum buka" at the door's use point
  const u=doc.objects[0].njhUsePoint;
  const near=P2.closedDoorsNear(doc.objects,u.x,u.z,1.25);
  assert.equal(near.length,1);assert.equal(near[0].reason,'Belum buka');assert.equal(P2.BELUM_BUKA,'Belum buka');
 }
 {
  // Without the slice lock the same door with a scene would open (proves the lock comes from the table)
  const meta=JSON.parse(read('world-builder/njh-map-preview/njh-map-meta.json'));
  const door=meta.doors.find(d=>d.interiorTemplate==='njh_warung_kopi');
  const win2={NJHBalancing:{ok:()=>true,lockedTemplates:()=>[]},document:null,location:{href:'http://x/world-builder/'}};
  vm.runInNewContext(src,{window:win2,globalThis:win2,URL,console,setTimeout,fetch:()=>Promise.reject(Error('no fetch'))});
  const doc={objects:[{id:door.objectId,x:0,z:0}]};
  const rep=win2.VLNjhMapPreview.wireDoors(doc,{doors:[door]},{njh_warung_kopi:{id:'x',width:8,depth:6,items:[]}});
  assert.equal(rep.wired.length,1);assert.equal(win2.VLNjhMapPreview.isClosedDoor(doc.objects[0]),false);
 }
 const c=cfg(),h=hooksHarness(fresh(c),c);
 h.setPos({x:35,z:0});
 const acts=h.api.nearbyActions().map(a=>a.id);
 assert.ok(acts.includes('eat')&&acts.includes('coffee'),acts.join(','));
 const play=read('world-builder/semesta-life-play.js');
 assert.match(play,/coffee:coffeeAtWarteg\(\)\?'warung':'coffee'/);
 assert.match(play,/filter\(s=>!\(s\.id==='coffee'&&coffeeAtWarteg\(\)\)\)/);
 assert.match(read('world-builder/njh-play-interiors.js'),/B\.coffeeAt\(\)==='warteg'/);
});

test('world-builder loads the balancing loader before life-economy and day/night (one ?v tag)',()=>{
 const html=read('world-builder/index.html');
 const iB=html.indexOf('../shared/njh-balancing.js?v=njh-balancing-r4b-20261122');
 assert.ok(iB>0);
 assert.ok(iB<html.indexOf('../jiwa/life-economy.js?v=njh-balancing-r4b-20261122'));
 assert.ok(iB<html.indexOf('./semesta-daynight.js?v=njh-balancing-r4b-20261122'));
 assert.match(read('sw.js'),/^\/\* sw v44 /);
});
