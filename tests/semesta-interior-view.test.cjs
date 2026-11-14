'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const V=require('../world-builder/semesta-interior-view.js');
const DIR=path.join(__dirname,'..','world-builder','njh-play-interiors');
const catalog=JSON.parse(fs.readFileSync(path.join(DIR,'catalog.json'),'utf8'));

function scenes(){
 return fs.readdirSync(DIR).filter(f=>f.endsWith('.interior-scene.json')).map(f=>{
  const sc=JSON.parse(fs.readFileSync(path.join(DIR,f),'utf8'));
  return {file:f,scene:sc};
 });
}
function propHeight(assetId){
 const id=V.artId(assetId);
 const typ=(catalog.items||catalog)[id]||(catalog.items||catalog)[assetId];
 const view=typ&&(typ.sw||typ.se||Object.values(typ)[0]);
 const h=(view?.size||[64,64])[1];
 return V.spriteSize(1,h).h;
}
function propsFor(scene,origin){
 const o=origin||{x:240,z:0};
 return (scene.items||[]).map(it=>{
  const typ=(catalog.items||catalog)[V.artId(it.assetId)]||{};
  const view=typ.sw||typ.se||{};
  const foot=view.footprint||[1,1];
  const rot=Number(it.rotation)||0;
  let fw=foot[0]||1,fd=foot[1]||1;if(rot%180===90){const t=fw;fw=fd;fd=t;}
  return {id:it.assetId+'@'+it.c+','+it.r,assetId:it.assetId,
   x:o.x+Number(it.c||0)+fw/2,z:o.z+Number(it.r||0)+fd/2,h:propHeight(it.assetId)};
 });
}

test('sprite plane size is at least the PNG opaque height in world units',()=>{
 for(const [id,views] of Object.entries(catalog.items||catalog)){
  const view=views.sw||views.se||Object.values(views)[0];
  const file=path.join(DIR,'art',view.file);
  assert.equal(fs.existsSync(file),true,id+' art missing');
  const size=view.size;assert.ok(size&&size[1]>0,id+' has size');
  const plane=V.spriteSize(size[0],size[1]);
  assert.ok(plane.h+1e-9>=size[1]*V.PIXEL_WORLD*V.VERTICAL_COMP-1e-9,id+' plane shorter than art');
  assert.ok(plane.w+1e-9>=size[0]*V.PIXEL_WORLD-1e-9,id+' plane narrower than art');
 }
});

test('tight door camera (viewSize 8) clips back-wall kost furniture — the bug we guard against',()=>{
 const kost=scenes().find(s=>s.file.startsWith('njh_kos')).scene;
 const origin={x:240,z:0};
 const props=propsFor(kost,origin);
 const door={x:origin.x+4.5,y:0,z:origin.z+5.5};
 const clipped=V.clippedProps(props,door,8,1280/760);
 assert.ok(clipped.some(c=>c.id.startsWith('bed')||c.id.startsWith('wardrobe')),
  'regression: door/viewSize 8 must still be detected as clipping the bed/wardrobe');
 assert.ok(clipped.every(c=>c.reason==='frustum-top'||c.reason==='frustum'));
});

test('fitInteriorCamera frames every catalog interior, including tallest back-wall props',()=>{
 const origin={x:240,z:0};
 for(const {file,scene} of scenes()){
  const props=propsFor(scene,origin);
  const fit=V.fitInteriorCamera({
   origin,width:scene.width||8,depth:scene.depth||6,props,aspect:1280/760,pad:1.22,
   inset:V.playInset()
  });
  assert.equal(fit.clipped.length,0,file+' still clipped: '+(fit.clipped.map(c=>c.id).join(',')));
  const again=V.clippedProps(props,fit.focus,fit.viewSize,1280/760);
  assert.equal(again.length,0,file+' clipped at fitted view '+fit.viewSize);
  assert.ok(fit.viewSize>=8);
 }
});

test('iso cutaway never draws the near-side wall that would occlude props',()=>{
 const walls=V.farWalls(V.ISO_DIRECTION);
 assert.equal(walls.back,true);
 assert.equal(walls.left,true);
 assert.equal(walls.right,false,'+X+Z iso camera: right wall is near and must stay down');
 assert.equal(walls.front,false,'entrance wall stays open');
 const opp=V.farWalls({x:-1,y:1,z:-1});
 assert.equal(opp.right,true);assert.equal(opp.front,true);
 assert.equal(opp.left,false);assert.equal(opp.back,false);
});

test('no clipping-plane API is used; walls are a cutaway, not a clip volume',()=>{
 const src=fs.readFileSync(path.join(__dirname,'..','world-builder','njh-play-interiors.js'),'utf8');
 const shared=fs.readFileSync(path.join(__dirname,'..','world-builder','semesta-interior-view.js'),'utf8');
 assert.doesNotMatch(src,/clippingPlanes/);
 assert.doesNotMatch(shared,/clippingPlanes/);
 assert.match(src,/VLSemestaInteriorView/);
 assert.match(src,/farWalls/);
 assert.match(src,/fitInteriorCamera/);
});

test('Kharisma layout is the play warteg, Ellen warung remains as fallback',()=>{
 const html=fs.readFileSync(path.join(__dirname,'..','world-builder','index.html'),'utf8');
 const play=fs.readFileSync(path.join(__dirname,'..','world-builder','njh-play-interiors.js'),'utf8');
 assert.match(play,/njh_warteg_kharisma/);
 assert.match(play,/njh_warung_makan/);
 const k=JSON.parse(fs.readFileSync(path.join(DIR,'njh_warteg_kharisma.interior-scene.json'),'utf8'));
 const e=JSON.parse(fs.readFileSync(path.join(DIR,'njh_warung_makan.interior-scene.json'),'utf8'));
 assert.equal(k.name,'Warteg Kharisma Bahari');
 assert.equal(k.width,8);assert.equal(k.depth,6);
 assert.equal(k.entrance.c,3);assert.equal(k.entrance.r,5);
 assert.equal(k.items.length,14);
 assert.deepEqual(k.items.map(i=>i.assetId),[
  'shelf','shelf','fridge','stove','counter','counter','cashier','kitchen_sink',
  'table','table','chair','chair','chair','chair']);
 assert.equal(e.items.length,13,'generic Ellen layout kept on disk as fallback');
 assert.match(html,/semesta-interior-view.js/);
});
