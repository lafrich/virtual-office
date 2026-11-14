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
const Access=(function(){
 try{if(typeof require==='function')return require('./semesta-room-access.js');}catch(_e){}
 const g=typeof globalThis!=='undefined'?globalThis:typeof window!=='undefined'?window:null;
 return g&&g.SemestaRoomAccess||null;
})();
const Scenes=(function(){
 try{if(typeof require==='function')return require('./semesta-int-scenes.js');}catch(_e){}
 const g=typeof globalThis!=='undefined'?globalThis:typeof window!=='undefined'?window:null;
 return g&&g.SemestaIntScenes||null;
})();
const RANGE=2.5;
const WALL_PEE=Object.freeze({id:'wall_pee',bladderMin:65,moral:-5,bladder:-70,hygiene:-5,minutes:3});
const FART=Object.freeze({id:'fart',moralWitness:-3,moralAlone:0,cooldownMinutes:1,range:2});
const FACING_VEC=Object.freeze({se:{x:1,z:1},sw:{x:-1,z:1},ne:{x:1,z:-1},nw:{x:-1,z:-1},e:{x:1,z:0},w:{x:-1,z:0},n:{x:0,z:-1},s:{x:0,z:1}});
const AUTO_KEY='semesta-life-play-v1:';
const SLOT_KEY='semesta-life-slots-v1:';
const MINUTES=1440;
const START_MINUTE=7*60;
const WEEK=['SEN','SEL','RAB','KAM','JUM','SAB','MIN'];
const FURNITURE_GATES=Object.freeze([
 {id:'stove',kind:'stove',actions:Object.freeze(['cook','cook_recipe']),
  furnitureIds:Object.freeze(['stove']),
  patterns:/kompor|stove/i,inRoom:true,label:'Kompor'},
 {id:'fridge',kind:'fridge',actions:Object.freeze(['store_fridge','take_fridge']),
  furnitureIds:Object.freeze(['fridge','kulkas']),
  patterns:/kulkas|fridge|lemari.?es/i,inRoom:true,label:'Kulkas'},
 {id:'wardrobe',kind:'wardrobe',actions:Object.freeze(['store_home','take_home']),
  furnitureIds:Object.freeze(['wardrobe','lemari']),
  patterns:/lemari|wardrobe/i,inRoom:true,label:'Lemari'},
 {id:'kitchen_sink',kind:'kitchen_sink',actions:Object.freeze(['wash']),
  furnitureIds:Object.freeze(['kitchen_sink']),
  patterns:/kitchen.?sink|wastafel.?dapur/i,inRoom:true,label:'Wastafel Dapur'},
 {id:'bathroom',kind:'bathroom',actions:Object.freeze(['home_shower','shower','bathe']),
  furnitureIds:Object.freeze(['bathroom','kamar_mandi','bathtub','shower']),
  patterns:/kamar.?mandi|bathroom|shower|bathtub|bak.?mandi|pancuran|(?:^|[-_])mandi(?:$|[-_])/i,
  inRoom:true,label:'Kamar mandi'},
 {id:'toilet',kind:'toilet',actions:Object.freeze(['home_toilet','use_toilet']),
  furnitureIds:Object.freeze(['squat_toilet','toilet']),
  patterns:/toilet|kloset|(?:^|[-_])wc(?:$|[-_])/i,inRoom:true,label:'Toilet',
  exemptSiteIds:Object.freeze(['kost'])},
 {id:'sink',kind:'sink',actions:Object.freeze(['wash']),
  furnitureIds:Object.freeze(['sink']),
  patterns:/(?:^|[-_])sink(?:$|[-_])|wastafel/i,inRoom:true,label:'Wastafel'},
 {id:'bed',kind:'bed',actions:Object.freeze(['sleep']),
  furnitureIds:Object.freeze(['bed']),
  patterns:/kasur|bed|divan|dipan/i,inRoom:true,label:'Kasur',
  exemptSiteIds:Object.freeze(['tent'])}
]);
const ACTION_LABELS={
 fish:'Mancing',sell_fish:'Jual Ikan',work:'Kerja',scavenge:'Mulung',sell_loak:'Jual Barang',
 catch_fruit:'Ambil Buah',eat:'Makan',coffee:'Ngopi',tea:'Beli Es Teh',talk:'Ngobrol',arrest:'Tegur Hansip',wall_pee:'Pipis di Tembok',fart:'Kentut',public_toilet:'WC Umum',public_shower:'Mandi Umum',
 buy_room:'Beli Akses Kost',home_toilet:'WC Kost',home_shower:'Mandi Kost',sleep:'Tidur',
 cook:'Masak Ikan',cook_recipe:'Masak Resep',store_fridge:'Simpan Kulkas',take_fridge:'Ambil dari Kulkas',
 store_home:'Simpan di Kost',take_home:'Ambil dari Kost',wash:'Cuci',bathe:'Mandi Kost',use_toilet:'WC Kost',
 enter_room:'Masuk',exit_interior:'Keluar',rest:'Duduk sebentar',help:'Bantu warga',
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
function isWallObject(o){
 if(!o||typeof o!=='object')return false;
 if(o.wall===true||o.kind==='wall')return true;
 const t=String(o.type||'');
 if(t==='building'||t==='shop')return true;
 return /tembok|dinding|(?:^|[^a-z])wall(?:$|[^a-z])|gedung|building/i.test(textOf(o));
}
function facingVec(dir){return FACING_VEC[String(dir||'').toLowerCase()]||null;}
function wallPeeFacingRequired(ctx,config){
 const g=(typeof ctx?.getGameplay==='function'?(()=>{try{return ctx.getGameplay();}catch{return null;}})():null)||config?.gameplay||config?.settings||{};
 const action=g?.modules?.action||g?.existingUI?.action||g?.action||{};
 if(Object.prototype.hasOwnProperty.call(action,'wallPeeFacingRequired'))return action.wallPeeFacingRequired!==false;
 if(Object.prototype.hasOwnProperty.call(g,'wallPeeFacingRequired'))return g.wallPeeFacingRequired!==false;
 return true;
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
   label:it.name||it.label||it.assetId||it.id||'Furnitur',x,z,roomId:it.roomId||origin?.id||null,source:'interior',
   access:it.access||null,actionId:it.actionId||null,tags:it.tags||'',ownerId:it.ownerId||null};
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
 const warteg=args?.place==='warteg'||args?.buyerId==='warteg'||args?.warteg===true;
 if(action==='eat')return warteg?num(s.wartegMealPrice,12000):num(s.streetFoodPrice,2500);
 if(action==='coffee')return num(s.coffeePrice,5000);
 if(action==='tea')return num(s.teaPrice,3000);
 if(action==='public_shower')return num(s.publicShowerFee,500);
 if(action==='charity')return 1000;
 if(action==='buy_room')return num(s.roomPrice,700000);
 if(action==='buy_fridge')return num(s.fridgePrice,2000000);
 if(action==='buy_token')return num(s.tokenPrice,20000);
 if(action==='course')return 0;
 if(action==='work'){
  const job=(config?.jobs||[]).find(j=>j.id===args?.jobId);
  return job?0:0;
 }
 return 0;
}
const QUEST_TABLE=Object.freeze([
 {id:'q_silver',npcId:'job_silver',title:'Modal Cat Silver',text:'Mas, cat silver mahal. Bantu cari modal dulu ya, kerja apa aja.',goal:'Dapatkan Rp5.000 dari kerja',kind:'earn',target:5000,reward:7500},
 {id:'q_ogah',npcId:'job_pak_ogah',title:'Isi Perut Dulu',text:'Ngatur jalan itu capek, Bos. Makan dulu di warteg, abis itu kita ngobrol.',goal:'Makan di warteg 1×',kind:'count',act:'eat',target:1,reward:5000},
 {id:'q_parkir',npcId:'job_kang_parkir',title:'Biar Rapi',text:'Kalau mau bantu jaga parkir, minimal mandi dulu lah biar orang percaya.',goal:'Kebersihan minimal 80',kind:'stat',stat:'hygiene',target:80,reward:4000},
 {id:'q_loak',npcId:'loak',title:'Barang Bekas',text:'Babeh lagi butuh barang. Bawa apa aja dua biji, nanti Babeh kasih ongkos.',goal:'Punya 2 barang di tas',kind:'inv',target:2,reward:6000},
 {id:'q_warga',npcId:'help',title:'Bantu Warga',text:'Lagi butuh bantuan nih. Belajar dulu biar makin jago.',goal:'Naikkan EXP +5',kind:'exp',target:5,reward:3000}
]);
function skillLevel(n){return Math.min(10,Math.max(1,1+Math.floor(num(n,0)/3)));}
function rpMoney(n){return 'Rp '+Number(n||0).toLocaleString('id-ID');}
function housingLabel(state){return state?.housing?.room?'Kost':'Tenda';}
function statusSnap(state){
 return {energy:num(state?.energy,0),fullness:num(state?.fullness,0),
  hygiene:num(state?.hygiene,0),moral:num(state?.moral,0),housing:housingLabel(state)};
}
function seedMessages(state,config){
 if(!state)return;
 state.messages=Array.isArray(state.messages)?state.messages:[];
 if(state.messages.length)return;
 const room=num(config?.settings?.roomPrice,700000);
 state.messages=[
  {from:'Lafrich',text:'Selamat datang di kota! Cari kerja, hemat, kumpulin buat kost.',t:1},
  {from:'Mak Kost',text:'Kamar kost masih ada, '+rpMoney(room)+' sekali bayar. Kabarin ya.',t:1}
 ];
}
function pushMessage(state,from,text){
 if(!state)return null;
 state.messages=Array.isArray(state.messages)?state.messages:[];
 const row={from:String(from||'Sistem').slice(0,40),text:String(text||'').slice(0,240),t:Date.now()};
 state.messages.unshift(row);
 state.messages=state.messages.slice(0,40);
 return row;
}
function questDef(id,npcId){
 if(id){const q=QUEST_TABLE.find(x=>x.id===id);if(q)return q;}
 if(npcId){const q=QUEST_TABLE.find(x=>x.npcId===String(npcId));if(q)return q;}
 return QUEST_TABLE[QUEST_TABLE.length-1];
}
function questProgress(q,rec,state){
 const c=state?.actionCounts||{};const b=rec?.base||{};
 if(q.kind==='earn')return num(c.workEarn,0)-num(b.workEarn,0);
 if(q.kind==='count')return num(c[q.act],0)-num(b[q.act],0);
 if(q.kind==='stat')return num(state?.[q.stat],0);
 if(q.kind==='inv')return (state?.inventory||[]).length;
 if(q.kind==='exp')return num(state?.experience,0)-num(b.exp,0);
 return 0;
}
function questRow(q,state){
 const rec=(state?.quests||{})[q.id]||(state?.quests||{})[q.npcId]||null;
 let st='available';
 const progress=questProgress(q,rec,state);
 if(rec?.state==='done')st='done';
 else if(rec?.state==='active'||rec?.state==='ready')st=progress>=q.target?'ready':'active';
 return {npcId:q.npcId,id:q.id,title:q.title,goal:q.goal,text:q.text,target:q.target,
  progress:Math.max(0,progress),reward:q.reward,state:st};
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
 const pid=()=>String(ctx.playerId?.()||'');
 const rels=()=>((typeof ctx.getRelationships==='function'?ctx.getRelationships():null)||Access?.DEFAULT_RELATIONSHIPS||[]);
 const currentRoomId=()=>{try{return ctx.interiorRoomId?.()||null;}catch(_e){return null;}};
 function housing(){return Access?Access.housingOf(pid(),getState()):{ownerId:null,roomId:null,kind:null};}
 function relationship(id){return Access?Access.relationshipsOf(rels(),id==null||id===''?pid():id):[];}
 function roomAccess(roomId){
  if(!Access)return {canEnter:false,role:'none',allowedActs:[],reason:'Terkunci',kind:null};
  return Access.roomAccess(pid(),roomId||currentRoomId(),getState(),rels());
 }
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
  else if(id==='warung')push('eat','Makan Warteg',{place:'warteg',price:actionPrice('eat',config(),{place:'warteg'})});
  else if(id==='coffee'){push('coffee','Ngopi');push('tea','Beli Es Teh');}
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
  else if(id==='hansip'){push('talk','Ngobrol dengan Hansip');push('arrest','Lapor / Tegur',{witnessed:true});}
  else if(site.npc||site.role==='quest'||site.giveQuest)push('talk',site.label||'Ngobrol');
  else if(site.action&&ACTION_LABELS[site.action])push(site.action,site.label,{});
  return out;
 }
 function nearWall(){
  const pos=getPos();
  const hits=(getWorld().objects||[]).filter(isWallObject).map(o=>{
   const dx=num(o.x,0)-pos.x,dz=num(o.z,0)-pos.z;
   return {o,dx,dz,d:Math.hypot(dx,dz)};
  }).filter(h=>h.d<=RANGE).sort((a,b)=>a.d-b.d);
  if(!hits.length)return null;
  if(!wallPeeFacingRequired(ctx,config()))return hits[0];
  const facing=(()=>{
   try{if(typeof ctx.getFacing==='function')return ctx.getFacing();}catch(_e){}
   return pos.facing||null;
  })();
  const v=facingVec(facing);if(!v)return null;
  return hits.find(h=>(h.dx*v.x+h.dz*v.z)>0)||null;
 }
 function nearbyWitnesses(){
  const pos=getPos();
  const kinds={npc:1,quest_npc:1,avatar:1,pedestrian:1,crowd:1,life_npc:1};
  const list=(getWorld().objects||[]).slice();
  if(typeof ctx.getNpcs==='function'){try{list.push(...(ctx.getNpcs()||[]));}catch(_e){}}
  return list.filter(o=>{
   if(!o||String(o.id||'').includes('temporary_player'))return false;
   if(!(kinds[o.type]||o.npc===true||o.otherPlayer===true))return false;
   return Math.hypot(num(o.x,0)-pos.x,num(o.z,0)-pos.z)<=FART.range;
  });
 }
 function nearbyActions(){
  const state=getState();
  const near=nearestSites();
  const list=[];
  const kind=interiorKind();
  const inLobby=!!(Access&&currentRoomId()&&Access.isLobby(currentRoomId()));
  if(kind==='kost'&&state?.housing?.room&&!inLobby){
   const site=getSites().find(s=>s.id==='kost')||{id:'kost',label:'Kost',x:getPos().x,z:getPos().z};
   list.push(...actionsForSite(site,state));
  }else if(kind==='warteg'||kind==='lobby'||inLobby){
   /* Makan is supplied as an extra action near tables / kasir. */
  }else{
   for(const {site} of near)list.push(...actionsForSite(site,state));
  }
  try{
   const extra=(typeof ctx.extraActions==='function'?ctx.extraActions():[])||[];
   for(const a of extra)if(a&&a.id&&!list.some(x=>x.id===a.id&&x.furnitureId===a.furnitureId))list.push(a);
  }catch(_e){}
  try{
   if(Scenes){
    const nearSite=near[0]?.site;
    const furn=worldFurniture();
    const pos=getPos();
    const close=k=>furn.some(f=>f.kind===k&&Math.hypot((f.x??0)-pos.x,(f.z??0)-pos.z)<=range);
    let context=null;
    if(close('toilet')||(kind==='kost'&&close('toilet')))context='wc';
    else if(close('bed'))context='bed';
    else if(kind==='kost'||kind==='lobby')context='room';
    else if(nearSite?.id==='tree')context='tree';
    const npc=(typeof ctx.getNpcs==='function'?ctx.getNpcs():[])||[];
    const npcNear=npc.find(n=>Math.hypot(num(n.x,0)-pos.x,num(n.z,0)-pos.z)<=range);
    const ctxScene={
     partnered:(relationship()||[]).some(r=>r.type==='pacaran'),
     context,
     npcGender:npcNear&&(npcNear.gender||npcNear.sex)||null
    };
    for(const a of Scenes.nearbySceneActions(ctxScene))
     if(a&&!list.some(x=>x.id===a.id))list.push(a);
   }
  }catch(_e){}
  if(state&&!state.detained&&!(state.restMinutes>0)){
   const wall=nearWall();
   if(num(state.bladder,0)>=WALL_PEE.bladderMin&&wall){
    if(!list.some(x=>x.id==='wall_pee'))list.push({id:'wall_pee',action:'wall_pee',label:ACTION_LABELS.wall_pee,
     price:0,spotLabel:wall.o.name||wall.o.label||'Tembok',args:{wallId:wall.o.id||''}});
   }
   const last=num(state.lastFartAt,-999),elapsed=num(state.elapsedMinutes,0);
   if(elapsed-last>=FART.cooldownMinutes){
    const w=nearbyWitnesses();
    if(!list.some(x=>x.id==='fart'))list.push({id:'fart',action:'fart',label:ACTION_LABELS.fart,
     price:0,spotLabel:w.length?'Dekat orang':'',args:{witnessed:w.length>0,nearby:w.length}});
   }
  }
  try{
   const extra2=step2Actions();
   if(extra2.some(a=>a.id==='fish_start')){for(let i=list.length-1;i>=0;i--)if(list[i].id==='fish')list.splice(i,1);}
   for(const a of extra2)if(!list.some(x=>x.id===a.id))list.push(a);
  }catch(_e){}
  const spot=near[0]?.site?.label||near[0]?.site?.id||'';
  Object.defineProperty(list,'spot',{value:spot,enumerable:false,configurable:true});
  if(list[0]&&!list[0].spotLabel)list[0].spotLabel=spot;
  if(Access&&currentRoomId()){
   const acc=roomAccess();
   if(acc&&(acc.role==='partner'||acc.kind==='lobby'||acc.role==='none')){
    const next=Access.filterActions(list,acc);
    // Public step-2 entries (shop, fishing) are not room furniture; keep them.
    // Locked kost furniture entries stay as disabled rows so the AKSI bar can say why (Punya pacar / Terkunci).
    for(const x of list)if((x.id==='shop_minimarket'||x.id==='fish_start'||(x.disabled&&x.locked&&/^(open_fridge|open_storage|cook_menu)$/.test(x.id)))&&!next.some(y=>y.id===x.id))next.push(x);
    Object.defineProperty(next,'spot',{value:spot,enumerable:false,configurable:true});
    return next;
   }
  }
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
   if(Access){
    const hit=Access.spawnTarget(pid(),kind,sid)||Access.spawnTarget(sid);
    if(hit&&hit.roomId){
     const enter=hit.skipLobby?'room':(Access.isLobby(hit.roomId)?'lobby':'room');
     return {id:hit.roomId,x:num(hit.x,0),z:num(hit.z,0),kind,source:'room',roomId:hit.roomId,doorId:hit.doorId,enter,skipLobby:!!hit.skipLobby};
    }
    if(Access.isLobby(sid)){
     const L=Access.lobbyOf()||{};
     const use=L.usePoint||L.tile||[0,0];
     return {id:L.id,x:num(use[0],0),z:num(use[1],0),kind,source:'lobby',roomId:L.id,enter:'lobby'};
    }
   }
   const site=sites.find(s=>String(s.id)===sid||String(s.sourceId)===sid);
   if(site)return {id:site.id,x:num(site.x,0),z:num(site.z,0),kind,source:'site'};
   const obj=objects.find(o=>String(o.id)===sid);
   if(obj)return {id:obj.id,x:num(obj.x,0),z:num(obj.z,0),kind,source:'world'};
  }
  if(kind==='kost'){
   const roomId=state?.housing?.roomId||null;
   if(Access&&roomId){
    const hit=Access.spawnTarget(pid(),'kost',roomId);
    if(hit&&hit.roomId)return {id:hit.roomId,x:num(hit.x,0),z:num(hit.z,0),kind,source:'room',roomId:hit.roomId,enter:hit.skipLobby?'room':'lobby',skipLobby:!!hit.skipLobby};
   }
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
  if((target.enter==='room'||target.enter==='lobby')&&target.roomId&&typeof ctx.enterInterior==='function'){
   try{ctx.enterInterior(target.roomId);}catch(_e){}
  }
  const result={ok:true,kind:k,id:target.id,x:target.x,z:target.z,teleported:moved,roomId:target.roomId||null,enter:target.enter||null};
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
  const state=getState();
  if(state){
   const report=dayReport(previousDay);
   state.dayReports=state.dayReports&&typeof state.dayReports==='object'?state.dayReports:{};
   state.dayReports[previousDay]=Object.assign({},report,{status:statusSnap(state),closed:true});
   pushMessage(state,'Laporan','Hari '+previousDay+' selesai. Tabungan akhir '+rpMoney(report.end)+'.');
   if(typeof ctx.persist==='function')ctx.persist();
  }
  emit('mainkan:day-end',{day,previousDay});
  return {ok:true,day,previousDay};
 }
 function dayReport(day){
  const state=getState()||{};
  const c=clock();
  day=Math.max(1,Math.floor(num(day,c.day)));
  const saved=state.dayReports&&state.dayReports[day];
  const tx=Array.isArray(state.transactions)?state.transactions.filter(t=>Number(t.day)===day):[];
  const income={},expense={};
  for(const t of tx){
   const bag=t.delta>0?income:expense;
   const label=t.label||t.action||'Lainnya';
   bag[label]=(bag[label]||0)+Math.abs(Number(t.delta)||0);
  }
  const first=tx[0],last=tx[tx.length-1];
  const start=first?first.balance-first.delta:(saved?.start??num(state.wallet,0));
  const end=last?last.balance:(saved?.end??num(state.wallet,0));
  return {day,start,end,income,expense,status:saved?.status||statusSnap(state)};
 }
 function level(){
  return Math.max(1,1+Math.floor(num(getState()?.experience,0)/10));
 }
 function skills(){
  const c=getState()?.actionCounts||{};
  const done=Object.values(getState()?.quests||{}).filter(x=>x&&x.state==='done').length;
  return [
   {label:'Kerja jalanan',level:skillLevel(c.work||0)},
   {label:'Masak',level:skillLevel((c.cook||0)+(c.cook_recipe||0))},
   {label:'Mulung & mancing',level:skillLevel((c.scavenge||0)+(c.fish||0))},
   {label:'Sosial',level:skillLevel((c.help||0)+(c.charity||0)+done*2)}
  ];
 }
 function reputation(){
  const c=getState()?.actionCounts||{};
  const done=Object.values(getState()?.quests||{}).filter(x=>x&&x.state==='done').length;
  return [
   {label:'Warga kampung',value:Math.min(100,20+done*15+(c.help||0)*5)},
   {label:'Pedagang',value:Math.min(100,10+((c.eat||0)+(c.coffee||0)+(c.tea||0))*4)},
   {label:'Kang parkir & Pak Ogah',value:Math.min(100,10+(c.work||0)*3)}
  ];
 }
 function housingProgress(){
  const state=getState()||{};
  const lv=level();
  const cur=state.housing?.room?'kost':'tenda';
  const room=num(config()?.settings?.roomPrice,700000);
  const furn=state.furniture||[];
  const done=Object.values(state.quests||{}).filter(x=>x&&x.state==='done').length;
  const targets=cur==='tenda'?[
   {label:'Level 3',done:lv>=3,info:'Lv '+lv},
   {label:'Tabungan '+rpMoney(room),done:num(state.wallet,0)>=room,info:rpMoney(state.wallet)},
   {label:'Sewa kamar di Kost',done:!!state.housing?.room,info:'datangi Kost'}
  ]:[
   {label:'Level 8',done:lv>=8,info:'Lv '+lv},
   {label:'Tabungan Rp150.000.000',done:num(state.wallet,0)>=150000000,info:rpMoney(state.wallet)},
   {label:'Furnitur: Kasur, Kursi, Kompor, Lemari',done:['bed','chair','stove','wardrobe'].every(x=>furn.includes(x)),info:furn.length+'/4'},
   {label:'Selesaikan 4 quest warga',done:done>=4,info:done+'/4'}
  ];
  return {current:cur,next:cur==='tenda'?'kost':'rumah',targets};
 }
 function jobs(){
  const sites=getSites();
  return (config()?.jobs||[]).map(j=>{
   const site=sites.find(s=>s.jobId===j.id);
   return {id:j.id,label:j.label,wage:j.wage,per:'sesi '+(j.minutes||0)+' mnt',
    where:site?site.label:undefined,siteId:site?.id};
  });
 }
 function quests(){
  seedMessages(getState(),config());
  return QUEST_TABLE.map(q=>questRow(q,getState()));
 }
 function acceptQuest(npcId,questId){
  const state=getState();if(!state)return {ok:false,reason:'Tidak ada state'};
  const q=questDef(questId,npcId);
  state.quests=state.quests&&typeof state.quests==='object'?state.quests:{};
  const cur=state.quests[q.id];
  if(cur?.state==='done')return {ok:false,reason:'Quest sudah selesai'};
  if(cur?.state==='active'||cur?.state==='ready')return {ok:true,id:q.id,state:cur.state,already:true};
  state.quests[q.id]={id:q.id,npcId:q.npcId,state:'active',base:{
   workEarn:num(state.actionCounts?.workEarn,0),eat:num(state.actionCounts?.eat,0),
   exp:num(state.experience,0)
  }};
  if(q.act)state.quests[q.id].base[q.act]=num(state.actionCounts?.[q.act],0);
  pushMessage(state,q.npcId||'NPC','Quest “'+q.title+'” diterima: '+q.goal+'.');
  if(typeof ctx.persist==='function')ctx.persist();
  return {ok:true,id:q.id,state:'active'};
 }
 function turnInQuest(npcId,questId){
  const state=getState();if(!state)return {ok:false,reason:'Tidak ada state'};
  const q=questDef(questId,npcId);
  const row=questRow(q,state);
  if(row.state==='done')return {ok:false,reason:'Quest sudah selesai'};
  if(row.state!=='ready')return {ok:false,reason:'Syarat quest belum terpenuhi'};
  if(typeof ctx.runEconomy==='function'){
   const r=ctx.runEconomy('quest_reward',{amount:q.reward,questId:q.id});
   if(r?.ok&&r.state&&typeof ctx.setState==='function')ctx.setState(r.state);
  }else if(state){
   state.wallet=num(state.wallet,0)+q.reward;
   state.transactions=Array.isArray(state.transactions)?state.transactions:[];
   state.transactions.push({id:'quest:'+q.id,action:'quest_reward',label:'Hadiah quest',delta:q.reward,balance:state.wallet,day:clock().day});
  }
  const next=getState()||state;
  next.quests=next.quests&&typeof next.quests==='object'?next.quests:{};
  next.quests[q.id]=Object.assign({},next.quests[q.id]||{},{id:q.id,npcId:q.npcId,state:'done'});
  pushMessage(next,q.npcId||'NPC','Makasih! Hadiah '+rpMoney(q.reward)+' masuk dompet.');
  if(typeof ctx.persist==='function')ctx.persist();
  return {ok:true,id:q.id,state:'done',reward:q.reward};
 }
 function messages(){
  const state=getState();seedMessages(state,config());
  return (state?.messages||[]).map(m=>({from:m.from,text:m.text,t:m.t}));
 }
 function furnitureSpots(){
  const state=getState()||{};
  const custom=typeof ctx.furnitureSpots==='function'?(()=>{try{return ctx.furnitureSpots();}catch{return null;}})():null;
  if(Array.isArray(custom)&&custom.length)return custom;
  const items=(typeof ctx.interiorItems==='function'?(()=>{try{return ctx.interiorItems();}catch{return [];}})():[])||[];
  if(items.length){
   return items.map((it,i)=>{
    const id=String(it.assetId||it.furnitureId||it.id||('spot-'+i));
    const x=Number.isFinite(Number(it.c))?Number(it.c):num(it.x,0);
    const y=Number.isFinite(Number(it.r))?Number(it.r):num(it.y,it.z||0);
    const owned=id==='shower'||id==='sink'||id==='squat_toilet'||id==='toilet'||!!(state.furniture||[]).includes(id)||(id==='fridge'&&state.housing?.fridge);
    const acts=[];
    const kind=kindOf(it,gates)||id;
    if(kind==='bed'||id==='bed')acts.push({act:'sleep',label:'Tidur'});
    if(kind==='stove'||id==='stove')acts.push({act:'cook',label:'Masak Ikan'},{act:'cook_recipe',label:'Masak Resep'});
    if(id==='fridge'||kind==='fridge')acts.push({act:'store_fridge',label:'Simpan ke Kulkas'},{act:'take_fridge',label:'Ambil dari Kulkas'});
    if(kind==='bathroom'||/shower|mandi/.test(id))acts.push({act:'home_shower',label:'Mandi'});
    if(/toilet|wc/.test(id))acts.push({act:'home_toilet',label:'Buang Air'});
    if(id==='wardrobe'||kind==='wardrobe')acts.push({act:'store_home',label:'Simpan Barang'},{act:'take_home',label:'Ambil Barang'});
    return {id,label:it.name||it.label||id,x,y,w:num(it.w||it.sw,1),h:num(it.h||it.sd,1),owned,acts};
   });
  }
  const has=id=>(state.furniture||[]).includes(id);
  return [
   {id:'bed',label:'Kasur',x:0,y:1,w:2,h:2,owned:has('bed'),acts:[{act:'sleep',label:'Tidur'}]},
   {id:'stove',label:'Kompor',x:6,y:1,w:2,h:1,owned:has('stove'),acts:[{act:'cook',label:'Masak Ikan'},{act:'cook_recipe',label:'Masak Resep'}]},
   {id:'fridge',label:'Kulkas',x:5,y:1,w:1,h:1,owned:!!state.housing?.fridge,buy:'fridge',acts:[{act:'store_fridge',label:'Simpan ke Kulkas'},{act:'take_fridge',label:'Ambil dari Kulkas'}]},
   {id:'bath',label:'Kamar Mandi',x:7,y:3,w:1,h:2,owned:true,acts:[{act:'home_shower',label:'Mandi'}]},
   {id:'wc',label:'WC',x:6,y:4,w:1,h:1,owned:true,acts:[{act:'home_toilet',label:'Buang Air'}]},
   {id:'wardrobe',label:'Lemari',x:0,y:4,w:1,h:1,owned:has('wardrobe'),acts:[{act:'store_home',label:'Simpan Barang'},{act:'take_home',label:'Ambil Barang'}]},
   {id:'chair',label:'Kursi',x:3,y:2,w:1,h:1,owned:has('chair'),acts:[{act:'rest',label:'Duduk Santai'}]}
  ];
 }
 function enterInterior(id){
  const raw=String(id||'').replace(/^d:/,'');
  if(!raw)return false;
  if(typeof ctx.enterInterior==='function'){
   try{const r=ctx.enterInterior(raw);if(r===true||r?.ok===true)return true;}catch(_e){}
  }
  return false;
 }
 function listSites(){
  return getSites().map(s=>({id:s.id,label:s.label,x:num(s.x,0),z:num(s.z,0),
   placeholder:s.placeholder===true,npc:!!(s.npc||s.npcId||s.jobId||s.role==='quest'||s.id==='hansip'||s.id==='loak'||s.id==='help'||s.id==='siomay_batagor'||s.id==='pasar_ikan'),
   points:Array.isArray(s.points)&&s.points.length?s.points.map(p=>({id:p.id||s.id,x:num(p.x,s.x),z:num(p.z,s.z)})):[{id:s.sourceId||s.id,x:num(s.x,0),z:num(s.z,0)}]}));
 }
 function openMap(){
  try{
   const w=ctx.window||ctx.root;
   if(w?.parent&&w.parent!==w)w.parent.postMessage({type:'njh98:open-map'},w.location?.origin||'*');
  }catch(_e){}
  if(typeof ctx.openMap==='function'){try{ctx.openMap();}catch(_e){}}
  return {ok:true};
 }
 (function bindOpenMap(){
  const w=ctx.window||ctx.root;if(!w||w.__njhOpenMapBound)return;
  w.__njhOpenMapBound=true;
  const on=ev=>{if(ev?.type==='njh98:open-map'||ev?.data?.type==='njh98:open-map')openMap();};
  try{w.addEventListener('njh98:open-map',on);}catch(_e){}
  try{w.addEventListener('message',on);}catch(_e){}
 })();
 function questMarkers(){
  const objects=getWorld().objects||[];
  const entities=(typeof ctx.getWorldEntities==='function'?ctx.getWorldEntities():config()?.worldEntities)||[];
  const out=[],seen=new Set();
  const push=(npcId,state)=>{
   const id=String(npcId||'');if(!id||seen.has(id))return;seen.add(id);
   if(state==='done'||state==='active')return;
   out.push({npcId:id,state:state==='ready'?'ready':'available'});
  };
  const sites=getSites();
  const known=id=>sites.some(s=>s.id===id||s.npcId===id||s.sourceId===id)||objects.some(o=>o.id===id||o.questId===id);
  for(const rec of quests()){
   if(rec.state==='done'||rec.state==='active')continue;
   if(known(rec.npcId))push(rec.npcId,rec.state);
  }
  for(const o of objects){
   if(o.type==='quest_npc'||o.questId||o.npcQuest){
    const rec=quests().find(q=>q.npcId===o.id||q.id===o.questId);
    push(o.id,rec?rec.state:(o.questState||o.quest||'available'));
   }
  }
  for(const e of entities){
   if(e?.operation==='npc_quest'||e?.type==='quest_npc')
    push(e.sourceId||e.objectId||e.npcId||e.id,e.questState||'available');
  }
  return out;
 }
 function enterables(){
  if(interiorKind())return [];
  const objects=getWorld().objects||[];
  const door=typeof ctx.doorAnchor==='function'?ctx.doorAnchor:null;
  const out=[],seen=new Set();
  const push=(o)=>{
   const id=String(o.id||'');if(!id||seen.has(id))return;seen.add(id);
   let x=num(o.x,0),z=num(o.z,0);
   if(door){try{const p=door(o);if(p&&Number.isFinite(Number(p.x))){x=Number(p.x);z=Number(p.z);}}catch(_e){}}
   out.push({id,name:o.name||o.label||o.asset||o.id||'Bangunan',x,z});
  };
  const kostPat=/kost|kos_|boarding.?room|cove|kamar.?sewa|__njh_play_kost__/i;
  const wartegPat=/warteg|warung.?makan|nasi padang|food.vendor/i;
  const scavengePat=/botol|kardus|sampah|trash|barang.?bekas|scavenge/i;
  const text=o=>[o.id,o.name,o.label,o.asset,o.assetId,o.subtype,o.type,o.njhInteriorTemplate].filter(Boolean).join(' ');
  for(const o of objects){
   if(scavengePat.test(text(o))&&o.enterable!==true&&!o.njhInteriorTemplate&&!o.interior)continue;
   const hasInterior=!!(o.enterable===true||o.interior?.floors?.length||o.njhInteriorTemplate);
   const playDoor=(o.enterable===true||o.njhInteriorTemplate||o.interior)&& (kostPat.test(text(o))||wartegPat.test(text(o)));
   if(hasInterior||playDoor)push(o);
  }
  if(typeof ctx.playEnterables==='function'){
   try{for(const o of ctx.playEnterables()||[])if(o)push(o);}catch(_e){}
  }
  return out;
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
   const st=storageOf(ctx);
   let raw=null;
   if(st){try{raw=JSON.parse(st.getItem(autoKey(ctx))||'null');}catch(_e){raw=null;}}
   const live=getState();
   const src=(raw&&raw.state)?raw.state:live;
   if(!src)return null;
   const has=typeof ctx.hasCharacter==='function'?!!ctx.hasCharacter():!!src.hasCharacter;
   return Object.assign({slot:'auto',schema:(raw&&raw.schema)||1,cityId:(raw&&raw.cityId)||null},
    metaFromState(src,clock(),raw&&raw.savedAt),
    Access?Access.saveFields(pid(),src,{hasCharacter:has}):{});
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

 /* ===================== Step 2 (NJH): containers, cook, minimarket, fishing, token =====================
  * Contract: docs/HOOKS-STEP2.md. Pure state changes go through Jiwa rules (ctx.runEconomy);
  * these hooks only add location / ownership checks, events and animation ids. */
 const ECON=()=>{try{return (typeof require==='function'?require('../jiwa/life-economy.js'):null);}catch(_e){return null;}};
 const rules=()=>(typeof globalThis!=='undefined'&&globalThis.JiwaLifeEconomy)||(ctx.root&&ctx.root.JiwaLifeEconomy)||ECON();
 const cfgN=()=>{const R=rules();return R?R.normalize(config()):null;};
 const rnd=()=>{try{return typeof ctx.random==='function'?ctx.random():Math.random();}catch(_e){return Math.random();}};
 const play=pose=>{try{if(pose&&typeof ctx.playPose==='function')ctx.playPose(pose);}catch(_e){}};
 const seated=()=>{try{return /sit|duduk|lesehan/i.test(String(ctx.currentPose?.()||''));}catch(_e){return false;}};
 function econ(action,args){
  if(typeof ctx.runEconomy!=='function')return {ok:false,reason:'Play Game belum dimulai'};
  const r=ctx.runEconomy(action,args||{});
  try{if(r&&r.ok&&typeof ctx.afterEconomy==='function')ctx.afterEconomy(action,r);}catch(_e){}
  return r||{ok:false,reason:'Gagal'};
 }
 const strip=r=>{const o=Object.assign({},r);delete o.state;return o;};
 const BOXES={bag:'Tas',fridge:'Kulkas',storage:'Lemari'};
 const listOf=(st,box)=>box==='bag'?st.inventory||[]:box==='fridge'?st.fridge||[]:st.homeStorage||[];
 function itemRow(st,c,uid){
  const meta=st.itemMeta?.[uid]||{species:'?',label:'?'};
  const R=rules();
  const def=R&&c?R.itemDef(c,meta.species):null;
  const fish=R&&c?R.allFish(c).find(f=>f.id===meta.species):null;
  const rec=(c?.cooking?.recipes||[]).find(r=>r.outputItem===meta.species);
  const never=num(meta.expiresAt,0)>=5e7;
  const left=never?null:Math.max(0,Math.round(num(meta.expiresAt,0)-num(st.elapsedMinutes,0)));
  const edible=meta.species==='buah'||(!fish&&!!(def?.category==='dish'||rec||def?.statEffects));
  return {uid,itemId:meta.species,label:meta.label||def?.label||fish?.label||meta.species,
   category:fish?'fish':(def?.category||(meta.species==='buah'?'fresh':'other')),
   icon:fish?.icon||def?.icon||null,quality:meta.quality||null,
   storeIn:def?.storeIn||(fish||meta.species==='buah'?['bag','fridge']:['bag','storage']),
   minutesLeft:left,spoiled:left===0,inFridge:!!meta.inFridge,edible,
   sellPrice:def?.sellPrice??null};
 }
 // Ownership of the kost furniture (fridge/lemari/kompor): owner_only, like roomAccess.
 function ownerGate(){
  const st=getState();
  if(!st?.housing?.room)return 'Perlu kost dahulu.';
  if(Access&&currentRoomId()){
   const acc=roomAccess();
   if(acc&&acc.role==='partner')return 'Punya pacar';
   if(acc&&acc.role!=='owner')return 'Terkunci';
  }
  return null;
 }
 function boxGate(box,st){
  if(box==='bag')return null;
  const own=ownerGate();if(own)return own;
  if(box==='fridge'&&!st.housing?.fridge)return 'Belum punya kulkas.';
  if(num(st.powerTokens,0)<=0){
   const c=cfgN();const set=c?.settings||{tokenPrice:20000,tokenUnits:5};
   return 'Token listrik habis. Isi token dulu ('+rpMoney(set.tokenPrice).replace('Rp ','Rp')+' / '+set.tokenUnits+' unit).';
  }
  return null;
 }
 function inventory(container){
  const box=BOXES[container]?container:'bag';
  const st=getState();if(!st)return {ok:false,container:box,reason:'Play Game belum dimulai',items:[],locked:true};
  const c=cfgN(),set=c?.settings||{bagSlots:8,homeStorageSlots:24};
  const slots=box==='bag'?set.bagSlots:set.homeStorageSlots;
  const gate=boxGate(box,st);
  const items=gate?[]:listOf(st,box).map(uid=>itemRow(st,c,uid));
  const used=listOf(st,box).length;
  return Object.assign({ok:!gate,container:box,label:BOXES[box],slots,used,free:Math.max(0,slots-used),items,locked:!!gate},gate?{reason:gate}:{});
 }
 function nearKind(kind){
  const pos=getPos();
  return worldFurniture().find(f=>f.kind===kind&&Math.hypot(num(f.x,0)-pos.x,num(f.z,0)-pos.z)<=range)||null;
 }
 function moveItem(from,to,itemId,qty){
  if(from&&typeof from==='object'){({from,to,itemId,qty}=from);}
  const st=getState();if(!st)return {ok:false,reason:'Play Game belum dimulai'};
  for(const b of [from,to]){if(!BOXES[b])return {ok:false,reason:'Wadah tidak valid.'};const g=boxGate(b,st);if(g)return {ok:false,reason:g,locked:true};}
  const other=from==='bag'?to:from;
  const kind=other==='fridge'?'fridge':'wardrobe';
  if(other!=='bag'&&!nearKind(kind)&&!(st.furniture||[]).includes(kind==='wardrobe'?'wardrobe':'fridge')&&interiorKind()!=='kost')
   return {ok:false,reason:'Dekati '+(other==='fridge'?'Kulkas':'Lemari')+' dahulu.'};
  const r=econ('move_item',{from,to,itemId:String(itemId||''),qty:num(qty,1)});
  if(r.ok)play('use_storage');
  return r.ok?{ok:true,from,to,moved:r.moved||[],pose:'use_storage'}:{ok:false,reason:r.reason};
 }
 function eatItem(uid){
  const r=econ('eat_item',{itemId:String(uid||'')});
  if(!r.ok)return {ok:false,reason:r.reason};
  const pose=r.pose==='eat_snack'?'eat_snack':seated()?'eat_sit':'eat';
  play(pose);
  return {ok:true,itemId:r.itemId||null,label:r.label||null,quality:r.quality||null,effects:r.effects||{},pose};
 }
 function knownSet(st,c){
  return new Set([...(st.knownRecipes||[]),...(c?.cooking?.recipes||[]).filter(r=>r.unlock?.knownAtStart||r.unlock?.mode==='start').map(r=>r.id)]);
 }
 function recipes(){
  const st=getState()||{},c=cfgN();if(!c)return [];
  const known=knownSet(st,c);
  const R=rules(),fishIds=new Set(R?R.allFish(c).map(f=>f.id):[]);
  const bag=(st.inventory||[]).map(u=>st.itemMeta?.[u]?.species).filter(Boolean);
  return (c.cooking.recipes||[]).map(r=>{
   const k=known.has(r.id);
   const pool=bag.slice(),missing=[];
   const ings=(r.ingredients||[]).map(n=>{
    n=typeof n==='string'?{id:n,qty:1}:n;
    const fits=sp=>n.id?sp===n.id:(n.category==='fish'?fishIds.has(sp):R?.itemDef(c,sp)?.category===n.category);
    let have=0;for(let i=0;i<num(n.qty,1);i++){const j=pool.findIndex(fits);if(j>=0){pool.splice(j,1);have++;}}
    if(have<num(n.qty,1))missing.push(n.id||n.category);
    return {id:n.id,category:n.category,qty:num(n.qty,1),label:n.id?(R?.itemDef(c,n.id)?.label||n.id):(n.category==='fish'?'Ikan apa saja':n.category),have};
   });
   return {id:r.id,label:k?(r.outputLabel||r.label):'???',known:k,
    ingredients:k?ings:[],outputItem:r.outputItem,outputLabel:k?r.outputLabel:'???',
    durationMinutes:r.durationMinutes,statEffectsEat:k?(r.statEffectsEat||{}):{},minExp:num(r.minExp,0),
    unlock:{mode:r.unlock?.mode||'experiment'},actionAsset:r.actionAsset||'cook',
    canCook:k&&!missing.length,missing:k?missing:[]};
  });
 }
 function stoveHere(){
  const st=getState();
  if(nearKind('stove'))return true;
  return !!(st?.furniture||[]).includes('stove')&&interiorKind()==='kost';
 }
 function cook(input){
  const st=getState();if(!st)return {ok:false,reason:'Play Game belum dimulai'};
  const own=ownerGate();if(own)return {ok:false,reason:own};
  if(!stoveHere())return {ok:false,reason:'Dekati kompor dahulu.'};
  if(num(st.powerTokens,0)<1)return {ok:false,reason:'Token listrik habis.'};
  let args={stoveOk:true};
  if(typeof input==='string')args.recipeId=input;
  else if(Array.isArray(input))args.ingredients=input;
  else if(input&&input.recipeId)args.recipeId=String(input.recipeId);
  else if(input&&Array.isArray(input.ingredients))args.ingredients=input.ingredients;
  const r=econ('cook_dish',args);
  if(!r.ok)return Object.assign({ok:false,reason:r.reason},r.failed?{failed:true}:{});
  const out={ok:true,recipeId:r.recipeId,result:r.result,learnedRecipe:r.learnedRecipe||null,
   consumed:r.consumed||[],minutes:r.minutes,tokenUsed:r.tokenUsed,pose:r.pose||'cook'};
  play(out.pose);emit('mainkan:cook-done',out);tokenWatch();
  return out;
 }
 // ---- minimarket ----
 function inMart(){
  const k=interiorKind();if(k==='minimarket')return true;
  const rid=currentRoomId();return rid==='njh_minimarket';
 }
 function nearMart(){
  if(inMart())return true;
  const pos=getPos();
  return getSites().some(s=>s.id==='minimarket'&&Math.hypot(num(s.x,0)-pos.x,num(s.z,0)-pos.z)<=Math.max(range,4));
 }
 function shopList(siteId){
  const c=cfgN();const st=getState()||{};
  if(!c)return {ok:false,reason:'Katalog belum siap',items:[]};
  const set=c.settings;
  const shelfOf=cat=>({staple:'Sembako',dry:'Sembako',spice:'Bumbu & Mi',vegetable:'Sayur & Buah',fresh:'Chiller',protein:'Chiller',fish:'Chiller',dairy:'Chiller',drink:'Minuman',snack:'Snack'}[cat]||'Lainnya');
  const items=(c.cooking.items||[]).filter(i=>(i.source||[]).includes('supermarket')&&i.price>0).map(i=>({
   itemId:i.id,label:i.label,category:i.category,price:i.price,unit:i.unit||'',icon:i.icon||null,
   approximate:!!i.approximate,storeIn:i.storeIn||['bag'],shelf:shelfOf(i.category)}));
  return {ok:true,siteId:siteId||'minimarket',label:c.cooking.shop?.minimarket?.label||'NJH Mart',
   inside:inMart(),near:nearMart(),wallet:num(st.wallet,0),bagFree:Math.max(0,set.bagSlots-(st.inventory||[]).length),items};
 }
 function buy(itemId,qty){
  if(!nearMart())return {ok:false,reason:'Masuk ke NJH Mart dahulu.'};
  const cart=itemId&&typeof itemId==='object'?(Array.isArray(itemId)?itemId:itemId.cart||[{itemId:itemId.itemId,qty:itemId.qty}]):[{itemId,qty:num(qty,1)}];
  const r=econ('shop_buy',{cart});
  if(!r.ok)return {ok:false,reason:r.reason};
  const out={ok:true,receipt:r.receipt,added:r.added||[],pose:'hand_over'};
  if(r.tokenAdded)out.tokenAdded=r.tokenAdded;
  play('hand_over');emit('mainkan:shop-receipt',out);
  if(r.tokenAdded){const t=token();emit('mainkan:token',{units:t.units,empty:t.empty,added:r.tokenAdded});}
  return out;
 }
 // ---- fishing (data-driven spots; Ellen's preview/njh-step2-map spot ids plug in) ----
 const FISH_RE=/dermaga|mancing|fishing|pier|pemancingan/i;
 function fishSpots(){
  const out=[],seen=new Set();
  for(const o of (getWorld().objects||[])){
   const blob=[o.id,o.name,o.label,o.asset,o.subtype,...(Array.isArray(o.tags)?o.tags:[]),...(Array.isArray(o.interactions)?o.interactions:[])].filter(Boolean).join(' ');
   if(!(FISH_RE.test(blob)||(Array.isArray(o.interactions)&&o.interactions.includes('fish'))))continue;
   if(o.type==='building')continue;
   const pt=Array.isArray(o.fishPoint)?{x:num(o.fishPoint[0]),z:num(o.fishPoint[1])}:Array.isArray(o.actionPoint)?{x:num(o.actionPoint[0]),z:num(o.actionPoint[1])}:{x:num(o.x,0),z:num(o.z,0)};
   const key=Math.round(pt.x*2)+','+Math.round(pt.z*2);if(seen.has(key))continue;seen.add(key);
   out.push({id:String(o.id),label:String(o.name||o.label||'Tempat mancing').replace(/^PENDING\s+/i,''),x:pt.x,z:pt.z,source:'world'});
  }
  for(const s of getSites())if(s.id==='fish'){
   const key=Math.round(num(s.x,0)*2)+','+Math.round(num(s.z,0)*2);
   if(out.some(o=>o.id===String(s.sourceId||'')||Math.hypot(o.x-num(s.x,0),o.z-num(s.z,0))<3))continue;
   if(!seen.has(key)){seen.add(key);out.push({id:String(s.sourceId||'fish'),label:s.label||'Mancing',x:num(s.x,0),z:num(s.z,0),source:'site'});}
  }
  if(!out.length){const p=getPos();out.push({id:'njh-fish-temp',label:'Tempat mancing (sementara)',x:p.x,z:p.z,source:'temporary'});}
  return out;
 }
 let fishSession=null,fishSeq=0;
 const TIER_BOOST={common:0,uncommon:1,rare:2,epic:3,legendary:4};
 function rollFish(power){
  const R=rules(),c=cfgN();const list=(R&&c?R.allFish(c):[]).filter(f=>num(f.weight,0)>0);
  if(!list.length)return null;
  const p=clamp(num(power,0.5),0,1);
  const w=list.map(f=>num(f.weight,0)*(1+p*0.6*(TIER_BOOST[f.rarityTier]||0)));
  let t=rnd()*w.reduce((a,b)=>a+b,0);
  for(let i=0;i<list.length;i++){t-=w[i];if(t<0)return list[i];}
  return list[list.length-1];
 }
 function fishStart(spotId){
  const st=getState();if(!st)return {ok:false,reason:'Play Game belum dimulai'};
  const c=cfgN(),set=c?.settings||{fishEnergy:8,bagSlots:8};
  const pos=getPos();
  const spots=fishSpots();
  let spot=spotId?spots.find(s=>s.id===String(spotId)):null;
  if(!spot)spot=spots.map(s=>({s,d:Math.hypot(s.x-pos.x,s.z-pos.z)})).sort((a,b)=>a.d-b.d)[0]?.s||null;
  if(!spot||(spot.source!=="temporary"&&Math.hypot(spot.x-pos.x,spot.z-pos.z)>range))return {ok:false,reason:'Dekati dermaga / tempat mancing dahulu.'};
  if((st.inventory||[]).length>=set.bagSlots)return {ok:false,reason:'Tas penuh ('+set.bagSlots+' slot).'};
  if(num(st.energy,0)<set.fishEnergy)return {ok:false,reason:'Energi tidak cukup untuk mancing.'};
  fishSession={id:'fish-'+(++fishSeq),spotId:spot.id,phase:'cast',waits:0,fish:null,progress:0,tension:0.5,miss:0};
  play('fishing_cast');
  return {ok:true,sessionId:fishSession.id,spotId:spot.id,energyCost:set.fishEnergy,phase:'cast'};
 }
 function finishFish(gotAway,reason){
  const ses=fishSession;fishSession=null;
  if(!ses)return {ok:false,done:true,reason:'Sesi mancing tidak ada.'};
  const r=econ('fish_catch',gotAway?{gotAway:true,spotId:ses.spotId}:{fishId:ses.fish.id,spotId:ses.spotId});
  const res=r.ok?{ok:true,done:true,sessionId:ses.id,spotId:ses.spotId,gotAway:!!gotAway,
   fishId:gotAway?null:r.fishId,label:gotAway?null:r.label,rarity:gotAway?null:r.rarity,rarityTier:gotAway?null:r.rarityTier,uid:gotAway?null:r.uid}
   :{ok:false,done:true,sessionId:ses.id,gotAway:true,reason:r.reason};
  if(gotAway&&reason)res.reason=reason;
  play(res.ok&&!gotAway?'pick_up':'idle');
  emit('mainkan:fish-result',res);tokenWatch();
  return res;
 }
 function fishInput(action,value){
  let sid=null;
  if(action&&typeof action==='object'){sid=action.sessionId||null;value=action.value;action=action.phase||action.action;}
  if(!fishSession)return {ok:false,reason:'Mulai mancing dulu (fishStart).'};
  if(sid&&sid!==fishSession.id)return {ok:false,reason:'Sesi mancing sudah berganti.'};
  const s=fishSession,v=clamp(num(value,0.5),0,1),a=String(action||'');
  if(a==='cancel')return finishFish(true,'Batal');
  if(a==='cast'){
   if(s.phase!=='cast')return {ok:false,phase:s.phase,reason:'Sudah dilempar.'};
   s.fish=rollFish(v);s.phase='wait';s.power=v;
   if(!s.fish)return finishFish(true,'Tidak ada ikan.');
   const pose=seated()?'fishing_wait_sit':'fishing_wait';play(pose);
   return {ok:true,sessionId:s.id,phase:'wait',pose};
  }
  if(a==='wait'){
   if(s.phase==='strike')return {ok:true,sessionId:s.id,phase:'strike',bite:true,strikeWindowMs:900};
   if(s.phase!=='wait')return {ok:false,phase:s.phase,reason:'Belum dilempar.'};
   s.waits++;
   const bite=rnd()<Math.min(0.95,0.2+0.15*s.waits);
   if(bite)s.phase='strike';
   return {ok:true,sessionId:s.id,phase:s.phase,bite,strikeWindowMs:900};
  }
  if(a==='strike'){
   if(s.phase==='wait')return finishFish(true,'Terlalu cepat, ikan kabur.');
   if(s.phase!=='strike')return {ok:false,phase:s.phase,reason:'Belum ada sambaran.'};
   const need=0.3+0.1*num(s.fish.catchDifficulty,1);
   if(v<need)return finishFish(true,'Telat menyentak, ikan kabur.');
   s.phase='reel';s.tension=0.5;
   return {ok:true,sessionId:s.id,phase:'reel',hooked:true,tension:s.tension,band:[0.25,0.8]};
  }
  if(a==='reel'){
   if(s.phase!=='reel')return {ok:false,phase:s.phase,reason:'Belum kena kail.'};
   s.tension=v;
   if(v>0.95)return finishFish(true,'Senar putus.');
   const inBand=v>=0.25&&v<=0.8;
   if(inBand)s.progress+=0.4/(1+(num(s.fish.catchDifficulty,1)-1)*0.25);
   else{s.progress=Math.max(0,s.progress-0.1);s.miss++;}
   if(s.miss>=3)return finishFish(true,'Ikan lepas.');
   if(s.progress>=1)return finishFish(false);
   return {ok:true,sessionId:s.id,phase:'reel',progress:Math.min(1,+s.progress.toFixed(3)),tension:v,band:[0.25,0.8]};
  }
  return {ok:false,phase:s.phase,reason:'Aksi mancing tidak dikenal.'};
 }
 // ---- electricity token ----
 let lastTokenEmpty=null;
 function token(){
  const st=getState()||{},c=cfgN(),set=c?.settings||{tokenPrice:20000,tokenUnits:5,tokenDurationMinutes:60,tokenBaseDrainMinutes:240};
  const units=num(st.powerTokens,0);
  const cooling=!!(st.housing?.fridge&&(st.fridge||[]).length&&units>0);
  const base=set.tokenBaseDrainMinutes>0&&st.housing?.room?60/set.tokenBaseDrainMinutes:0;
  const drain=+(base+(cooling?60/set.tokenDurationMinutes:0)).toFixed(3);
  const minutesLeft=drain>0?Math.round(units/drain*60):null;
  return {ok:true,units,drainPerHour:drain,empty:units===0,minutesLeft,price:set.tokenPrice,unitsPerPack:set.tokenUnits,
   fridgeCooling:cooling,hasRoom:!!st.housing?.room};
 }
 function tokenWatch(){
  const t=token();
  if(lastTokenEmpty!==null&&t.empty&&!lastTokenEmpty)emit('mainkan:token',{units:t.units,empty:true});
  lastTokenEmpty=t.empty;return t;
 }
 function topupToken(units){
  const r=econ('topup_token',{units:num(units,5)});
  if(!r.ok)return {ok:false,reason:r.reason};
  const t=token();lastTokenEmpty=t.empty;
  const out={ok:true,units:t.units,added:r.added,packs:r.packs,paid:r.paid};
  emit('mainkan:token',{units:t.units,empty:t.empty});
  return out;
 }
 function step2Actions(){
  const st=getState();if(!st)return [];
  const out=[],pos=getPos();
  const push=(id,label,ui,args,extra)=>out.push(Object.assign({id,action:id,label,ui,price:0,spotLabel:'',args:args||{}},extra||{}));
  // Owner / partner locks and empty token come back as disabled entries with a reason (hint), so the AKSI bar can show why.
  if(interiorKind()==='kost'){
   const lock=ownerGate();
   const empty=num(st.powerTokens,0)<=0;
   const c=cfgN(),set=c?.settings||{tokenPrice:20000,tokenUnits:5};
   const tokenMsg='Token listrik habis. Isi token dulu ('+rpMoney(set.tokenPrice).replace('Rp ','Rp')+' / '+set.tokenUnits+' unit).';
   const gate=(extra,needsPower)=>{const why=lock||(needsPower&&empty?tokenMsg:null);return why?Object.assign({},extra,{disabled:true,hint:why,reason:why,locked:!!lock}):extra;};
   const fr=nearKind('fridge');if(fr)push('open_fridge','Buka Kulkas','inventory',{container:'fridge'},gate({furnitureId:fr.furnitureId||fr.id,spotLabel:'Kulkas'},true));
   const wd=nearKind('wardrobe');if(wd)push('open_storage','Buka Lemari','inventory',{container:'storage'},gate({furnitureId:wd.furnitureId||wd.id,spotLabel:'Lemari'},true));
   const sv=nearKind('stove');if(sv)push('cook_menu','Masak','cook',{},gate({furnitureId:sv.furnitureId||sv.id,spotLabel:'Kompor'},true));
   if(!lock&&st.housing?.room&&num(st.powerTokens,0)<=2)push('topup_token','Isi Token Listrik','token',{units:5},{price:set.tokenPrice||20000});
  }
  if(inMart()||nearMart())push('shop_minimarket','Belanja NJH Mart','shop',{siteId:'minimarket'},{spotLabel:'NJH Mart'});
  const spot=fishSpots().filter(s=>s.source!=='temporary').map(s=>({s,d:Math.hypot(s.x-pos.x,s.z-pos.z)})).filter(x=>x.d<=range).sort((a,b)=>a.d-b.d)[0];
  if(spot&&!interiorKind())push('fish_start','Mancing','fishing',{spotId:spot.s.id},{spotLabel:spot.s.label});
  return out;
 }
 function openUi(id,args){
  const a=args||{};
  const map={open_fridge:()=>inventory('fridge'),open_storage:()=>inventory('storage'),cook_menu:()=>({ok:true,recipes:recipes(),bag:inventory('bag')}),
   shop_minimarket:()=>shopList('minimarket'),fish_start:()=>({ok:true,spots:fishSpots(),spotId:a.spotId||null}),topup_token:()=>token()};
  if(!map[id])return null;
  const ui={open_fridge:'inventory',open_storage:'inventory',cook_menu:'cook',shop_minimarket:'shop',fish_start:'fishing',topup_token:'token'}[id];
  const data=map[id]();
  emit('mainkan:open-ui',{ui,args:a});
  return Object.assign({ui},data,{ok:true});
 }
 return {
  spawnAt,onSpawnDecision,nearbyActions,furnitureAllows,argsFor,
  pause,resume,isPaused,clock,onDayEnd,
  dayReport,level,skills,reputation,housingProgress,
  quests,acceptQuest,turnInQuest,jobs,enterInterior,furnitureSpots,messages,
  sites:listSites,openMap,
  questMarkers,enterables,worldToScreen,playerPosition,
  hasSave,saveMeta,saveSlot,loadSlot,listSlots,resetSave,
  housing,relationship,roomAccess,
  inventory,moveItem,eatItem,recipes,cook,shopList,buy,checkoutCart:buy,fishSpots,fishStart,fishInput,token,topupToken,
  step2Actions,openUi,tokenWatch,STEP2_UI:['open_fridge','open_storage','cook_menu','shop_minimarket','fish_start','topup_token'],
  RANGE:range,FURNITURE_GATES:gates
 };
}

return Object.freeze({
 RANGE,AUTO_KEY,SLOT_KEY,FURNITURE_GATES,ACTION_LABELS,
 furnitureFromInteriorItems,kindOf,actionPrice,dayFromElapsed,clockFromElapsed,QUEST_TABLE,WALL_PEE,FART,isWallObject,wallPeeFacingRequired,create
});
});
