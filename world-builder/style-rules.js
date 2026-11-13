/* Virtual Life World Builder — shared placement and art constraints.
 * Non-destructive standalone editor. All dimensions are authored tile units.
 * Catalog metadata originates from official GPT asset paths and the upstream
 * Virtual Life Asset Pipeline manifest. Proxies are explicitly NOT original art.
 */
(function(g){
'use strict';
const ROAD=[32.75,36.3], BOUNDS={minX:-30,maxX:40,minZ:20,maxZ:55};
const PRESETS=Object.freeze({
 building:'pipeline:kantor_a',shop:'pipeline:warung_madura',
 // Newly placed generic trees should use real published vegetation immediately.
 tree:'vegetation:pohon_angsana_M',
 bench:'pipeline:bangku_taman',lamp:'pipeline:lampu_taman',
 box:'street2/loak/props/tumpukan_kardus_sw.png',
 trash:'street2/loak/props/tong_sampah_besi_se.png'
});
const PROP_NAMES=new Set(['tree','bench','lamp','box','trash']);
const PIXELS={
 tree:{w:80,h:116,width:4.3,height:6.3,pivot:.95},
 bench:{w:88,h:60,width:3.1,height:2.15,pivot:.92},
 table:{w:88,h:64,width:3.15,height:2.25,pivot:.94},
 lamp:{w:36,h:112,width:1.5,height:6.1,pivot:.96},
 trash:{w:52,h:64,width:1.8,height:2.2,pivot:.96},
 box:{w:60,h:60,width:2.1,height:2.1,pivot:.96},
 ground:{w:32,h:22,width:.8,height:.65,pivot:.9}
};
function category(o,catalog){
 const spec=o?.type==='sprite'?catalog?.get(o.asset):null;
 if(['avatar','npc','pedestrian','crowd','quest_npc'].includes(o?.type))return 'actor';
 if(o?.type==='vehicle')return 'vehicle';
 if(o?.type==='virtual_asset'){
  return o.assetCategory==='building'?'building':
   o.assetCategory==='tree'?'tree':'prop';
 }
 if(o?.type==='marker')return 'marker';
 if(PROP_NAMES.has(o?.type))return o.type==='box'?'prop':o.type;
 if(spec){
  if(spec.source==='bangun-object')return ({plant:'tree',lamp:'lamp',furniture:'furniture',street:'prop',decor:'prop'})[spec.objectCategory]||'prop';
  if(spec.source==='pipeline-vegetation')return spec.group.includes('trees')?'tree':'ground';
  const id=String(spec.id||'').toLowerCase(),file=String(o.asset||'').toLowerCase();
  if(/bangku|chair|armchair|stool/.test(id+' '+file))return 'bench';
  if(/meja|table/.test(id+' '+file))return 'table';
  if(/lamp|tiang/.test(id+' '+file))return 'lamp';
  if(/tong_sampah|trash|bin/.test(id+' '+file))return 'trash';
  if(/pohon|tree|vegetation/.test(id+' '+file))return 'tree';
  if(['jalan','kampung','gang','loak'].includes(spec.group)&&['pipeline-street','custom-building'].includes(spec.source))return 'building';
  if(['taman','prop','sinyal'].includes(spec.group))return 'prop';
  return 'furniture';
 }
 return (o?.type==='building'||o?.type==='shop')?'building':'prop';
}
function footprint(o,catalog){
 const s=o?.type==='sprite'?catalog?.get(o.asset):null;
 const kind=category(o,catalog);
 if(kind==='actor')return o.type==='crowd'?[.75,.75]:[.65,.65];
 if(o?.type==='virtual_asset')return [
  Math.max(.5,Number(o.w||2)*Number(o.scale||1)),
  Math.max(.5,Number(o.d||2)*Number(o.scale||1))
 ];
 if(kind==='vehicle'){
  const meta=g.VLSemestaCatalog?.vehicle(o.vehicleId),size=meta?.editorFootprint||meta?.footprint||[2.9,1.05];
  let [w,d]=size;
  const direction=o.motion?.direction||'auto';
  if(['north','south'].includes(direction))[w,d]=[d,w];
  // Visual vehicle sizing never changes occupied road tiles or traffic spacing.
  return [w,d];
 }
 if(kind==='marker')return [.15,.15];
 if(kind==='building'){
  let width=Math.max(.5,Number(s?.footprint?.[0]||o.w||6));
  let depth=Math.max(.5,Number(s?.footprint?.[1]||o.d||5));
  if([90,270].includes(((Number(o.rotation)||0)%360+360)%360)) [width,depth]=[depth,width];
  return [width*Number(o.scale||1),depth*Number(o.scale||1)];
 }
 const native={
  tree:[1.4,1.4],ground:[.2,.2],bench:[2,1],table:[2,1.6],trash:[.95,.95],lamp:[.75,.75],
  prop:[1.25,1],furniture:[1.4,1.2]
 }[kind]||[1.2,1.2];
 const dims=s?.footprint||native;
 return [Math.max(.5,Number(dims[0]||native[0]))*Number(o.scale||1),
         Math.max(.5,Number(dims[1]||native[1]))*Number(o.scale||1)];
}
function normalize(o,catalog){
 if(o.type==='vehicle'){
  o.rotation=0;
  g.VLSemestaVehiclePlacement?.normalize(o);
  return o;
 }
 if(['avatar','npc','marker','pedestrian','crowd','quest_npc'].includes(o.type)){
  o.rotation=0;o.scale=1;return o;
 }
 const s=o.type==='sprite'?catalog?.get(o.asset):null;
 const hasViews=s?.variants&&Object.keys(s.variants).length>1;
 const lockRotation=o.type==='sprite'&&!hasViews;
 o.rotation=lockRotation?0:((Math.round((Number(o.rotation)||0)/90)*90)%360+360)%360;
 // Published prefab dimensions must remain comparable to the native world;
 // no freeform squashing, and scaling is always uniform.
 const authoredLargeTree=o.type==='sprite'&&s?.source==='pipeline-vegetation'&&Array.isArray(o.tags)&&o.tags.includes('large-canopy');
 o.scale=Math.max(.1,Math.min(authoredLargeTree?2.65:1.15,Math.round((Number(o.scale)||1)*100)/100));
 if(s){o.width=Number(s.width||o.width||2);o.height=Number(s.height||o.height||2);}
 return o;
}
const terrainCache=new WeakMap();
function getTerrainIndex(t){
 const found=terrainCache.get(t);
 if(found?.cells===t.cells)return found.index;
 const index=new Map(t.cells.map(cell=>[cell.c+','+cell.r,cell.type]));
 terrainCache.set(t,{cells:t.cells,index});
 return index;
}
function reason(o,objects,map,catalog){
 const itemKind=category(o,catalog);
 if(itemKind==='marker')return ''; // Editor-only logic anchors are not physical.
 const isMobile=['vehicle','pedestrian','crowd','quest_npc'].includes(o.type);
 const isActor=itemKind==='actor'||itemKind==='vehicle';
 if(isMobile){
  const allowed=o.type==='vehicle'?'road':'sidewalk';
  const t=map?.terrain;
  if(t){
   const tiles=getTerrainIndex(t),tile=tiles.get(Math.floor(Number(o.x))+','+Math.floor(Number(o.z)))||t.default||'grass';
   if(o.type==='quest_npc'){
    if(!['road','sidewalk','plaza'].includes(tile))
     return 'NPC Quest harus di jalan, trotoar, atau plaza.';
   }else if(tile!==allowed)return o.type==='vehicle'?
    'Kendaraan harus di atas jalan.':'NPC / crowd harus di atas trotoar.';
  }
  if(o.type!=='quest_npc'&&!g.VLSemestaTraffic?.choose(map,o.x,o.z,o.type==='vehicle'?'vehicle':'pedestrian',o.motion?.direction||'auto'))
   return 'Butuh jalur lurus minimal tiga tile berurutan.';
 }
 const bounds=map?.worldBounds||BOUNDS;
 const [w,d]=footprint(o,catalog),x=Number(o.x),z=Number(o.z);
 if(!map?.unbounded&&(x-w/2<bounds.minX||x+w/2>bounds.maxX||z-d/2<bounds.minZ||z+d/2>bounds.maxZ))
  return 'Di luar batas map/footprint.';
 const road=map?.road||{z0:ROAD[0],z1:ROAD[1]};
 if(!isActor&&(Number(o.y)||0)<.05&&!map?.terrain&&z+d/2>road.z0+.25&&z-d/2<road.z1-.25)
  return 'Objek statis tidak boleh menutup badan jalan.';
 if((Number(o.y)||0)<.05&&map?.terrain&&Array.isArray(map.terrain.cells)){
  const tiles=getTerrainIndex(map.terrain);
  const minC=Math.floor(x-w/2+.08),maxC=Math.ceil(x+w/2-.08);
  const minR=Math.floor(z-d/2+.08),maxR=Math.ceil(z+d/2-.08);
  for(let c=minC;c<maxC;c++)for(let r=minR;r<maxR;r++){
   const kind=tiles.get(c+','+r)||map.terrain.default||'grass';
   if(['water','river','drain'].includes(kind)&&!isMobile)return 'Objek tidak boleh menutupi air atau selokan.';
   if(kind==='road'&&!isActor)return 'Bangunan/prop tidak boleh menutupi jalan.';
  }
 }
 const k=category(o,catalog);
 if(k==='lamp'||k==='trash'||k==='bench'||k==='tree'||k==='prop'||k==='furniture'){
  // Keep small furniture/street objects off the middle of the main road;
  // do not mandate a fixed side because the map contains plazas and interiors.
 }
 for(const other of objects||[]){
  if(other.id===o.id||category(other,catalog)==='marker'||
     other.collision===false||other.blocking==='no')continue;
  if(g.VLSemestaElevation&&!g.VLSemestaElevation.verticalOverlap(o,other,catalog,g.VLWorldStyle))continue;
  const [ow,od]=footprint(other,catalog),pad=(k==='building'||category(other,catalog)==='building')?0.2:0.12;
  if(Math.abs(x-other.x)<(w+ow)/2+pad&&Math.abs(z-other.z)<(d+od)/2+pad)
   return 'Footprint bertabrakan dengan '+(other.name||other.id)+'.';
 }
 return '';
}
function nearest(candidate,objects,map,catalog){
 const original={...candidate};
 const tryPoint=(x,z)=>{
  candidate.x=Math.round(x*2)/2;candidate.z=Math.round(z*2)/2;
  return !reason(candidate,objects,map,catalog);
 };
 if(tryPoint(original.x,original.z))return true;
 for(let radius=.5;radius<=24;radius+=.5){
  for(let a=-radius;a<=radius;a+=.5){
   // Square ring keeps search deterministic, unlike random placement.
   if(tryPoint(original.x+a,original.z-radius)||
      tryPoint(original.x+a,original.z+radius)||
      tryPoint(original.x-radius,original.z+a)||
      tryPoint(original.x+radius,original.z+a))return true;
  }
 }
 candidate.x=original.x;candidate.z=original.z;return false;
}
function proxyTexture(THREE,type){
 const m=PIXELS[type]||PIXELS.box;
 const c=document.createElement('canvas');c.width=m.w;c.height=m.h;
 const q=c.getContext('2d');q.imageSmoothingEnabled=false;
 const rect=(color,x,y,w,h)=>{q.fillStyle=color;q.fillRect(x,y,w,h);};
 const ink='#2c3945',light='#e1c991',wood='#88634b',woodHi='#bb8d66',
 leaf='#376847',leafHi='#5c9162',steel='#65777d',steelHi='#a7b7a7';
 if(type==='tree'){
  rect(ink,34,57,15,54);rect(wood,37,58,9,49);rect(woodHi,38,65,3,32);
  rect(ink,18,24,42,53);rect(leaf,19,25,40,49);
  rect(ink,9,42,19,31);rect(leaf,11,44,17,27);
  rect(ink,48,35,22,40);rect(leaf,50,37,18,36);
  rect(ink,25,8,30,25);rect(leaf,27,10,26,24);
  for(const [x,y] of [[30,18],[45,34],[18,51],[53,57],[26,67],[37,45]])
   rect(leafHi,x,y,8,6);
  rect(ink,30,109,25,4);
 }else if(type==='bench'){
  rect(ink,10,16,68,28);rect(wood,12,18,64,24);
  for(let y=23;y<41;y+=8)rect(woodHi,15,y,58,3);
  rect(ink,7,41,74,10);rect(wood,10,43,68,6);rect(light,12,43,60,2);
  rect(ink,15,50,8,10);rect(steel,17,50,4,8);
  rect(ink,65,50,8,10);rect(steel,67,50,4,8);
 }else if(type==='ground'){
  rect(leaf,4,15,22,5);rect(leafHi,8,11,15,5);rect(leaf,13,7,8,6);
 }else if(type==='table'){
  rect(ink,9,23,71,22);rect(wood,12,26,65,15);
  rect(woodHi,14,28,60,4);rect(ink,17,42,9,20);rect(steel,19,44,5,16);
  rect(ink,61,42,9,20);rect(steel,63,44,5,16);
 }else if(type==='lamp'){
  rect(ink,14,17,10,88);rect(steel,17,19,4,83);
  rect(ink,7,13,23,8);rect(light,9,15,19,4);
  rect(ink,4,7,29,7);rect(steelHi,7,9,23,3);
  rect(ink,9,103,20,6);rect(steel,12,104,14,3);
 }else if(type==='trash'){
  rect(ink,10,16,33,43);rect(steel,13,20,27,35);
  rect(steelHi,16,23,5,27);rect(ink,7,13,39,8);
  rect(steelHi,11,15,31,3);rect(ink,14,59,26,3);
 }else{
  rect(ink,7,16,45,37);rect(wood,10,19,39,32);
  rect(woodHi,12,21,32,4);rect(ink,29,18,3,34);rect(ink,10,33,39,3);
 }
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
 t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;
 return {texture:t,...m};
}
g.VLWorldStyle=Object.freeze({version:'style-rules-1',presets:PRESETS,
 category,footprint,normalize,reason,nearest,proxyTexture,
 isPixelProxy:type=>!!PIXELS[type]});
})(window);
