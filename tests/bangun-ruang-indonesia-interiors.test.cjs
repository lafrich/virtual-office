// Regression: Indonesia Interior Pack / native Bangun Ruang + Semesta contracts.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
function load(){
 const window={};
 for(const name of ['indonesia-interior-templates','interior-model','interior-isometric']){
  const code=fs.readFileSync(path.join(root,'world-builder','bangun-ruang',name+'.js'),'utf8');
  vm.runInNewContext(code,{window}, {filename:name+'.js'});
 }
 return window;
}
const env=load(),model=env.VLBuildingInterior,pack=env.VLIndonesiaInteriorPack;
const canvas=()=>({
 width:0,height:0,
 getContext:()=>new Proxy({},{
  get:(target,key)=>key in target?target[key]:(()=>{}),
  set:(target,key,value)=>{target[key]=value;return true;}
 })
});
test('66 context-specific Indonesian rooms and 43 additional reusable furniture definitions',()=>{
 assert.equal(pack.count,66);
 assert.equal(Object.keys(pack.types).length,43);
 assert.equal(Object.keys(model.types).length,61);
 assert.ok(Object.keys(pack.templates).some(x=>x.includes('minimarket')));
 assert.ok(Object.keys(pack.templates).some(x=>x.includes('mushola')));
 assert.ok(Object.keys(pack.templates).some(x=>x.includes('puskesmas')));
 assert.ok(Object.keys(pack.templates).some(x=>x.includes('kontrakan')));
});
test('all prescribed placements fit 8x6, are reachable, have action metadata, and preserve door',()=>{
 let props=0;
 for(const [key,template] of Object.entries(pack.templates)){
  const scene=model.preset({w:8,d:6},key),occupied=new Set();
  assert.equal(scene.omitted,0,key+' omitted furniture');
  assert.equal(scene.items.length,template.items.length,key+' wrong count');
  assert.equal(scene.templateId,key);
  for(const item of scene.items){
   assert.ok(model.types[item.assetId],key+' undefined type');
   assert.ok(model.actions[item.actionId],key+' undefined action');
   assert.ok(model.types[item.assetId].actions.includes(item.actionId));
   for(const tile of model.occupied(item)){
    assert.ok(!occupied.has(tile),key+' collision at '+tile);
    occupied.add(tile);
    const [x,y]=tile.split(',').map(Number);
    assert.ok(x>=0&&x<8&&y>=0&&y<6);
   }
   props++;
  }
  assert.ok(!occupied.has(scene.entrance.c+','+scene.entrance.r),key+' door');
 }
 assert.equal(props,383);
});
test('smaller footprint gracefully omits furniture without corrupting existing locations',()=>{
 for(const key of Object.keys(pack.templates)){
  const s=model.preset({w:3,d:3},key);
  assert.equal(s.width,3);
  assert.equal(s.depth,3);
  const occupied=s.items.flatMap(model.occupied);
  assert.equal(new Set(occupied).size,occupied.length,key);
  assert.ok(!occupied.includes(s.entrance.c+','+s.entrance.r));
 }
});
test('every 8x6 room renders, exports action slots and survives save/reopen normalization',()=>{
 const preview=canvas();
 for(const key of Object.keys(pack.templates)){
  const scene=model.preset({w:8,d:6},key);
  const picture=env.VLInteriorIso.draw(preview,scene);
  assert.equal(picture.hits.length,scene.items.length,key);
  const slots=model.slots(scene);
  assert.equal(slots.length,scene.items.length,key);
  for(const item of scene.items){
   const anchor=env.VLInteriorIso.actionAnchor(item,{raw:true,generic:true});
   assert.ok(Number.isFinite(anchor?.c)&&Number.isFinite(anchor?.r),key);
  }
  const saved=JSON.parse(JSON.stringify(scene));
  const reopened=model.normalize(saved,{w:8,d:6});
  assert.equal(reopened.items.length,scene.items.length,key);
  assert.equal(reopened.templateId,key);
  assert.equal(model.slots(reopened).length,scene.items.length,key);
 }
});
test('rig previews are labeled separately from unimplemented gameplay hooks',()=>{
 const s=model.preset({w:8,d:6},'id_dapur_rumah_indonesia'),slots=model.slots(s);
 assert.ok(slots.some(x=>x.assetId==='stove'&&x.actionStatus==='gameplay-hook-only'));
 const h=model.preset({w:8,d:6},'id_kos_mahasiswa');
 assert.ok(model.slots(h).some(x=>x.assetId==='floor_mattress'&&x.characterPose==='sleep'));
});
test('both Bangun Ruang and Semesta load the shared catalog before their interior model',()=>{
 for(const page of ['world-builder/index.html','world-builder/bangun-ruang/index.html']){
  const html=fs.readFileSync(path.join(root,page),'utf8');
  assert.ok(html.indexOf('indonesia-interior-templates.js')<html.indexOf('interior-model.js'),page);
 }
});
