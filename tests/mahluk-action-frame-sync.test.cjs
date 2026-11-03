"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs");
const root="world-builder/";
const bangun=fs.readFileSync(root+"bangun-ruang/index.html","utf8");
const world=fs.readFileSync(root+"index.html","utf8");
const preview=fs.readFileSync(root+"bangun-ruang/character-scale-preview.js","utf8");
const rig=fs.readFileSync(root+"pipeline-character-rig.js","utf8");
const bridge="virtual-life-asset-pipeline/action-frame-bridge.js";
assert.ok(bangun.includes(bridge),"Bangun Ruang must load shared action-frame storage");
assert.ok(world.includes(bridge),"Semesta must load shared action-frame storage");
assert.ok(bangun.indexOf(bridge)<bangun.indexOf("pipeline-character-rig.js"),
 "Action frame bridge must load before live character rig");
assert.ok(world.indexOf(bridge)<world.indexOf("pipeline-character-rig.js"),
 "Semesta must load action frame bridge before the rig");
for(const name of ["toilet","bathe","sleep"]){
 assert.ok(preview.includes(name),"Bangun preview missing "+name);
 assert.ok(rig.includes(name),"Semesta rig missing "+name);
}
assert.match(preview,/edits\?\.get\(actor\.profile,action,actor\.direction,frame\)/);
assert.match(preview,/edits\?\.offset\(actor\.profile,action\)/);
assert.match(rig,/g\.VLActionFrames\?\.get\(state\.profile,action,state\.direction,frame\)/);
assert.match(rig,/ctx\.drawImage\(edited\.pic,0,0,64,112\)/);
assert.ok(bangun.includes("event.key==='virtual-life-action-frame-edits-v1'"),
 "Bangun should redraw on edits made in Mahluk Hidup's other browser tab");
assert.ok(rig.includes("sleep:['sleep','sleep_seat','lie']"),
 "Human sleep_seat fallback must not override native character sleep");
assert.ok(preview.includes("iso?.drawSeatForeground?."),"Saved toilet/bed occlusion must remain");
assert.ok(rig.includes("const rearView=state.direction==='ne'||state.direction==='nw'"),
 "Semesta must distinguish rear camera views for backpack layering");
assert.ok(rig.includes('ctx.rect(0,56,64,56)'),
 "Semesta must not draw rear backpack over character head/neck");
assert.ok(preview.includes("const rearView=actor.direction==='ne'||actor.direction==='nw'"),
 "Bangun Ruang must preserve the same back-facing bag orientation");
assert.ok(preview.includes('ctx.rect(x,y+56*scale,drawWidth,(FRAME.h-56)*scale)'),
 "Bangun Ruang must mask rear backpack away from head and neck");
const builder=fs.readFileSync("world-builder/builder.js","utf8");
assert.ok(world.includes("virtual-life-asset-pipeline/action-template-bridge.js"),
 "Semesta must load same-origin saved action template bridge");
assert.ok(world.indexOf("action-template-bridge.js")<world.indexOf("pipeline-character-rig.js"),
 "Template registry must initialize before character rig");
assert.ok(builder.includes("window.VLActionTemplates?.list(actorId)"),
 "Semesta player Pose menu must list custom templates for the chosen actor");
assert.ok(builder.includes("opt.disabled=!action.ready"),
 "Drafts must never be playable in Semesta's Pose menu");
assert.ok(rig.includes("g.VLActionTemplates?.get(id,requested)"),
 "Saved template motion must be resolved before native fallback");
assert.ok(rig.includes("g.VLActionTemplates?.frame(who,action,state.direction,frame)"),
 "Semesta must draw authored frames for each direction and animation frame");
assert.ok(rig.includes("source:'unavailable'"),
 "Missing gameplay actions cannot falsely render native idle");
assert.ok(rig.includes("if(spec.unavailable)"),
 "Missing gameplay actions need visible UNAUTHORED display");
assert.ok(builder.includes("virtual-life-action-templates-v1")||builder.includes("window.VLActionTemplates?.frameKey"),
 "Semesta builder must observe action frame updates across tabs");
console.log("PASS Mahluk Hidup action edits consume same-origin storage in Bangun and Semesta without moving furniture");
