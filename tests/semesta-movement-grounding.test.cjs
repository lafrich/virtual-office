'use strict';
// Run: node tests/semesta-movement-grounding.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../world-builder');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const win={},ctx=vm.createContext({window:win});
for(const name of ['asset-catalog.js','pipeline-catalog.js','vegetation-catalog.js',
 'semesta-traffic-catalog.js','semesta-traffic.js','style-rules.js',
 'map-terrain.js','world-physics.js','map-schema.js','reference-city.js']){
 vm.runInContext(read(name),ctx,{filename:name});
}
const catalog=new Map(win.VLAssetCatalog.map(x=>[x.file,x]));
const style=win.VLWorldStyle,physics=win.VLWorldPhysics,traffic=win.VLSemestaTraffic;
const doc=win.VLReferenceCity.create(JSON.parse(read('world.json')),catalog,style,win.VLMapSchema);
const movers=doc.objects.filter(o=>o.type==='pedestrian'||o.type==='crowd');
assert.ok(movers.length>=4);
const blockers=doc.objects.filter(o=>o.collision!==false&&o.blocking!=='no'&&
 (!['vehicle','pedestrian','crowd','quest_npc'].includes(o.type)||o.type==='quest_npc'));
for(const o of movers){
 const boxes=doc.objects.filter(x=>x.id!==o.id&&x.collision!==false&&x.blocking!=='no'&&
  !['vehicle','pedestrian','crowd','marker'].includes(x.type))
  .map(x=>physics.area(x,catalog,style));
 const walkable=(c,r)=>{
  const area={minX:c+.18,maxX:c+.82,minZ:r+.18,maxZ:r+.82};
  return !boxes.some(box=>physics.intersect(area,box));
 };
 const point=traffic.spawnPosition(doc.map,o.x,o.z,'pedestrian',8,walkable);
 const route=traffic.makeRoute(doc.map,point.x,point.z,'pedestrian','auto',walkable);
 assert.ok(route?.continuous,'must follow closed sidewalk route: '+o.id);
 const count=o.type==='crowd'?5:1;
 for(let i=0;i<count;i++){
  let distance=i*route.length/count;
  let state=traffic.sample(route,distance),progress=0,blocked=0;
  for(let tick=0;tick<1200;tick++){
   const d=(distance+.075)%route.length,p=traffic.sample(route,d);
   const side=.14+(o.type==='crowd'?i%3*.035:0);
   const shifted={x:p.x-p.dz*side,z:p.z+p.dx*side};
   const actor={type:'pedestrian',id:o.id+':'+i,x:state.x,z:state.z,scale:1};
   const candidate=traffic.allowed(doc.map,shifted.x,shifted.z,'pedestrian')&&
    physics.check(actor,shifted,blockers,doc.map,catalog,style,new Map()).ok?
    shifted:{x:p.x,z:p.z};
   if(physics.check(actor,candidate,blockers,doc.map,catalog,style,new Map()).ok){
    distance=d;state=candidate;progress++;
   }else blocked++;
  }
  assert.equal(blocked,0,'NPC cannot permanently block behind other people: '+o.id);
  assert.equal(progress,1200,'walker moves every simulation tick: '+o.id);
 }
}
const renderer=read('semesta-traffic-art.js'),builder=read('builder.js');
assert.match(renderer,/wheelGround\?\.contact\(image,fallback\)/);
assert.match(renderer,/height=w\*\(imageHeight\/imageWidth\)\*VCOMP/);
assert.match(renderer,/mesh\.position\.y=wheelGround\?\.pivotHeight\(height,contact\.ratio\)/);
assert.match(builder,/gfx\.setGroundPivot\?\.\('fitted'\)/);
assert.match(builder,/const side=\.14\+\(isCrowd\?\(i%3\)\*\.035:0\)/);
assert.match(builder,/const shifted=\{x:p\.x-p\.dz\*side,z:p\.z\+p\.dx\*side\}/);
const walkBlock=builder.slice(builder.indexOf("const isCrowd=record.type==='crowd',n=isCrowd?agent.parts.length:1;"),
 builder.indexOf('\n }\n}',builder.indexOf("const isCrowd=record.type==='crowd',n=isCrowd?agent.parts.length:1;")));
assert.ok(!walkBlock.includes('movingOverlap('),'small NPCs must not deadlock against each other');
console.log('Semesta walkers + crowd move for 1200 steps / all vehicle pivots corrected: PASS');
