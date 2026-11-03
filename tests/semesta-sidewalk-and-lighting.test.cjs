'use strict';
// node tests/semesta-sidewalk-and-lighting.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../world-builder'),win={};
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const files=['asset-catalog.js','pipeline-catalog.js','vegetation-catalog.js',
 'semesta-traffic-catalog.js','semesta-traffic.js','style-rules.js',
 'map-terrain.js','world-physics.js','map-schema.js','reference-city.js'];
for(const file of files)vm.runInNewContext(read(file),{window:win},{filename:file});
const traffic=win.VLSemestaTraffic,physics=win.VLWorldPhysics,style=win.VLWorldStyle;
const rect=[];
for(let c=0;c<=10;c++)for(const r of [1,7])rect.push({c,r,type:'sidewalk'});
for(let r=2;r<7;r++)for(const c of [0,10])rect.push({c,r,type:'sidewalk'});
const ringMap={terrain:{default:'grass',cells:rect}};
const ring=traffic.makeRoute(ringMap,3.5,1.5,'pedestrian','auto');
assert.ok(ring&&ring.continuous,'walkers need a closed route');
assert.equal(ring.points[0].x,ring.points.at(-1).x);
assert.equal(ring.points[0].z,ring.points.at(-1).z);
assert.ok(ring.turns>=4,'NPC must take corners around a city block');
let changes=0,last=null;
for(let d=0;d<ring.length*3;d+=.17){
 const p=traffic.sample(ring,d);
 assert.ok(traffic.allowed(ringMap,p.x,p.z,'pedestrian'),'never walk on road/grass');
 if(last){
  const move=Math.hypot(p.x-last.x,p.z-last.z);
  assert.ok(move<.175,'route must never teleport at its end or a corner');
  if(p.dx!==last.dx||p.dz!==last.dz)changes++;
 }
 last=p;
}
assert.ok(changes>=10,'direction changes at corners on each loop');
// A disconnected short sidewalk must cause a local U-turn, not a respawn.
const culdesac={terrain:{default:'grass',cells:[0,1,2,3,4].map(c=>({c,r:0,type:'sidewalk'}))}};
const out=traffic.makeRoute(culdesac,2.5,.5,'pedestrian','auto');
assert.ok(out?.continuous);
assert.equal(out.points[0].x,out.points.at(-1).x);
for(let d=0;d<out.length*2;d+=.19){
 const p=traffic.sample(out,d);
 assert.equal(p.z,.5);
}
// Props block sidewalk navigation without forcing agents into road cells.
const blocked=(c,r)=>!(c===10&&r===4);
const detour=traffic.makeRoute(ringMap,3.5,1.5,'pedestrian','auto',blocked);
assert.ok(detour?.continuous,'route remains a continuous retraced sidewalk walk');
for(let d=0;d<detour.length*2;d+=.2){
 const p=traffic.sample(detour,d);
 assert.ok(traffic.allowed(ringMap,p.x,p.z,'pedestrian'));
 assert.notEqual(Math.floor(p.x)+','+Math.floor(p.z),'10,4');
}
// The large reference city should generate real rectangular sidewalk circuits.
const cat=new Map(win.VLAssetCatalog.map(x=>[x.file,x]));
const city=win.VLReferenceCity.create(JSON.parse(read('world.json')),cat,style,win.VLMapSchema);
const walkers=city.objects.filter(o=>o.type==='pedestrian'||o.type==='crowd');
assert.ok(walkers.length>=4);
for(const o of walkers){
 const route=traffic.makeRoute(city.map,o.x,o.z,'pedestrian',o.motion?.direction);
 assert.ok(route?.continuous&&route?.turns>=4,o.id+' follows the connected sidewalks');
 assert.equal(route.points[0].x,route.points.at(-1).x);
 assert.equal(route.points[0].z,route.points.at(-1).z);
}
const art=read('semesta-traffic-art.js'),effects=read('semesta-world-effects.js'),
 builder=read('builder.js'),html=read('index.html');
assert.match(art,/function footRatio\(image,fallback=\.935\)/);
assert.match(art,/height=w\*\(imageHeight\/imageWidth\)\*VCOMP/);
assert.match(art,/function setGroundPivot\(original=false\)/);
assert.match(art,/function setGroundPivot\(original=false\)/);
assert.match(builder,/gfx\.setGroundPivot\?\.\(false\)/);
assert.match(builder,/sidewalkOpen=\(c,r\)=>/);
assert.match(builder,/agent\.root\.visible=!!agent\.route\|\|\(mode==='pedestrian'&&!!point\)/);
assert.match(effects,/function isStreetLamp\(/);
assert.match(effects,/function drawLampPixels\(/);
assert.match(effects,/function collectCharacterShadows\(/);
assert.match(effects,/getAgent\(o\.id\)/);
assert.ok(!effects.includes('createRadialGradient'),'no blurred vehicle lights');
assert.ok(!effects.includes('elapsed<.12'),'glow cannot be throttled 120 ms behind camera');
const script=html.match(/<script[^>]+src="([^"]+)"/g).join('\n');
assert.ok(script.includes('semesta-traffic.js?v='));
assert.ok(script.includes('semesta-traffic-art.js?v='));
assert.ok(script.includes('semesta-world-effects.js?v='));
console.log('Semesta continuous sidewalk / corner loops / no teleport / vehicle pivot / lighting PASS');
