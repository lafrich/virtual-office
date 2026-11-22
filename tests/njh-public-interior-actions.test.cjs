'use strict';
// Public interiors (warteg, mart, laundry…): guests are customers so nearby
// actions (Makan, Duduk sebentar, shop) survive Access.filterActions. E / runAction
// no longer requires a street site node ("Dekati lokasi interaksi"). Benches snap
// the player onto the seat. Kost rooms stay owner-only.
const test=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path');
const R=path.join(__dirname,'..');
const Access=require(path.join(R,'world-builder/semesta-room-access.js'));
const Hooks=require(path.join(R,'world-builder/semesta-life-hooks.js'));
const Life=require(path.join(R,'jiwa/life-economy.js'));
const B=require(path.join(R,'shared/njh-balancing.js'));
const harness=require('./helpers/life-play-harness.cjs');

const cfg=()=>Life.normalize(B.applyToLifeConfig(Life.defaults()));
const FILE=require(path.join(R,'content/balancing.json'));
const P=Object.fromEntries(FILE.params.map(p=>[p.key,p.value]));
const read=rel=>require('node:fs').readFileSync(path.join(R,rel),'utf8');

test('FURNITURE_GATES include waiting_bench and plastic_bench; rest is labelled Duduk sebentar',()=>{
 const hooks=read('world-builder/semesta-life-hooks.js');
 assert.match(hooks,/furnitureIds:Object\.freeze\(\['waiting_bench'\]\)/);
 assert.match(hooks,/furnitureIds:Object\.freeze\(\['plastic_bench_red','plastic_bench_blue','plastic_bench'\]\)/);
 assert.match(hooks,/rest:'Duduk sebentar'/);
 const play=read('world-builder/semesta-life-play.js');
 assert.match(play,/const seating=\(action==='rest'\|\|action==='sit'\)/);
 assert.match(play,/function startWorkHold/);
 assert.match(play,/function syncHudToLifeClock/);
});

function hooksAt(opts){
 let st=opts.state||Life.stateFrom({wallet:15000,energy:80,hygiene:50,fullness:40,moral:50,housing:{room:false}},cfg());
 let pos=opts.pos||{x:0,z:0};
 const furniture=opts.furniture||[];
 const extras=opts.extra||[];
 const api=Hooks.create({
  getState:()=>st,setState:s=>{st=s;},getConfig:()=>cfg(),
  getSites:()=>opts.sites||[],getWorld:()=>({objects:[]}),getPos:()=>pos,
  playerId:()=>opts.playerId||'t_guest_1',
  interiorRoomId:()=>opts.roomId||null,interiorKind:()=>opts.kind||null,
  interiorFurniture:()=>furniture,extraActions:()=>extras,
  persist:()=>{},
  runEconomy:(a,args)=>{const r=Life.run(cfg(),st,a,args||{});if(r.ok)st=r.state;return r;}
 });
 return {api,get state(){return st;},set state(v){st=v;},setPos:p=>{pos=p;}};
}

test('nearbyActions inside the Warteg keeps Makan/Ngopi for a guest customer (not filtered to empty)',()=>{
 const extra=[{id:'eat',action:'eat',label:'Makan Warteg',price:12000,args:{place:'warteg',price:12000}},
              {id:'coffee',action:'coffee',label:'Ngopi',price:5000,args:{place:'warteg'}}];
 const h=hooksAt({roomId:'njh_warteg_kharisma',kind:'warteg',extra,pos:{x:1,z:1}});
 const acc=Access.roomAccess('t_guest_1','njh_warteg_kharisma');
 assert.equal(acc.role,'customer');
 const acts=h.api.nearbyActions();
 const ids=acts.map(a=>a.id);
 assert.ok(ids.includes('eat'),ids.join(','));
 assert.ok(ids.includes('coffee'),ids.join(','));
});

test('waiting_bench and plastic_bench inside a public interior offer "Duduk sebentar"',()=>{
 const furniture=[
  {id:'wb-1',assetId:'waiting_bench',kind:'waiting_bench',label:'Bangku Tunggu',x:2,z:2},
  {id:'pb-1',assetId:'plastic_bench_red',kind:'plastic_bench',label:'Bangku Plastik',x:8,z:2}
 ];
 const h=hooksAt({roomId:'njh_laundry',kind:'public',furniture,pos:{x:2,z:2}});
 const near=h.api.nearbyActions().filter(a=>a.id==='rest'||a.id==='sit');
 assert.ok(near.length,JSON.stringify(h.api.nearbyActions()));
 assert.equal(near[0].label,'Duduk sebentar');
 assert.equal(near[0].args.seatId,'wb-1');
 h.setPos({x:8,z:2});
 const plastic=h.api.nearbyActions().filter(a=>a.id==='rest'||a.id==='sit');
 assert.ok(plastic.some(a=>a.args.seatId==='pb-1'),JSON.stringify(plastic));
 assert.ok(plastic.every(a=>a.label==='Duduk sebentar'));
});

test('guest runAction(eat) inside the Warteg deducts Rp12.000 and does not say Dekati lokasi interaksi',()=>{
 const extra=[{id:'eat',action:'eat',label:'Makan Warteg',price:P['food.warteg.price'],
  args:{place:'warteg',price:P['food.warteg.price'],buyerId:'warteg'}}];
 const interiors={
  active:()=>true,kind:()=>'warteg',roomId:()=>'njh_warteg_kharisma',
  extraActions:()=>extra,furniture:()=>[],nearestDoor:()=>null,enterNearby:()=>({ok:false})
 };
 const h=harness({playInteriors:interiors,playerId:'t_guest_1'});
 assert.ok(h.P.start());
 const r=h.P.runAction('eat',{place:'warteg',price:P['food.warteg.price'],buyerId:'warteg'});
 assert.equal(r.ok,true,r.reason);
 assert.equal(h.P.state().wallet,15000-P['food.warteg.price']);
});

test('q1_makan becomes ready after one Warteg meal',()=>{
 const extra=[{id:'eat',action:'eat',label:'Makan Warteg',price:12000,args:{place:'warteg',price:12000,buyerId:'warteg'}}];
 const interiors={
  active:()=>true,kind:()=>'warteg',roomId:()=>'njh_warteg_kharisma',
  extraActions:()=>extra,furniture:()=>[],nearestDoor:()=>null,enterNearby:()=>({ok:false})
 };
 const h=harness({playInteriors:interiors});
 h.P.start();
 const q=h.P.acceptQuest('job_pak_ogah','q1_makan');
 assert.equal(q.ok,true,q.reason);
 const r=h.P.runAction('eat',{place:'warteg',price:12000,buyerId:'warteg'});
 assert.equal(r.ok,true,r.reason);
 const row=(h.P.quests?.()||[]).find(x=>x.id==='q1_makan')||h.P.state().quests?.q1_makan;
 // quests() is on the play API
 const rows=typeof h.P.quests==='function'?h.P.quests():[];
 const q1=rows.find(x=>x.id==='q1_makan');
 assert.ok(q1,JSON.stringify(rows));
 assert.equal(q1.state,'ready');
 assert.ok(q1.progress>=1);
});

test('rest on a laundry waiting_bench snaps the character onto the seat',()=>{
 const furn=[{id:'waiting_bench_1',assetId:'waiting_bench',kind:'waiting_bench',label:'Bangku Tunggu',x:4,z:6}];
 const interiors={
  active:()=>true,kind:()=>'public',roomId:()=>'njh_laundry',
  extraActions:()=>[],furniture:()=>furn,nearestDoor:()=>null,enterNearby:()=>({ok:false})
 };
 const h=harness({playInteriors:interiors,objects:[
  {id:'tenda_hobo_1',name:'Tenda Hobo',type:'prop',asset:'hobo_tent',x:-20,z:-20}
 ]});
 h.P.start();
 h.setPos({x:4,z:6});
 const r=h.P.runAction('rest',{seatId:'waiting_bench_1',x:4,z:6});
 assert.equal(r.ok,true,r.reason);
 // teleport updates the harness position
 const pos=h.bridge.getPosition();
 assert.equal(pos.x,4);
 assert.equal(pos.z,6);
 assert.equal(h.pose()?.name,'sit');
});

test('hold-to-work starts from #gameAction (and from handleAction/E) and completes on tick',()=>{
 const objects=[
  {id:'tenda_hobo_1',name:'Tenda Hobo',type:'prop',asset:'hobo_tent',x:40,z:40},
  {id:'kang_parkir_1',name:'Kang Parkir',type:'npc',x:0,z:0}
 ];
 const h=harness({objects,nowMs:1000});
 h.P.start();
 h.setPos({x:0,z:0});
 const sites=h.P.sites?.()||[];
 // nearest() uses internal sites built from objects
 const ev={target:{id:'gameAction'},pointerId:1,preventDefault(){}};
 const started=h.P.actionDown(ev);
 assert.equal(started,true,'actionDown on #gameAction must start the hold');
 const mid=h.P.workInfo();
 assert.ok(mid&&mid.working,JSON.stringify(mid));
 const wallet0=h.P.state().wallet;
 h.advanceNow(mid.neededMs+50);
 h.P.tick(0.2);
 assert.equal(h.P.workInfo(),null,'hold completes via tick even if rAF is idle');
 assert.ok(h.P.state().wallet>wallet0,'wage paid');
});

test('handleAction at a job also starts the hold (E / AKSI path)',()=>{
 const objects=[
  {id:'tenda_hobo_1',name:'Tenda Hobo',type:'prop',asset:'hobo_tent',x:40,z:40},
  {id:'kang_parkir_1',name:'Kang Parkir',type:'npc',x:0,z:0}
 ];
 const h=harness({objects,nowMs:5000});
 h.P.start();
 h.setPos({x:0,z:0});
 assert.equal(h.P.handleAction(),true);
 assert.ok(h.P.workInfo()?.working);
 h.P.actionUp({});
 assert.equal(h.P.workInfo(),null,'release cancels an unfinished hold');
});
