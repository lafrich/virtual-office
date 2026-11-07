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
const STORAGE='semesta-life-play-v1:';
const DATA_DB='jiwa-mechanics-v1',DATA_STORE='projects';
const SITES=[
 {id:'fish',label:'Mancing',icon:'🎣',pattern:/sungai|river|danau|kolam|fishing|mancing/i,action:'fish',offset:[5,-5]},
 {id:'siomay_batagor',label:'Bang Siomay / Batagor',icon:'🥟',pattern:/siomay|batagor/i,action:'sell_fish',offset:[7,0]},
 {id:'pasar_ikan',label:'Pasar Ikan',icon:'🐟',pattern:/pasar.?ikan|fish.?market/i,action:'sell_fish',offset:[-7,3]},
 {id:'job',label:'Manusia Silver / Pak Ogah',icon:'💼',pattern:/manusia.?silver|pak.?ogah|kang.?parkir|job.npc|street.performer/i,action:'work',offset:[-5,4]},
 {id:'premium_job',label:'Kerja Premium / Kantor',icon:'🏢',pattern:/kantor.?premium|premium.?job|office.?job/i,action:'work',offset:[-2,5]},
 {id:'loak',label:'Toko Loak',icon:'♻',pattern:/toko.?loak|babeh|pawnshop/i,action:'sell_loak',offset:[8,5]},
 {id:'scavenge',label:'Titik Mulung',icon:'📦',pattern:/botol|kardus|sampah|trash|barang.?bekas|scavenge/i,action:'scavenge',offset:[-8,-3]},
 {id:'tree',label:'Pohon Buah',icon:'🌳',pattern:/pohon|tree|mangga|jambu/i,action:'catch_fruit',offset:[-4,-8]},
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
const PLACEHOLDER_COLORS={help:0x63a1a2,charity:0xd3a6c0,bench:0x9b825c,premium_job:0x9579ba,hansip:0xc66766,fish:0x5596be,siomay_batagor:0xe0a94a,pasar_ikan:0x4baf9d,job:0xd18e3a,
 loak:0x839758,scavenge:0x9d9c84,tree:0x519a64,warung:0xd5aa53,coffee:0x856649,
 public_wc:0x77aec0,public_bath:0x77aec0,kost:0xb18cd3,tent:0x9a9d77,prayer:0x81c69f,prayer_islam_a:0x81c69f,prayer_islam_b:0x81c69f,prayer_islam_c:0x81c69f,
 prayer_kristen:0x81c69f,prayer_katolik:0x81c69f,prayer_hindu:0x81c69f,prayer_buddha:0x81c69f,
 prayer_konghucu:0x81c69f,course:0x709ac4};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'Rp '+Number(n||0).toLocaleString('id-ID');
const name=o=>[o.name,o.label,o.asset,o.subtype,o.questId,...(Array.isArray(o.tags)?o.tags:[])].filter(Boolean).join(' ');
let bridge=null,active=false,projectId='',config=RULES?RULES.defaults():null;
let state=null,sites=[],outer=null,markerGroup=null,nearId='',statusText='',progress=null;
let walkerDistance=0,frameAccumulator=0,timeAccumulator=0,sessionRevision=0,configSource='default',saveQueued=0;
let phoneOpen=false,bagOpen=false,justWorkedAt=0,lastFaintCount=0;
let navSelect=null,workHoldStart=0,workAnimation=0;
function defaults(){return RULES?RULES.defaults():null;}
function getWorld(){return bridge&&bridge.getWorld?bridge.getWorld():{objects:[],map:{}};}
function getPos(){const p=bridge&&bridge.getPosition?bridge.getPosition():null;return p||{x:0,z:0};}
function getScene(){return bridge&&bridge.getScene?bridge.getScene():null;}
function visible(){return !!active;}
function ownsRoom(){return !!(state&&state.housing&&state.housing.room);}
function cityId(){return bridge&&bridge.getCityId?String(bridge.getCityId()||'__working_copy__'):'__working_copy__';}
function dataKey(){return STORAGE+projectId;}
function persist(){
 if(!state||!active)return;
 try{localStorage.setItem(dataKey(),JSON.stringify({schema:1,cityId:projectId,state}));}catch{}
}
function restore(){
 if(!RULES)return;
 let saved=null;
 try{const raw=JSON.parse(localStorage.getItem(dataKey())||'null');if(raw?.cityId===projectId)saved=raw.state;}catch{}
 state=RULES.stateFrom(saved||{wallet:6000,energy:80,hygiene:75,bladder:20,moral:50,experience:0},config);
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
  config=RULES.normalize(globalRules?.lifeEconomy);
  configSource=globalRules?.lifeEconomy?(city?.lifeEconomy?'JIWA CITY':'JIWA GLOBAL'):'DEFAULT V1';
  if(state){const previous=state;state=RULES.stateFrom(previous,config);}
  paintPanel();
 }catch{}
}
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
 sites=SITES.map((d,i)=>{
  const matches=objects.filter(o=>d.pattern.test(name(o)));
  const prayerIndex=d.id==='prayer_islam_b'?1:d.id==='prayer_islam_c'?2:0;
  const found=matches[prayerIndex]||(!d.id.startsWith('prayer_')?matches[0]:null);
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
  return {...d,sourceId:found?.id||'',placeholder:!found,x:p.x,z:p.z};
 });
 const tent=sites.find(n=>n.id==='tent');
 const last=window.__semestaLastSpawn;
 if(tent&&last?.kind==='hobo'&&last?.point){tent.x=last.point.x;tent.z=last.point.z;tent.placeholder=false;}
 const home=sites.find(n=>n.id==='kost');
 if(home&&state?.housing?.roomPosition){home.x=state.housing.roomPosition.x;home.z=state.housing.roomPosition.z;home.placeholder=!!state.housing.roomPosition.placeholder;}
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
 disposeMarkers();if(!active||!bridge?.THREE||!getScene())return;
 const T=bridge.THREE,group=new T.Group();group.name='jiwa-play-temporary-interactions';
 const geo=new T.CylinderGeometry(.19,.25,.82,6);
 const baseGeo=new T.CircleGeometry(.45,20);
 for(const n of sites){
  if(!n.placeholder)continue; // Original Semesta assets remain visible without duplicate signboards.
  const color=PLACEHOLDER_COLORS[n.id]||0x7eabc4;
  const marker=new T.Mesh(geo,new T.MeshBasicMaterial({color,transparent:true,opacity:.85,depthTest:true}));
  marker.position.set(n.x,0.51,n.z);marker.userData={semestaLifeSite:n.id,placeholder:n.placeholder};
  const base=new T.Mesh(baseGeo,new T.MeshBasicMaterial({color,transparent:true,opacity:.3,depthWrite:false,side:T.DoubleSide}));
  base.rotation.x=-Math.PI/2;base.position.set(n.x,.045,n.z);
  group.add(base,marker);
  const label=makeLabel(T,n.label+(n.placeholder?' *':''));
  label.position.set(n.x,1.75,n.z);group.add(label);
 }
 getScene().add(group);markerGroup=group;
}
function nearest(){
 const p=getPos();let found=null,dist=2.5;
 for(const s of sites){const d=Math.hypot(p.x-s.x,p.z-s.z);if(d<dist){found=s;dist=d;}}
 return found;
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
  style.textContent='.slp{position:absolute;z-index:42;left:10px;top:10px;max-width:min(390px,calc(100% - 20px));max-height:min(75%,520px);overflow:auto;color:#1d3450;background:#e8eef6ed;border:2px solid #fff;outline:1px solid #27568f;box-shadow:2px 3px 0 #14395f66;font:11px Tahoma,Arial,sans-serif}.slp[hidden]{display:none!important}.slp h3{margin:0;background:linear-gradient(90deg,#1452aa,#509add);color:white;font-size:12px;padding:8px}.slp .slp-content{padding:9px}.slp .slp-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;margin:8px 0}.slp .slp-stat{background:white;border:1px solid #adbccc;padding:5px}.slp .slp-bar{height:5px;background:#d4dce2}.slp .slp-bar span{display:block;height:100%;background:#3e93bf}.slp button,.slp select{font:11px Tahoma,Arial;background:linear-gradient(#fff,#dfe9f5);border:1px solid #748ea9;padding:6px;min-height:27px;cursor:pointer;color:#123b5b}.slp .slp-actions{display:flex;gap:5px;flex-wrap:wrap;margin:7px 0}.slp button:disabled{opacity:.4}.slp .slp-spot{color:#124c78;font-weight:bold;padding:6px 0}.slp #lifePlayMessage{background:#fffcd9;border:1px solid #dfcf8a;padding:6px;white-space:normal;min-height:26px;margin-top:5px}.slp small{color:#51677e}.slp details summary{cursor:pointer;font-weight:bold;padding:5px}.slp .slp-work-progress{height:8px;background:#c6d2de;border:1px solid #698eae;margin:7px 0}.slp .slp-work-progress>span{display:block;background:#397aa8;height:100%;width:0}.slp .slp-head{display:flex;align-items:center;gap:5px;background:linear-gradient(90deg,#1452aa,#509add);padding-right:6px}.slp .slp-head h3{flex:1}.slp .slp-head button{padding:2px 6px;min-height:22px}.slp select{max-width:100%}.slp .slp-goto{display:flex;gap:5px;margin:6px 0}.slp .slp-goto select{flex:1;min-width:0}@media(max-width:650px){.slp{max-width:min(315px,calc(100% - 10px));left:5px;top:5px;max-height:52%;font-size:10px}}';
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
   state.identity.religion=ev.target.value;persist();message('Pilihan keyakinan: '+ev.target.value);paintPanel();
  }
  if(ev.target.id==='slpZodiac'&&RULES.ZODIACS.includes(ev.target.value)){
   state.identity.zodiac=ev.target.value;persist();message('Zodiak: '+ev.target.value+' (sosial V2 masih terkunci)');paintPanel();
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
 if(id==='fish')entries=[button('fish','🎣 Mancing',{spotId:n.sourceId||'water_placeholder'})];
 if(['siomay_batagor','pasar_ikan'].includes(id))entries=['<select id="slpItem">'+itemOptions('fish')+'</select>',button('sell_fish','💰 Jual Ikan',{buyerId:id})];
 if(id==='job'||id==='premium_job')entries=['<button id="slpWork" type="button">🛠 TAHAN UNTUK KERJA'+(id==='premium_job'?' PREMIUM':'')+'</button>','<div class="slp-work-progress"><span id="slpWorkFill"></span></div>'];
 if(id==='loak')entries=['<select id="slpItem">'+itemOptions('loak')+'</select>',button('sell_loak','💰 Jual Barang')];
 if(id==='scavenge')entries=[button('scavenge','📦 Mulung')];
 if(id==='tree')entries=[button('catch_fruit','🌳 Ambil Buah')];
 if(id==='warung')entries=[button('eat','🍚 Makan')];
 if(id==='coffee')entries=[button('coffee','☕ Ngopi')];
 if(id==='public_wc')entries=[button('public_toilet','🚾 WC Umum',{facilityId:n.sourceId||id})];
 if(id==='public_bath')entries=[button('public_shower','🚿 Mandi Umum',{facilityId:n.sourceId||id})];
 if(id==='kost')entries=ownsRoom()?
  [button('home_toilet','🚽 WC Kost'),button('home_shower','🚿 Mandi Kost'),button('sleep','💤 Tidur Kost'),
   '<select id="slpItem">'+itemOptions('fish')+'</select>',
   button('cook','🍳 Masak Ikan'),button('store_fridge','🧊 Simpan Kulkas'),
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
function phoneMarkup(){
 const religion=state.identity?.religion||'islam',zodiac=state.identity?.zodiac||'capricorn';
 const options=(all,current)=>all.map(v=>'<option value="'+v+'" '+(v===current?'selected':'')+'>'+v[0].toUpperCase()+v.slice(1)+'</option>').join('');
 return '<div class="slp-phone"><b>📱 HANDPHONE — APLIKASI V1</b>'+
  '<div class="slp-actions"><button data-life-action="course">🎓 Kursus Online · +EXP</button>'+
  '<button data-life-action="buy_token" '+(!ownsRoom()?'disabled':'')+'>⚡ Token Listrik · '+money(config.settings.tokenPrice)+'</button>'+
  '<button data-life-action="buy_fridge" '+(!ownsRoom()||state.housing?.fridge?'disabled':'')+'>🧊 Beli Kulkas · '+money(config.settings.fridgePrice)+'</button></div>'+
  '<details open><summary>🛒 Online Shop Furnitur</summary><p><small>Pembelian satu kali. Memerlukan akses kost. Placement visual nanti disinkronkan ke Bangun Ruang; tes ini mencatat inventaris furnitur.</small></p>'+
  '<select id="slpFurniture"><option value="bed">Kasur · Rp6.000</option><option value="chair">Kursi · Rp1.500</option><option value="stove">Kompor · Rp4.500</option><option value="wardrobe">Lemari · Rp3.500</option></select>'+
  '<button data-life-action="buy_furniture" '+(!ownsRoom()?'disabled':'')+'>Beli Sekali</button></details>'+
  '<details><summary>📰 Berita / Petunjuk Pekerjaan</summary><p><small>INFO LOKAL: Ikan sapu-sapu paling sering ditemukan saat memancing. Bang Siomay/Batagor menerimanya, Pasar Ikan menolak. Pekerjaan premium mensyaratkan kebersihan minimal 70. Toko Loak membeli barang bekas. Bantu warga tanpa upah untuk menaikkan moral.</small></p></details>'+
  '<details><summary>👤 Identitas Karakter</summary><p><small>Pilihan keyakinan menentukan akses ibadah, bukan nilai moral awal. Zodiak belum berpengaruh sampai V2.</small></p>'+
  '<label>Agama / keyakinan <select id="slpReligion">'+options(RULES.RELIGIONS.filter(v=>v!=="satanis"),religion)+'</select></label>'+
  '<label>Zodiak <select id="slpZodiac">'+options(RULES.ZODIACS,zodiac)+'</select></label>'+
  '<div><small>Satanis: 🔒 V2 — jalur antagonis fiksi. Friends & Social: 🔒 V2</small></div></details>'+
  '</div>';
}
function paintPanel(){
 if(!outer||!active||!state)return;
 const el=outer.querySelector('#slpContent');if(!el||el.hidden)return;
 const n=nearest();nearId=n?.id||'';
 const previousSelect=navSelect||'';
 const options=sites.map(t=>'<option value="'+esc(t.id)+'" '+(t.id===previousSelect?'selected':'')+'>'+esc(t.label)+(t.placeholder?' [PLACEHOLDER]':'')+'</option>').join('');
 const optsButton=(action,label,props={})=>'<button data-life-action="'+action+'" data-args="'+esc(JSON.stringify(props))+'">'+label+'</button>';
 const result=state.detained?
  optsButton('fine','💰 Bayar Denda Rp2.000')+optsButton('community_service','🧹 Bersihkan Gorong-gorong'):
  (state.restMinutes>0?optsButton('advance_time','⏩ Lewati 15 menit bed rest',{minutes:15}):
   phoneOpen?phoneMarkup():bagOpen?bagMarkup():nodeButtons(n));
 el.innerHTML='<div class="slp-summary"><b>'+(ownsRoom()?'🏠 KOST':'⛺ HOBO')+'</b><b>'+money(state.wallet)+'</b><b>🎒 '+(state.inventory?.length||0)+'/'+(config.settings.bagSlots||8)+'</b><span>👥 Friends 🔒 V2</span></div>'+
  '<div class="slp-stats">'+drawStats()+'</div>'+
  (state.restMinutes>0?'<div class="slp-alert">⚠ PINGSAN · Bed rest '+state.restMinutes+' menit. Tidak bisa bekerja atau berjalan.</div>':'')+
  (state.detained?'<div class="slp-alert">🚨 DITAHAN HANSIP · Pilih denda atau kerja sosial.</div>':'')+
  (state.bladder>=80?'<div class="slp-alert">🚾 Kebelet pipis! Cari WC sebelum terlambat.</div>':'')+
  '<div class="slp-spot">📍 '+(phoneOpen?'HP / APLIKASI':bagOpen?'TAS / INVENTORI':n?esc(n.label)+(n.placeholder?' [PLACEHOLDER]':''):'Jelajahi kota untuk menemukan pekerjaan dan kebutuhan')+'</div>'+
  '<div class="slp-actions" id="slpActions">'+result+'</div>'+
  (state.bladder>=65&&!state.detained&&state.restMinutes===0?'<div class="slp-actions">'+optsButton('pee_outside','⚠ Pipis sembarangan (moral turun)')+'</div>':'')+
  '<div class="slp-actions"><button id="slpPhone" type="button">'+(phoneOpen?'← Kembali':'📱 HP')+'</button><button id="slpBag" type="button">'+(bagOpen?'← Kembali':'🎒 Tas')+'</button></div>'+ 
  '<details><summary>🧪 ALAT TES (bukan aksi gameplay)</summary><p><small>Untuk mengecek skenario tanpa memodifikasi kota asli.</small></p>'+
  '<div class="slp-goto"><select id="slpDestination">'+options+'</select><button id="slpTravel" type="button">TELEPORT TEST</button></div>'+
  '<div class="slp-actions">'+optsButton('respawn','↻ Test Respawn')+
  optsButton('advance_time','⏩ +30 menit',{minutes:30})+'</div>'+
  '<div><b>Inventory:</b> '+esc((state.inventory||[]).map(id=>state.itemMeta?.[id]?.label||id).join(', ')||'kosong')+'</div>'+
  '<div><b>Furnitur:</b> '+esc((state.furniture||[]).join(', ')||'belum')+' · <b>Token:</b> '+state.powerTokens+'</div>'+
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
 if(el.id==='slpPhone'){phoneOpen=!phoneOpen;bagOpen=false;paintPanel();return;}
 if(el.id==='slpBag'){bagOpen=!bagOpen;phoneOpen=false;paintPanel();return;}
 if(el.id==='slpReset'){
  if(!confirm('Reset semua uang, inventori, status, dan akses kost untuk test kota ini?'))return;
  state=RULES.stateFrom({wallet:6000},config);persist();bridge.respawn();paintPanel();return;
 }
 if(el.dataset.lifeAction){
  let args={};try{args=JSON.parse(el.dataset.args||'{}');}catch{}
  if(el.dataset.lifeAction==='take_fridge')args.itemId=outer.querySelector('#slpFridgeItem')?.value||'';
  if(['eat_item','discard_item'].includes(el.dataset.lifeAction))args.itemId=outer.querySelector('#slpBagItem')?.value||'';
  if(['sell_fish','sell_loak','cook','store_fridge'].includes(el.dataset.lifeAction)){
   args.itemId=outer.querySelector('#slpItem')?.value||'';
  }
  if(el.dataset.lifeAction==='buy_furniture')args.itemId=outer.querySelector('#slpFurniture')?.value||'';
  runAction(el.dataset.lifeAction,args);
 }
}
function workDown(ev){
 if(!['slpWork','ptActionBtn'].includes(ev.target.id)||!active||progress)return;
 const n=nearest();
 if(!n||!['job','premium_job'].includes(n.id))return;
 if(state.detained||state.restMinutes>0||state.energy<10){message('Tidak bisa bekerja: perlu energi 10 dan bebas dari hukuman.');return;}
 if(n.id==='premium_job'&&state.hygiene<70){message('Kerja premium membutuhkan kebersihan minimum 70.');return;}
 ev.preventDefault();
 workHoldStart=performance.now();progress={started:workHoldStart,needed:Math.max(850,2300-(state?.experience||0)*10)};
 const button=ev.target;try{button.setPointerCapture(ev.pointerId);}catch{}
 const animate=()=>{
  if(!progress||!active)return;
  const pct=clamp((performance.now()-progress.started)/progress.needed,0,1);
  const fill=outer?.querySelector('#slpWorkFill');if(fill)fill.style.width=(pct*100)+'%';
  if(pct>=1){progress=null;workAnimation=0;justWorkedAt=performance.now();runAction('work',{premium:nearest()?.id==='premium_job'});return;}
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
 if(!active||!outer)return false;
 phoneOpen=!phoneOpen;bagOpen=false;
 const content=outer.querySelector('#slpContent');if(content)content.hidden=false;
 paintPanel();return true;
}
function openBag(){
 if(!active||!outer)return false;
 bagOpen=!bagOpen;phoneOpen=false;
 const content=outer.querySelector('#slpContent');if(content)content.hidden=false;
 paintPanel();return true;
}
function actionDown(ev){workDown(ev);}
function actionUp(ev){workUp(ev);}
function afterLifeTransition(previous){
 if(!active||!state)return;
 if((state.faintCount||0)>(previous?.faintCount||0)&&state.restMinutes>0){
  lastFaintCount=state.faintCount;
  progress=null;cancelAnimationFrame(workAnimation);workAnimation=0;
  for(const el of document.querySelectorAll('#ptActionBtn,#slpWork'))el.blur?.();
  bridge?.respawn?.();
  message('⚠ PINGSAN! Dipindahkan ke '+(ownsRoom()?'kost':'tenda hobo')+' untuk bed rest '+state.restMinutes+' menit.');
 }
 notifyHud();paintPanel();
}
function notifyHud(){try{bridge?.syncHud?.();}catch{}}
function runAction(action,args={}){
 if(!active||!RULES)return {ok:false,reason:'Play Game belum dimulai'};
 if(action==='respawn'){
  bridge?.respawn?.();return {ok:true,reason:'respawn'};
 }
 const node=nearest();
 if(!['advance_time','fine','community_service','luck_find','course','buy_fridge','buy_furniture','buy_token','pee_outside','eat_item','discard_item'].includes(action)&&!node)
  return {ok:false,reason:'Dekati lokasi interaksi terlebih dahulu'};
 const required={
  fish:'fish',sell_fish:args.buyerId,work:args.premium?'premium_job':'job',scavenge:'scavenge',sell_loak:'loak',catch_fruit:'tree',
  eat:'warung',coffee:'coffee',public_toilet:'public_wc',public_shower:'public_bath',
  buy_room:'kost',home_toilet:'kost',home_shower:'kost',sleep:ownsRoom()?'kost':'tent',
  cook:'kost',store_fridge:'kost',take_fridge:'kost',rest:'bench',help:'help',charity:'charity',
  worship:node?.id?.startsWith('prayer_')?node.id:'prayer'
 }[action];
 if(required&&node?.id!==required){
  message('Dekati '+(sites.find(s=>s.id===required)?.label||required)+' dahulu.');return {ok:false,reason:'Lokasi aksi tidak sesuai'};
 }
 if(action==='buy_room'){
  args={...args,roomSpawn:{id:node.sourceId||'kost_placeholder',x:node.x,z:node.z,placeholder:node.placeholder}};
 }
 if(action==='worship'&&node){args={...args,placeReligion:node.religion};}
 const prior=state;
 const result=RULES.run(config,state,action,args);
 if(result.ok){
  state=result.state;
  if(['fish','work','scavenge','catch_fruit'].includes(action)&&!state.detained){
   const luck=RULES.run(config,state,'luck_find',{roll:Math.random()});
   if(luck.ok)state=luck.state;
   if(luck.ok&&luck.changes.some(x=>x.includes('+Rp')))result.changes.push(...luck.changes);
  }
  persist();
  if(action==='buy_room')message('🏠 Kost dibeli! Respawn berikutnya pindah ke kamar. WC dan mandi pribadi aktif.');
  else message('✅ '+result.changes.join(' · '));
 }else message('⛔ '+result.reason);
 if(result.ok)afterLifeTransition(prior);
 else{notifyHud();paintPanel();}
 return result;
}
function handleAction(){
 if(!active)return false;
 const node=nearest();
 if(!node)return false;
 if(node.id==='job'||node.id==='premium_job'){
  if(performance.now()-justWorkedAt<550)return true;
  message('TAHAN tombol Action (atau tombol KERJA di panel) sampai progress penuh.');
  paintPanel();return true;
 }
 if(node.id==='siomay_batagor'||node.id==='pasar_ikan'||node.id==='loak'){
  message('Pilih barang dari tas, kemudian klik JUAL di panel.');paintPanel();return true;
 }
 const action=node.action;
 if(node.id==='kost'&&ownsRoom()){phoneOpen=false;bagOpen=false;message('Pilih WC, mandi, tidur, atau penyimpanan di panel.');paintPanel();return true;}
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
 if(!active||!state||state.detained||state.arrestGraceMinutes>0||state.moral>=config.settings.arrestMoralThreshold)return;
 const p=getPos();
 const witness=(getWorld().objects||[]).find(o=>/hansip|satpam|security.guard/i.test(name(o))&&
  Math.hypot((Number(o.x)||0)-p.x,(Number(o.z)||0)-p.z)<4)||
  sites.find(n=>n.id==='hansip'&&Math.hypot(n.x-p.x,n.z-p.z)<4);
 if(!witness)return;
 const result=RULES.run(config,state,'arrest',{witnessed:true});
 if(result.ok){state=result.state;persist();message('🚨 Hansip menangkapmu! Bayar denda atau kerja sosial.');}
}
function tick(dt){
 if(!active||!state)return;
 const seconds=Math.max(0,Math.min(.2,Number(dt)||0));
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
function start(){
 if(!RULES||!bridge)return false;
 const id=cityId();
 if(active&&id===projectId)return true;
 if(active)stop();
 projectId=id;active=true;sessionRevision++;timeAccumulator=0;frameAccumulator=0;phoneOpen=false;bagOpen=false;
 config=defaults();configSource='DEFAULT V1';restore();buildSites();makeRoot();
 if(outer){outer.hidden=false;outer.querySelector('#slpContent').hidden=false;}
 placeMarkers();paintPanel();reloadRules(sessionRevision);
 message('🎮 Play Mode aktif. '+(ownsRoom()?'Respawn di kost':'Mulai sebagai hobo; respawn dari tenda pinggiran kota')+'.');
 return true;
}
function stop(){
 if(!active)return;
 persist();active=false;cancelAnimationFrame(workAnimation);progress=null;
 disposeMarkers();if(outer)outer.hidden=true;
 actorMoved.prev=null;walkerDistance=0;nearId='';timeAccumulator=0;phoneOpen=false;bagOpen=false;
}
function attach(bridgeApi){bridge=bridgeApi||null;return api;}
const api=Object.freeze({attach,start,stop,active:visible,state:()=>state,sites:()=>sites,spawnEntitlement,
 spawnModule,fallbackSpawn,onSpawn,handleAction,actionDown,actionUp,openPhone,openBag,runAction,tick,refresh,money:moneyBalance,bag:bagLabels,speedFactor,
 reload:()=>reloadRules(sessionRevision),reset:()=>{if(!active)return;state=RULES.stateFrom({wallet:6000},config);persist();paintPanel();}});
return api;
});
