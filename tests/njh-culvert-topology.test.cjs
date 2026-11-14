'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..');
const raw=JSON.parse(fs.readFileSync(path.join(root,'world-builder/njh-map-preview/city/njh-semesta-map-draft1.with-pending-assets.city.json'),'utf8'));
const t=raw.record.document.map.terrain;
const w={};
vm.runInNewContext(fs.readFileSync(path.join(root,'world-builder/map-terrain.js'),'utf8'),{window:w,Map,Set,Math});
const map=w.VLMapTerrain;
test('all nine NJH road crossings are continuous under-road culverts, not painted road replacements',()=>{
 const before=JSON.stringify(t);
 const dict=map.dict(t),bridges=map.culverts(t,dict);
 assert.equal(bridges.length,9,'must detect every documented road-only gap between drain endpoints');
 const keys=new Set();
 for(const b of bridges){
  const key=b.axis+':'+b.from.c+','+b.from.r+'-'+b.to.c+','+b.to.r;
  assert.ok(!keys.has(key),'duplicate culvert '+key);keys.add(key);
  assert.equal(map.read(t,b.from.c,b.from.r,dict),'drain',key+' starting drain');
  assert.equal(map.read(t,b.to.c,b.to.r,dict),'drain',key+' ending drain');
  assert.equal(b.roadTiles.length,4,key+' four road tiles remain intact');
  for(const tile of b.roadTiles)
   assert.equal(map.read(t,tile.c,tile.r,dict),'road',key+' road surface must remain drivable');
  assert.ok(['c','r'].includes(b.axis));
  assert.equal(b.axis==='c',b.from.r===b.to.r);
  assert.equal(b.axis==='r',b.from.c===b.to.c);
 }
 assert.equal(JSON.stringify(t),before,'water connectivity lookup is read-only and never overwrites the city map');
});
test('no NJH drain end is disconnected after accounting for road underpasses',()=>{
 const dict=map.dict(t);
 const issues=t.cells.filter(x=>x.type==='drain'&&map.drainAxis(t,x.c,x.r,dict)==='isolated');
 assert.deepEqual(issues,[],'orphan drain cells: '+JSON.stringify(issues));
});
