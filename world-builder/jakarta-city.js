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

 // Jakarta City v2: dense, independently editable neighborhoods and water infrastructure.
 // Deterministic layout: no arbitrary changes on subsequent loads.
 let rng=260611;const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
 const cells=new Map(city.map.terrain.cells.map(t=>[t.c+','+t.r,t]));
 const key=(c,r)=>c+','+r;
 const tile=(c,r)=>cells.get(key(c,r))?.type||city.map.terrain.default||'grass';
 const occupied=(c,r,margin=0)=>{
  for(const o of city.objects){
   if(o.type==='marker'||o.collision===false||o.blocking==='no')continue;
   const [w,d]=style.footprint(o,catalog);
   if(Math.abs((o.x||0)-(c+.5))<w/2+.5+margin&&
      Math.abs((o.z||0)-(r+.5))<d/2+.5+margin)return true;
  }return false;
 };
 // A western riverbank and its side canals, not a blue decorative overlay.
 // Outside the original dense blocks so existing buildings cannot be submerged.
 for(let z=14;z<=106;z++)for(let c=-54;c<=-51;c++){
  cells.set(key(c,z),{c,r:z,type:'river',walkable:false,driveable:false,buildable:false});
 }
 for(let z=14;z<=106;z++){
  cells.set(key(-55,z),{c:-55,r:z,type:'sidewalk',walkable:true,driveable:false,buildable:false});
  cells.set(key(-50,z),{c:-50,r:z,type:'sidewalk',walkable:true,driveable:false,buildable:false});
 }
 // Open drains alongside the road, with intermittent pedestrian crossing grates.
 for(const r of [20,46,76,102]){
  for(let c=-46;c<=70;c++){
   if(c%8===0||c%8===1||occupied(c,r,0.1))continue;
   const t=tile(c,r);
   if(t!=='sidewalk'&&t!=='grass'&&t!=='soil')continue;
   cells.set(key(c,r),{c,r,type:'drain',walkable:false,driveable:false,buildable:false});
  }
 }
 for(const c of [-35,-11,17,45,50,70]){
  for(let r=22;r<=99;r++){
   if(r%9===0||r%9===1||occupied(c,r,0.1))continue;
   const t=tile(c,r);
   if(t!=='sidewalk'&&t!=='grass'&&t!=='soil')continue;
   cells.set(key(c,r),{c,r,type:'drain',walkable:false,driveable:false,buildable:false});
  }
 }
 city.map.terrain.cells=[...cells.values()].sort((a,b)=>a.r-b.r||a.c-b.c);
 // Prefer existing published Jakarta pipeline art; never invent new sprite URLs.
 const assets=[...catalog.values()].filter(e=>e?.published===true&&e.source==='pipeline-street'&&e.file);
 const categories={
  housing:assets.filter(a=>/rumah|kontrakan|kampung|kos|residen/i.test(a.id+' '+a.label)),
  retail:assets.filter(a=>/ruko|warung|toko|kios|pasar/i.test(a.id+' '+a.label)),
  offices:assets.filter(a=>/kantor|gedung|hotel|apartemen/i.test(a.id+' '+a.label)),
  greenery:assets.filter(a=>/semak_kota|rumput_kota|pot_tanaman/i.test(a.id+' '+a.label)),
  utilities:assets.filter(a=>/lampu_taman|tiang_listrik|tong_sampah|hydrant_jakarta/i.test(a.id+' '+a.label)),
  drain:assets.filter(a=>/selokan_grill|selokan_lurus/i.test(a.id+' '+a.label))
 };
 let serial=0,added=0;
 function addSprite(spec,x,z,label,layer,tag){
  if(!spec)return false;
  const o={id:'jakarta-v2-'+(++serial),type:'sprite',name:label,
   asset:spec.file,assetSource:spec.source,assetPublished:true,
   x,z,y:0,rotation:0,scale:1,layer,subtype:spec.id,
   collision:spec.collision!==false,blocking:spec.collision===false?'no':'auto',
   replaceable:true,tags:['jakarta-city','dense-v2',tag],
   interactions:[],notes:'Editable native pipeline asset in Jakarta City.'};
  style.normalize(o,catalog);schema.normalize(o,catalog,style);
  if(style.reason(o,city.objects,city.map,catalog))return false;
  city.objects.push(o);added++;return true;
 }
 function addBuilding(x,z,zone){
  const source=zone==='housing'?categories.housing:zone==='retail'?categories.retail:categories.offices;
  const spec=source.length?source[Math.floor(random()*source.length)]:null;
  if(spec)return addSprite(spec,x,z,zone==='housing'?'Rumah / Kos Jakarta':zone==='retail'?'Ruko / Warung Jakarta':'Gedung Jakarta','structure',zone);
  // Clear labelled editable fallback when native artwork is unavailable.
  const widths=zone==='housing'?[2.5,3,3.2]:zone==='retail'?[3,3.5,4]:[4,5,5.5];
  const w=widths[Math.floor(random()*widths.length)],d=zone==='offices'?4:2.8;
  const o={id:'jakarta-v2-'+(++serial),type:zone==='retail'?'shop':'building',
   name:zone==='housing'?'Rumah Jakarta':zone==='retail'?'Ruko Jakarta':'Gedung Jakarta',
   x,z,y:0,w,d,h:zone==='offices'?7+Math.floor(random()*8):zone==='retail'?4+Math.floor(random()*4):3+Math.floor(random()*3),
   color:['#bca58f','#c4b8a7','#a5aaa2','#c2a291','#989fa5'][Math.floor(random()*5)],
   scale:1,rotation:0,collision:true,blocking:'auto',layer:'structure',
   subtype:zone,replaceable:true,tags:['jakarta-city','dense-v2','asset-placeholder',zone],
   interactions:['enter'],notes:'Editable building geometry; no confirmed native sprite for this slot.'};
  style.normalize(o,catalog);schema.normalize(o,catalog,style);
  if(style.reason(o,city.objects,city.map,catalog))return false;
  city.objects.push(o);added++;return true;
 }
 // Tight 2.5-tile residential lots, office belts and mixed ruko strips.
 // Deterministic rejection prevents overlapping existing structures/roads/drains.
 for(let r=-5;r<=110;r+=3.5)for(let c=-46;c<=72;c+=3.5){
  if(c<-35&&r<16)continue;
  if(c>=22&&c<=46&&r>=46&&r<=72)continue; // Medan Merdeka
  if(random()<.10)continue;
  const zone=c>45&&r<75?'offices':c<-5&&r>78?'retail':
   (r<17||r>76||c<17)?'housing':random()<.63?'retail':'offices';
  addBuilding(c,r,zone);
 }
 // Urban detail, placed only on valid ground / pavement, never on water or road.
 for(let r=-5;r<=106;r+=5)for(let c=-46;c<=72;c+=6){
  if(random()<.24)continue;
  const group=random()<.53?categories.greenery:categories.utilities;
  if(!group.length)continue;
  const spec=group[Math.floor(random()*group.length)];
  addSprite(spec,c+.25,r+.25,spec.label||spec.id,spec.id.startsWith('semak')?'vegetation':'prop','streetscape');
 }
 // Existing drain-grill assets at discrete safe transition points.
 for(const r of [20,46,76,102])for(let c=-43;c<=68;c+=16){
  const spec=categories.drain.find(x=>/grill/.test(x.id))||categories.drain[0];
  if(spec&&tile(c,r)==='sidewalk')addSprite(spec,c+.5,r+.5,'Grill Selokan','prop','drain');
 }
 city.map.preset='jakarta-city-central-v2';
 city.map.notes+=' Version 2: finer 3.5-tile urban infill, riverbank, open roadside drains, native props, and dense compact blocks.';
 city.map.densityAdditions=added;
 city.map.presetObjectCount=city.objects.length;

 return city;
}
g.VLJakartaCity={create};
})(window);
