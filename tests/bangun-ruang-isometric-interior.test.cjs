const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'../world-builder');
const source=relative=>fs.readFileSync(path.join(root,relative),'utf8');
function setup(){
 const window={};
 vm.runInNewContext(source('bangun-ruang/interior-model.js'),{window});
 vm.runInNewContext(source('bangun-ruang/interior-isometric.js'),{window});
 return window;
}
function canvas(){
 const metrics={fills:0,clears:0};
 const ctx={imageSmoothingEnabled:true,fillRect(){metrics.fills++},clearRect(){metrics.clears++}};
 const node={width:0,height:0,getContext:()=>ctx,
  getBoundingClientRect(){return {left:0,top:0,width:node.width,height:node.height}}};
 return {node,ctx,metrics};
}
test('2:1 interior uses exact Semesta 64x32 isometric tiles',()=>{
 const {VLBuildingInterior:m,VLInteriorIso:iso}=setup();
 const room=m.preset({w:3,d:3},'bathroom'),g=iso.bounds(room);
 assert.equal(iso.tilePixels.join(','),'64,32');
 const a=iso.point(g,2,1),b=iso.point(g,3,1),d=iso.point(g,2,2);
 assert.equal(b[0]-a[0],32);assert.equal(b[1]-a[1],16);
 assert.equal(d[0]-a[0],-32);assert.equal(d[1]-a[1],16);
 assert.equal(iso.tileAt(g,...iso.point(g,2.5,1.5)).c,2);
 assert.equal(iso.tileAt(g,...iso.point(g,2.5,3.5)).r,1);
 assert.equal(iso.tileAt(g,0,0),null);
});
test('native isometric raster renders rooms and interactive furniture',()=>{
 const {VLBuildingInterior:m,VLInteriorIso:iso}=setup();
 const room=m.preset({w:3,d:3},'bedroom'),{node,ctx,metrics}=canvas();
 const g=iso.draw(node,room,{selectedId:room.items[0].id});
 assert.ok(node.width>=262);
 assert.ok(node.height>200);
 assert.equal(ctx.imageSmoothingEnabled,false);
 assert.ok(metrics.fills>100,'room rendered using integer pixel rectangles');
 assert.equal(metrics.clears,1);
 assert.equal(g.hits.length,room.items.length);
 for(const h of g.hits){
  assert.ok(h.minX<h.maxX);assert.ok(h.minY<h.maxY);
 }
});
test('furniture pixel hit test and empty floor preserve real c/r coordinates',()=>{
 const {VLBuildingInterior:m,VLInteriorIso:iso}=setup();
 const room=m.preset({w:3,d:3},'bathroom'),{node}=canvas();
 const geometry=iso.draw(node,room,{});
 const item=geometry.hits[0];
 const hit=iso.pick(geometry,(item.minX+item.maxX)/2,(item.minY+item.maxY)/2);
 assert.equal(hit.itemId,item.id);
 const p=iso.point(geometry,2.5,1.5);
 const free=iso.pick(geometry,...p,{preferFloor:true});
 assert.equal(free.c,2);assert.equal(free.r,1);
 assert.equal(free.itemId,null);
});
test('same iso module is loaded before both Bangun Ruang and Semesta UI',()=>{
 const editor=source('bangun-ruang/index.html');
 const semesta=source('index.html');
 for(const [html,a,b] of [
  [editor,'./interior-isometric.js?v=seat-v7','./studio-interior-ui.js?v=tray-v5'],
  [semesta,'./bangun-ruang/interior-isometric.js?v=seat-v7','./bangun-ruang/semesta-interior-preview.js?v=units-v7']
 ]){
  assert.ok(html.includes(a),'missing renderer module');
  assert.ok(html.indexOf(a)<html.indexOf(b),'renderer should load before UI controller');
 }
 for(const id of ['interiorViewIso','interiorViewPlan'])assert.ok(editor.includes('id="'+id+'"'));
 for(const id of ['interiorWalkthroughIso','interiorWalkthroughPlan'])assert.ok(semesta.includes('id="'+id+'"'));
});
