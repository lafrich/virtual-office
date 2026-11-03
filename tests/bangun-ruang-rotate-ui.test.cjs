const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.resolve(__dirname,'../world-builder/bangun-ruang');
function source(name){return fs.readFileSync(path.join(base,name),'utf8');}
function model(){
 const w={};vm.runInNewContext(source('interior-model.js'),{window:w});
 return w.VLBuildingInterior;
}
test('every furniture category rotates right and left without collision',()=>{
 const m=model();
 for(const id of Object.keys(m.types)){
  const scene=m.create({w:8,d:8});
  const item=m.add(scene,id,2,2);
  assert.ok(item,'missing '+id);
  assert.equal(m.rotate(scene,item.id,1),true,'right rotation '+id);
  assert.equal(item.rotation,90);
  assert.equal(m.rotate(scene,item.id,-1),true,'left rotation '+id);
  assert.equal(item.rotation,0);
  assert.equal(m.canPlace(scene,id,item.c,item.r,item.id,item.rotation),true);
 }
});
test('rotation at room edge auto-nudges but never crosses doorway',()=>{
 const m=model(),scene=m.create({w:4,d:4});
 const bed=m.add(scene,'bed',2,1);
 assert.ok(bed);
 assert.equal(m.rotate(scene,bed.id,1),true);
 assert.equal(bed.rotation,90);
 assert.ok(bed.c>=0&&bed.c+2<=scene.width);
 assert.ok(bed.r>=0&&bed.r+2<=scene.depth);
 assert.ok(!m.occupied(bed).includes(scene.entrance.c+','+scene.entrance.r));
});
test('blocked rotation leaves original location and rotation unchanged',()=>{
 const m=model(),scene=m.create({w:3,d:3});
 const sofa=m.add(scene,'sofa',0,0);
 assert.ok(sofa);
 for(const [c,r] of [[0,1],[1,1],[2,0],[2,1],[0,2],[2,2]])
  m.add(scene,'chair',c,r);
 const before=[sofa.c,sofa.r,sofa.rotation];
 assert.equal(m.rotate(scene,sofa.id,1),false);
 assert.deepEqual([sofa.c,sofa.r,sofa.rotation],before);
});
test('one-tap rotate controls and matching XP chrome load for Bangun Ruang',()=>{
 const html=source('index.html'),css=source('mobile-ui.css'),ui=source('studio-interior-ui.js');
 for(const id of ['interiorRotateBar','rotateLeft','rotateRight','rotateSelection','rotateHint'])
  assert.ok(html.includes('id="'+id+'"'),'UI missing '+id);
 assert.ok(html.includes('interior-model.js?v=rotate-v11'));
 assert.ok(html.includes('studio-interior-ui.js?v=rotate-v11'));
 assert.ok(html.includes('mobile-ui.css?v=rotate-v11'));
 assert.ok(ui.includes("model.rotate(current,item.id,steps)"));
 assert.ok(ui.includes("String(e.key).toLowerCase()!=='r'"));
 assert.ok(ui.includes("['↓','→','↑','←']"));
 assert.ok(css.includes('/* Shared XP Paint chrome'));
 assert.ok(css.includes('--chrome:#c9c8c4'));
 assert.ok(html.includes('class="close-mark"'));
});
