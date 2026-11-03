const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const dir=path.join(__dirname,'../world-builder');
const read=path=>fs.readFileSync(require('node:path').join(dir,path),'utf8');
function runtime(){
 const window={};
 for(const name of ['bangun-ruang/interior-model.js','bangun-ruang/game-proportions.js','bangun-ruang/interior-isometric.js']){
  vm.runInNewContext(read(name),{window});
 }
 return window;
}
test('uses source Virtual Life PPU=2, HS=1.6, art tile 64x32 and 64x112 sprite',()=>{
 const w=runtime(),g=w.VLGameProportions,i=w.VLInteriorIso;
 assert.equal(g.PPU,2);
 assert.equal(g.HEIGHT_SCALE,1.6);
 assert.equal(g.pixelTile.join(','),'64,32');
 assert.equal(g.character.frame.join(','),'64,112');
 assert.equal(g.character.pivot.join(','),'32,100');
 assert.equal(g.character.visibleHeight,72);
 assert.equal(g.character.scale,1);
 assert.equal(i.ACTOR_SCALE,1);
});
test('source Cove 40-unit wall, 30-unit door, 4.6 bowl and 12 tank map to pixel grid',()=>{
 const w=runtime(),g=w.VLGameProportions,i=w.VLInteriorIso;
 assert.equal(g.building.wallHeight,Math.round(40*1.6*2));
 assert.equal(g.building.doorHeight,Math.round(30*1.6*2));
 assert.equal(g.toilet.seatHeight,Math.round(4.6*1.6*2));
 assert.equal(g.toilet.tankHeight,Math.round(12*1.6*2));
 assert.equal(i.WALL,g.building.wallHeight);
 assert.equal(i.WC_SEAT_Z,g.toilet.seatHeight);
 assert.equal(i.WC_TANK_Z,g.toilet.tankHeight);
 assert.ok(g.building.doorHeight>g.character.visibleHeight);
 assert.ok(g.toilet.seatHeight<g.character.visibleHeight/3);
});
test('WC action anchor uses original game bowl-specific spot and SW sit pose',()=>{
 const w=runtime(),i=w.VLInteriorIso,g=w.VLGameProportions;
 assert.equal(g.toilet.sitFacing,'sw');
 assert.equal(g.toilet.footOffsetY,0);
 const seat=[];
 for(const rotation of [0,90,180,270]){
  const a=i.actionAnchor({id:'wc',assetId:'wc',c:1,r:1,rotation});
  assert.equal(a.direction,'sw');
  assert.equal(a.pixelOffsetY,0);
  assert.equal(a.itemId,'wc');
  assert.ok(a.c>1&&a.c<2&&a.r>1&&a.r<2);
  seat.push(a.c+','+a.r);
 }
 assert.equal(new Set(seat).size,4);
 const neutral=i.actionAnchor({id:'wc',assetId:'wc',c:0,r:0,rotation:0});
 assert.ok(Math.abs(neutral.c-.61)<.001);
 assert.ok(Math.abs(neutral.r-.69)<.001);
});
test('native 64x112 actor sheet is not double-scaled, sit row loops per original game',()=>{
 const source=read('bangun-ruang/character-scale-preview.js');
 assert.ok(source.includes('const frame=rig.frameAt(resolved,time);'));
 assert.ok(!source.includes("Number(resolved.frames||1)-1"));
 assert.ok(source.includes('const drawWidth=FRAME.w*scale,drawHeight=FRAME.h*scale;'));
 const html=read('bangun-ruang/index.html');
 assert.ok(html.includes('window.VLGameProportions?.building.wallHeight||128'));
 assert.ok(html.includes('const doorTop=(window.VLGameProportions?.building.doorHeight||96)+4'));
 assert.ok(html.includes('const H=c.floors*(window.VLGameProportions?.building.wallHeight||128);'));
});
test('load game reference before renderer in both editor and Semesta',()=>{
 for(const [file,prefix] of [
  ['bangun-ruang/index.html','./'],['index.html','./bangun-ruang/']
 ]){
  const s=read(file);
  const ref=prefix+'game-proportions.js?v=source-v9';
  const renderer=prefix+'interior-isometric.js?v=furniture-v10';
  assert.ok(s.includes(ref));
  assert.ok(s.includes(renderer));
  assert.ok(s.indexOf(ref)<s.indexOf(renderer));
 }
});
