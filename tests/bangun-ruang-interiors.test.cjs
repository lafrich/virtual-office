const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.join(__dirname,'../world-builder');
const read=p=>fs.readFileSync(path.join(base,p),'utf8');
function interiorModel(){
 const g={};vm.runInNewContext(read('bangun-ruang/interior-model.js'),{window:g});return g.VLBuildingInterior;
}
test('Mahluk Hidup canonical pose bindings for interior furniture',()=>{
 const m=interiorModel();
 for(const [type,action,pose] of [
  ['wc','use_toilet','toilet'],['wc','pee','toilet'],['wc','poop','toilet'],
  ['bed','sleep','sleep'],['chair','sit','sit'],['desk','work','work'],
  ['shower','bathe','bathe'],['bathtub','bathe','bathe']]){
  assert.ok(m.types[type].actions.includes(action));
  assert.equal(m.actions[action].pose,pose);
 }
 for(const action of ['cook','wash'])assert.equal(m.actions[action].pose,null);
});
test('interior templates do not overlap furniture or block entrances',()=>{
 const m=interiorModel();
 for(const key of Object.keys(m.templates)){
  const scene=m.preset({w:3,d:3},key),tiles=new Set();
  for(const prop of scene.items)for(const cell of m.occupied(prop)){
   assert.notEqual(cell,scene.entrance.c+','+scene.entrance.r);
   assert.equal(tiles.has(cell),false,key+' overlaps '+cell);tiles.add(cell);
  }
 }
});
test('interior action survives save and normalization',()=>{
 const m=interiorModel(),scene=m.preset({w:3,d:3},'bathroom');
 const wc=scene.items.find(x=>x.assetId==='wc');
 assert.ok(wc);assert.ok(m.action(scene,wc.id,'poop'));
 const loaded=m.normalize(JSON.parse(JSON.stringify(scene)),{w:3,d:3});
 assert.equal(loaded.items.find(x=>x.id===wc.id).actionId,'poop');
 assert.equal(m.slots(loaded).find(x=>x.id===wc.id).characterPose,'toilet');
});
test('fractional Semesta footprint survives bridge; decorative buildings are not enterable',()=>{
 const m=interiorModel(),scene=m.preset({w:3,d:3.2},'home'),png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';
 const views=Object.fromEntries(['sw','se','ne','nw'].map(dir=>[dir,{size:[300,400],pivot:[150,340],url:png}]));
 const asset={id:'br-interior-one',name:'Rumah',config:{w:3,d:3.2,collision:'yes'},views,interactive:true,enterable:true,
  entranceFacing:'sw',entrance:{facing:'sw',groundFloor:1,entry:scene.entrance},
  interior:{format:'virtual-life-interiors-v1',floors:[scene],activeFloor:1},
  actionSlots:m.slots(scene),interactions:['enter','sleep']};
 const decor={...asset,id:'br-decorative',interactive:false,enterable:false,interior:null,actionSlots:[],interactions:[]};
 const g={VLAssetCatalog:[]};
 vm.runInNewContext(read('bangun-ruang/semesta-bridge.js'),{
  window:g,localStorage:{getItem:()=>JSON.stringify([asset,decor])},console
 });
 const i=g.VLAssetCatalog.find(x=>x.id===asset.id),d=g.VLAssetCatalog.find(x=>x.id===decor.id);
 assert.equal(i.footprint.join(','),'3,3.2');assert.equal(i.enterable,true);
 assert.equal(i.actionSlots.length,scene.items.length);
 assert.equal(d.enterable,false);assert.equal(d.entranceFacing,'');assert.equal(d.interactions.length,0);
});
test('map JSON preserves interior, entrance and action hooks',()=>{
 const m=interiorModel(),scene=m.preset({w:3,d:3},'bedroom'),g={};
 vm.runInNewContext(read('map-schema.js'),{window:g});
 const catalog=new Map([['studio:br-test',{source:'custom-building',published:true,id:'br-test'}]]);
 const style={category:()=> 'building',footprint:()=>[3,3]};
 const obj={id:'map-building',type:'sprite',asset:'studio:br-test',x:0,z:0,rotation:0,scale:1,
  interactive:true,enterable:true,entranceFacing:'sw',entrance:{facing:'sw',groundFloor:1,entry:scene.entrance},
  interior:{format:'virtual-life-interiors-v1',floors:[scene]},actionSlots:m.slots(scene),
  interactions:['enter','sleep']};
 const o=g.VLMapSchema.enrich({map:{},objects:[obj]},catalog,style).objects[0];
 assert.equal(o.entrance.entry.c,scene.entrance.c);
 assert.equal(o.interior.floors[0].items.length,scene.items.length);
 assert.equal(o.interactionHooks[0].enabled,false);
});
