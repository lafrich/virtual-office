'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../world-builder');
const w={};
const context=vm.createContext({window:w,global:w});
for(const file of ['semesta-traffic-catalog.js','semesta-traffic.js','semesta-traffic-flow.js','semesta-traffic-lights.js']){
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
}
const TL=w.VLSemestaTrafficLights;
const flow=w.VLSemestaTrafficFlow;

function jakartaCells(){
 const horizontal=[[16,19],[42,45],[72,75],[98,101]];
 const vertical=[[-34,-31],[-10,-7],[18,21],[46,49],[71,74]];
 const cells=[];
 for(const [r0,r1] of horizontal)for(let r=r0;r<=r1;r++)for(let c=-48;c<76;c++)cells.push({c,r,type:'road'});
 for(const [c0,c1] of vertical)for(let c=c0;c<=c1;c++)for(let r=-8;r<105;r++)cells.push({c,r,type:'road'});
 return cells;
}
function demoCrossing(){
 const cells=[];
 for(let c=-30;c<=40;c++)for(const r of [10,11,12,13])cells.push({c,r,type:'road'});
 for(let r=-30;r<=40;r++)for(const c of [10,11,12,13])cells.push({c,r,type:'road'});
 [[9,9],[14,9],[9,14],[14,14]].forEach(([c,r])=>cells.push({c,r,type:'sidewalk'}));
 const map={unbounded:true,terrain:{default:'grass',cells}};
 return {map,seeded:TL.seedObjects(map)};
}
function straight(x0,z0,x1,z1){
 const len=Math.hypot(x1-x0,z1-z0);
 const a={x:x0,z:z0,dx:(x1-x0)/len,dz:(z1-z0)/len};
 const b={x:x1,z:z1,dx:(x1-x0)/len,dz:(z1-z0)/len};
 return {length:len,points:[a,b],edges:[{a,b,length:len,from:0}]};
}
function distNear(route,value,axis){
 for(let d=0;d<route.length;d+=0.05){
  const p=TL.sampleRoute(route,d);
  if(Math.abs((axis==='z'?p.z:p.x)-value)<0.08)return d;
 }
 return 0;
}
function car(id,vehicleId,route,distance){
 return {id,kind:'vehicle',record:{id,type:'vehicle',vehicleId},route,distance,root:{visible:true},awaitingRespawn:false};
}

test('deterministic shared cycle: never both greens, ped is all-red',()=>{
 const split=TL.splitCycle(32);
 assert.equal(split.cycle,32);
 const sum=split.phases.reduce((a,p)=>a+p.seconds,0);
 assert.ok(Math.abs(sum-32)<1e-9);
 assert.equal(split.phases.map(p=>p.name).join(','),'NS_GREEN,NS_YELLOW,PED,EW_GREEN,EW_YELLOW,PED');
 for(let t=0;t<320;t+=0.25){
  const phase=TL.phaseAt(t,32);
  assert.equal(TL.phaseAt(t+32,32),phase);
  const ns=TL.vehicleSignal(phase,'ns');
  const ew=TL.vehicleSignal(phase,'ew');
  assert.ok(!(ns==='green'&&ew==='green'),'both green at t='+t);
  if(phase==='PED'){
   assert.equal(ns,'red');assert.equal(ew,'red');
   assert.equal(TL.pedSignal(phase),'walk');
  }else{
   assert.equal(TL.pedSignal(phase),'wait');
  }
 }
 assert.equal(TL.clampCycle(3),12);
 assert.equal(TL.clampCycle(400),120);
 assert.equal(TL.moduleSettings(null).enabled,true);
 assert.equal(TL.moduleSettings({modules:{trafficLights:{enabled:false,cycleSeconds:8}}}).cycleSeconds,12);
});

test('Jakarta grid yields 20 crossings and 6 seeded sidewalk poles',()=>{
 const cells=jakartaCells();
 const boxes=TL.findIntersectionBoxes(cells);
 assert.equal(boxes.length,20);
 const picked=TL.pickIntersectionBoxes(boxes,6);
 assert.equal(picked.length,6);
 const seeded=TL.seedObjects({terrain:{cells}});
 assert.equal(seeded.boxes.length,6);
 assert.ok(seeded.objects.length>=12,'expected four or two poles per crossing, got '+seeded.objects.length);
 const roads=new Set(cells.map(c=>c.c+','+c.r));
 for(const o of seeded.objects){
  assert.equal(o.collision,false);
  assert.equal(o.blocking,'no');
  assert.equal(o.type,'sprite');
  assert.match(o.asset,/^traffic_light_/);
  const c=Math.floor(o.x),r=Math.floor(o.z);
  assert.equal(roads.has(c+','+r),false,'pole on roadway '+c+','+r);
 }
});

test('stopAhead is Infinity on green or with no lights, finite on red before the line',()=>{
 const {map,seeded}=demoCrossing();
 assert.ok(seeded.objects.length>0);
 const ns=straight(11.5,-20,11.5,40);
 const approach=distNear(ns,0,'z');
 const agent=car('ns1','sedan_red',ns,approach);
 const green=TL.stopAhead(agent,map,seeded.objects,'NS_GREEN');
 const red=TL.stopAhead(agent,map,seeded.objects,'EW_GREEN');
 assert.equal(green,Infinity);
 assert.ok(red<20,'red cap should reach the stop line, got '+red);
 assert.equal(TL.stopAhead(agent,map,[], 'EW_GREEN'),Infinity);
 const past=car('ns2','sedan_red',ns,distNear(ns,12,'z'));
 assert.equal(TL.stopAhead(past,map,seeded.objects,'EW_GREEN'),Infinity);
});

test('player may leave an intersection during ped wait but cannot newly enter',()=>{
 const {map,seeded}=demoCrossing();
 const outside={x:8,z:8},inside={x:12,z:12},nextInside={x:12.2,z:12};
 assert.deepEqual(TL.constrainPlayer(outside,{x:12,z:12},map,seeded.objects,'NS_GREEN'),outside);
 assert.deepEqual(TL.constrainPlayer(inside,nextInside,map,seeded.objects,'NS_GREEN'),nextInside);
 assert.deepEqual(TL.constrainPlayer(outside,{x:12,z:12},map,seeded.objects,'PED'),{x:12,z:12});
});

test('N simulated minutes: 0 collisions, no deadlock, bus clears the box on green',()=>{
 const {map,seeded}=demoCrossing();
 const ns=straight(11.5,-25,11.5,45);
 const ew=straight(-25,11.5,45,11.5);
 const cars=[
  car('nsA','sedan_red',ns,distNear(ns,-8,'z')),
  car('nsB','sedan_teal',ns,distNear(ns,-14,'z')),
  car('bus','bus_transjakarta',ns,distNear(ns,-20,'z')),
  car('ewA','mpv_silver',ew,distNear(ew,-8,'x')),
  car('ewB','gojek',ew,distNear(ew,-13,'x'))
 ];
 const seconds=180,dt=0.05,cycle=32;
 let collisions=0,deadlocks=0,allStill=0,prev='';
 let busReached=false,nsEntered=false,ewEntered=false,illegal=0;
 const box={minX:10,maxX:14,minZ:10,maxZ:14};
 const inBox=p=>p.x>=box.minX&&p.x<=box.maxX&&p.z>=box.minZ&&p.z<=box.maxZ;
 for(let t=0;t<seconds;t+=dt){
  const phase=TL.phaseAt(t,cycle);
  for(const a of cars){
   if(a.awaitingRespawn){
    if(flow.spawnClear(a,cars)){a.awaitingRespawn=false;a.root.visible=true;a.distance=0;}
    continue;
   }
   const cap=TL.stopAhead(a,map,seeded.objects,phase);
   const speed=a.id==='bus'?3.2:4;
   const adv=flow.pace(a,cars,speed,dt,cap);
   if(a.distance+adv>=a.route.length-0.0001){
    a.root.visible=false;a.awaitingRespawn=true;a.distance=0;
    continue;
   }
   a.distance+=adv;
   const pos=TL.sampleRoute(a.route,a.distance);
   if(a.id==='bus'&&pos.z>=20)busReached=true;
   if(inBox(pos)){
    if(a.route===ns)nsEntered=true;
    if(a.route===ew)ewEntered=true;
    const sig=TL.vehicleSignal(phase,a.route===ns?'ns':'ew');
    // Already-inside cars may finish during yellow/ped; new presence during the opposite green is illegal.
    if(sig==='green'||phase==='PED'||sig==='yellow'){/* allowed to clear */}
    else illegal++;
   }
  }
  const moving=cars.filter(a=>a.root.visible&&!a.awaitingRespawn).sort((a,b)=>{
   if(a.route!==b.route)return String(a.id).localeCompare(b.id);
   return a.distance-b.distance;
  });
  for(let i=0;i<moving.length;i++){
   for(let j=i+1;j<moving.length;j++){
    if(!flow.sameLane(moving[i],moving[j]))continue;
    const need=(flow.lengthOf(moving[i].record)+flow.lengthOf(moving[j].record))/2+flow.GAP;
    if(Math.abs(moving[j].distance-moving[i].distance)<need-0.0001)collisions++;
   }
  }
  const key=cars.map(c=>c.id+':'+(c.awaitingRespawn?'R':c.distance.toFixed(2))).join('|');
  const canMove=cars.some(c=>!c.awaitingRespawn&&c.distance<c.route.length-1);
  if(key===prev&&canMove)allStill+=dt;else allStill=0;
  prev=key;
  if(allStill>cycle+6){deadlocks++;allStill=0;}
 }
 assert.equal(collisions,0,'cars overlapped on a lane');
 assert.equal(deadlocks,0,'queue deadlocked for more than a full cycle');
 assert.equal(illegal,0,'a car sat in the box on a conflicting red');
 assert.ok(busReached,'TransJakarta bus never cleared the intersection');
 assert.ok(nsEntered&&ewEntered,'both approaches should get a green that admits traffic');
});

test('catalog registers two placeable lights and builder/html wire the module',()=>{
 const entries=TL.catalogEntries();
 assert.equal(entries.length,2);
 assert.ok(entries.every(e=>e.file&&e.source==='traffic-light'&&e.collision===false));
 const pngs=['sw','se'].flatMap(f=>['red','yellow','green','ped'].map(l=>
  path.join(root,'legacy-assets/traffic-light','traffic_light_'+f+'_'+l+'.png')));
 for(const f of pngs)assert.ok(fs.existsSync(f),f);
 const engine=fs.readFileSync(path.join(root,'builder.js'),'utf8');
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const schema=fs.readFileSync(path.resolve(__dirname,'../shared/gameplay-schema.js'),'utf8');
 const panel=fs.readFileSync(path.resolve(__dirname,'../jiwa/mechanics-panel.js'),'utf8');
 assert.match(html,/semesta-traffic-lights\.js\?v=/);
 assert.match(engine,/vehicleLightCap\(agent\)/);
 assert.match(engine,/constrainPlayer/);
 assert.match(engine,/constrainPedestrian/);
 assert.match(engine,/seedTrafficLights/);
 assert.match(schema,/trafficLights/);
 assert.match(panel,/TRAFFIC LIGHTS/);
});
