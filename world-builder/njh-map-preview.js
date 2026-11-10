/* NJH Semesta map draft1 PREVIEW only. Activated by ?njhMap=1.
 * Registers 7 catalog assets, loads Ellen's district map, wires door
 * use-tiles to the 6 NJH interiors, and clamps actors to worldBounds.
 * Live Semesta / Mainkan behavior is unchanged when the flag is off.
 * Not pushed, not deployed.
 */
(function(g){
'use strict';
const DIR=['sw','se','ne','nw'];
const NJH_READY=['njh_kos','njh_warung_makan','njh_wc_mandi_umum','njh_rumah_biasa','njh_laundry','njh_bengkel'];
const NJH_PENDING=['njh_pecel_lele_tenda','njh_sate_madura_tenda','njh_mushola','njh_koperasi','njh_toko_loak','njh_warung_madura','njh_warung_kopi','njh_nasi_sunda'];
const NJH_TEMPLATES=[...NJH_READY,...NJH_PENDING];
const TEMPLATE_ALIASES=Object.freeze({
 'bangun-ruang kit in br-warung-pecel-lele.json':'njh_pecel_lele_tenda',
 'bangun-ruang kit in br-lapak-sate-madura.json':'njh_sate_madura_tenda'
});
function resolveTemplate(raw){
 const id=TEMPLATE_ALIASES[raw]||raw||null;
 return NJH_TEMPLATES.includes(id)?id:null;
}
const KEY_MAP=Object.freeze({
 'object:obj-njh-dermaga-mancing':'object:njh_dermaga_mancing',
 'object:obj-njh-lapak-silver':'object:njh_lapak_silver',
 'object:obj-njh-tiang-ogah':'object:njh_tiang_ogah',
 'object:obj-njh-kotak-amal':'object:njh_kotak_amal',
 'object:obj-njh-penanda-doa':'object:njh_penanda_doa',
 'studio:br-warung-pecel-lele':'studio:br-warung-pecel-lele',
 'studio:br-lapak-sate-madura':'studio:br-lapak-sate-madura'
});
function baseUrl(){
 try{
  const scripts=g.document?.getElementsByTagName('script')||[];
  for(let i=scripts.length-1;i>=0;i--){
   const src=scripts[i].src||'';
   if(/njh-map-preview\.js/.test(src))
    return src.replace(/njh-map-preview\.js(?:\?.*)?$/,'njh-map-preview/');
  }
 }catch(e){}
 return './njh-map-preview/';
}
function enabled(){
 try{
  if(g.VL_NJH_MAP_PREVIEW===true)return true;
  if(g.VL_NJH_MAP_PREVIEW===false)return false;
  return new URLSearchParams(g.location?.search||'').get('njhMap')==='1';
 }catch(e){return false;}
}

const PROP_DEFS=[
 {id:'njh_dermaga_mancing',label:'Dermaga / pelataran mancing',group:'prop',
  footprint:[2,1],collision:true,rotateFootprint:true,
  canvas:[101,72],pivot:[50,62],interactions:['fish']},
 {id:'njh_lapak_silver',label:'Lapak Manusia Silver',group:'prop',
  footprint:[1,1],collision:true,rotateFootprint:false,
  canvas:[69,84],pivot:[34,74],interactions:['silver_pose']},
 {id:'njh_tiang_ogah',label:'Tiang Pak Ogah',group:'prop',
  footprint:[1,1],collision:true,rotateFootprint:false,
  canvas:[69,112],pivot:[34,102],interactions:['ogah_flag']},
 {id:'njh_kotak_amal',label:'Kotak amal',group:'prop',
  footprint:[1,1],collision:true,rotateFootprint:false,
  canvas:[69,72],pivot:[34,62],interactions:['give_sedekah']},
 {id:'njh_penanda_doa',label:'Penanda tempat tenang',group:'prop',
  footprint:[1,1],collision:false,rotateFootprint:false,
  canvas:[69,56],pivot:[34,46],interactions:['pray_generic']}
];
const TENT_DEFS=[
 {id:'br-warung-pecel-lele',label:'Warung Pecel Lele',folder:'pecel',
  footprint:[4,3],size:[242,236],pivot:[121,164]},
 {id:'br-lapak-sate-madura',label:'Lapak Sate Madura',folder:'sate',
  footprint:[4,3],size:[242,236],pivot:[121,164]}
];

function propSpec(def){
 const variants={};
 for(const d of DIR){
  const file='props/'+def.id+'/'+def.id+'_'+d+'.png';
  variants[d]={
   file,size:def.canvas.slice(),pivot:def.pivot.slice(),
   url:baseUrl()+file
  };
 }
 const sw=variants.sw;
 return Object.freeze({
  id:def.id,file:'object:'+def.id,label:def.label,group:def.group,
  source:'njh-preview',published:true,collision:def.collision,
  rotateFootprint:!!def.rotateFootprint,
  footprint:def.footprint.slice(),size:sw.size.slice(),pivot:sw.pivot.slice(),
  width:sw.size[0]/50,height:sw.size[1]/50,
  blocking:def.collision?'yes':'no',
  interactions:def.interactions.slice(),
  variants:Object.freeze(variants)
 });
}
function tentHeight(pivotY){
 return Math.max(1,pivotY*Math.SQRT2/64*2/Math.sqrt(3));
}
function tentSpec(def){
 const variants={};
 for(const d of DIR){
  const file='tents/'+def.folder+'_'+d+'.png';
  variants[d]={file,size:def.size.slice(),pivot:def.pivot.slice(),url:baseUrl()+file};
 }
 const sw=variants.sw;
 return Object.freeze({
  id:def.id,file:'studio:'+def.id,label:def.label,group:'kampung',
  source:'custom-building',published:true,collision:true,
  footprint:def.footprint.slice(),size:sw.size.slice(),pivot:sw.pivot.slice(),
  width:sw.size[0]/50,height:tentHeight(sw.pivot[1]),
  enterable:false,interactive:true,
  interactions:['enter'],blocking:'yes',
  variants:Object.freeze(variants),
  njhPreview:true
 });
}

const SPECS=[...PROP_DEFS.map(propSpec),...TENT_DEFS.map(tentSpec)];
const TENT_IMAGES=Object.fromEntries(TENT_DEFS.map(def=>[
 def.id,Object.fromEntries(DIR.map(d=>[d,baseUrl()+'tents/'+def.folder+'_'+d+'.png']))
]));

function registerCatalog(){
 if(!enabled())return {count:0};
 const existing=Array.isArray(g.VLAssetCatalog)?g.VLAssetCatalog:[];
 const kept=existing.filter(x=>x?.source!=='njh-preview'&&!(x?.source==='custom-building'&&x.njhPreview===true));
 const have=new Set(kept.map(x=>x.file));
 const extra=SPECS.filter(s=>!have.has(s.file));
 g.VLAssetCatalog=Object.freeze([...kept,...extra].map(e=>Object.freeze(e)));
 return {count:extra.length,keys:extra.map(s=>s.file)};
}
function registerInto(assetCatalog,assetByName){
 const result=registerCatalog();
 const list=Array.isArray(g.VLAssetCatalog)?g.VLAssetCatalog:[];
 if(Array.isArray(assetCatalog)&&!Object.isFrozen(assetCatalog)){
  try{
   assetCatalog.splice(0,assetCatalog.length,...list);
  }catch(e){/* catalog array may be frozen; assetByName is enough */}
 }
 if(assetByName&&typeof assetByName.set==='function'){
  for(const e of list)if(e?.file)assetByName.set(e.file,e);
 }
 hookBuildingBridge();
 hookKebonTiles();
 return result;
}

// Ellen's Kali is authored as Jakarta "river" tiles. That texture is a gray
// striped canal and reads as a road or rail. In this preview only, paint those
// tiles with the existing Water terrain (still not walkable). Live maps are unchanged.
const DERMAGA_OVERHANG=0.8;
function visualTerrainType(type){
 return type==='river'?'water':type;
}
function dermagaOverhang(o){
 const dist=DERMAGA_OVERHANG;
 const rot=((Number(o?.rotation)||0)%360+360)%360;
 if(rot===270)return {x:-dist,z:0};
 if(rot===90)return {x:dist,z:0};
 if(rot===180)return {x:0,z:-dist};
 return {x:0,z:dist};
}
function applyDermagaOverhang(document){
 const o=(document?.objects||[]).find(x=>x.id==='njh-dermaga-mancing'||x.asset==='object:njh_dermaga_mancing');
 if(!o)return null;
 o.njhDrawOffset=dermagaOverhang(o);
 return o.njhDrawOffset;
}
function hookKebonTiles(){
 if(!enabled())return;
 const api=g.VLKebonSirihStyle;
 if(!api||api.__njhMapPreviewHooked)return;
 const tiles=api.TILES||{};
 const origTile=api.tile?.bind(api);
 function tileUrl(name){
  const file=tiles[name];
  if(!file)return null;
  const leaf=String(file).split('/').pop();
  return baseUrl()+'terrain/'+leaf+'?v=njh-map-preview-terrain-1';
 }
 function tile(kind,cell,index){
  return origTile?origTile(visualTerrainType(kind),cell,index):visualTerrainType(kind);
 }
 try{
  g.VLKebonSirihStyle=Object.freeze({
   VERSION:api.VERSION,TILES:api.TILES,ROOT:api.ROOT,
   tileUrl,tile,category:api.category,eligible:api.eligible,
   pick:api.pick,upgrade:api.upgrade,__njhMapPreviewHooked:true
  });
 }catch(e){console.warn('NJH preview could not wrap Kebon terrain URLs',e);}
}

function hookBuildingBridge(){
 const api=g.VLBuildingBridge;
 if(!api||api.__njhMapPreviewHooked||g.VLBuildingBridge?.__njhMapPreviewHooked)return;
 const origImage=api.image.bind(api);
 const origRefresh=api.refresh.bind(api);
 function image(id,dir='sw'){
  const preview=TENT_IMAGES[id];
  if(preview)return preview[dir]||preview.sw||origImage(id,dir);
  return origImage(id,dir);
 }
 function refresh(){
  const out=origRefresh();
  registerCatalog();
  return out;
 }
 const wrapped=Object.freeze({
  key:api.key,refresh,image,__njhMapPreviewHooked:true,
  get entries(){return api.entries;},
  get count(){return api.count;}
 });
 try{g.VLBuildingBridge=wrapped;}
 catch(e){console.warn('NJH preview could not wrap VLBuildingBridge',e);}
}

let metaCache=null,cityCache=null,interiorCache=null;
async function fetchJson(rel){
 const url=baseUrl()+rel;
 const r=await fetch(url,{cache:'no-store'});
 if(!r.ok)throw Error('NJH preview failed to load '+rel+' ('+r.status+')');
 return r.json();
}
async function loadMeta(){
 if(metaCache)return metaCache;
 metaCache=await fetchJson('njh-map-meta.json');
 return metaCache;
}
async function loadInteriors(){
 if(interiorCache)return interiorCache;
 const out={};
 await Promise.all(NJH_TEMPLATES.map(async id=>{
  try{
   const url=baseUrl()+'interiors/'+id+'.interior-scene.json';
   const r=await fetch(url,{cache:'no-store'});
   if(!r.ok)return;
   out[id]=await r.json();
  }catch(e){/* r6 scenes are optional until Ellen drops them in */}
 }));
 interiorCache=out;
 return out;
}
function unwrapCity(raw){
 if(raw?.record?.document?.objects)return raw.record.document;
 if(raw?.document?.objects)return raw.document;
 if(Array.isArray(raw?.objects))return raw;
 throw Error('NJH city wrapper is not a world-builder document');
}
function wrapInterior(scene){
 if(!scene)return null;
 return {
  format:'virtual-life-interiors-v1',
  floors:[Object.assign({},scene,{format:'virtual-life-interior-v1',floor:scene.floor||1})]
 };
}
function wireDoors(document,meta,interiors){
 const report={wired:[],pending:[],noInterior:[],missingObject:[]};
 const objects=document.objects||[];
 const byId=new Map(objects.map(o=>[o.id,o]));
 const scenes=interiors||{};
 for(const door of meta.doors||[]){
  const obj=byId.get(door.objectId);
  if(!obj){report.missingObject.push(door);continue;}
  obj.njhDoorId=door.doorId;
  obj.njhUsePoint=Array.isArray(door.usePoint)?{x:door.usePoint[0],z:door.usePoint[1]}:null;
  obj.njhDoorPoint=Array.isArray(door.doorPoint)?{x:door.doorPoint[0],z:door.doorPoint[1]}:null;
  obj.entranceFacing=door.facing||obj.entranceFacing||'sw';
  const template=resolveTemplate(door.interiorTemplate);
  if(!template){
   report.noInterior.push({doorId:door.doorId,label:door.label,template:door.interiorTemplate||null});
   continue;
  }
  obj.enterable=true;
  obj.interactive=true;
  obj.njhInteriorTemplate=template;
  if(!Array.isArray(obj.interactions))obj.interactions=['enter'];
  else if(!obj.interactions.includes('enter'))obj.interactions=[...obj.interactions,'enter'];
  const scene=scenes[template];
  const row={doorId:door.doorId,objectId:door.objectId,label:door.label,
   template,usePoint:door.usePoint,useTile:door.useTile};
  if(scene){
   obj.interior=wrapInterior(scene);
   obj.njhInteriorPending=false;
   report.wired.push(row);
  }else{
   obj.interior=null;
   obj.njhInteriorPending=true;
   report.pending.push(row);
  }
 }
 return report;
}
async function loadCity(){
 registerCatalog();
 hookBuildingBridge();
 hookKebonTiles();
 const [raw,meta,interiors]=await Promise.all([
  fetchJson('city/njh-semesta-map-draft1.with-pending-assets.city.json'),
  loadMeta(),
  loadInteriors()
 ]);
 const document=unwrapCity(raw);
 document.map=document.map||{};
 document.map.unbounded=false;
 if(!document.map.worldBounds&&meta.bounds){
  document.map.worldBounds={
   minX:meta.bounds.minC,maxX:meta.bounds.maxC+1,
   minZ:meta.bounds.minR,maxZ:meta.bounds.maxR+1
  };
 }
 const doorReport=wireDoors(document,meta,interiors);
 applyDermagaOverhang(document);
 registerSekatType();
 cityCache={document,meta,doorReport};
 return document;
}

function registerSekatType(){
 const types=g.VLBuildingInterior?.types;
 if(!types||types.sekat_wc)return;
 types.sekat_wc={label:'Sekat WC Umum',category:'Publik',glyph:'▮',w:1,d:1,
  actions:[],blocking:true,capacity:0,triggerRadius:0};
}

function worldBoundsOf(map){
 const b=map?.worldBounds;
 if(!b)return {minX:-57,maxX:-5,minZ:14,maxZ:77};
 return {minX:Number(b.minX),maxX:Number(b.maxX),minZ:Number(b.minZ),maxZ:Number(b.maxZ)};
}
function applyBounds(map){
 if(!map)return null;
 map.unbounded=false;
 return worldBoundsOf(map);
}

const ENTER_RADIUS=1.25;
function doorCandidates(objects){
 return (objects||[]).filter(o=>o.enterable===true&&(o.interior?.floors?.length||o.njhInteriorTemplate));
}
function doorAnchor(o){
 if(o?.njhUsePoint&&Number.isFinite(o.njhUsePoint.x))return o.njhUsePoint;
 const door=(metaCache?.doors||[]).find(d=>d.objectId===o?.id||d.doorId===o?.njhDoorId);
 if(door&&Array.isArray(door.usePoint)&&door.usePoint.length>=2)
  return {x:Number(door.usePoint[0]),z:Number(door.usePoint[1])};
 return {x:Number(o?.x)||0,z:Number(o?.z)||0};
}
function nearestEnterable(objects,x,z,radius=ENTER_RADIUS){
 const list=doorCandidates(objects).map(o=>{
  const p=doorAnchor(o);
  return {o,anchor:p,distance:Math.hypot(x-p.x,z-p.z)};
 }).sort((a,b)=>a.distance-b.distance);
 const nearest=list[0];
 if(!nearest||nearest.distance>radius)return null;
 return nearest;
}

function spawnPool(meta){
 const m=meta||metaCache;
 return (m?.spawns||[]).map(s=>({id:s.id,x:s.x,z:s.z,facing:'sw'}));
}
function homeFor(playerId,meta){
 const m=meta||metaCache;
 const id=String(playerId||'').toLowerCase();
 const row=(m?.homes||[]).find(h=>h.player===id);
 if(!row||!Array.isArray(row.homeSpawn))return null;
 return {id:row.doorId||'home',x:row.homeSpawn[0],z:row.homeSpawn[1],facing:'sw',
  owner:row.player,template:row.interiorTemplate};
}
function resolveSpawn(playerId,meta){
 const home=homeFor(playerId,meta);
 if(home)return {ok:true,kind:'home',playExitTent:false,point:home,reason:'njh-home'};
 const pool=spawnPool(meta);
 if(!pool.length)return {ok:false,reason:'no-njh-spawns',point:null};
 const assigned={t_ichsan:0,t_noor:1,guest1:2,guest2:3};
 const key=String(playerId||'').toLowerCase();
 const idx=Object.prototype.hasOwnProperty.call(assigned,key)?assigned[key]:0;
 const point=pool[idx%pool.length];
 return {ok:true,kind:'plaza',playExitTent:false,point,reason:'njh-spawn-pool'};
}

function imageUrl(id,dir='sw'){
 const spec=SPECS.find(s=>s.id===id||s.file===id);
 if(!spec)return null;
 const v=spec.variants[dir]||spec.variants.sw;
 return v?.url||null;
}

if(enabled()){hookKebonTiles();}
 g.VLNjhMapPreview=Object.freeze({
 enabled,baseUrl,registerCatalog,registerInto,registerSekatType,
 loadCity,loadMeta,keyMap:KEY_MAP,specs:()=>SPECS,
 doorCandidates,nearestEnterable,doorAnchor,enterRadius:ENTER_RADIUS,
 worldBoundsOf,applyBounds,spawnPool,homeFor,resolveSpawn,imageUrl,
 wireDoors,resolveTemplate,readyTemplates:NJH_READY,pendingTemplates:NJH_PENDING,
 visualTerrainType,dermagaOverhang,applyDermagaOverhang,dermagaOverhangTiles:DERMAGA_OVERHANG,
 report:()=>cityCache?cityCache.doorReport:null,
 status(){
  return {
   enabled:enabled(),
   assets:SPECS.map(s=>s.file),
   keyMap:KEY_MAP,
   doors:cityCache?.doorReport||null,
   bounds:cityCache?.document?.map?.worldBounds||null
  };
 }
});
if(enabled()){
 registerCatalog();
 hookBuildingBridge();
}
})(typeof window!=='undefined'?window:globalThis);
