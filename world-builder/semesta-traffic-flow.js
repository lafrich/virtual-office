/* Semesta · one-direction traffic queue with safe end-of-road respawn.
 * Preview simulation only; neither network position nor saved city positions
 * are mutated. Cars use lane arc length rather than stopping on each other.
 */
(function(g){
'use strict';
const GAP=.65;
function lengthOf(o){
 const spec=g.VLSemestaCatalog?.vehicle(o?.vehicleId);
 return Math.max(.9,Number(spec?.editorFootprint?.[0]||spec?.footprint?.[0])||2.9);
}
function laneKey(route){
 const p=route?.points;
 if(!p?.length)return '';
 const a=p[0],b=p[p.length-1];
 return [a.x,a.z,b.x,b.z].join(':');
}
function sameLane(a,b){
 return !!a?.route&&!!b?.route&&laneKey(a.route)===laneKey(b.route);
}
function visibleCar(car){
 return !!car&&car.kind==='vehicle'&&car.root?.visible!==false&&!car.awaitingRespawn&&!!car.route;
}
function spaceAhead(car,cars){
 if(!car?.route)return 0;
 let available=Infinity;
 for(const other of cars){
  if(other===car||!visibleCar(other)||!sameLane(car,other))continue;
  const delta=other.distance-car.distance;
  if(delta<=0)continue;
  const distanceNeeded=(lengthOf(car.record)+lengthOf(other.record))/2+GAP;
  available=Math.min(available,delta-distanceNeeded);
 }
 return Math.max(0,available);
}
function spawnClear(car,cars){
 if(!car?.route||car.route.length<=0)return false;
 for(const other of cars){
  if(other===car||!visibleCar(other)||!sameLane(car,other))continue;
  const safeDistance=(lengthOf(car.record)+lengthOf(other.record))/2+GAP;
  // Any vehicle whose rear is still in the starting area blocks respawn.
  if(other.distance<safeDistance)return false;
 }
 return true;
}
function pace(car,cars,speed,dt,limit){
 if(!car?.route||car.awaitingRespawn||dt<=0)return 0;
 const roadRemaining=Math.max(0,car.route.length-car.distance);
 const headway=spaceAhead(car,cars);
 const cap=limit==null||limit===undefined?Infinity:Number(limit);
 const light=Number.isFinite(cap)?Math.max(0,cap):Infinity;
 return Math.max(0,Math.min(speed*dt,roadRemaining,headway,light));
}
g.VLSemestaTrafficFlow=Object.freeze({
 GAP,lengthOf,laneKey,sameLane,visibleCar,spaceAhead,spawnClear,pace
});
})(window);
