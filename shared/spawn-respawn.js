/* Generic spawn/respawn rules for Semesta + Jiwa.
 * No named-player special cases. A player either owns a room or they don't.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.VLSpawnRespawn=api;
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 const FORBIDDEN_TILES=['road','water','river','drain'];
 const FACINGS=['se','sw'];
 const DEFAULT_POOL=[
  {id:'roadside-a',x:0.5,z:41.5,facing:'se'},
  {id:'roadside-b',x:12.5,z:41.5,facing:'se'},
  {id:'roadside-c',x:28.5,z:41.5,facing:'sw'},
  {id:'roadside-d',x:0.5,z:46.5,facing:'se'},
  {id:'roadside-e',x:16.5,z:46.5,facing:'sw'},
  {id:'roadside-f',x:32.5,z:46.5,facing:'se'},
  {id:'roadside-g',x:17.5,z:30.5,facing:'se'},
  {id:'roadside-h',x:22.5,z:55.5,facing:'sw'}
 ];
 const num=(v,min,max,fallback)=>{
  const n=Number(v);
  return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;
 };
 function defaultModule(){
  return {
   enabled:true,
   exitTentAnimation:true,
   triggers:{playStart:true,spawnRequest:true,reconnect:true},
   previewOwnsRoom:false,
   ownedRoom:null,
   pool:DEFAULT_POOL.map(p=>({...p}))
  };
 }
 function cleanFacing(v){return v==='sw'?'sw':'se';}
 function cleanPoint(raw,i){
  if(!raw||typeof raw!=='object')return null;
  const x=num(raw.x,-200,200,NaN),z=num(raw.z,-200,200,NaN);
  if(!Number.isFinite(x)||!Number.isFinite(z))return null;
  const id=String(raw.id||('roadside-'+(i+1))).replace(/[^a-z0-9_-]/gi,'').slice(0,40)||('p'+(i+1));
  return {id,x:Math.round(x*100)/100,z:Math.round(z*100)/100,facing:cleanFacing(raw.facing)};
 }
 function cleanRoom(raw){
  if(!raw||typeof raw!=='object')return null;
  const x=num(raw.x,-200,200,NaN),z=num(raw.z,-200,200,NaN);
  if(!Number.isFinite(x)||!Number.isFinite(z))return null;
  return {id:String(raw.id||'owned-room').slice(0,80),x,z,facing:cleanFacing(raw.facing)};
 }
 function normalizeModule(raw){
  const base=defaultModule();
  if(!raw||typeof raw!=='object')return base;
  base.enabled=raw.enabled!==false;
  base.exitTentAnimation=raw.exitTentAnimation!==false;
  const t=raw.triggers&&typeof raw.triggers==='object'?raw.triggers:{};
  base.triggers={
   playStart:t.playStart!==false,
   spawnRequest:t.spawnRequest!==false,
   reconnect:t.reconnect!==false
  };
  base.previewOwnsRoom=raw.previewOwnsRoom===true;
  base.ownedRoom=cleanRoom(raw.ownedRoom);
  const incoming=Array.isArray(raw.pool)?raw.pool:[];
  const cleaned=incoming.slice(0,40).map(cleanPoint).filter(Boolean);
  const seen=new Set();
  base.pool=[];
  for(const p of (cleaned.length?cleaned:DEFAULT_POOL.map(v=>({...v})))){
   let id=p.id,n=2;
   while(seen.has(id))id=p.id+'-'+(n++);
   seen.add(id);base.pool.push({...p,id});
  }
  return base;
 }
 function tileAt(world,x,z){
  if(!world)return 'grass';
  if(typeof world.tileAt==='function')return world.tileAt(x,z)||'grass';
  const cells=world.map&&world.map.terrain&&world.map.terrain.cells;
  if(Array.isArray(cells)){
   const c=Math.floor(Number(x)),r=Math.floor(Number(z));
   const hit=cells.find(t=>t.c===c&&t.r===r);
   return (hit&&hit.type)||(world.map.terrain.default)||'grass';
  }
  return 'grass';
 }
 function neighborsRoad(world,x,z){
  const c=Math.floor(Number(x)),r=Math.floor(Number(z));
  return [[1,0],[-1,0],[0,1],[0,-1]].some(([dc,dr])=>tileAt(world,c+dc+.5,r+dr+.5)==='road');
 }
 function blocked(world,x,z){
  if(typeof world.blocked==='function')return !!world.blocked(x,z);
  const objects=world.objects||[];
  for(const o of objects){
   if(!o||o.type==='marker'||o.collision===false||o.blocking==='no')continue;
   if(o.type==='avatar'||o.type==='npc'||o.type==='pedestrian'||o.type==='crowd')continue;
   const w=Number(o.w||o.footprint&&o.footprint[0])||(o.type==='building'||o.type==='shop'?3:1.2);
   const d=Number(o.d||o.footprint&&o.footprint[1])||(o.type==='building'||o.type==='shop'?3:1.2);
   if(Math.abs((Number(o.x)||0)-x)<(w+2.45)/2+0.15&&Math.abs((Number(o.z)||0)-z)<(d+2.45)/2+0.15)
    return true;
  }
  return false;
 }
 function validatePoint(point,world){
  if(!point||!Number.isFinite(Number(point.x))||!Number.isFinite(Number(point.z)))
   return {ok:false,reason:'bad-coordinates'};
  const tile=tileAt(world,point.x,point.z);
  if(FORBIDDEN_TILES.includes(tile))return {ok:false,reason:'forbidden-tile',tile};
  if(tile!=='sidewalk'&&!(tile==='grass'&&neighborsRoad(world,point.x,point.z)))
   return {ok:false,reason:'not-roadside',tile};
  if(tile==='sidewalk'||tile==='grass'){
   if(tile==='grass'&&!neighborsRoad(world,point.x,point.z))
    return {ok:false,reason:'not-roadside',tile};
  }
  if(blocked(world,point.x,point.z))return {ok:false,reason:'collision',tile};
  return {ok:true,tile};
 }
 function markersToPoints(objects){
  return (objects||[]).filter(o=>o&&o.type==='marker'&&(
   o.markerKind==='hobo_tent'||
   (o.markerKind==='spawn'&&/hobo|tenda|tent/i.test(String(o.name||'')+' '+((o.tags||[]).join(' '))))
  )).map((o,i)=>cleanPoint({id:o.id||('marker-'+(i+1)),x:o.x,z:o.z,facing:o.facing||o.entranceFacing},i)).filter(Boolean);
 }
 function collectPool(mod,world){
  const cfg=normalizeModule(mod);
  const extra=markersToPoints(world&&world.objects);
  const merged=[...cfg.pool];
  const seen=new Set(merged.map(p=>p.id));
  for(const p of extra){
   if(seen.has(p.id))continue;
   seen.add(p.id);merged.push(p);
  }
  return merged;
 }
 function validPool(mod,world){
  return collectPool(mod,world).filter(p=>validatePoint(p,world).ok);
 }
 function scanFallback(world,limit=8){
  if(!world||!world.map||!world.map.terrain||!Array.isArray(world.map.terrain.cells))return [];
  const found=[];
  for(const cell of world.map.terrain.cells){
   if(!cell||cell.type!=='sidewalk')continue;
   if(!neighborsRoad(world,cell.c+.5,cell.r+.5))continue;
   const p={id:'scan-'+cell.c+'-'+cell.r,x:cell.c+.5,z:cell.r+.5,facing:(cell.c+cell.r)%2?'sw':'se'};
   if(!validatePoint(p,world).ok)continue;
   found.push(p);
   if(found.length>=limit)break;
  }
  return found;
 }
 function rngOf(rand){
  if(typeof rand==='function')return rand;
  if(typeof rand==='number'&&Number.isFinite(rand)){
   let s=(Math.imul(Math.floor(rand)||1,2654435761)>>>0)||1;
   return ()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
  }
  return Math.random;
 }
 function pickRandom(mod,world,rand){
  let pool=validPool(mod,world);
  if(!pool.length)pool=scanFallback(world);
  if(!pool.length)return {ok:false,reason:'no-valid-points',point:null,candidates:[]};
  const roll=rngOf(rand)();
  const idx=Math.min(pool.length-1,Math.max(0,Math.floor(roll*pool.length)));
  return {ok:true,point:pool[idx],index:idx,candidates:pool};
 }
 function playerOwnsRoom(player,mod){
  const cfg=normalizeModule(mod);
  if(player&&player.homeAccess===true)return true;
  if(player&&player.ownedRoom)return true;
  return cfg.previewOwnsRoom===true;
 }
 function roomPoint(player,mod){
  const cfg=normalizeModule(mod);
  return cleanRoom((player&&player.ownedRoom)||cfg.ownedRoom);
 }
 function resolve(player,mod,world,rand){
  const cfg=normalizeModule(mod);
  if(playerOwnsRoom(player,cfg)){
   const room=roomPoint(player,cfg);
   if(!room)return {ok:false,reason:'owned-room-missing',kind:'home',playExitTent:false,point:null};
   return {ok:true,kind:'home',playExitTent:false,point:room,reason:'owned-room'};
  }
  const pick=pickRandom(cfg,world,rand);
  if(!pick.ok)return {ok:false,kind:'hobo',playExitTent:false,point:null,reason:pick.reason};
  return {
   ok:true,kind:'hobo',playExitTent:cfg.exitTentAnimation!==false,
   point:pick.point,reason:'random-hobo',index:pick.index,candidates:pick.candidates
  };
 }
 function namedPlayerKeys(obj){
  if(!obj||typeof obj!=='object')return [];
  return Object.keys(obj).filter(k=>/ichsan|noor/i.test(k));
 }
 return Object.freeze({
  FORBIDDEN_TILES,FACINGS,DEFAULT_POOL,
  defaultModule,normalizeModule,cleanPoint,cleanRoom,
  tileAt,validatePoint,collectPool,validPool,scanFallback,
  pickRandom,resolve,playerOwnsRoom,roomPoint,markersToPoints,namedPlayerKeys
 });
});
