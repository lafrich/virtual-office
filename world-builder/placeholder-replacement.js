/* Semesta / generic bulk placeholder replacement.
 * Categorized native Virtual Life Asset Pipeline artwork, deterministic mix,
 * preserve all object IDs and ground coordinates; no automatic global changes.
 */
(function(g){
'use strict';
const CATEGORIES=Object.freeze([
 {id:'building',label:'GEDUNG / BANGUNAN',defaults:['kantor_a','kantor_b','hotel','warung_madura','rumah_kampung_a','pos_ronda','ruko_a']},
 {id:'utility',label:'TIANG LISTRIK / LAMPU',defaults:['tiang_listrik','lampu_taman']},
 {id:'furniture',label:'FURNITUR / TAMAN',defaults:['bangku_taman','meja_taman','gazebo']},
 {id:'tree',label:'POHON / VEGETASI',defaults:['pohon_kiara_payung','pohon_angsana_M','pohon_asam_M','pohon_trembesi_M','pohon_bungur']},
 {id:'street',label:'PROPERTI JALAN',defaults:['tong_sampah','gapura_gang']}
]);
const categoryIds=new Set(CATEGORIES.map(c=>c.id));
function specCategory(e){
 if(!e)return null;
 if(e.source==='pipeline-vegetation')return e.group==='Vegetation • trees'?'tree':null;
 if(e.source==='pipeline-street'){
  if(/^(tiang_listrik|lampu_taman|lampu_lalin_)/.test(e.id))return 'utility';
  if(/^(bangku_taman|meja_taman|gazebo)/.test(e.id))return 'furniture';
  if(/^(tong_sampah|gapura_gang)/.test(e.id))return 'street';
  if(['jalan','kampung','loak'].includes(e.group))return 'building';
  if(['taman','prop','gang','sinyal'].includes(e.group))return 'street';
 }
 if(e.source==='custom-building'&&e.published===true)return 'building';
 return null;
}
function candidates(catalog,category){
 if(!categoryIds.has(category))return [];
 return (catalog||[]).filter(spec=>spec.published===true&&specCategory(spec)===category);
}
function objectCategory(o,catalog){
 if(!o)return null;
 if(['building','shop'].includes(o.type))return 'building';
 if(o.type==='tree'||(o.type==='virtual_asset'&&o.assetCategory==='tree'))return 'tree';
 if(o.type==='lamp')return 'utility';
 if(o.type==='bench')return 'furniture';
 if(o.type==='box'||(o.type==='virtual_asset'&&o.assetCategory==='prop'))return 'street';
 if(o.type==='virtual_asset'&&o.assetCategory==='building')return 'building';
 if(o.type==='sprite'){
  const spec=(catalog||[]).find(e=>e.file===o.asset);
  return specCategory(spec);
 }
 return null;
}
function legacy(o,catalog,category){
 if(objectCategory(o,catalog)!==category)return false;
 if(['building','shop','tree','lamp','bench','box'].includes(o.type))return true;
 if(o.type==='virtual_asset')return o.replaceable===true||o.tags?.includes('placeholder');
 if(o.type==='sprite'){
  const e=(catalog||[]).find(spec=>spec.file===o.asset);
  return !!e&&e.published!==true&&['pipeline-street','pipeline-vegetation','custom-building'].includes(e.source);
 }
 return false;
}
function target(o,catalog,category,scope='legacy'){
 if(!categoryIds.has(category)||objectCategory(o,catalog)!==category)return false;
 return scope==='all'?true:legacy(o,catalog,category);
}
function rng(seed){
 let t=(Number(seed)>>>0)||1;
 return ()=>{t+=0x6D2B79F5;let x=t;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};
}
function newObject(old,spec,category){
 const tags=(Array.isArray(old.tags)?old.tags:[]).filter(t=>!['placeholder','builder-placeholder','proxy','pixel-preview'].includes(t));
 const hasViews=!!spec.variants&&Object.keys(spec.variants).length>1;
 const o={...old,
  type:'sprite',asset:spec.file,name:spec.label,layer:category==='tree'?'vegetation':category==='building'?'structure':'prop',
  subtype:spec.id,collision:spec.collision!==false,blocking:spec.collision===false?'no':'auto',
  width:spec.width,height:spec.height,
  scale:1,rotation:hasViews?(old.rotation||0):0,replaceable:true,
  tags:[...new Set([...tags,'pipeline-asset',category])],
  interactions:[],interactive:false,enterable:false,entranceFacing:'',entrance:null,interior:null,actionSlots:[],
  assetPath:undefined,assetCategory:undefined,
  w:undefined,d:undefined,h:undefined,sizeClass:undefined
 };
 return o;
}
function sizeFits(old,spec,category){
 if(category!=='building'||!['building','shop'].includes(old.type))return true;
 const w=Number(old.w||0),d=Number(old.d||0);
 if(!w||!d||!spec.footprint)return true;
 const [sw,sd]=spec.footprint;
 // Keep a structure within the existing lot; never expand into a road or neighbor.
 return sw<=w+0.2&&sd<=d+0.2;
}
function replace(objects,catalog,opts={},validate){
 const category=opts.category||'tree',scope=opts.scope||'legacy';
 const poolAll=candidates(catalog,category),byId=new Map(poolAll.map(s=>[s.id,s]));
 const choice=opts.mode==='single'?[(opts.selected||[])[0]||opts.species]:
  ((opts.selected||[]).length?opts.selected:CATEGORIES.find(x=>x.id===category)?.defaults||[]);
 const pool=[...new Set(choice)].map(id=>byId.get(id)).filter(Boolean);
 if(!pool.length)throw Error('Pilih aset yang sudah dipublikasikan untuk kategori ini.');
 const random=rng(opts.seed??2026),next=(objects||[]).slice();
 let changed=0,skipped=0,matched=0;
 for(let idx=0;idx<next.length;idx++){
  const old=next[idx];
  if(!target(old,catalog,category,scope))continue;
  matched++;
  const start=opts.mode==='single'?0:Math.floor(random()*pool.length);
  // A deterministic seeded order, with fallback to a second valid asset if
  // the first random pick would overlap an existing structure or road.
  let chosen=null,unchanged=false;
  for(let step=0;step<pool.length;step++){
   const spec=pool[(start+step)%pool.length];
   if(!sizeFits(old,spec,category))continue;
   if(old.type==='sprite'&&old.asset===spec.file){unchanged=true;chosen=old;break;}
   const candidate=newObject(old,spec,category);
   if(typeof validate==='function'&&!validate(candidate,next,idx))continue;
   chosen=candidate;break;
  }
  if(!chosen){skipped++;continue;}
  if(unchanged)continue;
  next[idx]=chosen;changed++;
 }
 return {objects:next,changed,skipped,matched,pool:pool.map(x=>x.id)};
}
g.VLPlaceholderReplace=Object.freeze({CATEGORIES,candidates,objectCategory,legacy,target,replace});
})(typeof window!=='undefined'?window:globalThis);
