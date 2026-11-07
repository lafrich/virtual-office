'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const SR=require('../shared/spawn-respawn.js');
const G=require('../shared/gameplay-schema.js');

function worldFrom(tiles,objects=[]){
 const cells=tiles.map(([c,r,type])=>({c,r,type}));
 return {map:{terrain:{default:'grass',cells}},objects};
}

const demo=worldFrom([
 [3,41,'sidewalk'],[7,41,'sidewalk'],[16,41,'sidewalk'],[28,41,'sidewalk'],[39,41,'sidewalk'],
 [10,46,'sidewalk'],[24,46,'sidewalk'],[36,46,'sidewalk'],
 [0,41,'sidewalk'],[12,41,'sidewalk'],
 [0,42,'road'],[12,42,'road'],[5,10,'water'],[6,10,'road']
],[{id:'shop-1',type:'building',name:'Ruko',x:12.5,z:41.5,w:4,d:4}]);

test('defaults are generic: no Ichsan/Noor keys and several roadside points',()=>{
 const m=SR.defaultModule();
 assert.equal(SR.namedPlayerKeys(m).length,0);
 assert.ok(m.pool.length>=6);
 assert.equal(m.previewOwnsRoom,false);
 assert.equal(m.ownedRoom,null);
 assert.equal(m.exitTentAnimation,true);
 const g=G.defaultGameplay();
 assert.ok(g.modules.spawnRespawn);
 assert.equal(g.modules.spawnRespawn.previewOwnsRoom,false);
 assert.equal(SR.namedPlayerKeys(g.modules.spawnRespawn).length,0);
 assert.ok(g.modules.spawnRespawn.pool.length>=6);
});

test('validate rejects road, water, and building collisions',()=>{
 assert.equal(SR.validatePoint({x:0.5,z:42.5,facing:'se'},demo).ok,false);
 assert.equal(SR.validatePoint({x:5.5,z:10.5,facing:'se'},demo).reason,'forbidden-tile');
 assert.equal(SR.validatePoint({x:12.5,z:41.5,facing:'se'},demo).reason,'collision');
 assert.equal(SR.validatePoint({x:0.5,z:41.5,facing:'se'},demo).ok,true);
});

test('homeless spawn picks randomly among valid points and is not a named player',()=>{
 const seen=new Set();
 for(let seed=1;seed<=80;seed++){
  const pick=SR.pickRandom(SR.defaultModule(),demo,seed);
  assert.equal(pick.ok,true);
  assert.ok(pick.point);
  assert.equal(SR.validatePoint(pick.point,demo).ok,true);
  seen.add(pick.point.id);
 }
 assert.ok(seen.size>=3,'expected at least 3 different random tent points, got '+seen.size);
});

test('owned room switches spawn to that room and skips the tent animation',()=>{
 const room={id:'cove-room-1',x:10,z:20,facing:'se'};
 const housed=SR.resolve({homeAccess:true,ownedRoom:room},SR.defaultModule(),demo,1);
 assert.equal(housed.kind,'home');
 assert.equal(housed.playExitTent,false);
 assert.equal(housed.point.x,10);
 const homeless=SR.resolve({homeAccess:false},SR.defaultModule(),demo,1);
 assert.equal(homeless.kind,'hobo');
 assert.equal(homeless.playExitTent,true);
 assert.ok(homeless.point);
});

test('exit-tent toggle and previewOwnsRoom are honored',()=>{
 const off=SR.normalizeModule({exitTentAnimation:false});
 const r=SR.resolve({homeAccess:false},off,demo,2);
 assert.equal(r.playExitTent,false);
 const home=SR.resolve({},SR.normalizeModule({previewOwnsRoom:true,ownedRoom:{x:3,z:4}}),demo,1);
 assert.equal(home.kind,'home');
 assert.equal(home.point.x,3);
});

test('map markers named as hobo tents merge into the editable pool',()=>{
 const extra=worldFrom([[8,41,'sidewalk'],[8,42,'road']],
  [{id:'pin-hobo',type:'marker',markerKind:'hobo_tent',x:8.5,z:41.5,facing:'sw'}]);
 const pool=SR.collectPool({pool:[]},extra);
 assert.ok(pool.some(p=>p.id==='pin-hobo'&&p.z===41.5));
});

test('Ellen spawn_hobo art is present for tent layers and exit-tent sheets',()=>{
 const root=path.join(__dirname,'../world-builder/legacy-assets/spawn-hobo');
 for(const rel of [
  'sprites/tenda_buka_se__belakang.png','sprites/tenda_buka_se__depan.png',
  'sprites/tenda_buka_sw__belakang.png','sprites/tenda_buka_sw__depan.png',
  'sprites/tenda_tutup_se.png','sprites/tenda_tutup_sw.png',
  'sheets/spawn_npc_se.png','sheets/spawn_npc_sw.png',
  'sheets/spawn_ichsan_se.png','sheets/spawn_ichsan_sw.png'
 ])assert.ok(fs.existsSync(path.join(root,rel)),rel);
 const rt=fs.readFileSync(path.join(__dirname,'../world-builder/semesta-spawn-hobo.js'),'utf8');
 assert.match(rt,/tenda_buka_.*__belakang/);
 assert.match(rt,/tenda_buka_.*__depan/);
 assert.match(rt,/lowestOpaqueRow/);
 assert.match(rt,/contactY/);
 assert.match(rt,/placeInTent/);
 assert.match(rt,/back.add\(overlay\)/);
 assert.match(rt,/openingAnchor/);
 assert.match(rt,/silhouetteMask/);
 assert.match(rt,/destination-in/);
 assert.match(rt,/concealActor/);
 assert.match(rt,/revealActor/);
 assert.match(rt,/root.visible=false/);
 assert.match(rt,/root.visible=true/);

});
