"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const legacy={id:"legacy_theodore",sheet:"media/theodore-new.png",motions:[
 {id:"walk",available:true,frames:6,row:0,frame_ms:[140,140,140,140,140,140],loop:true},
 {id:"idle",available:true,frames:4,row:4,frame_ms:[250,250,250,250],loop:true},
 {id:"sit",available:true,frames:4,row:12,frame_ms:[200,200,200,200],loop:true}
]};
const game={
 VLPipelineAssets:{characters:[{id:"theodore"}],character:()=>"/old-game-assets/theodore-old.png"},
 VLMahlukHidup:{
  has:id=>id==="legacy_theodore"||id==="ichsan",
  get:id=>id==="legacy_theodore"?legacy:null,
  list:()=>[legacy],
  url:p=>"/virtual-life-asset-pipeline/"+p,
 },
 VLActionTemplates:{
  get:(actor,action)=>actor==="legacy_theodore"&&action==="clock_in"?
   {actor,action,ready:true,frames:4,frameMs:210,loop:true,
    objectLayer:"behind",rotation:90,expression:"sleepy"}:null,
  frame:(actor,action,dir,index)=>actor==="legacy_theodore"&&action==="clock_in"?
   "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB":null
 },
 VLActionFrames:{get:()=>null}
};
vm.runInNewContext(fs.readFileSync("world-builder/pipeline-character-rig.js","utf8"),{window:game});
const rig=game.VLCharacterRig;
assert.equal(rig.canonical("theodore"),"legacy_theodore");
const walk=rig.resolve("theodore","walk",false);
assert.equal(walk.url,"/virtual-life-asset-pipeline/media/theodore-new.png");
assert.equal(walk.source,"mahluk-hidup");
assert.ok(!walk.url.includes("old-game-assets"));
assert.equal(rig.resolve("theodore","toilet",false).mode,"sit",
 "Native toilet must use the actual seated motion, never idle");
const saved=rig.resolve("theodore","clock_in",false);
assert.equal(saved.source,"template");
assert.equal(saved.mode,"clock_in");
assert.equal(saved.frames,4);
assert.equal(saved.objectLayer,"behind");
assert.equal(saved.rotation,90);
assert.equal(saved.expression,"sleepy");
assert.deepEqual(Array.from(saved.durations),[210,210,210,210]);
const pending=rig.resolve("theodore","sell",false);
assert.equal(pending.source,"unavailable");
assert.equal(pending.unavailable,true);
assert.notEqual(pending.mode,"idle");
assert.equal(rig.resolve("theodore",null,false).mode,"idle");
console.log("PASS Semesta runtime: rebuilt Theodore, real native sit, saved playable action template, honest unauthored motion");
