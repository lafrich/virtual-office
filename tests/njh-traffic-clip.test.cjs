'use strict';
/* Bug 22 Nov 2026 "mobil masuk ke dalam bangunan": every vehicle on the NJH preview map is driven
 * along its real runtime route (semesta-traffic.js) with its real ground box and sprite rectangle;
 * none may clip a building/tree/door, leave the road mid-route, look half-buried under a nearer
 * building roof, or be unable to respawn. See tools/njh-traffic-clip-check.cjs. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const root=path.resolve(__dirname,'..');
const {check,spriteRect,coverage,box}=require('../tools/njh-traffic-clip-check.cjs');
const CITY=path.join(root,'world-builder/njh-map-preview/city/njh-semesta-map-draft1.with-pending-assets.city.json');

test('NJH preview map: no traffic clip (T1-T6 all zero)',()=>{
 const r=check(CITY);
 assert.ok(r.vehicles.length>=4,'all vehicles routed');
 assert.deepEqual(r.fails.map(f=>[f.rule,f.vehicle,f.hit]),[]);
 for(const v of r.vehicles.filter(v=>!v.parked))assert.ok(v.maxCover<.25,v.id+' sprite never >= 25% under a nearer building ('+v.maxCover+')');
});

test('traffic clip checker catches the 22 Nov cases on the old lanes',()=>{
 const raw=JSON.parse(fs.readFileSync(CITY,'utf8'));
 const objs=raw.record.document.objects,by=Object.fromEntries(objs.map(o=>[o.id,o]));
 // the lanes before the fix: sedan on z=43.5 behind the south house row, taxi z=73.5 into the
 // Angsana at the west end, Maxim westbound z=74.5 (respawn outside worldBounds)
 Object.assign(by['sedan'],{z:43.5});by['sedan'].motion.direction='auto';
 Object.assign(by['vehicle-luy67o'],{z:73.5});by['vehicle-luy67o'].motion.direction='auto';
 Object.assign(by['vehicle-jff4pv'],{z:74.5});by['vehicle-jff4pv'].motion.direction='auto';
 const tmp=path.join(os.tmpdir(),'njh-traffic-clip-old-'+process.pid+'.city.json');
 fs.writeFileSync(tmp,JSON.stringify(raw));
 try{
  const r=check(tmp),has=(rule,v)=>r.fails.some(f=>f.rule===rule&&f.vehicle===v);
  assert.ok(has('T4','sedan'),'sedan half hidden under house roofs');
  assert.ok(has('T1','vehicle-luy67o'),'taxi into the tree');
  assert.ok(has('T6','vehicle-luy67o'),'taxi cannot respawn');
  assert.ok(has('T6','vehicle-jff4pv'),'maxim cannot respawn');
 }finally{fs.rmSync(tmp,{force:true});}
});

test('parked vehicle on a building lot fails (T1)',()=>{
 const raw=JSON.parse(fs.readFileSync(CITY,'utf8'));
 const objs=raw.record.document.objects;
 const mart=objs.find(o=>o.id==='njh-minimarket');
 objs.push({id:'probe-parked',type:'vehicle',vehicleId:'sedan_red',x:mart.x,z:mart.z,scale:1,motion:{enabled:false,mode:'road'}});
 const tmp=path.join(os.tmpdir(),'njh-traffic-clip-parked-'+process.pid+'.city.json');
 fs.writeFileSync(tmp,JSON.stringify(raw));
 try{
  const r=check(tmp);
  assert.ok(r.fails.some(f=>f.vehicle==='probe-parked'&&f.rule==='T1'&&f.hit==='njh-minimarket'));
 }finally{fs.rmSync(tmp,{force:true});}
});

test('iso geometry helpers',()=>{
 const b=box(0,0,3,1,0,1);
 assert.deepEqual([b.maxX-b.minX,b.maxZ-b.minZ],[1,3],'vertical heading swaps the box');
 const r=spriteRect(0,0,2,2,1);
 assert.ok(r.y1===0&&r.y0<0,'pivot at the bottom draws upward');
 assert.equal(coverage(r,[{id:'a',r}]).f,1);
});
