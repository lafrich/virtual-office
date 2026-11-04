/* Semesta — dynamic published Indonesia pack from the canonical pixel pipeline.
 * No catalog entry is considered playable until its generated manifest exists.
 */
(function(g){
'use strict';
const base='https://raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/main/';
let cached=null;
async function load(){
 if(cached)return cached;
 try{
  const res=await fetch(base+'assets/street_buildings/indonesia_catalog.json',
    {cache:'no-store'});
  if(!res.ok)throw Error('Upstream pack not published ('+res.status+')');
  const data=await res.json();
  if(data?.projection!=='isometric-2:1'||!Array.isArray(data.assets))
   throw Error('Unsupported Indonesia asset manifest');
  const entries=data.assets.filter(s=>
   /^id_[a-z0-9_]+$/.test(s?.id||'')&&
   s?.file==='pipeline:'+s.id&&
   ['jalan','kampung','prop'].includes(s?.group)&&
   s?.source==='pipeline-street'&&s.published===true&&
   Array.isArray(s?.footprint)&&s.footprint.length===2&&
   Object.keys(s?.variants||{}).length>0&&
   Object.values(s.variants).every(v=>
    /^(?:kampung|jalan_besar|props)\/id_[a-z0-9_]+_(?:sw|se|ne|nw)\.png$/.test(v?.file||'')&&
    Array.isArray(v.size)&&v.size.length===2&&
    Array.isArray(v.pivot)&&v.pivot.length===2)
  );
  if(!entries.length)throw Error('Indonesia pack has no published sprites');
  const prior=Array.isArray(g.VLAssetCatalog)?g.VLAssetCatalog:[];
  const existing=new Set(prior.map(e=>e.file));
  const unique=entries.filter(s=>!existing.has(s.file));
  if(!unique.length)return cached={loaded:true,count:0};
  const next=[...prior,...unique.map(e=>Object.freeze(e))];
  g.VLAssetCatalog=Object.freeze(next);
  const original=g.VLPipelineAssets||{};
  const oldBuilding=typeof original.building==='function'?
   original.building.bind(original):()=>null;
  const index=new Map(unique.map(e=>[e.id,e]));
  for(const e of unique)index.set(e.file,e);
  g.VLPipelineAssets=Object.freeze({
   ...original,
   prefabs:Object.freeze([...(original.prefabs||[]),...unique]),
   building(id,dir='sw'){
    const spec=index.get(id);
    if(spec){
     const v=spec.variants[dir]||spec.variants.sw||spec.variants.se;
     return v?base+'assets/street_buildings/'+v.file:null;
    }
    return oldBuilding(id,dir);
   }
  });
  cached={loaded:true,count:unique.length};
  return cached;
 }catch(err){
  console.warn('Indonesia native asset pack not yet available:',err);
  return {loaded:false,count:0,error:String(err.message||err)};
 }
}
g.VLIndonesiaAssets=Object.freeze({load,base});
})(typeof window!=='undefined'?window:globalThis);
