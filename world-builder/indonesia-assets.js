/* Semesta native Indonesian packs — published sprites only.
 * Loads the original cultural pack, 200 additional objects and owner-approved V6B buildings.
 * Does not synthesize missing art, break old saved asset IDs or duplicate entries.
 */
(function(g){
'use strict';
const PREVIEW_REF='main';
const base='https://raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/'+PREVIEW_REF+'/';
const LOCAL_BASE='./ellen-preview-assets/';
const PACKS=['indonesia_catalog.json','indonesia_200_catalog.json','indonesia_custom_catalog.json','mainkan_gameplay_catalog.json','ellen_vehicles_15_catalog.json','ellen_wc_v4_catalog.json'];
let cached=null;
// B3 motors and any other legacy id200_transport_* stay retired. Ellen's
// finished B1/B2/B4-R2 15-vehicle redesign is allowlisted for this preview only.
const ALLOWED_TRANSPORT=new Set(["id200_transport_angkot_kota", "id200_transport_ambulans_puskesmas", "id200_transport_bus_kota_kecil", "id200_transport_elf_travel_antarkota", "id200_transport_mobil_angkut_sampah", "id200_transport_pikap_galon_isi_ulang", "id200_transport_pikap_sayur_keliling", "id200_transport_truk_material_bangunan", "id200_transport_truk_pasir_proyek", "id200_transport_bajaj_oranye", "id200_transport_becak_kampung", "id200_transport_bentor_roda_tiga", "id200_transport_delman_andong", "id200_transport_sepeda_ontel_tua", "id200_transport_sepeda_tukang_roti"]);
const retired=s=>{
 const id=String(s?.id||'').replace(/^pipeline:/,'');
 const file=String(s?.file||'').replace(/^pipeline:/,'');
 if(ALLOWED_TRANSPORT.has(id)||ALLOWED_TRANSPORT.has(file))return false;
 return /^id200_transport_/.test(id)||/^id200_transport_/.test(file);
};
const IMAGE_REV='indonesia200-wheel-horizontal-v8-20261106';
function cacheBust(spec,url){
 if(!url)return url;
 if(spec?.pack!=='indonesia-200-v1'&&spec?.pack!=='jakarta-urban-v1')return url;
 return url+(url.includes('?')?'&':'?')+'v='+IMAGE_REV;
}
function valid(s){
 if(retired(s))return false;
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
 const urls=[];
 if(/^ellen_/.test(name))urls.push(LOCAL_BASE+'street_buildings/'+name);
 urls.push(base+'assets/street_buildings/'+name);
 let last=Error(name+' not yet published');
 for(const url of urls){
  try{
   const res=await fetch(url,{cache:'no-store'});
   if(!res.ok){last=Error(name+' not yet published: '+res.status);continue;}
   const j=await res.json();
   if(j?.projection!=='isometric-2:1'||!Array.isArray(j.assets)){last=Error('Invalid '+name);continue;}
   return j.assets.filter(valid);
  }catch(err){last=err;}
 }
 throw last;
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
 const priorAll=Array.isArray(g.VLAssetCatalog)?g.VLAssetCatalog:[];
 const prior=priorAll.filter(s=>!retired(s));
 const existing=new Set(prior.map(x=>x.file));
 const unique=entries.filter(x=>!existing.has(x.file));
 const index=new Map();
 for(const e of unique){index.set(e.id,e);index.set(e.file,e);}
 const previous=g.VLPipelineAssets||{};
 if(unique.length||prior.length!==priorAll.length||(previous.prefabs||[]).some(retired)){
  g.VLAssetCatalog=Object.freeze([...prior,...unique.map(e=>Object.freeze(e))]);
  const legacy=typeof previous.building==='function'?
   previous.building.bind(previous):()=>null;
  g.VLPipelineAssets=Object.freeze({
   ...previous,
   prefabs:Object.freeze([...(previous.prefabs||[]).filter(s=>!retired(s)),...unique]),
   building(id,dir='sw'){
    if(retired({id,file:String(id||'')}))return null;
    const item=index.get(id);
    if(item){
     const v=item.variants[dir]||item.variants.sw||item.variants.se;
     if(!v)return null;
     if(/^ellen-/.test(item.pack||''))
      return LOCAL_BASE+'street_buildings/'+v.file+'?v=njh-cp3-confirm-20261122';
     return cacheBust(item,base+'assets/street_buildings/'+v.file);
    }
    return legacy(id,dir);
   }
  });
 }
 cached={loaded:true,count:unique.length,available:entries.length,
  packs:responses.filter(x=>x.status==='fulfilled').length};
 return cached;
}
g.VLIndonesiaAssets=Object.freeze({load,base,valid,PACKS,cacheBust,IMAGE_REV,PREVIEW_REF,LOCAL_BASE,ALLOWED_TRANSPORT,retired});
})(typeof window!=='undefined'?window:globalThis);
