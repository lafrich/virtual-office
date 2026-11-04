/* Batch replacement for tree placeholders in Semesta; no implicit map mutation.
 * Species are chosen from the published Virtual Life vegetation catalog.
 */
(function(g){
'use strict';
const DEFAULT_POOL=['pohon_kiara_payung','pohon_ketapang_kencana','pohon_angsana_M','pohon_mahoni_M','pohon_asam_M','pohon_trembesi_M','pohon_bungur'];
const isTreeSpec=spec=>!!spec&&spec.source==='pipeline-vegetation'&&spec.group==='Vegetation • trees'&&spec.published===true;
function candidates(catalog){
 return (catalog||[]).filter(isTreeSpec);
}
function legacyTree(o,catalog){
 if(!o)return false;
 if(o.type==='tree')return true;
 if(o.type==='virtual_asset'&&o.assetCategory==='tree')return true;
 if(o.type!=='sprite')return false;
 const spec=(catalog||[]).find(e=>e.file===o.asset);
 return !!spec&&((spec.source==='pipeline-vegetation'&&spec.group==='Vegetation • trees'&&!spec.published)||
    (!spec.published&&/tree|pohon/i.test((spec.label||'')+' '+(spec.id||''))));
}
function target(o,catalog,scope){
 if(scope==='all')return legacyTree(o,catalog)||
  (o.type==='sprite'&&isTreeSpec((catalog||[]).find(e=>e.file===o.asset)));
 return legacyTree(o,catalog);
}
function rng(seed){
 let t=(Number(seed)>>>0)||1;
 return ()=>{t+=0x6D2B79F5;let x=t;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};
}
function replace(objects,catalog,{scope='legacy',mode='mixed',species='',selected=[],seed=2026}={}){
 const all=candidates(catalog),byId=new Map(all.map(e=>[e.id,e]));
 let pool=mode==='single'?[species]:selected.length?selected:DEFAULT_POOL;
 pool=[...new Set(pool)].map(id=>byId.get(id)).filter(Boolean);
 if(!pool.length)throw Error('Pilih minimal satu jenis pohon yang sudah dipublikasikan.');
 const random=rng(seed);
 let changed=0;
 const next=(objects||[]).map(o=>{
  if(!target(o,catalog,scope))return o;
  // Never shuffle object array, map geometry or instance identifiers.
  const spec=pool[Math.floor(random()*pool.length)];
  if(o.type==='sprite'&&o.asset===spec.file)return o;
  changed++;
  const tags=[...(Array.isArray(o.tags)?o.tags:[])].filter(t=>t!=='placeholder');
  return {...o,
    type:'sprite',asset:spec.file,name:spec.label,
    layer:'vegetation',subtype:spec.id,collision:spec.collision!==false,
    width:spec.width,height:spec.height,scale:1,rotation:0,
    replaceable:true,source:'pipeline-vegetation',
    tags:[...new Set([...tags,'vegetation','pipeline-tree'])],
    assetPath:undefined,assetCategory:undefined,
    w:undefined,d:undefined,h:undefined,sizeClass:undefined};
 });
 return {objects:next,changed,matched:(objects||[]).filter(o=>target(o,catalog,scope)).length,pool:pool.map(x=>x.id)};
}
g.VLTreeReplace=Object.freeze({DEFAULT_POOL,candidates,legacyTree,target,replace});
})(typeof window!=='undefined'?window:globalThis);
