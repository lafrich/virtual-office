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
test("Bangun Ruang keeps character pose gizmo and uses furniture H/V flip handles",()=>{
 const html=load("index.html"),scale=load("character-scale-preview.js"),
  ui=load("studio-interior-ui.js"),helper=load("action-gizmo.js");
 for(const id of ["actionTransformSnap","actionTurnLeft","actionTurnRight",
  "actionTurnValue","actionUndo"])
  assert.ok(html.includes('id="'+id+'"'),"missing "+id);
 for(const obsolete of ["actionModeMove","actionModeRotate"])
  assert.ok(!html.includes('id="'+obsolete+'"'),
   "tool buttons were intentionally removed for two-tap object selection");
 assert.ok(html.indexOf("action-gizmo.js?v=")<html.indexOf("character-scale-preview.js?v="),
  "gizmo helper should load before renderer");
 assert.ok(scale.includes("GIZMO.draw(ctx,actor.gizmoOrigin"));
 assert.ok(scale.includes("if(actor.adjusting&&actor.transformSelected&&GIZMO)"),
  "character gizmo must not show in gameplay or saved artwork");
 assert.ok(scale.includes("GIZMO.dragged("));
 assert.ok(scale.includes("GIZMO.rotateGesture("));
 assert.ok(scale.includes("api.onAdjustmentChange?.(actor.adjustmentDraft)"));
 assert.ok(ui.includes("api.getScaleController?.()?.setTransformMode?.(effective)"));
 assert.ok(ui.includes("gizmo.rotate(adjustmentDraft.direction,base,delta)"));
 assert.ok(ui.includes("api.saveAsset?.()"),"adjustments persist in the saved building");
 assert.ok(ui.includes("key==='e'||key==='r'"));
 assert.ok(ui.includes("arrowleft"));
 assert.ok(helper.includes("ctx.arc(x,y,RADIUS"),"character pose rotation ring stays available");
 assert.ok(!scale.includes("ctx.rotate("),"actor sprite uses native V6B facing frames");

 // Furniture is selected on canvas; only then does its own direct gizmo appear.
 assert.ok(ui.includes("function drawObjectGizmo()"));
 assert.ok(ui.includes("gizmo.drawObject(ctx,p,"));
 assert.ok(ui.includes("const handle=gizmo.hitObject(center,p)"));
 assert.ok(ui.includes("if(handle==='flipX'||handle==='flipY')"));
 assert.ok(ui.includes("recordUndo(before)"));
 assert.ok(ui.includes("function tapActionObject(event)"));
 assert.ok(ui.includes("const same=id===actionTapTarget&&id===selected"));
 assert.ok(ui.includes("objectGizmoActive&&beginObjectDrag(e)"));
});
test("furniture gizmo exposes move X/Y/centre and two separate flip controls",()=>{
 const center={x:180,y:180},points=gizmo.objectHandles(center);
 assert.equal(gizmo.hitObject(center,points.x),"x");
 assert.equal(gizmo.hitObject(center,points.y),"y");
 assert.equal(gizmo.hitObject(center,center),"xy");
 assert.equal(gizmo.hitObject(center,points.flipX),"flipX");
 assert.equal(gizmo.hitObject(center,points.flipY),"flipY");
 assert.equal(gizmo.hitObject(center,{x:0,y:0}),null);
});

test("furniture directional nudge controls use grid movement and undo",()=>{
 const html=load("index.html"),ui=load("studio-interior-ui.js");
 for(const direction of ["Up","Down","Left","Right"])
  assert.ok(html.includes('id="moveSelected'+direction+'"'));
 assert.ok(ui.includes("function nudgeSelected(direction)"));
 assert.ok(ui.includes("model.move(current,item.id,item.c+delta[0],item.r+delta[1])"));
 // Down from the upper-right tile of a 2×2 isometric floor must reach
 // the adjacent bottom/centre tile, not jump across two grid axes.
 assert.ok(ui.includes("const offsets={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]}"));
 assert.ok(!ui.includes("down:[1,1]"));
 const moves={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]};
 assert.deepEqual([1+moves.down[0],0+moves.down[1]],[1,1]);
 for(const [dc,dr] of Object.values(moves))assert.equal(Math.abs(dc)+Math.abs(dr),1);
 assert.ok(ui.includes("recordUndo(before)"));
});
