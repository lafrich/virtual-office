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
const bridge=g.VLMahlukHidup,rig=g.VLCharacterRig,model=g.VLBuildingInterior,iso=g.VLInteriorIso;
const FRAME=rig?.FRAME||{w:64,h:112,pivotX:32,pivotY:100};
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
function silhouette(ctx,x,y){
 // Native 64x112 scale stand-in when a source sheet is not unlocked/loaded.
 ctx.fillStyle='#8293a8';
 ctx.fillRect(Math.round(x)+17,Math.round(y)+16,30,34);
 ctx.fillRect(Math.round(x)+21,Math.round(y)+6,22,19);
 ctx.fillRect(Math.round(x)+11,Math.round(y)+50,42,24);
 ctx.fillRect(Math.round(x)+18,Math.round(y)+74,11,28);
 ctx.fillRect(Math.round(x)+35,Math.round(y)+74,11,28);
 ctx.fillStyle='#4c617a';
 ctx.fillRect(Math.round(x)+17,Math.round(y)+99,13,2);
 ctx.fillRect(Math.round(x)+34,Math.round(y)+99,13,2);
 ctx.fillStyle='#1c436c';ctx.font='8px monospace';ctx.fillText('64x112',Math.round(x)+11,Math.round(y)+8);
}
function drawActor(ctx,actor,time,footX,footY){
 const x=Math.round(footX-FRAME.pivotX),y=Math.round(footY-FRAME.pivotY);
 const resolved=rig?.resolve(actor.profile,actor.pose,actor.moving);
 const sprite=resolved?.url?image(resolved.url):null;
 let drawn=false;
 if(sprite?.ready&&resolved){
  const direct=DIR.indexOf(actor.direction);
  const row=(resolved.row||0)+(direct<0?1:direct);
  const frame=rig.frameAt(resolved,time);
  const sx=frame*FRAME.w,sy=row*FRAME.h;
  const pic=sprite.pic;
  if(sx+FRAME.w<=pic.naturalWidth&&sy+FRAME.h<=pic.naturalHeight){
   const worn=bridge?.equipmentFor(actor.profile)||{};
   const urls=['bag','shoes','pants','shirt','helmet'].map(k=>worn[k]?.frames?.[actor.direction]||null);
   const layers=urls.map(image);
   const drawPart=entry=>{
    if(entry?.ready&&entry.pic.naturalWidth>=FRAME.w&&entry.pic.naturalHeight>=FRAME.h)
     ctx.drawImage(entry.pic,0,0,FRAME.w,FRAME.h,x,y,FRAME.w,FRAME.h);
   };
   drawPart(layers[0]);
   ctx.drawImage(pic,sx,sy,FRAME.w,FRAME.h,x,y,FRAME.w,FRAME.h);
   for(let i=1;i<layers.length;i++)drawPart(layers[i]);
   drawn=true;
  }
 }
 if(!drawn)silhouette(ctx,x,y);
 // Crosshair marks the actual Mahluk Hidup floor pivot without modifying pixels.
 ctx.fillStyle='#d64745';
 ctx.fillRect(Math.round(footX)-3,Math.round(footY),7,1);
 ctx.fillRect(Math.round(footX),Math.round(footY)-3,1,7);
 // The scale ruler is an overlay only, and is never exported.
 const markerX=Math.round(footX+37),topY=Math.round(footY-FRAME.pivotY);
 ctx.fillStyle='#184b8a';
 ctx.fillRect(markerX,topY,1,FRAME.pivotY);
 ctx.fillRect(markerX-3,topY,7,1);ctx.fillRect(markerX-3,Math.round(footY)-1,7,1);
 ctx.font='9px monospace';
 ctx.fillText('112 px',markerX+4,topY+10);
 return drawn;
}
function mount(api){
 const canvas=$('characterScaleCanvas'),stage=$('previewStage'),choose=$('scaleCharacter');
 const ctx=canvas?.getContext('2d',{alpha:true});
 if(!canvas||!stage||!ctx||!model)return null;
 const actor={active:false,profile:'ichsan',scene:'exterior',c:0,r:0,floor:1,
  pose:'idle',direction:'sw',moving:false,armed:false,segments:[],current:null,
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
  $('scaleUse').disabled=!active||!interior||actor.scene!=='interior'||!api.getSelectedProp?.();
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
  const scale=Math.min(rect.width/naturalWidth,rect.height/naturalHeight);
  const width=naturalWidth*scale,height=naturalHeight*scale;
  const left=rect.left-stageRect.left+(rect.width-width)/2;
  const top=rect.top-stageRect.top+(rect.height-height)/2;
  if(canvas.width!==naturalWidth)canvas.width=naturalWidth;
  if(canvas.height!==naturalHeight)canvas.height=naturalHeight;
  canvas.style.left=left+'px';canvas.style.top=top+'px';
  canvas.style.width=width+'px';canvas.style.height=height+'px';
  canvas.style.pointerEvents=actor.armed?'auto':'none';
  ctx.imageSmoothingEnabled=false;return true;
 }
 function draw(){
  if(!showCharacter()){canvas.hidden=true;return;}
  const src=target();if(!positionOverlay(src)){canvas.hidden=true;return;}
  canvas.hidden=false;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  let x,y;
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
   [x,y]=iso.point(geo,actor.c+.5,actor.r+.5,0);
  }else{
   const v=api.getExterior(),pivot=v?.pivot;
   if(!pivot)return;
   x=pivot[0]+(actor.c-actor.r)*32;
   y=pivot[1]+(actor.c+actor.r)*16;
  }
  const valid=drawActor(ctx,actor,elapsed,x,y);
  if(!valid&&bridge?.ready&&!actor.reported){
   actor.reported=true;$('scaleStatus').textContent='Scale fallback · source sprite may be loading';
  }
 }
 function stop(){
  actor.segments=[];actor.current=null;actor.walkProgress=0;actor.moving=false;actor.then=null;
 }
 function placeDefault(){
  const p=spawnPoint();actor.c=p[0];actor.r=p[1];actor.floor=1;actor.scene='exterior';
 }
 function spawn(){
  if(!actor.active){
   actor.active=true;actor.profile=choose.value||'ichsan';
   placeDefault();actor.direction=spriteDir();actor.pose='idle';
  }
  stop();actor.armed=!actor.armed;
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
  actor.pose='idle';actor.armed=false;stop();updateControls();draw();
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
  actor.armed=false;const start=[actor.c,actor.r],dest=doorPoint();
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
 function useSelected(){
  if(!actor.active||actor.scene!=='interior'){status('Place character inside the interior first');return;}
  const item=api.getSelectedProp?.(),scene=api.getInterior?.();
  if(!item||!scene){status('Select WC, bed, chair or another interior prop first');return;}
  actor.armed=false;
  const start=[Math.round(actor.c),Math.round(actor.r)];
  const path=pathTo(scene,start,[item.c,item.r],{item});
  if(!path.length){status('No free route to '+item.name+' · move blocking furniture');return;}
  const action=model.actions?.[item.actionId],pose=action?.pose;
  const done=()=>{
   actor.pose=pose||'idle';actor.moving=false;
   const requested=pose?({toilet:'sit',bathe:'swim',work:'sit_type'}[pose]||pose):'idle';
   const motion=rig?.resolve(actor.profile,pose,false);
   const supported=pose&&motion?.mode===requested;
   status('Use '+item.name+' → '+item.actionId+' · '+(supported?
    'Mahluk Hidup pose '+pose:'No authored rig; metadata action only'));
   updateControls();draw();
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
 choose.onchange=()=>{actor.profile=choose.value;actor.pose='idle';actor.reported=false;
  status('Selected Mahluk Hidup · '+choose.selectedOptions?.[0]?.textContent||actor.profile);};
 $('scaleSpawn').onclick=spawn;
 $('scaleRemove').onclick=()=>{
  actor.active=false;actor.armed=false;stop();canvas.hidden=true;
  updateControls();status('Character reference removed · building unchanged');
 };
 $('scaleWalkDoor').onclick=enterDoor;
 $('scaleUse').onclick=useSelected;
 $('scaleIdle').onclick=()=>{actor.pose='idle';stop();status('Idle / Mahluk Hidup');};
 canvas.addEventListener('pointerdown',e=>{
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
 showProfiles();
 if(bridge){
  Promise.resolve(bridge.ready?bridge.localSync():bridge.load()).then(()=>{
   showProfiles();status(bridge.ready?'Mahluk Hidup synced · 64×112 true scale':'Mahluk Hidup unavailable · scale fallback');
  }).catch(()=>status('Mahluk Hidup unavailable · scale fallback'));
 }
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
 return Object.freeze({placeAt,sync(){updateControls();draw();},reset(){
  actor.active=false;actor.armed=false;stop();canvas.hidden=true;updateControls();
 },get actor(){return {...actor};},pathTo});
}
g.VLCharacterScale=Object.freeze({mount,pathTo,available,FRAME});
})(window);
