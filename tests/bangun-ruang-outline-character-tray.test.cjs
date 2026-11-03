const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.join(__dirname,'../world-builder');
const read=p=>fs.readFileSync(path.join(base,p),'utf8');
function plugins(){
 const window={};
 for(const filename of [
  'bangun-ruang/interior-model.js','bangun-ruang/interior-isometric.js',
  'bangun-ruang/building-guides.js','bangun-ruang/character-scale-preview.js'
 ])vm.runInNewContext(read(filename),{window});
 return window;
}
test('outline derives alpha edges without mutating original PNG buffer',()=>{
 const g=plugins(),trace=g.VLBuildingGuides.trace;
 const rgba=new Uint8ClampedArray(3*3*4);
 const pixel=(x,y,color,a=255)=>rgba.set([color,color,color,a],(y*3+x)*4);
 pixel(0,0,220);pixel(1,0,220);pixel(0,1,220);pixel(1,1,45);
 const original=Array.from(rgba),out=trace(rgba,3,3);
 assert.equal(out.length,rgba.length);
 assert.deepEqual(Array.from(rgba),original);
 assert.equal(out[3],255);
 assert.equal(out[(1*3+1)*4+3],255);
 assert.equal(out[(2*3+2)*4+3],0);
});
test('character scale is aligned to original Mahluk Hidup pixels and pivot',()=>{
 const g=plugins();
 assert.equal(g.VLCharacterScale.FRAME.w,64);
 assert.equal(g.VLCharacterScale.FRAME.h,112);
 assert.equal(g.VLCharacterScale.FRAME.pivotX,32);
 assert.equal(g.VLCharacterScale.FRAME.pivotY,100);
 const html=read('bangun-ruang/index.html');
 assert.ok(html.includes('../mahluk-hidup-bridge.js'));
 assert.ok(html.includes('../pipeline-character-rig.js'));
 assert.ok(html.includes('character-scale-preview.js'));
});
test('character routes around occupied tiles and finishes next to a bed',()=>{
 const g=plugins(),model=g.VLBuildingInterior,room=model.preset({w:3,d:3},'bedroom');
 const bed=room.items.find(x=>x.assetId==='bed'),start=[room.entrance.c,room.entrance.r];
 const route=g.VLCharacterScale.pathTo(room,start,[bed.c,bed.r],{item:bed});
 assert.ok(route.length>0);
 const occupied=new Set(room.items.flatMap(model.occupied));
 for(const tile of route)assert.equal(occupied.has(tile.join(',')),false);
 const end=route[route.length-1];
 assert.ok(model.occupied(bed).some(key=>{
  const [c,r]=key.split(',').map(Number);
  return Math.abs(c-end[0])+Math.abs(r-end[1])===1;
 }));
});
test('reference actor is not serialized into building asset data',()=>{
 const studio=read('bangun-ruang/index.html');
 const start=studio.indexOf('function buildAsset()');
 const end=studio.indexOf('function persist(',start);
 const save=studio.slice(start,end);
 assert.ok(start>0&&end>start);
 assert.ok(!/scaleController|characterScaleCanvas|actor\.profile|actor\.scene/.test(save));
});
test('all interior assets are displayed in horizontal shelf immediately below canvas',()=>{
 const html=read('bangun-ruang/index.html');
 const css=read('bangun-ruang/mobile-ui.css');
 const stage=html.indexOf('id="previewStage"');
 const tray=html.indexOf('id="interiorQuickTools"');
 const actor=html.indexOf('id="characterScaleTools"');
 assert.ok(stage>0&&tray>stage&&actor>tray);
 assert.ok(html.includes('id="interiorQuickBar"'));
 assert.ok(css.includes('overflow-x:auto'));
 assert.ok(css.includes('flex-wrap:nowrap'));
 const ui=read('bangun-ruang/studio-interior-ui.js');
 assert.ok(ui.includes('function armPlacement(type)'));
 assert.ok(ui.includes("const thumb=document.createElement('canvas')"));
});
