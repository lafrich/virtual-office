/* Jakarta urban pack: native v6b sprites published in the existing pipeline.
 * Aliases are VISUAL swaps: saved map coordinates/IDs/traffic/physics unchanged.
 * On missing upstream catalogue, retain the original working assets.
 */
(function(g){
'use strict';
const ROOT='https://raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/main/assets/street_buildings/';
const CATALOG=ROOT+'jakarta_urban_catalog.json';
const REV='jakarta-urban-v1-20261106';
let pending;
function valid(e){
 if(!e||e.pack!=='jakarta-urban-v1'||e.published!==true||
    e.source!=='pipeline-street'||!/^[_a-z0-9]+$/.test(e.id||''))return false;
 const variants=Object.values(e.variants||{});
 return !!variants.length&&variants.every(v=>
  /^(?:taman|props|jalan_lokal)\/[_a-z0-9]+_(?:sw|se)\.png$/.test(v?.file||'')&&
  Array.isArray(v.size)&&Array.isArray(v.pivot)&&
  v.size.length===2&&v.pivot.length===2&&v.size.every(n=>Number.isInteger(n)&&n>0)&&
  v.pivot.every(n=>Number.isFinite(n)&&n>=0));
}
function packEntry(src,id=null){
 const entry={...src};
 if(id){entry.id=id;entry.file='pipeline:'+id;entry.aliasOf=src.id;}
 return Object.freeze(entry);
}
async function load(){
 if(pending)return pending;
 pending=(async()=>{
  try{
   const resp=await fetch(CATALOG+'?v='+REV,{cache:'no-store'});
   if(!resp.ok)throw Error('Catalogue not published ('+resp.status+')');
   const json=await resp.json();
   if(json?.projection!=='isometric-2:1'||!Array.isArray(json.assets))throw Error('Malformed Jakarta catalogue');
   const list=json.assets.filter(valid);
   if(list.length!==17)throw Error('Incomplete Jakarta catalogue: '+list.length+'/17');
   const aliases=json.aliases||{};
   const map=new Map(list.map(x=>[x.id,x]));
   const prior=Array.isArray(g.VLAssetCatalog)?g.VLAssetCatalog:[];
   const merged=prior.map(e=>aliases[e.id]&&map.has(aliases[e.id])?
     packEntry(map.get(aliases[e.id]),e.id):e);
   const known=new Set(merged.map(x=>x.file));
   for(const src of list)if(!known.has(src.file)){merged.push(packEntry(src));known.add(src.file);}
   g.VLAssetCatalog=Object.freeze(merged);
   const registry=new Map(list.map(x=>[x.id,x]));
   for(const [old,now] of Object.entries(aliases))if(map.has(now))registry.set(old,map.get(now));
   const previous=g.VLPipelineAssets||{};
   const legacy=typeof previous.building==='function'?previous.building.bind(previous):()=>null;
   g.VLPipelineAssets=Object.freeze({...previous,prefabs:Object.freeze([
     ...(previous.prefabs||[]).filter(p=>!registry.has(p.id)),...list]),
     building(id,view='sw'){
      const a=registry.get(id);
      if(!a)return legacy(id,view);
      const v=a.variants?.[view]||a.variants?.sw||a.variants?.se;
      return v?ROOT+v.file+'?v='+REV:null;
     }
   });
   return {loaded:true,count:list.length,aliases:Object.keys(aliases)};
  }catch(error){
   console.warn('Jakarta Urban pack uses original published assets until ready:',error);
   pending=null;
   return {loaded:false,error:String(error?.message||error)};
  }
 })();
 return pending;
}
g.VLJakartaUrban=Object.freeze({ROOT,CATALOG,REV,load,valid});
})(typeof window!=='undefined'?window:globalThis);
