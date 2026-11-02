/* Run with: node rebuild/gpt-version/tests/package-a-regression.cjs
 * Uses only Node core modules. Does not decrypt, start a server, or call the live Worker.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const src = fs.readFileSync(path.join(__dirname,'../package-a.js'),'utf8');
const context = {self:{},window:{},S2X:{sig:{off:0}},OUT_ON:false,console};
vm.runInNewContext(src,context,{filename:'package-a.js'});
assert.equal(typeof context.self.gptApplyA,'function');
context.extOK=(c,r)=>c>21&&c<23&&(r===32||r===36.95);
vm.runInNewContext('gptWorldV16()',context);
const v=context.window.__v16;
assert.ok(v);
const t0=1767225600000;
for(const [dt,expected] of [[1000,'busy'],[16000,'quiet'],[27000,'clear'],[37000,'quiet']])
  assert.equal(v.phase(t0+dt),expected);
for(const lane of [33.05,34.85])
  for(let dt=26000;dt<32000;dt+=100)
    assert.equal(v.hit(22.55,lane,t0+dt),null,'clear-phase must always be safe');
const names=new Set(),widths=new Set();let collisions=0,samples=0;
for(let dt=0;dt<60000;dt+=251){
  const cars=v.veh(t0+dt);
  assert.equal(cars.length,15);
  for(const car of cars){
    names.add(car.kind);
    widths.add(Math.round((car.c1-car.c0)*1000)/1000);
    assert.ok(car.c1>car.c0 && car.hw>=0.5 && car.hw<=0.85 && Number.isFinite(car.pr));
    samples++;
  }
  if(v.hit(22.55,33.05,t0+dt))collisions++;
}
assert.equal(names.size,15,'exactly 15 original car/rider kinds must appear over time');
for(const width of [1.3,1.55,2.6,2.9,3.1,3.4,6.6])
  assert.ok(widths.has(width),'missing exact sprite hitbox width: '+width);
assert.ok(collisions>0,'collision detection must detect a moving car');
for(const side of ['near','far']){
 const p=v.spawn(side,19.5);
 assert.ok(context.extOK(p.c,p.r),'spawn must avoid blockers at the curb');
}
assert.ok(src.includes('V16.backLaneA?me.r>33.24:me.r>33.56'),'native-lane depth hysteresis required');
assert.ok(src.includes('V16.laneA=V16.cars.filter'),'cache lane members instead of making SVG groups');
assert.ok(!src.includes("V16.gA.appendChild"),'never create a synthetic lane group');
assert.ok(src.includes('floor tap disabled'),'control A1 must stay enabled');
console.log('PASS — v16a Package A regression: '+samples+' traffic samples, '+collisions+' collision frames, both crossing lanes clear; hitboxes/respawn/layers verified.');
