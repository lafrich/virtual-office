/* Semesta Play Game V1: non-destructive survival sandbox powered by Jiwa's
 * shared life-economy rules. Uses real Semesta world geometry and actor walk mode.
 * Missing interactables render lightweight 3D placeholders, never saved as objects.
 */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.SemestaLifePlay=api;
})(typeof window!=='undefined'?window:null,function(root){
'use strict';
const RULES=root&&root.JiwaLifeEconomy;
const SR=root&&root.VLSpawnRespawn;
const Hooks=(root&&root.SemestaLifeHooks)||(typeof require==='function'?(()=>{try{return require('./semesta-life-hooks.js');}catch{return null;}})():null);
const STORAGE='semesta-life-play-v1:';
const DATA_DB='jiwa-mechanics-v1',DATA_STORE='projects';
const SITES=[
 {id:'fish',label:'Mancing',icon:'🎣',pattern:/sungai|river|danau|kolam|fishing|mancing/i,action:'fish',offset:[5,-5]},
 {id:'siomay_batagor',label:'Bang Siomay / Batagor',icon:'🥟',pattern:/siomay|batagor/i,action:'sell_fish',offset:[7,0]},
 {id:'pasar_ikan',label:'Pasar Ikan',icon:'🐟',pattern:/pasar.?ikan|fish.?market/i,action:'sell_fish',offset:[-7,3]},
 {id:'job_silver',jobId:'manusia_silver',label:'Kerja Manusia Silver',icon:'🪙',pattern:/manusia.?silver|street.performer/i,action:'work',offset:[-5,4]},
 {id:'job_pak_ogah',jobId:'pak_ogah',label:'Kerja Pak Ogah',icon:'🚦',pattern:/pak.?ogah/i,action:'work',offset:[-3,6]},
 {id:'job_kang_parkir',jobId:'kang_parkir',label:'Kerja Kang Parkir',icon:'🅿️',pattern:/kang.?parkir|parking.attendant/i,action:'work',offset:[-7,5]},
 {id:'premium_job',jobId:'kantor_premium',label:'Kerja Premium / Kantor',icon:'🏢',pattern:/kantor.?premium|premium.?job|office.?job/i,action:'work',offset:[-2,5]},
 {id:'loak',label:'Toko Loak',icon:'♻',pattern:/toko.?loak|babeh|pawnshop/i,action:'sell_loak',offset:[8,5]},
 {id:'scavenge',label:'Titik Mulung',icon:'📦',pattern:/botol|kardus|sampah|trash|barang.?bekas|scavenge/i,action:'scavenge',offset:[-8,-3]},
 {id:'tree',label:'Pohon Buah',icon:'🌳',pattern:/\bpohon\b|\btree\b|mangga|jambu/i,action:'catch_fruit',offset:[-4,-8]},
 {id:'warung',label:'Warteg / Makanan',icon:'🍚',pattern:/warteg|warung|nasi|food.vendor/i,action:'eat',offset:[3,7]},
 {id:'coffee',label:'Warung Kopi',icon:'☕',pattern:/kopi|coffee|kafe|cafe/i,action:'coffee',offset:[6,8]},
 {id:'public_wc',label:'WC Umum',icon:'🚾',pattern:/wc.umum|public.?toilet|toilet.umum/i,action:'public_toilet',offset:[-10,7]},
 {id:'public_bath',label:'Mandi Umum',icon:'🚿',pattern:/mandi.umum|public.?shower|shower.umum/i,action:'public_shower',offset:[-10,10]},
 {id:'kost',label:'Kost / Kamar',icon:'🏠',pattern:/kost|kos_|boarding.?room|cove|kamar.?sewa/i,action:'buy_room',offset:[9,-7]},
 {id:'tent',label:'Tenda Hobo',icon:'⛺',pattern:/tenda|hobo.?tent|hobo.?camp/i,action:'sleep',offset:[-10,-10]},
 {id:'prayer_islam_a',label:'Masjid / Musala 1',religion:'islam',icon:'🕌',pattern:/masjid|mushola|musala/i,action:'worship',offset:[2,-4]},
 {id:'prayer_islam_b',label:'Masjid / Musala 2',religion:'islam',icon:'🕌',pattern:/masjid|mushola|musala/i,action:'worship',offset:[4,-6]},
 {id:'prayer_islam_c',label:'Masjid / Musala 3',religion:'islam',icon:'🕌',pattern:/masjid|mushola|musala/i,action:'worship',offset:[-2,-7]},
 {id:'prayer_kristen',label:'Gereja Protestan',religion:'kristen',icon:'⛪',pattern:/gereja|church|protestan/i,action:'worship',offset:[-15,-10]},
 {id:'prayer_katolik',label:'Gereja Katolik',religion:'katolik',icon:'⛪',pattern:/katolik|katedral|cathedral/i,action:'worship',offset:[15,-12]},
 {id:'prayer_hindu',label:'Pura',religion:'hindu',icon:'🛕',pattern:/pura/i,action:'worship',offset:[-17,9]},
 {id:'prayer_buddha',label:'Vihara',religion:'buddha',icon:'🛕',pattern:/vihara|wihara/i,action:'worship',offset:[16,11]},
 {id:'prayer_konghucu',label:'Klenteng',religion:'konghucu',icon:'🏮',pattern:/klenteng|kelenteng/i,action:'worship',offset:[-17,14]},
 {id:'hansip',label:'Hansip',icon:'🚨',pattern:/hansip|satpam|security.guard/i,action:'arrest',offset:[-1,-5]},
 {id:'help',label:'Side Job Sosial (Tanpa Bayaran)',icon:'🤝',pattern:/relawan|volunteer|bantu.?warga|kerja.?sosial/i,action:'help',offset:[-6,6]},
 {id:'charity',label:'Kotak Sedekah',icon:'🎁',pattern:/sedekah|donation|sumbangan|kotak.?amal/i,action:'charity',offset:[0,-8]},
 {id:'bench',label:'Bangku Istirahat',icon:'🪑',pattern:/bench|kursi.?taman|bangku/i,action:'rest',offset:[2,5]},
 {id:'course',label:'Kursus HP',icon:'📱',pattern:/kursus|course|school/i,action:'course',offset:[-3,9]}
];
const PLACEHOLDER_COLORS={job_silver:0xa2a9b5,job_pak_ogah:0xa49b5c,job_kang_parkir:0x739e91,help:0x63a1a2,charity:0xd3a6c0,bench:0x9b825c,premium_job:0x9579ba,hansip:0xc66766,fish:0x5596be,siomay_batagor:0xe0a94a,pasar_ikan:0x4baf9d,job:0xd18e3a,
 loak:0x839758,scavenge:0x9d9c84,tree:0x519a64,warung:0xd5aa53,coffee:0x856649,
 public_wc:0x77aec0,public_bath:0x77aec0,kost:0xb18cd3,tent:0x9a9d77,prayer:0x81c69f,prayer_islam_a:0x81c69f,prayer_islam_b:0x81c69f,prayer_islam_c:0x81c69f,
 prayer_kristen:0x81c69f,prayer_katolik:0x81c69f,prayer_hindu:0x81c69f,prayer_buddha:0x81c69f,
 prayer_konghucu:0x81c69f,course:0x709ac4};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'Rp '+Number(n||0).toLocaleString('id-ID');
const name=o=>[o.name,o.label,o.asset,o.subtype,o.questId,...(Array.isArray(o.tags)?o.tags:[])].filter(Boolean).join(' ');
const buildingName=o=>[o.name,o.label,o.type,o.id].filter(Boolean).join(' ');
let bridge=null,active=false,projectId='',config=RULES?RULES.defaults():null;
let state=null,sites=[],outer=null,markerGroup=null,nearId='',statusText='',progress=null;
let walkerDistance=0,frameAccumulator=0,timeAccumulator=0,sessionRevision=0,configSource='default',saveQueued=0;
let publishedCatalog=false; // Separate unconfigured sandbox demo from Jiwa-authored rules
let hooks=null;
let bagOpen=false,justWorkedAt=0,lastFaintCount=0;
let navSelect=null,workHoldStart=0,workAnimation=0;
let cachedMapOverview={bounds:{minX:-20,maxX:20,minZ:-20,maxZ:20},terrain:[]};
function defaults(){return RULES?RULES.defaults():null;}
function getWorld(){return bridge&&bridge.getWorld?bridge.getWorld():{objects:[],map:{}};}
function getPos(){const p=bridge&&bridge.getPosition?bridge.getPosition():null;return p||{x:0,z:0};}
function getScene(){return bridge&&bridge.getScene?bridge.getScene():null;}
function visible(){return !!active;}
function ownsRoom(){return !!(state&&state.housing&&state.housing.room);}
function cityId(){return bridge&&bridge.getCityId?String(bridge.getCityId()||'__working_copy__'):'__working_copy__';}
function playerId(){try{const v=bridge&&bridge.getPlayerId?bridge.getPlayerId():'';return /^[a-z0-9_-]{1,40}$/i.test(String(v||''))?String(v).toLowerCase():'';}catch{return '';}}
// Logged-in test players keep their own save per city; guests keep the old key.
function dataKey(){const id=playerId();return STORAGE+projectId+(id?'@'+id:'');}
/* Test start profiles (mainkan/test-start-profiles.json, data only): a listed
   test-login ID gets its start (money, kost, furniture, items) once per
   profile version; RESET re-applies it. Unlisted IDs start as new players. */
let startProfiles=null;
const startProfilesReady=(async()=>{
 try{const r=await fetch(new URL('../mainkan/test-start-profiles.json',root.location.href).href,{cache:'no-cache'});
  const d=r.ok?await r.json():null;startProfiles=d&&d.format==='mainkan-test-start-v1'?d:null;}catch{startProfiles=null;}
 return startProfiles;
})();
function startFor(id){const p=id&&startProfiles?.profiles?.[id];const st=p&&startProfiles.starts?.[p.start];return st?{profile:p,start:st}:null;}
function applyStart(s,id,force){
 const f=startFor(id);if(!f||!s)return false;
 if(!force&&s.testSeed&&s.testSeed.id===id&&s.testSeed.version===f.profile.version)return false;
 const st=f.start,base=RULES.stateFrom({},config);
 if(Number.isFinite(Number(st.electricityUnits)))base.powerTokens=Math.max(0,Math.round(Number(st.electricityUnits)));
 for(const k of ['wallet','energy','hygiene','bladder','fullness','moral'])if(Number.isFinite(Number(st[k])))base[k]=Number(st[k]);
 base.housing={room:st.housing?.room===true,fridge:st.housing?.fridge===true,
  roomId:st.housing?.roomId||null,ownerId:st.housing?.ownerId||null,
  kind:st.housing?.kind||(st.housing?.room===true?'kost':null)};
 base.homeAccess=base.housing.room;
 base.furniture=(st.furniture||[]).filter(x=>(RULES.FURNITURE||[]).some(f=>f.id===x));
 base.needsCharacter=!!(f.profile.needsCharacter&&!s.hasCharacter&&!s.identityChosen);
 base.hasCharacter=!!(s.hasCharacter||s.identityChosen);
 if(startProfiles?.relationships)base.relationships=startProfiles.relationships.slice();
 if(st.tutorial===false)base.tutorial=false;
 const make=list=>(list||[]).map(it=>{const iid='life:'+String(it.type).replace(/[^a-z0-9_]/gi,'')+':'+(++base.itemSequence);
  base.itemMeta[iid]={species:String(it.type),label:String(it.label||it.type).slice(0,60),expiresAt:base.elapsedMinutes+Math.max(1,Number(it.minutes)||1440),inFridge:false};return iid;});
 base.inventory=make(st.inventory).slice(0,8);base.homeStorage=make(st.homeStorage).slice(0,24);
 base.identity=s.identity||base.identity;base.identityChosen=s.identityChosen;
 base.testSeed={id,version:f.profile.version,appliedAt:new Date().toISOString()};
 Object.keys(s).forEach(k=>delete s[k]);Object.assign(s,RULES.stateFrom(base,config));s.testSeed=base.testSeed;
 return true;
}
function persist(){
 if(!state||!active)return;
 try{localStorage.setItem(dataKey(),JSON.stringify({schema:1,cityId:projectId,state}));}catch{}
}
function restore(){
 if(!RULES)return;
 let saved=null;
 try{const raw=JSON.parse(localStorage.getItem(dataKey())||'null');if(raw?.cityId===projectId)saved=raw.state;}catch{}
 state=RULES.stateFrom(saved||{wallet:6000,energy:80,hygiene:75,bladder:20,moral:50,experience:0},config);
 if(saved&&saved.testSeed)state.testSeed=saved.testSeed;
 const id=playerId(),rev=sessionRevision;
 if(id)startProfilesReady.then(()=>{if(!active||rev!==sessionRevision)return;
  if(applyStart(state,id,false)){persist();try{bridge.respawn&&bridge.respawn();}catch{}paintPanel();message('🧪 Start tes '+id+' diterapkan: uang, kost, dan bahan masak.');}});
}
function resetSave(){
 const id=playerId();state=RULES.stateFrom({wallet:6000},config);
 if(id&&startFor(id))applyStart(state,id,true);
 persist();
}
function openDb(){
 return new Promise((ok,no)=>{
  if(!root.indexedDB)return no(Error('IndexedDB unavailable'));
  const req=root.indexedDB.open(DATA_DB,1);
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(DATA_STORE))db.createObjectStore(DATA_STORE,{keyPath:'cityId'});};
  req.onerror=()=>no(req.error);req.onsuccess=()=>ok(req.result);
 });
}
async function projectFromJiwa(id){
 let db;
 try{
  db=await openDb();
  const data=await new Promise((ok,no)=>{
   const tx=db.transaction(DATA_STORE,'readonly'),request=tx.objectStore(DATA_STORE).get(id);
   request.onsuccess=()=>ok(request.result||null);request.onerror=()=>no(request.error);
  });
  if(data)return data;
 }catch{}
 finally{try{db&&db.close();}catch{}}
 try{return JSON.parse(localStorage.getItem('jiwa-local-project:'+id)||'null');}catch{return null;}
}
async function reloadRules(revision){
 try{
  const city=await projectFromJiwa(projectId);
  const globalRules=city&&city.lifeEconomy?city:await projectFromJiwa('__jiwa_global__');
  if(!active||revision!==sessionRevision)return;
  const catalog=root.JiwaActivities?.readLocal?.(localStorage);
  publishedCatalog=!!catalog?.updatedAt;
  config=RULES.normalize({...globalRules?.lifeEconomy,activities:catalog?.activities||[],worldEntities:catalog?.worldEntities||[]});
  configSource=(globalRules?.lifeEconomy?(city?.lifeEconomy?'JIWA CITY':'JIWA GLOBAL'):'DEFAULT V1')+
   (publishedCatalog?' / AUTHORING':' / DEMO');
  if(state){const previous=state;state=RULES.stateFrom(previous,config);}
  buildSites();
  paintPanel();
 }catch{}
}

function hookCtx(){
 return {
  window:root,root,
  getState:()=>state,setState:next=>{state=next;},
  loadState:next=>{state=RULES&&next?RULES.stateFrom(next,config):next;paintPanel();notifyHud();},
  getSites:()=>sites,getWorld:getWorld,getPos:getPos,
  getConfig:()=>config,getWorldEntities:()=>config?.worldEntities||[],
  playerId,cityId,dataKey,projectId,
  storage:typeof localStorage!=='undefined'?localStorage:null,
  persist,teleport:(x,z)=>{try{return !!(bridge&&bridge.teleport&&bridge.teleport(x,z));}catch{return false;}},
  setClockPaused:on=>{try{bridge?.setClockPaused?.(!!on);}catch{}},
  getClock:()=>{try{return bridge?.getClock?.()||null;}catch{return null;}},
  worldToScreen:(x,y,z)=>{try{return bridge?.worldToScreen?.(x,y,z)||null;}catch{return null;}},
  doorAnchor:o=>{try{return bridge?.doorAnchor?.(o)||null;}catch{return null;}},
  interiorFurniture:()=>{try{return bridge?.interiorFurniture?.()||[];}catch{return [];}},
  interiorKind:()=>{try{return bridge?.interiorKind?.()||bridge?.playInteriors?.kind?.()||null;}catch{return null;}},
  interiorRoomId:()=>{try{return bridge?.playInteriors?.roomId?.()||bridge?.playInteriors?.active?.()?.roomId||null;}catch{return null;}},
  extraActions:()=>{try{return bridge?.extraActions?.()||bridge?.playInteriors?.extraActions?.()||[];}catch{return [];}},
  hasCharacter:()=>!!(state?.hasCharacter||state?.identityChosen),
  getRelationships:()=>state?.relationships||startProfiles?.relationships||(root.SemestaRoomAccess?.DEFAULT_RELATIONSHIPS)||[],
  resetCurrent:()=>resetSave(),
  runEconomy:(action,args)=>{if(!RULES||!state)return {ok:false,reason:'Tidak ada state'};
   const r=RULES.run(config,state,action,args||{});if(r.ok)state=r.state;return r;},
  enterInterior:id=>{
   const raw=String(id||'').replace(/^d:/,'');
   try{
    const I=bridge?.playInteriors||root.VLNjhPlayInteriors;
    if(I?.openInteriorById){const r=I.openInteriorById(raw);if(r?.ok)return r;}
    if(I?.enterInterior){const r=I.enterInterior(raw);if(r?.ok)return r;}
    if((raw==='kost'||raw==='warteg')&&I?.enter)return I.enter(raw);
    const obj=(getWorld().objects||[]).find(o=>String(o.id)===raw);
    const kind=I?.kindOfBuilding?.(obj);
    if(kind&&I?.enter)return I.enter(kind);
    if(bridge?.openInteriorById)return !!bridge.openInteriorById(raw);
   }catch(_e){}
   return false;
  },
  playEnterables:()=>{
   try{
    const I=bridge?.playInteriors||root.VLNjhPlayInteriors;
    const out=[];
    if(I?.buildings){for(const k of Object.keys(I.buildings)){const b=I.buildings[k];if(b?.object)out.push(b.object);}}
    return out;
   }catch(_e){return [];}
  },
  interiorItems:()=>{try{return bridge?.playInteriors?.session?.items||root.VLNjhPlayInteriors?.session?.items||[];}catch{return [];}},
  getFacing:()=>{try{return bridge?.getFacing?.()||null;}catch{return null;}},
  getNpcs:()=>lifeNpcs||[],
  getGameplay:()=>{try{return bridge?.getGameplay?.()||root.JiwaGameplay?.current?.()||null;}catch{return null;}}
 };
}
function bindHooks(){hooks=Hooks&&Hooks.create?Hooks.create(hookCtx()):null;return hooks;}
function getHooks(){return hooks||bindHooks();}
function worldBounds(){
 const world=getWorld(),arr=(world.objects||[]).filter(o=>Number.isFinite(Number(o.x))&&Number.isFinite(Number(o.z)));
 const xs=arr.map(o=>Number(o.x)),zs=arr.map(o=>Number(o.z));
 if(xs.length)return {minX:Math.min(...xs)-5,maxX:Math.max(...xs)+5,minZ:Math.min(...zs)-5,maxZ:Math.max(...zs)+5};
 const p=getPos();return {minX:p.x-25,maxX:p.x+25,minZ:p.z-25,maxZ:p.z+25};
}
function findLanding(x,z){
 if(!bridge||!bridge.canStand)return {x,z};
 for(let radius=0;radius<=3;radius++){
  for(let step=0;step<8;step++){
   const angle=step*Math.PI/4;
   const nx=Math.round((x+Math.cos(angle)*radius)*2)/2,nz=Math.round((z+Math.sin(angle)*radius)*2)/2;
   if(bridge.canStand(nx,nz))return {x:nx,z:nz};
  }
 }
 return {x,z};
}
function buildSites(){
 const world=getWorld(),objects=world.objects||[],bounds=worldBounds();
 const center={x:(bounds.minX+bounds.maxX)/2,z:(bounds.minZ+bounds.maxZ)/2};
 const maxRange=Math.min(28,Math.max(8,(bounds.maxX-bounds.minX+bounds.maxZ-bounds.minZ)/5));
 // Prototype sites and imaginary placeholder jobs are strictly demo-only.
 sites=publishedCatalog?[]:SITES.map((d,i)=>{
  const blobOf=o=>d.id.startsWith('prayer_')?buildingName(o):name(o);
  let matches=objects.filter(o=>{
   const full=name(o)+' '+buildingName(o);
   if(d.id.startsWith('prayer_')&&/rak.?sandal/i.test(full))return false;
   if(d.id==='tree')return /\bpohon\b|\btree\b|mangga|jambu/i.test(name(o));
   return d.pattern.test(blobOf(o));
  });
  if(d.id==='warung'){
   const prefer=matches.filter(o=>/warteg/i.test(name(o)+' '+buildingName(o)));
   if(prefer.length)matches=prefer;
  }
  const prayerIndex=d.id==='prayer_islam_b'?1:d.id==='prayer_islam_c'?2:0;
  const found=matches[prayerIndex]||(!d.id.startsWith('prayer_')?matches[0]:null);
  const points=matches.map(o=>{const q=findLanding(Number(o.x)||0,Number(o.z)||0);return {id:String(o.id||''),x:q.x,z:q.z};});
  let p=found?findLanding(Number(found.x)||0,Number(found.z)||0):null;
  if(!p&&d.id==='fish'){
   const cells=world.map?.terrain?.cells||[];
   const nearWater=cells.filter(t=>['river','water'].includes(t.type))
    .sort((a,b)=>Math.hypot((Number(a.c)||0)-center.x,(Number(a.r)||0)-center.z)-Math.hypot((Number(b.c)||0)-center.x,(Number(b.r)||0)-center.z))[0];
   if(nearWater)p=findLanding((Number(nearWater.c)||0)+1.5,(Number(nearWater.r)||0)+1.5);
  }
  if(!p){const x=center.x+d.offset[0]*maxRange/10,z=center.z+d.offset[1]*maxRange/10;
   p=findLanding(x,z);
  }
  return {...d,sourceId:found?.id||'',placeholder:!found,x:p.x,z:p.z,points};
 });
 const tent=sites.find(n=>n.id==='tent');
 const last=window.__semestaLastSpawn;
 if(tent&&last?.kind==='hobo'&&last?.point){tent.x=last.point.x;tent.z=last.point.z;tent.placeholder=false;}
 const home=sites.find(n=>n.id==='kost');
 if(home){
  const realKost=home.sourceId||(getWorld().objects||[]).find(o=>/kost|kos_|boarding.?room|cove|kamar.?sewa|__njh_play_kost__/i.test(name(o)+' '+(o.id||'')));
  if(realKost&&!home.sourceId){
   const obj=typeof realKost==='object'?realKost:null;
   if(obj){const pos=findLanding(Number(obj.x)||home.x,Number(obj.z)||home.z);home.x=pos.x;home.z=pos.z;home.sourceId=String(obj.id||'');}
   home.placeholder=false;
  }
  if(state?.housing?.roomPosition){
   if(!realKost){home.x=state.housing.roomPosition.x;home.z=state.housing.roomPosition.z;home.placeholder=!!state.housing.roomPosition.placeholder;}
   else home.placeholder=false;
  }
 }
 // Global Jiwa activity registry: only real, configured buildings become
 // game interactions; unbound drafts remain editable, never fake map pins.
 const catalog=root.JiwaActivities;
 if(catalog){
  for(const a of config.activities||[]){
   const found=catalog.matchActivityTarget(a,objects,config.worldEntities||[],projectId);
   if(!found)continue;
   const pos=findLanding(Number(found.x)||0,Number(found.z)||0);
   const cat=catalog.CATEGORIES.find(c=>c.id===a.category);
   sites.push({id:'act:'+a.id,label:a.label,
    category:a.category,icon:cat?.emoji||'📍',
    action:'configured_activity',activityId:a.id,actionAsset:a.actionAsset,
    sourceId:String(found.id||''),placeholder:false,x:pos.x,z:pos.z});
  }
 }
 // Buildings, quest-giving NPCs, and ambient props use actual placed objects.
 // Ambient interactions never create a quest marker in Nokia.
 const worldPremises=root.JiwaPremises;
 for(const rule of config.worldEntities||[]){
  // Historical name/asset queries remain editable, never executable.
  if(!rule.enabled||rule.operation==='none'||rule.selectionMode!=='directory')continue;
  const candidates=objects.filter(o=>catalog?.kindOf?.(o)===rule.kind);
  const matches=worldPremises?.matchWorldAll?.(rule,candidates,projectId)||[];
  for(const found of matches.slice(0,300)){
   const pos=findLanding(Number(found.x)||0,Number(found.z)||0);
   const opts={id:'world:'+rule.id+':'+found.id,label:rule.label,worldRuleId:rule.id,
    operation:rule.operation,sourceId:String(found.id||''),placeholder:false,
    actionAsset:rule.actionAsset,activityId:rule.operation==='npc_quest'?rule.activityId:null,
    ambient:rule.operation==='ambient',x:pos.x,z:pos.z,icon:rule.operation==='npc_quest'?'❗':'🚪'};
   if(rule.operation==='npc_quest'&&!config.activities.some(a=>a.id===rule.activityId))continue;
   if(rule.operation==='enter'&&!rule.enterable)continue;
   sites.push(opts);
  }
 }
 rebuildNokiaMapOverview();
 placeLifeNpcs();
 const warung=sites.find(n=>n.id==='warung');
 if(!sites.some(n=>n.id==='npc_ibu_warteg')){
  sites.push({id:'npc_ibu_warteg',label:'Ibu Warteg',icon:'👩‍🍳',action:'eat',
   x:warung?warung.x:0,z:warung?warung.z:0,sourceId:warung?warung.sourceId:'',
   placeholder:true,npc:true,oldAsset:true,interior:'warteg',behavior:'idle'});
 }
}
function rebuildNokiaMapOverview(){
 const doc=getWorld(),cells=doc.map?.terrain?.cells||[];
 const bb=worldBounds();
 // The Nokia Peta spans the actual city layout, including roads and water,
 // without modifying the world geometry or persisting any test markers.
 for(const n of sites){
  if(!Number.isFinite(n.x)||!Number.isFinite(n.z))continue;
  bb.minX=Math.min(bb.minX,n.x-2);bb.maxX=Math.max(bb.maxX,n.x+2);
  bb.minZ=Math.min(bb.minZ,n.z-2);bb.maxZ=Math.max(bb.maxZ,n.z+2);
 }
 const minSpan=14,cx=(bb.minX+bb.maxX)/2,cz=(bb.minZ+bb.maxZ)/2;
 bb.minX=Math.min(bb.minX,cx-minSpan/2);
 bb.maxX=Math.max(bb.maxX,cx+minSpan/2);
 bb.minZ=Math.min(bb.minZ,cz-minSpan/2);
 bb.maxZ=Math.max(bb.maxZ,cz+minSpan/2);
 const tiles=new Map(),rank={sidewalk:1,road:3,river:4,water:4,drain:5};
 for(const t of cells){
  if(!Object.prototype.hasOwnProperty.call(rank,t?.type))continue;
  const c=Number(t.c),r=Number(t.r);
  if(!Number.isFinite(c)||!Number.isFinite(r))continue;
  const u=Math.round((c-bb.minX)/(bb.maxX-bb.minX)*87);
  const v=Math.round((r-bb.minZ)/(bb.maxZ-bb.minZ)*29);
  if(u<0||u>87||v<0||v>29)continue;
  const key=u+','+v,old=tiles.get(key);
  if(!old||rank[t.type]>rank[old.type])tiles.set(key,{u,v,type:t.type});
 }
 cachedMapOverview={bounds:bb,terrain:[...tiles.values()]};
}

function spawnEntitlement(){
 if(!active||!state)return null;
 const pos=state.housing?.roomPosition||sites.find(n=>n.id==='kost');
 return {homeAccess:ownsRoom(),ownedRoom:ownsRoom()&&pos?{id:pos.id||'kost_v1',x:pos.x,z:pos.z,facing:'se'}:null};
}
function spawnModule(mod,adapter){
 if(!active||ownsRoom()||!SR)return mod;
 const valid=SR.validPool(mod,adapter),bounds=worldBounds();
 const marginX=(bounds.maxX-bounds.minX)*.25,marginZ=(bounds.maxZ-bounds.minZ)*.25;
 let edge=valid.filter(p=>p.x<=bounds.minX+marginX||p.x>=bounds.maxX-marginX||p.z<=bounds.minZ+marginZ||p.z>=bounds.maxZ-marginZ);
 if(!edge.length)return {...mod,playNoEdge:true};
 return {...mod,pool:edge,playNoEdge:false};
}
function fallbackSpawn(){
 const b=worldBounds(),center={x:(b.minX+b.maxX)/2,z:(b.minZ+b.maxZ)/2};
 const candidates=[
  {id:'hobo_tenda_barats',x:b.minX+3,z:center.z},
  {id:'hobo_tenda_timur',x:b.maxX-3,z:center.z},
  {id:'hobo_tenda_utara',x:center.x,z:b.minZ+3},
  {id:'hobo_tenda_selatan',x:center.x,z:b.maxZ-3}
 ];
 const candidate=candidates[Math.floor(Math.random()*candidates.length)];
 const point=findLanding(candidate.x,candidate.z);
 return {ok:true,kind:'hobo',playExitTent:false,point:{...point,id:candidate.id,facing:'se',placeholder:true},reason:'placeholder-hobo'};
}
function onSpawn(decision){
 if(!active||!decision?.ok||!decision.point||!state)return;
 const p=decision.point;
 state.spawn=decision.kind==='home'?'home':'hobo';
 state.spawnPosition={x:p.x,z:p.z,id:p.id||'spawn',placeholder:false};
 if(decision.kind==='hobo'){
  const t=sites.find(n=>n.id==='tent');if(t){t.x=p.x;t.z=p.z;t.placeholder=false;}
 }
 message((decision.kind==='home'?'🏠 RESPAWN KOST: ':'⛺ HOBO / TENDA: ')+(p.id||'spawn'));
 persist();placeMarkers();paintPanel();
 try{getHooks()?.onSpawnDecision?.(decision);}catch{}
}
function disposeMarkers(){
 if(!markerGroup)return;
 markerGroup.parent?.remove(markerGroup);
 markerGroup.traverse(n=>{
  if(n.geometry)n.geometry.dispose();
  if(n.material){const mats=Array.isArray(n.material)?n.material:[n.material];
   for(const m of mats){m.map?.dispose();m.dispose();}}
 });
 markerGroup=null;
}
function makeLabel(THREE,label){
 const c=document.createElement('canvas');c.width=256;c.height=64;
 const g=c.getContext('2d');g.fillStyle='rgba(13,38,72,0.9)';g.fillRect(2,4,252,54);
 g.strokeStyle='#edf8ff';g.strokeRect(2,4,252,54);
 g.fillStyle='#fff';g.font='bold 18px Tahoma, Arial';g.textAlign='center';g.fillText(label.slice(0,24),128,31);
 g.font='12px Tahoma, Arial';g.fillStyle='#f8e7a4';g.fillText('PLAY • INTERACTION',128,47);
 const tex=new THREE.CanvasTexture(c);tex.minFilter=THREE.LinearFilter;
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthTest:false,transparent:true}));
 sprite.scale.set(3.5,.87,1);return sprite;
}
function placeMarkers(){
 // Activity points live in the original Nokia Peta, never as floating 3D pins.
 disposeMarkers();
}
function nearest(){
 const p=getPos();let found=null,dist=2.5;
 for(const s of sites){
  const d=Math.hypot(p.x-s.x,p.z-s.z);
  // Same-object actions share one physical spot; prefer an authored
  // activity as the default Action, with every sibling available in panel.
  if(d<dist-(s.activityId?-.04:0)){found=s;dist=d;}
 }
 return found;
}
// Several Jiwa activities and world rules can legitimately use one real
// Semesta object. They must all remain actionable, not just whichever
// duplicate site happened to win the nearest() ordering.
function authoredAt(node){
 if(!node)return [];
 if(!publishedCatalog||!node.sourceId||node.placeholder)return [node];
 const peers=sites.filter(s=>!s.placeholder&&s.sourceId===node.sourceId&&
  (s.activityId||s.worldRuleId)&&Math.hypot(s.x-node.x,s.z-node.z)<0.25);
 return peers.length?peers:[node];
}
function message(text){
 statusText=String(text||'').slice(0,320);
 if(bridge&&bridge.tell)bridge.tell(statusText);
 if(outer){const status=outer.querySelector('#lifePlayMessage');if(status)status.textContent=statusText;}
}
function makeRoot(){
 if(outer||!bridge?.mountTo)return;
 const wrap=bridge.mountTo();if(!wrap)return;
 const cssId='semesta-life-play-css';
 if(!document.getElementById(cssId)){
  const style=document.createElement('style');style.id=cssId;
  style.textContent='.slp{position:absolute;z-index:42;left:10px;top:10px;max-width:min(390px,calc(100% - 20px));max-height:min(75%,520px);overflow:auto;color:#1d3450;background:#e8eef6ed;border:2px solid #fff;outline:1px solid #27568f;box-shadow:2px 3px 0 #14395f66;font:11px Tahoma,Arial,sans-serif}.slp[hidden]{display:none!important}.slp h3{margin:0;background:linear-gradient(90deg,#1452aa,#509add);color:white;font-size:12px;padding:8px}.slp .slp-content{padding:9px}.slp .slp-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;margin:8px 0}.slp .slp-stat{background:white;border:1px solid #adbccc;padding:5px}.slp .slp-bar{height:5px;background:#d4dce2}.slp .slp-bar span{display:block;height:100%;background:#3e93bf}.slp button,.slp select{font:11px Tahoma,Arial;background:linear-gradient(#fff,#dfe9f5);border:1px solid #748ea9;padding:6px;min-height:27px;cursor:pointer;color:#123b5b}.slp .slp-actions{display:flex;gap:5px;flex-wrap:wrap;margin:7px 0}.slp button:disabled{opacity:.4}.slp .slp-spot{color:#124c78;font-weight:bold;padding:6px 0}.slp #lifePlayMessage{background:#fffcd9;border:1px solid #dfcf8a;padding:6px;white-space:normal;min-height:26px;margin-top:5px}.slp small{color:#51677e}.slp details summary{cursor:pointer;font-weight:bold;padding:5px}.slp .slp-work-progress{height:8px;background:#c6d2de;border:1px solid #698eae;margin:7px 0}.slp .slp-work-progress>span{display:block;background:#397aa8;height:100%;width:0}.slp .slp-head{display:flex;align-items:center;gap:5px;background:linear-gradient(90deg,#1452aa,#509add);padding-right:6px}.slp .slp-head h3{flex:1}.slp .slp-head button{padding:2px 6px;min-height:22px}.slp select{max-width:100%}.slp .slp-goto{display:flex;gap:5px;margin:6px 0}.slp .slp-goto select{flex:1;min-width:0}.slp-goal{padding:6px;margin-top:5px;background:#f8fbff;border-left:3px solid #5485ab;font-size:10px;line-height:1.5}.slp-summary{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.slp-alert{background:#fff3df;border:1px solid #d5a866;padding:6px;margin:5px 0}.slp-phone details,.slp-bag{margin:6px 0}.slp-phone label{display:block;margin:7px 0}@media(max-width:650px){.slp{max-width:min(315px,calc(100% - 10px));left:5px;top:5px;max-height:52%;font-size:10px}}';
  document.head.appendChild(style);
 }
 outer=document.createElement('section');outer.id='semestaLifePlayPanel';outer.className='slp';
 outer.innerHTML='<div class="slp-head"><h3>🎮 NAMANYA JUGA HIDUP · PLAY</h3><button id="slpToggle" type="button">_</button></div><div class="slp-content" id="slpContent"></div>';
 wrap.appendChild(outer);
 outer.querySelector('#slpToggle').onclick=()=>{
  const content=outer.querySelector('#slpContent');content.hidden=!content.hidden;
  outer.querySelector('#slpToggle').textContent=content.hidden?'▢':'_';
 };
 outer.addEventListener('click',click);
 outer.addEventListener('pointerdown',workDown);
 outer.addEventListener('pointerup',workUp);
 outer.addEventListener('pointercancel',workUp);
 outer.addEventListener('pointerleave',workUp);
 outer.addEventListener('change',ev=>{
  if(ev.target.id==='slpDestination')navSelect=ev.target.value;
  if(!state)return;
  if(ev.target.id==='slpReligion'&&RULES.RELIGIONS.includes(ev.target.value)&&ev.target.value!=='satanis'){
   state.identity.religion=ev.target.value;state.identityChosen=true;persist();message('Pilihan keyakinan: '+ev.target.value);paintPanel();
  }
  if(ev.target.id==='slpZodiac'&&RULES.ZODIACS.includes(ev.target.value)){
   state.identity.zodiac=ev.target.value;state.identityChosen=true;persist();message('Zodiak: '+ev.target.value+' (sosial V2 masih terkunci)');paintPanel();
  }
 });
}
function itemOptions(type){
 const items=state?.inventory||[];
 return items.map(id=>{
  const meta=state.itemMeta?.[id],fish=meta&&config.fish?.find(f=>f.id===meta.species);
  if(type==='fish'&&!fish)return '';
  if(type==='loak'&&meta?.species!=='barang_bekas')return '';
  return '<option value="'+esc(id)+'">'+esc(meta?.label||id)+'</option>';
 }).join('');
}
function drawStats(){
 const s=state||{};
 return ['energy','hygiene','experience','moral','bladder'].map(key=>{
  const v=Math.round(s[key]||0);
  return '<div class="slp-stat"><b>'+({energy:'Energi',hygiene:'Kebersihan',experience:'EXP',moral:'Moral',bladder:'Buang Air'}[key]||key)+': '+v+'</b><div class="slp-bar"><span style="width:'+v+'%;background:'+(key==='moral'?'#a485ce':key==='energy'?'#64ac70':key==='bladder'?'#dc974a':'#438cba')+'"></span></div></div>';
 }).join('');
}
function nodeButtons(n){
 if(!n)return '<small>Berjalan ke pin di kota untuk berinteraksi (WASD / panah). Tombol Action di HUD dipakai untuk aksi terdekat.</small>';
 const id=n.id;let entries=[];
 const button=(action,label,args={})=>'<button data-life-action="'+action+'" data-args="'+esc(JSON.stringify(args))+'">'+label+'</button>';
 const siblings=authoredAt(n);
 if(siblings.length>1){
  const actions=siblings.map(s=>{
   if(s.worldRuleId){
    const kind=s.operation==='ambient'?'world_ambient':s.operation==='enter'?'world_enter':'world_quest';
    const icon=s.operation==='ambient'?'▶ ':s.operation==='enter'?'🚪 ':'❗ ';
    return button(kind,icon+esc(s.label),{ruleId:s.worldRuleId});
   }
   return button('configured_activity','▶ '+esc(s.label),{activityId:s.activityId});
  });
  return '<small>Pilih interaksi pada objek ini:</small>'+actions.join('');
 }
 if(n.worldRuleId){
  if(n.operation==='ambient')entries=[button('world_ambient','▶ '+esc(n.label),{ruleId:n.worldRuleId}),
   '<small>NON-QUEST · '+esc(n.actionAsset||'Aksi objek')+'</small>'];
  if(n.operation==='enter')entries=[button('world_enter','🚪 '+esc(n.label),{ruleId:n.worldRuleId})];
  if(n.operation==='npc_quest')entries=[button('world_quest','❗ '+esc(n.label),{ruleId:n.worldRuleId})];
 }
 if(n.activityId&&!n.worldRuleId)entries=[button('configured_activity','▶ '+esc(n.label),{activityId:n.activityId}),
  '<small>JiWA · '+esc(n.actionAsset||'Action asset belum dipilih')+' · lokasi: '+esc(n.sourceId)+'</small>'];
 if(id==='fish')entries=[button('fish','🎣 Mancing',{spotId:n.sourceId||'water_placeholder'})];
 if(['siomay_batagor','pasar_ikan'].includes(id))entries=['<select id="slpItem">'+itemOptions('fish')+'</select>',button('sell_fish','💰 Jual Ikan',{buyerId:id})];
 if(n.jobId)entries=['<button id="slpWork" type="button">🛠 TAHAN ACTION UNTUK '+esc(n.label.toUpperCase())+'</button>','<div class="slp-work-progress"><span id="slpWorkFill"></span></div>'];
 if(id==='loak')entries=['<select id="slpItem">'+itemOptions('loak')+'</select>',button('sell_loak','💰 Jual Barang')];
 if(id==='scavenge')entries=[button('scavenge','📦 Mulung')];
 if(id==='tree')entries=[button('catch_fruit','🌳 Ambil Buah')];
 if(id==='warung')entries=[button('eat','🍚 Makan')];
 if(id==='coffee')entries=[button('coffee','☕ Ngopi')];
 if(id==='public_wc')entries=[button('public_toilet','🚾 WC Umum',{facilityId:n.sourceId||id})];
 if(id==='public_bath')entries=[button('public_shower','🚿 Mandi Umum',{facilityId:n.sourceId||id})];
 const furnOk=action=>!getHooks()?.furnitureAllows||getHooks().furnitureAllows(action,{site:n}).ok;
 if(id==='kost')entries=ownsRoom()?
  [button('home_toilet','🚽 WC Kost'),
   ...(furnOk('home_shower')?[button('home_shower','🚿 Mandi Kost')]:[]),
   ...(furnOk('sleep')?[button('sleep','💤 Tidur Kost')]:[]),
   '<select id="slpItem">'+itemOptions('any')+'</select>',
   ...(furnOk('cook')?[button('cook','🍳 Masak Ikan')]:[]),
   ...(furnOk('cook_recipe')&&kitchenRecipes().length?['<select id="slpRecipe">'+kitchenRecipes().map(a=>'<option value="'+esc(a.id)+'">'+esc((a.outputLabel||a.label)+' ('+a.ingredients.join(', ')+')')+'</option>').join('')+'</select>',
    button('cook_recipe','🍳 Masak Resep')]:[]),button('store_fridge','🧊 Simpan Kulkas'),button('store_home','📦 Simpan di Kost'),
   '<select id="slpHomeItem">'+(state.homeStorage||[]).map(item=>'<option value="'+esc(item)+'">'+esc(state.itemMeta?.[item]?.label||item)+'</option>').join('')+'</select>',
   button('take_home','🎒 Ambil dari Kost'),
   '<select id="slpFridgeItem">'+(state.fridge||[]).map(item=>'<option value="'+esc(item)+'">'+esc(state.itemMeta?.[item]?.label||item)+'</option>').join('')+'</select>',
   button('take_fridge','📦 Ambil dari Kulkas')]:
   [button('buy_room','🏠 Beli Akses Kost (1×)')];
 if(id==='tent')entries=[button('sleep','💤 Tidur Tenda')];
 if(n.religion)entries=[button('worship','🤲 Ibadah '+n.religion,{placeReligion:n.religion})];
 if(id==='course')entries=[button('course','📱 Kursus Online')];
 if(id==='hansip')entries=['<small>Jika moral terlalu rendah, hansip dapat menangkapmu saat mendekat.</small>'];
 if(id==='help')entries=[button('help','🤝 Bantu warga (tanpa upah)')];
 if(id==='charity')entries=[button('charity','🎁 Sedekah Rp1.000')];
 if(id==='bench')entries=[button('rest','🪑 Duduk sebentar',{seatId:n.sourceId||'bangku_preview'})];
 return entries.join('');
}
function bagMarkup(){
 const entries=(state.inventory||[]).map(id=>{
  const meta=state.itemMeta?.[id];
  const preview=meta&&RULES.activeItem(config,state,id);
  const label=(meta?.label||id)+(preview?.ok&&preview.spoiled?' · BUSUK':'');
  return '<option value="'+esc(id)+'">'+esc(label)+'</option>';
 });
 return '<div class="slp-bag"><b>🎒 TAS · '+(state.inventory||[]).length+'/'+(config.settings.bagSlots||8)+'</b>'+
  '<p><small>Buah bisa dimakan langsung. Ikan perlu dimasak terlebih dahulu. Makanan busuk harus dibuang; menjual ikan busuk akan ditolak.</small></p>'+
  (entries.length?'<select id="slpBagItem">'+entries.join('')+'</select>'+
   '<div class="slp-actions"><button data-life-action="eat_item">🍎 Makan Buah</button>'+
   '<button data-life-action="discard_item">🗑 Buang Barang</button></div>':'<small>Tas kosong. Mulung, mancing, atau panjat pohon untuk mengisi tas.</small>')+
  '</div>';
}
function hookActionButtons(){
 try{
  const list=getHooks()?.nearbyActions?.()||[];
  if(!list.length)return {html:'',spot:''};
  const html=list.map(a=>{
   const price=Number(a.price)>0?(' Rp'+Number(a.price).toLocaleString('id-ID')):'';
   return '<button data-life-action="'+esc(a.id)+'" data-args="'+esc(JSON.stringify(a.args||{}))+'">'+esc(a.label||a.id)+price+'</button>';
  }).join('');
  const spot=list.spot||list[0]?.spotLabel||'';
  return {html,spot,list};
 }catch{return {html:'',spot:''};}
}
function paintPanel(){
 if(!outer||!active||!state)return;
 const el=outer.querySelector('#slpContent');if(!el||el.hidden)return;
 const n=nearest();nearId=n?.id||'';
 const previousSelect=navSelect||'';
 const options=sites.map(t=>'<option value="'+esc(t.id)+'" '+(t.id===previousSelect?'selected':'')+'>'+esc(t.label)+(t.placeholder?' [PLACEHOLDER]':'')+'</option>').join('');
 const optsButton=(action,label,props={})=>'<button data-life-action="'+action+'" data-args="'+esc(JSON.stringify(props))+'">'+label+'</button>';
 const hooked=(!state.detained&&state.restMinutes===0&&!bagOpen)?hookActionButtons():{html:'',spot:''};
 const result=state.detained?
  optsButton('fine','💰 Bayar Denda Rp2.000')+optsButton('community_service','🧹 Bersihkan Gorong-gorong'):
  (state.restMinutes>0?optsButton('advance_time','⏩ Lewati 15 menit bed rest',{minutes:15}):
   bagOpen?bagMarkup():(hooked.html||nodeButtons(n)));
 const nextGoal=publishedCatalog?
  ('🏙️ JIWA AUTHORING · Hanya NPC, gedung, dan aset yang di-marking dalam World Entities untuk kota ini yang dapat berinteraksi. Tidak ada pekerjaan demo atau placeholder otomatis.'):
  ownsRoom()?('🏠 Hidup mandiri: gunakan WC/kamar, beli furnitur lewat HP, dan kelola token listrik.'):
  ('🎯 SANDBOX DEMO · Kumpulkan '+money(config.settings.roomPrice)+' untuk kost (sekarang '+money(state.wallet)+'). Aktivitas contoh hilang setelah katalog Jiwa disimpan.');
 el.innerHTML='<div class="slp-summary"><b>'+(ownsRoom()?'🏠 KOST':'⛺ HOBO')+'</b><b>'+money(state.wallet)+'</b><b>🎒 '+(state.inventory?.length||0)+'/'+(config.settings.bagSlots||8)+'</b><span>👥 Friends 🔒 V2</span></div>'+
  '<div class="slp-goal">'+nextGoal+'</div>'+
  '<div class="slp-stats">'+drawStats()+'</div>'+
  (state.restMinutes>0?'<div class="slp-alert">⚠ PINGSAN · Bed rest '+state.restMinutes+' menit. Tidak bisa bekerja atau berjalan.</div>':'')+
  (state.detained?'<div class="slp-alert">🚨 DITAHAN HANSIP · Pilih denda atau kerja sosial.</div>':'')+
  (state.bladder>=80?'<div class="slp-alert">🚾 Kebelet pipis! Cari WC sebelum terlambat.</div>':'')+
  '<div class="slp-spot">📍 '+(bagOpen?'TAS / INVENTORI':(hooked.spot?esc(hooked.spot):n?esc(n.label)+(n.placeholder?' [PLACEHOLDER]':''):(bridge?.interiorKind?.()==='kost'?'Kost':bridge?.interiorKind?.()==='warteg'?'Warteg':'Jelajahi kota untuk menemukan pekerjaan dan kebutuhan')))+'</div>'+
  '<div class="slp-actions" id="slpActions">'+result+'</div>'+
  ''+
  '<div class="slp-actions"><button id="slpPhone" type="button">📱 NOKIA · PETA AKTIVITAS</button><button id="slpBag" type="button">'+(bagOpen?'← Kembali':'🎒 Tas')+'</button></div>'+  
  '<details><summary>🧪 ALAT TES (bukan aksi gameplay)</summary><p><small>Untuk mengecek skenario tanpa memodifikasi kota asli.</small></p>'+
  '<div class="slp-goto"><select id="slpDestination">'+options+'</select><button id="slpTravel" type="button">TELEPORT TEST</button></div>'+
  '<div class="slp-actions">'+optsButton('respawn','↻ Test Respawn')+
  optsButton('advance_time','⏩ +30 menit',{minutes:30})+'</div>'+
  '<div><b>Inventory:</b> '+esc((state.inventory||[]).map(id=>state.itemMeta?.[id]?.label||id).join(', ')||'kosong')+'</div>'+
  '<div><b>Furnitur:</b> '+esc((state.furniture||[]).join(', ')||'belum')+' · <b>Token:</b> '+state.powerTokens+' · <b>Barang kost:</b> '+(state.homeStorage||[]).length+'</div>'+
  '<div><b>Sumber mekanik:</b> '+esc(configSource)+'</div>'+
  '<button id="slpReset" type="button">RESET PROGRESS TEST</button></details>'+
  '<div id="lifePlayMessage" role="status">'+esc(statusText||'Dekati objek dan gunakan Action. Tahan Action untuk bekerja.')+'</div>';
 if(previousSelect&&Array.from(el.querySelector('#slpDestination')?.options||[]).some(o=>o.value===previousSelect))el.querySelector('#slpDestination').value=previousSelect;
}
function click(ev){
 const el=ev.target.closest('button');if(!el)return;
 if(el.id==='slpTravel'){
  const id=outer.querySelector('#slpDestination')?.value;
  const point=sites.find(s=>s.id===id);if(!point)return;
  bridge.teleport(point.x,point.z);message('Teleport TEST ke '+point.label);paintPanel();return;
 }
 if(el.id==='slpPhone'){openPhone();return;}
 if(el.id==='slpBag'){bagOpen=!bagOpen;paintPanel();return;}
 if(el.id==='slpReset'){
  if(!confirm('Reset semua uang, inventori, status, dan akses kost untuk test kota ini?'))return;
  resetSave();bridge.respawn();paintPanel();return;
 }
 if(el.dataset.lifeAction){
  let args={};try{args=JSON.parse(el.dataset.args||'{}');}catch{}
  if(el.dataset.lifeAction==='take_fridge')args.itemId=outer.querySelector('#slpFridgeItem')?.value||'';
  if(el.dataset.lifeAction==='take_home')args.itemId=outer.querySelector('#slpHomeItem')?.value||'';
  if(['eat_item','discard_item'].includes(el.dataset.lifeAction))args.itemId=outer.querySelector('#slpBagItem')?.value||'';
  if(['sell_fish','sell_loak','cook','store_fridge','store_home'].includes(el.dataset.lifeAction)){
   args.itemId=outer.querySelector('#slpItem')?.value||'';
  }
  if(el.dataset.lifeAction==='cook_recipe')args.activityId=outer.querySelector('#slpRecipe')?.value||'';
  if(el.dataset.lifeAction==='buy_furniture')args.itemId=outer.querySelector('#slpFurniture')?.value||'';
  runAction(el.dataset.lifeAction,args);
 }
}
function workDown(ev){
 if(!['slpWork','ptActionBtn'].includes(ev.target.id)||!active||progress)return;
 const n=nearest();
 if(!n||!n.jobId)return;
 if(state.detained||state.restMinutes>0||state.energy<10){message('Tidak bisa bekerja: perlu energi 10 dan bebas dari hukuman.');return;}
 const job=config.jobs?.find(j=>j.id===n.jobId);
 if(job&&state.hygiene<job.minHygiene){message('Pekerjaan '+job.label+' butuh kebersihan '+job.minHygiene+'.');return;}
 ev.preventDefault();
 workHoldStart=performance.now();
 const jobMinutes=job?.minutes||30;
 progress={started:workHoldStart,needed:Math.max(850,jobMinutes*90/(1+(state?.experience||0)/100))};
 const button=ev.target;try{button.setPointerCapture(ev.pointerId);}catch{}
 const animate=()=>{
  if(!progress||!active)return;
  const pct=clamp((performance.now()-progress.started)/progress.needed,0,1);
  const fill=outer?.querySelector('#slpWorkFill');if(fill)fill.style.width=(pct*100)+'%';
  if(pct>=1){progress=null;workAnimation=0;justWorkedAt=performance.now();runAction('work',{jobId:nearest()?.jobId});return;}
  workAnimation=requestAnimationFrame(animate);
 };
 workAnimation=requestAnimationFrame(animate);
}
function workUp(ev){
 if(!progress)return;
 progress=null;cancelAnimationFrame(workAnimation);workAnimation=0;
 const fill=outer?.querySelector('#slpWorkFill');if(fill)fill.style.width='0%';
}
function openPhone(){
 if(!active)return false;
 // Reuse the original Nokia phone window and its existing key navigation.
 // This also runs from the main HUD HP button through onPhone.
 if(typeof root.VLPlayHud?.toggleWindow!=='function')return false;
 root.VLPlayHud.toggleWindow('phone');
 return true;
}
function openBag(){
 if(!active||!outer)return false;
 bagOpen=!bagOpen;
 const content=outer.querySelector('#slpContent');if(content)content.hidden=false;
 paintPanel();return true;
}
function actionDown(ev){workDown(ev);}
function actionUp(ev){workUp(ev);}
// Successful life actions play their LGR motion on the player (Bergerak DB id,
// built-in or stand-in via LGRGame; never blocks when a motion is missing).
const ACTION_POSE={cook:'cook',eat:'eat',eat_item:'eat',coffee:'drink_coffee',fish:'fishing_cast',scavenge:'mulung_pick',
 public_toilet:'wc_squat',home_toilet:'wc_squat',public_shower:'mandi',home_shower:'mandi',wall_pee:'pee_wall',fart:'idle',talk:'talk',
 worship:'pray_generic',charity:'give_sedekah',help:'hand_over',sell_fish:'hand_over',sell_loak:'hand_over',
 store_fridge:'use_storage',take_fridge:'use_storage',store_home:'use_storage',take_home:'use_storage',catch_fruit:'pick_up'};
const JOB_POSE={manusia_silver:'silver_pose',pak_ogah:'ogah_flag',kang_parkir:'parkir_whistle'};
function actionPose(action,args){
 if(action==='work')return JOB_POSE[args.jobId]||'talk';
 if(action==='configured_activity'||action==='cook_recipe'){const a=config?.activities?.find(x=>x.id===args.activityId);return a?.actionAsset||(action==='cook_recipe'?'cook':null);}
 return ACTION_POSE[action]||null;
}
// Kitchen recipes from the Jiwa activity catalog (ingredients -> output item), cooked
// at the owned kost stove. Uses the same engine rule as a configured activity.
const isRecipe=a=>a&&a.ingredients?.length&&a.outputItem&&['none','inventory','prop'].includes(a.grantType);
function kitchenRecipes(){
 const live=(config?.activities||[]).filter(isRecipe);
 if(live.length||publishedCatalog)return live;
 // Sandbox demo (nothing published in Jiwa yet): offer the catalog's default recipes.
 try{return RULES.normalize({activities:(root.JiwaActivities?.readLocal?.(localStorage)?.activities||[])
  .filter(a=>a.category==='cooking').map(a=>({...a,enabled:true}))}).activities.filter(isRecipe);}catch{return [];}
}
function cookRecipe(args){
 const nodeHere=nearest();
 if(nodeHere?.id!=='kost')return {ok:false,reason:'Dekati kost dahulu.'};
 if(!ownsRoom()||!state.furniture.includes('stove'))return {ok:false,reason:'Masak membutuhkan kost dan kompor.'};
 if((state.powerTokens||0)<1)return {ok:false,reason:'Token listrik habis.'};
 const a=kitchenRecipes().find(x=>x.id===String(args.activityId||''));
 if(!a)return {ok:false,reason:'Resep belum ada di katalog Jiwa.'};
 const cfg=config.activities.some(x=>x.id===a.id)?config:{...config,activities:[...config.activities,a]};
 const result=RULES.run(cfg,state,'configured_activity',{activityId:a.id,riskRoll:1});
 if(result.ok){result.state.powerTokens=Math.max(0,(result.state.powerTokens||0)-1);result.changes.push('hasil: '+(a.outputLabel||a.outputItem));}
 return result;
}
function afterLifeTransition(previous){
 if(!active||!state)return;
 if((state.faintCount||0)>(previous?.faintCount||0)&&state.restMinutes>0){
  lastFaintCount=state.faintCount;
  progress=null;cancelAnimationFrame(workAnimation);workAnimation=0;
  for(const el of document.querySelectorAll('#ptActionBtn,#slpWork'))el.blur?.();
  bridge?.respawn?.({fainted:true});
  message('⚠ PINGSAN! Dipindahkan ke '+(ownsRoom()?'kost':'tenda hobo')+' untuk bed rest '+state.restMinutes+' menit.');
 }
 notifyHud();paintPanel();
}
function notifyHud(){try{bridge?.syncHud?.();}catch{}}
function runAction(action,args={}){
 if(!active||!RULES)return {ok:false,reason:'Play Game belum dimulai'};
 const ALIAS={bathe:'home_shower',use_toilet:'home_toilet'};
 if(ALIAS[action])action=ALIAS[action];
 if(String(action).startsWith('scene:')){
  try{
   const Scenes=root.SemestaIntScenes;
   const id=String(args.sceneId||action.slice(6));
   if(!Scenes)return {ok:false,reason:'Adegan belum siap'};
   const r=Scenes.play(id,{
    pause:()=>getHooks()?.pause?.(),
    resume:()=>getHooks()?.resume?.(),
    emit:(type,detail)=>{try{root.dispatchEvent?.(new root.CustomEvent(type,{detail}));}catch(_e){}
     try{root.parent?.postMessage?.({type,detail},'*');}catch(_e){}}
   });
   if(!r.ok)message('⛔ '+(r.reason||'Adegan gagal'));
   paintPanel();return r;
  }catch(err){return {ok:false,reason:String(err.message||err)};}
 }
 if(action==='enter_room'){
  try{
   const I=bridge?.playInteriors||root.VLNjhPlayInteriors;
   if(args.locked){message('Terkunci');return {ok:false,reason:'Terkunci'};}
   const r=I?.enterInterior?.(args.roomId)||I?.openInteriorById?.(args.roomId)||{ok:false,reason:'Pintu tidak bisa dibuka'};
   if(!r.ok)message('⛔ '+(r.reason||'Terkunci'));
   paintPanel();return r;
  }catch(err){return {ok:false,reason:String(err.message||err)};}
 }
 if(action==='exit_interior'||action==='enter_interior'){
  try{
   const I=bridge?.playInteriors||root.VLNjhPlayInteriors;
   const fn=action==='exit_interior'?(I?.exit||bridge?.exitInterior):(I?.enterNearby||bridge?.enterInterior);
   const r=(typeof fn==='function'?fn():null)||{ok:false,reason:'Interior tidak tersedia'};
   if(r.ok)message(action==='exit_interior'?'🚪 Keluar ruangan':'Masuk ruangan');
   else message('⛔ '+(r.reason||'Tidak bisa'));
   paintPanel();return r;
  }catch(err){return {ok:false,reason:String(err.message||err)};}
 }
 try{if(getHooks())args=getHooks().argsFor(action,args);}catch{}
 try{
  const Access=root.SemestaRoomAccess;
  const room=bridge?.playInteriors?.roomId?.()||getHooks()?.roomAccess&&null;
  const roomId=bridge?.playInteriors?.roomId?.();
  if(Access&&roomId){
   const deny=Access.rejectAction(playerId(),roomId,action,args);
   if(deny){message(deny);return {ok:false,reason:deny};}
  }
 }catch(_e){}
 const gate=getHooks()?.furnitureAllows?.(action,{});
 if(gate&&gate.ok===false)return {ok:false,reason:gate.reason||'Furnitur tidak ada di dekatmu'};
 if(action==='wall_pee'){
  const allow=getHooks()?.nearbyActions?.()?.find(a=>a.id==='wall_pee');
  if(!allow)return {ok:false,reason:'Dekati dan hadap tembok atau bangunan (kandung kemih ≥ 65).'};
 }
 // Also guard the public runAction API, not only the visible action menu.
 if(publishedCatalog&&['pee_outside','fish','sell_fish','work','scavenge','sell_loak',
  'catch_fruit','eat','coffee','public_toilet','public_shower','buy_room',
  'home_toilet','home_shower','sleep','cook','store_fridge','take_fridge',
  'store_home','take_home','rest','help','charity','worship'].includes(action))
  return {ok:false,reason:'Aksi demo tidak berlaku setelah katalog Jiwa disimpan. Tandai objek dan atur aktivitas di Jiwa Entities.'};
 if(action==='respawn'){
  bridge?.respawn?.();return {ok:true,reason:'respawn'};
 }
 const nearestNode=nearest();
 let node=nearestNode;
 // Resolve the explicitly chosen sibling instead of accidentally applying
 // nearest() to a different rule on the same exact placed entity.
 if(publishedCatalog&&nearestNode?.sourceId){
  const siblings=authoredAt(nearestNode);
  if(['world_ambient','world_enter','world_quest'].includes(action)){
   const target=siblings.find(s=>s.worldRuleId===String(args.ruleId||''));
   if(target)node=target;
  }else if(action==='configured_activity'){
   const target=siblings.find(s=>s.activityId===String(args.activityId||'')&&!s.worldRuleId);
   if(target)node=target;
  }
 }
 if(action==='cook_recipe'&&nearestNode?.id==='kost')node=nearestNode;
 if(['world_ambient','world_enter','world_quest'].includes(action)){
  const ruleId=String(args.ruleId||'');
  if(node?.worldRuleId!==ruleId||node.placeholder)
   return {ok:false,reason:'Dekati entity interaksi yang cocok di Semesta.'};
  const rule=config.worldEntities?.find(x=>x.id===ruleId);
  if(!rule||rule.operation!==({world_ambient:'ambient',world_enter:'enter',world_quest:'npc_quest'}[action]))
   return {ok:false,reason:'World rule tidak valid atau belum diaktifkan.'};
  if(action==='world_enter'){
   if(!rule.enterable||!bridge?.openInteriorById?.(node.sourceId)){
    message('⛔ Interior Bangun Ruang belum tersedia untuk gedung ini.');
    return {ok:false,reason:'Interior belum dibuat atau belum dapat dimasuki.'};
   }
   message('🚪 Masuk '+rule.label);
   return {ok:true,reason:'Interior dibuka'};
  }
  if(action==='world_quest'){
   if(!config.activities.some(x=>x.id===rule.activityId))
    return {ok:false,reason:'Quest NPC belum terhubung ke aktivitas yang aktif.'};
   message('❗ '+rule.label+' memberi quest: '+(config.activities.find(x=>x.id===rule.activityId)?.label||rule.activityId));
   return {ok:true,reason:'Quest NPC ditawarkan',activityId:rule.activityId};
  }
  action='world_ambient';args={...args,ruleId};
 }
 if(action==='configured_activity'){
  const expected='act:'+String(args.activityId||'');
  if(node?.id!==expected||node.placeholder)return {ok:false,reason:'Datangi bangunan aktivitas yang sesuai di Semesta.'};
 }
 if(!['advance_time','fine','community_service','luck_find','course','buy_fridge','buy_furniture','buy_token','pee_outside','wall_pee','fart','talk','tea','quest_reward','eat_item','discard_item','set_identity','wash','enter_room','exit_interior'].includes(action)&&!node)
  return {ok:false,reason:'Dekati lokasi interaksi terlebih dahulu'};
 const required={
  fish:'fish',sell_fish:args.buyerId,work:args.jobId?(sites.find(v=>v.jobId===args.jobId)?.id||'job_silver'):'job_silver',scavenge:'scavenge',sell_loak:'loak',catch_fruit:'tree',
  eat:'warung',coffee:'coffee',public_toilet:'public_wc',public_shower:'public_bath',
  buy_room:'kost',home_toilet:'kost',home_shower:'kost',sleep:ownsRoom()?'kost':'tent',
  cook:'kost',cook_recipe:'kost',store_fridge:'kost',take_fridge:'kost',store_home:'kost',take_home:'kost',rest:'bench',help:'help',charity:'charity',
  worship:node?.id?.startsWith('prayer_')?node.id:'prayer'
 }[action];
 const inWarteg=(bridge?.interiorKind?.()||root.VLNjhPlayInteriors?.kind?.())==='warteg';
 if(required&&node?.id!==required&&!(action==='eat'&&inWarteg)){
  message('Dekati '+(sites.find(s=>s.id===required)?.label||required)+' dahulu.');return {ok:false,reason:'Lokasi aksi tidak sesuai'};
 }
 if(action==='buy_room'){
  args={...args,roomSpawn:{id:node.sourceId||'kost_placeholder',x:node.x,z:node.z,placeholder:node.placeholder}};
 }
 if(action==='worship'&&node){args={...args,placeReligion:node.religion};}
 const prior=state;
 const result=action==='cook_recipe'?cookRecipe(args):RULES.run(config,state,action,args);
 if(result.ok){
  state=result.state;
  if(['fish','work','scavenge','catch_fruit'].includes(action)&&!state.detained){
   const luck=RULES.run(config,state,'luck_find',{roll:Math.random()});
   if(luck.ok)state=luck.state;
   if(luck.ok&&luck.changes.some(x=>x.includes('+Rp')||x.includes('NASIB BURUK')))result.changes.push(...luck.changes);
  }
  persist();
  if(action==='buy_room')message('🏠 Kost dibeli! Respawn berikutnya pindah ke kamar. WC dan mandi pribadi aktif.');
  else message('✅ '+result.changes.join(' · '));
 }else message('⛔ '+result.reason);
 if(result.ok){const pose=actionPose(action,args);if(pose&&action!=='sleep')try{bridge?.playPose?.(pose,4);}catch{}}
 if(result.ok&&action==='fart'&&(args.witnessed||args.nearNpc||args.nearby>0))reactNpcsToFart();
 if(result.ok)afterLifeTransition(prior);
 else{notifyHud();paintPanel();}
 return result;
}
function handleAction(){
 if(!active)return false;
 try{
  const inside=bridge?.interiorKind?.();
  const door=inside?(bridge?.exitInterior?.()):(bridge?.enterInterior?.());
  if(door?.ok)return true;
 }catch{}
 const node=nearest();
 if(!node)return false;
 if(node.jobId){
  if(performance.now()-justWorkedAt<550)return true;
  message('TAHAN tombol Action (atau tombol KERJA di panel) sampai progress penuh.');
  paintPanel();return true;
 }
 if(node.worldRuleId){
  runAction(node.operation==='ambient'?'world_ambient':node.operation==='enter'?'world_enter':'world_quest',
   {ruleId:node.worldRuleId});return true;
 }
 if(node.activityId){runAction('configured_activity',{activityId:node.activityId});return true;}
 if(node.id==='siomay_batagor'||node.id==='pasar_ikan'||node.id==='loak'){
  message('Pilih barang dari tas, kemudian klik JUAL di panel.');paintPanel();return true;
 }
 const action=node.action;
 if(node.id==='kost'&&ownsRoom()){bagOpen=false;message('Pilih WC, mandi, tidur, atau penyimpanan di panel.');paintPanel();return true;}
 runAction(action,node.id==='fish'?{spotId:node.sourceId||'river'}:
  node.id==='bench'?{seatId:node.sourceId||'bangku_preview'}:
  node.id==='public_wc'||node.id==='public_bath'?{facilityId:node.sourceId||node.id}:{});return true;
}
function refresh(){
 if(!active)return;
 paintPanel();notifyHud();
}
function actorMoved(dt){
 if(!active||!state||!bridge)return;
 const p=getPos();
 if(!Number.isFinite(p.x)||!Number.isFinite(p.z))return;
 if(!actorMoved.prev){actorMoved.prev={x:p.x,z:p.z};return;}
 const delta=Math.hypot(p.x-actorMoved.prev.x,p.z-actorMoved.prev.z);
 actorMoved.prev={x:p.x,z:p.z};
 if(delta>0&&delta<3){
  walkerDistance+=delta;
  if(walkerDistance>=8){
   walkerDistance-=8;
   const result=RULES.run(config,state,'walk',{units:1});
   if(result.ok){const prior=state;state=result.state;persist();afterLifeTransition(prior);}
  }
 }
}
function checkHansip(){
 // Demo automatic arrest is not a substitute for authored Jiwa punishments.
 if(publishedCatalog)return;
 if(!active||!state||state.detained||state.arrestGraceMinutes>0||state.moral>=config.settings.arrestMoralThreshold)return;
 const p=getPos();
 const witness=(getWorld().objects||[]).find(o=>/hansip|satpam|security.guard/i.test(name(o))&&
  Math.hypot((Number(o.x)||0)-p.x,(Number(o.z)||0)-p.z)<4)||
  sites.find(n=>n.id==='hansip'&&Math.hypot(n.x-p.x,n.z-p.z)<4);
 if(!witness)return;
 const result=RULES.run(config,state,'arrest',{witnessed:true});
 if(result.ok){state=result.state;persist();message('🚨 Hansip menangkapmu! Bayar denda atau kerja sosial.');notifyHud();paintPanel();}
}
function tick(dt){
 if(!active||!state)return;
 if(getHooks()?.isPaused?.())return;
 const seconds=Math.max(0,Math.min(.2,Number(dt)||0));
 tickLifeNpcs(seconds);
 actorMoved(seconds);
 timeAccumulator+=seconds;
 const period=Math.max(1,config.settings.realSecondsPerGameMinute||8);
 if(timeAccumulator>=period){
  const minutes=Math.min(15,Math.floor(timeAccumulator/period));
  timeAccumulator-=minutes*period;
  const result=RULES.run(config,state,'advance_time',{minutes});
  if(result.ok){
   const prior=state;state=result.state;persist();afterLifeTransition(prior);
   if(result.changes.some(x=>x.startsWith('BED REST SELESAI')))
    message('✅ Bed rest selesai. Energi pulih; sekarang bisa beraktivitas lagi.');
  }
 }
 frameAccumulator+=seconds;
 if(frameAccumulator>=.9){
  frameAccumulator=0;checkHansip();
  const current=nearest()?.id||'';
  if(nearId!==current)paintPanel();
 }
}
function moneyBalance(){return active&&state?state.wallet:null;}
function bagLabels(){return active&&state?(state.inventory||[]).map(id=>state.itemMeta?.[id]?.label||id):null;}
function speedFactor(){return active&&state?RULES.speedFactor(state):1;}
const NOKIA_ICONS={
 fish:'fish',siomay_batagor:'stall',pasar_ikan:'market',job_silver:'office',job_pak_ogah:'office',
 job_kang_parkir:'office',premium_job:'office',loak:'market',scavenge:'scav',tree:'tree',
 warung:'stall',coffee:'cup',public_wc:'wc',public_bath:'bath',kost:'house',tent:'tent',
 help:'kontak',charity:'charity',bench:'bench',course:'kursus',hansip:'hansip'
};
function nokiaSnapshot(){
 if(!active||!state)return null;
 const ACTIVITY_ICONS={money:'office',energy:'cup',moral:'prayer',
  immoral:'hansip',exp:'kursus',cooking:'stall',buying:'market',punishment:'hansip'};
 const iconFor=n=>n.id.startsWith('prayer_')?'prayer':
  n.activityId?(ACTIVITY_ICONS[n.category]||'peta'):(NOKIA_ICONS[n.id]||'peta');
 return {
  wallet:state.wallet,experience:state.experience,energy:state.energy,
  moral:state.moral,hygiene:state.hygiene,bladder:state.bladder,fullness:state.fullness,
  identity:{...state.identity},ownsRoom:ownsRoom(),
  religions:RULES.RELIGIONS.filter(v=>v!=='satanis'),zodiacs:RULES.ZODIACS.slice(),
  transactions:(state.transactions||[]).slice().reverse(),
  inventory:(state.inventory||[]).map(id=>({id,label:state.itemMeta?.[id]?.label||id})),
  furniture:(state.furniture||[]).slice(),
  fridgeOwned:!!state.housing?.fridge,homeStorageCount:(state.homeStorage||[]).length,
  powerTokens:state.powerTokens,
  settings:{...config.settings},
  furnitureCatalog:RULES.FURNITURE.map(v=>({...v})),
  map:{
   player:{x:Number(getPos().x)||0,z:Number(getPos().z)||0},bounds:cachedMapOverview.bounds,terrain:cachedMapOverview.terrain,
   sites:sites.filter(n=>!n.ambient).map(n=>({id:n.id,label:n.label,icon:iconFor(n),
    x:n.x,z:n.z,placeholder:!!n.placeholder}))
  },
  runAction:(action,args)=>runAction(action,args)
 };
}
function attachNokia(){
 if(typeof root.VLPhoneEllen?.setGameProvider==='function')
  root.VLPhoneEllen.setGameProvider(nokiaSnapshot);
}
function detachNokia(){
 if(typeof root.VLPhoneEllen?.setGameProvider==='function')
  root.VLPhoneEllen.setGameProvider(null);
}
function start(){
 if(!RULES||!bridge)return false;
 const id=cityId();
 if(active&&id===projectId)return true;
 if(active)stop();
 projectId=id;active=true;sessionRevision++;timeAccumulator=0;frameAccumulator=0;bagOpen=false;
 bindHooks();
 const gameCatalog=root.JiwaActivities?.readLocal?.(localStorage);
 publishedCatalog=!!gameCatalog?.updatedAt;
 config=RULES.normalize({...defaults(),activities:gameCatalog?.activities||[],
  worldEntities:gameCatalog?.worldEntities||[]});
 configSource=publishedCatalog?'JIWA AUTHORING':'SANDBOX DEMO';restore();buildSites();makeRoot();attachNokia();
 if(outer){outer.hidden=false;outer.querySelector('#slpContent').hidden=false;}
 placeMarkers();paintPanel();reloadRules(sessionRevision);
 message('🎮 Play Mode aktif. '+(ownsRoom()?'Respawn di kost':'Mulai sebagai hobo; respawn dari tenda pinggiran kota')+'.');
 return true;
}
function stop(){
 if(!active)return;
 persist();detachNokia();active=false;cancelAnimationFrame(workAnimation);progress=null;
 disposeMarkers();disposeNpcGroup();lifeNpcs=[];if(outer)outer.hidden=true;
 actorMoved.prev=null;walkerDistance=0;nearId='';timeAccumulator=0;bagOpen=false;
}
function attach(bridgeApi){bridge=bridgeApi||null;return api;}
try{root.addEventListener?.('storage',ev=>{
 if(ev.key==='jiwa-activities-global-v1'&&active)reloadRules(sessionRevision);
});}catch(_e){}
const LIFE_NPC_DEFS=[
 {id:'npc_silver',siteId:'job_silver',label:'Mas Silver',role:'work',behavior:'work',questId:'q_silver',lgr:'manusia_silver'},
 {id:'npc_ogah',siteId:'job_pak_ogah',label:'Pak Ogah',role:'work',behavior:'work',questId:'q_ogah',lgr:'pak_ogah'},
 {id:'npc_parkir',siteId:'job_kang_parkir',label:'Kang Parkir',role:'work',behavior:'work',questId:'q_parkir',lgr:'kang_parkir'},
 {id:'npc_premium',siteId:'premium_job',label:'HRD Kantor',role:'work',behavior:'idle',lgr:null},
 {id:'npc_siomay',siteId:'siomay_batagor',label:'Bang Siomay',role:'buyer',behavior:'idle',lgr:null},
 {id:'npc_pasar',siteId:'pasar_ikan',label:'Ibu Pasar Ikan',role:'buyer',behavior:'idle',lgr:null},
 {id:'npc_loak',siteId:'loak',label:'Babeh Loak',role:'buyer',behavior:'idle',questId:'q_loak',lgr:null},
 {id:'npc_hansip',siteId:'hansip',label:'Pak Hansip',role:'hansip',behavior:'patrol',lgr:'hansip'},
 {id:'npc_help',siteId:'help',label:'Warga',role:'quest',behavior:'idle',questId:'q_warga',lgr:null}
];
let lifeNpcs=[],npcGroup=null,npcReactUntil=0;
function lgrAvailable(id){
 if(!id)return false;
 try{
  const vault=root.VLVirtualLifeVault||root.VLAssetLibrary;
  if(vault&&typeof vault.has==='function'&&vault.has(id))return true;
  if(vault?.ids?.includes?.(id))return true;
 }catch(_e){}
 return false;
}
function disposeNpcGroup(){
 if(!npcGroup)return;
 npcGroup.parent?.remove(npcGroup);
 npcGroup.traverse(n=>{if(n.geometry)n.geometry.dispose();if(n.material){const m=Array.isArray(n.material)?n.material:[n.material];for(const x of m){x.map?.dispose();x.dispose();}}});
 npcGroup=null;
}
function placeLifeNpcs(){
 lifeNpcs=[];disposeNpcGroup();
 const THREE=bridge?.THREE||root.THREE;
 const scene=getScene();
 if(THREE&&scene){npcGroup=new THREE.Group();npcGroup.name='__njh_life_npcs__';scene.add(npcGroup);}
 for(const def of LIFE_NPC_DEFS){
  const site=sites.find(s=>s.id===def.siteId);
  if(!site)continue;
  const placeholder=!!site.placeholder||!lgrAvailable(def.lgr);
  const npc={id:def.id,label:def.label,siteId:def.siteId,role:def.role,behavior:def.behavior,
   questId:def.questId||null,x:site.x+0.7,z:site.z+0.7,placeholder,lgr:lgrAvailable(def.lgr)?def.lgr:null,
   emote:null,type:'life_npc',npc:true,homeX:site.x+0.7,homeZ:site.z+0.7,patrolT:Math.random()*Math.PI*2};
  site.npc=true;site.npcId=npc.id;
  lifeNpcs.push(npc);
  if(!npcGroup||!THREE)continue;
  const color=PLACEHOLDER_COLORS[def.siteId]||0x88aacc;
  const mat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:placeholder?0.85:1});
  const geom=(THREE.CapsuleGeometry?new THREE.CapsuleGeometry(0.18,0.7,4,8):new THREE.CylinderGeometry(0.18,0.18,1.1,8));
  const mesh=new THREE.Mesh(geom,mat);
  mesh.position.set(npc.x,0.55,npc.z);mesh.userData.npcId=npc.id;
  const label=makeLabel(THREE,npc.label+(placeholder?' · PH':''));
  label.position.set(0,0.85,0);mesh.add(label);
  npcGroup.add(mesh);npc.mesh=mesh;
 }
}
function tickLifeNpcs(dt){
 if(!lifeNpcs.length)return;
 const now=(typeof performance!=='undefined'?performance.now():Date.now());
 for(const n of lifeNpcs){
  if(n.emote&&npcReactUntil&&now>npcReactUntil){n.emote=null;}
  if(n.behavior!=='patrol')continue;
  n.patrolT=(n.patrolT||0)+((dt||0.016)*0.6);
  n.x=n.homeX+Math.cos(n.patrolT)*1.4;
  n.z=n.homeZ+Math.sin(n.patrolT)*1.4;
  if(n.mesh)n.mesh.position.set(n.x,0.55,n.z);
 }
}
function reactNpcsToFart(){
 const p=getPos();
 npcReactUntil=(typeof performance!=='undefined'?performance.now():Date.now())+2500;
 for(const n of lifeNpcs){
  if(Math.hypot(n.x-p.x,n.z-p.z)>2)continue;
  n.emote='jijik';
  try{bridge?.setNpcEmotion?.(n.id,'disgust',2.5);}catch(_e){}
 }
 try{
  const w=root;
  const Ev=w?.CustomEvent||(typeof CustomEvent!=='undefined'?CustomEvent:null);
  if(w?.dispatchEvent&&Ev)w.dispatchEvent(new Ev('mainkan:npc-react',{detail:{action:'fart',emote:'jijik'}}));
 }catch(_e){}
}
function hookApi(name,fallback){
 return function(){const h=getHooks();if(h&&typeof h[name]==='function')return h[name].apply(h,arguments);return fallback;}
}
function publicSites(){
 const h=getHooks();
 if(h&&typeof h.sites==='function')return h.sites();
 return (sites||[]).map(s=>({id:s.id,label:s.label,x:s.x,z:s.z,placeholder:!!s.placeholder,npc:!!s.npc,points:s.points||[{id:s.sourceId||s.id,x:s.x,z:s.z}]}));
}
const api=Object.freeze({attach,start,stop,active:visible,persist,state:()=>state,sites:publicSites,npcs:()=>lifeNpcs.map(n=>({id:n.id,label:n.label,siteId:n.siteId,role:n.role,behavior:n.behavior,x:n.x,z:n.z,placeholder:!!n.placeholder,lgr:n.lgr||null,emote:n.emote||null})),spawnEntitlement,
 spawnModule,fallbackSpawn,onSpawn,handleAction,actionDown,actionUp,openPhone,openBag,runAction,tick,refresh,money:moneyBalance,bag:bagLabels,speedFactor,
 reload:()=>reloadRules(sessionRevision),reset:()=>{if(!active)return;resetSave();paintPanel();},
 playerId,startProfiles:()=>startProfilesReady,currentPose:()=>bridge?.currentPose?.()||null,
 spawnAt:hookApi('spawnAt',{ok:false,reason:'hooks missing'}),
 housing:hookApi('housing',null),
 relationship:hookApi('relationship',[]),
 roomAccess:hookApi('roomAccess',null),
 nearbyActions:hookApi('nearbyActions',[]),
 pause:hookApi('pause',{ok:false}),resume:hookApi('resume',{ok:false}),
 isPaused:()=>!!getHooks()?.isPaused?.(),
 clock:hookApi('clock',null),
 onDayEnd:hookApi('onDayEnd',null),
 dayReport:hookApi('dayReport',null),
 level:hookApi('level',1),
 skills:hookApi('skills',[]),
 reputation:hookApi('reputation',[]),
 housingProgress:hookApi('housingProgress',null),
 quests:hookApi('quests',[]),
 acceptQuest:(npcId,questId)=>getHooks()?.acceptQuest?.(npcId,questId)||{ok:false},
 turnInQuest:(npcId,questId)=>getHooks()?.turnInQuest?.(npcId,questId)||{ok:false},
 jobs:hookApi('jobs',[]),
 enterInterior:(id)=>!!getHooks()?.enterInterior?.(id),
 furnitureSpots:hookApi('furnitureSpots',[]),
 messages:hookApi('messages',[]),
 openMap:hookApi('openMap',{ok:false}),
 questMarkers:hookApi('questMarkers',[]),
 enterables:hookApi('enterables',[]),
 worldToScreen:hookApi('worldToScreen',{x:0,y:0,visible:false}),
 playerPosition:hookApi('playerPosition',{x:0,y:0,z:0}),
 hasSave:hookApi('hasSave',false),
 saveMeta:hookApi('saveMeta',null),
 saveSlot:hookApi('saveSlot',{ok:false}),
 loadSlot:hookApi('loadSlot',{ok:false}),
 listSlots:hookApi('listSlots',[]),
 resetSave:(slot)=>{if(slot==null||slot===''){if(!active)return {ok:false,reason:'Play Game belum dimulai'};resetSave();paintPanel();return {ok:true,reset:true};}return getHooks()?.resetSave?.(slot)||{ok:false};},
 setInteriorFurnitureAdapter:fn=>{if(bridge)bridge.interiorFurniture=typeof fn==='function'?fn:()=>[];bindHooks();}
});
return api;
});
