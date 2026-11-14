'use strict';
// Run: node --test tests/njh-map-preview.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {test}=require('node:test');

const root=path.resolve(__dirname,'..','world-builder');
function loadPreview(search='?njhMap=1'){
 const window={
  VLAssetCatalog:[],
  location:{search,href:'http://127.0.0.1:8802/world-builder/'+search},
  document:{getElementsByTagName:()=>[{src:'http://127.0.0.1:8802/world-builder/njh-map-preview.js'}]}
 };
 const context=vm.createContext({window,globalThis:window,URLSearchParams,Object,Math,Number,Array,JSON,Error,Map,Set});
 vm.runInContext(fs.readFileSync(path.join(root,'njh-map-preview.js'),'utf8'),context,{filename:'njh-map-preview.js'});
 return {window,api:window.VLNjhMapPreview};
}
function loadPhysics(){
 const window={};
 const context=vm.createContext({window,globalThis:window});
 for(const name of ['style-rules.js','map-terrain.js','world-physics.js']){
  vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),context,{filename:name});
 }
 return {style:window.VLWorldStyle,physics:window.VLWorldPhysics};
}

test('NJH map module is enabled by default and inert only with njhMap=0',()=>{
 const on=loadPreview('');
 assert.equal(on.api.enabled(),true);
 assert.equal(on.api.registerCatalog().count,9);
 const off=loadPreview('?njhMap=0');
 assert.equal(off.api.enabled(),false);
 assert.equal(off.api.registerCatalog().count,0);
});

test('isNjhDocument accepts the official NJH city and rejects Jakarta leftovers',()=>{
 const {api}=loadPreview('');
 const official=JSON.parse(require('fs').readFileSync(require('path').join(root,'njh-map-preview/city/njh-semesta-map-draft1.with-pending-assets.city.json'),'utf8'));
 assert.equal(api.isNjhDocument(official,official.id),true);
 assert.equal(api.isNjhDocument({id:'city-mw54pfac-iq6xof',name:'Jakarta City',document:{map:{name:'Jakarta City'},objects:[]}}),false);
 assert.equal(api.isNjhDocument({map:{name:'NJH · Kampung Kali Kebon Sirih (draft1)'},objects:[]}),true);
});

test('registers 9 corrected catalog keys when njhMap=1',()=>{
 const {window,api}=loadPreview('?njhMap=1');
 assert.equal(api.enabled(),true);
 const result=api.registerCatalog();
 assert.equal(result.count,9);
 const files=window.VLAssetCatalog.map(x=>x.file);
 for(const key of [
  'object:njh_dermaga_mancing','object:njh_lapak_silver','object:njh_tiang_ogah',
  'object:njh_kotak_amal','object:njh_penanda_doa','object:njh_kost_cove',
  'studio:br-warung-pecel-lele','studio:br-lapak-sate-madura',
  'object:njh_minimarket'
 ])assert.ok(files.includes(key),key);
 const cove=window.VLAssetCatalog.find(x=>x.id==='njh_kost_cove');
 assert.equal(JSON.stringify(cove.footprint),'[5.5,4.6]');
 assert.equal(cove.collision,true);
 assert.equal(cove.sizeClass,'medium');
 assert.equal(cove.levelCount,2);
 assert.equal(cove.placement,'ground');
 assert.equal(JSON.stringify(cove.variants.sw.pivot),'[159,272]');
 assert.equal(JSON.stringify(cove.variants.se.pivot),'[160,270]');
 const guessed=Object.keys(api.keyMap);
 assert.deepEqual(guessed.sort(),[
  'object:obj-njh-dermaga-mancing','object:obj-njh-kotak-amal',
  'object:obj-njh-lapak-silver','object:obj-njh-penanda-doa',
  'object:obj-njh-tiang-ogah',
  'studio:br-lapak-sate-madura','studio:br-warung-pecel-lele'
 ].sort());
 const dermaga=window.VLAssetCatalog.find(x=>x.id==='njh_dermaga_mancing');
 assert.equal(dermaga.rotateFootprint,true);
 assert.equal(JSON.stringify(dermaga.footprint),'[2,1]');
 assert.equal(dermaga.source,'njh-preview');
 assert.ok(dermaga.variants.nw.url.includes('njh_dermaga_mancing_nw.png'));
});

test('city file uses real keys and is bounded; 6 interiors exist',()=>{
 const city=JSON.parse(fs.readFileSync(path.join(root,'njh-map-preview/city/njh-semesta-map-draft1.with-pending-assets.city.json'),'utf8'));
 const doc=city.record.document;
 const assets=doc.objects.filter(o=>o.type==='sprite').map(o=>o.asset);
 assert.ok(assets.includes('object:njh_dermaga_mancing'));
 assert.ok(!assets.includes('object:obj-njh-dermaga-mancing'));
 assert.ok(assets.includes('studio:br-warung-pecel-lele'));
 assert.ok(assets.includes('object:njh_kost_cove'));
 assert.equal(doc.map.unbounded,false);
 assert.deepEqual(doc.map.worldBounds,{minX:-57,maxX:-5,minZ:14,maxZ:77});
 const scenes=['njh_kos','njh_warung_makan','njh_wc_mandi_umum','njh_rumah_biasa','njh_laundry','njh_bengkel'];
 for(const id of scenes){
  const scene=JSON.parse(fs.readFileSync(path.join(root,'njh-map-preview/interiors',id+'.interior-scene.json'),'utf8'));
  assert.equal(scene.id,id);
  assert.ok(Array.isArray(scene.items)&&scene.items.length>0);
 }
 const wc=JSON.parse(fs.readFileSync(path.join(root,'njh-map-preview/interiors/njh_wc_mandi_umum.interior-scene.json'),'utf8'));
 assert.ok(wc.items.some(i=>i.assetId==='sekat_wc'));
});

test('wires ready interiors and pre-wires pending r6 doors with use tiles',()=>{
 const {api}=loadPreview('?njhMap=1');
 const city=JSON.parse(fs.readFileSync(path.join(root,'njh-map-preview/city/njh-semesta-map-draft1.with-pending-assets.city.json'),'utf8'));
 const meta=JSON.parse(fs.readFileSync(path.join(root,'njh-map-preview/njh-map-meta.json'),'utf8'));
 const interiors={};
 for(const id of api.readyTemplates){
  interiors[id]=JSON.parse(fs.readFileSync(path.join(root,'njh-map-preview/interiors',id+'.interior-scene.json'),'utf8'));
 }
 const document=city.record.document;
 const report=api.wireDoors(document,meta,interiors);
 assert.equal(report.missingObject.length,0);
 assert.equal(report.noInterior.length,0);
 const wired=Object.fromEntries(report.wired.map(r=>[r.doorId,r.template]));
 assert.deepEqual(wired,{
  njh_door_laundry:'njh_laundry',
  njh_door_warung_makan:'njh_warung_makan',
  njh_door_kos_cove_lobby:'njh_kos_cove_lobby',
  njh_door_rumah_biasa:'njh_rumah_biasa',
  njh_door_bengkel:'njh_bengkel',
  njh_door_wc_umum:'njh_wc_mandi_umum',
  njh_door_warung_kopi:'njh_warung_kopi',
  njh_door_minimarket:'njh_minimarket'
 });
 const pending=Object.fromEntries(report.pending.map(r=>[r.doorId,r.template]));
 assert.deepEqual(pending,{
  njh_door_tenda_pecel_lele:'njh_pecel_lele_tenda',
  njh_door_tenda_sate_madura:'njh_sate_madura_tenda',
  njh_door_mushola:'njh_mushola',
  njh_door_koperasi:'njh_koperasi',
  njh_door_loak:'njh_toko_loak',
  njh_door_warung_madura:'njh_warung_madura',
  njh_door_nasi_sunda:'njh_nasi_sunda'
 });
 for(const row of report.pending){
  const obj=document.objects.find(o=>o.id===row.objectId);
  assert.equal(obj.enterable,true);
  assert.equal(obj.njhInteriorPending,true);
  assert.equal(obj.interior,null);
  assert.equal(obj.njhInteriorTemplate,row.template);
  assert.deepEqual([obj.njhUsePoint.x,obj.njhUsePoint.z],row.usePoint);
 }
 // Aliases still resolve if a kit string sneaks back in.
 assert.equal(api.resolveTemplate('bangun-ruang kit in br-warung-pecel-lele.json'),'njh_pecel_lele_tenda');
 const near=api.nearestEnterable(document.objects,-26.25,71.5,1.25);
 assert.equal(near.o.id,'njh-kos-noor');
 assert.equal(near.anchor.doorId,'njh_door_kos_cove_lobby');
 assert.equal(near.anchor.template,'njh_kos_cove_lobby');
 assert.ok(near.distance<0.01);
 const oldIchsanStreet=api.nearestEnterable(document.objects,-28.25,71.5,1.25);
 assert.equal(oldIchsanStreet,null);
 assert.equal(api.resolveTemplate('njh_kos'),'njh_kos_noor');
 const tent=api.nearestEnterable(document.objects,-25.0,38.5,1.25);
 assert.equal(tent.o.id,'njh-tenda-pecel-lele');
 assert.equal(tent.o.njhInteriorPending,true);
 const far=api.nearestEnterable(document.objects,-26.25,71.5-3,1.25);
 assert.equal(far,null);
 const kos=document.objects.find(o=>o.id==='njh-kos-noor');
 const centerDist=Math.hypot((-26.25)-kos.x,(71.5)-kos.z);
 assert.ok(centerDist>2.1, 'Kos Noor use point is farther than 2.1 from centre ('+centerDist+')');
});

test('spawns and homes resolve per test player',()=>{
 const {api}=loadPreview('?njhMap=1');
 const meta=JSON.parse(fs.readFileSync(path.join(root,'njh-map-preview/njh-map-meta.json'),'utf8'));
 const ichsan=api.resolveSpawn('t_ichsan',meta);
 assert.equal(ichsan.kind,'home');
 assert.equal(ichsan.point.x,-26.25);
 assert.equal(ichsan.point.z,71.5);
 assert.equal(ichsan.point.template,'njh_kos_ichsan');
 const noor=api.resolveSpawn('t_noor',meta);
 assert.equal(noor.kind,'home');
 assert.deepEqual([noor.point.x,noor.point.z],[-26.25,71.5]);
 assert.equal(noor.point.template,'njh_kos_noor');
 const g1=api.resolveSpawn('guest1',meta);
 assert.equal(g1.kind,'plaza');
 assert.equal(g1.point.id,'njh_spawn_3');
 const g2=api.resolveSpawn('guest2',meta);
 assert.equal(g2.point.id,'njh_spawn_4');
});


test('kost rooms use bathtub+shower, a cookable kitchen, and a lobby-first door',()=>{
 const rootInteriors=path.join(root,'njh-map-preview/interiors');
 const lobby=JSON.parse(fs.readFileSync(path.join(rootInteriors,'njh_kos_cove_lobby.interior-scene.json'),'utf8'));
 assert.equal(lobby.id,'njh_kos_cove_lobby');
 const roomDoors=Object.fromEntries(lobby.doors.filter(d=>d.role==='room').map(d=>[d.id,d]));
 assert.equal(roomDoors.njh_door_home_ichsan.interiorTemplate,'njh_kos_ichsan');
 assert.equal(roomDoors.njh_door_home_noor.interiorTemplate,'njh_kos_noor');
 assert.equal(roomDoors.njh_door_cove_room_1.state,'locked');
 const streetExit=lobby.doors.find(d=>d.role==='exit');
 assert.equal(streetExit.streetDoorId,'njh_door_kos_cove_lobby');
 assert.equal(streetExit.exitTo,'street');
 for(const id of ['njh_kos_ichsan','njh_kos_noor','njh_kos']){
  const scene=JSON.parse(fs.readFileSync(path.join(rootInteriors,id+'.interior-scene.json'),'utf8'));
  const types=scene.items.map(i=>i.assetId);
  assert.ok(types.includes('bathtub'),id+' needs bathtub');
  assert.ok(types.includes('shower'),id+' needs shower');
  assert.ok(!types.includes('water_tub'),id+' must not use bak+gayung');
  assert.ok(types.includes('fridge')&&types.includes('wardrobe')&&types.includes('stove')&&types.includes('kitchen_sink'),id+' needs kitchen+storage');
  const by=Object.fromEntries(scene.items.map(i=>[i.assetId,i]));
  const owner=id==='njh_kos_ichsan'?'ichsan':'noor';
  assert.equal(by.fridge.access,'owner_only');
  assert.equal(by.wardrobe.access,'owner_only');
  assert.equal(by.stove.access,'owner_only');
  assert.equal(by.kitchen_sink.access,'owner_only');
  assert.equal(by.bed.access,'shared_partner');
  assert.equal(by.bathtub.access,'shared_partner');
  assert.equal(by.shower.access,'shared_partner');
  assert.equal(by.fridge.actionId,'open');
  assert.equal(by.wardrobe.actionId,'open');
  assert.equal(by.stove.actionId,'cook');
  assert.equal(by.kitchen_sink.actionId,'wash');
  assert.ok(by.fridge.tags.includes('open_fridge'));
  assert.ok(by.wardrobe.tags.includes('open_storage'));
  assert.ok(by.stove.tags.includes('cook'));
  assert.equal(by.fridge.ownerId,owner);
  const exit=scene.doors.find(d=>d.role==='exit');
  assert.equal(exit.exitTo,'njh_kos_cove_lobby');
 }
});

test('physics blocks walking off a bounded map; unbounded maps stay free',()=>{
 const {style,physics}=loadPhysics();
 const catalog=new Map();
 const player={id:'player',type:'avatar',x:-6,z:30,rotation:0,scale:1,collision:true};
 const bounded={unbounded:false,worldBounds:{minX:-57,maxX:-5,minZ:14,maxZ:77},terrain:{default:'grass',cells:[]}};
 const inside=physics.check(player,{x:-10,z:30},[],bounded,catalog,style);
 assert.equal(inside.ok,true);
 const out=physics.check(player,{x:-4.5,z:30},[],bounded,catalog,style);
 assert.equal(out.ok,false);
 assert.equal(out.reason,'bounds');
 const south=physics.check(player,{x:-20,z:77.2},[],bounded,catalog,style);
 assert.equal(south.ok,false);
 const unbounded={unbounded:true,worldBounds:bounded.worldBounds,terrain:{default:'grass',cells:[]}};
 const free=physics.check(player,{x:100,z:30},[],unbounded,catalog,style);
 assert.equal(free.ok,true);
 const moved=physics.move(player,{x:-6,z:30},4,0,[],bounded,catalog,style);
 assert.ok(moved.x<=-5-0.325+1e-6); // half of 0.65 box stays inside maxX=-5
 assert.equal(moved.blocked,true);
});

test('dermaga 270 rotation swaps the 2x1 footprint; dock edge stays clear of objects',()=>{
 const {style}=loadPhysics();
 const {window,api}=loadPreview('?njhMap=1');
 api.registerCatalog();
 const spec=window.VLAssetCatalog.find(x=>x.id==='njh_dermaga_mancing');
 const catalog=new Map([[spec.file,spec]]);
 const dock={id:'njh-dermaga-mancing',type:'sprite',asset:spec.file,x:-51.5,z:44,rotation:270,scale:1};
 assert.equal(JSON.stringify(style.footprint(dock,catalog)),'[1,2]');
 const upright={...dock,rotation:0};
 assert.equal(JSON.stringify(style.footprint(upright,catalog)),'[2,1]');
 const city=JSON.parse(fs.readFileSync(path.join(root,'njh-map-preview/city/njh-semesta-map-draft1.with-pending-assets.city.json'),'utf8'));
 const meta=JSON.parse(fs.readFileSync(path.join(root,'njh-map-preview/njh-map-meta.json'),'utf8'));
 const fish=meta.interactables.find(x=>x.id==='njh_dermaga_mancing');
 const tiles=fish.waterSideTiles;
 assert.ok(Array.isArray(tiles)&&tiles.length>=1);
 for(const [c,r] of tiles){
  const hit=city.record.document.objects.find(o=>{
   if(o.type==='marker')return false;
   const w=Number(o.w)||1,d=Number(o.d)||1;
   return Math.abs(o.x-(c+0.5))<w/2 && Math.abs(o.z-(r+0.5))<d/2;
  });
  assert.equal(hit,undefined,'water-side tile '+c+','+r+' should stay object-free');
 }
 // Footprint stays on the Kali bank (sidewalk), never grass or mid-river.
 // min-corner (-52,43) 1x2 at rot 270: cells c=-52, r=43 and r=44.
 const cells=new Map(city.record.document.map.terrain.cells.map(c=>[c.c+','+c.r,c.type]));
 for(const [c,r] of [[-52,43],[-52,44]]){
  const type=cells.get(c+','+r)||'grass';
  assert.equal(type,'sidewalk','dock bank tile '+c+','+r+' should be sidewalk, got '+type);
 }
 for(const [c,r] of tiles){
  const type=cells.get(c+','+r)||'grass';
  assert.equal(type,'river','water-side tile '+c+','+r+' should be river in the authored city, got '+type);
 }
 // Preview only: Jakarta "river" paints as Water so the Kali reads as water, not a gray canal.
 assert.equal(api.visualTerrainType('river'),'water');
 assert.equal(api.visualTerrainType('water'),'water');
 assert.equal(api.visualTerrainType('drain'),'drain');
 assert.equal(api.visualTerrainType('sidewalk'),'sidewalk');
 const bank=new Map([
  ['-57,44','sidewalk'],['-56,44','river'],['-53,44','river'],
  ['-52,44','sidewalk'],['-51,44','sidewalk'],['-50,44','sidewalk']
 ]);
 assert.equal(api.previewTile('river',{c:-53,r:44},bank),'water');
 assert.equal(api.previewTile('sidewalk',{c:-52,r:44},bank),'sidewalk_edge_w');
 assert.equal(api.previewTile('sidewalk',{c:-51,r:44},bank),'sidewalk');
 assert.equal(api.previewTile('sidewalk',{c:-57,r:44},bank),'sidewalk_edge_e');
 assert.equal(api.previewTile('sidewalk',{c:-50,r:44},bank),'sidewalk');
 const offset=api.applyDermagaOverhang(city.record.document);
 assert.equal(JSON.stringify(offset),JSON.stringify({x:-0.8,z:0}));
 const placed=city.record.document.objects.find(o=>o.id==='njh-dermaga-mancing');
 assert.equal(placed.x,-51.5);
 assert.equal(placed.z,44);
 assert.equal(JSON.stringify(placed.njhDrawOffset),JSON.stringify({x:-0.8,z:0}));
 // Footprint / collision stay on the bank. The draw offset is visual only.
 assert.equal(JSON.stringify(style.footprint(placed,catalog)),'[1,2]');
});

test('bangku taman scale and collision match the LFB guide',()=>{
 const window={VLAssetCatalog:[]};
 const context=vm.createContext({window,globalThis:window,Object,Math,Number,Array,JSON,Error,Map,Set});
 vm.runInContext(fs.readFileSync(path.join(root,'pipeline-catalog.js'),'utf8'),context,{filename:'pipeline-catalog.js'});
 const {style,physics}=loadPhysics();
 const catalog=new Map(window.VLAssetCatalog.map(x=>[x.file,x]));
 const spec=catalog.get('pipeline:bangku_taman');
 assert.ok(spec,'bangku_taman must be in the pipeline catalog');
 assert.equal(JSON.stringify(spec.footprint),'[2,1]');
 assert.equal(spec.collision,true);
 const PX=Math.SQRT2/64,PY=PX*2/Math.sqrt(3);
 assert.equal(spec.width,Math.round(spec.size[0]*PX*1000)/1000);
 assert.equal(spec.height,Math.round(spec.size[1]*PY*1000)/1000);
 // Billboard height stays below a 1-storey wall (2.27 wu) and near character scale.
 assert.ok(spec.height>1.2&&spec.height<2.1,'height '+spec.height);
 assert.notEqual(spec.width,2.19);
 assert.notEqual(spec.height,2.251);

 const city=JSON.parse(fs.readFileSync(path.join(root,'njh-map-preview/city/njh-semesta-map-draft1.with-pending-assets.city.json'),'utf8'));
 const objects=city.record.document.objects;
 const benches=objects.filter(o=>{
  const blob=[o.id,o.asset,o.name,o.subtype].map(v=>String(v||'').toLowerCase()).join(' ');
  return o.asset==='pipeline:bangku_taman'||/bangku[_\s-]?taman|park.?bench|kursi[_\s-]?taman/.test(blob);
 });
 assert.ok(benches.length>=1,'expected at least one park bench instance');
 const ids=benches.map(o=>o.id);
 assert.ok(ids.includes('njh-atm-16'));

 const cells=new Map(city.record.document.map.terrain.cells.map(c=>[c.c+','+c.r,c.type]));
 const defaultTerrain=city.record.document.map.terrain.default||'grass';
 const blockedSurface=new Set(['road','water','river','drain']);
 const solids=objects.filter(o=>o.collision!==false&&o.blocking!=='no'&&
  !['marker','avatar','npc','pedestrian','crowd','quest_npc'].includes(o.type));

 for(const bench of benches){
  assert.equal(bench.asset,'pipeline:bangku_taman');
  assert.equal(bench.scale,1);
  assert.equal(bench.width,spec.width);
  assert.equal(bench.height,spec.height);
  assert.equal(bench.collision,true);
  assert.notEqual(bench.blocking,'no');
  assert.ok((bench.interactions||[]).includes('sit'));
  assert.equal(JSON.stringify(style.footprint(bench,catalog)),'[2,1]');
  assert.equal(physics.solid(bench),true);

  const [fw,fd]=style.footprint(bench,catalog);
  const rot=((Number(bench.rotation)||0)%360+360)%360;
  // Front / sit side is local +r, rotation 0 = sw.
  const use={x:bench.x,z:bench.z+fd/2+0.5};
  if(rot===90){use.x=bench.x+fw/2+0.5;use.z=bench.z;}
  else if(rot===180){use.x=bench.x;use.z=bench.z-fd/2-0.5;}
  else if(rot===270){use.x=bench.x-fw/2-0.5;use.z=bench.z;}
  const useC=Math.floor(use.x),useR=Math.floor(use.z);
  const useType=cells.get(useC+','+useR)||defaultTerrain;
  assert.ok(!blockedSurface.has(useType),'sit tile '+useC+','+useR+' is '+useType);

  // Bench itself must not sit on road/water, and must not overlap another solid.
  const box=physics.area(bench,catalog,style);
  const footprintCells=[];
  for(let c=Math.floor(box.minX);c<Math.ceil(box.maxX);c++)
   for(let r=Math.floor(box.minZ);r<Math.ceil(box.maxZ);r++)
    footprintCells.push([c,r]);
  for(const [c,r] of footprintCells){
   const type=cells.get(c+','+r)||defaultTerrain;
   assert.ok(!blockedSurface.has(type),'bench '+bench.id+' covers '+type+' at '+c+','+r);
  }
  const sitter={id:'sitter-'+bench.id,type:'avatar',x:use.x,z:use.z,scale:1,collision:true};
  const sitBox=physics.area(sitter,catalog,style);
  for(const other of solids){
   if(other.id===bench.id)continue;
   const hit=physics.intersect(box,physics.area(other,catalog,style));
   assert.equal(hit,false,'bench '+bench.id+' overlaps '+other.id);
   assert.equal(physics.intersect(sitBox,physics.area(other,catalog,style)),false,
    'sit tile of '+bench.id+' overlaps '+other.id);
  }

  // A player walking through the bench centre must be blocked; the sit tile stays free.
  const player={id:'player',type:'avatar',x:bench.x,z:bench.z-fd/2-0.7,rotation:0,scale:1,collision:true};
  const through=physics.move(player,{x:player.x,z:player.z},0,fd+1.2,objects,city.record.document.map,catalog,style,new Map());
  assert.equal(through.blocked,true,'player must not clip through '+bench.id);
  assert.ok(through.z<bench.z,'walk should stop before the bench centre');
  const sitCheck=physics.check(sitter,{x:use.x,z:use.z},objects,city.record.document.map,catalog,style,new Map());
  assert.equal(sitCheck.ok,true,'sit tile in front of '+bench.id+' must stay free, got '+sitCheck.reason+' '+sitCheck.id);
 }
});

test('places NJH Mart on a free 5x4 main-road lot with a sidewalk use tile',()=>{
 const {window,api}=loadPreview('?njhMap=1');
 const {style,physics}=loadPhysics();
 const city=JSON.parse(fs.readFileSync(path.join(root,'njh-map-preview/city/njh-semesta-map-draft1.with-pending-assets.city.json'),'utf8'));
 const meta=JSON.parse(fs.readFileSync(path.join(root,'njh-map-preview/njh-map-meta.json'),'utf8'));
 const document=city.record.document;
 api.registerCatalog();
 const pipeWin={VLAssetCatalog:Array.from(window.VLAssetCatalog||[])};
 const context=vm.createContext({window:pipeWin,globalThis:pipeWin,Object,Math,Number,Array,JSON,Error,Map,Set});
 vm.runInContext(fs.readFileSync(path.join(root,'pipeline-catalog.js'),'utf8'),context,{filename:'pipeline-catalog.js'});
 const catalog=new Map(pipeWin.VLAssetCatalog.map(x=>[x.file,x]));
 const PX=Math.SQRT2/64;
 const PY=PX*2/Math.sqrt(3);

 const spec=catalog.get('object:njh_minimarket');
 assert.ok(spec,'catalog has object:njh_minimarket');
 assert.equal(spec.source,'njh-preview');
 assert.equal(spec.njhPreview,true);
 assert.equal(spec.sizeClass,'medium');
 assert.equal(spec.authoredH,6.2);
 assert.equal(spec.levelCount,1);
 assert.equal(spec.placement,'ground');
 assert.equal(spec.collision,true);
 assert.equal(spec.blocking,'yes');
 assert.equal(JSON.stringify(spec.footprint),'[5,4]');
 assert.equal(JSON.stringify(spec.size),'[312,314]');
 assert.equal(JSON.stringify(spec.pivot),'[171,300]');
 assert.equal(spec.width,+(312*PX).toFixed(3));
 assert.equal(spec.height,+(314*PY).toFixed(3));
 assert.equal(spec.width,6.894);
 assert.equal(spec.height,8.012);
 assert.ok(spec.variants.sw.url.includes('buildings/njh_minimarket/njh_minimarket_sw.png'));
 assert.ok(spec.variants.se.url.includes('njh_minimarket_se.png'));
 assert.ok(spec.variants.ne.url.includes('njh_minimarket_ne.png'));
 assert.ok(spec.variants.nw.url.includes('njh_minimarket_nw.png'));
 assert.equal(JSON.stringify(spec.variants.se.pivot),'[139,300]');
 assert.equal(JSON.stringify(spec.variants.nw.pivot),'[139,300]');
 // Billboard must use the LFB PX/PY lock, never size/50 (logged past mistake).
 assert.notEqual(spec.width,+(312/50).toFixed(3));

 const shop=document.objects.find(o=>o.id==='njh-minimarket');
 assert.ok(shop);
 assert.equal(shop.name,'NJH Mart (Minimarket)');
 assert.equal(shop.asset,'object:njh_minimarket');
 assert.equal(shop.subtype,'minimarket');
 assert.equal(shop.x,-26.5);
 assert.equal(shop.z,56);
 assert.equal(shop.rotation,0);
 assert.equal(shop.width,6.894);
 assert.equal(shop.height,8.012);
 assert.equal(shop.w,5);
 assert.equal(shop.d,4);
 assert.equal(shop.h,6.2);
 assert.equal(shop.collision,true);
 assert.equal(shop.blocking,'yes');
 assert.ok(shop.tags.includes('minimarket'));
 assert.ok(shop.tags.includes('shop'));
 assert.ok(shop.tags.includes('njh-door:njh_door_minimarket'));
 assert.ok(!shop.tags.includes('supermarket'),'supermarket tag would be a later site-name hazard');
 const blob=[shop.name,shop.label,shop.asset,shop.subtype,(shop.tags||[]).join(' ')].join(' ').toLowerCase();
 assert.equal(/warung|warteg|nasi|kopi|cafe|loak|kost|cove|masjid|sampah|trash|pohon|tree|mancing|pasar.?ikan|fish.?market/.test(blob),false);

 const fp=style.footprint(shop,catalog);
 assert.equal(JSON.stringify(fp),'[5,4]');
 const area=physics.area(shop,catalog,style);
 assert.equal(area.minX,-29);
 assert.equal(area.maxX,-24);
 assert.equal(area.minZ,54);
 assert.equal(area.maxZ,58);
 assert.equal(physics.solid(shop),true);

 const cells=new Map(document.map.terrain.cells.map(c=>[c.c+','+c.r,c.type]));
 const typ=(c,r)=>cells.get(c+','+r)||document.map.terrain.default||'grass';
 for(const c of [-29,-28,-27,-26,-25]){
  for(const r of [54,55,56,57]){
   assert.equal(typ(c,r),'grass','lot tile '+c+','+r);
  }
 }
 assert.equal(typ(-27,58),'sidewalk','use tile must be sidewalk');
 assert.equal(typ(-30,58),'sidewalk','N–S main-road sidewalk stays clear');
 for(const r of [54,55,56,57])assert.equal(typ(-30,r),'sidewalk');

 const door=meta.doors.find(d=>d.doorId==='njh_door_minimarket');
 assert.ok(door);
 assert.equal(door.objectId,'njh-minimarket');
 assert.equal(door.interiorTemplate,'njh_minimarket');
 assert.equal(door.facing,'sw');
 assert.equal(door.interiorPending,false);
 assert.deepEqual(door.doorPoint,[-26.5,58]);
 assert.deepEqual(door.useTile,[-27,58]);
 assert.deepEqual(door.usePoint,[-26.5,58.5]);
 assert.deepEqual(door.footprintRect,[-29,-24,54,58]);
 // Step 2: Gerak's shelf-fixed scene is vendored and the door is ready.
 assert.ok(fs.existsSync(path.join(root,'njh-map-preview/interiors/njh_minimarket.interior-scene.json')));
 assert.ok(!api.pendingTemplates.includes('njh_minimarket'));
 assert.ok(api.readyTemplates.includes('njh_minimarket'));

 const report=api.wireDoors(document,meta,{});
 assert.equal(report.missingObject.length,0);
 const pending=report.pending.find(r=>r.doorId==='njh_door_minimarket');
 assert.ok(pending);
 assert.equal(pending.template,'njh_minimarket');
 assert.equal(shop.enterable,true);
 assert.equal(shop.njhInteriorPending,true);
 assert.equal(shop.interior,null);
 assert.equal(shop.njhInteriorTemplate,'njh_minimarket');
 assert.deepEqual([shop.njhUsePoint.x,shop.njhUsePoint.z],[-26.5,58.5]);

 const solids=document.objects.filter(o=>physics.solid(o)&&
  !['marker','avatar','npc','pedestrian','crowd','quest_npc'].includes(o.type));
 for(const other of solids){
  if(other.id==='njh-minimarket')continue;
  assert.equal(physics.intersect(area,physics.area(other,catalog,style)),false,'overlap with '+other.id);
 }
 const sitter={id:'minimarket-use',type:'avatar',x:-26.5,z:58.5,scale:1,collision:true};
 const useCheck=physics.check(sitter,{x:-26.5,z:58.5},document.objects,document.map,catalog,style,new Map());
 assert.equal(useCheck.ok,true,'player can stand on the door use tile, got '+useCheck.reason+' '+useCheck.id);
 const pathWalker={id:'ns-sidewalk',type:'avatar',x:-29.5,z:56,scale:1,collision:true};
 const pathCheck=physics.check(pathWalker,{x:-29.5,z:56},document.objects,document.map,catalog,style,new Map());
 assert.equal(pathCheck.ok,true,'N–S sidewalk path stays clear, got '+pathCheck.reason+' '+pathCheck.id);

 const bench=document.objects.find(o=>o.id==='njh-atm-16');
 assert.equal(bench.x,-22.5);
 assert.equal(bench.z,55.9);
 const sit={id:'bench-sit',type:'avatar',x:-22.5,z:56.9,scale:1,collision:true};
 assert.equal(typ(-23,56),'grass');
 const sitCheck=physics.check(sit,{x:-22.5,z:56.9},document.objects,document.map,catalog,style,new Map());
 assert.equal(sitCheck.ok,true,'nudged bench still has a free sit tile, got '+sitCheck.reason+' '+sitCheck.id);
 const pole=document.objects.find(o=>o.id==='njh-atm-15');
 assert.equal(pole.x,-22);
 assert.equal(pole.z,58.5);
 const papan=document.objects.find(o=>o.id==='njh-atm-17');
 assert.equal(papan.x,-21.2);
 assert.equal(papan.z,54.5);

 const kost=document.objects.find(o=>o.id==='njh-kos-noor');
 const dock=document.objects.find(o=>o.id==='njh-dermaga-mancing');
 const dKost=Math.hypot(shop.x-kost.x,shop.z-kost.z);
 const dDock=Math.hypot(shop.x-dock.x,shop.z-dock.z);
 assert.ok(dKost<20,'should be a short walk to Kost Cove, got '+dKost);
 assert.ok(dDock<35,'should be a walkable trip to the dock, got '+dDock);
});

test('step-2 fishing spot on the Kali bank: dock collision, water stays water, reachable use tile',()=>{
 const {window,api}=loadPreview('?njhMap=1');
 const {style,physics}=loadPhysics();
 api.registerCatalog();
 const pipeWin={VLAssetCatalog:Array.from(window.VLAssetCatalog||[])};
 const context=vm.createContext({window:pipeWin,globalThis:pipeWin,Object,Math,Number,Array,JSON,Error,Map,Set});
 vm.runInContext(fs.readFileSync(path.join(root,'pipeline-catalog.js'),'utf8'),context,{filename:'pipeline-catalog.js'});
 const catalog=new Map(pipeWin.VLAssetCatalog.map(x=>[x.file,x]));
 const city=JSON.parse(fs.readFileSync(path.join(root,'njh-map-preview/city/njh-semesta-map-draft1.with-pending-assets.city.json'),'utf8'));
 const meta=JSON.parse(fs.readFileSync(path.join(root,'njh-map-preview/njh-map-meta.json'),'utf8'));
 const document=city.record.document;
 const objects=document.objects;
 const map=Object.assign({},document.map,{unbounded:false,worldBounds:document.map.worldBounds});
 const cells=new Map(document.map.terrain.cells.map(c=>[c.c+','+c.r,c.type]));

 const site=meta.gameplaySites.fishing_spot;
 assert.equal(site.siteId,'fishing_spot');
 assert.equal(site.spotId,'njh-fishing-spot-kali-selatan');
 assert.equal(site.action,'fish');
 // HOOKS-STEP2 §4 fishSpots(): id/name/asset match, spot x/z, fishStart range 2.5.
 assert.equal(site.id,site.spotId);
 assert.equal(site.source,'world');
 assert.ok(/dermaga|mancing|fishing|pier/i.test(site.spotId));
 const row=meta.interactables.find(x=>x.id==='fishing_spot');
 assert.equal(row.objectId,site.objectId);
 assert.equal(row.kind,'fish');

 const spot=objects.find(o=>o.id===site.objectId);
 assert.ok(spot,'fishing spot object exists');
 assert.equal(spot.asset,'object:njh_dermaga_mancing');
 assert.equal(spot.rotation,270);
 assert.equal(spot.collision,true);
 assert.equal(spot.blocking,'yes');
 assert.ok(spot.interactions.includes('fish'));
 assert.ok(/mancing/i.test(spot.name));
 assert.equal(physics.solid(spot),true);
 assert.equal(JSON.stringify(style.footprint(spot,catalog)),'[1,2]');
 const box=physics.area(spot,catalog,style);
 assert.deepEqual([box.minX,box.maxX,box.minZ,box.maxZ],[-52,-51,67,69]);
 for(const [c,r] of row.footprintTiles)assert.equal(cells.get(c+','+r),'sidewalk','deck on the bank '+c+','+r);
 for(const [c,r] of site.waterTiles){
  assert.equal(cells.get(c+','+r),'river','water tile '+c+','+r);
  const swim=physics.check({id:'p',type:'avatar',x:0,z:0,scale:1,collision:true},{x:c+0.5,z:r+0.5},objects,map,catalog,style,new Map());
  assert.equal(swim.ok,false,'water tile must not be walkable');
 }
 // The dock itself blocks walking.
 const onDeck=physics.check({id:'p',type:'avatar',x:0,z:0,scale:1,collision:true},{x:-51.5,z:68},objects,map,catalog,style,new Map());
 assert.equal(onDeck.ok,false);

 // Use tile: walkable bank / jalan inspeksi, adjacent to the deck, no object.
 const [uc,ur]=site.useTile;
 assert.equal(cells.get(uc+','+ur),'sidewalk');
 assert.equal(uc,box.maxX,'use tile is directly +c of the deck');
 const stand=physics.check({id:'p',type:'avatar',x:0,z:0,scale:1,collision:true},{x:site.usePoint[0],z:site.usePoint[1]},objects,map,catalog,style,new Map());
 assert.equal(stand.ok,true,'use point must be standable, got '+stand.reason+' '+stand.id);
 assert.equal(spot.x,site.x);assert.equal(spot.z,site.z);
 assert.ok(Math.hypot(site.usePoint[0]-spot.x,site.usePoint[1]-spot.z)<2.5,'use point within fishStart range 2.5');

 // Path: the c=-51 jalan inspeksi stays walkable from the r=63/64 gang to the r=71 gang.
 for(let z=63.5;z<=71.5;z+=0.5){
  const p=physics.check({id:'p',type:'avatar',x:0,z:0,scale:1,collision:true},{x:-50.5,z},objects,map,catalog,style,new Map());
  assert.equal(p.ok,true,'inspection path blocked at -50.5,'+z+' by '+p.reason+' '+p.id);
 }
 // No door use tile / use point is covered by the dock.
 for(const d of meta.doors){
  const [x,z]=d.usePoint;
  assert.ok(!(x>=box.minX&&x<=box.maxX&&z>=box.minZ&&z<=box.maxZ),'dock covers door '+d.doorId);
 }
 // Every dock instance overhangs toward the river.
 api.applyDermagaOverhang(document);
 assert.deepEqual(JSON.parse(JSON.stringify(spot.njhDrawOffset)),{x:-0.8,z:0});
 assert.deepEqual(JSON.parse(JSON.stringify(objects.find(o=>o.id==='njh-dermaga-mancing').njhDrawOffset)),{x:-0.8,z:0});
 // Play.js 'fish' still resolves first to the original dock anchor (no site hijack).
 const fishRe=/sungai|river|danau|kolam|fishing|mancing/i;
 const first=objects.find(o=>fishRe.test([o.name,o.label,o.asset,o.subtype,o.questId,(o.tags||[]).join(' ')].join(' ')));
 assert.equal(first.id,'njh-dermaga-mancing-anchor');
});
