'use strict';
/* NJH map layout checker (preview, read-only).
 * Uses the real runtime rules (style-rules.js footprint/category, world-physics.js
 * collision, map-terrain.js drain topology) on the official NJH city file and a
 * catalog snapshot, and proves:
 *  R1 no two static solids overlap
 *  R2 no non-solid prop sits on a building or another prop (ground decals excepted)
 *  R3 nothing static on road/water/drain; buildings and trees not on sidewalk
 *  R4 door, use, spawn and gameplay tiles are clear (0.65 actor box)
 *  R5 every R4 point and every NPC is reachable on one connected walk network
 *  R6 objects tagged njh-densify keep walk paths: no solid on sidewalk, and a free front/use tile
 *  R7 quest NPCs on road/sidewalk/plaza, pedestrians on sidewalk, no actor inside a solid
 * CLI: node tests/njh-map-layout-check.cjs [city.json] [--json]
 */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..','world-builder');
const CITY=path.join(root,'njh-map-preview/city/njh-semesta-map-draft1.with-pending-assets.city.json');
const META=path.join(root,'njh-map-preview/njh-map-meta.json');
const SNAP=path.join(root,'njh-map-preview/catalog-snapshot.json');
const DECAL=/selokan_|zebra_cross|vegetation:overlay|vegetation:prop_|rumput_kota|aspal_patch/;
const WATER_OK=/njh_dermaga_mancing/;
const ACTORS=new Set(['avatar','npc','pedestrian','crowd','quest_npc']);
function runtime(){
 const window={};
 const ctx=vm.createContext({window,globalThis:window,Map,Set,Math,Number,Array,Object,JSON,WeakMap,String});
 for(const n of ['style-rules.js','map-terrain.js','world-physics.js'])
  vm.runInContext(fs.readFileSync(path.join(root,n),'utf8'),ctx,{filename:n});
 return {style:window.VLWorldStyle,physics:window.VLWorldPhysics,terrain:window.VLMapTerrain};
}
function load(cityPath=CITY){
 const city=JSON.parse(fs.readFileSync(cityPath,'utf8'));
 const meta=JSON.parse(fs.readFileSync(META,'utf8'));
 const snap=JSON.parse(fs.readFileSync(SNAP,'utf8'));
 return {city,doc:city.record.document,meta,catalog:new Map(snap.assets.map(a=>[a.file,a]))};
}
function check(cityPath=CITY){
 const {style,physics,terrain}=runtime();
 const {doc,meta,catalog}=load(cityPath);
 const map=doc.map,objs=doc.objects,t=map.terrain;
 const cells=new Map(t.cells.map(c=>[c.c+','+c.r,c.type]));
 const tile=(c,r)=>cells.get(c+','+r)||t.default||'grass';
 const missing=objs.filter(o=>o.type==='sprite'&&!catalog.has(o.asset)).map(o=>o.id);
 const cat=o=>style.category(o,catalog);
 const fp=o=>style.footprint(o,catalog);
 const area=(o,p)=>physics.area(o,catalog,style,p);
 const isStatic=o=>!ACTORS.has(o.type)&&o.type!=='vehicle'&&o.type!=='marker';
 const decal=o=>DECAL.test(String(o.asset||''));
 const solid=o=>isStatic(o)&&physics.solid(o);
 const statics=objs.filter(isStatic);
 const WEST_BANK_MAX_C=-57;
 const issues={R1:[],R2:[],R3:[],R4:[],R5:[],R6:[],R7:[]};
 // R1 / R2
 for(let i=0;i<statics.length;i++)for(let j=i+1;j<statics.length;j++){
  const a=statics[i],b=statics[j];
  if(decal(a)||decal(b))continue;
  if(!physics.intersect(area(a),area(b)))continue;
  if(solid(a)&&solid(b))issues.R1.push([a.id,b.id]);
  else issues.R2.push([a.id,b.id]);
 }
 // R3 surfaces
 for(const o of statics){
  if((Number(o.y)||0)>=.05)continue;
  const A=area(o),k=cat(o);
  const minC=Math.floor(A.minX+.08),maxC=Math.ceil(A.maxX-.08),minR=Math.floor(A.minZ+.08),maxR=Math.ceil(A.maxZ-.08);
  const bad=new Set();
  for(let c=minC;c<maxC;c++)for(let r=minR;r<maxR;r++){
   const kind=tile(c,r);
   if(['water','river'].includes(kind)&&!WATER_OK.test(o.asset||''))bad.add(kind);
   if(kind==='drain'&&!decal(o))bad.add(kind);
   if(kind==='road'&&!decal(o))bad.add(kind);
   if(kind==='sidewalk'&&(k==='building'||k==='tree'))bad.add(kind);
  }
  if(bad.size)issues.R3.push([o.id,[...bad].join('+')]);
 }
 // R4 clear points
 const points=[];
 for(const d of meta.doors||[]){
  points.push({id:d.doorId+':use',x:d.usePoint[0],z:d.usePoint[1],own:null});
  const f=d.facing==='se'?[1,0]:[0,1];
  points.push({id:d.doorId+':front',x:d.usePoint[0]+f[0],z:d.usePoint[1]+f[1],own:null});
 }
 for(const it of meta.interactables||[])if(Array.isArray(it.usePoint))points.push({id:it.id,x:it.usePoint[0],z:it.usePoint[1],own:it.objectId});
 for(const s of meta.spawns||[])points.push({id:s.id,x:s.x,z:s.z,own:null});
 for(const h of meta.homes||[])if(h.homeSpawn)points.push({id:'home:'+h.player,x:h.homeSpawn[0],z:h.homeSpawn[1],own:null});
 const actor={id:'__probe',type:'avatar',x:0,z:0,rotation:0,scale:1};
 const probeArea=p=>area(actor,p);
 for(const p of points){
  const A=probeArea(p);
  for(const o of statics){
   if(decal(o)||o.id===p.own)continue;
   if(physics.intersect(A,area(o)))issues.R4.push([p.id,o.id]);
  }
  const k=tile(Math.floor(p.x),Math.floor(p.z));
  // a door's ':front' tile is the step after its use tile; the street (road) is a legal place to step onto
  const allowed=/:front$/.test(p.id)?['water','river','drain']:['water','river','drain','road'];
  if(allowed.includes(k)&&!/fish|dermaga|ogah/.test(p.id))issues.R4.push([p.id,'terrain:'+k]);
 }
 // R5 connectivity on a 0.5 grid using the runtime collision check
 const b=map.worldBounds,step=.5,key=(x,z)=>x.toFixed(2)+','+z.toFixed(2);
 const solids=statics.filter(solid);
 const ok=(x,z)=>physics.check(actor,{x,z},solids,map,catalog,style,null).ok;
 const snapPt=v=>Math.round(v/step)*step;
 const start=meta.spawns[0];
 const seen=new Set(),todo=[[snapPt(start.x),snapPt(start.z)]];
 if(!ok(...todo[0]))issues.R5.push(['spawn','blocked']);
 seen.add(key(...todo[0]));
 while(todo.length){
  const [x,z]=todo.pop();
  for(const [dx,dz] of [[step,0],[-step,0],[0,step],[0,-step]]){
   const nx=x+dx,nz=z+dz,k=key(nx,nz);
   if(seen.has(k)||nx<b.minX||nx>b.maxX||nz<b.minZ||nz>b.maxZ)continue;
   if(!ok(nx,nz))continue;
   // edge must be passable: midpoint too (thin objects)
   if(!ok(x+dx/2,z+dz/2))continue;
   seen.add(k);todo.push([nx,nz]);
  }
 }
 const reach=(x,z)=>{
  for(const [ox,oz] of [[0,0],[.5,0],[-.5,0],[0,.5],[0,-.5]])if(seen.has(key(snapPt(x)+ox,snapPt(z)+oz)))return true;
  return false;
 };
 for(const p of points)if(!reach(p.x,p.z)&&!/front$/.test(p.id))issues.R5.push([p.id,'unreachable']);
 for(const o of objs)if(['quest_npc','pedestrian'].includes(o.type)&&!reach(o.x,o.z))issues.R5.push([o.id,'npc-unreachable']);
 // unreachable walk surface tiles (sidewalk/plaza centres that are open but cut off)
 const cutOff=[];
 for(const c of t.cells){
  if(!['sidewalk','plaza'].includes(c.type))continue;
  const x=c.c+.5,z=c.r+.5;
  if(x<b.minX||x>b.maxX||z<b.minZ||z>b.maxZ)continue;
  if(c.c<=WEST_BANK_MAX_C)continue; // the c=-57 bank west of the kali has no bridge inside the map bounds by design
  if(ok(x,z)&&!reach(x,z))cutOff.push([c.c,c.r]);
 }
 if(cutOff.length)issues.R5.push(['walk-surface-cut-off',cutOff.length+' tiles: '+JSON.stringify(cutOff)]);
 // R6 densify rules
 for(const o of statics){
  if(!(o.tags||[]).includes('njh-densify'))continue;
  const A=area(o);
  if(solid(o)){
   for(let c=Math.floor(A.minX+.08);c<Math.ceil(A.maxX-.08);c++)for(let r=Math.floor(A.minZ+.08);r<Math.ceil(A.maxZ-.08);r++)
    if(tile(c,r)==='sidewalk')issues.R6.push([o.id,'solid on sidewalk '+c+','+r]);
  }
  if(o.useSide){
   const rot=((Number(o.rotation)||0)%360+360)%360;
   const [w,d]=fp(o);
   const dir=rot===90?[1,0]:rot===180?[0,-1]:rot===270?[-1,0]:[0,1];
   const ux=o.x+dir[0]*((dir[0]?w:d)/2+.5),uz=o.z+dir[1]*((dir[1]?d:w)/2+.5);
   if(!ok(ux,uz)||!reach(ux,uz))issues.R6.push([o.id,'use tile blocked '+ux+','+uz]);
  }
 }
 // R7 actors
 for(const o of objs){
  if(!ACTORS.has(o.type)||o.type==='avatar')continue;
  const k=tile(Math.floor(o.x),Math.floor(o.z));
  if(o.type==='quest_npc'&&!['road','sidewalk','plaza'].includes(k))issues.R7.push([o.id,'quest npc on '+k]);
  if(o.type==='pedestrian'&&k!=='sidewalk')issues.R7.push([o.id,'pedestrian on '+k]);
  const A=area(o);
  for(const s of solids)if(physics.intersect(A,area(s)))issues.R7.push([o.id,'inside '+s.id]);
 }
 const counts=Object.fromEntries(Object.entries(issues).map(([k,v])=>[k,v.length]));
 return {missing,counts,issues,objects:objs.length,reachable:seen.size,points:points.length};
}
module.exports={check,load,runtime,CITY};
if(require.main===module){
 const arg=process.argv.slice(2).find(a=>!a.startsWith('--'));
 const r=check(arg?path.resolve(arg):CITY);
 if(process.argv.includes('--json'))console.log(JSON.stringify(r,null,1));
 else{
  console.log('objects',r.objects,'points',r.points,'reachable cells',r.reachable,'missing catalog',r.missing);
  for(const [k,v] of Object.entries(r.issues)){console.log(k,v.length);for(const x of v)console.log('  ',JSON.stringify(x));}
 }
 process.exit(Object.values(r.counts).some(n=>n>0)||r.missing.length?1:0);
}
