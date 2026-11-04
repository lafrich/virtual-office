"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.join(__dirname,"../world-builder/bangun-ruang");
const read=name=>fs.readFileSync(path.join(root,name),"utf8");
function boot(){
 const w={VLGameProportions:{character:{scale:1},building:{wallHeight:128},
   toilet:{seatedPoint:[.61,.69],sitFacing:"sw"}}};
 for(const p of ["action-adjustment.js","interior-model.js","interior-isometric.js"]){
  vm.runInNewContext(read(p),{window:w});
 }
 return w;
}
const jsonRoundtrip=value=>JSON.parse(JSON.stringify(value));
test("Save Adjustment → localStorage JSON → reopen → Use Selected preserves actual pose, direction and layer",()=>{
 const w=boot(),model=w.VLBuildingInterior,adjust=w.VLInteractionAdjust;
 const config={w:6,d:6,floors:1,interactive:true};
 const room=model.preset(config,"bedroom"),bed=room.items.find(x=>x.assetId==="bed");
 assert.ok(bed);
 const first={x:24,y:-9,direction:"nw",layer:"front"};
 const other={x:-6,y:13,direction:"se",layer:"behind"};
 assert.equal(adjust.set(bed,"sleep",first,model.types.bed.actions),true);
 const slot=model.slots(room).find(x=>x.id===bed.id);
 assert.equal(slot.actionAdjustments.sleep.x,24);
 const saved={id:"br-persistence-demo",name:"Bedroom",config,interactive:true,
  lastAdjusted:{floor:1,itemId:bed.id,actionId:"sleep"},updatedAt:"2026-11-04T00:00:00Z",
  interior:{format:"virtual-life-interiors-v1",version:1,activeFloor:1,
   floors:[jsonRoundtrip({...room,floor:1})]},actionSlots:model.slots(room)};
 let localState=JSON.stringify([saved]); // Browser close / refresh simulation.
 const localStorage={getItem:k=>k==="virtual-life-bangun-ruang-v1"?localState:null,
  setItem(k,v){if(k==="virtual-life-bangun-ruang-v1")localState=v;}};
 const restored=JSON.parse(localStorage.getItem("virtual-life-bangun-ruang-v1"))[0];
 assert.equal(restored.lastAdjusted.itemId,bed.id);
 assert.equal(restored.lastAdjusted.actionId,"sleep");
 const reopened=model.normalize(restored.interior.floors[0],restored.config);
 const found=reopened.items.find(x=>x.id===bed.id);
 assert.ok(found);
 assert.deepEqual(jsonRoundtrip(adjust.get(found,"sleep")),first);
 const raw=w.VLInteriorIso.actionAnchor(found,{raw:true});
 const applied=w.VLInteriorIso.actionAnchor(found);
 assert.equal(applied.pixelOffsetX,24);
 assert.equal(applied.pixelOffsetY,raw.pixelOffsetY-9);
 assert.equal(applied.direction,"nw");
 assert.equal(applied.objectLayer,"front");
 // A SECOND save on the same action updates, rather than creating an unsaved
 // draft with the old coordinates shown in the inspector.
 assert.equal(adjust.set(found,"sleep",other,model.types.bed.actions),true);
 const updated={...restored,interior:{...restored.interior,floors:[jsonRoundtrip(reopened)]},
  actionSlots:model.slots(reopened),updatedAt:"2026-11-04T00:01:00Z"};
 localStorage.setItem("virtual-life-bangun-ruang-v1",JSON.stringify([updated]));
 const second=JSON.parse(localStorage.getItem("virtual-life-bangun-ruang-v1"))[0];
 const roundTwo=model.normalize(second.interior.floors[0],second.config);
 const latest=roundTwo.items.find(x=>x.id===bed.id);
 assert.deepEqual(jsonRoundtrip(adjust.get(latest,"sleep")),other);
 assert.equal(w.VLInteriorIso.actionAnchor(latest).direction,"se");
 assert.equal(w.VLInteriorIso.actionAnchor(latest).pixelOffsetX,-6);
});
test("per-object, per-action saved positions survive changing from one furniture action to another",()=>{
 const w=boot(),m=w.VLBuildingInterior,a=w.VLInteractionAdjust;
 const s=m.preset({w:6,d:6},"bathroom"),wc=s.items.find(x=>x.assetId==="wc");
 assert.ok(wc);
 const actions=m.types.wc.actions;
 assert.ok(actions.length>=2);
 const one=actions[0],two=actions[1];
 a.set(wc,one,{x:12,y:4,direction:"sw",layer:"front"},actions);
 a.set(wc,two,{x:-7,y:21,direction:"ne",layer:"behind"},actions);
 const reloaded=m.normalize(jsonRoundtrip(s),{w:6,d:6});
 const item=reloaded.items.find(x=>x.id===wc.id);
 assert.deepEqual(jsonRoundtrip(a.get(item,one)),
  {x:12,y:4,direction:"sw",layer:"front"});
 assert.deepEqual(jsonRoundtrip(a.get(item,two)),
  {x:-7,y:21,direction:"ne",layer:"behind"});
 m.action(reloaded,item.id,two);
 assert.equal(w.VLInteriorIso.actionAnchor(item).pixelOffsetX,-7);
 m.action(reloaded,item.id,one);
 assert.equal(w.VLInteriorIso.actionAnchor(item).pixelOffsetX,12);
});
test("new building is genuinely blank, while saved buildings can be reopened explicitly",()=>{
 const html=read("index.html"),ui=read("studio-interior-ui.js");
 assert.ok(!html.includes("if(saved.length)openSavedAsset(saved[0],{resume:true});"),
  "A new building should not auto-open the old toilet/last saved room.");
 assert.ok(html.includes("interiorUi?.reset();"),
  "New building must start with an empty interior, not an old toilet.");
 assert.ok(html.includes("openSavedAsset(a,{resume:true})"),
  "Existing saved rooms must still open when explicitly selected.");
 assert.ok(html.includes("interiorUi?.resumeSavedAdjustment?.()"),
  "Opening a saved building must restore its last adjusted object/action.");
 assert.ok(html.includes("lastAdjusted:inter.lastAdjusted||current?.lastAdjusted||null"),
  "Last saved action selection should be included in saved building metadata.");
 assert.ok(html.includes("const next=[asset,...saved.filter(x=>x.id!==asset.id)].slice(0,75)"),
  "Last saved building should be first in the Library, but not auto-opened.");
 assert.ok(html.includes("localStorage.getItem(KEY)"),
  "Browser save must be read back before claiming success.");
 assert.ok(ui.includes("adjustmentKey='';adjustmentDraft=null;\n  selectTab('actions');"),
  "Reopening the inspector must discard old unsaved preview offsets.");
 assert.ok(ui.includes("const data=serialize();"),
  "Do not report success without checking serialized action slots.");
 assert.ok(ui.includes("const confirmed=saved.actionSlots?"),
  "Do not report success without checking saved output data.");
 assert.ok(ui.includes("lastAdjusted={floor,itemId:item.id,actionId:item.actionId}"));
 assert.ok(ui.includes("TYPE DEFAULT"),"Show a visible reusable type default marker in Actions.");
 assert.ok(ui.includes("adjust.setDefault(item.assetId,item.actionId,expected"),
  "Save Adjustment should apply to the object TYPE, not a single toilet instance.");
 assert.ok(html.includes("migrateFromBuildings?.(saved)"),
  "Previously saved toilet adjustments should migrate into shared defaults.");
});
