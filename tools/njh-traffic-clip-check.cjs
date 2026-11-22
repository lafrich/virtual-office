#!/usr/bin/env node
'use strict';
/* NJH traffic clip check (preview, read-only). Bug 22 Nov 2026: "mobil masuk ke dalam bangunan".
 * Static layout checkers never moved a car, and reviews used stills, so a car that slides
 * behind/into a house roof, noses into a tree at the end of its road, or a parked car on a lot
 * was never caught. This tool drives every vehicle the way the runtime does and fails on:
 *  T1 ground clip: at any point of its route (sampled every STEP tiles) the vehicle's real ground
 *     box (length = max(catalog footprint, natural sprite width * PX), width = footprint depth,
 *     rotated to the heading) intersects a static solid (building, tree, prop) footprint
 *  T2 door/use clip: that box covers a door use tile, a door front tile, an interactable use
 *     point, a spawn or home spawn (0.65 actor box)
 *  T3 off-road: the box (minus a 0.15 tolerance) covers a tile that is not road while the
 *     vehicle is still inside the world (sidewalk, plaza, lot, grass, drain, water)
 *  T4 "looks inside a building": in the fixed 2:1 iso camera the vehicle sprite rectangle
 *     (natural px * PX, pivot from the catalog) is covered >= COVER of its area by the sprite
 *     rectangles of buildings that are nearer to the camera (the car is drawn half hidden under
 *     a roof/wall). Uses the same billboard depth (x+z) as the renderer.
 *  T5 parked vehicles (type vehicle with motion disabled, or sprites tagged njh-parked /
 *     parkir asset): same T1-T4 tests at their authored spot.
 *  T6 respawn: the route start fails the runtime physics check (worldBounds or a solid), so the
 *     vehicle never comes back after its first pass (westbound/northbound starts at the world edge)
 *  W1 (warning, engine) the car reaches the world edge before its route ends, so the runtime
 *     freezes it for up to 6 s at the edge before recycling it.
 *  W2 (warning, engine) car body overhangs a non-road tile within half a car of a route end
 *  W3 (warning) passes a door front step that is itself a road tile (kerb-side door)
 * Routes come from the real runtime (semesta-traffic.js spawnPosition + makeRoute, mode vehicle);
 * footprints from style-rules.js / world-physics.js with the catalog snapshot
 * (world-builder/njh-map-preview/catalog-snapshot.json when present, else tools/njh-catalog-snapshot.json).
 * CLI: node tools/njh-traffic-clip-check.cjs [city.json] [--json] [--root <repo>]
 * Exit 1 on any T1-T5 failure.
 */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const args=process.argv.slice(2);
const rootArg=args.indexOf('--root');
const ROOT=rootArg>=0?path.resolve(args[rootArg+1]):path.resolve(__dirname,'..');
const WB=path.join(ROOT,'world-builder');
const PREVIEW=path.join(WB,'njh-map-preview');
const CITY_DEFAULT=path.join(PREVIEW,'city/njh-semesta-map-draft1.with-pending-assets.city.json');
const STEP=.1,COVER=.25,ROAD_TOL=.15;
const PX=Math.SQRT2/64,COS30=Math.sqrt(3)/2,SIN30=.5;
const DECAL=/selokan_|zebra_cross|vegetation:overlay|vegetation:prop_|rumput_kota|aspal_patch/;
const ACTORS=new Set(['avatar','npc','pedestrian','crowd','quest_npc']);
function runtime(){
 const window={};
 const ctx=vm.createContext({window,globalThis:window,Map,Set,Math,Number,Array,Object,JSON,WeakMap,String,console});
 for(const n of ['style-rules.js','map-terrain.js','world-physics.js','semesta-traffic.js','semesta-traffic-catalog.js'])
  vm.runInContext(fs.readFileSync(path.join(WB,n),'utf8'),ctx,{filename:n});
 return {style:window.VLWorldStyle,physics:window.VLWorldPhysics,traffic:window.VLSemestaTraffic,cat:window.VLSemestaCatalog};
}
function snapshot(){
 for(const p of [path.join(PREVIEW,'catalog-snapshot.json'),path.join(ROOT,'tools/njh-catalog-snapshot.json'),path.join(__dirname,'njh-catalog-snapshot.json')]){
  if(fs.existsSync(p))return JSON.parse(fs.readFileSync(p,'utf8'));
 }
 throw new Error('catalog-snapshot.json not found');
}
const unwrap=raw=>raw?.record?.document||raw?.document||raw;
const inter=(a,b,e=1e-5)=>a.minX<b.maxX-e&&a.maxX>b.minX+e&&a.minZ<b.maxZ-e&&a.maxZ>b.minZ+e;
function box(x,z,len,wid,dx,dz){
 const vertical=Math.abs(dz)>Math.abs(dx);
 const w=vertical?wid:len,d=vertical?len:wid;
 return {minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2};
}
// iso screen space (world units): sx along (x-z), sy down-screen along (x+z); height y up
const screen=(x,z)=>({sx:(x-z)/Math.SQRT2,sy:(x+z)/Math.SQRT2*SIN30});
function spriteRect(x,z,wWorld,hWorld,pivotRatio){
 const s=screen(x,z),h=hWorld*COS30;
 return {x0:s.sx-wWorld/2,x1:s.sx+wWorld/2,y0:s.sy-h*pivotRatio,y1:s.sy+h*(1-pivotRatio)};
}
function coverage(r,occ){
 if(!occ.length)return {f:0,by:[]};
 const N=24;let hit=0;const by=new Map();
 for(let i=0;i<N;i++)for(let j=0;j<N;j++){
  const px=r.x0+(i+.5)/N*(r.x1-r.x0),py=r.y0+(j+.5)/N*(r.y1-r.y0);
  const o=occ.find(o=>px>=o.r.x0&&px<=o.r.x1&&py>=o.r.y0&&py<=o.r.y1);
  if(o){hit++;by.set(o.id,(by.get(o.id)||0)+1);}
 }
 return {f:hit/(N*N),by:[...by.entries()].sort((a,b)=>b[1]-a[1]).map(e=>e[0])};
}
function check(cityPath=CITY_DEFAULT){
 const {style,physics,traffic,cat}=runtime();
 const snap=snapshot();
 const catalog=new Map(snap.assets.map(a=>[a.file,a]));
 const doc=unwrap(JSON.parse(fs.readFileSync(cityPath,'utf8')));
 let meta={};try{meta=JSON.parse(fs.readFileSync(path.join(PREVIEW,'njh-map-meta.json'),'utf8'));}catch(e){}
 const map=JSON.parse(JSON.stringify(doc.map));map.unbounded=false;
 const B=map.worldBounds||(meta.bounds?{minX:meta.bounds.minC,maxX:meta.bounds.maxC+1,minZ:meta.bounds.minR,maxZ:meta.bounds.maxR+1}:{minX:-57,maxX:-5,minZ:14,maxZ:77});
 const t=map.terrain||{default:'grass',cells:[]};
 const cells=new Map((t.cells||[]).map(c=>[c.c+','+c.r,c.type]));
 const tile=(c,r)=>cells.get(c+','+r)||t.default||'grass';
 const objs=doc.objects||[];
 const isStatic=o=>!ACTORS.has(o.type)&&o.type!=='vehicle'&&o.type!=='marker';
 const statics=objs.filter(o=>isStatic(o)&&!DECAL.test(String(o.asset||'')));
 const solids=statics.filter(o=>physics.solid(o)).map(o=>({o,a:physics.area(o,catalog,style),k:style.category(o,catalog)}));
 const points=[];
 for(const d of meta.doors||[]){
  if(!Array.isArray(d.usePoint))continue;
  points.push({id:d.doorId+':use',x:d.usePoint[0],z:d.usePoint[1]});
  const f=d.facing==='se'?[1,0]:[0,1];
  points.push({id:d.doorId+':front',x:d.usePoint[0]+f[0],z:d.usePoint[1]+f[1]});
 }
 for(const it of meta.interactables||[])if(Array.isArray(it.usePoint)&&!/ogah/.test(it.id))points.push({id:it.id,x:it.usePoint[0],z:it.usePoint[1]});
 for(const s of meta.spawns||[])points.push({id:s.id,x:s.x,z:s.z});
 for(const h of meta.homes||[])if(h.homeSpawn)points.push({id:'home:'+h.player,x:h.homeSpawn[0],z:h.homeSpawn[1]});
 const pbox=p=>({minX:p.x-.325,maxX:p.x+.325,minZ:p.z-.325,maxZ:p.z+.325});
 // nearer-to-camera building sprites
 const occluders=statics.filter(o=>style.category(o,catalog)==='building').map(o=>{
  const s=catalog.get(o.asset)||{};
  const W=Number(o.width)||Number(s.width)||4,H=Number(o.height)||Number(s.height)||4;
  const pr=s.size&&s.pivot?s.pivot[1]/s.size[1]:.85;
  return {id:o.id,name:o.name,depth:Number(o.x)+Number(o.z),r:spriteRect(Number(o.x),Number(o.z),W,H,pr)};
 });
 const vehicleDims=o=>{
  const spec=cat.vehicle(o.vehicleId)||{};
  const fp=spec.editorFootprint||spec.footprint||[2.9,1.05];
  const size=spec.size||[146,138],piv=spec.pivot||[size[0]/2,size[1]*.72];
  const sc=Number(o.scale)||1;
  return {spec,len:Math.max(Number(fp[0]),size[0]*PX*sc),wid:Number(fp[1]),
   artW:size[0]*PX*sc,artH:size[1]*PX/COS30*sc,pivot:piv[1]/size[1]};
 };
 const fails=[],warns=[],vehicles=[];
 function probe(o,dims,x,z,dx,dz,where,acc,nearEnd=false){
  const g=box(x,z,dims.len,dims.wid,dx,dz);
  const inside=g.minX>=B.minX&&g.maxX<=B.maxX&&g.minZ>=B.minZ&&g.maxZ<=B.maxZ;
  for(const s of solids)if(inter(g,s.a))acc.push({rule:'T1',vehicle:o.id,vehicleId:o.vehicleId,x:+x.toFixed(2),z:+z.toFixed(2),where,hit:s.o.id,hitName:s.o.name||'',hitKind:s.k});
  for(const p of points)if(inter(g,pbox(p))){
   // a door's front step that is itself a road tile is a kerb-side door: warn, cars may pass
   const roadFront=/:front$/.test(p.id)&&tile(Math.floor(p.x),Math.floor(p.z))==='road';
   acc.push({rule:roadFront?'W3':'T2',vehicle:o.id,vehicleId:o.vehicleId,x:+x.toFixed(2),z:+z.toFixed(2),where,hit:p.id});
  }
  if(inside){
   const q={minX:g.minX+ROAD_TOL,maxX:g.maxX-ROAD_TOL,minZ:g.minZ+ROAD_TOL,maxZ:g.maxZ-ROAD_TOL};
   const bad=new Set();
   for(let c=Math.floor(q.minX);c<Math.ceil(q.maxX);c++)for(let r=Math.floor(q.minZ);r<Math.ceil(q.maxZ);r++){const k=tile(c,r);if(k!=='road')bad.add(k+'@'+c+','+r);}
   if(bad.size)acc.push({rule:nearEnd?'W2':'T3',vehicle:o.id,vehicleId:o.vehicleId,x:+x.toFixed(2),z:+z.toFixed(2),where,hit:[...bad].slice(0,4).join(' ')});
  }
  const rect=spriteRect(x,z,dims.artW,dims.artH,dims.pivot);
  const near=occluders.filter(b=>b.depth>x+z+1e-6);
  const cv=coverage(rect,near);
  if(cv.f>=COVER)acc.push({rule:'T4',vehicle:o.id,vehicleId:o.vehicleId,x:+x.toFixed(2),z:+z.toFixed(2),where,hit:cv.by[0],cover:+cv.f.toFixed(2)});
  return {inside,cover:cv.f,coverBy:cv.by[0]||null};
 }
 for(const o of objs.filter(o=>o.type==='vehicle')){
  const dims=vehicleDims(o);
  const parked=o.motion?.enabled===false;
  const acc=[];
  if(parked){probe(o,dims,Number(o.x),Number(o.z),1,0,'parked',acc);fails.push(...dedupe(acc));vehicles.push({id:o.id,vehicleId:o.vehicleId,parked:true});continue;}
  const sp=traffic.spawnPosition(map,Number(o.x),Number(o.z),'vehicle',8);
  const route=sp&&traffic.makeRoute(map,sp.x,sp.z,'vehicle',o.motion?.direction||'auto');
  if(!route){warns.push({rule:'W0',vehicle:o.id,msg:'no road route (vehicle hidden at runtime)'});continue;}
  let maxCover=0,maxBy=null,edgeAt=null,wasInside=false;
  // T6 the runtime respawns at route start only if physics allows it there (bounds + solids);
  // otherwise the vehicle disappears for good after its first pass
  {
   const p0=traffic.sample(route,0);
   const blockers=objs.filter(x=>x.collision!==false&&x.blocking!=='no'&&!['vehicle','pedestrian','crowd'].includes(x.type));
   const res=physics.check({...o,x:p0.x,z:p0.z,collision:true,blocking:'auto'},p0,blockers,map,catalog,style,null);
   if(!res.ok)acc.push({rule:'T6',vehicle:o.id,vehicleId:o.vehicleId,x:p0.x,z:p0.z,where:'respawn at route start',hit:res.id+' ('+res.reason+')'});
  }
  // the runtime stops a car when its physics footprint would leave worldBounds
  const pfp=style.footprint(o,catalog);
  for(let d=0;d<=route.length+1e-9;d+=STEP){
   const p=traffic.sample(route,Math.min(d,route.length-1e-4));
   if(!p)continue;
   const pb={minX:p.x-pfp[0]/2,maxX:p.x+pfp[0]/2,minZ:p.z-pfp[1]/2,maxZ:p.z+pfp[1]/2};
   if(pb.minX<B.minX||pb.maxX>B.maxX||pb.minZ<B.minZ||pb.maxZ>B.maxZ){
    if(wasInside&&edgeAt==null){edgeAt={x:+p.x.toFixed(2),z:+p.z.toFixed(2),distance:+d.toFixed(2),routeLength:route.length};}
    if(wasInside)break; else continue;
   }
   wasInside=true;
   const nearEnd=d<dims.len/2||d>route.length-dims.len/2;
   const r=probe(o,dims,p.x,p.z,p.dx,p.dz,'route d='+d.toFixed(1),acc,nearEnd);
   if(r.cover>maxCover){maxCover=r.cover;maxBy=r.coverBy;}
  }
  if(edgeAt)warns.push({rule:'W1',vehicle:o.id,vehicleId:o.vehicleId,...edgeAt,msg:'route runs past worldBounds: runtime freezes the car at the edge up to 6 s, then recycles it (engine)'});
  const a=route.points[0],b=route.points[route.points.length-1];
  vehicles.push({id:o.id,vehicleId:o.vehicleId,lane:{from:[a.x,a.z],to:[b.x,b.z],length:route.length},
   groundBox:[+dims.len.toFixed(2),dims.wid],maxCover:+maxCover.toFixed(2),maxCoverBy:maxBy});
  for(const f of dedupe(acc)){
   if(/^W/.test(f.rule))warns.push({...f,msg:f.rule==='W2'?'route end: car body overhangs '+f.hit+' at spawn/despawn (engine: inset spawn/recycle by half a car)':'passes a kerb-side door front on the road: '+f.hit});
   else fails.push(f);
  }
 }
 // parked vehicle-like sprites
 for(const o of statics){
  const tags=Array.isArray(o.tags)?o.tags:[];
  if(!(tags.includes('njh-parked')||/motor_parkir|mobil_parkir|parked_(car|motor)/.test(String(o.asset||''))))continue;
  const a=physics.area(o,catalog,style),acc=[];
  for(const s of solids)if(s.o.id!==o.id&&inter(a,s.a)&&s.k==='building')acc.push({rule:'T5',vehicle:o.id,where:'parked sprite',hit:s.o.id});
  for(const p of points)if(inter(a,pbox(p)))acc.push({rule:'T5',vehicle:o.id,where:'parked sprite',hit:p.id});
  fails.push(...acc);
 }
 return {city:path.relative(ROOT,cityPath),step:STEP,cover:COVER,vehicles,fails,warns,ok:fails.length===0};
}
// keep one row per (rule, vehicle, hit) with the first and last sample position
function dedupe(rows){
 const m=new Map();
 for(const r of rows){
  const k=r.rule+'|'+r.vehicle+'|'+r.hit;
  if(!m.has(k))m.set(k,{...r,samples:1,last:[r.x,r.z]});
  else{const e=m.get(k);e.samples++;e.last=[r.x,r.z];if(r.cover>(e.cover||0))e.cover=r.cover;}
 }
 return [...m.values()];
}
module.exports={check,spriteRect,coverage,box,STEP,COVER};
if(require.main===module){
 const city=args.find((a,i)=>!a.startsWith('--')&&args[i-1]!=='--root')||CITY_DEFAULT;
 const r=check(path.resolve(city));
 if(args.includes('--json'))console.log(JSON.stringify(r,null,1));
 else{
  console.log('traffic-clip',r.city,'step',r.step,'T4 cover >=',r.cover);
  for(const v of r.vehicles)console.log('  vehicle',v.id,v.vehicleId,v.parked?'parked':JSON.stringify(v.lane),'maxCover',v.maxCover,v.maxCoverBy||'');
  const by={};for(const f of r.fails)(by[f.rule]=by[f.rule]||[]).push(f);
  for(const k of ['T1','T2','T3','T4','T5','T6'])console.log(k,(by[k]||[]).length);
  for(const f of r.fails)if(/^W/.test(f.rule))continue;else console.log('  FAIL',f.rule,f.vehicle,f.vehicleId||'',f.hit,f.hitName||'',f.cover!=null?'cover '+f.cover:'','at',f.x,f.z,'..',f.last?f.last.join(','):'','samples',f.samples||1);
  for(const w of r.warns)console.log('  WARN',w.rule,w.vehicle,w.msg||w.hit,w.x!=null?'at '+w.x+','+w.z:'');
  console.log(r.ok?'PASS':'FAIL');
 }
 process.exit(r.ok?0:1);
}
