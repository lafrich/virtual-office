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
 if(o?.type==='avatar'||o?.type==='npc')return 'actor';
 if(o?.type==='marker')return 'marker';
 if(PROP_NAMES.has(o?.type))return o.type==='box'?'prop':o.type;
 if(spec){
  if(spec.source==='pipeline-vegetation')return spec.group.includes('trees')?'tree':'ground';
  const id=String(spec.id||'').toLowerCase(),file=String(o.asset||'').toLowerCase();
  if(/bangku|chair|armchair|stool/.test(id+' '+file))return 'bench';
  if(/meja|table/.test(id+' '+file))return 'table';
  if(/lamp|tiang/.test(id+' '+file))return 'lamp';
  if(/tong_sampah|trash|bin/.test(id+' '+file))return 'trash';
  if(/pohon|tree|vegetation/.test(id+' '+file))return 'tree';
  if(['jalan','kampung','gang','loak'].includes(spec.group)&&spec.source==='pipeline-street')return 'building';
  if(['taman','prop','sinyal'].includes(spec.group))return 'prop';
  return 'furniture';
 }
 return (o?.type==='building'||o?.type==='shop')?'building':'prop';
}
function footprint(o,catalog){
 const s=o?.type==='sprite'?catalog?.get(o.asset):null;
 const kind=category(o,catalog);
 if(kind==='actor')return [0.65,0.65];
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
 if(o.type==='avatar'||o.type==='npc'||o.type==='marker'){o.rotation=0;o.scale=1;return o;}
 const s=o.type==='sprite'?catalog?.get(o.asset):null;
 const hasViews=s?.variants&&Object.keys(s.variants).length>1;
 const lockRotation=o.type==='sprite'&&!hasViews;
 o.rotation=lockRotation?0:((Math.round((Number(o.rotation)||0)/90)*90)%360+360)%360;
 // Published prefab dimensions must remain comparable to the native world;
 // no freeform squashing, and scaling is always uniform.
 o.scale=Math.max(.85,Math.min(1.15,Math.round((Number(o.scale)||1)*100)/100));
 if(s){o.width=Number(s.width||o.width||2);o.height=Number(s.height||o.height||2);}
 return o;
}
function reason(o,objects,map,catalog){
 if(category(o,catalog)==='actor')return '';
 if(category(o,catalog)==='marker')return ''; // Editor-only logic anchors are not solid objects.
 const bounds=map?.worldBounds||BOUNDS;
 const [w,d]=footprint(o,catalog),x=Number(o.x),z=Number(o.z);
 if(!map?.unbounded&&(x-w/2<bounds.minX||x+w/2>bounds.maxX||z-d/2<bounds.minZ||z+d/2>bounds.maxZ))
  return 'Di luar batas map/footprint.';
 const road=map?.road||{z0:ROAD[0],z1:ROAD[1]};
 if(!map?.terrain&&z+d/2>road.z0+.25&&z-d/2<road.z1-.25)
  return 'Objek statis tidak boleh menutup badan jalan.';
 if(map?.terrain&&Array.isArray(map.terrain.cells)){
  const tiles=new Map(map.terrain.cells.map(t=>[t.c+','+t.r,t.type]));
  const minC=Math.floor(x-w/2+.08),maxC=Math.ceil(x+w/2-.08);
  const minR=Math.floor(z-d/2+.08),maxR=Math.ceil(z+d/2-.08);
  for(let c=minC;c<maxC;c++)for(let r=minR;r<maxR;r++){
   const kind=tiles.get(c+','+r)||map.terrain.default||'grass';
   if(kind==='road'||kind==='water')return kind==='road'?'Bangunan/prop tidak boleh menutupi jalan.':'Bangunan/prop tidak boleh menutupi air.';
  }
 }
 const k=category(o,catalog);
 if(k==='lamp'||k==='trash'||k==='bench'||k==='tree'||k==='prop'||k==='furniture'){
  // Keep small furniture/street objects off the middle of the main road;
  // do not mandate a fixed side because the map contains plazas and interiors.
 }
 for(const other of objects||[]){
  if(other.id===o.id||category(other,catalog)==='actor'||other.collision===false)continue;
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
