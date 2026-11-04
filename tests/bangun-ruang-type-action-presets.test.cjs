"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.join(__dirname,"../world-builder/bangun-ruang");
const source=p=>fs.readFileSync(path.join(root,p),"utf8");
const json=x=>JSON.parse(JSON.stringify(x));
function boot(){
 const data=new Map();
 const localStorage={
  getItem:k=>data.has(k)?data.get(k):null,
  setItem:(k,v)=>data.set(k,String(v))
 };
 const w={localStorage,VLGameProportions:{character:{scale:1},
  building:{wallHeight:128},toilet:{seatedPoint:[.61,.69],sitFacing:"sw"}}};
 for(const file of ["action-adjustment.js","interior-model.js","interior-isometric.js"])
  vm.runInNewContext(source(file),{window:w});
 return {w,storage:localStorage,data};
}
test("WC defaults are per furniture type AND action, inherited by every new WC",()=>{
 const {w,storage}=boot(),m=w.VLBuildingInterior,a=w.VLInteractionAdjust;
 const cfg={w:8,d:8};
 const one=m.create(cfg);
 const wc1=m.add(one,"wc",1,1);
 assert.ok(wc1);
 assert.equal(a.get(wc1,"use_toilet").x,0);
 const pose={x:27,y:-13,direction:"ne",layer:"front"};
 assert.ok(a.setDefault("wc","use_toilet",pose,m.types.wc.actions));
 const wc2=m.add(one,"wc",4,2),wc3=m.add(m.create(cfg),"wc",3,3);
 assert.ok(wc2&&wc3,"No automatic toilet placement required");
 for(const wc of [wc1,wc2,wc3]){
  assert.deepEqual(json(a.get(wc,"use_toilet")),pose);
  assert.equal(w.VLInteriorIso.actionAnchor(wc).pixelOffsetX,27);
  assert.equal(w.VLInteriorIso.actionAnchor(wc).objectLayer,"front");
  assert.equal(m.slots({items:[wc]})[0].actionAdjustments.use_toilet.x,27);
 }
 assert.equal(a.get(wc2,"pee").x,0,"Different WC action has its own default");
 assert.equal(a.get({assetId:"bed"},"use_toilet").x,0,"Defaults never leak across types");
 assert.ok(a.setDefault("wc","pee",{x:-2,y:16,direction:"sw",layer:"behind"},m.types.wc.actions));
 assert.equal(a.get(wc2,"pee").x,-2);
 assert.equal(a.get(wc2,"use_toilet").x,27);
 assert.equal(storage.getItem(a.KEY).includes('"wc"'),true);
 assert.equal(a.setDefault("wc","sleep",pose,m.types.wc.actions),false,
  "A toilet cannot save a bed-only action");
});
test("legacy per-instance WC placement automatically becomes reusable type default",()=>{
 const {w,storage}=boot(),m=w.VLBuildingInterior,a=w.VLInteractionAdjust;
 const scene=m.preset({w:7,d:7},"bathroom"),wc=scene.items.find(x=>x.assetId==="wc");
 assert.ok(wc);
 a.set(wc,"use_toilet",{x:11,y:-8,direction:"nw",layer:"behind"},m.types.wc.actions);
 const oldBuilding={id:"br-old",interior:{floors:[json(scene)]}};
 assert.equal(a.migrateFromBuildings([oldBuilding],storage),1);
 const fresh=m.create({w:7,d:7});
 assert.equal(fresh.items.length,0,"Default does not create furniture");
 const newlyPlaced=m.add(fresh,"wc",2,2);
 assert.deepEqual(json(a.get(newlyPlaced,"use_toilet")),
  {x:11,y:-8,direction:"nw",layer:"behind"});
 assert.equal(a.migrateFromBuildings([oldBuilding],storage),0,
  "Already migrated defaults should not be overwritten at the next startup");
});
test("new saved type default overrides old per-instance WC settings in every building",()=>{
 const {w,storage}=boot(),m=w.VLBuildingInterior,a=w.VLInteractionAdjust;
 const scene=m.preset({w:8,d:8},"bathroom"),old=scene.items.find(x=>x.assetId==="wc");
 a.set(old,"use_toilet",{x:2,y:3,direction:"auto",layer:"behind"},m.types.wc.actions);
 assert.ok(a.setDefault("wc","use_toilet",
  {x:19,y:7,direction:"se",layer:"front"},m.types.wc.actions,storage));
 const loaded=m.normalize(json(scene),{w:8,d:8}),restored=loaded.items.find(x=>x.id===old.id);
 assert.equal(a.get(restored,"use_toilet").x,19);
 assert.equal(a.all(restored.actionAdjustments,m.types.wc.actions,"wc").use_toilet.x,19);
 assert.equal(m.slots(loaded).find(x=>x.id===old.id).actionAdjustments.use_toilet.x,19);
 assert.equal(w.VLInteriorIso.actionAnchor(restored).direction,"se");
});
test("small separate preset storage survives full browser reload",()=>{
 const first=boot(),m=first.w.VLBuildingInterior,a=first.w.VLInteractionAdjust;
 const pose={x:9,y:19,direction:"sw",layer:"front"};
 assert.ok(a.setDefault("wc","use_toilet",pose,m.types.wc.actions));
 const data=first.storage.getItem(a.KEY);
 // Load module afresh under a new window with existing localStorage.
 const store={
  getItem:key=>key===a.KEY?data:null,
  setItem(){throw new Error("Unexpected write")}
 };
 const freshWindow={localStorage:store};
 vm.runInNewContext(source("action-adjustment.js"),{window:freshWindow});
 assert.deepEqual(json(freshWindow.VLInteractionAdjust.get(
  {assetId:"wc",actionAdjustments:{}},"use_toilet")),pose);
});
test("new construction has NO toilet or furniture by default",()=>{
 const {w}=boot(),m=w.VLBuildingInterior;
 const empty=m.create({w:8,d:8});
 assert.equal(empty.items.length,0);
 assert.equal(m.preset({w:8,d:8},"empty").items.length,0);
 const html=source("index.html");
 assert.match(html,/preset\(defaultBase\);/);
 assert.match(html,/interiorUi\?\.reset\(\);/);
 assert.doesNotMatch(html,/if\(saved\.length\)openSavedAsset\(saved\[0\]/);
 assert.match(html,/migrateFromBuildings\?\.\(saved\)/);
});
