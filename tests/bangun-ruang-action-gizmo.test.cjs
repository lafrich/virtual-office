"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const gizmo=require("../world-builder/bangun-ruang/action-gizmo.js");
const adjustment=require("../world-builder/bangun-ruang/action-adjustment.js");
const root=path.join(__dirname,"../world-builder/bangun-ruang");
const load=name=>fs.readFileSync(path.join(root,name),"utf8");

test("gizmo axes/centre/rotation ring are real, touch-sized targets",()=>{
 const c={x:180,y:180};
 assert.equal(gizmo.hit(c,{x:180,y:180},"move"),"xy");
 assert.equal(gizmo.hit(c,{x:215,y:180},"move"),"x");
 assert.equal(gizmo.hit(c,{x:180,y:145},"move"),"y");
 assert.equal(gizmo.hit(c,{x:180-38,y:180+38},"move"),"rotate");
 assert.equal(gizmo.hit(c,{x:234,y:180},"move"),"x","axis wins ring overlap");
 assert.equal(gizmo.hit(c,{x:234,y:180},"rotate"),"rotate");
 assert.equal(gizmo.hit(c,{x:180,y:180},"rotate"),"rotate");
 assert.equal(gizmo.hit(c,{x:25,y:25},"move"),null);
});
test("C4D-like screen move honours X/Y lock, free move and 1/4/8 pixel snap",()=>{
 const b={x:7,y:-3,direction:"auto",layer:"behind"};
 assert.deepEqual(gizmo.dragged(b,"x",15,33,1),{...b,x:22});
 assert.deepEqual(gizmo.dragged(b,"y",15,33,1),{...b,y:30});
 assert.deepEqual(gizmo.dragged(b,"xy",15,33,1),{...b,x:22,y:30});
 assert.equal(gizmo.dragged(b,"x",14,22,4).x,20);
 assert.equal(gizmo.dragged(b,"y",4,22,8).y,16);
 assert.equal(gizmo.normalizeSnap(5),1);
 assert.deepEqual(gizmo.center({x:100,y:120},"sleep"),{x:100,y:102});
 assert.deepEqual(gizmo.center({x:100,y:120},"sit"),{x:100,y:76});
});
test("ring gestures select original four V6B facings without sprite distortion",()=>{
 const o={center:{x:200,y:200},direction:"se"};
 assert.equal(gizmo.rotateGesture(o,{x:254,y:200},{x:200,y:254},"sw"),"sw");
 assert.equal(gizmo.rotateGesture(o,{x:254,y:200},{x:200,y:146},"sw"),"ne");
 assert.equal(gizmo.rotate("auto","sw",1),"nw");
 assert.equal(gizmo.rotate("sw","sw",-1),"se");
 assert.equal(gizmo.rotate("nw","sw",2),"se");
 assert.equal(gizmo.degrees("auto","sw"),0);
 assert.equal(gizmo.degrees("nw","sw"),90);
 assert.equal(gizmo.degrees("se","sw"),270);
 const item={id:"chair",actionId:"sit",assetId:"chair"};
 assert.ok(adjustment.set(item,"sit",{x:19,y:-11,direction:gizmo.rotate("auto","sw",1),layer:"front"},["sit"]));
 const reloaded=JSON.parse(JSON.stringify(item));
 assert.deepEqual(adjustment.get(reloaded,"sit"),{x:19,y:-11,direction:"nw",layer:"front"});
});
test("Bangun Ruang renders gizmo only during adjustment; no destructive rotations",()=>{
 const html=load("index.html"),scale=load("character-scale-preview.js"),
  ui=load("studio-interior-ui.js"),helper=load("action-gizmo.js");
 for(const id of ["actionModeMove","actionModeRotate","actionTransformSnap",
  "actionTurnLeft","actionTurnRight","actionTurnValue"])
  assert.ok(html.includes('id="'+id+'"'),"missing "+id);
 assert.ok(html.indexOf("action-gizmo.js?v=")<html.indexOf("character-scale-preview.js?v="),
  "gizmo helper should load before renderer");
 assert.ok(scale.includes("GIZMO.draw(ctx,actor.gizmoOrigin"));
 assert.ok(scale.includes("if(actor.adjusting&&GIZMO)"),
  "gizmo must not show in gameplay, saved artwork or regular preview");
 assert.ok(scale.includes("GIZMO.dragged("));
 assert.ok(scale.includes("GIZMO.rotateGesture("));
 assert.ok(scale.includes("api.onAdjustmentChange?.(actor.adjustmentDraft)"));
 assert.ok(ui.includes("api.getScaleController?.()?.setTransformMode?.(effective)"));
 assert.ok(ui.includes("gizmo.rotate(adjustmentDraft.direction,base,delta)"));
 assert.ok(ui.includes("api.saveAsset?.()"),"rotation should persist through existing saved building");
 assert.ok(ui.includes("key==='e'||key==='r'"),"keyboard mode switch should exist");
 assert.ok(ui.includes("arrowleft"),"arrow key nudge should exist");
 assert.ok(helper.includes("ctx.arc(x,y,RADIUS"),"render a visible transform ring");
 assert.ok(!scale.includes("ctx.rotate("),"actor sprite must use authored directional V6B frames");
});
