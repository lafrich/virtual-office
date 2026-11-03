/* Bangun Ruang -> Semesta: live, same-origin building asset catalog.
 * Canonical artwork and metadata stay in the Bangun Ruang localStorage key.
 * Refresh reads that key again without recreating the City Builder or touching
 * protected multiplayer/game files. No cross-device synchronization.
 */
(function(g){
'use strict';
const KEY='virtual-life-bangun-ruang-v1';
const MAX=75;
const DIR=['sw','se','ne','nw'];
const base=(Array.isArray(g.VLAssetCatalog)?g.VLAssetCatalog:[])
 .filter(x=>x?.source!=='custom-building');
const byId=new Map(),entries=[];
const validId=id=>typeof id==='string'&&/^br-[a-z0-9-]{1,72}$/.test(id);
function read(){
 try{
  const rows=JSON.parse(localStorage.getItem(KEY)||'[]');
  return Array.isArray(rows)?rows.slice(0,MAX):[];
 }catch(err){console.warn('Bangun Ruang catalog inaccessible',err);return [];}
}
function parse(a){
 if(!a||!validId(a.id)||!a.views||!a.config)return null;
 const w=Number(a.config.w),d=Number(a.config.d);
 if(!Number.isFinite(w)||!Number.isFinite(d)||w<2||d<2||w>24||d>24)return null;
 const variants={};
 for(const dir of DIR){
  const v=a.views[dir],s=v?.size,p=v?.pivot;
  if(!v||typeof v.url!=='string'||!/^data:image\/png;base64,[a-zA-Z0-9+/=]+$/.test(v.url)||
     !Array.isArray(s)||!Array.isArray(p)||s.length!==2||p.length!==2||
     s.some(x=>!Number.isFinite(x)||x<1||x>2048)||
     p.some(x=>!Number.isFinite(x)||x<0||x>2048))continue;
  variants[dir]={file:'local:'+a.id+'_'+dir+'.png',size:[...s],pivot:[...p]};
 }
 if(!Object.keys(variants).length)return null;
 const canonical=variants.sw||Object.values(variants)[0];
 const enterable=a.interactive===true&&a.enterable===true&&
  a.interior?.format==='virtual-life-interiors-v1';
 const interior=enterable&&Array.isArray(a.interior?.floors)&&a.interior.floors.length<=12?
  JSON.parse(JSON.stringify(a.interior)):null;
 const actionSlots=interior&&Array.isArray(a.actionSlots)?
  a.actionSlots.filter(x=>typeof x?.id==='string'&&
   typeof x.interaction==='string'&&x.interaction.length<80).slice(0,200):[];
 const entrance=interior?{
  facing:['sw','se'].includes(a.entrance?.facing)?a.entrance.facing:'sw',
  groundFloor:1,entry:interior.floors[0]?.entrance||null
 }:null;
 return Object.freeze({
  id:a.id,file:'studio:'+a.id,label:String(a.name||'Building').slice(0,80),
  group:'kampung',source:'custom-building',published:true,
  footprint:[w,d],size:canonical.size,pivot:canonical.pivot,
  width:canonical.size[0]/50,height:canonical.size[1]/50,
  collision:a.config.collision!=='no',
  entranceFacing:['sw','se'].includes(a.entranceFacing)?a.entranceFacing:'',
  interactive:enterable,enterable,entrance,interior,actionSlots,
  interactions:Array.isArray(a.interactions)?
   a.interactions.filter(x=>typeof x==='string').slice(0,20):(enterable?['enter']:[]),
  blocking:a.config.collision==='no'?'no':'yes',
  variants:Object.freeze(variants)
 });
}
function refresh(){
 const incoming=read(),next=new Map();
 for(const asset of incoming){
  if(next.has(asset?.id))continue;
  const spec=parse(asset);
  if(spec)next.set(asset.id,{asset,spec});
 }
 byId.clear();entries.length=0;
 for(const [id,{asset,spec}] of next){byId.set(id,asset);entries.push(spec);}
 // Live sync must preserve custom pixel objects and vegetation catalogs
 // registered later, not recreate the original startup-only catalog.
 const existing=(Array.isArray(g.VLAssetCatalog)?g.VLAssetCatalog:base)
  .filter(spec=>spec?.source!=='custom-building');
 g.VLAssetCatalog=Object.freeze([...existing,...entries]);
 return Object.freeze({count:entries.length,entries:Object.freeze([...entries])});
}
const api=Object.freeze({
 key:KEY,refresh,
 get entries(){return Object.freeze([...entries]);},
 get count(){return entries.length;},
 image(id,dir='sw'){
  const a=byId.get(id),v=a?.views?.[dir]||a?.views?.sw;
  return v?.url||null;
 }
});
refresh();
g.VLBuildingBridge=api;
})(window);
