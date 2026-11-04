/* Virtual Life · reference-inspired editable city.
 * The supplied image is a composition reference, NOT a background overlay.
 * Every lot, road, park tile and prop stays independently editable.
 */
(function(g){
'use strict';
function create(base,catalog,style,schema){
 const city=JSON.parse(JSON.stringify(base));
 city.format='virtual-life-world-builder-v1';
 city.version=6;
 city.schema='virtual-life-ai-map-v3';
 city.map={...city.map,
  name:'Reference City · Isometric Town',
  unbounded:true,
  worldBounds:{minX:-48,maxX:76,minZ:-8,maxZ:105},
  road:{z0:42,z1:46},
  notes:'Reference-inspired town with hospital, church, civic center, central park, mixed shops, jail, garage, residential blocks and industrial district. Buildings are editable placeholder prefabs, not original extracted art.',
  preset:'reference-city-v1',
  landmarks:{townCenter:{c:32,r:59},hospital:{c:-21,r:31},civic:{c:32,r:31},industry:{c:60,r:88}}
 };
 const tileMap=new Map(),objects=[],errors=[];
 const key=(c,r)=>c+','+r,paint=(c,r,type,extra={})=>{
  tileMap.set(key(c,r),{c,r,type,...(type==='road'?{roadClass:'two_lane'}:{}),...extra});
 };
 const b=city.map.worldBounds;
 const horizontal=[[16,19],[42,45],[72,75],[98,101]];
 const vertical=[[-34,-31],[-10,-7],[18,21],[46,49],[71,74]];
 const isRoad=(c,r)=>horizontal.some(([a,z])=>r>=a&&r<=z)||
  vertical.some(([a,z])=>c>=a&&c<=z);
 for(let r=b.minZ;r<b.maxZ;r++)for(let c=b.minX;c<b.maxX;c++){
  if(isRoad(c,r)){
   // Kebon Sirih 2026 streetscape: parts of the main road use concrete
   // rigid-pavement repair, with quieter asphalt on connecting streets.
   const rigid=(r>=42&&r<=45&&c>-12&&c<48)||
    (c>=18&&c<=21&&r>40&&r<81);
   paint(c,r,'road',rigid?{surface:'concrete'}:{});
  }
 }
 // Continuous sidewalks follow roads at a one-tile margin.
 for(let r=b.minZ;r<b.maxZ;r++)for(let c=b.minX;c<b.maxX;c++){
  if(isRoad(c,r))continue;
  if([[1,0],[-1,0],[0,1],[0,-1]].some(([dc,dr])=>isRoad(c+dc,r+dr)))
   paint(c,r,'sidewalk');
 }
 // North-west lakeshore and forest.
 for(let r=-8;r<14;r++)for(let c=-48;c<-35;c++){
  const u=(c+45)/11,v=(r-0)/12;
  if(u*u+v*v<1.05)paint(c,r,'water');
 }
 // Central public park, cross-shaped footpaths and twin fountains.
 for(let r=47;r<71;r++)for(let c=23;c<45;c++){
  const edge=(c===23||c===44||r===47||r===70);
  const cross=(Math.abs(c-33)<=1)||(Math.abs(r-59)<=1);
  const circle=(c-33.5)**2+(r-59)**2<13;
  if(edge||cross||circle)paint(c,r,'plaza');
  else tileMap.delete(key(c,r));
  if(((c-29.5)**2/10+(r-54.5)**2/7<1) ||
     ((c-38)**2/8+(r-64)**2/7<1))paint(c,r,'water');
 }
 // Paved service yards and parking areas, distinct from traffic roads.
 for(const [x0,x1,z0,z1] of [[-45,-36,80,96],[-30,-11,79,97],[51,69,77,97],
   [-30,-12,21,39],[-5,16,49,71]]){
  for(let r=z0;r<=z1;r++)for(let c=x0;c<=x1;c++){
   if(!isRoad(c,r)&&!['water','plaza'].includes(tileMap.get(key(c,r))?.type))
    paint(c,r,'plaza');
  }
 }
 // Paths around the civic facilities.
 for(let c=24;c<=43;c++)for(let r=21;r<=40;r++)
  if((c===24||c===43||r===21||r===40)&&!isRoad(c,r))paint(c,r,'sidewalk');
 city.map.terrain={default:'grass',cells:[...tileMap.values()].sort((x,y)=>x.r-y.r||x.c-y.c)};
 const colors={
  hospital:'#c9af8f',civic:'#b8a994',church:'#b9c5d1',police:'#b4bcc3',
  school:'#d9b28b',office:'#8da7bd',bank:'#c5b7a0',jail:'#a7afbb',
  factory:'#8d8984',warehouse:'#b0ae9e',store:'#c58c6c',shop:'#d29b70',
  house:'#bdaba0',cafe:'#daaf91',service:'#b9a993',hotel:'#c9aa84',
  residential:'#b8bbce',fire:'#cf8772',library:'#c5c0aa'
 };
 const slug=s=>s.replace(/[^a-z0-9_-]/gi,'-').toLowerCase();
 function place(o){
  style.normalize(o,catalog);schema.normalize(o,catalog,style);
  const collision=style.reason(o,objects,city.map,catalog);
  if(collision){errors.push(o.id+' : '+collision);return false;}
  objects.push(o);return true;
 }
 function building(id,name,x,z,w,d,h,subtype='office',options={}){
  const type=options.shop?'shop':'building';
  const o={id:'ref-'+slug(id),name,type,x,z,y:0,rotation:0,scale:1,
   w,d,h,color:options.color||colors[subtype]||colors.office,
   sizeClass:w>=12||d>=11?'large':w>=7||d>=7?'medium':'small',
   replaceable:true,collision:true,blocking:'auto',layer:'structure',
   subtype,tags:['reference-city',subtype,'replaceable'],
   interactions:['enter'],capacity:options.capacity||1,
   entranceFacing:'',notes:'Reference-inspired editable building placeholder; swap with published game artwork later.'};
  return place(o);
 }
 // Important civic landmarks.
 building('hospital','HOSPITAL',-21,30,17,14,17,'hospital');
 building('church','Church / Community Hall',7,30,12,14,10,'church');
 building('city-hall','City Hall',33,30,16,13,10,'civic');
 building('civic-annex','Civic Administration',60,30,15,12,9,'civic');
 building('clock-tower','CLOCK TOWER',59,58,13,12,15,'civic');
 building('jail','JAIL / POLICE',7,59,15,16,9,'jail');
 building('police','Police Office',-20,59,15,13,9,'police');
 building('gas-station','Gas Station',-42,59,10,11,4,'service');
 building('central-library','Public Library',-20,87,16,12,8,'library');
 building('market','Supermarket',7,87,16,13,7,'store');
 building('factory','FACTORY',60,87,17,15,10,'factory');
 building('warehouse','Warehouse',34,87,17,13,6,'warehouse');
 building('school','SCHOOL',-20,4,17,12,8,'school');
 building('hotel','HOTEL',7,4,14,11,13,'hotel');
 building('commerce','Commercial Center',33,5,17,12,8,'store');
 building('housing-office','Apartment Tower',59,4,14,12,13,'residential');
 // Clusters of colored midrise buildings around the edges of the major blocks.
 const cluster=[
  ['north-row-a','Book Shop',-42,29,8,9,5,'shop',1],
  ['north-row-b','Corner Cafe',-42,38,8,6,4,'cafe',1],
  ['north-row-c','Community Office',-21,13,13,4,5,'office',0],
  ['row-west-a','Three Story Shop',-42,83,9,10,9,'store',1],
  ['row-west-b','Old Town Store',-42,93,8,8,8,'store',1],
  ['south-west-a','Coffee Shop',-20,105,8,5,4,'cafe',1],
  ['south-west-b','Retail Shop',-3,105,7,5,5,'shop',1],
  ['south-central-a','Bakery',31,105,7,5,5,'cafe',1],
  ['south-central-b','Shophouse',41,105,7,5,7,'shop',1],
  ['south-east-a','Corner Store',59,105,8,5,7,'shop',1],
  ['east-center-a','Orange Apartment',59,68,10,5,12,'residential',0],
  ['east-center-b','Office Block',59,48,10,4,8,'office',0],
  ['west-center-a','Town Shops',-42,50,9,5,5,'shop',1],
  ['east-north-a','Pharmacy',59,39,9,4,5,'store',1],
  ['north-mid-a','Town Home',7,12,9,5,6,'house',0],
  ['north-mid-b','Small Office',33,14,9,4,6,'office',0]
 ];
 for(const [id,name,x,z,w,d,h,kind,shop] of cluster)
  building(id,name,x,z,w,d,h,kind,{shop:!!shop});
 // Small residential / retail lots in open side parcels, seeded and deterministic.
 let seed=907145;
 const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const infill=[
  [-45,-36,-3,12],[-29,-12,-5,12],[-4,15,-5,12],[24,43,-5,12],[51,69,-5,12],
  [-45,-36,23,39],[-28,-11,23,39],[-5,16,23,39],[25,43,23,39],[51,69,23,39],
  [-45,-36,49,68],[-28,-11,49,68],[-5,16,49,69],[51,69,49,69],
  [-45,-36,79,96],[-28,-11,79,96],[-5,16,79,96],[24,43,79,96],[51,69,79,96]
 ];
 let count=0;
 for(const [minX,maxX,minR,maxR] of infill){
  for(let r=minR+3;r<=maxR-3;r+=7)
   for(let c=minX+3;c<=maxX-3;c+=7){
    if(rnd()<.22)continue;
    const small=rnd()<.57,w=small?3:5,d=small?3:5;
    const kind=['house','shop','residential','store','office'][Math.floor(rnd()*5)];
    const h=small?2.9+rnd()*2.8:5+rnd()*5;
    if(building('infill-'+count,'Town '+(kind==='shop'?'Shop':kind==='house'?'House':kind==='office'?'Office':'Building')+' '+(count+1),
     c,r,w,d,Math.round(h*10)/10,kind,{shop:kind==='shop',color:[
      '#d09b85','#9fb5c3','#bfa4a0','#e0c99e','#aaad9a','#b8adb9'
     ][Math.floor(rnd()*6)]}))count++;
   }
 }
 // Secondary shophouse grid enriches smaller parcels without moving landmarks.
 // Density comes from valid 3×3 lots rather than drawing non-editable facades.
 for(let r=-5;r<=109;r+=6){
  for(let c=-45;c<=69;c+=6){
   if(c<-35&&r<15)continue; // preserve lake/forest land
   if(c>=22&&c<=45&&r>=46&&r<=71)continue; // preserve park
   if(rnd()<.27)continue;
   const subtype=['house','store','office','residential','cafe'][Math.floor(rnd()*5)];
   const height=Math.round((3.3+rnd()*5.5)*10)/10;
   building('infill-extra-'+count,'Town '+(subtype==='house'?'House':subtype==='store'?'Store':subtype==='office'?'Office':subtype==='cafe'?'Cafe':'Apartment')+' '+(count+1),
    c,r,3,3,height,subtype,{shop:subtype==='store'||subtype==='cafe',
    color:['#d3ad8a','#d1b9a2','#aab5c9','#c39d92','#b5bcaa'][Math.floor(rnd()*5)]});
   count++;
  }
 }
 // Landmark park props and vegetation, all editable individual plane sprites.
 let propSerial=0;
 function prop(type,x,z,name,options={}){
  const o={id:'ref-prop-'+(++propSerial),type,name,x,z,y:0,
   rotation:0,scale:1,collision:true,replaceable:true,
   subtype:type==='tree'?'tree':type,layer:type==='tree'?'vegetation':'prop',
   tags:['reference-city',options.tag||'street'],interactions:options.actions||[]};
  return place(o);
 }
 // Tree canopy inside the park; paths and water remain visible.
 for(let r=49;r<69;r+=4)for(let c=25;c<44;c+=4){
  if(Math.abs(c-33)<4||Math.abs(r-59)<3)continue;
  if(rnd()<.83)prop('tree',c+.2,r+.2,'Town Park Tree',{tag:'park'});
 }
 for(const [x,z] of [[26,51],[40,52],[26,66],[41,66],[29,62],[37,54]]){
  prop('bench',x,z,'Park Bench',{tag:'park',actions:['sit']});
 }
 for(const [x,z] of [[24.8,50],[43,50],[24.8,68],[43,68]]){
  prop('lamp',x,z,'Park Lamp',{tag:'park'});
 }
 // Streetscape: every block has a few lights and shade trees.
 for(let c=-43;c<72;c+=12){
  for(const r of [21,47,77,102]){
   if(rnd()<.87)prop('lamp',c+.5,r+.4,'Street Lamp');
  }
 }
 for(const r of [-3,9,24,35,50,64,81,92]){
  for(let c=-45;c<72;c+=12){
   if(rnd()<.6)prop('tree',c+.5,r+.5,'Street Tree');
  }
 }
 // Dense forest in north west parkland with open lake.
 for(let r=-5;r<14;r+=3)for(let c=-47;c<-36;c+=3){
  if(tileMap.get(key(c,r))?.type==='water')continue;
  if(rnd()<.85)prop('tree',c,r,'Forest Tree',{tag:'forest'});
 }
 // Nonblocking logic annotations are authoring data only.
 const markers=[
  {id:'ref-town-spawn',name:'Town Player Spawn',markerKind:'spawn',x:-4,z:73,subtype:'spawn'},
  {id:'ref-hospital-entry',name:'Hospital Main Entrance',markerKind:'entrance',x:-20,z:40,subtype:'hospital'},
  {id:'ref-park-point',name:'Park Gathering Point',markerKind:'interaction',x:33,z:59,subtype:'town_park'},
  {id:'ref-market-entry',name:'Shopping District Entrance',markerKind:'entrance',x:7,z:97,subtype:'market'}
 ];
 for(const p of markers)place({...p,type:'marker',y:0,rotation:0,scale:1,collision:false,
  layer:'marker',tags:['reference-city','logic-proposal'],notes:'Candidate only; gameplay logic not connected.'});
 // An editable, real v6b character makes Camera to Character available
 // immediately on new reference maps. Walking remains preview-only.
 place({
  id:'ref-player-preview',type:'avatar',name:'Player · Camera Preview',
  x:-4.5,z:70.5,y:0,rotation:0,scale:1,facing:'sw',
  variant:'pipeline-v6b',profile:'ichsan',collision:true,
  layer:'character',subtype:'player',tags:['reference-city','camera-preview','player'],
  interactions:[],notes:'Editable character spawn for camera-follow and Walk Test. No multiplayer player entity.'
 });
 // Editable ambient traffic: all movement uses the authored surfaces.
 const ambient=[
  ['vehicle','sedan_red',-2.5,43.5,4],
  ['vehicle','sedan_teal',34.5,73.5,4],
  ['vehicle','bus_transjakarta',9.5,18.5,2.7],
  ['vehicle','gojek',34.5,99.5,4.8],
  ['vehicle','taxi_bluebird',58.5,43.5,3.5],
  ['pedestrian','ichsan',-3.5,41.5,1.4],
  ['pedestrian','noor',35.5,41.5,1.5],
  ['pedestrian','nadia',-3.5,76.5,1.3],
  ['crowd','mixed',31.5,76.5,1.25],
  ['quest_npc','manusia_silver',-5.5,46.5,0],
  ['quest_npc','pak_ogah',27.5,46.5,0],
  ['quest_npc','kang_parkir',-27.5,41.5,0],
  ['quest_npc','babeh_pemilik',54.5,76.5,0]
 ];
 for(let i=0;i<ambient.length;i++){
  const [kind,variant,x,z,speed]=ambient[i];
  const o={
   id:'ref-ambient-'+i,type:kind,name:kind==='vehicle'?
    (g.VLSemestaCatalog?.vehicle(variant)?.label||variant):
    kind==='quest_npc'?(g.VLSemestaCatalog?.quest(variant)?.label||variant):
    kind==='crowd'?'Crowd / Town Center':'Walker / '+variant,
   x,z,y:0,rotation:0,scale:1,
   vehicleId:kind==='vehicle'?variant:undefined,
   questId:kind==='quest_npc'?variant:undefined,
   profile:kind==='pedestrian'?variant:'ichsan',
   jobId:kind==='quest_npc'?({
    manusia_silver:'street_performer',pak_ogah:'traffic_assistant',
    kang_parkir:'parking_attendant',babeh_pemilik:'flea_market_trade'
   }[variant]||'community_job'):undefined,
   collision:kind==='quest_npc',
   blocking:kind==='quest_npc'?'auto':'no',
   motion:{mode:kind==='vehicle'?'road':kind==='quest_npc'?'idle':'sidewalk',
    speed:speed||1.5,direction:'auto',count:5,enabled:true,
    idleAction:kind==='quest_npc'?(g.VLSemestaCatalog?.quest(variant)?.defaultAction||'idle'):'idle'},
   tags:['semesta','reference-city','loop-preview'],
   notes:'Automated preview only; no game AI/network behavior.'
  };
  place(o);
 }
 city.objects=objects;
 city.map.presetObjectCount=objects.length;
 city.map.presetWarnings=errors.length;
 city.map.presetBounds={...b};
 city.map.draftReady=true;
 return city;
}
g.VLReferenceCity=Object.freeze({create,version:'reference-city-v1'});
})(window);
