/* Mainkan / Semesta life-play hooks (preview). Pure helpers plus a factory
 * that SemestaLifePlay and SemestaPlay attach. No live deploy.
 */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SemestaLifeHooks=api;
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:null,function(){
'use strict';
const RANGE=2.5;
const AUTO_KEY='semesta-life-play-v1:';
const SLOT_KEY='semesta-life-slots-v1:';
const MINUTES=1440;
const START_MINUTE=7*60;
const WEEK=['SEN','SEL','RAB','KAM','JUM','SAB','MIN'];
const FURNITURE_GATES=Object.freeze([
 {id:'stove',kind:'stove',actions:Object.freeze(['cook','cook_recipe']),
  furnitureIds:Object.freeze(['stove']),
  patterns:/kompor|stove|dapur/i,inRoom:true,label:'Kompor'},
 {id:'bathroom',kind:'bathroom',actions:Object.freeze(['home_shower','shower']),
  furnitureIds:Object.freeze(['bathroom','kamar_mandi']),
  patterns:/kamar.?mandi|bathroom|shower|bak.?mandi|pancuran|(?:^|[-_])mandi(?:$|[-_])/i,
  inRoom:true,label:'Kamar mandi'},
 {id:'bed',kind:'bed',actions:Object.freeze(['sleep']),
  furnitureIds:Object.freeze(['bed']),
  patterns:/kasur|bed|divan|dipan/i,inRoom:true,label:'Kasur',
  exemptSiteIds:Object.freeze(['tent'])}
]);
const ACTION_LABELS={
 fish:'Mancing',sell_fish:'Jual Ikan',work:'Kerja',scavenge:'Mulung',sell_loak:'Jual Barang',
 catch_fruit:'Ambil Buah',eat:'Makan',coffee:'Ngopi',public_toilet:'WC Umum',public_shower:'Mandi Umum',
 buy_room:'Beli Akses Kost',home_toilet:'WC Kost',home_shower:'Mandi Kost',sleep:'Tidur',
 cook:'Masak Ikan',cook_recipe:'Masak Resep',store_fridge:'Simpan Kulkas',take_fridge:'Ambil dari Kulkas',
 store_home:'Simpan di Kost',take_home:'Ambil dari Kost',rest:'Duduk sebentar',help:'Bantu warga',
 charity:'Sedekah',worship:'Ibadah',course:'Kursus Online',world_enter:'Masuk',world_quest:'Quest',
 world_ambient:'Interaksi'
};
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function num(v,d){const n=Number(v);return Number.isFinite(n)?n:(d??0);}
function slotId(raw){const s=String(raw??'').toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,40);return s||'';}
function textOf(o){
 if(!o||typeof o!=='object')return '';
 return [o.id,o.name,o.label,o.asset,o.assetId,o.subtype,o.type,o.kind,
  ...(Array.isArray(o.tags)?o.tags:[])].filter(Boolean).join(' ');
}
function kindOf(item,gates){
 if(!item)return '';
 if(item.kind&&gates.some(g=>g.kind===item.kind))return item.kind;
 const asset=String(item.assetId||item.furnitureId||item.id||'');
 for(const g of gates){
  if(g.furnitureIds.includes(asset)||g.furnitureIds.includes(String(item.type||'')))return g.kind;
  if(g.patterns.test(textOf(item)))return g.kind;
 }
 return '';
}
function furnitureFromInteriorItems(items,origin){
 const originX=num(origin?.x,0),originZ=num(origin?.z,0);
 return (Array.isArray(items)?items:[]).map((it,i)=>{
  const x=Number.isFinite(Number(it.x))?Number(it.x):originX+num(it.c,0);
  const z=Number.isFinite(Number(it.z))?Number(it.z):originZ+num(it.r,0);
  const kind=kindOf(it,FURNITURE_GATES);
  return {id:String(it.id||('furn-'+i)),kind,furnitureId:it.assetId||it.furnitureId||it.id||'',
   label:it.name||it.label||it.assetId||it.id||'Furnitur',x,z,roomId:it.roomId||origin?.id||null,source:'interior'};
 }).filter(f=>f.kind);
}
function dayFromElapsed(elapsed){return Math.floor(Math.max(0,num(elapsed,0))/MINUTES)+1;}
function clockFromElapsed(elapsed,paused){
 const total=START_MINUTE+Math.max(0,num(elapsed,0));
 const day=Math.floor(total/MINUTES)+1;
 const minute=total%MINUTES;
 const phase=minute<300||minute>=1140?'MALAM':minute<420?'FAJAR':minute<660?'PAGI':
  minute<900?'SIANG':minute<1080?'SORE':'SENJA';
 return {day,minute,weekday:WEEK[(day-1)%7],
  label:String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0'),
  phase,paused:!!paused,speed:1,elapsedMinutes:Math.max(0,num(elapsed,0))};
}
function actionPrice(action,config,args){
 const s=config?.settings||{};
 if(action==='eat')return 2500;
 if(action==='coffee')return num(s.coffeePrice,2000);
 if(action==='public_shower')return num(s.publicShowerFee,500);
 if(action==='charity')return 1000;
 if(action==='buy_room')return num(s.roomPrice,30000);
 if(action==='buy_fridge')return num(s.fridgePrice,8000);
 if(action==='buy_token')return num(s.tokenPrice,1000);
 if(action==='course')return 0;
 if(action==='work'){
  const job=(config?.jobs||[]).find(j=>j.id===args?.jobId);
  return job?0:0;
 }
 return 0;
}
function defaultEmit(ctx,type,detail){
 const payload=Object.assign({type},detail||{});
 try{
  const w=ctx.window||ctx.root;
  const Ev=w?.CustomEvent||(typeof CustomEvent!=='undefined'?CustomEvent:null);
  if(w?.dispatchEvent&&Ev)w.dispatchEvent(new Ev(type,{detail:payload}));
 }catch(_e){}
 try{
  const w=ctx.window||ctx.root;
  if(w?.parent&&w.parent!==w)w.parent.postMessage(payload,w.location?.origin||'*');
 }catch(_e){}
 if(typeof ctx.onEvent==='function')ctx.onEvent(type,payload);
}
function storageOf(ctx){return ctx.storage||ctx.localStorage||null;}
function autoKey(ctx){
 if(typeof ctx.dataKey==='function')return ctx.dataKey();
 const city=String(ctx.cityId?.()||ctx.projectId||'__working_copy__');
 const id=String(ctx.playerId?.()||'');
 return AUTO_KEY+city+(id?'@'+id:'');
}
function slotStoreKey(ctx){
 const city=String(ctx.cityId?.()||ctx.projectId||'__working_copy__');
 const id=String(ctx.playerId?.()||'');
 return SLOT_KEY+city+(id?'@'+id:'');
}
function readSlotStore(ctx){
 const st=storageOf(ctx);if(!st)return {schema:1,slots:{}};
 try{const raw=JSON.parse(st.getItem(slotStoreKey(ctx))||'null');
  if(raw&&raw.schema===1&&raw.slots&&typeof raw.slots==='object')return raw;}catch(_e){}
 return {schema:1,slots:{}};
}
function writeSlotStore(ctx,store){
 const st=storageOf(ctx);if(!st)return false;
 try{st.setItem(slotStoreKey(ctx),JSON.stringify(store));return true;}catch(_e){return false;}
}
function metaFromState(state,clock,savedAt){
 const c=clock||clockFromElapsed(state?.elapsedMinutes,false);
 return {savedAt:savedAt||new Date().toISOString(),day:c.day,minute:c.minute,label:c.label,
  weekday:c.weekday,wallet:num(state?.wallet,0),elapsedMinutes:num(state?.elapsedMinutes,0)};
}

function create(ctx){
 ctx=ctx||{};
 let paused=false;
 const gates=ctx.furnitureGates||FURNITURE_GATES;
 const range=num(ctx.range,RANGE);
 const emit=(type,detail)=>(ctx.emit||defaultEmit)(ctx,type,detail);
 const getState=()=>ctx.getState?ctx.getState():null;
 const getSites=()=>ctx.getSites?ctx.getSites()||[]:[];
 const getWorld=()=>ctx.getWorld?ctx.getWorld()||{objects:[]}:{objects:[]};
 const getPos=()=>{const p=ctx.getPos?ctx.getPos():null;return {x:num(p?.x,0),y:num(p?.y,0),z:num(p?.z,0)};};
 const config=()=>ctx.getConfig?ctx.getConfig():null;
 function ownedKinds(state){
  const set=new Set();
  for(const id of (state?.furniture||[])){
   const k=kindOf({id,assetId:id,furnitureId:id},gates);if(k)set.add(k);
  }
  return set;
 }
 function worldFurniture(){
  const out=[];
  if(typeof ctx.interiorFurniture==='function'){
   try{for(const f of ctx.interiorFurniture()||[])if(f)out.push(Object.assign({source:'interior'},f,{kind:f.kind||kindOf(f,gates)}));}catch(_e){}
  }
  const objects=getWorld().objects||[];
  for(const o of objects){
   const kind=kindOf(o,gates);if(!kind)continue;
   out.push({id:o.id,kind,furnitureId:o.assetId||o.asset||o.id,label:o.name||o.label||o.asset||o.id,
    x:num(o.x,0),z:num(o.z,0),source:'world'});
  }
  return out.filter(f=>f.kind);
 }
 function interiorKind(){try{return ctx.interiorKind?ctx.interiorKind():null;}catch{return null;}}
 function atHomeSite(site,state){
  if(interiorKind()==='kost'&&state?.housing?.room)return true;
  return !!(state?.housing?.room&&site&&(site.id==='kost'||site.home===true));
 }
 function siteForAction(action,explicit){
  if(explicit)return explicit;
  const near=nearestSites();
  const gate=gates.find(g=>g.actions.includes(action));
  if(gate?.exemptSiteIds){
   const ex=near.find(x=>gate.exemptSiteIds.includes(x.site.id));
   if(ex)return ex.site;
  }
  return near[0]?.site||null;
 }
 function furnitureAllows(action,opts){
  const state=opts?.state||getState(),pos=opts?.pos||getPos();
  const site=siteForAction(action,opts?.site||null);
  const gate=gates.find(g=>g.actions.includes(action));
  if(!gate)return {ok:true,furnitureId:null};
  if(gate.exemptSiteIds&&site&&gate.exemptSiteIds.includes(site.id))return {ok:true,furnitureId:null};
  const inHome=atHomeSite(site,state);
  const owned=ownedKinds(state);
  if(inHome&&owned.has(gate.kind)){
   const fid=gate.furnitureIds.find(id=>(state.furniture||[]).includes(id))||gate.furnitureIds[0];
   return {ok:true,furnitureId:fid,source:'owned'};
  }
  const near=worldFurniture().find(f=>f.kind===gate.kind&&Math.hypot((f.x??0)-pos.x,(f.z??0)-pos.z)<=range);
  if(near)return {ok:true,furnitureId:near.furnitureId||near.id,source:near.source||'world'};
  return {ok:false,reason:'Dekati '+gate.label+' dahulu.',furnitureId:null};
 }
 function nearestSites(){
  const p=getPos();
  return getSites().map(s=>{
   const d=Math.hypot(p.x-num(s.x,0),p.z-num(s.z,0));
   return {site:s,dist:d};
  }).filter(x=>x.dist<=range).sort((a,b)=>a.dist-b.dist);
 }
 function actionsForSite(site,state){
  const id=site.id,out=[];
  const push=(action,label,args,extra)=>{
   const gate=furnitureAllows(action,{site,state});
   if(!gate.ok)return;
   const price=actionPrice(action,config(),args||{});
   const item={id:action,action,label:label||ACTION_LABELS[action]||action,price,
    furnitureId:gate.furnitureId||undefined,spotLabel:site.label||site.id,args:args||{}};
   if(extra)Object.assign(item,extra);
   out.push(item);
  };
  if(site.worldRuleId){
   const kind=site.operation==='ambient'?'world_ambient':site.operation==='enter'?'world_enter':'world_quest';
   push(kind,site.label,{ruleId:site.worldRuleId});
   return out;
  }
  if(site.activityId){push('configured_activity',site.label,{activityId:site.activityId});return out;}
  if(id==='fish')push('fish','Mancing',{spotId:site.sourceId||'river'});
  else if(id==='siomay_batagor'||id==='pasar_ikan')push('sell_fish','Jual Ikan',{buyerId:id});
  else if(site.jobId)push('work',site.label||'Kerja',{jobId:site.jobId},{hold:true});
  else if(id==='loak')push('sell_loak','Jual Barang');
  else if(id==='scavenge')push('scavenge','Mulung');
  else if(id==='tree')push('catch_fruit','Ambil Buah');
  else if(id==='warung')push('eat','Makan');
  else if(id==='coffee')push('coffee','Ngopi');
  else if(id==='public_wc')push('public_toilet','WC Umum',{facilityId:site.sourceId||id});
  else if(id==='public_bath')push('public_shower','Mandi Umum',{facilityId:site.sourceId||id});
  else if(id==='kost'){
   if(state?.housing?.room){
    push('home_toilet','WC Kost');
    push('home_shower','Mandi Kost');
    push('sleep','Tidur Kost');
    push('cook','Masak Ikan');
    push('cook_recipe','Masak Resep');
    push('store_fridge','Simpan Kulkas');
    push('store_home','Simpan di Kost');
    push('take_home','Ambil dari Kost');
    push('take_fridge','Ambil dari Kulkas');
   }else push('buy_room','Beli Akses Kost');
  }
  else if(id==='tent')push('sleep','Tidur Tenda');
  else if(site.religion)push('worship','Ibadah '+site.religion,{placeReligion:site.religion});
  else if(id==='course')push('course','Kursus Online');
  else if(id==='help')push('help','Bantu warga');
  else if(id==='charity')push('charity','Sedekah Rp1.000');
  else if(id==='bench')push('rest','Duduk sebentar',{seatId:site.sourceId||'bangku_preview'});
  else if(site.action&&ACTION_LABELS[site.action])push(site.action,site.label,{});
  return out;
 }
 function nearbyActions(){
  const state=getState();
  const near=nearestSites();
  const list=[];
  const kind=interiorKind();
  if(kind==='kost'&&state?.housing?.room){
   const site=getSites().find(s=>s.id==='kost')||{id:'kost',label:'Kost',x:getPos().x,z:getPos().z};
   list.push(...actionsForSite(site,state));
  }else if(kind==='warteg'){
   /* Makan is supplied as an extra action near tables / kasir. */
  }else{
   for(const {site} of near)list.push(...actionsForSite(site,state));
  }
  try{
   const extra=(typeof ctx.extraActions==='function'?ctx.extraActions():[])||[];
   for(const a of extra)if(a&&a.id&&!list.some(x=>x.id===a.id&&x.furnitureId===a.furnitureId))list.push(a);
  }catch(_e){}
  const spot=near[0]?.site?.label||near[0]?.site?.id||'';
  Object.defineProperty(list,'spot',{value:spot,enumerable:false,configurable:true});
  if(list[0]&&!list[0].spotLabel)list[0].spotLabel=spot;
  return list;
 }
 function argsFor(action,args){
  const next=Object.assign({},args||{});
  const match=nearbyActions().find(a=>a.id===action||a.action===action);
  if(match?.args)for(const k of Object.keys(match.args))if(next[k]==null)next[k]=match.args[k];
  const c=clock();if(next.day==null)next.day=c.day;
  return next;
 }
 function spawnKind(kind){
  const k=String(kind||'').toLowerCase();
  if(k==='home'||k==='kost')return 'kost';
  if(k==='hobo'||k==='tent')return 'tent';
  return k;
 }
 function findTarget(kind,id){
  const sites=getSites(),objects=getWorld().objects||[],state=getState();
  if(id){
   const sid=String(id);
   const site=sites.find(s=>String(s.id)===sid||String(s.sourceId)===sid);
   if(site)return {id:site.id,x:num(site.x,0),z:num(site.z,0),kind,source:'site'};
   const obj=objects.find(o=>String(o.id)===sid);
   if(obj)return {id:obj.id,x:num(obj.x,0),z:num(obj.z,0),kind,source:'world'};
  }
  if(kind==='kost'){
   const pos=state?.housing?.roomPosition;
   if(pos&&Number.isFinite(Number(pos.x)))return {id:pos.id||'kost',x:num(pos.x,0),z:num(pos.z,0),kind,source:'room'};
   const site=sites.find(s=>s.id==='kost');
   if(site)return {id:site.id,x:num(site.x,0),z:num(site.z,0),kind,source:'site'};
  }
  if(kind==='tent'){
   const site=sites.find(s=>s.id==='tent');
   if(site)return {id:site.id,x:num(site.x,0),z:num(site.z,0),kind,source:'site'};
  }
  return null;
 }
 function spawnAt(kind,id){
  const k=spawnKind(kind);
  if(k!=='kost'&&k!=='tent')return {ok:false,reason:'spawn kind harus tent atau kost'};
  const target=findTarget(k,id);
  if(!target)return {ok:false,reason:'Lokasi spawn tidak ditemukan'};
  const state=getState();
  if(state){
   state.spawn=k==='kost'?'home':'hobo';
   state.spawnPosition={x:target.x,z:target.z,id:target.id,placeholder:false};
   if(typeof ctx.persist==='function')ctx.persist();
  }
  let moved=false;
  if(typeof ctx.teleport==='function')moved=!!ctx.teleport(target.x,target.z);
  const result={ok:true,kind:k,id:target.id,x:target.x,z:target.z,teleported:moved};
  emit('mainkan:spawn-done',result);
  return result;
 }
 function onSpawnDecision(decision){
  if(!decision?.ok||!decision.point)return;
  const kind=decision.kind==='home'?'kost':'tent';
  emit('mainkan:spawn-done',{kind,id:decision.point.id||'spawn',x:num(decision.point.x,0),z:num(decision.point.z,0),ok:true});
 }
 function pause(){
  paused=true;
  if(typeof ctx.setClockPaused==='function')ctx.setClockPaused(true);
  return {ok:true,paused:true};
 }
 function resume(){
  paused=false;
  if(typeof ctx.setClockPaused==='function')ctx.setClockPaused(false);
  return {ok:true,paused:false};
 }
 function isPaused(){return !!paused;}
 function visualClock(){
  if(typeof ctx.getClock==='function'){
   try{
    const c=ctx.getClock();
    if(!c)return null;
    const snap=typeof c.snapshot==='function'?c.snapshot():(typeof c.get==='function'?c.get():c);
    if(!snap||!Number.isFinite(Number(snap.day)))return null;
    const minute=num(snap.minute,START_MINUTE);
    return {day:Math.max(1,Math.floor(num(snap.day,1))),minute,
     weekday:(typeof c.weekday==='function'?c.weekday():WEEK[(Math.max(1,Math.floor(num(snap.day,1)))-1)%7]),
     label:(typeof c.label==='function'?c.label():String(Math.floor(minute/60)).padStart(2,'0')+':'+String(minute%60).padStart(2,'0')),
     phase:(typeof c.solar==='function'?c.solar()?.phase:snap.phase)||'',
     paused:!!snap.paused||paused,speed:num(snap.speed,1),
     elapsedMinutes:num(getState()?.elapsedMinutes,0)};
   }catch(_e){return null;}
  }
  return null;
 }
 function clock(){
  const vis=visualClock();
  if(vis){vis.paused=vis.paused||paused;vis.elapsedMinutes=num(getState()?.elapsedMinutes,0);return vis;}
  return clockFromElapsed(getState()?.elapsedMinutes,paused);
 }
 function onDayEnd(info){
  const day=Math.max(1,Math.floor(num(info?.day,clock().day)));
  const previousDay=Math.max(1,Math.floor(num(info?.previousDay,day-1)));
  emit('mainkan:day-end',{day,previousDay});
  return {ok:true,day,previousDay};
 }
 function questMarkers(){
  const objects=getWorld().objects||[];
  const entities=(typeof ctx.getWorldEntities==='function'?ctx.getWorldEntities():config()?.worldEntities)||[];
  const out=[],seen=new Set();
  const push=(npcId,state)=>{
   const id=String(npcId||'');if(!id||seen.has(id))return;seen.add(id);
   out.push({npcId:id,state:state==='ready'?'ready':'available'});
  };
  for(const o of objects){
   if(o.type==='quest_npc'||o.questId||o.npcQuest)push(o.id,o.questState||o.quest||'available');
  }
  for(const e of entities){
   if(e?.operation==='npc_quest'||e?.type==='quest_npc')push(e.sourceId||e.objectId||e.npcId||e.id,e.questState||'available');
  }
  return out;
 }
 function enterables(){
  if(interiorKind())return [];
  const objects=getWorld().objects||[];
  const door=typeof ctx.doorAnchor==='function'?ctx.doorAnchor:null;
  const out=[];
  for(const o of objects){
   const hasInterior=!!(o.enterable===true||o.interior?.floors?.length||o.njhInteriorTemplate);
   if(!hasInterior)continue;
   let x=num(o.x,0),z=num(o.z,0);
   if(door){try{const p=door(o);if(p&&Number.isFinite(Number(p.x))){x=Number(p.x);z=Number(p.z);}}catch(_e){}}
   out.push({id:String(o.id||''),name:o.name||o.label||o.asset||o.id||'Bangunan',x,z});
  }
  return out.filter(e=>e.id);
 }
 function worldToScreen(x,y,z){
  if(typeof ctx.worldToScreen==='function'){
   try{const p=ctx.worldToScreen(x,y,z);if(p&&Number.isFinite(Number(p.x)))
    return {x:Number(p.x),y:Number(p.y),visible:p.visible!==false};}catch(_e){}
  }
  return {x:0,y:0,visible:false};
 }
 function playerPosition(){
  const p=getPos();
  return {x:p.x,y:p.y,z:p.z};
 }
 function hasSave(slot){
  const st=storageOf(ctx);
  if(slot==null||slot===''){
   if(st){try{const raw=st.getItem(autoKey(ctx));if(raw)return true;}catch(_e){}}
   return listSlots().length>0;
  }
  const id=slotId(slot);if(!id)return false;
  return !!readSlotStore(ctx).slots[id];
 }
 function saveMeta(slot){
  if(slot==null||slot===''){
   const st=storageOf(ctx);if(!st)return null;
   try{
    const raw=JSON.parse(st.getItem(autoKey(ctx))||'null');
    if(!raw||!raw.state)return null;
    return Object.assign({slot:'auto',schema:raw.schema||1,cityId:raw.cityId||null},metaFromState(raw.state,clock(),raw.savedAt));
   }catch(_e){return null;}
  }
  const id=slotId(slot);if(!id)return null;
  const rec=readSlotStore(ctx).slots[id];if(!rec)return null;
  return Object.assign({slot:id},rec.meta||metaFromState(rec.state,null,rec.savedAt));
 }
 function saveSlot(slot){
  const id=slotId(slot);if(!id)return {ok:false,reason:'Nama slot tidak valid'};
  const state=getState();if(!state)return {ok:false,reason:'Tidak ada state untuk disimpan'};
  const store=readSlotStore(ctx);
  const meta=Object.assign({slot:id},metaFromState(state,clock()));
  store.slots[id]={savedAt:meta.savedAt,meta,state:JSON.parse(JSON.stringify(state))};
  if(!writeSlotStore(ctx,store))return {ok:false,reason:'Gagal menulis slot'};
  return {ok:true,slot:id,meta};
 }
 function loadSlot(slot){
  const id=slotId(slot);if(!id)return {ok:false,reason:'Nama slot tidak valid'};
  const rec=readSlotStore(ctx).slots[id];if(!rec?.state)return {ok:false,reason:'Slot kosong'};
  if(typeof ctx.loadState==='function'){ctx.loadState(JSON.parse(JSON.stringify(rec.state)));}
  else if(typeof ctx.setState==='function'){ctx.setState(JSON.parse(JSON.stringify(rec.state)));}
  if(typeof ctx.persist==='function')ctx.persist();
  return {ok:true,slot:id,meta:rec.meta||null};
 }
 function listSlots(){
  const store=readSlotStore(ctx);
  return Object.keys(store.slots).sort().map(id=>{
   const rec=store.slots[id];
   return Object.assign({slot:id},rec.meta||metaFromState(rec.state,null,rec.savedAt));
  });
 }
 function resetSave(slot){
  if(slot!=null&&slot!==''){
   const id=slotId(slot);if(!id)return {ok:false,reason:'Nama slot tidak valid'};
   const store=readSlotStore(ctx);delete store.slots[id];
   writeSlotStore(ctx,store);
   return {ok:true,slot:id,deleted:true};
  }
  if(typeof ctx.resetCurrent==='function')ctx.resetCurrent();
  return {ok:true,reset:true};
 }
 return {
  spawnAt,onSpawnDecision,nearbyActions,furnitureAllows,argsFor,
  pause,resume,isPaused,clock,onDayEnd,
  questMarkers,enterables,worldToScreen,playerPosition,
  hasSave,saveMeta,saveSlot,loadSlot,listSlots,resetSave,
  RANGE:range,FURNITURE_GATES:gates
 };
}

return Object.freeze({
 RANGE,AUTO_KEY,SLOT_KEY,FURNITURE_GATES,ACTION_LABELS,
 furnitureFromInteriorItems,kindOf,actionPrice,dayFromElapsed,clockFromElapsed,create
});
});
