/* Semesta native Indonesian packs — published sprites only.
 * Loads both the original cultural pack and 200 additional native objects.
 * Does not synthesize missing art, break old saved asset IDs or duplicate entries.
 */
(function(g){
'use strict';
const base='https://raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/main/';
const PACKS=['indonesia_catalog.json','indonesia_200_catalog.json'];
let cached=null;
const IMAGE_REV='modular-transport-npc-v1-20261105';
function cacheBust(spec,url){
 if(!url)return url;
 if(spec?.pack!=='indonesia-200-v1')return url;
 return url+(url.includes('?')?'&':'?')+'v='+IMAGE_REV;
}
function valid(s){
 if(!/^id(?:200)?_[a-z0-9_]+$/.test(s?.id||''))return false;
 if(s.file!=='pipeline:'+s.id||s.source!=='pipeline-street'||s.published!==true)return false;
 if(!['jalan','kampung','prop'].includes(s.group))return false;
 if(!Array.isArray(s.footprint)||s.footprint.length!==2||
    !s.footprint.every(n=>Number.isFinite(n)&&n>0&&n<=30))return false;
 const views=Object.entries(s.variants||{});
 return views.length>0&&views.every(([dir,v])=>
  ['sw','se','ne','nw'].includes(dir)&&
  /^(?:kampung|jalan_besar|props)\/id(?:200)?_[a-z0-9_]+_(?:sw|se|ne|nw)\.png$/.test(v?.file||'')&&
  Array.isArray(v.size)&&v.size.length===2&&v.size.every(n=>Number.isInteger(n)&&n>0&&n<=8192)&&
  Array.isArray(v.pivot)&&v.pivot.length===2&&v.pivot.every(Number.isFinite)&&
  v.pivot[0]>=0&&v.pivot[1]>0&&v.pivot[0]<=v.size[0]&&v.pivot[1]<=v.size[1]
 );
}
async function fetchPack(name){
 const res=await fetch(base+'assets/street_buildings/'+name,{cache:'no-store'});
 if(!res.ok)throw Error(name+' not yet published: '+res.status);
 const j=await res.json();
 if(j?.projection!=='isometric-2:1'||!Array.isArray(j.assets))throw Error('Invalid '+name);
 return j.assets.filter(valid);
}
async function load(){
 if(cached)return cached;
 const responses=await Promise.allSettled(PACKS.map(fetchPack));
 const entries=[],names=new Set(),failures=[];
 for(let i=0;i<responses.length;i++){
  const response=responses[i];
  if(response.status==='rejected'){
   failures.push(PACKS[i]+': '+String(response.reason?.message||response.reason));
   continue;
  }
  for(const entry of response.value){
   if(!names.has(entry.file)){names.add(entry.file);entries.push(entry);}
  }
 }
 if(!entries.length){
  console.warn('Indonesia native packs not published:',failures.join('; '));
  return {loaded:false,count:0,error:failures.join('; ')||'No valid Indonesia assets'};
 }
 const prior=Array.isArray(g.VLAssetCatalog)?g.VLAssetCatalog:[];
 const existing=new Set(prior.map(x=>x.file));
 const unique=entries.filter(x=>!existing.has(x.file));
 const index=new Map();
 for(const e of unique){index.set(e.id,e);index.set(e.file,e);}
 if(unique.length){
  g.VLAssetCatalog=Object.freeze([...prior,...unique.map(e=>Object.freeze(e))]);
  const previous=g.VLPipelineAssets||{};
  const legacy=typeof previous.building==='function'?
   previous.building.bind(previous):()=>null;
  g.VLPipelineAssets=Object.freeze({
   ...previous,
   prefabs:Object.freeze([...(previous.prefabs||[]),...unique]),
   building(id,dir='sw'){
    const item=index.get(id);
    if(item){
     const v=item.variants[dir]||item.variants.sw||item.variants.se;
     return v?cacheBust(item,base+'assets/street_buildings/'+v.file):null;
    }
    return legacy(id,dir);
   }
  });
 }
 cached={loaded:true,count:unique.length,available:entries.length,
  packs:responses.filter(x=>x.status==='fulfilled').length};
 return cached;
}
g.VLIndonesiaAssets=Object.freeze({load,base,valid,PACKS,cacheBust,IMAGE_REV});
})(typeof window!=='undefined'?window:globalThis);
