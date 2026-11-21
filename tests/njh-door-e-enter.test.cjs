'use strict';
// E on an official building door must enter the interior, even when a site
// stub (shop/eat/buy_room) sits closer on the building origin. Live 30135b6
// toast was "Aksi belum didukung: shop" at NJH Mart; enterNearby() already worked.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const R=path.join(__dirname,'..');
const Interiors=require(path.join(R,'world-builder/njh-play-interiors.js'));
const Life=require(path.join(R,'jiwa/life-economy.js'));

const DIR=path.join(R,'world-builder/njh-play-interiors');
const catalog=JSON.parse(fs.readFileSync(path.join(DIR,'catalog.json'),'utf8'));
const kharisma=JSON.parse(fs.readFileSync(path.join(DIR,'njh_warteg_kharisma.interior-scene.json'),'utf8'));
const wartegFallback=JSON.parse(fs.readFileSync(path.join(DIR,'njh_warung_makan.interior-scene.json'),'utf8'));
const mart=JSON.parse(fs.readFileSync(path.join(DIR,'njh_minimarket.interior-scene.json'),'utf8'));
const lobby=JSON.parse(fs.readFileSync(path.join(DIR,'njh_kos_cove_lobby.interior-scene.json'),'utf8'));
const kos=JSON.parse(fs.readFileSync(path.join(DIR,'njh_kos.interior-scene.json'),'utf8'));

// Minimarket walls bake to a canvas; Node tests have no document.
if(typeof globalThis.document==='undefined'){
 const ctx={fillRect(){},fillStyle:'',imageSmoothingEnabled:false,clearRect(){},fillText(){}};
 globalThis.document={createElement(tag){return tag==='canvas'?{width:64,height:128,getContext:()=>ctx}:{};}};
}


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
 class CanvasTexture extends Texture{constructor(c){super();this.canvas=c;}}
 return {Group,Mesh,PlaneGeometry,BoxGeometry,MeshBasicMaterial,Texture,CanvasTexture,DoubleSide:2,NearestFilter:1003,SRGBColorSpace:'srgb'};
}

function doorObj({id,name,asset,x,z,template,doorId,use}){
 return {
  id,type:'sprite',asset,name,x,z,d:3,
  njhInteriorTemplate:template,
  njhDoors:[{doorId,template,pending:false,use,usePoint:[use.x,use.z]}]
 };
}

function boot(){
 const T=THREE();
 const scene=new T.Group();scene.name='world';
 const messages=[];
 const objects=[
  doorObj({id:'njh-minimarket',name:'NJH Mart (Minimarket)',asset:'pipeline:minimarket',
   x:0,z:0,template:'njh_minimarket',doorId:'njh_door_minimarket',use:{x:0,z:2}}),
  doorObj({id:'jakarta-v3-18446',name:'Warteg (warung makan)',asset:'pipeline:id_warteg_sederhana',
   x:20,z:0,template:'njh_warung_makan',doorId:'njh_door_warung_makan',use:{x:20,z:2}}),
  doorObj({id:'njh-kos-noor',name:'Kost Cove (lobi)',asset:'pipeline:kos_cove',
   x:40,z:0,template:'njh_kos_cove_lobby',doorId:'njh_door_kos_cove_lobby',use:{x:40,z:2}})
 ];
 const world={objects};
 const roots=new Map();
 let state=Life.stateFrom({wallet:15000,energy:80,hygiene:50,bladder:20,fullness:50,moral:50,housing:{room:false}},Life.defaults());
 let pos={x:0,y:0,z:0};
 const interiors=Interiors.create({
  THREE:T,scene,catalog,
  scenes:{njh_warteg_kharisma:kharisma,njh_warung_makan:wartegFallback,njh_minimarket:mart,njh_kos_cove_lobby:lobby,njh_kos:kos},
  getWorld:()=>world,getState:()=>state,persist:()=>{},
  getPos:()=>pos,teleport:(x,z)=>{pos={x,y:0,z};return true;},
  message:m=>messages.push(String(m)),playerObjectId:()=>'player',
  getRoots:()=>[...roots.entries()].map(([id,root])=>({id,root})),
  onAddObject:o=>{const g=new T.Group();g.name=o.name;g.userData.itemId=o.id;roots.set(o.id,g);scene.add(g);}
 });
 for(const o of objects){const g=new T.Group();g.name=o.name;g.userData.itemId=o.id;roots.set(o.id,g);scene.add(g);}
 interiors.wireWorld(world);

 const B=require(path.join(R,'shared/njh-balancing.js'));
 const store=new Map();
 const ls={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
 const el=()=>{const e={hidden:false,style:{},dataset:{},innerHTML:'',textContent:'',children:[],classList:{add(){},remove(){},toggle(){}},
  querySelector:()=>el(),querySelectorAll:()=>[],addEventListener(){},appendChild(c){return c;},setAttribute(){},remove(){},append(){},blur(){},onclick:null};return e;};
 const document={createElement:el,getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],body:el(),head:el(),addEventListener(){}};
 const win={console,localStorage:ls,document,JiwaLifeEconomy:Life,NJHBalancing:B,VLNjhPlayInteriors:interiors,
  location:{href:'http://x/world-builder/index.html'},
  requestAnimationFrame:()=>0,cancelAnimationFrame(){},performance:{now:()=>0},addEventListener(){},dispatchEvent(){},
  CustomEvent:function(t,d){this.type=t;this.detail=d&&d.detail;},
  fetch:()=>Promise.reject(new Error('offline')),setTimeout,clearTimeout,URL};
 win.window=win;win.globalThis=win;win.self=win;
 const ctx=vm.createContext(win);
 vm.runInContext(fs.readFileSync(path.join(R,'world-builder/semesta-life-hooks.js'),'utf8'),ctx);
 vm.runInContext(fs.readFileSync(path.join(R,'world-builder/semesta-life-play.js'),'utf8'),ctx);
 const P=win.SemestaLifePlay;
 P.attach({
  getWorld:()=>world,getPosition:()=>pos,getCityId:()=>'test_city',getPlayerId:()=>'',
  getClock:()=>({snapshot:()=>({minute:390,day:1,speed:1,paused:false}),restore(){}}),
  playPose(){},currentPose:()=>'idle',respawn(){},syncHud(){},teleport:(x,z)=>{pos={x,y:0,z};return true;},
  playInteriors:interiors,message:m=>messages.push(String(m))
 });
 assert.equal(P.start(),true,'play starts');
 return {P,interiors,messages,setPos:(x,z)=>{pos={x,y:0,z};},get pos(){return pos;},
  sites:()=>P.sites?.()||win.SemestaLifePlay.sites?.()||[]};
}

function siteAt(h,id){
 const all=typeof h.P.sites==='function'?h.P.sites():[];
 return all.find(s=>s.id===id);
}

test('E at the official NJH Mart door enters njh_minimarket, even when the shop site is closer than the use-point',()=>{
 const h=boot();
 const shop=siteAt(h,'minimarket');
 assert.ok(shop,'minimarket site exists');
 assert.equal(shop.action,'shop');
 // Stand on the building origin / enterable glint tile: site is at ~ (0,0),
 // official use-point is at z=2. This is the live 30135b6 failure mode.
 h.setPos(0,0);
 const door=h.interiors.nearestDoor();
 assert.ok(door,'Mart door is in enter radius from the official tile');
 const nodeDist=Math.hypot(0-shop.x,0-shop.z);
 assert.ok(door.distance>nodeDist+0.15,'shop site is closer than the use-point (repro)');
 const ok=h.P.handleAction();
 assert.equal(ok,true,'handleAction enters');
 const active=h.interiors.active();
 assert.ok(active,'an interior is open');
 assert.equal(active.roomId||active.template,'njh_minimarket');
 assert.equal(active.kind,'minimarket');
 assert.equal(h.messages.some(m=>/Aksi belum didukung: shop/.test(m)),false,h.messages.join(' | '));
});

test('runAction("shop") at the Mart door also enters instead of rejecting',()=>{
 const h=boot();
 h.setPos(0,0);
 const r=h.P.runAction('shop');
 assert.equal(r.ok,true,r.reason||'shop routes to enter');
 assert.equal(h.interiors.active()?.roomId||h.interiors.active()?.template,'njh_minimarket');
 assert.equal(h.messages.some(m=>/Aksi belum didukung: shop/.test(m)),false,h.messages.join(' | '));
});

test('E at the official Warteg door enters njh_warteg_kharisma + Ibu Warteg, not outdoor eat',()=>{
 const h=boot();
 const warung=siteAt(h,'warung');
 assert.ok(warung,'warteg site exists');
 h.setPos(20,0);
 const ok=h.P.handleAction();
 assert.equal(ok,true);
 const active=h.interiors.active();
 assert.equal(active?.roomId||active?.template,'njh_warteg_kharisma');
 assert.equal(active?.kind,'warteg');
 const furn=active?.furniture||active?.items||[];
 assert.ok(furn.some(f=>f.assetId==='npc_ibu_warteg'||/Ibu Warteg/i.test(String(f.label||f.name||''))),'Ibu Warteg present');
});

test('E at the official Kost Cove door enters the lobby, not buy_room',()=>{
 const h=boot();
 const kost=siteAt(h,'kost');
 assert.ok(kost,'kost site exists');
 h.setPos(40,0);
 const ok=h.P.handleAction();
 assert.equal(ok,true);
 const active=h.interiors.active();
 assert.equal(active?.roomId||active?.template,'njh_kos_cove_lobby');
 assert.equal(active?.kind,'lobby');
});
