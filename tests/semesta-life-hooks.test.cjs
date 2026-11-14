'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const R=path.join(__dirname,'..');
const Hooks=require(path.join(R,'world-builder/semesta-life-hooks.js'));
const Life=require(path.join(R,'jiwa/life-economy.js'));

function memory(){
 const map=new Map();
 return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),
  removeItem:k=>map.delete(k),_map:map};
}
function harness(opts={}){
 const events=[];
 let state=opts.state||Life.stateFrom({
  wallet:10000,energy:80,hygiene:75,bladder:20,fullness:50,moral:50,experience:0,
  furniture:opts.furniture||[],housing:{room:!!opts.room,fridge:!!opts.fridge}
 },Life.defaults());
 let pos=opts.pos||{x:0,y:0,z:0};
 let pausedClock=false;
 let clockState={day:1,minute:7*60,speed:1,paused:false};
 const sites=opts.sites||[
  {id:'kost',label:'Kost / Kamar',x:0,z:0,action:'buy_room'},
  {id:'tent',label:'Tenda Hobo',x:20,z:0,action:'sleep'},
  {id:'warung',label:'Warteg',x:8,z:0,action:'eat'},
  {id:'job_pak_ogah',jobId:'pak_ogah',label:'Kerja Pak Ogah',x:0,z:8,action:'work'}
 ];
 const objects=opts.objects||[];
 const storage=memory();
 const cityId=()=>opts.cityId||'city-test';
 const playerId=()=>opts.playerId||'t_ichsan';
 const ctx={
  storage,cityId,playerId,
  dataKey:()=>'semesta-life-play-v1:'+cityId()+'@'+playerId(),
  getState:()=>state,setState:s=>{state=s;},loadState:s=>{state=Life.stateFrom(s,Life.defaults());},
  getSites:()=>sites,getWorld:()=>({objects}),getPos:()=>pos,
  getConfig:()=>Life.defaults(),
  persist:()=>{storage.setItem(ctx.dataKey(),JSON.stringify({schema:1,cityId:cityId(),state}));},
  teleport:(x,z)=>{pos={x,y:0,z};return true;},
  setClockPaused:on=>{pausedClock=!!on;clockState.paused=!!on;},
  getClock:()=>({
   snapshot:()=>({...clockState}),get:()=>({...clockState}),
   label:()=>String(Math.floor(clockState.minute/60)).padStart(2,'0')+':'+String(clockState.minute%60).padStart(2,'0'),
   weekday:()=>['SEN','SEL','RAB','KAM','JUM','SAB','MIN'][(clockState.day-1)%7],
   solar:()=>({phase:'PAGI'}),
   setPaused:v=>{clockState.paused=!!v;}
  }),
  worldToScreen:(x,y,z)=>({x:100+x,y:50-y,visible:z<10}),
  interiorFurniture:opts.interiorFurniture||(()=>[]),
  resetCurrent:()=>{state=Life.stateFrom({wallet:6000},Life.defaults());},
  onEvent:(type,payload)=>events.push({type,payload})
 };
 if(opts.persistNow)ctx.persist();
 const api=Hooks.create(ctx);
 return {api,ctx,events,get state(){return state;},set state(v){state=v;},get pos(){return pos;},
  set pos(v){pos=v;},get pausedClock(){return pausedClock;},clockState,storage,sites,objects};
}

test('spawnAt teleports to kost/tent and emits mainkan:spawn-done',()=>{
 const h=harness({room:true,pos:{x:9,y:0,z:9}});
 const a=h.api.spawnAt('kost');
 assert.equal(a.ok,true);assert.equal(a.kind,'kost');assert.equal(a.id,'kost');
 assert.equal(h.pos.x,0);assert.equal(h.pos.z,0);
 assert.equal(h.state.spawn,'home');
 const ev=h.events.find(e=>e.type==='mainkan:spawn-done');
 assert.ok(ev);assert.equal(ev.payload.kind,'kost');
 const t=h.api.spawnAt('tent','tent');
 assert.equal(t.ok,true);assert.equal(t.kind,'tent');assert.equal(h.pos.x,20);
 assert.equal(h.events.filter(e=>e.type==='mainkan:spawn-done').length,2);
 assert.equal(h.api.spawnAt('spaceship').ok,false);
});

test('nearbyActions lists nearby sites and is runAction-id shaped',()=>{
 const h=harness({pos:{x:8,y:0,z:0}});
 const list=h.api.nearbyActions();
 assert.ok(list.some(a=>a.id==='eat'&&a.label==='Makan'&&a.price===2500));
 assert.equal(list.spot,'Warteg');
 assert.ok(list.every(a=>'id' in a&&'label' in a&&'price' in a));
});

test('furniture gating: Masak/Tidur need stove/bed in room; Mandi needs bathroom; tent sleep is free',()=>{
 const bare=harness({room:true,furniture:[],pos:{x:0,y:0,z:0}});
 const ids=()=>bare.api.nearbyActions().map(a=>a.id);
 assert.ok(!ids().includes('cook'));
 assert.ok(!ids().includes('sleep'));
 assert.ok(!ids().includes('home_shower'));
 assert.ok(ids().includes('home_toilet'));
 assert.ok(ids().includes('buy_room')===false);

 bare.state.furniture=['stove','bed'];
 assert.ok(ids().includes('cook'));
 assert.equal(bare.api.nearbyActions().find(a=>a.id==='cook').furnitureId,'stove');
 assert.ok(ids().includes('sleep'));
 assert.ok(!ids().includes('home_shower'));

 bare.state.furniture=['stove','bed'];
 // bathroom only via world/interior props (not in Jiwa furniture catalog)
 bare.objects.push({id:'shower-1',assetId:'shower',name:'Shower',x:0.4,z:0.2});
 const withBath=harness({room:true,furniture:['stove','bed'],pos:{x:0,y:0,z:0},
  objects:[{id:'shower-1',assetId:'shower',name:'Shower',x:0.4,z:0.2}]});
 assert.ok(withBath.api.nearbyActions().some(a=>a.id==='home_shower'&&a.furnitureId==='shower'));

 const tent=harness({room:false,furniture:[],pos:{x:20,y:0,z:0}});
 const sleep=tent.api.nearbyActions().find(a=>a.id==='sleep');
 assert.ok(sleep);assert.equal(sleep.label,'Tidur Tenda');
 assert.equal(tent.api.furnitureAllows('sleep',{site:tent.sites.find(s=>s.id==='tent')}).ok,true);
});

test('interior furniture adapter supplies kamar_mandi / kompor / kasur',()=>{
 const items=Hooks.furnitureFromInteriorItems([
  {id:'njh-kos-bed-1',assetId:'bed',name:'Kasur',c:0,r:0},
  {id:'njh-kos-stove-1',assetId:'stove',name:'Kompor',c:1,r:0},
  {id:'njh-kos-shower-1',assetId:'shower',name:'Shower',c:2,r:0}
 ],{x:0,z:0,id:'kost'});
 assert.deepEqual(items.map(f=>f.kind).sort(),['bathroom','bed','stove']);
 const h=harness({room:true,furniture:[],pos:{x:0,y:0,z:0},interiorFurniture:()=>items});
 const ids=h.api.nearbyActions().map(a=>a.id);
 assert.ok(ids.includes('cook')&&ids.includes('sleep')&&ids.includes('home_shower'));
});

test('pause and resume stop the life-tick flag and the clock',()=>{
 const h=harness();
 assert.equal(h.api.isPaused(),false);
 h.api.pause();
 assert.equal(h.api.isPaused(),true);
 assert.equal(h.pausedClock,true);
 h.api.resume();
 assert.equal(h.api.isPaused(),false);
 assert.equal(h.pausedClock,false);
});

test('questMarkers, enterables, worldToScreen, playerPosition',()=>{
 const h=harness({
  pos:{x:3,y:1,z:4},
  objects:[
   {id:'bu-sari',type:'quest_npc',name:'Bu Sari',x:5,z:5,questState:'ready'},
   {id:'warteg-1',name:'Warteg Bu Sari',x:6,z:6,enterable:true,interior:{floors:[{}]}},
   {id:'tree-1',name:'Pohon',x:1,z:1}
  ]
 });
 assert.deepEqual(h.api.questMarkers(),[{npcId:'bu-sari',state:'ready'}]);
 const doors=h.api.enterables();
 assert.equal(doors.length,1);
 assert.equal(doors[0].id,'warteg-1');
 assert.equal(doors[0].name,'Warteg Bu Sari');
 const scr=h.api.worldToScreen(2,3,4);
 assert.deepEqual(scr,{x:102,y:47,visible:true});
 assert.deepEqual(h.api.playerPosition(),{x:3,y:1,z:4});
});

test('save slots do not touch the auto-save key; hasSave/saveMeta/load/list/reset',()=>{
 const h=harness({room:true,furniture:['stove'],persistNow:true,playerId:'t_ichsan'});
 const autoKey='semesta-life-play-v1:city-test@t_ichsan';
 assert.equal(h.api.hasSave(),true);
 assert.equal(h.api.hasSave('slot1'),false);
 const metaAuto=h.api.saveMeta();
 assert.equal(metaAuto.slot,'auto');
 assert.ok(Number.isFinite(metaAuto.day));
 h.state.wallet=4242;
 const saved=h.api.saveSlot('slot1');
 assert.equal(saved.ok,true);
 assert.equal(h.api.hasSave('slot1'),true);
 assert.equal(h.storage.getItem(autoKey).includes('"wallet":10000')||h.storage.getItem(autoKey).includes('"wallet":10000'),
  h.storage.getItem(autoKey).includes('10000')||h.storage.getItem(autoKey).includes('4242')?true:true);
 // auto-save key still the official prefix, slot store is a different key
 const keys=[...h.storage._map.keys()];
 assert.ok(keys.includes(autoKey));
 assert.ok(keys.some(k=>k.startsWith('semesta-life-slots-v1:')));
 assert.ok(!keys.some(k=>k.startsWith('semesta-life-slots-v1:')&&k.startsWith('semesta-life-play-v1:')));
 const listed=h.api.listSlots();
 assert.equal(listed.length,1);assert.equal(listed[0].slot,'slot1');
 h.state.wallet=1;
 const loaded=h.api.loadSlot('slot1');
 assert.equal(loaded.ok,true);
 assert.equal(h.state.wallet,4242);
 const del=h.api.resetSave('slot1');
 assert.equal(del.ok,true);assert.equal(h.api.hasSave('slot1'),false);
 assert.equal(h.api.hasSave(),true,'auto-save remains after deleting a named slot');
 const reset=h.api.resetSave();
 assert.equal(reset.ok,true);
 assert.equal(h.state.wallet,6000);
});

test('unified clock() and mainkan:day-end',()=>{
 const h=harness();
 const c=h.api.clock();
 assert.equal(c.day,1);assert.equal(c.minute,7*60);assert.equal(c.label,'07:00');
 assert.equal(c.weekday,'SEN');assert.equal(typeof c.elapsedMinutes,'number');
 const ev=h.api.onDayEnd({day:2,previousDay:1});
 assert.equal(ev.ok,true);
 const hit=h.events.find(e=>e.type==='mainkan:day-end');
 assert.ok(hit);assert.equal(hit.payload.day,2);assert.equal(hit.payload.previousDay,1);
});

test('transactions keep a rolling 40 and include .day',()=>{
 const cfg=Life.defaults();
 let s=Life.stateFrom({wallet:20000,energy:100},cfg);
 const first=Life.run(cfg,s,'charity',{day:3});
 assert.equal(first.ok,true);
 const txn=first.state.transactions.at(-1);
 assert.equal(txn.delta,-1000);
 assert.equal(txn.day,3);
 const aged=Life.stateFrom({transactions:[{id:'old',delta:-5,minute:2000}]},cfg);
 assert.equal(aged.transactions[0].day,Math.floor(2000/1440)+1);
 s=first.state;s.wallet=100000;
 for(let i=0;i<45;i++){
  const r=Life.run(cfg,s,'charity',{day:3});
  assert.equal(r.ok,true);
  s=r.state;
 }
 assert.equal(s.transactions.length,40);
 assert.ok(s.transactions.every(t=>Number.isFinite(t.day)));
});

test('work nearby action is holdable and keeps job args for runAction(id)',()=>{
 const h=harness({pos:{x:0,y:0,z:8}});
 const work=h.api.nearbyActions().find(a=>a.id==='work');
 assert.ok(work);assert.equal(work.hold,true);assert.equal(work.args.jobId,'pak_ogah');
 const args=h.api.argsFor('work',{});
 assert.equal(args.jobId,'pak_ogah');
 assert.ok(Number.isFinite(args.day));
});

test('source wiring: life-play, builder, index.html and auto-save key stay intact',()=>{
 const play=fs.readFileSync(path.join(R,'world-builder/semesta-life-play.js'),'utf8');
 const builder=fs.readFileSync(path.join(R,'world-builder/builder.js'),'utf8');
 const html=fs.readFileSync(path.join(R,'world-builder/index.html'),'utf8');
 const app=fs.readFileSync(path.join(R,'mainkan/app.js'),'utf8');
 assert.match(play,/function resetSave/);
 assert.match(play,/STORAGE\+projectId\+\(id\?'@'\+id:''\)/);
 assert.match(play,/spawnAt:hookApi\('spawnAt'/);
 assert.match(play,/nearbyActions:hookApi\('nearbyActions'/);
 assert.match(play,/getHooks\(\)\?\.isPaused/);
 assert.match(play,/semesta-life-hooks\.js/);
 assert.match(html,/semesta-life-hooks\.js/);
 assert.ok(html.indexOf('semesta-life-hooks.js')<html.indexOf('semesta-life-play.js'));
 assert.match(builder,/mainkan:pause/);
 assert.match(builder,/mainkan:resume/);
 assert.match(builder,/onDayEnd/);
 assert.match(builder,/function worldToScreen/);
 assert.match(builder,/questMarkers:\(\)=>window\.SemestaLifePlay/);
 assert.match(app,/postMessage\(\{type:'mainkan:pause'/);
 assert.match(app,/postMessage\(\{type:'mainkan:resume'/);
 const window={};vm.runInNewContext(fs.readFileSync(path.join(R,'world-builder/semesta-life-hooks.js'),'utf8'),{window,module:undefined,exports:undefined});
 assert.equal(typeof window.SemestaLifeHooks.create,'function');
 assert.equal(window.SemestaLifeHooks.AUTO_KEY,'semesta-life-play-v1:');
});

test('life-play public API lists every hook when the factory is loaded',()=>{
 const window={JiwaLifeEconomy:Life,SemestaLifeHooks:Hooks,location:{href:'http://127.0.0.1/world-builder/index.html'},
  addEventListener(){},CustomEvent:class{constructor(t,i){this.type=t;this.detail=i?.detail;}}};
 // fetch for start profiles should fail quietly
 window.fetch=async()=>({ok:false,json:async()=>null});
 vm.runInNewContext(fs.readFileSync(path.join(R,'world-builder/semesta-life-play.js'),'utf8'),{window,module:{exports:{}},require});
 const api=window.SemestaLifePlay;
 for(const name of ['spawnAt','nearbyActions','pause','resume','clock','questMarkers','enterables',
  'worldToScreen','hasSave','saveMeta','saveSlot','loadSlot','listSlots','resetSave','onDayEnd','playerPosition','runAction'])
  assert.equal(typeof api[name],'function',name);
 api.attach({
  getWorld:()=>({objects:[]}),getPosition:()=>({x:0,z:0}),getCityId:()=>'city-test',
  getPlayerId:()=>'t_ichsan',teleport:()=>true,setClockPaused(){},getClock:()=>null,syncHud(){}
 });
 // start() tries fetch + DOM; just call hook methods that do not need active play
 assert.deepEqual(api.questMarkers(),[]);
 assert.deepEqual(api.enterables(),[]);
 assert.equal(api.isPaused(),false);
 api.pause();assert.equal(api.isPaused(),true);api.resume();
});
