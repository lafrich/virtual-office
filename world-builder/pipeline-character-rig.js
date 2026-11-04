/* Semesta 4-way Mahluk Hidup character rig.
 * Published sprite catalog supplies true action sheets and frame timings;
 * local Character Storage supplies separately authored transparent equipment.
 * Legacy 44-row v6b sheets remain supported for existing world drafts.
 */
(function(g){
'use strict';
const DIR=['se','sw','ne','nw'];
const ROW={walk:0,idle:4,talk:8,sit:12,sit_type:16,sleep:20,tired:24,swim:28,float:32,lie:36,perch:40};
const FRAME={w:64,h:112,pivotX:32,pivotY:100};
const appearance=()=>g.VLActionAppearance;
const normalizeRotation=n=>((Math.round((Number(n)||0)/90)*90)%360+360)%360;
const ALIAS={grok:'grok_bot',warteg:'bu_warteg',barista:'fm_barista',kasir:'fm_kasir'};
const legacyIds=Object.fromEntries(
 [...(g.VLPipelineAssets?.characters||[]).map(x=>x.id),...Object.keys(ALIAS)]
 .map(id=>[id,ALIAS[id]||id]));
const bridge=()=>g.VLMahlukHidup;
const sleep=()=>g.VLUniversalSleep;
const body=()=>g.VLUniversalBodyActions;
const canonical=id=>bridge()?.has(id)?id:
 bridge()?.has('legacy_'+id)?'legacy_'+id:
 (legacyIds[id]||'ichsan');
const imgCache=new Map();
function image(url){
 if(!url)return null;
 if(!imgCache.has(url)){
  const pic=new Image();if(!url.startsWith('data:'))pic.crossOrigin='anonymous';
  const entry={pic,ready:false,error:false};
  pic.onload=()=>{entry.ready=pic.naturalWidth>=64&&pic.naturalHeight>=112};
  pic.onerror=()=>{entry.error=true;};
  pic.src=url;imgCache.set(url,entry);
 }
 return imgCache.get(url);
}
function normalize(dir){return DIR.includes(dir)?dir:'sw'}
function directionFromWorld(dx,dz,last='sw'){
 if(!Number.isFinite(dx)||!Number.isFinite(dz)||Math.hypot(dx,dz)<.00001)return normalize(last);
 return Math.abs(dx)>=Math.abs(dz)?dx>0?'se':'nw':dz>0?'sw':'ne';
}
function resolve(id,requested,moving){
 const sourceId=canonical(id);
 // Local published templates outrank the stock rig. A mere frame edit or
 // planned action is NOT a playable animation until published in all 4 views.
 const template=requested&&g.VLActionTemplates?.get(sourceId,requested);
 if(template?.ready)return {url:null,mode:requested,frames:template.frames,
  row:0,durations:Array(template.frames).fill(template.frameMs),
  loop:template.loop,separate:true,source:'template',
  objectLayer:template.objectLayer,rotation:normalizeRotation(template.rotation),
  expression:template.expression||'neutral'};
 const entry=bridge()?.get(sourceId);
 const hygiene=entry&&body()?.resolve(entry,requested);
 if(hygiene?.kind==="bath"){
  const idle=entry.motions.find(m=>m.id==="idle"&&m.available!==false);
  if(idle){
   const url=bridge().url(idle.sheet||entry.sheet);
   if(url)return {url,mode:"bathe",frames:4,row:idle.sheet?0:idle.row,
    durations:[...hygiene.frameMs],loop:true,separate:!!idle.sheet,
    source:"universal-hygiene",bodyRule:hygiene};
  }
 }
 // Reuse the selected character's true horizontal LIE frames.
 // Sleep presets are native game actions, not stored per-actor template pixels.
 const sleepId=requested==="sleep"?"sleep_bed_right":requested;
 const nativeSleep=entry&&sleep()?.resolve(entry,sleepId);
 if(nativeSleep){
  const url=bridge().url(nativeSleep.sheet);
  if(url)return {url,mode:sleepId,frames:nativeSleep.frames,
   row:nativeSleep.row,durations:nativeSleep.frame_ms,
   loop:true,separate:nativeSleep.separate,source:"universal-sleep",
   objectLayer:"behind",rotation:0};
 }
 if(entry){
  const actions=entry.motions;
  if(sleep()?.isSleep(requested))return {source:"unavailable",
   mode:requested,frames:1,unavailable:true,loop:false,url:null};
  const possible=({bathe:['swim','bathe'],shower:['swim','bathe'],
   toilet:['sit','toilet'],toilet_sit:['sit','toilet'],
   sleep:['sleep','sleep_seat','lie'],rest:['lie','sleep','sleep_seat'],
   sit:['sit'],work:['sit_type','work'],office_type:['sit_type']
   }[requested]||[requested]);
  let motion=possible.map(id=>actions.find(m=>m.id===id&&m.available!==false)).find(Boolean);
  if(!motion&&moving)motion=actions.find(m=>m.id==='walk'&&m.available!==false);
  if(!motion&&!requested)motion=actions.find(m=>m.id==='idle'&&m.available!==false);
  if(!motion&&requested==='idle')motion=actions.find(m=>m.id==='idle'&&m.available!==false);
  if(!motion)return {source:'unavailable',mode:requested||'idle',frames:1,
   unavailable:true,loop:false,url:null};
  const separate=!!motion.sheet;
  const url=bridge().url(motion.sheet||entry.sheet);
  return {url,mode:motion.id,frames:motion.frames,row:separate?0:motion.row,
   durations:motion.frame_ms||[],loop:motion.loop!==false,separate,source:'mahluk-hidup'};
 }
 const url=g.VLPipelineAssets?.character(id);
 if(!url)return null;
 const act=({bathe:'swim',toilet:'sit',work:'sit_type'}[requested]||requested);
 if(requested&&!Object.hasOwn(ROW,act)&&!moving)
  return {url:null,mode:requested,frames:1,unavailable:true,source:'unavailable'};
 const mode=Object.hasOwn(ROW,act)?act:moving?'walk':'idle';
 return {url,mode,frames:mode==='walk'?6:mode==='idle'?4:6,
  row:ROW[mode],durations:[],loop:true,separate:false,source:'pipeline-v6b'};
}
function frameAt(spec,time){
 if(!spec||spec.frames<1)return 0;
 const durations=Array.from({length:spec.frames},(_,i)=>{
  const ms=Number(spec.durations[i]);
  return Math.max(40,Math.min(2000,Number.isFinite(ms)&&ms>0?ms:(spec.mode==='walk'?145:240)));
 });
 const total=durations.reduce((a,b)=>a+b,0);
 let t=spec.loop?((time*1000)%total):Math.min(total-.001,time*1000);
 for(let i=0;i<durations.length;i++){if(t<durations[i])return i;t-=durations[i];}
 return spec.frames-1;
}
function createRig(THREE,opt={}){
 let who=canonical(opt.profile||opt.characterId||'ichsan');
 const cv=document.createElement('canvas');cv.width=64;cv.height=112;
 const ctx=cv.getContext('2d',{alpha:true});ctx.imageSmoothingEnabled=false;
 const texture=new THREE.CanvasTexture(cv);texture.colorSpace=THREE.SRGBColorSpace;
 texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;
 const mat=new THREE.MeshBasicMaterial({map:texture,transparent:false,alphaTest:.45,
  depthTest:true,depthWrite:true,side:THREE.DoubleSide});
 const pixelWorld=Math.SQRT2/64;
 const h=FRAME.h*pixelWorld/(Math.sqrt(3)/2),w=FRAME.w*pixelWorld;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
 mesh.position.y=h*(FRAME.pivotY/FRAME.h-.5);
 mesh.userData.characterBillboard=true;mesh.userData.characterSource='mahluk-hidup';
 mesh.userData.nativeFrame=FRAME;mesh.userData.tilePixels=[64,32];mesh.userData.pixelWorld=pixelWorld;
 const state={direction:normalize(opt.direction),moving:false,walk:0,pose:opt.pose||null,
  profile:opt.profile||opt.characterId||'ichsan',characterId:who,loaded:false,failed:false,
  rotation:0,expression:'neutral',objectLayer:'front'};
 let previous='',time=0,lastAction='';
 function render(){
  const spec=resolve(who,state.pose,state.moving);
  if(!spec){state.loaded=false;state.failed=true;return;}
  state.objectLayer=spec.objectLayer||'front';
  state.rotation=spec.source==='template'?normalizeRotation(spec.rotation):0;
  state.expression=spec.source==='template'?spec.expression||'neutral':'neutral';
  if(spec.unavailable){
   // A missing gameplay action must NEVER silently become the idle animation.
   const key='UNAUTHORED:'+who+':'+state.pose;
   if(key!==previous){
    ctx.clearRect(0,0,64,112);
    ctx.fillStyle='#193a77';ctx.fillRect(19,43,26,44);
    ctx.fillStyle='#8a9ab7';ctx.fillRect(24,25,16,18);
    ctx.fillStyle='#e8dfb2';ctx.font='bold 8px monospace';
    ctx.fillText('NO RIG',17,99);
    texture.needsUpdate=true;previous=key;
   }
   state.loaded=false;state.failed=false;return;
  }
  const motionKey=state.pose||spec.mode;
  if(lastAction!==motionKey){time=0;previous='';lastAction=motionKey;}
  const count=Math.max(1,Math.min(40,spec.frames)),frame=Math.min(frameAt(spec,time),count-1);
  const sleepPose=spec.source==="universal-sleep";
  const actualDir=sleepPose?sleep().directionFor(spec.mode,state.direction):
   state.direction;
  const dir=DIR.indexOf(actualDir),row=spec.row+dir;
  const sprite=spec.source==='template'?null:image(spec.url),asset=bridge()?.get(who);
  const face=spec.source==='template'&&spec.expression!=='neutral'?
   (asset?.expressions||[]).find(f=>f.id===spec.expression):null;
  const facePath=face?.overlay||face?.sheet||null;
  const faceImage=facePath?image(bridge()?.url(facePath)):null;
  const hygiene=asset&&body()?.resolve(asset,state.pose||spec.mode);
  const bareAtlas=hygiene?image(bridge()?.url(hygiene.sheet)):null;
  const equipped=asset?bridge().equipmentFor(who):{};
  const layer=(slot)=>equipped[slot]?.frames?.[state.direction];
  // Standing equipment layers have the wrong anchors on horizontal bodies.
  // The native lie frame already includes the actor's own base clothing.
  const overlayUrls=(spec.source==="universal-sleep"?
   [null,null,null,null,null]:
   ['bag','shoes','pants','shirt','helmet'].map(layer));
  const overlays=overlayUrls.map(url=>image(url));
  // Edited canonical activities follow the exact gameplay pose ID when
  // available; legacy furniture aliases preserve old WC/shower/sleep edits.
  const action=typeof state.pose==='string'&&/^[a-z][a-z0-9_]{0,89}$/.test(state.pose)?
   state.pose:null;
  const actionFallback={
   use_toilet:['toilet_sit','toilet'],toilet:['toilet_sit'],
   pee:['pee_stand','toilet'],poop:['toilet_sit','toilet'],
   shower:['bathe'],bath:['bathe'],rest:['sleep'],lie:['lie_down','sleep'],
   wash:['wash_hands'],work:['office_type'],study:['study_online','office_type'],
   cook:['cook_stir'],sit:['sit_idle'],relax:['sit_idle']
  };
  const editedExact=action?(g.VLActionFrames?.get(who,action,state.direction,frame)||
   g.VLActionFrames?.get(state.profile,action,state.direction,frame)):null;
  const editURL=spec.source==='template'?
   g.VLActionTemplates?.frame(who,action,state.direction,frame):
   editedExact||(actionFallback[action]||[]).map(id=>
    (g.VLActionFrames?.get(who,id,state.direction,frame)||
    g.VLActionFrames?.get(state.profile,id,state.direction,frame))).find(Boolean)||null;
  const edited=editURL?image(editURL):null;
  const status=overlays.map(o=>o?.ready?'1':'0').join('');
  // Full content fingerprint prevents two same-length pixel edits from sharing
  // a stale cached GPU texture while the same action frame is displayed.
  const editTag=editURL||'';
  const key=[who,spec.url,spec.mode,row,frame,hygiene?.sheet,bareAtlas?.ready,...overlayUrls.map(x=>x?.length||0),
   status,editTag,edited?.ready,facePath,faceImage?.ready,
   state.expression,state.rotation].join(':');
  const templated=spec.source==='template';
  state.loaded=templated?!!edited?.ready:!!sprite?.ready;
  state.failed=!templated&&!!sprite?.error;
  if(!state.loaded||key===previous)return;
  const pic=sprite?.pic,sx=frame*64,sy=row*112;
  if(!templated&&(sx+64>pic.naturalWidth||sy+112>pic.naturalHeight)){
   state.failed=true;state.loaded=false;return;
  }
  ctx.clearRect(0,0,64,112);
  const rearView=state.direction==='ne'||state.direction==='nw';
  // A front-facing bag is behind the avatar, while rear views expose the
  // pack on the BACK torso surface. Keep rear head/neck above the bag.
  if(!rearView&&overlays[0]?.ready)ctx.drawImage(overlays[0].pic,0,0,64,112);
  if(edited?.ready)ctx.drawImage(edited.pic,0,0,64,112);
  else if(!templated)ctx.drawImage(pic,sx,sy,64,112,
    0,sleepPose?sleep().breathing(frame):0,64,112);
  for(let i=1;i<4;i++)if(overlays[i]?.ready)
   ctx.drawImage(overlays[i].pic,0,0,64,112);
  if(rearView&&overlays[0]?.ready){
   ctx.save();ctx.beginPath();ctx.rect(0,56,64,56);ctx.clip();
   ctx.drawImage(overlays[0].pic,0,0,64,112);
   ctx.restore();
  }
  // Apply the SAME authentic face crop as Mahluk Hidup Action Editor.
  // Do not turn full-body legacy expression sheets into body replacements.
  if(face&&appearance())appearance().drawExpression(ctx,face,state.direction,frame,
   path=>image(bridge()?.url(path)));
  if(overlays[4]?.ready)ctx.drawImage(overlays[4].pic,0,0,64,112);
  if(hygiene){
   if(bareAtlas?.ready){
    body().apply(ctx,{actor:asset,action:hygiene.actionId,
     direction:state.direction,frame,bodyImage:bareAtlas.pic});
   }else{
    ctx.clearRect(0,56,64,56);state.loaded=false;
   }
  }
  texture.needsUpdate=true;previous=key;
 }
 function setMoving(dx,dz,active){
  const old=state.moving;state.moving=!!active;
  if(state.moving){state.direction=directionFromWorld(dx,dz,state.direction);state.pose=null;}
  if(old!==state.moving){previous='';lastAction='';time=0;}
 }
 function setPose(p){if(state.pose!==p){state.pose=p||null;state.moving=false;previous='';lastAction='';time=0;}}
 function setDirection(d){state.direction=normalize(d);state.moving=false;previous='';}
 function setCharacter(id){
  const next=canonical(id);
  if(bridge()?.has(next)||g.VLPipelineAssets?.character(next)){
   who=next;state.profile=id;state.characterId=next;
   state.loaded=false;state.failed=false;time=0;previous='';lastAction='';
  }
 }
 function step(dt,camera,position){
  time+=Math.min(.1,Math.max(0,dt));
  render();
  // Presentation rotation is independent of gameplay direction. It rotates
  // the actual pixel billboard, not the source art, and retains its ground
  // contact when the body lies on its side (90/270 degrees).
  const yaw=camera?Math.atan2(camera.position.x-(position?.x||0),
   camera.position.z-(position?.z||0)):mesh.rotation.y||0;
  // Canvas uses downward-positive Y; WebGL uses upward-positive Y.
  // Negate Z tilt so 90° / LIE RIGHT matches the Mahluk Hidup preview.
  const rad=state.rotation?-state.rotation*Math.PI/180:0;
  const footCenter=h*(FRAME.pivotY/FRAME.h-.5);
  const halfVertical=Math.abs(Math.cos(rad))*h/2+Math.abs(Math.sin(rad))*w/2;
  const baseY=footCenter*Math.cos(rad);
  const groundMargin=(FRAME.h-FRAME.pivotY)*(h/FRAME.h);
  const lift=Math.max(0,halfVertical-baseY-groundMargin);
  const meta=state.pose&&g.VLActionTemplates?.get(who,state.pose);
  const stored=meta?.ready?g.VLActionFrames?.offset(who,state.pose):null;
  const offsetX=(Number(stored?.x)||0)*pixelWorld;
  const offsetY=(Number(stored?.y)||0)*(h/FRAME.h);
  const localX=-footCenter*Math.sin(rad)+offsetX;
  mesh.position.x=Math.cos(yaw)*localX;
  mesh.position.z=-Math.sin(yaw)*localX;
  mesh.position.y=baseY+lift-offsetY;
  mesh.rotation.set(0,yaw,rad);
 }
 function dispose(){mesh.geometry.dispose();mat.dispose();texture.dispose();}
 image(resolve(who,null,false)?.url);
 return {mesh,state,setMoving,setPose,setDirection,setCharacter,setProfile:setCharacter,step,dispose,
  refresh(){previous='';lastAction='';}};
}
function retry(){imgCache.clear();}
g.VLCharacterRig=Object.freeze({
 createRig,retry,DIR,ROW,FRAME,directionFromWorld,canonical,resolve,frameAt,
 get profiles(){return {...legacyIds,...Object.fromEntries((bridge()?.list()||[]).map(c=>[c.id,c.id]))};}
});
})(window);
