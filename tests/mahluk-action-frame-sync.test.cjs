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
console.log("PASS Mahluk Hidup action edits consume same-origin storage in Bangun and Semesta without moving furniture");
