/* Virtual Life Builder · non-destructive physical movement preview.
 * All collisions use authored ground footprints in c/r tile units.
 * Runtime preview does NOT mutate the exported city document.
 */
(function(g){
'use strict';
const EPS=1e-5;
function solid(o){
 return !!o && !['marker'].includes(o.type) &&
  o.collision!==false && o.blocking!=='no';
}
function area(o,catalog,style,position){
 const [w,d]=style.footprint(o,catalog);
 const x=Number(position?.x??o.x),z=Number(position?.z??o.z);
 return {minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2};
}
function intersect(a,b){
 return a.minX<b.maxX-EPS && a.maxX>b.minX+EPS &&
  a.minZ<b.maxZ-EPS && a.maxZ>b.minZ+EPS;
}
function overlapDepth(a,b){
 return Math.max(0,Math.min(a.maxX,b.maxX)-Math.max(a.minX,b.minX))*
        Math.max(0,Math.min(a.maxZ,b.maxZ)-Math.max(a.minZ,b.minZ));
}
const terrainCache=new WeakMap();
function tileIndex(terrain){
 const entry=terrainCache.get(terrain);
 if(entry?.cells===terrain.cells)return entry.index;
 const index=new Map((terrain.cells||[]).map(tile=>[tile.c+','+tile.r,tile.type]));
 terrainCache.set(terrain,{cells:terrain.cells,index});
 return index;
}
function check(actor,point,objects,map,catalog,style,livePositions){
 const candidate=area(actor,catalog,style,point);
 if(map&&map.unbounded===false&&map.worldBounds){
  const b=map.worldBounds;
  if(candidate.minX<b.minX||candidate.maxX>b.maxX||candidate.minZ<b.minZ||candidate.maxZ>b.maxZ)
   return {ok:false,reason:'bounds',id:'worldBounds'};
 }
 const terrain=map?.terrain||{default:'grass',cells:[]};
 const at=tileIndex(terrain);
 const minC=Math.floor(candidate.minX+EPS),maxC=Math.ceil(candidate.maxX-EPS);
 const minR=Math.floor(candidate.minZ+EPS),maxR=Math.ceil(candidate.maxZ-EPS);
 for(let c=minC;c<maxC;c++)for(let r=minR;r<maxR;r++){
  const kind=at.get(c+','+r)||terrain.default||'grass';
  if(['water','river','drain'].includes(kind))return {ok:false,reason:'water',id:c+','+r};
 }
 const old=area(actor,catalog,style,livePositions?.get(actor.id)||{x:actor.x,z:actor.z});
 for(const o of objects||[]){
  if(o.id===actor.id||!solid(o))continue;
  const obstacle=area(o,catalog,style,livePositions?.get(o.id));
  if(!intersect(candidate,obstacle))continue;
  const prior=overlapDepth(old,obstacle),after=overlapDepth(candidate,obstacle);
  // If a legacy map already spawned an actor inside an obstacle, allow
  // gradual escape, but never deeper penetration.
  if(prior>EPS && after<prior-EPS)continue;
  return {ok:false,reason:'object',id:o.id};
 }
 return {ok:true,reason:null,id:null};
}
function move(actor,start,dx,dz,objects,map,catalog,style,livePositions){
 const length=Math.hypot(dx,dz);
 if(length<EPS)return {x:start.x,z:start.z,moved:false,blocked:false};
 const steps=Math.max(1,Math.ceil(length/.18));
 let x=start.x,z=start.z,blocked=false;
 for(let k=0;k<steps;k++){
  const sx=dx/steps,sz=dz/steps;
  const both=check(actor,{x:x+sx,z:z+sz},objects,map,catalog,style,livePositions);
  if(both.ok){x+=sx;z+=sz;continue;}
  let slid=false;
  if(Math.abs(sx)>EPS && check(actor,{x:x+sx,z},objects,map,catalog,style,livePositions).ok){x+=sx;slid=true;}
  if(Math.abs(sz)>EPS && check(actor,{x,z:z+sz},objects,map,catalog,style,livePositions).ok){z+=sz;slid=true;}
  if(!slid)blocked=true;
 }
 return {x,z,moved:Math.hypot(x-start.x,z-start.z)>EPS,blocked};
}
function bigStructure(o,catalog,style){
 if(!o||['marker','avatar','npc','pedestrian','crowd','quest_npc','vehicle'].includes(o.type))return false;
 const kind=style.category(o,catalog);
 const spec=o.type==='sprite'?catalog?.get(o.asset):null;
 const h=Number(o.h||spec?.height||o.height||5)*Number(o.scale||1);
 // Visual occlusion is independent of collision: even a pass-through tree
 // or a slender landmark can hide the player from the camera.
 if(kind==='tree')return h>=2.2;
 if(o.subtype==='landmark'||(Array.isArray(o.tags)&&o.tags.includes('landmark')))return true;
 if(!solid(o)||kind!=='building')return false;
 const [w,d]=style.footprint(o,catalog);
 return w*d>=12 && h>=2.8;
}
function bigBox(o,catalog,style){
 let [w,d]=style.footprint(o,catalog);
 const spec=o.type==='sprite'?catalog?.get(o.asset):null;
 const scale=Number(o.scale||1);
 const h=Math.max(1,Number(o.h||spec?.height||o.height||5)*scale);
 if(style.category(o,catalog)==='tree'){
  // The collider covers only the trunk; the visual box must include the canopy.
  // Do not change collision footprints or player movement.
  const canopy=Math.max(w,Number(o.width||spec?.width||4.3)*scale);
  w=Math.max(w,canopy);d=Math.max(d,canopy);
 }
 const x=Number(o.x)||0,z=Number(o.z)||0,y=Number(o.y)||0;
 return {min:{x:x-w/2,y,z:z-d/2},
  max:{x:x+w/2,y:y+h,z:z+d/2}};
}
g.VLWorldPhysics=Object.freeze({solid,area,intersect,check,move,bigStructure,bigBox});
})(window);
