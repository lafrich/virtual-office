/* Jakarta City: editable central Jakarta-inspired Semesta city.
 * Reuses existing city terrain and Jakarta / pipeline asset migration, not invented remote sprites.
 */
(function(g){
'use strict';
function create(base,catalog,style,schema){
 const city=g.VLReferenceCity.create(base,catalog,style,schema);
 city.map.name='Jakarta City';
 city.map.preset='jakarta-city-central-v1';
 city.map.notes='Stylized Jakarta Pusat: Monas/Medan Merdeka, Thamrin-Sudirman, Kebon Sirih, Menteng, Pasar Baru, Tanah Abang, Gambir. Approximate playable interpretation, not a surveyed GIS road map.';
 city.map.landmarks={monas:{c:33,r:59},gambir:{c:33,r:30},thamrin:{c:19,r:72},kebonSirih:{c:19,r:43},menteng:{c:60,r:59},tanahAbang:{c:-20,r:87},pasarBaru:{c:7,r:6}};
 const byId=new Map(city.objects.map(o=>[o.id,o]));
 const names={
 'ref-hospital':['RS Jakarta Pusat','hospital'],
 'ref-church':['Gedung Bersejarah Pasar Baru','civic'],
 'ref-city-hall':['Stasiun Gambir (representasi)','service'],
 'ref-civic-annex':['Kompleks Pemerintahan','civic'],
 'ref-clock-tower':['Gedung Kantor Menteng','office'],
 'ref-jail':['Kantor Polisi Jakarta Pusat','police'],
 'ref-police':['Pos Polisi Kebon Sirih','police'],
 'ref-gas-station':['SPBU Jakarta','service'],
 'ref-central-library':['Pusat Grosir Tanah Abang','store'],
 'ref-market':['Pasar Tanah Abang','store'],
 'ref-factory':['Bangunan Komersial Cikini','office'],
 'ref-warehouse':['Pergudangan / Ruko','warehouse'],
 'ref-school':['Sekolah Jakarta','school'],
 'ref-hotel':['Hotel Pasar Baru','hotel'],
 'ref-commerce':['Pasar Baru','store'],
 'ref-housing-office':['Apartemen Jakarta','residential']
 };
 for(const [id,[name,subtype]] of Object.entries(names)){
  const o=byId.get(id);if(!o)continue;
  o.name=name;o.subtype=subtype;
  o.tags=['jakarta','jakarta-pusat',subtype,'editable'];
  o.notes='Jakarta-inspired building placement. Replace with an accurate Semesta native asset when available.';
 }
 // Retain the reference city's legally traversable, connected road + sidewalk network.
 // Rework the central park to represent Medan Merdeka and add a non-blocking landmark.
 const center=byId.get('ref-clock-tower');
 if(center)center.name='Gedung Perkantoran Menteng';
 const monas={id:'jakarta-monas',type:'building',name:'Monumen Nasional · MONAS',
  x:33.5,z:59.5,y:0,rotation:0,scale:1,w:3,d:3,h:19,
  color:'#e2d2a6',collision:true,blocking:'auto',layer:'structure',
  subtype:'landmark',sizeClass:'small',replaceable:true,
  tags:['jakarta','monas','medan-merdeka','landmark'],interactions:[],
  notes:'Landmark geometry placeholder. Actual Monas-specific artwork not claimed.'};
 style.normalize(monas,catalog);schema.normalize(monas,catalog,style);
 city.objects.push(monas);
 const locations=[
  ['Bundaran HI / Jalan Thamrin',19,63,'marker'],
  ['Jalan Kebon Sirih',19,43,'marker'],
  ['Stasiun Gambir',32,24,'marker'],
  ['Kawasan Menteng',60,56,'marker'],
  ['Pasar Baru',6,6,'marker'],
  ['Tanah Abang',-20,82,'marker']
 ];
 locations.forEach(([name,x,z],i)=>{
  city.objects.push({id:'jakarta-label-'+i,type:'marker',name,x,z,y:0,rotation:0,scale:1,
   markerKind:'interaction',collision:false,blocking:'no',layer:'marker',subtype:'location',
   tags:['jakarta','location-label'],interactions:[],notes:'Approximate district guide marker; not functional navigation.'});
 });
 for(const o of city.objects){
  if(o.id.startsWith('ref-infill')||o.id.startsWith('ref-density')||o.id.startsWith('ref-row')||o.id.startsWith('ref-north')||o.id.startsWith('ref-east')||o.id.startsWith('ref-west')||o.id.startsWith('ref-south')){
   if(o.type==='shop'||o.subtype==='shop')o.name='Ruko Jakarta · '+o.id.slice(-4);
   else if(o.subtype==='house')o.name='Rumah Permukiman Jakarta';
   else if(o.subtype==='office')o.name='Gedung Kantor Jakarta';
  }
 }


 // Jakarta City v3 · compact, heterogeneous, independently editable buildings.
 // Uses the actual registered asset IDs and falls back to distinct 3D blocks
 // whenever a native building cannot fit. Keep the major reference roads intact.
 const randSeed=260611;let randState=randSeed;
 const rand=()=>{randState=(Math.imul(randState,1664525)+1013904223)>>>0;return randState/4294967296};
 const choose=a=>a.length?a[Math.floor(rand()*a.length)]:null;
 const types=new Map(city.map.terrain.cells.map(t=>[t.c+','+t.r,t]));
 const key=(c,r)=>c+','+r;
 const terrainAt=(c,r)=>types.get(key(c,r))?.type||'grass';
 const paint=(c,r,type)=>types.set(key(c,r),{c,r,type,
  walkable:!['river','drain','water','road'].includes(type),
  driveable:type==='road',buildable:['grass','plaza','soil'].includes(type)});
 const occupied=(x,z,buffer=.2)=>{
  for(const o of city.objects){
   if(o.type==='marker'||o.collision===false||o.blocking==='no'||o.type==='vehicle')continue;
   const [w,d]=style.footprint(o,catalog);
   if(Math.abs(o.x-x)<w/2+buffer&&Math.abs(o.z-z)<d/2+buffer)return true;
  }
  return false;
 };
 // Contrasting water infrastructure: west river, both embankments, and city drains.
 for(let r=13;r<=108;r++){
  for(let c=-56;c<=-53;c++)paint(c,r,'river');
  for(const c of [-57,-52])paint(c,r,'sidewalk');
 }
 for(const r of [20,46,76,102])for(let c=-46;c<=70;c++){
  if((c+48)%11<2)continue;
  const existing=terrainAt(c,r);
  if((existing==='sidewalk'||existing==='grass')&&!occupied(c+.5,r+.5,.1))paint(c,r,'drain');
 }
 for(const c of [-35,-11,17,45,50,70])for(let r=21;r<100;r++){
  if((r+4)%12<2)continue;
  const existing=terrainAt(c,r);
  if((existing==='sidewalk'||existing==='grass')&&!occupied(c+.5,r+.5,.1))paint(c,r,'drain');
 }
 city.map.terrain.cells=[...types.values()].sort((a,b)=>a.r-b.r||a.c-b.c);
 const all=[...catalog.values()].filter(a=>a?.file&&a.source==='pipeline-street'&&a.published===true);
 const named=(re)=>all.filter(a=>re.test([a.id,a.label,a.group].join(' ')));
 const pools={
  house:named(/rumah|kampung|kontrakan|kos|residen/i),
  ruko:named(/ruko|toko|warung|kios|pasar|retail/i),
  commerce:named(/kantor|office|hotel|apartemen|gedung|komersial/i),
  market:named(/pasar|grosir|toko|gudang|warehouse|ruko/i),
  greenery:named(/semak_kota|rumput_kota|pot_tanaman/i),
  utility:named(/lampu_taman|tiang_listrik|tong_sampah|hydrant_jakarta/i),
  drain:named(/selokan_grill/i)
 };
 let serial=0,placed=0,artworks=0,proxy=0;
 const blockedTerrain=(x,z,w,d)=>{
  for(let c=Math.floor(x-w/2+.02);c<Math.ceil(x+w/2-.02);c++)
   for(let r=Math.floor(z-d/2+.02);r<Math.ceil(z+d/2-.02);r++)
    if(['road','river','drain','water','sidewalk'].includes(terrainAt(c,r)))return true;
  return false;
 };
 function nativeObject(a,x,z,zone,decor=false){
  if(!a)return false;
  const o={id:'jakarta-v3-'+(++serial),type:'sprite',name:(a.label||a.id)+' · Jakarta',
   asset:a.file,assetSource:'pipeline-street',assetPublished:true,
   x,z,y:0,rotation:0,scale:1,layer:decor?'prop':'structure',subtype:a.id,
   collision:!decor,blocking:decor?'no':'auto',replaceable:true,
   tags:['jakarta-city','dense-v3',zone,'native'],interactions:decor?[]:['enter'],
   notes:'Published native pipeline sprite, individually editable'};
  style.normalize(o,catalog);schema.normalize(o,catalog,style);
  if(!decor&&style.reason(o,city.objects,city.map,catalog))return false;
  if(decor&&['road','drain','river','water'].includes(terrainAt(Math.floor(x),Math.floor(z))))return false;
  city.objects.push(o);placed++;artworks++;return true;
 }
 const looks={
  kampung:{w:[1.7,2,2.2],d:[1.7,2.1],h:[2.5,3.3,4.1,4.6],colors:['#bc9d81','#d3b49d','#b2ad9e','#c7a293']},
  ruko:{w:[2,2.25,2.55],d:[2.25,2.6],h:[4.1,5.4,6.8,7.2],colors:['#bd9784','#c6b59b','#9baeb2','#a99a8b']},
  market:{w:[2.25,2.5,2.8],d:[2.2,2.6],h:[3.8,4.7,5.6],colors:['#9fa49b','#c8aa8f','#aa9c82','#bcae91']},
  mixed:{w:[2.2,2.55,2.8],d:[2.2,2.6],h:[4,5.4,6.3,8.1],colors:['#b4a995','#a3abb1','#c4a48d','#b9b7a7']},
  midrise:{w:[2.6,3,3.3],d:[2.8,3.1],h:[6.2,7.9,9.6,11],colors:['#96a9b8','#a7a89d','#b8aaa0','#b4bec8']},
  cbd:{w:[3,3.5,4],d:[3,3.5],h:[10.1,12.2,15.4,19],colors:['#91a3b3','#b5c3ca','#9b9f9a','#c0b5aa']}
 };
 function proxyObject(x,z,zone){
  const k=looks[zone],w=choose(k.w),d=choose(k.d);
  if(blockedTerrain(x,z,w,d))return false;
  const o={id:'jakarta-v3-'+(++serial),type:zone==='ruko'||zone==='market'?'shop':'building',
   name:({kampung:'Rumah / Kos',ruko:'Ruko',market:'Kios / Grosir',mixed:'Mixed Use',
    midrise:'Gedung Midrise',cbd:'Tower Jakarta'})[zone]+' · Jakarta',
   x,z,y:0,w,d,h:choose(k.h),scale:1,rotation:0,color:choose(k.colors),
   collision:true,blocking:'auto',layer:'structure',subtype:zone,
   replaceable:true,tags:['jakarta-city','dense-v3',zone,'editable-proxy'],
   interactions:['enter'],notes:'Distinct editable 3D building; replace with native art when available'};
  style.normalize(o,catalog);schema.normalize(o,catalog,style);
  if(style.reason(o,city.objects,city.map,catalog))return false;
  city.objects.push(o);placed++;proxy++;return true;
 }
 // Geographic districts are approximate storytelling zones, not an exact GIS map.
 function zone(c,r){
  if(c>=21&&c<=46&&r>=46&&r<=71)return null; // Medan Merdeka
  if(c<-34&&r<15)return null;
  if(c>47&&r<76)return rand()<.68?'cbd':'midrise';
  if(c<-7&&r>77)return rand()<.65?'market':'kampung';
  if(c<16&&r<19)return rand()<.78?'kampung':'ruko';
  if(r>76)return rand()<.55?'kampung':'mixed';
  if(c<20)return rand()<.67?'ruko':'kampung';
  return rand()<.62?'mixed':'midrise';
 }
 // Main fill: small irregular parcels; native published buildings are preferred
 // but only if collision validation proves they fit the existing street graph.
 for(let r=-5;r<=108;r+=2.55)for(let c=-46;c<=70;c+=2.55){
  if(rand()<.045)continue;
  const x=c+.5+(rand()-.5)*.18,z=r+.5+(rand()-.5)*.18;
  const district=zone(c,r);if(!district)continue;
  const candidates=district==='kampung'?pools.house:district==='ruko'?pools.ruko:
   district==='market'?pools.market:district==='mixed'?pools.ruko:
   pools.commerce;
  // Try several real building variants; don't let one oversized asset
  // silently discard an otherwise usable lot.
  let built=false;
  for(let attempt=0;attempt<Math.min(4,candidates.length);attempt++){
   if(nativeObject(choose(candidates),x,z,district)){built=true;break;}
  }
  if(!built)proxyObject(x,z,district);
 }
 // Additional narrow infill along surviving corridors and service alleys.
 for(let r=-4;r<=107;r+=4.8)for(let c=-45;c<=69;c+=4.8){
  if(rand()<.22)continue;
  const district=zone(c,r);if(!district)continue;
  proxyObject(c+1.55,r+1.4,district==='cbd'?'midrise':district);
 }
 // Microdetails are non-blocking and never make roads unwalkable.
 for(let r=-4;r<=105;r+=5.3)for(let c=-46;c<=70;c+=5.4){
  const z=r+.3,x=c+.4;
  const a=choose(rand()<.53?pools.utility:pools.greenery);
  if(a&&!occupied(x,z,.15))nativeObject(a,x,z,'streetscape',true);
 }
 for(const r of [20,46,76,102])for(let c=-43;c<=68;c+=12){
  const a=choose(pools.drain);if(a&&terrainAt(c,r)==='sidewalk')nativeObject(a,c+.5,r+.5,'drain-grill',true);
 }
 city.map.preset='jakarta-city-central-v3';
 city.map.notes+=' Density v3: varied compact housing, attached ruko, market blocks, midrise and office towers with working river and drain terrain. Geometry proxies remain marked for replacement.';
 city.map.densityAdditions=placed;
 city.map.nativeAdditions=artworks;
 city.map.proxyAdditions=proxy;
 city.map.presetObjectCount=city.objects.length;

 return city;
}
g.VLJakartaCity={create};
})(window);
