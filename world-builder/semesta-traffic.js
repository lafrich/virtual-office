/* Semesta · deterministic street / sidewalk preview simulation.
 * No multiplayer state, persistence, network calls or real quest payouts.
 * Lane routes consist ONLY of painted matching terrain tiles.
 */
(function(g){
'use strict';
const validModes=['vehicle','pedestrian','crowd','quest_npc'];
const D={east:[1,0],west:[-1,0],south:[0,1],north:[0,-1]};
const key=(c,r)=>c+','+r;
let cache=null;
function index(terrain){
 if(cache?.cells===terrain.cells && cache?.terrain===terrain)return cache.index;
 const result=new Map((terrain.cells||[]).map(v=>[key(v.c,v.r),v.type]));
 cache={cells:terrain.cells,terrain,index:result};
 return result;
}
function kind(t,c,r,m){return m.get(key(c,r))?.toString()||t.default||'grass';}
function typeFor(mode){return mode==='vehicle'?'road':'sidewalk';}
function allowed(map,x,z,mode){
 if(mode==='quest_npc')return true;
 const t=map?.terrain||{default:'grass',cells:[]};
 return kind(t,Math.floor(x),Math.floor(z),index(t))===typeFor(mode);
}
function line(map,start,dx,dz,type){
 const t=map.terrain||{default:'grass',cells:[]},m=index(t);
 const c=Math.floor(start.x),r=Math.floor(start.z);
 if(kind(t,c,r,m)!==type)return null;
 let min=0,max=0;
 for(let i=1;i<=512;i++){
  if(kind(t,c-dx*i,r-dz*i,m)!==type)break;
  min=i;
 }
 for(let i=1;i<=512;i++){
  if(kind(t,c+dx*i,r+dz*i,m)!==type)break;
  max=i;
 }
 if(min+max<2)return null;
 const points=[];
 for(let i=-min;i<=max;i++)points.push({x:c+.5+dx*i,z:r+.5+dz*i});
 return {points,length:points.length,dx,dz};
}
function choose(map,x,z,mode,direction='auto'){
 const k=typeFor(mode);
 const seed={x,z};
 const vectors=(direction==='east'||direction==='west')?[[1,0]]:
  (direction==='north'||direction==='south')?[[0,1]]:[[1,0],[0,1]];
 const candidates=vectors.map(([dx,dz])=>line(map,seed,dx,dz,k)).filter(Boolean);
 if(!candidates.length)return null;
 candidates.sort((a,b)=>b.length-a.length);
 const best=candidates[0],backwards=direction==='west'||direction==='north';
 if(backwards)best.points.reverse();
 return best;
}
function makeRoute(map,x,z,mode,direction='auto'){
 if(!allowed(map,x,z,mode))return null;
 if(mode==='quest_npc')return {points:[{x,z}],edges:[],length:0,loop:true,stationary:true};
 const corridor=choose(map,x,z,mode,direction);
 if(!corridor)return null;
 const points=corridor.points.slice();
 // Vehicles drive forward on their selected straight road corridor.
 // At the end the simulation despawns them and queues a safe respawn at its
 // starting end; it never U-turns or teleports into another occupied lane.
 const wrap=true;
 let edges=[],length=0;
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1],len=Math.hypot(a.x-b.x,a.z-b.z);
  if(len>0){edges.push({a,b,length:len,from:length});length+=len;}
 }

 return {points,edges,length,wrap,loop:true,stationary:false,kind:mode};
}
function sample(route,distance){
 if(!route||route.stationary)return route?.points[0]?{...route.points[0],dx:0,dz:0}:null;
 if(!route.length)return null;
 const d=((distance%route.length)+route.length)%route.length;
 for(const e of route.edges)if(d<e.from+e.length){
  const t=Math.max(0,Math.min(1,(d-e.from)/e.length));
  return {x:e.a.x+(e.b.x-e.a.x)*t,z:e.a.z+(e.b.z-e.a.z)*t,
   dx:(e.b.x-e.a.x)/e.length,dz:(e.b.z-e.a.z)/e.length};
 }
 const last=route.edges[route.edges.length-1];
 return last?{x:last.b.x,z:last.b.z,dx:0,dz:0}:null;
}
function nearestDistance(route,point){
 if(!route||!route.edges.length)return 0;
 let nearest=Infinity,distance=0;
 for(const e of route.edges){
  const vx=e.b.x-e.a.x,vz=e.b.z-e.a.z;
  const t=Math.max(0,Math.min(1,((point.x-e.a.x)*vx+(point.z-e.a.z)*vz)/(e.length*e.length)));
  const x=e.a.x+vx*t,z=e.a.z+vz*t,sep=Math.hypot(point.x-x,point.z-z);
  if(sep<nearest){nearest=sep;distance=e.from+e.length*t;}
 }
 return distance;
}
function config(o){
 const kind=o.type==='vehicle'?'vehicle':o.type==='crowd'?'crowd':o.type==='quest_npc'?'quest_npc':'pedestrian';
 const mode=o.motion?.mode||typeFor(kind);
 return {kind,mode:o.motion?.mode|| (kind==='vehicle'?'road':kind==='quest_npc'?'idle':'sidewalk'),
  direction:D[o.motion?.direction]?o.motion.direction:'auto',
  speed:Math.min(10,Math.max(.2,Number(o.motion?.speed)|| (kind==='vehicle'?4:1.6))),
  enabled:o.motion?.enabled!==false,
  count:Math.min(12,Math.max(2,Math.round(Number(o.motion?.count)||5))),
  idleAction:o.motion?.idleAction||'idle'};
}
function spawnPosition(map,x,z,mode,radius=5){
 const t=map.terrain||{default:'grass',cells:[]},m=index(t),required=typeFor(mode);
 const c=Math.floor(x),r=Math.floor(z);
 if(kind(t,c,r,m)===required)return {x:c+.5,z:r+.5};
 let best=null,dist=Infinity;
 for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){
  if(kind(t,c+dx,r+dz,m)!==required)continue;
  const d=Math.hypot(dx,dz);
  if(d<dist){dist=d;best={x:c+dx+.5,z:r+dz+.5};}
 }
 return best;
}
g.VLSemestaTraffic=Object.freeze({validModes,D,index,kind,allowed,choose,makeRoute,sample,
 nearestDistance,config,spawnPosition});
})(window);
