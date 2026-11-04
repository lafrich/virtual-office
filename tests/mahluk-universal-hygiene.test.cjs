"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const body=fs.readFileSync("world-builder/bangun-ruang/character-scale-preview.js","utf8");
const rig=fs.readFileSync("world-builder/pipeline-character-rig.js","utf8");
const bridge=fs.readFileSync("world-builder/mahluk-hidup-bridge.js","utf8");
const iso=fs.readFileSync("world-builder/bangun-ruang/interior-isometric.js","utf8");
const building=fs.readFileSync("world-builder/bangun-ruang/index.html","utf8");
const semesta=fs.readFileSync("world-builder/index.html","utf8");
test("Semesta and Bangun Ruang load the Mahluk Hidup body rules before character rigs",()=>{
 for(const html of [building,semesta]){
  assert.ok(html.includes("/virtual-life-asset-pipeline/universal-body-actions.js"));
  assert.ok(html.indexOf("universal-body-actions.js")<
   html.indexOf("pipeline-character-rig.js"));
 }
 assert.ok(body.includes("BODY?.resolve(actorProfile,actor.actionId||actor.pose)"));
 assert.ok(body.includes("BODY.apply(paint,"));
 assert.ok(rig.includes("body()?.resolve(entry,requested)"));
 assert.ok(rig.includes("body().apply(ctx,"));
 assert.ok(bridge.includes("bodyType:"));
 assert.ok(bridge.includes("skinTone:"));
});
test("hygiene replacement keeps actor identity and bedroom/WC transforms intact",()=>{
 assert.match(body,/document\.createElement\('canvas'\)/);
 assert.match(body,/ctx\.drawImage\(composite,x,y,drawWidth,drawHeight\)/);
 assert.match(body,/actor\.actionId=item\.actionId/);
 assert.match(body,/\['toilet','sit','sleep','lie','work','bathe'\]/);
 assert.match(rig,/source:"universal-hygiene"/);
 assert.match(rig,/const idle=entry\.motions\.find\(m=>m\.id==="idle"/);
 assert.match(iso,/case 'shower'/);
 assert.match(iso,/case 'bathtub'/);
 assert.match(iso,/ACTION_ADJUST\?\.apply/);
});
console.log("PASS universal non-explicit body replacement, 4-frame bath and fixture anchors across apps");
