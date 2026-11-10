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

test('preview module is inert without njhMap=1',()=>{
 const {api}=loadPreview('');
 assert.equal(api.enabled(),false);
 assert.equal(api.registerCatalog().count,0);
});

test('registers 7 corrected catalog keys when njhMap=1',()=>{
 const {window,api}=loadPreview('?njhMap=1');
 assert.equal(api.enabled(),true);
 const result=api.registerCatalog();
 assert.equal(result.count,7);
 const files=window.VLAssetCatalog.map(x=>x.file);
 for(const key of [
  'object:njh_dermaga_mancing','object:njh_lapak_silver','object:njh_tiang_ogah',
  'object:njh_kotak_amal','object:njh_penanda_doa',
  'studio:br-warung-pecel-lele','studio:br-lapak-sate-madura'
 ])assert.ok(files.includes(key),key);
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
  njh_door_home_ichsan:'njh_rumah_biasa',
  njh_door_bengkel:'njh_bengkel',
  njh_door_wc_umum:'njh_wc_mandi_umum',
  njh_door_home_noor:'njh_kos'
 });
 const pending=Object.fromEntries(report.pending.map(r=>[r.doorId,r.template]));
 assert.deepEqual(pending,{
  njh_door_tenda_pecel_lele:'njh_pecel_lele_tenda',
  njh_door_tenda_sate_madura:'njh_sate_madura_tenda',
  njh_door_mushola:'njh_mushola',
  njh_door_koperasi:'njh_koperasi',
  njh_door_loak:'njh_toko_loak',
  njh_door_warung_madura:'njh_warung_madura',
  njh_door_warung_kopi:'njh_warung_kopi',
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
 assert.ok(near.distance<0.01);
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
 assert.equal(ichsan.point.x,-45.5);
 assert.equal(ichsan.point.z,57.5);
 const noor=api.resolveSpawn('t_noor',meta);
 assert.equal(noor.kind,'home');
 assert.deepEqual([noor.point.x,noor.point.z],[-26.25,71.5]);
 const g1=api.resolveSpawn('guest1',meta);
 assert.equal(g1.kind,'plaza');
 assert.equal(g1.point.id,'njh_spawn_3');
 const g2=api.resolveSpawn('guest2',meta);
 assert.equal(g2.point.id,'njh_spawn_4');
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
  assert.equal(type,'river','water-side tile '+c+','+r+' should be river, got '+type);
 }
});
