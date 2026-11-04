/* Bangun Ruang v5 — Mahluk Hidup character scale and access simulation.
 *
 * Same-character, same-pixel contract as Semesta's VLCharacterRig:
 *   FRAME 64x112, foot pivot (32,100), order se/sw/ne/nw,
 *   action frames resolved from the published Mahluk Hidup catalog plus
 *   same-origin Character Storage and equipped transparent accessories.
 *
 * This is a read-only preview: never saves the demo actor to a building
 * package, never writes to Mahluk Hidup, and does not execute online gameplay.
 */
(function(g){
'use strict';
const $=id=>document.getElementById(id);
const bridge=g.VLMahlukHidup,rig=g.VLCharacterRig,model=g.VLBuildingInterior,iso=g.VLInteriorIso,
 ADJUST=g.VLInteractionAdjust,GIZMO=g.VLActionGizmo,BODY=g.VLUniversalBodyActions;
const FRAME=rig?.FRAME||{w:64,h:112,pivotX:32,pivotY:100};
 // Native 64×32 art tile already includes Virtual Life's PPU=2.
 // Original V6B 64×112 image frame is drawn at 1x in both editor views.
const ACTOR_SCALE=g.VLGameProportions?.character.scale??iso?.ACTOR_SCALE??1;
const DIR=rig?.DIR||['se','sw','ne','nw'];
const imageCache=new Map();
const finite=(x,fallback)=>Number.isFinite(Number(x))?Number(x):fallback;
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const coords=(v)=>[Math.round(v[0]*1000)/1000,Math.round(v[1]*1000)/1000];
const within=(c,r,s)=>c>=0&&r>=0&&c<s.width&&r<s.depth;
function available(scene,c,r){
 if(!scene||!within(c,r,scene))return false;
 const tile=c+','+r;
 return !(scene.items||[]).some(x=>model?.occupied(x)?.includes(tile));
}
function pathTo(scene,start,goal,opts={}){
 if(!scene)return [];
 const startKey=Math.round(start[0])+','+Math.round(start[1]);
 const blocked=new Set((scene.items||[]).flatMap(x=>model?.occupied(x)||[]));
 const targets=[];
 const target=opts.item;
 if(target){
  const covered=new Set(model.occupied(target));
  for(const key of covered){
   const [c,r]=key.split(',').map(Number);
   for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const pos=[c+dc,r+dr],pkey=pos.join(',');
    if(within(...pos,scene)&&!blocked.has(pkey)&&!targets.some(x=>x.join(',')===pkey))targets.push(pos);
   }
  }
 }else targets.push([Math.round(goal[0]),Math.round(goal[1])]);
 const destination=new Set(targets.map(x=>x.join(',')));
 const [sc,sr]=startKey.split(',').map(Number);
 if(!within(sc,sr,scene))return [];
 const q=[[sc,sr]],parents=new Map([[startKey,null]]);
 for(let i=0;i<q.length&&i<2500;i++){
  const [c,r]=q[i],k=c+','+r;
  if(destination.has(k)){
   const nodes=[];let curr=k;
   while(curr){nodes.push(curr.split(',').map(Number));curr=parents.get(curr);}
   nodes.reverse();return nodes;
  }
  for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const nx=c+dc,ny=r+dr,nk=nx+','+ny;
   if(!within(nx,ny,scene)||blocked.has(nk)||parents.has(nk))continue;
   parents.set(nk,k);q.push([nx,ny]);
  }
 }
 return [];
}
function image(url){
 if(!url)return null;
 if(!imageCache.has(url)){
  const pic=new Image();
  if(!url.startsWith('data:'))pic.crossOrigin='anonymous';
  const rec={pic,ready:false,failed:false};
  pic.onload=()=>{rec.ready=!!pic.naturalWidth&&!!pic.naturalHeight;};
  pic.onerror=()=>{rec.failed=true;};
  pic.src=url;imageCache.set(url,rec);
 }
 return imageCache.get(url);
}
function silhouette(ctx,x,y,scale=ACTOR_SCALE,pose='idle'){
 const rect=(rx,ry,w,h,color)=>{
  ctx.fillStyle=color;
  ctx.fillRect(Math.round(x+rx*scale),Math.round(y+ry*scale),
   Math.max(1,Math.round(w*scale)),Math.max(1,Math.round(h*scale)));
 };
 if(pose==='sleep'||pose==='lie'){
  // A loading/unavailable sprite must not show a standing silhouette in bed.
  rect(7,79,17,17,'#8293a8');  // head on pillow
  rect(24,82,25,14,'#8293a8'); // lying torso
  rect(48,85,12,6,'#4c617a'); // feet
  return;
 }
 if(pose==='sit'||pose==='toilet'||pose==='work'){
  rect(21,27,22,19,'#8293a8');
  rect(17,45,30,29,'#8293a8');
  rect(19,72,23,10,'#8293a8');
  rect(35,81,19,8,'#8293a8');
  rect(44,89,13,5,'#4c617a');
  return;
 }
 rect(17,16,30,34,'#8293a8');
 rect(21,6,22,19,'#8293a8');
 rect(11,50,42,24,'#8293a8');
 rect(18,74,11,28,'#8293a8');
 rect(35,74,11,28,'#8293a8');
 rect(17,99,13,2,'#4c617a');
 rect(34,99,13,2,'#4c617a');
}
function drawActor(ctx,actor,time,footX,footY,options={}){
 const scale=ACTOR_SCALE;
 const action=typeof actor.pose==="string"&&/^[a-z][a-z0-9_]{0,89}$/.test(actor.pose)?
  actor.pose:null;
 const actionFallback={
  use_toilet:["toilet_sit","toilet"],toilet:["toilet_sit"],
  pee:["pee_stand","toilet"],poop:["toilet_sit","toilet"],
  shower:["bathe"],bath:["bathe"],rest:["sleep"],lie:["lie_down","sleep"],
  work:["office_type"],study:["study_online"],wash:["wash_hands"],cook:["cook_stir"],
  sit:["sit_idle"],relax:["sit_idle"]
 };
 const edits=g.VLActionFrames;
 const storageActor=rig?.canonical?.(actor.profile)||actor.profile;
 // Pixel offset comes from Mahluk Hidup, never moves fixture/collision data.
 const shift=action?edits?.offset(storageActor,action):null;
 const x=Math.round(footX-FRAME.pivotX*scale+(shift?.x||0));
 const y=Math.round(footY-FRAME.pivotY*scale+(shift?.y||0));
 const drawWidth=FRAME.w*scale,drawHeight=FRAME.h*scale;
 const resolved=rig?.resolve(actor.profile,actor.pose,actor.moving);
 const sprite=resolved?.url?image(resolved.url):null;
 const actorProfile=bridge?.get?.(storageActor);
 const bodyRule=BODY?.resolve(actorProfile,actor.actionId||actor.pose);
 const bareAtlas=bodyRule?image(bridge?.url(bodyRule.sheet)):null;
 let drawn=false;
 if(sprite?.ready&&resolved&&(!bodyRule||bareAtlas?.ready)){
  const direct=DIR.indexOf(actor.direction);
  const effectiveDir=resolved.source==='universal-sleep'?
    (g.VLUniversalSleep?.directionFor(resolved.mode,actor.direction)||actor.direction):
    actor.direction;
   const nativeDir=DIR.indexOf(effectiveDir);
   const row=(resolved.row||0)+(nativeDir<0?1:nativeDir);
  // Original game sheetCell() loops its four seated frames at 3 FPS.
  // The SW direction is what makes the knees visibly bent.
  const frame=rig.frameAt(resolved,time);
  const sx=frame*FRAME.w,sy=row*FRAME.h;
  const pic=sprite.pic;
  if(sx+FRAME.w<=pic.naturalWidth&&sy+FRAME.h<=pic.naturalHeight){
   const saved=action?(edits?.get(storageActor,action,actor.direction,frame)||
    edits?.get(actor.profile,action,actor.direction,frame)):null;
   const matched=saved||(actionFallback[action]||[]).map(id=>
    (edits?.get(storageActor,id,actor.direction,frame)||
     edits?.get(actor.profile,id,actor.direction,frame))).find(Boolean)||null;
   const patched=matched?image(matched):null;
   const worn=bridge?.equipmentFor(storageActor)||{};
   const urls=(resolved.source==='universal-sleep'?[null,null,null,null,null]:
     ['bag','shoes','pants','shirt','helmet'].map(k=>worn[k]?.frames?.[actor.direction]||null));
   const layers=urls.map(image);
   // Render isolated actor pixels before modifying the outfit. The main
   // scene canvas contains furniture and must never be color-sampled.
   const composite=bodyRule?document.createElement('canvas'):null;
   if(composite){composite.width=64;composite.height=112;}
   const paint=composite?composite.getContext('2d',{willReadFrequently:true}):ctx;
   paint.imageSmoothingEnabled=false;
   const dx=composite?0:x,dy=composite?0:y;
   const dw=composite?64:drawWidth,dh=composite?112:drawHeight;
   const drawPart=entry=>{
    if(entry?.ready&&entry.pic.naturalWidth>=FRAME.w&&entry.pic.naturalHeight>=FRAME.h)
     paint.drawImage(entry.pic,0,0,FRAME.w,FRAME.h,dx,dy,dw,dh);
   };
   const rearView=actor.direction==='ne'||actor.direction==='nw';
   if(!rearView)drawPart(layers[0]);
   if(patched?.ready)
    paint.drawImage(patched.pic,0,0,FRAME.w,FRAME.h,dx,dy,dw,dh);
   else paint.drawImage(pic,sx,sy,FRAME.w,FRAME.h,dx,dy,dw,dh);
   for(let i=1;i<4;i++)drawPart(layers[i]);
   // Back-view backpack is ON the back torso, never over the head/neck.
   if(rearView&&layers[0]?.ready){
    paint.save();paint.beginPath();
    paint.rect(dx,dy+56*(composite?1:scale),dw,(FRAME.h-56)*(composite?1:scale));paint.clip();
    drawPart(layers[0]);
    paint.restore();
   }
   drawPart(layers[4]);
   if(composite){
    if(BODY.apply(paint,{actor:actorProfile,action:actor.actionId||actor.pose,
      direction:actor.direction,frame,bodyImage:bareAtlas.pic}))
     ctx.drawImage(composite,x,y,drawWidth,drawHeight);
    else silhouette(ctx,x,y,scale,actor.pose);
   }
   drawn=true;
  }
 }
 if(!drawn)silhouette(ctx,x,y,scale,actor.pose);
 // Hide the scale ruler while sitting so it does not cover the WC/character contact.
 if(options.seated)return drawn;
 // Crosshair marks the actual Mahluk Hidup floor pivot without modifying pixels.
 ctx.fillStyle='#d64745';
 ctx.fillRect(Math.round(footX)-3,Math.round(footY),7,1);
 ctx.fillRect(Math.round(footX),Math.round(footY)-3,1,7);
 // The scale ruler is an overlay only, and is never exported.
 const markerX=Math.round(footX+FRAME.pivotX*scale+5);
 const topY=Math.round(footY-FRAME.pivotY*scale);
 ctx.fillStyle='#184b8a';
 ctx.fillRect(markerX,topY,1,FRAME.pivotY);
 ctx.fillRect(markerX-3,topY,7,1);ctx.fillRect(markerX-3,Math.round(footY)-1,7,1);
 ctx.font='9px monospace';
 ctx.fillText('body '+(g.VLGameProportions?.character.visibleHeight||72)+' px',
  markerX+4,topY+10);
 return drawn;
}
function mount(api){
 const canvas=$('characterScaleCanvas'),stage=$('previewStage'),choose=$('scaleCharacter');
 const ctx=canvas?.getContext('2d',{alpha:true});
 if(!canvas||!stage||!ctx||!model)return null;
 const actor={active:false,profile:'ichsan',scene:'exterior',c:0,r:0,floor:1,
  pose:'idle',actionId:null,direction:'sw',moving:false,armed:false,segments:[],current:null,
  actionAnchor:null,adjusting:false,adjustmentDraft:null,drag:null,
   transformMode:'move',transformSelected:true,transformSnap:1,gizmoOrigin:null,
  walkProgress:0,then:null};
 let elapsed=0,lastFrame=0,lastDraw=0,activeSource=null;
 function cfg(){return api.getConfig();}
 function inside(){return api.isInterior?.()===true;}
 function spriteDir(){return api.getFacing?.()||'sw';}
 function spawnPoint(){
  const c=cfg();
  return c.front==='se'?[c.w/2+1.1,0]:[0,c.d/2+1.1];
 }
 function doorPoint(){
  const c=cfg();
  return c.front==='se'?[c.w/2+.17,0]:[0,c.d/2+.17];
 }
 function status(message){
  $('scaleStatus').textContent=message;
  api.onStatus?.(message);
 }
 function updateControls(){
  const active=actor.active,interior=inside();
  $('scaleRemove').disabled=!active;
  $('scaleIdle').disabled=!active;
  $('scaleWalkDoor').disabled=!active||interior||cfg().interactive!==true||actor.scene!=='exterior';
  $('scaleUse').disabled=!active||!interior||actor.scene!=='interior'||actor.floor!==api.getInterior?.()?.floor||!api.getSelectedProp?.();
  $('scaleSpawn').classList.toggle('active',actor.armed);
  $('scaleSpawn').textContent=actor.armed?'⌖ Tap Canvas':'＋ Place';
 }
 function showCharacter(){
  return actor.active&&((inside()&&actor.scene==='interior'&&
   actor.floor===api.getInterior?.()?.floor)||(!inside()&&actor.scene==='exterior'));
 }
 function target(){
  if(inside())return $('interiorCanvas');
  const guide=$('buildingGuideCanvas');
  return !guide.hidden?guide:$('preview');
 }
 function positionOverlay(src){
  if(!src)return false;
  const stageRect=stage.getBoundingClientRect(),rect=src.getBoundingClientRect();
  const naturalWidth=src.naturalWidth||src.width,naturalHeight=src.naturalHeight||src.height;
  if(!stageRect.width||!rect.width||!naturalWidth||!naturalHeight)return false;
  // Match the *actual* CSS image box independently on each axis.
  // Scaling with a single min() left gizmo hit coordinates offset when
  // the editor CSS constrained one axis differently from the other.
  const width=rect.width,height=rect.height;
  const left=rect.left-stageRect.left+stage.scrollLeft;
  const top=rect.top-stageRect.top+stage.scrollTop;
  if(canvas.width!==naturalWidth)canvas.width=naturalWidth;
  if(canvas.height!==naturalHeight)canvas.height=naturalHeight;
  canvas.style.left=left+'px';canvas.style.top=top+'px';
  canvas.style.width=width+'px';canvas.style.height=height+'px';
  canvas.style.pointerEvents=(actor.armed||actor.adjusting)?'auto':'none';
  canvas.style.cursor=actor.adjusting?(actor.transformMode==='rotate'?'crosshair':actor.transformMode==='select'?'default':'grab'):actor.armed?'crosshair':'default';
  canvas.style.touchAction=actor.adjusting?'none':'auto';
  ctx.imageSmoothingEnabled=false;return true;
 }
 function draw(){
  if(!showCharacter()){canvas.hidden=true;return;}
  const src=target();if(!positionOverlay(src)){canvas.hidden=true;return;}
  canvas.hidden=false;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  let x,y,interiorGeometry=null;
  if(inside()){
   const s=api.getInterior?.();if(!s)return;
   if(api.getInteriorView?.()==='plan'){
    x=(actor.c+.5)*28;y=(actor.r+.5)*28;
    ctx.fillStyle='#f3d369';ctx.fillRect(Math.round(x)-8,Math.round(y)-8,16,16);
    ctx.fillStyle='#1b4c7c';ctx.fillRect(Math.round(x)-5,Math.round(y)-6,10,12);
    ctx.fillStyle='#f4f1ea';ctx.font='9px monospace';
    ctx.fillText('NPC',Math.round(x)+9,Math.round(y));
    return;
   }
   const geo=iso?.bounds(s);
   if(!geo)return;
   interiorGeometry=geo;
   if(actor.actionAnchor){
    const live=s.items?.find(item=>item.id===actor.actionAnchor.itemId);
    if(!live)leaveAction();
    else {
     // Furniture can be moved or rotated while the actor is seated.
     // Use the shared CURRENT fixture geometry, never a stale anchor.
     const seat=actor.adjusting?
      iso.actionAnchor(live,{raw:true,generic:true}):
      iso.actionAnchor(live);
     if(!seat)leaveAction();
     else {
      const anchor=actor.adjusting&&ADJUST?
       ADJUST.apply(seat,{actionAdjustments:{[live.actionId]:actor.adjustmentDraft}},live.actionId):seat;
      actor.actionAnchor={...anchor,approach:actor.actionAnchor.approach};
      actor.c=anchor.c-.5;actor.r=anchor.r-.5;
      actor.direction=anchor.direction;
     }
    }
   }
   if(actor.actionAnchor){
    [x,y]=iso.point(geo,actor.actionAnchor.c,actor.actionAnchor.r,actor.actionAnchor.z||0);
    x+=actor.actionAnchor.pixelOffsetX||0;
    y+=actor.actionAnchor.pixelOffsetY||0;
   }else [x,y]=iso.point(geo,actor.c+.5,actor.r+.5,0);
  }else{
   const v=api.getExterior(),pivot=v?.pivot;
   if(!pivot)return;
   x=pivot[0]+(actor.c-actor.r)*32;
   y=pivot[1]+(actor.c+actor.r)*16;
  }
  const valid=drawActor(ctx,actor,elapsed,x,y,{seated:!!actor.actionAnchor});
  if(interiorGeometry&&actor.actionAnchor){
   const item=api.getInterior?.()?.items?.find(x=>x.id===actor.actionAnchor.itemId);
   if(item&&actor.actionAnchor.objectLayer!=='front')iso?.drawSeatForeground?.(ctx,interiorGeometry,item);
  }
  // Always draw the on-screen gizmo LAST, above furniture and actor.
  // It is editor-only and is never saved as artwork or exported to Semesta.
  if(actor.adjusting&&actor.transformSelected&&GIZMO){
   actor.gizmoOrigin=GIZMO.center({x,y},actor.pose);
   const selected=api.getSelectedProp?.();
   const native=selected?iso?.actionAnchor?.(selected,{raw:true,generic:true}):null;
   GIZMO.draw(ctx,actor.gizmoOrigin,{
    mode:actor.transformMode,hot:actor.drag?.handle||'',
    direction:actor.adjustmentDraft?.direction,
    baseDirection:native?.direction||'sw'});
  }else actor.gizmoOrigin=null;
  if(!valid&&bridge?.ready&&!actor.reported){
   actor.reported=true;$('scaleStatus').textContent='Scale fallback · source sprite may be loading';
  }
 }
 function stop(){
  actor.segments=[];actor.current=null;actor.walkProgress=0;actor.moving=false;actor.then=null;
 }
 function leaveAction(){
  // Restore a freely walkable approach tile when standing up.
  if(actor.actionAnchor?.approach)
   [actor.c,actor.r]=actor.actionAnchor.approach;
  actor.actionAnchor=null;actor.pose='idle';actor.actionId=null;actor.adjusting=false;
  actor.adjustmentDraft=null;actor.drag=null;actor.gizmoOrigin=null;
 }
 function placeDefault(){
  const p=spawnPoint();actor.c=p[0];actor.r=p[1];actor.floor=1;actor.scene='exterior';
 }
 function spawn(){
  if(!actor.active){
   actor.active=true;actor.profile=choose.value||'ichsan';
   placeDefault();actor.direction=spriteDir();actor.pose='idle';
  }
  leaveAction();stop();actor.armed=!actor.armed;
  status(actor.armed?'Tap on the exterior or interior canvas to place character':'Character placement ready');
  updateControls();draw();
 }
 function placeAt(c,r,mode){
  if(!actor.active||!actor.armed)return false;
  if(mode==='interior'){
   const s=api.getInterior?.();
   if(!s||!available(s,Math.floor(c),Math.floor(r))){status('Character placement blocked by furniture or walls');return true;}
   actor.c=Math.floor(c);actor.r=Math.floor(r);actor.floor=s.floor;
   actor.scene='interior';
  }else{
   actor.c=clamp(c,-24,24);actor.r=clamp(r,-24,24);
   actor.scene='exterior';
  }
  actor.actionAnchor=null;actor.pose='idle';actor.armed=false;stop();updateControls();draw();
  status('Mahluk Hidup: '+actor.profile+' placed at C '+actor.c+', R '+actor.r);
  return true;
 }
 function walk(points,callback){
  if(!points||points.length<2){callback?.();return false;}
  actor.segments=points.slice(1).map(p=>coords(p));
  actor.current=null;actor.walkProgress=0;actor.moving=true;actor.pose='walk';actor.then=callback||null;
  updateControls();return true;
 }
 function step(dt){
  if(!actor.moving)return;
  if(!actor.current){
   const p=actor.segments.shift();
   if(!p){actor.moving=false;actor.pose='idle';const done=actor.then;actor.then=null;done?.();return;}
   actor.current={from:[actor.c,actor.r],to:p};actor.walkProgress=0;
   const dx=p[0]-actor.c,dz=p[1]-actor.r;
   actor.direction=rig?.directionFromWorld(dx,dz,actor.direction)||actor.direction;
  }
  const src=actor.current.from,dst=actor.current.to;
  const dist=Math.max(.01,Math.hypot(dst[0]-src[0],dst[1]-src[1]));
  actor.walkProgress=clamp(actor.walkProgress+dt*2.4/dist,0,1);
  const t=actor.walkProgress;actor.c=src[0]+(dst[0]-src[0])*t;actor.r=src[1]+(dst[1]-src[1])*t;
  if(t>=1){actor.c=dst[0];actor.r=dst[1];actor.current=null;}
 }
 function enterDoor(){
  if(!actor.active||actor.scene!=='exterior'||cfg().interactive!==true){
   status('Enable Interactive Building and place a character first');return;
  }
  leaveAction();actor.armed=false;const start=[actor.c,actor.r],dest=doorPoint();
  const arrived=()=>{
   const s=api.getInterior?.();
   // Ensure the floor shown is ground floor, then place on the entrance tile.
   api.openInterior?.();
   const entry=api.getInterior?.()?.entrance||{c:2,r:3};
   actor.scene='interior';actor.floor=1;actor.c=entry.c;actor.r=entry.r;
   actor.pose='idle';updateControls();draw();
   status('Entered building · character at entrance (editor simulation)');
  };
  walk([start,dest],arrived);
 }
 function beginAdjustment(draft){
  const item=api.getSelectedProp?.(),room=api.getInterior?.();
  if(!item||!room){status('Select furniture in the interior first');return false;}
  actor.active=true;actor.profile=choose.value||actor.profile;
  actor.armed=false;actor.scene='interior';actor.floor=room.floor;stop();
  actor.adjusting=true;actor.gizmoOrigin=null;actor.transformSelected=true;actor.adjustmentDraft=ADJUST?.normalize(
    draft||ADJUST.get(item,item.actionId))||{x:0,y:0,direction:'auto',layer:'behind'};
  const base=iso?.actionAnchor?.(item,{raw:true,generic:true});
  if(!base){status('Cannot calculate an interaction anchor for '+item.name);return false;}
  // Retain a collision-free exit tile. Adjustment must never leave the
  // actor trapped on the WC/bed footprint after pressing Idle.
  const oldApproach=actor.actionAnchor?.approach;
  const free=actor.scene==='interior'&&available(room,Math.round(actor.c),Math.round(actor.r))?
   [Math.round(actor.c),Math.round(actor.r)]:null;
  const exitTile=oldApproach||free||[room.entrance?.c||0,room.entrance?.r||0];
  actor.actionAnchor={...base,approach:exitTile};
  actor.pose=model.actions?.[item.actionId]?.pose||'idle';actor.actionId=item.actionId;
  actor.c=base.c-.5;actor.r=base.r-.5;
  actor.direction=actor.adjustmentDraft.direction==='auto'?base.direction:actor.adjustmentDraft.direction;
  actor.reported=false;updateControls();draw();
  status('ADJUST '+item.name+' / '+item.actionId+' · drag character or nudge / Save Adjustment');
  return true;
 }
 function setTransformMode(mode){
  actor.transformMode=['select','move','rotate'].includes(mode)?mode:'move';
  actor.transformSelected=mode!=='select';
  if(actor.adjusting)draw();
  return actor.transformMode;
 }
 function setTransformSnap(step){
  actor.transformSnap=GIZMO?.normalizeSnap(step)||1;
  return actor.transformSnap;
 }
 function previewAdjustment(draft){
  const item=api.getSelectedProp?.();
  if(!item)return false;
  if(!actor.adjusting||actor.actionAnchor?.itemId!==item.id)return beginAdjustment(draft);
  actor.adjustmentDraft=ADJUST?.normalize(draft)||actor.adjustmentDraft;
  draw();return true;
 }
 function endAdjustment(){
  if(!actor.adjusting)return false;
  leaveAction();stop();updateControls();draw();
  status('Action placement closed / unsaved changes discarded');
  return true;
 }
 function isAdjusting(id,action){
  const item=api.getSelectedProp?.();
  return Boolean(actor.adjusting&&actor.actionAnchor?.itemId===id&&item?.actionId===action);
 }
 function useSelected(){
  if(!actor.active||actor.scene!=='interior'){status('Place character inside the interior first');return;}
  const item=api.getSelectedProp?.(),scene=api.getInterior?.();
  if(!item||!scene){status('Select WC, bed, chair or another interior prop first');return;}
  if(actor.floor!==scene.floor){status('Place the character on this floor before testing the action');return;}
  actor.armed=false;leaveAction();
  const start=[Math.round(actor.c),Math.round(actor.r)];
  const path=pathTo(scene,start,[item.c,item.r],{item});
  if(!path.length){status('No free route to '+item.name+' · move blocking furniture');return;}
  const action=model.actions?.[item.actionId],pose=action?.pose;
  const anchor=pose&&['toilet','sit','sleep','lie','work','bathe'].includes(pose)?
    iso?.actionAnchor?.(item):null;
  const approach=path[path.length-1];
  const finish=()=>{
   if(anchor){
    actor.c=anchor.c-.5;actor.r=anchor.r-.5;
    actor.actionAnchor={...anchor,approach:[...approach]};
    actor.direction=anchor.direction;
   }
   actor.pose=pose||'idle';actor.actionId=item.actionId;actor.moving=false;
   const requested=pose?({toilet:'sit',bathe:'swim',work:'sit_type'}[pose]||pose):'idle';
   const motion=rig?.resolve(actor.profile,pose,false);
   const supported=pose&&motion?.mode===requested;
   status('Use '+item.name+' → '+item.actionId+' · '+(supported?
    'Mahluk Hidup pose '+pose+(anchor?(item.assetId==='bed'?' / aligned to mattress':' / aligned to seat'):''):
    'No authored rig; metadata action only'));
   updateControls();draw();
  };
  const done=()=>{
   if(anchor){
    // Last step moves from the free approach tile ONTO the fixture seat.
    // This movement is separate from the collision-safe floor path.
    status('Aligning character with '+item.name+(item.assetId==='bed'?' mattress...':' seat...'));
    walk([[actor.c,actor.r],[anchor.c-.5,anchor.r-.5]],finish);
   }else finish();
  };
  status('Character walking to '+item.name+'...');
  if(path.length<2)done();else walk(path,done);
 }
 function showProfiles(){
  const previous=choose.value;choose.replaceChildren();
  const entries=bridge?.list?.()||[];
  const fallback=[{id:'ichsan',name:'Ichsan / V6B'}];
  const catalog=entries.length?entries:fallback;
  for(const item of catalog){
   const option=document.createElement('option');option.value=item.id;
   option.textContent=item.name+(item.custom?' · Saved':'');
   choose.append(option);
  }
  choose.value=catalog.some(c=>c.id===previous)?previous:catalog[0]?.id||'ichsan';
  actor.profile=choose.value;
  if(!entries.length)$('scaleStatus').textContent='Catalog not loaded · 64×112 scale stand-in if offline';
 }
 choose.onchange=()=>{leaveAction();stop();actor.profile=choose.value;actor.pose='idle';actor.reported=false;
  status('Selected Mahluk Hidup · '+choose.selectedOptions?.[0]?.textContent||actor.profile);};
 $('scaleSpawn').onclick=spawn;
 $('scaleRemove').onclick=()=>{
  actor.active=false;actor.armed=false;actor.actionAnchor=null;stop();canvas.hidden=true;
  updateControls();status('Character reference removed · building unchanged');
 };
 $('scaleWalkDoor').onclick=enterDoor;
 $('scaleUse').onclick=useSelected;
 $('scaleIdle').onclick=()=>{leaveAction();stop();updateControls();draw();status('Idle / Mahluk Hidup');};
 $('scaleEditAction').onclick=()=>api.openAdjustment?.();
 canvas.addEventListener('pointerdown',e=>{
  if(actor.adjusting&&showCharacter()){
   const box=canvas.getBoundingClientRect();if(!box.width||!box.height)return;
   const p={x:(e.clientX-box.left)*canvas.width/box.width,
    y:(e.clientY-box.top)*canvas.height/box.height};
   const handle=actor.transformSelected&&actor.transformMode!=='select'?
    GIZMO?.hit(actor.gizmoOrigin,p,actor.transformMode):null;
   if(!handle){
    // Furniture stays clickable through the transparent actor overlay.
    // This enables one tap to select another action target directly.
    if(inside()&&api.onActionCanvasTap?.(e)===true){
     e.preventDefault();return;
    }
    actor.transformSelected=false;actor.transformMode='select';
    draw();e.preventDefault();return;
   }
   const item=api.getSelectedProp?.();
   const native=item?iso?.actionAnchor?.(item,{raw:true,generic:true}):null;
   actor.drag={id:e.pointerId,handle,start:p,base:{...actor.adjustmentDraft},
    center:{...actor.gizmoOrigin},baseDirection:native?.direction||'sw'};
   canvas.setPointerCapture?.(e.pointerId);draw();e.preventDefault();return;
  }
  if(!actor.armed||!showCharacter())return;
  const b=canvas.getBoundingClientRect();
  const x=(e.clientX-b.left)*canvas.width/b.width,y=(e.clientY-b.top)*canvas.height/b.height;
  if(inside()){
   const s=api.getInterior?.();let p;
   if(api.getInteriorView?.()==='plan')p={c:Math.floor(x/28),r:Math.floor(y/28)};
   else p=iso?.tileAt(iso.bounds(s),x,y);
   if(p)placeAt(p.c,p.r,'interior');
  }else{
   const v=api.getExterior(),pivot=v?.pivot;if(!pivot)return;
   const u=(x-pivot[0])/32,zz=(y-pivot[1])/16;
   placeAt((u+zz)/2,(zz-u)/2,'exterior');
  }
  e.preventDefault();
 });
 canvas.addEventListener('pointermove',e=>{
  if(!actor.adjusting||!actor.drag||actor.drag.id!==e.pointerId)return;
  const box=canvas.getBoundingClientRect();if(!box.width||!box.height)return;
  const p={x:(e.clientX-box.left)*canvas.width/box.width,
   y:(e.clientY-box.top)*canvas.height/box.height};
  const gesture=actor.drag;
  const draft=gesture.handle==='rotate'?
   {...gesture.base,direction:GIZMO.rotateGesture({
      center:gesture.center,direction:gesture.base.direction
    },gesture.start,p,gesture.baseDirection)}:
   GIZMO.dragged(gesture.base,gesture.handle,
    p.x-gesture.start.x,p.y-gesture.start.y,
    e.shiftKey?Math.max(actor.transformSnap,8):actor.transformSnap);
  actor.adjustmentDraft=ADJUST?.normalize(draft)||actor.adjustmentDraft;
  api.onAdjustmentChange?.(actor.adjustmentDraft);draw();e.preventDefault();
 });
 for(const type of ['pointerup','pointercancel'])canvas.addEventListener(type,e=>{
  if(actor.drag?.id===e.pointerId){
   actor.drag=null;try{canvas.releasePointerCapture?.(e.pointerId)}catch{}
   e.preventDefault();
  }
 });
 async function refreshProfiles(full=false){
  try{
   if(bridge){
    if(full||!bridge.ready)await bridge.load();
    else bridge.localSync();
   }
   showProfiles();updateControls();draw();
   status(bridge?.ready?'Mahluk Hidup synced · 64×112 native frame':
    'Mahluk Hidup unavailable · size-only fallback');
  }catch(error){
   status('Mahluk Hidup refresh failed · current character kept');
  }
 }
 showProfiles();
 refreshProfiles(true);
 function tick(now){
  const dt=lastFrame?Math.min(.06,Math.max(0,(now-lastFrame)/1000)):0;
  lastFrame=now;
  if(actor.active){
   elapsed+=dt;step(dt);
   if(now-lastDraw>60){updateControls();draw();lastDraw=now;}
  }
  requestAnimationFrame(tick);
 }
 requestAnimationFrame(tick);
 updateControls();
 return Object.freeze({placeAt,refreshProfiles,beginAdjustment,previewAdjustment,endAdjustment,isAdjusting,
  setTransformMode,setTransformSnap,
  sync(){updateControls();draw();},reset(){
  actor.active=false;actor.armed=false;stop();canvas.hidden=true;updateControls();
 },get actor(){return {...actor};},pathTo});
}
g.VLCharacterScale=Object.freeze({mount,pathTo,available,FRAME,ACTOR_SCALE});
})(window);
