"use strict";
const test=require("node:test"),assert=require("node:assert/strict"),
 fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
const root=path.join(__dirname,"../world-builder");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
function boot(){
 const w={VLGameProportions:{character:{scale:1},building:{wallHeight:128},toilet:{seatedPoint:[.61,.69],sitFacing:"sw"}}};
 for(const p of ["bangun-ruang/action-adjustment.js","bangun-ruang/interior-model.js",
  "bangun-ruang/interior-isometric.js"])vm.runInNewContext(read(p),{window:w});
 return w;
}
test("interaction adjustment is bounded and does not mutate character base",()=>{
 const g=boot(),a=g.VLInteractionAdjust;
 assert.equal(a.normalize({x:999,y:-999}).x,120);
 assert.equal(a.normalize({x:999,y:-999}).y,-120);
 assert.equal(a.normalize({direction:"wrong",layer:"wrong"}).direction,"auto");
 assert.equal(a.normalize({direction:"ne",layer:"front"}).layer,"front");
 const item={id:"wc",assetId:"wc",actionId:"pee",c:1,r:1,rotation:0};
 assert.equal(a.set(item,"pee",{x:12,y:-4,direction:"se",layer:"front"},["pee","poop"]),true);
 assert.equal(a.set(item,"invented",{x:5},["pee","poop"]),false);
 assert.equal(a.get(item,"poop").x,0);
 assert.equal(a.get(item,"pee").y,-4);
 assert.equal(a.reset(item,"pee"),true);
 assert.equal(a.get(item,"pee").x,0);
});
test("saved pose alignment survives native interior normalize, switch action, and Semesta action slots",()=>{
 const g=boot(),m=g.VLBuildingInterior,a=g.VLInteractionAdjust;
 const s=m.preset({w:5,d:5},"bathroom"),wc=s.items.find(i=>i.assetId==="wc");
 assert.ok(wc);
 assert.ok(a.set(wc,"use_toilet",{x:16,y:-11,direction:"ne",layer:"front"},m.types.wc.actions));
 assert.ok(a.set(wc,"poop",{x:-3,y:5,direction:"sw",layer:"behind"},m.types.wc.actions));
 const saved=JSON.parse(JSON.stringify(s));
 const loaded=m.normalize(saved,{w:5,d:5});
 const prop=loaded.items.find(x=>x.id===wc.id);
 assert.equal(a.get(prop,"use_toilet").x,16);
 assert.equal(a.get(prop,"poop").y,5);
 assert.equal(a.get(prop,"pee").y,0);
 const seat=g.VLInteriorIso.actionAnchor(prop),raw=g.VLInteriorIso.actionAnchor(prop,{raw:true});
 assert.equal(seat.pixelOffsetX,16);
 assert.equal(seat.pixelOffsetY,raw.pixelOffsetY-11);
 assert.equal(seat.direction,"ne");
 assert.equal(seat.objectLayer,"front");
 assert.equal(raw.direction,"sw");
 m.action(loaded,prop.id,"poop");
 const slot=m.slots(loaded).find(x=>x.id===prop.id);
 assert.equal(slot.actionAdjustment.x,-3);
 assert.equal(slot.actionAdjustment.direction,"sw");
 assert.equal(slot.actionAdjustments.use_toilet.x,16);
 assert.equal(slot.actionAdjustments.poop.layer,"behind");
 const adjusted=g.VLInteriorIso.actionAnchor(prop);
 assert.equal(adjusted.pixelOffsetX,-3);
 assert.equal(adjusted.pixelOffsetY,raw.pixelOffsetY+5);
 // Restore from JSON after export (real browser localStorage round trip).
 const roundTrip=m.normalize(JSON.parse(JSON.stringify(loaded)),{w:5,d:5});
 assert.equal(m.slots(roundTrip).find(x=>x.id===prop.id).actionAdjustments.use_toilet.x,16);
});
test("same fixture rotation keeps actor offsets relative to fresh docking point",()=>{
 const g=boot(),m=g.VLBuildingInterior,a=g.VLInteractionAdjust;
 const s=m.preset({w:6,d:6},"bedroom"),bed=s.items.find(i=>i.assetId==="bed");
 assert.ok(bed);a.set(bed,"sleep",{x:-8,y:9,direction:"auto",layer:"behind"},m.types.bed.actions);
 const raw0=g.VLInteriorIso.actionAnchor(bed,{raw:true}),adjusted0=g.VLInteriorIso.actionAnchor(bed);
 assert.equal(adjusted0.pixelOffsetX,-8);
 assert.equal(adjusted0.pixelOffsetY,raw0.pixelOffsetY+9);
 m.rotate(s,bed.id,1);
 const raw1=g.VLInteriorIso.actionAnchor(bed,{raw:true}),adjusted1=g.VLInteriorIso.actionAnchor(bed);
 assert.equal(adjusted1.pixelOffsetX,-8);
 assert.equal(adjusted1.pixelOffsetY,raw1.pixelOffsetY+9);
 assert.notEqual(raw0.direction,raw1.direction);
});
test("Semesta consumes alignment metadata from the saved building asset",()=>{
 const g=boot(),m=g.VLBuildingInterior,a=g.VLInteractionAdjust;
 const scene=m.preset({w:5,d:5},"bedroom"),bed=scene.items.find(x=>x.assetId==="bed");
 a.set(bed,"sleep",{x:14,y:-7,direction:"sw",layer:"behind"},m.types.bed.actions);
 const slots=m.slots(scene),image="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB";
 const views=Object.fromEntries(["sw","se","ne","nw"].map(d=>[d,{url:image,size:[300,400],pivot:[150,340]}]));
 const asset={id:"br-action-align",name:"Room",config:{w:5,d:5,collision:"yes"},
  interactive:true,enterable:true,views,interior:{format:"virtual-life-interiors-v1",
    activeFloor:1,floors:[scene]},actionSlots:slots,interactions:["sleep"]};
 const bridge={VLAssetCatalog:[]};
 vm.runInNewContext(read("bangun-ruang/semesta-bridge.js"),{
  window:bridge,localStorage:{getItem:()=>JSON.stringify([asset])},console
 });
 const entry=bridge.VLAssetCatalog.find(x=>x.id==="br-action-align");
 assert.ok(entry);
 const slot=entry.actionSlots.find(x=>x.id===bed.id);
 assert.equal(slot.actionAdjustment.x,14);
 assert.equal(slot.actionAdjustment.y,-7);
 assert.equal(slot.actionAdjustment.direction,"sw");
 assert.equal(slot.actionAdjustments.sleep.x,14);
});
test("Bangun Ruang UI exposes drag, nudge, preview, and persisted save, not old external Action Editor",()=>{
 const html=read("bangun-ruang/index.html"),scale=read("bangun-ruang/character-scale-preview.js"),
 ui=read("bangun-ruang/studio-interior-ui.js");
 for(const id of ["actionAdjustmentEditor","actionAdjustX","actionAdjustY","actionAdjustDirection",
  "actionAdjustLayer","actionAdjustPreview","actionAdjustSave","actionAdjustReset",
  "actionNudgeLeft","actionNudgeRight","actionNudgeUp","actionNudgeDown"])
  assert.ok(html.includes('id="'+id+'"'),"Missing control "+id);
 assert.ok(html.includes("action-adjustment.js?v="));
 assert.ok(ui.includes("api.saveAsset?.()"),"Adjustment should persist into the canonical building library");
 assert.ok(ui.includes("updateAdjustmentFromDrag"),"UI should receive drag feedback");
 assert.ok(scale.includes("canvas.addEventListener('pointermove'"),"Drag must work in isometric preview");
 assert.ok(scale.includes("actor.adjusting"),"Drag should be restricted to adjustment mode");
 assert.ok(!scale.includes("window.open(target.href"),"No external Action Editor for fixture alignment");
});
