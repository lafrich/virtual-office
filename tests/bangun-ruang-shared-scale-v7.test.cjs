const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'../world-builder');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function modules(){
 const window={};
 for(const file of ['bangun-ruang/interior-model.js','bangun-ruang/interior-isometric.js'])
  vm.runInNewContext(read(file),{window});
 return window;
}
test('interior uses the exterior Semesta footprint 1:1, no 2x expansion',()=>{
 const {VLBuildingInterior:m,VLInteriorIso:iso}=modules();
 for(const [w,d] of [[3,3],[5,4],[8,6]]){
  const room=m.create({w,d});
  assert.deepEqual([room.width,room.depth],[w,d]);
  assert.equal(room.unit,'semesta-ground-tile');
  assert.equal(room.tilePixels.join(','),'64,32');
  assert.equal(room.version,2);
  const geo=iso.bounds(room);
  assert.equal(geo.width,(w+d)*32+70);
 }
});
test('partial footprints never create more full walkable interior tiles',()=>{
 const {VLBuildingInterior:m}=modules();
 const room=m.create({w:3,d:3.2});
 assert.equal(room.width,3);
 assert.equal(room.depth,3);
 assert.equal(room.sourceFootprint.join(','),'3,3.2');
});
test('cutaway walls match the source height and native V6B visible body',()=>{
 const {VLInteriorIso:iso}=modules();
 assert.equal(iso.WALL,128);
 assert.ok(iso.WALL>=72*iso.ACTOR_SCALE);
 assert.equal(iso.WC_SEAT_Z,15);
 assert.equal(iso.WC_TANK_Z,38);
 const seat=iso.actionAnchor({id:'wc',assetId:'wc',c:1,r:1,rotation:0});
 assert.equal(seat.pixelOffsetY,0);
 assert.equal(seat.direction,'sw');
});
test('old 6x6 interior migrates to 3x3 without losing WC action or blocking entry',()=>{
 const {VLBuildingInterior:m}=modules();
 const old=m.preset({w:6,d:6},'bathroom');
 old.version=1;old.width=6;old.depth=6;
 const ids=new Map(old.items.map(item=>[item.id,item.actionId]));
 const normalized=m.normalize(old,{w:3,d:3});
 assert.equal(normalized.width,3);
 assert.equal(normalized.depth,3);
 assert.equal(normalized.version,2);
 for(const [id,action] of ids)
  assert.equal(normalized.items.find(x=>x.id===id)?.actionId,action);
 const occupied=new Set();
 for(const item of normalized.items)
  for(const cell of m.occupied(item)){
   assert.equal(occupied.has(cell),false);
   occupied.add(cell);
  }
 assert.equal(occupied.has(normalized.entrance.c+','+normalized.entrance.r),false);
});
test('Semesta also normalizes old interior floors without rewriting map data',()=>{
 const code=read('bangun-ruang/semesta-interior-preview.js');
 assert.ok(code.includes('model.normalize(original,active.cfg)'));
 assert.ok(code.includes('spec?.footprint||item?.footprint'));
 const studio=read('bangun-ruang/index.html');
 assert.ok(studio.includes('interior-model.js?v=adjustment-v1'));
 assert.ok(studio.includes('interior-isometric.js?v=action-alignment-v1'));
 assert.ok(studio.includes('character-scale-preview.js?v=transform-gizmo-v1'));
});
