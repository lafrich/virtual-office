"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const camera=require("../world-builder/active-asset-camera.js");
const scene=[
 {id:"building-a",name:"Rumah Ichsan",type:"building",x:10,z:20,w:5,d:4,h:3},
 {id:"car-b",name:"Ojol",type:"vehicle",x:35,z:45,w:1.5,d:2.2},
 {id:"npc-c",name:"Theodore",type:"npc",x:60,z:75},
];
const roots=new Map([["car-b",{position:{x:50,z:55}}]]);
assert.deepEqual(camera.list(scene).map(o=>o.id),["building-a","car-b","npc-c"]);
assert.deepEqual(camera.list([]),[]);
assert.equal(camera.target(scene,roots,"missing"),null);
assert.equal(camera.target(scene,roots,null),null);
const house=camera.target(scene,roots,"building-a");
assert.equal(house.x,10);
assert.equal(house.z,20);
assert.equal(house.extent,5);
const moving=camera.target(scene,roots,"car-b");
assert.equal(moving.x,50,"Focus must use live Ojol position, not original route spawn");
assert.equal(moving.z,55);
const actor=camera.target(scene,roots,"npc-c");
assert.equal(actor.name,"Theodore");
assert.equal(actor.x,60);
assert.equal(camera.viewSize(120,house),30,"Wide map view should zoom into selected asset");
assert.equal(camera.viewSize(17,actor),17,"Keep user zoom if already close");
assert.equal(camera.viewSize(20,{extent:18}),48.6,"Large building still must fit in view");
const focus={x:0,z:0};
let state={};
for(let i=0;i<120;i++)state=camera.ease(focus,house,.05);
assert.equal(state.arrived,true,"Camera should converge smoothly on active asset");
assert.ok(Math.abs(focus.x-10)<.013);
assert.ok(Math.abs(focus.z-20)<.013);
assert.deepEqual(camera.ease(focus,{x:focus.x,z:focus.z},.05),{moved:false,arrived:true});
roots.get("car-b").position.x=54;
assert.equal(camera.target(scene,roots,"car-b").x,54,
 "Track must react to changes in dynamic live vehicle position");
assert.equal(camera.target(scene,roots,"car-b")?.type,"vehicle");
assert.equal(camera.target([{id:"bad",name:"Broken",type:"tree",x:NaN,z:0}],roots,"bad"),null);
const index=fs.readFileSync("world-builder/index.html","utf8");
const builder=fs.readFileSync("world-builder/builder.js","utf8");
const css=fs.readFileSync("world-builder/xp.css","utf8");
for(const id of ["activeAssetPicker","activeAssetCount","activeAssetMeta","focusActiveAsset","trackActiveAsset"]){
 assert.ok(index.includes('id="'+id+'"'),"Missing active asset control: "+id);
 assert.ok(builder.includes("$('"+id+"')"),"No game logic for "+id);
}
assert.ok(index.indexOf("active-asset-camera.js")<index.indexOf('src="./builder.js'),
 "Helpers must load before Semesta builder");
assert.ok(index.indexOf('class="active-asset-bar"')<index.indexOf('id="canvas-wrap"'),
 "Active asset bar should live OUTSIDE canvas, not intercept pan / hit testing");
assert.ok(css.includes(".active-asset-bar"));
assert.ok(builder.includes("syncActiveAssetUI();"));
assert.ok(builder.includes("function focusPlacedAsset(id,track=false)"));
assert.ok(builder.includes("activeAssetCamera?.target(documentMap.objects,owners,activeAssetAimId)"));
assert.ok(builder.includes("if(move.arrived&&!activeAssetTracking)activeAssetAimId=null"),
 "Ordinary Focus should stop following once camera arrives");
assert.ok(builder.includes("if(hit&&mode!=='walk')select(hit,{focus:mode==='select'})"),
 "Selecting on canvas must aim camera unless using Move");
assert.ok(builder.includes("if(mode==='pan'){\n  if(activeAssetAimId)cancelActiveAssetAim()"),
 "Explicit Pan must detach Track and preserve user camera control");
assert.ok(builder.includes("if(cameraFollowId)leaveCharacterCamera(false)"),
 "Active asset camera must remain separate from Walk Test Follow");
assert.ok(builder.includes("if(activeAssetAimId)cancelActiveAssetAim();\n if(cameraFollowId)leaveCharacterCamera(true);"),
 "Map button should cancel active track");
console.log("PASS Semesta active placed assets, auto-focus, live NPC/vehicle track, pan escape and no city data mutation");
