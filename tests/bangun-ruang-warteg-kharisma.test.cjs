const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'../world-builder/bangun-ruang');
const template=fs.readFileSync(path.join(root,'warteg-kharisma-template.js'),'utf8');
const modelSource=fs.readFileSync(path.join(root,'interior-model.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
function browserMock(){
 const context={
  fillStyle:null,fillRect(){},drawImage(){},
  getImageData(){const a=new Uint8ClampedArray(this.canvas.width*this.canvas.height*4);
   for(let k=3;k<a.length;k+=4)a[k]=255;return {data:a};}
 };
 const document={createElement(name){
  assert.equal(name,'canvas');
  const can={width:0,height:0,getContext(){context.canvas=can;return context;},
   toDataURL(){return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';}};
  return can;
 }};
 const window={};
 vm.runInNewContext(modelSource,{window});
 vm.runInNewContext(template,{window,document});
 return window;
}
test('Warteg Kharisma is a selectable ready-made Bangun Ruang template',()=>{
 assert.match(html,/id="presetWartegKharisma"/);
 assert.match(html,/warteg-kharisma-template\.js/);
 assert.match(html,/VLWartegKharismaTemplate\?\.create/);
});
test('Template preserves four native-facing sprites and 8x6 Semesta footprint',()=>{
 const win=browserMock(),pack=win.VLWartegKharismaTemplate.create(win.VLBuildingInterior);
 assert.equal(pack.format,'virtual-life-building-asset-v1');
 assert.equal(pack.config.baseId,'semesta:large');
 assert.equal(pack.footprint.join(','),'8,6');
 assert.equal(pack.enterable,true);
 assert.equal(pack.entrance.facing,'sw');
 assert.equal(pack.config.floors,1);
 for(const d of ['sw','se','ne','nw']){
  const v=pack.views[d];
  assert.match(v.url,/^data:image\/png;base64,/);
  assert.equal(v.size.length,2);assert.equal(v.pivot.length,2);
  assert.ok(v.size.every(n=>n>0&&n<=2048));
 }
});
test('Warteg interior items fit, do not overlap, and have action slots',()=>{
 const win=browserMock(),m=win.VLBuildingInterior;
 const pack=win.VLWartegKharismaTemplate.create(m);
 const scene=pack.interior.floors[0],occ=new Set();
 assert.equal(scene.width,8);assert.equal(scene.depth,6);
 assert.equal(scene.entrance.c,3);assert.equal(scene.entrance.r,5);
 assert.equal(scene.items.length,10);
 for(const item of scene.items){
  for(const cell of m.occupied(item)){
   assert.notEqual(cell,'3,5');
   assert.equal(occ.has(cell),false,'collision '+cell);
   occ.add(cell);
  }
 }
 assert.equal(pack.actionSlots.length,scene.items.length);
 assert.ok(pack.actionSlots.some(s=>s.assetId==='counter'&&s.interaction==='buy'));
 assert.ok(pack.actionSlots.some(s=>s.assetId==='stove'&&s.actionStatus==='gameplay-hook-only'));
 assert.ok(pack.actionSlots.some(s=>s.assetId==='chair'&&s.characterPose==='sit'));
});
