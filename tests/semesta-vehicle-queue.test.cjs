'use strict';
// Run: node tests/semesta-vehicle-queue.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../world-builder');
const w={};
const context=vm.createContext({window:w});
for(const file of ['semesta-traffic-catalog.js','semesta-traffic.js','semesta-traffic-flow.js']){
 vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
}
const traffic=w.VLSemestaTraffic,queue=w.VLSemestaTrafficFlow;
const cells=[];
for(let c=0;c<50;c++)for(const r of [2,3])cells.push({c,r,type:'road'});
const map={unbounded:true,terrain:{default:'grass',cells}};
const route=traffic.makeRoute(map,15.5,2.5,'vehicle');
assert.ok(route&&route.length===49);
assert.equal(route.wrap,true,'vehicle leaves at the road end for a safe respawn');
assert.ok(route.points.every(p=>p.z===2.5),'vehicle stays straight on its lane');
const car=(id,vehicleId,d)=>({
 id,kind:'vehicle',record:{id,type:'vehicle',vehicleId},
 route,distance:d,root:{visible:true},awaitingRespawn:false
});
const front=car('front','sedan_red',14),back=car('back','sedan_teal',10);
const length=(queue.lengthOf(front.record)+queue.lengthOf(back.record))/2+queue.GAP;
assert.ok(Math.abs(queue.spaceAhead(back,[front,back])-(4-length))<1e-9);
assert.equal(queue.pace(back,[front,back],10,1),4-length,'rear car decelerates when near the leader');
front.distance+=2;
assert.ok(queue.pace(back,[front,back],10,1)>4-length,'rear starts moving when leader clears');
front.distance=3;
assert.equal(queue.spawnClear(back,[front,back]),false,'spawn blocked while another car is near start');
front.distance=9;
assert.equal(queue.spawnClear(back,[front,back]),true,'spawn opens when rear of leader has passed');
const rider=car('motor','gojek',0),bus=car('bus','bus_transjakarta',1.6);
assert.equal(queue.spawnClear(rider,[rider,bus]),false,'large buses require a larger safe respawn gap');
bus.distance=7;
assert.equal(queue.spawnClear(rider,[rider,bus]),true);
const cars=[car('a','sedan_red',16),car('b','sedan_teal',11),car('c','gojek',6),car('d','mpv_silver',0)];
const cycles=new Map(cars.map(a=>[a.id,0]));
// Simulate many runs of the *same* queue/respawn rules used in Semesta.
for(let frame=0;frame<24000;frame++){
 for(const a of cars){
  if(a.awaitingRespawn){
   if(queue.spawnClear(a,cars)){
    a.root.visible=true;a.awaitingRespawn=false;a.distance=0;
   }
   continue;
  }
  if(!a.root.visible)continue;
  const advance=queue.pace(a,cars,a.id==='c'?3.1:4,.05);
  if(a.distance+advance>=route.length-.0001){
   a.root.visible=false;a.awaitingRespawn=true;a.distance=0;
   cycles.set(a.id,cycles.get(a.id)+1);
  }else a.distance+=advance;
 }
 const moving=cars.filter(a=>a.root.visible&&!a.awaitingRespawn)
  .sort((a,b)=>a.distance-b.distance);
 for(let i=1;i<moving.length;i++){
  const behind=moving[i-1],ahead=moving[i];
  const need=(queue.lengthOf(behind.record)+queue.lengthOf(ahead.record))/2+queue.GAP;
  assert.ok(ahead.distance-behind.distance>=need-.0001,
   'following cars must maintain a safe headway');
 }
}
for(const [id,count] of cycles)assert.ok(count>=8,id+' must continue respawning without permanent gridlock');
const engine=fs.readFileSync(path.join(root,'builder.js'),'utf8');
assert.match(engine,/updateVehicle\(agent,record,cfg,dt,blockers,live,cars\)/);
assert.match(engine,/function attemptVehicleRespawn/);
assert.match(engine,/function reconcileVehicleSpawns/);
assert.match(engine,/function recycleVehicle/);
assert.match(engine,/function movingOverlap/);
assert.match(engine,/if\(agent\.stalledSeconds>6\)/);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.match(html,/semesta-traffic-flow\.js\?v=/);
console.log('Semesta car queues / straight-road respawn / headway PASS:',Object.fromEntries(cycles));
