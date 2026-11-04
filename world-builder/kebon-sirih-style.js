/* Kebon Sirih, Menteng, Jakarta Pusat · Native Virtual Life Asset Pipeline.
 * Data-only terrain assets + non-destructive migration of reference-city proxies.
 * Never changes handcrafted Bangun Ruang buildings or player NPCs.
 */
(function(g){
'use strict';
const ROOT='https://raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/main/assets/kebon_sirih/';
const VERSION='kebon-sirih-2026-v1';
const TILES=Object.freeze({
 road_asphalt:'terrain/road_asphalt.png',
 road_concrete:'terrain/road_concrete.png',
 sidewalk:'terrain/sidewalk.png',
 sidewalk_edge_n:'terrain/sidewalk_edge_n.png',
 sidewalk_edge_s:'terrain/sidewalk_edge_s.png',
 sidewalk_edge_e:'terrain/sidewalk_edge_e.png',
 sidewalk_edge_w:'terrain/sidewalk_edge_w.png',
 grass:'terrain/grass.png',
 plaza:'terrain/plaza.png',
 water:'terrain/water.png',
 soil:'terrain/soil.png'
});
function at(map,c,r){
 return map.get(c+','+r)||'grass';
}
function tile(kind,cell,tiles){
 if(kind==='road')return cell?.surface==='concrete'?'road_concrete':'road_asphalt';
 if(kind==='sidewalk'&&tiles){
  const c=cell.c,r=cell.r;
  for(const [code,x,z]of [['n',c,r-1],['s',c,r+1],['w',c-1,r],['e',c+1,r]])
   if(at(tiles,x,z)==='road')return 'sidewalk_edge_'+code;
 }
 return TILES[kind]?kind:'grass';
}
function hash(s){let n=2166136261;for(const char of String(s||'')){n=Math.imul(n^char.charCodeAt(0),16777619)}return n>>>0}
const TYPES=Object.freeze({
 office:['kantor_a','kantor_b','hotel','kantor_a'],
 civic:['kantor_a','kantor_b','hotel'],
 hospital:['kantor_a','hotel'],
 church:['masjid'],
 school:['kantor_a','ruko_c'],
 hotel:['hotel','kantor_b'],
 apartment:['kantor_b','hotel','rumah_kampung_d'],
 bank:['bank_bca','kantor_a'],
 commercial:['mall','indomaret','ruko_a','ruko_b','ruko_c'],
 store:['indomaret','ruko_a','ruko_b','ruko_c','mall'],
 shop:['ruko_a','ruko_b','ruko_c','warung_madura'],
 cafe:['kafe_blue_doors','warung_madura'],
 warehouse:['ruko_c','mall'],
 factory:['mall','ruko_c'],
 residential:['rumah_kampung_a','rumah_kampung_b','rumah_kampung_c','rumah_kampung_d','rumah_kampung_e'],
 service:['ruko_a','warung_madura'],
 police:['kantor_a','kantor_b'],
 jail:['kantor_a'],
 library:['kantor_a','ruko_c']
});
const POOLS=Object.freeze({
 park:['pohon_kiara_payung','pohon_ketapang_kencana','pohon_bungur','pohon_flamboyan'],
 street:['pohon_angsana_M','pohon_asam_M','pohon_mahoni_M','pohon_glodokan_tiang'],
 forest:['pohon_beringin','pohon_ulin','pohon_tengkawang','pohon_meranti']
});
const ALLOWED=new Set(['building','shop','tree','lamp','bench','box']);
function category(o){
 if(['building','shop'].includes(o.type))return 'building';
 if(o.type==='tree')return 'tree';
 if(o.type==='lamp')return 'utility';
 if(o.type==='bench')return 'furniture';
 if(o.type==='box')return 'street';
 return null;
}
function eligible(o,isReference=false){
 if(!o||!ALLOWED.has(o.type))return false;
 const tags=Array.isArray(o.tags)?o.tags:[];
 if(tags.some(t=>['reference-city','city-sample','placeholder','builder-placeholder','pixel-preview'].includes(t)))return true;
 if(String(o.id||'').startsWith('ref-'))return true;
 if(isReference&&o.replaceable===true)return true;
 return false;
}
function buildingPool(o){
 const text=(String(o.subtype||'')+' '+String(o.name||'')).toLowerCase();
 const kind=Object.keys(TYPES).find(k=>text.includes(k))||
  (o.type==='shop'?'shop':'office');
 return TYPES[kind]||TYPES.office;
}
function pick(o,catalog){
 const type=category(o),h=hash(o.id);
 let options;
 if(type==='building')options=[...buildingPool(o),'rumah_kampung_d','rumah_kampung_c','warung_madura','pos_ronda'];
 else if(type==='tree'){
  const tags=o.tags||[],group=tags.includes('forest')?'forest':tags.includes('park')?'park':'street';
  options=POOLS[group];
 }else if(type==='utility'){
  const park=(o.tags||[]).includes('park');
  options=park?['lampu_taman']:['lampu_taman','lampu_taman','tiang_listrik','tiang_listrik_polos','tiang_trafo'];
 }else if(type==='furniture')options=['bangku_taman'];
 else options=['tong_sampah','pot_tanaman'];
 if(!options)return null;
 // Resolve preferred semantic subtype, then deterministically fall back to
 // another published compatible sprite if the preferred one doesn't fit.
 for(let step=0;step<options.length;step++){
  const id=options[(h+step)%options.length];
  const spec=(catalog||[]).find(e=>e.id===id&&e.published===true);
  if(!spec)continue;
  const fw=Number(spec.footprint?.[0]||0),fd=Number(spec.footprint?.[1]||0);
  if(type==='building'&&fw&&fd&&(fw>Number(o.w||fw)+.2||fd>Number(o.d||fd)+.2))continue;
  return spec;
 }
 return null;
}
function upgrade(source,catalog){
 if(!source||!Array.isArray(source.objects))return {map:source,changed:0,skipped:0};
 const map={...source,objects:source.objects.slice(),
  map:{...source.map}};
 const isReference=map.map?.preset==='reference-city-v1'||/City Sample|Reference City/i.test(map.map?.name||'');
 let changed=0,skipped=0;
 map.objects=map.objects.map(o=>{
  if(!eligible(o,isReference))return o;
  const spec=pick(o,catalog);
  if(!spec){skipped++;return o;}
  const tags=(Array.isArray(o.tags)?o.tags:[]).filter(x=>!['placeholder','builder-placeholder','pixel-preview'].includes(x));
  changed++;
  // Keep exact object ID, position, semantic name and existing interactions;
  // only visual/type/metadata change. Do not alter original city topology.
  const res={...o,type:'sprite',asset:spec.file,width:spec.width,height:spec.height,
   rotation:0,scale:1,layer:category(o)==='tree'?'vegetation':category(o)==='building'?'structure':'prop',
   collision:spec.collision!==false,blocking:spec.collision===false?'no':'auto',
   replaceable:true,tags:[...new Set([...tags,'kebon-sirih','pipeline-native'])],
   source:spec.source,assetPath:undefined,assetCategory:undefined,
   w:undefined,d:undefined,h:undefined,sizeClass:undefined,
   notes:(String(o.notes||'')+' | Kebon Sirih visual sprite: '+spec.label).trim().slice(0,500)};
  return res;
 });
 const beforeStyle=map.map.visualStyle;
 map.map.visualStyle=VERSION;
 map.map.terrainStyle='pipeline:assets/kebon_sirih/manifest.json';
 // A recognizable default scene name, not a claim of surveyed street geometry.
 if(map.map.name==='Reference City · Isometric Town')map.map.name='Kebon Sirih · Jakarta Pusat (inspired)';
 if(map.map.name==='Virtual Life · City Sample (editable placeholders)')map.map.name='Kebon Sirih · City Sample';
 const description='Kebon Sirih Jakarta Pusat-inspired pixel architecture and infrastructure; editable fictional map, not geographic survey.';
 if(beforeStyle!==VERSION&&!String(map.map.notes||'').includes(description))
  map.map.notes=(String(map.map.notes||'')+' '+description).trim();
 return {map,changed,skipped};
}
g.VLKebonSirihStyle=Object.freeze({
 VERSION,TILES,ROOT,tileUrl(name){return TILES[name]?ROOT+TILES[name]:null},
 tile,category,eligible,pick,upgrade
});
})(window);
