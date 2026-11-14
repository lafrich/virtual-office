'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const R=path.join(__dirname,'..');
const Access=require(path.join(R,'world-builder/semesta-room-access.js'));
const Interiors=require(path.join(R,'world-builder/njh-play-interiors.js'));
const DIR=path.join(R,'world-builder/njh-play-interiors');
const BUILDING=JSON.parse(fs.readFileSync(path.join(DIR,'kost-building.json'),'utf8'));
const lobby=JSON.parse(fs.readFileSync(path.join(DIR,'njh_kos_cove_lobby.interior-scene.json'),'utf8'));
const ichsan=JSON.parse(fs.readFileSync(path.join(DIR,'njh_kos_ichsan.interior-scene.json'),'utf8'));
const noor=JSON.parse(fs.readFileSync(path.join(DIR,'njh_kos_noor.interior-scene.json'),'utf8'));
const kos=JSON.parse(fs.readFileSync(path.join(DIR,'njh_kos.interior-scene.json'),'utf8'));

function THREE(){
 class Vec{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}}
 class Object3D{constructor(){this.children=[];this.parent=null;this.name='';this.visible=true;this.position=new Vec();this.rotation=new Vec();this.userData={};}
  add(ch){this.children.push(ch);ch.parent=this;return this;}
  remove(ch){this.children=this.children.filter(c=>c!==ch);if(ch.parent===this)ch.parent=null;return this;}
  traverse(fn){fn(this);for(const c of this.children)c.traverse(fn);}
 }
 class Mesh extends Object3D{constructor(g,m){super();this.geometry=g;this.material=m;}}
 class Group extends Object3D{}
 class PlaneGeometry{constructor(){this.type='PlaneGeometry';}dispose(){this.disposed=true;}}
 class MeshBasicMaterial{constructor(opts){Object.assign(this,opts||{});}dispose(){this.disposed=true;}}
 class Texture{constructor(){this.needsUpdate=false;}dispose(){this.disposed=true;}}
 return {Group,Mesh,PlaneGeometry,MeshBasicMaterial,Texture,DoubleSide:2,NearestFilter:1003,SRGBColorSpace:'srgb'};
}

test('official cove scenes: lobby 10x5 doors/exits, rooms 10x8 owner/partner access',()=>{
 assert.notEqual(kos.id,lobby.id,'generic njh_kos clip fixture stays separate');
 assert.equal(lobby.id,'njh_kos_cove_lobby');
 assert.equal(lobby.width,10);assert.equal(lobby.depth,5);
 assert.equal(lobby.entrance.c,4);assert.equal(lobby.entrance.r,4);
 const doorIds=(lobby.doors||[]).map(d=>d.id);
 assert.ok(doorIds.includes('njh_door_home_ichsan'));
 assert.ok(doorIds.includes('njh_door_home_noor'));
 assert.ok(['njh_door_cove_room_1','njh_door_cove_room_2','njh_door_cove_room_3'].every(id=>doorIds.includes(id)));
 assert.ok((lobby.exits||[]).some(e=>e.id==='njh_door_kos_cove_lobby_exit'&&e.role==='exit'));
 const locked=(lobby.doors||[]).filter(d=>d.state==='locked');
 assert.equal(locked.length,3);
 for(const room of [ichsan,noor]){
  assert.equal(room.width,10);assert.equal(room.depth,8);
  const by=Object.fromEntries((room.items||[]).map(i=>[i.assetId,i]));
  for(const k of ['fridge','wardrobe','stove','kitchen_sink'])assert.equal(by[k].access,'owner_only',k);
  for(const k of ['bed','bathtub','shower','squat_toilet','sink'])assert.equal(by[k].access,'shared_partner',k);
  const portals=[...(room.doors||[]),...(room.exits||[])];
  assert.ok(portals.some(e=>e.role==='exit'||e.exitTo==='njh_kos_cove_lobby'||e.to==='njh_kos_cove_lobby'));
 }
});

test('openInteriorById(njh-kos-noor) opens the lobby; spawn skips lobby into the room',()=>{
 const A=Access.create();
 A.loadBuilding(BUILDING);
 A.setRelationships([{a:'t_ichsan',b:'t_noor',type:'pacaran'}]);
 assert.equal(A.resolveId('njh-kos-noor'),'njh_kos_cove_lobby');
 assert.equal(A.isLobby('njh-kos-noor'),true);
 const T=THREE(),scene=new T.Group();
 let pos={x:-26.25,z:71.5};
 const api=Interiors.create({
  THREE:T,scene,catalog:JSON.parse(fs.readFileSync(path.join(DIR,'catalog.json'),'utf8')),
  scenes:{njh_kos:kos,njh_kos_cove_lobby:lobby,njh_kos_ichsan:ichsan,njh_kos_noor:noor},
  getWorld:()=>({objects:[{id:'njh-kos-noor',type:'sprite',name:'Kost Cove (Ichsan & Noor)',x:-27,z:71,enterable:true}]}),
  getState:()=>({housing:{room:true,roomId:'njh_kos_ichsan',ownerId:'t_ichsan'}}),
  getPos:()=>pos,teleport:(x,z)=>{pos={x,y:0,z};return true;},
  getPlayerId:()=>'t_ichsan',playerId:()=>'t_ichsan',
  message:()=>{},persist:()=>{}
 });
 api.wireWorld({objects:[{id:'njh-kos-noor',type:'sprite',name:'Kost Cove (Ichsan & Noor)',x:-27,z:71,enterable:true}]});
 const lobbyIn=api.openInteriorById('njh-kos-noor');
 assert.equal(lobbyIn.ok,true);
 assert.equal(lobbyIn.kind,'lobby');
 assert.equal(api.roomId(),'njh_kos_cove_lobby');
 const acts=api.extraActions();
 const locked=acts.find(a=>a.args&&a.args.doorId==='njh_door_cove_room_1');
 // may be far from doors depending on spawn; move to room 1 use tile c=1
 const d1=(api.active().doors||[]).find(d=>d.id==='njh_door_cove_room_1');
 assert.ok(d1,'lobby baked door 1');
 pos={x:d1.wx,z:d1.wz};
 const near=api.extraActions();
 const lockedAct=near.find(a=>a.id==='enter_room'&&a.args.doorId==='njh_door_cove_room_1');
 assert.ok(lockedAct);
 assert.equal(lockedAct.label,'Terkunci');
 assert.equal(lockedAct.args.locked,true);
 const mine=(api.active().doors||[]).find(d=>d.id==='njh_door_home_ichsan');
 pos={x:mine.wx,z:mine.wz};
 const mineAct=api.extraActions().find(a=>a.args&&a.args.doorId==='njh_door_home_ichsan');
 assert.ok(mineAct);
 assert.equal(mineAct.args.locked,false);
 const inn=api.openInteriorById('njh_door_home_ichsan'); // user-visible lobby door, not a debug direct room jump
 assert.equal(inn.ok,true);
 assert.equal(api.roomId(),'njh_kos_ichsan');
 const back=api.exit();
 assert.equal(back.ok,true);
 assert.equal(api.roomId(),'njh_kos_cove_lobby');
 // partner can enter Noor's room
 pos={x:-26.25,z:71.5};
 const asNoor=Interiors.create({
  THREE:T,scene:new T.Group(),catalog:JSON.parse(fs.readFileSync(path.join(DIR,'catalog.json'),'utf8')),
  scenes:{njh_kos_cove_lobby:lobby,njh_kos_ichsan:ichsan,njh_kos_noor:noor},
  getWorld:()=>({objects:[]}),getState:()=>({}),
  getPos:()=>pos,teleport:(x,z)=>{pos={x,y:0,z};return true;},
  getPlayerId:()=>'t_noor',getRelationships:()=>[{a:'t_ichsan',b:'t_noor',type:'pacaran'}],
  message:()=>{},persist:()=>{}
 });
 const partner=asNoor.enterInterior('njh_kos_ichsan');
 assert.equal(partner.ok,true);
 const guest=Interiors.create({
  THREE:T,scene:new T.Group(),catalog:JSON.parse(fs.readFileSync(path.join(DIR,'catalog.json'),'utf8')),
  scenes:{njh_kos_cove_lobby:lobby,njh_kos_ichsan:ichsan},
  getWorld:()=>({objects:[]}),getState:()=>({}),
  getPos:()=>pos,teleport:(x,z)=>{pos={x,y:0,z};return true;},
  getPlayerId:()=>'t_guest_1',message:()=>{},persist:()=>{}
 });
 const denied=guest.enterInterior('njh_kos_ichsan');
 assert.equal(denied.ok,false);
 assert.equal(denied.reason,'Terkunci');
 const spawn=A.spawnTarget('t_ichsan','kost','njh_kos_ichsan');
 assert.equal(spawn.roomId,'njh_kos_ichsan');
 assert.equal(spawn.skipLobby,true);
 assert.equal(A.housingOf('t_ichsan').roomId,'njh_kos_ichsan');
});

test('site name matching: prayer ignores rak sandal assets, tree is word-bounded, warung prefers warteg',()=>{
 const src=fs.readFileSync(path.join(R,'world-builder/semesta-life-play.js'),'utf8');
 assert.match(src,/buildingName/);
 assert.match(src,/rak\.\?sandal/);
 assert.match(src,/\\btree\\b/);
 assert.match(src,/prefer=matches\.filter\(o=>\/warteg\/i/);
 const hooks=fs.readFileSync(path.join(R,'world-builder/semesta-life-hooks.js'),'utf8');
 assert.match(hooks,/scavengePat/);
 assert.match(hooks,/points:Array\.isArray\(s\.points\)/);
});
