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
 catch_fruit:'Ambil Buah',eat:'Makan',coffee:'Ngopi',tea:'Beli Es Teh',talk:'Ngobrol',arrest:'Tegur Hansip',wall_pee:'Pipis di Tembok',fart:'Kentut',public_toilet:'WC Umum',public_shower:'Mandi Umum',
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
   placeholder:s.placeholder===true,npc:!!(s.npc||s.npcId||s.jobId||s.role==='quest'||s.id==='hansip'||s.id==='loak'||s.id==='help'||s.id==='siomay_batagor'||s.id==='pasar_ikan')}));
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
  const wartegPat=/warteg|warung|nasi|food.vendor/i;
  const text=o=>[o.id,o.name,o.label,o.asset,o.assetId,o.subtype,o.type,o.njhInteriorTemplate].filter(Boolean).join(' ');
  for(const o of objects){
   const hasInterior=!!(o.enterable===true||o.interior?.floors?.length||o.njhInteriorTemplate);
   const playDoor=kostPat.test(text(o))||wartegPat.test(text(o));
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
  dayReport,level,skills,reputation,housingProgress,
  quests,acceptQuest,turnInQuest,jobs,enterInterior,furnitureSpots,messages,
  sites:listSites,openMap,
  questMarkers,enterables,worldToScreen,playerPosition,
  hasSave,saveMeta,saveSlot,loadSlot,listSlots,resetSave,
  RANGE:range,FURNITURE_GATES:gates
 };
}

return Object.freeze({
 RANGE,AUTO_KEY,SLOT_KEY,FURNITURE_GATES,ACTION_LABELS,
 furnitureFromInteriorItems,kindOf,actionPrice,dayFromElapsed,clockFromElapsed,QUEST_TABLE,WALL_PEE,FART,isWallObject,wallPeeFacingRequired,create
});
});
