"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const g={};vm.runInNewContext(fs.readFileSync("world-builder/semesta-traffic.js","utf8"),{window:g});
const t=g.VLSemestaTraffic;
const map={terrain:{default:"grass",cells:[]}};
for(let c=0;c<18;c++)for(const r of [1,2])
 map.terrain.cells.push({c,r,type:"road"});
for(let r=3;r<19;r++)for(const c of [30,31])
 map.terrain.cells.push({c,r,type:"road"});
const heading=(route)=>t.routeHeading(route,0);
assert.equal(heading(t.makeRoute(map,5.5,1.5,"vehicle","auto")),"east",
 "First road lane should drive forward in auto");
assert.equal(heading(t.makeRoute(map,5.5,2.5,"vehicle","auto")),"west",
 "Second adjacent road lane should drive opposite in auto");
assert.equal(heading(t.makeRoute(map,30.5,8.5,"vehicle","auto")),"north",
 "Vertical lane 30 alternates opposite to adjacent lane 31");
assert.equal(heading(t.makeRoute(map,31.5,8.5,"vehicle","auto")),"south");
for(const start of ["east","west","south","north"]){
 const flipped=t.flipDirection(start);
 assert.ok(flipped&&flipped!==start);
 assert.equal(t.flipDirection(flipped),start);
}
const original=t.makeRoute(map,5.5,1.5,"vehicle","auto");
assert.equal(t.flipDirection("auto",original,3),"west",
 "Flip from auto must use actual current travel direction");
const reversing=t.makeRoute(map,8.5,1.5,"vehicle","west");
const nearest=t.nearestDistance(reversing,{x:8.5,z:1.5});
const live=t.sample(reversing,nearest);
assert.ok(Math.abs(live.x-8.5)<.01,"Reversed route remains at actual moving car location");
assert.equal(live.dx,-1,"Reversing drives WEST, not merely mirroring a static image");
assert.equal(t.flipDirection("auto",t.makeRoute(map,5.5,2.5,"vehicle","auto"),0),"east");
assert.equal(t.flipDirection("auto",null),null,"Auto cannot guess an axis if there's no road");
const builder=fs.readFileSync("world-builder/builder.js","utf8");
const html=fs.readFileSync("world-builder/index.html","utf8");
const css=fs.readFileSync("world-builder/xp.css","utf8");
const art=fs.readFileSync("world-builder/semesta-traffic-art.js","utf8");
assert.match(html,/id="vehicleFlipDirection"/);
assert.match(html,/id="vehicleHeadingLabel"/);
assert.match(html,/id="rotationField"/);
assert.match(builder,/\$\('vehicleFlipDirection'\)\.onclick=/);
assert.match(builder,/const opposite=traffic\.flipDirection\(traffic\.config\(o\)\.direction/);
assert.match(builder,/agent\.distance=traffic\.nearestDistance\(agent\.route,before\)/,
 "Reverse must not teleport driving bus to historical spawn");
assert.match(builder,/agent\.graphic\?\.update\(view,camera,agent\.root\)/,
 "Flip must immediately draw the corresponding direction sprite");
assert.match(builder,/\$\('rotateL'\)\.hidden=isVehicle;\$\('rotateR'\)\.hidden=isVehicle;/);
assert.match(builder,/\$\('rotationField'\)\.hidden=isVehicle;/);
assert.match(builder,/item\(\)\.type==='vehicle'&&prop==='rotation'/,
 "Numeric rotation should be no-op for vehicles");
assert.match(builder,/if\(item\(\)\?\.type==='vehicle'\)setVehicleDirection/,
 "The Direction dropdown must also preserve the live vehicle position");
assert.match(art,/if\(dir!==direction\|\|frame!==displayedFrame\)\{direction=dir;show\(dir,frame\);\}/,
 "The canonical 4-direction car/motor sprite renderer must stay active");
assert.match(css,/#vehicleFlipDirection/);
console.log("PASS transport bidirectional auto-lanes, manual Flip Arah, real sprite updates, no-teleport reverse, vehicle-only rotation removal");
