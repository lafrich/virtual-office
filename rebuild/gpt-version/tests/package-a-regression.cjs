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
const loaded=[];
const pre={self:{},window:{},console,OUT_ON:true,
  S2X:{made:true,cfg:{levels:Array.from({length:17},(_,i)=>[i,{file:'level'+i+'.png'}])},cr:[]},
  EXT:{built:true,gC:{},cars:[],yard:{r1:32},blk:[]},
  WT:{on:true},CV:{on:false},FMI:{on:false},SPEC:false,
  me:{c:22,r:31,forceAnim:null},XC:{skip:null},XG:{curbF:36.3},
  S2XA:'assets/street2/xing/',
  xcImg:url=>loaded.push(url),s2xFar:()=>{},s2xFarDepth:()=>{},
  performance:{now:()=>1000},extOK:()=>true};
vm.createContext(pre);
vm.runInContext(src,pre);
vm.runInContext('gptWorldV16()',pre);
let bursts=[];
for(let i=0;i<7;i++){const before=loaded.length;pre.window.__s2xTick(.016);bursts.push(loaded.length-before);}
assert.equal(bursts.join(','),'3,3,3,3,3,2,0','preload should be spread over 6 frames and not repeat');
assert.ok(src.includes("w.style.animation='none'"),'disable CSS animation once the deterministic renderer owns traffic');
assert.ok(src.includes("w.setAttribute('transform',transform)"),'vehicle visual and hitbox must derive from one clock');
assert.ok(src.includes("const on = !S2L.st || !S2L.bag || s2lReady(o.s)"),'offline Loak prop sparkle must be visible');
assert.ok(src.includes("const band=0.16"),'far-side props must use painter hysteresis');
assert.ok(src.includes("n._gptFront"),'NPC/prop fronts must use stable depth ordering');
assert.ok(src.includes("var oldk=S2X.lv.k,edge="),'baked occlusion layer must use hysteresis');
assert.ok(src.includes("S2X.cfg.region.lane=[21.85,24.15,37.6,50]"),'deep original alley corridor must be walkable');
assert.ok(src.includes("V16.fxQueue.shift()"),'item sparkle frames must be preloaded');
const vehicleWindow={};
const lane={};
const rows=[];
let animationCalls=0;
for(let i=0;i<15;i++)rows.push({_vk:'old',style:{},attrs:{},parentNode:lane,
   getAnimations(){animationCalls++;return []},setAttribute(name,val){this.attrs[name]=val}});
const trafficContext={self:{},window:vehicleWindow,console,
  S2X:{made:true,cfg:{levels:[],region:{lane:[22.15,23.85,37.6,50]}},cr:[],sig:{off:0},p:{}},
  EXT:{built:true,gC:lane,cars:rows,blk:[],yard:{r1:32}},
  WT:{on:true},CV:{on:false},FMI:{on:false},SPEC:false,
  me:{c:22,r:31,forceAnim:null},XC:{},XG:{curbF:36.3},
  S2XA:'assets/street2/xing/',S2LA:'assets/street2/loak/',S2L:{props:[]},
  OUT_ON:true,xcImg:()=>{},s2xFar:()=>{},s2xFarDepth:()=>{},
  vSprSet:(w,k)=>{w._vk=k},vRidSet:(w,k)=>{w._vk=k},
  performance:{now:()=>1000},Date:{now:()=>1767225605000},extOK:()=>true};
vm.createContext(trafficContext);
vm.runInContext(src,trafficContext);
vm.runInContext('gptWorldV16()',trafficContext);
trafficContext.window.__s2xTick(.016);
const samplesLive=trafficContext.window.__v16.veh(1767225605000);
for(let i=0;i<rows.length;i++){
  const w=rows[i],v=samplesLive[i],dir=[0,1,2,3,7,8,9,10].includes(i)?1:-1;
  assert.equal(w.style.animation,'none');
  assert.equal(w.parentNode,lane,'native SVG layer must be preserved');
  const xy=/^translate\\(([-\\d.]+) ([-\\d.]+)\\)$/.exec(w.attrs.transform);
  assert.ok(xy,'missing deterministic SVG transform');
  assert.ok(Math.abs(+xy[1]-((dir>0?-448:832)+(dir>0?1280:-1280)*v.pr))<=.26,'render/collision x mismatch');
}
assert.equal(animationCalls,0,'CSSAnimation query must not cause periodic visual jumps');
assert.equal(trafficContext.S2X.cfg.region.lane.join(','),'21.85,24.15,37.6,50');


assert.ok(src.includes('V16.laneA=V16.cars.filter'),'cache lane members instead of making SVG groups');
assert.ok(!src.includes("V16.gA.appendChild"),'never create a synthetic lane group');
assert.ok(src.includes('floor tap disabled'),'control A1 must stay enabled');
console.log('PASS — v16a Package A regression: '+samples+' traffic samples, '+collisions+' collision frames, both crossing lanes clear; hitboxes/respawn/layers verified.');
