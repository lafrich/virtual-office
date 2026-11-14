'use strict';
/* NJH Step 2: containers, cooking, minimarket, fishing, kost electricity token (docs/HOOKS-STEP2.md). */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const R=path.join(__dirname,'..');
const Life=require(path.join(R,'jiwa/life-economy.js'));
const Hooks=require(path.join(R,'world-builder/semesta-life-hooks.js'));
const V=require(path.join(R,'world-builder/semesta-interior-view.js'));

function harness(o={}){
 const cfg=Life.defaults();
 let state=Life.stateFrom(Object.assign({wallet:200000,energy:100,fullness:50,moral:50,experience:0,
  housing:{room:true,fridge:true,roomId:'njh_kos_ichsan',ownerId:'t_ichsan',kind:'kost'},powerTokens:10,furniture:['bed']},o.state||{}),cfg);
 let pos=o.pos||{x:0,z:0};
 const events=[],poses=[];
 let seq=0;const rolls=o.rolls||[];
 const ctx={
  playerId:()=>o.playerId||'t_ichsan',getConfig:()=>cfg,getState:()=>state,
  getSites:()=>o.sites||[{id:'minimarket',label:'NJH Mart',x:30,z:0},{id:'fish',label:'Mancing',x:-50,z:0,sourceId:'njh-dermaga-mancing-anchor'}],
  getWorld:()=>({objects:o.objects||[]}),getPos:()=>pos,
  interiorKind:()=>o.kind===undefined?'kost':o.kind,interiorRoomId:()=>o.roomId===undefined?'njh_kos_ichsan':o.roomId,
  interiorFurniture:()=>o.furniture||[{id:'k1',kind:'stove',furnitureId:'stove',x:0,z:0},{id:'f1',kind:'fridge',furnitureId:'fridge',x:0.5,z:0},{id:'w1',kind:'wardrobe',furnitureId:'wardrobe',x:1,z:0}],
  getRelationships:()=>[{a:'t_ichsan',b:'t_noor',type:'pacaran'}],
  runEconomy:(a,args)=>{const r=Life.run(cfg,state,a,args);if(r.ok)state=r.state;return r;},
  emit:(c,type,detail)=>events.push({type,detail}),playPose:p=>poses.push(p),
  random:()=>rolls.length?rolls[(seq++)%rolls.length]:0.5
 };
 return {h:Hooks.create(ctx),get state(){return state;},set state(v){state=v;},move:p=>{pos=p;},events,poses,cfg};
}

test('catalog: 54 minimarket items, 38 recipes, 19 fish; existing prices and fish locked',()=>{
 const c=Life.defaults();
 assert.equal(c.cooking.items.filter(i=>(i.source||[]).includes('supermarket')&&i.id!=='token_listrik').length,54);
 assert.equal(c.cooking.items.find(i=>i.id==='token_listrik').price,20000,'token_listrik item follows tokenPrice');
 assert.equal(c.cooking.recipes.length,38);
 assert.equal(c.cooking.fish.length,19);
 assert.equal(c.settings.tokenPrice,20000);assert.equal(c.settings.tokenUnits,5);
 for(const f of Life.FISH){const g=c.cooking.fish.find(x=>x.id===f.id);assert.deepEqual(g.buyers,f.buyers);assert.equal(g.weight,f.weight);}
 assert.equal(c.fish.length,4,'legacy instant fish roll keeps 4 fish');
 assert.equal(Life.allFish(c).length,19);
 const n=Life.normalize({cooking:{prices:{telur:3000}}});assert.equal(n.cooking.items.find(i=>i.id==='telur').price,3000);
});

test('minimarket: shopList, buy all-or-nothing, receipt, hand_over pose, must be near',()=>{
 const t=harness({kind:'minimarket',roomId:'njh_minimarket'});
 const list=t.h.shopList();assert.equal(list.ok,true);assert.equal(list.inside,true);assert.equal(list.items.length,55,'54 Gerak items + token_listrik');
 const telur=list.items.find(i=>i.itemId==='telur');assert.equal(telur.price,2500);
 const r=t.h.buy({cart:[{itemId:'telur',qty:2},{itemId:'minyak',qty:1}]});
 assert.equal(r.ok,true,r.reason);assert.equal(r.receipt.total,2*2500+18000);
 assert.equal(t.state.wallet,200000-23000);assert.equal(r.added.length,3);
 assert.ok(t.poses.includes('hand_over'));assert.ok(t.events.some(e=>e.type==='mainkan:shop-receipt'));
 assert.equal(t.h.buy('telur',9).ok,false,'bag full');
 assert.equal(t.h.buy('ikan_goreng',1).ok,false,'dish not sold');
 const poor=harness({kind:'minimarket',roomId:'njh_minimarket',state:{wallet:1000}});
 assert.equal(poor.h.buy('minyak',1).reason,'Uang tidak cukup.');assert.equal(poor.state.inventory.length,0);
 const far=harness({kind:null,roomId:null});assert.equal(far.h.buy('telur',1).ok,false);
 far.move({x:31,z:0});assert.equal(far.h.buy('telur',1).ok,true,'near the minimarket site');
});

test('containers: inventory rows, moveItem storeIn rules, owner_only, token gate',()=>{
 const t=harness({kind:'minimarket',roomId:'njh_minimarket'});
 t.h.buy({cart:[{itemId:'telur',qty:1},{itemId:'beras',qty:1}]});
 const k=harness({state:t.state});
 const bag=k.h.inventory('bag');assert.equal(bag.ok,true);assert.equal(bag.items.length,2);assert.equal(bag.slots,8);
 assert.equal(k.h.moveItem('bag','fridge','beras').ok,false,'dry goods go to the lemari');
 assert.equal(k.h.moveItem({from:'bag',to:'fridge',itemId:'telur'}).ok,true);
 assert.equal(k.h.moveItem('bag','storage','beras',1).ok,true);
 assert.equal(k.h.inventory('fridge').items[0].itemId,'telur');
 assert.ok(k.poses.includes('use_storage'));
 const noor=harness({playerId:'t_noor',state:k.state});
 assert.equal(noor.h.inventory('fridge').reason,'Punya pacar');
 assert.equal(noor.h.moveItem('fridge','bag','telur').ok,false);
 k.state=Object.assign({},k.state,{powerTokens:0});
 const locked=k.h.inventory('storage');assert.equal(locked.locked,true);assert.match(locked.reason,/Token listrik habis/);
 assert.equal(k.h.moveItem('storage','bag','beras').ok,false);
});

test('cooking: known recipe, experiment learns, raw fish must be cooked, token used, cook-done event',()=>{
 const t=harness({kind:'minimarket',roomId:'njh_minimarket'});
 t.h.buy({cart:[{itemId:'telur',qty:2},{itemId:'minyak',qty:2}]});
 const k=harness({state:t.state});
 const rec=k.h.recipes();assert.equal(rec.length,38);
 const dadar=rec.find(r=>r.id==='telur_dadar');assert.equal(dadar.known,true);assert.equal(dadar.canCook,true);
 assert.ok(rec.some(r=>!r.known&&r.label==='???'));
 const tokens=k.state.powerTokens;
 const r=k.h.cook('telur_dadar');assert.equal(r.ok,true,r.reason);
 assert.equal(r.result.itemId,'telur_dadar');assert.ok(['biasa','bagus','sempurna'].includes(r.result.quality));
 assert.equal(r.learnedRecipe,null);assert.equal(k.state.powerTokens,tokens-1);
 assert.ok(k.events.some(e=>e.type==='mainkan:cook-done'));assert.ok(['cook','cook_stir'].includes(r.pose));
 // raw fish: not edible, then cooked by experiment (ikan_goreng is experiment-only)
 const f=Life.run(k.cfg,k.state,'fish_catch',{fishId:'nila'});k.state=f.state;
 assert.equal(k.h.eatItem(f.uid).reason,'Ikan mentah harus dimasak dahulu.');
 assert.equal(k.h.cook([f.uid]).failed,true,'fish alone is not a recipe');
 const fishLeft=k.state.inventory.includes(f.uid);assert.equal(fishLeft,true,'failed experiment consumes nothing');
 const ex=k.h.cook({ingredients:[f.uid,'minyak']});assert.equal(ex.ok,true,ex.reason);
 assert.equal(ex.result.itemId,'ikan_goreng');assert.deepEqual(ex.learnedRecipe,{id:'ikan_goreng',label:'Ikan Goreng'});
 assert.equal(k.h.recipes().find(x=>x.id==='ikan_goreng').known,true);
 const eat=k.h.eatItem(ex.result.uid);assert.equal(eat.ok,true,eat.reason);assert.ok(eat.effects.fullness>0);assert.match(eat.pose,/^eat/);
 // gates
 const nostove=harness({state:k.state,furniture:[]});assert.equal(nostove.h.cook('telur_dadar').reason,'Dekati kompor dahulu.');
 const dark=harness({state:Object.assign({},k.state,{powerTokens:0})});assert.equal(dark.h.cook('telur_dadar').reason,'Token listrik habis.');
 const partner=harness({playerId:'t_noor',state:k.state});assert.equal(partner.h.cook('telur_dadar').ok,false);
});

test('fishing: data-driven spot, cast/wait/strike/reel catch to bag, fish-result event, got-away path',()=>{
 const objects=[{id:'njh-dermaga-mancing',name:'Dermaga mancing',asset:'object:njh_dermaga_mancing',type:'sprite',x:-51.5,z:44,interactions:['fish']}];
 const t=harness({kind:null,roomId:null,objects,pos:{x:-51,z:45},rolls:[0.1,0.9]});
 assert.equal(t.h.fishSpots()[0].id,'njh-dermaga-mancing');
 const near=t.h.nearbyActions?null:null;
 const s=t.h.fishStart();assert.equal(s.ok,true,s.reason);assert.equal(s.spotId,'njh-dermaga-mancing');assert.equal(s.energyCost,8);
 assert.equal(t.h.fishInput('cast',0.7).phase,'wait');
 let w;for(let i=0;i<10;i++){w=t.h.fishInput({sessionId:s.sessionId,phase:'wait'});if(w.phase==='strike')break;}
 assert.equal(w.phase,'strike');
 assert.equal(t.h.fishInput('strike',1).phase,'reel');
 let r;for(let i=0;i<10;i++){r=t.h.fishInput('reel',0.5);if(r.done)break;}
 assert.equal(r.done,true);assert.equal(r.gotAway,false);assert.ok(r.fishId);
 assert.ok(t.state.inventory.includes(r.uid));assert.equal(t.state.energy,92);
 assert.ok(t.events.some(e=>e.type==='mainkan:fish-result'&&e.detail.fishId===r.fishId));
 assert.ok(t.poses.includes('fishing_cast')&&t.poses.includes('fishing_wait'));
 // got away by striking too early
 t.h.fishStart();t.h.fishInput('cast',0.5);const away=t.h.fishInput('strike',1);
 assert.equal(away.done,true);assert.equal(away.gotAway,true);
 // far away
 t.move({x:0,z:0});assert.equal(t.h.fishStart().ok,false);
 // no spot at all → temporary spot
 const tmp=harness({kind:null,roomId:null,objects:[],sites:[]});assert.equal(tmp.h.fishSpots()[0].id,'njh-fish-temp');
 assert.equal(tmp.h.fishStart().ok,true);
 // new catalog fish sell to the fish market
 const sold=Life.run(t.cfg,Life.run(t.cfg,t.state,'fish_catch',{fishId:'gurame'}).state,'sell_fish',
  {itemId:'life:gurame:'+(t.state.itemSequence+1),buyerId:'pasar_ikan'});
 assert.equal(sold.ok,true,sold.reason);
});

test('electricity token: drain on game time, empty disables storage/fridge/cook, topup Rp20.000 per 5',()=>{
 const t=harness({state:{powerTokens:2}});
 const tk=t.h.token();assert.equal(tk.units,2);assert.equal(tk.drainPerHour,0.25);assert.equal(tk.empty,false);assert.equal(tk.price,20000);
 t.state=Life.run(t.cfg,t.state,'advance_time',{minutes:240}).state;assert.equal(t.h.token().units,1);
 t.state=Life.run(t.cfg,t.state,'advance_time',{minutes:300}).state;assert.equal(t.h.token().empty,true);
 assert.equal(t.h.inventory('fridge').locked,true);assert.equal(t.h.cook('telur_dadar').reason,'Token listrik habis.');
 const wallet=t.state.wallet;
 const up=t.h.topupToken(7);assert.equal(up.ok,true);assert.equal(up.packs,2);assert.equal(up.paid,40000);assert.equal(up.units,10);
 assert.equal(t.state.wallet,wallet-40000);assert.equal(t.h.inventory('fridge').locked,false);
 assert.ok(t.events.some(e=>e.type==='mainkan:token'));
 // fridge cooling adds the existing 1 unit/hour
 t.state.fridge.push('x');t.state.itemMeta.x={species:'telur',label:'Telur',expiresAt:9e7};
 assert.equal(t.h.token().drainPerHour,1.25);
 const hobo=harness({state:{housing:{room:false,fridge:false},powerTokens:0}});
 assert.equal(hobo.h.topupToken(5).ok,false);
});

test('AKSI menu: step-2 entries with ui ids; legacy fish replaced near a dock',()=>{
 const k=harness();
 const ids=k.h.nearbyActions().map(a=>a.id);
 for(const id of ['open_fridge','open_storage','cook_menu'])assert.ok(ids.includes(id),id+' in '+ids);
 const ui=k.h.openUi('cook_menu',{});assert.equal(ui.ui,'cook');assert.ok(Array.isArray(ui.recipes));
 const m=harness({kind:'minimarket',roomId:'njh_minimarket'});assert.ok(m.h.nearbyActions().some(a=>a.id==='shop_minimarket'&&a.ui==='shop'));
 const objects=[{id:'njh-dermaga-mancing',name:'Dermaga mancing',type:'sprite',x:-51.5,z:44,interactions:['fish']}];
 const d=harness({kind:null,roomId:null,objects,pos:{x:-51,z:44},sites:[{id:'fish',label:'Mancing',x:-51,z:44}]});
 const acts=d.h.nearbyActions();assert.ok(acts.some(a=>a.id==='fish_start'));assert.ok(!acts.some(a=>a.id==='fish'));
});

test('NJH Mart interior: every scene asset has catalog art; no-clip guard and Kharisma door-front stay clear',()=>{
 const dir=path.join(R,'world-builder/njh-play-interiors');
 const cat=JSON.parse(fs.readFileSync(path.join(dir,'catalog.json'),'utf8')).items;
 const sc=JSON.parse(fs.readFileSync(path.join(dir,'njh_minimarket.interior-scene.json'),'utf8'));
 for(const it of sc.items){
  if(it.kind==='npc')continue;
  assert.ok(cat[it.assetId],'catalog has '+it.assetId);
  for(const d of ['sw','se','ne','nw'])assert.ok(fs.existsSync(path.join(dir,'art',cat[it.assetId][d].file)),it.assetId+' '+d);
 }
 const I=require(path.join(R,'world-builder/njh-play-interiors.js'));
 assert.equal(I.TEMPLATES.minimarket,'njh_minimarket');
 assert.ok(I.MINIMARKET_PATTERN.test('NJH Mart (Minimarket)'));
 assert.equal(V.inspectChairTables(sc,{catalog:{items:cat}}).ok,true);
 const ent=sc.entrance;assert.ok(!sc.items.some(i=>i.blocking!==false&&i.c===ent.c&&i.r===ent.r-1),'door-front tile free');
});

test('token_listrik: minimarket item tops up powerTokens (no bag slot), kost residents only, token event',()=>{
 const t=harness({kind:'minimarket',roomId:'njh_minimarket',state:{powerTokens:0}});
 const r=t.h.buy({cart:[{itemId:'token_listrik',qty:2},{itemId:'telur',qty:1}]});
 assert.equal(r.ok,true,r.reason);assert.equal(r.tokenAdded,10);assert.equal(t.state.powerTokens,10);
 assert.equal(r.receipt.total,40000+2500);assert.equal(t.state.inventory.length,1,'token takes no bag slot');
 assert.ok(t.events.some(e=>e.type==='mainkan:token'&&e.detail.units===10));
 const g=harness({kind:'minimarket',roomId:'njh_minimarket',state:{housing:{room:false}}});
 assert.equal(g.h.buy('token_listrik',1).ok,false);
 const n=Life.normalize({settings:{tokenPrice:25000}});assert.equal(n.cooking.items.find(i=>i.id==='token_listrik').price,25000);
});

test('AKSI locks: partner / stranger and empty token give disabled step-2 entries with a reason',()=>{
 const p=harness({playerId:'t_noor',state:{housing:{room:true,roomId:'njh_kos_noor',ownerId:'t_noor',kind:'kost'}}});
 const pa=p.h.nearbyActions().filter(a=>['open_fridge','open_storage','cook_menu'].includes(a.id));
 assert.equal(pa.length,3);for(const a of pa){assert.equal(a.disabled,true);assert.ok(a.hint);}
 assert.ok(!p.h.nearbyActions().some(a=>a.id==='topup_token'),'no topup in someone else\'s room');
 const e=harness({state:{powerTokens:0}});
 const ea=e.h.nearbyActions();
 for(const id of ['open_fridge','open_storage','cook_menu']){const a=ea.find(x=>x.id===id);assert.ok(a&&a.disabled,id);assert.match(a.hint,/Token listrik habis/);}
 assert.ok(ea.some(a=>a.id==='topup_token'&&!a.disabled));
 const ok=harness();assert.ok(ok.h.nearbyActions().filter(a=>a.id==='cook_menu').every(a=>!a.disabled));
});
