'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const R=path.join(__dirname,'..');
const Interiors=require(path.join(R,'world-builder/njh-play-interiors.js'));
const Life=require(path.join(R,'jiwa/life-economy.js'));

const DIR=path.join(R,'world-builder/njh-play-interiors');
const MAP_INT=path.join(R,'world-builder/njh-map-preview/interiors');
const catalog=JSON.parse(fs.readFileSync(path.join(DIR,'catalog.json'),'utf8'));
const kos=JSON.parse(fs.readFileSync(path.join(DIR,'njh_kos.interior-scene.json'),'utf8'));
const warteg=JSON.parse(fs.readFileSync(path.join(DIR,'njh_warung_makan.interior-scene.json'),'utf8'));
const laundry=JSON.parse(fs.readFileSync(path.join(MAP_INT,'njh_laundry.interior-scene.json'),'utf8'));
const pecel=JSON.parse(fs.readFileSync(path.join(MAP_INT,'njh_pecel_lele_tenda.interior-scene.json'),'utf8'));

function THREE(){
 class Vec{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}}
 class Object3D{
  constructor(){this.children=[];this.parent=null;this.name='';this.visible=true;this.position=new Vec();this.rotation=new Vec();this.userData={};}
  add(ch){this.children.push(ch);ch.parent=this;return this;}
  remove(ch){this.children=this.children.filter(c=>c!==ch);if(ch.parent===this)ch.parent=null;return this;}
  traverse(fn){fn(this);for(const c of this.children)c.traverse(fn);}
 }
 class Mesh extends Object3D{constructor(geometry,material){super();this.geometry=geometry;this.material=material;}}
 class Group extends Object3D{}
 class PlaneGeometry{constructor(){this.type='PlaneGeometry';}dispose(){this.disposed=true;}}
 class BoxGeometry{constructor(){this.type='BoxGeometry';}dispose(){this.disposed=true;}}
 class MeshBasicMaterial{constructor(opts){Object.assign(this,opts||{});}dispose(){this.disposed=true;}}
 class Texture{constructor(){this.needsUpdate=false;}dispose(){this.disposed=true;}}
 return {Group,Mesh,PlaneGeometry,BoxGeometry,MeshBasicMaterial,Texture,DoubleSide:2,NearestFilter:1003,SRGBColorSpace:'srgb'};
}

function kit(opts={}){
 const T=THREE();
 const scene=new T.Group();scene.name='world';
 const world={objects:opts.objects||[]};
 const roots=new Map();
 let state=opts.state||Life.stateFrom({
  wallet:20000,energy:80,hygiene:75,bladder:20,fullness:50,moral:50,
  furniture:[],housing:{room:!!opts.room,fridge:false}
 },Life.defaults());
 let pos=opts.pos||{x:0,y:0,z:0};
 const api=Interiors.create({
  THREE:T,scene,catalog,scenes:opts.scenes||{njh_kos:kos,njh_warung_makan:warteg,njh_laundry:laundry},
  getWorld:()=>world,getState:()=>state,persist:()=>{},
  getPos:()=>pos,teleport:(x,z)=>{pos={x,y:0,z};return true;},
  message:()=>{},playerObjectId:()=>'player',
  getRoots:()=>[...roots.entries()].map(([id,root])=>({id,root})),
  onAddObject:o=>{const g=new T.Group();g.name=o.name;g.userData.itemId=o.id;roots.set(o.id,g);scene.add(g);}
 });
 for(const o of world.objects){
  const g=new T.Group();g.name=o.name;g.userData.itemId=o.id;roots.set(o.id,g);scene.add(g);
 }
 api.wireWorld(world);
 return {api,world,get pos(){return pos;},set pos(v){pos=v;},get state(){return state;}};
}

function loadPreview(){
 const window={
  VLAssetCatalog:[],
  location:{search:'?njhMap=1',href:'http://127.0.0.1:8802/world-builder/?njhMap=1'},
  document:{getElementsByTagName:()=>[{src:'http://127.0.0.1:8802/world-builder/njh-map-preview.js'}]}
 };
 const context=vm.createContext({window,globalThis:window,URLSearchParams,Object,Math,Number,Array,JSON,Error,Map,Set});
 vm.runInContext(fs.readFileSync(path.join(R,'world-builder/njh-map-preview.js'),'utf8'),context,{filename:'njh-map-preview.js'});
 return window.VLNjhMapPreview;
}

test('Kali ripple is not hooked as a terrain tile; river uses the main terrain PNG',()=>{
 const src=fs.readFileSync(path.join(R,'world-builder/njh-map-preview.js'),'utf8');
 assert.doesNotMatch(src,/\bRIPPLE\b/);
 assert.doesNotMatch(src,/sheet_8x1\.png/);
 assert.doesNotMatch(src,/ellen-env-r1\/animations\/water_sw/);
 assert.match(src,/terrain\/'?\+leaf/);
});

test('PREVIEW_REF points at main, not the preview branch',()=>{
 const src=fs.readFileSync(path.join(R,'world-builder/indonesia-assets.js'),'utf8');
 const g={};
 vm.runInNewContext(src,{window:g,fetch:async()=>({ok:false,status:404,json:async()=>({})}),console:{warn(){}}});
 assert.equal(g.VLIndonesiaAssets.PREVIEW_REF,'main');
 assert.match(g.VLIndonesiaAssets.base,/\/virtual-life-asset-pipeline\/main\/$/);
 assert.doesNotMatch(src,/preview\/njh-sync-decisions-20261122/);
});

test('Mainkan E opens a READY public interior that is not Warteg/Kost/Mart',()=>{
 const wrapped=Interiors.wrapInterior(laundry);
 const h=kit({
  pos:{x:10,z:11.1},
  objects:[{id:'laundry-1',type:'sprite',name:'Laundry Kiloan',x:10,z:10,enterable:true,
   njhInteriorTemplate:'njh_laundry',njhInteriorPending:false,
   njhDoors:[{doorId:'njh_door_laundry',template:'njh_laundry',pending:false,
    interior:wrapped,use:{x:10,z:11.1}}]}]
 });
 const door=h.api.nearestDoor();
 assert.ok(door,'READY laundry door must be found');
 assert.equal(door.closed,false);
 const r=h.api.enterNearby();
 assert.equal(r.ok,true,r.reason||'enterNearby should open laundry');
 assert.equal(r.roomId,'njh_laundry');
 assert.equal(r.kind,'public');
});

test('Locked / pending doors are Belum buka on E and in isClosedDoor',()=>{
 const P=loadPreview();
 const locked={id:'toko-tutup',name:'Toko Tutup',x:4,z:4,enterable:true,njhInteriorPending:true,
  njhDoors:[{doorId:'d-locked',pending:true,use:{x:4,z:5}}]};
 assert.equal(P.isClosedDoor(locked),true);
 const near=P.closedDoorsNear([locked],4,5,2);
 assert.ok(near.length>=1);
 assert.equal(near[0].reason,'Belum buka');

 const h=kit({
  pos:{x:4,z:5},
  objects:[locked]
 });
 const r=h.api.enterNearby();
 assert.equal(r.ok,false);
 assert.equal(r.closed,true);
 assert.equal(r.reason,'Belum buka');
});

test('Enterable buildings with no READY interior are closed (tooltip/E toast)',()=>{
 const P=loadPreview();
 const bare={id:'mystery-shop',name:'Warung Belum Jadi',x:1,z:1,enterable:true};
 assert.equal(P.isClosedDoor(bare),true);
 const house={id:'ref-infill-extra-168',name:'Rumah warga 09',x:-48.5,z:49.4,interactions:['enter']};
 assert.equal(P.isClosedDoor(house),true);
 const h=kit({pos:{x:-48.5,z:49.4},objects:[house]});
 const r=h.api.enterNearby();
 assert.equal(r.ok,false);
 assert.equal(r.closed,true);
 assert.equal(r.reason,'Belum buka');
});

test('Plastic benches keep their own art mapping, not wooden_bench',()=>{
 const src=fs.readFileSync(path.join(R,'world-builder/bangun-ruang/interior-model.js'),'utf8');
 assert.match(src,/plastic_bench_red:\{[^}]*visualAs:'plastic_bench_red'/);
 assert.match(src,/plastic_bench_blue:\{[^}]*visualAs:'plastic_bench_blue'/);
 assert.doesNotMatch(src,/plastic_bench_(?:red|blue):\{[^}]*visualAs:'wooden_bench'/);
 const items=pecel.items.filter(i=>/plastic_bench/.test(i.assetId||''));
 assert.ok(items.length>=2,'pecel lele scene still authors plastic benches');
 for(const it of items){
  const typ=(catalog.items||catalog)[it.assetId];
  assert.ok(typ&&(typ.sw||typ.se),'catalog has '+it.assetId);
  const file=(typ.sw||typ.se).file;
  assert.match(file,/furniture-plastic_bench_/);
  assert.doesNotMatch(file,/wooden_bench/);
 }
});

test('Bayar kos (sekali bayar, permanen) is the real UI string; docs are not doubled',()=>{
 const files=[
  'mainkan/njh98-mock.js',
  'world-builder/semesta-life-hooks.js',
  'world-builder/semesta-life-play.js'
 ];
 for(const rel of files){
  const t=fs.readFileSync(path.join(R,rel),'utf8');
  assert.match(t,/Bayar kos \(sekali bayar, permanen\)/,rel);
  assert.doesNotMatch(t,/Sewa kamar di Kost/,rel);
  assert.doesNotMatch(t,/Sewa sekali bayar/,rel);
  assert.doesNotMatch(t,/>Sewa Kamar</,rel);
 }
 const docs=fs.readFileSync(path.join(R,'docs/LOGIC-STATUS.md'),'utf8');
 assert.doesNotMatch(docs,/Bayar kos \(sekali bayar, permanen\) \(sekali bayar\)/);
 assert.match(docs,/Bayar kos \(sekali bayar, permanen\)/);
});

test('LGR script cache-bust is no longer bare pakaian-v2',()=>{
 const gen=fs.readFileSync(path.join(R,'shared/genesis-player.js'),'utf8');
 assert.match(gen,/\?v=pakaian-v2-njh-newbot-fix-20261122/);
 assert.doesNotMatch(gen,/\/virtual-life-asset-pipeline\/"[^"]*\?v=pakaian-v2"/);
 const builder=fs.readFileSync(path.join(R,'world-builder/builder.js'),'utf8');
 assert.match(builder,/genesis-player\.js\?v=njh-step1-lock-r7-20261122/);
});

test('this fix is sw v42 with a unique ?v and hub build',()=>{
 const sw=fs.readFileSync(path.join(R,'sw.js'),'utf8');
 // Later preview packages (balancing = v44) bump the SW; this fix's v42 stays in the history.
 assert.ok(Number((/^\/\* sw v(\d+) /.exec(sw)||[])[1])>=42,'sw >= v42');
 assert.match(sw,/sw v42 2026-11-22/);
 assert.doesNotMatch(sw,/^\/\* sw v39 /);
 const html=fs.readFileSync(path.join(R,'mainkan/index.html'),'utf8');
 assert.match(html,/\?v=njh-step1-lock-r7-20261122/);
 const hub=JSON.parse(fs.readFileSync(path.join(R,'shared/hub-version.json'),'utf8'));
 assert.equal(hub.build,'hub-20261122-step1-lock-r7');
});
