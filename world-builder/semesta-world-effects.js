/* Semesta: simple pixel-friendly character contact shadows and subtle night tint.
 * No sun-driven cast shadows, gradients, blurred lights or building shadows.
 * Shadow size/opacity is constant at every in-game hour. Preview only.
 */
(function(g){
'use strict';

function makeWorldEffects({THREE,scene,camera,canvas,tint,glows,
 getObjects,getRoot,getAgent,getCategory,getSpec}){
 const MAX_SHADOWS=1000;
 // One flat, translucent ground circle per visible character. No texture or blur.
 const circle=new THREE.CircleGeometry(1,24);
 const material=new THREE.MeshBasicMaterial({
  color:0x18202b,transparent:true,opacity:.23,
  depthTest:true,depthWrite:false,side:THREE.DoubleSide
 });
 const shadows=new THREE.InstancedMesh(circle,material,MAX_SHADOWS);
 shadows.name='Semesta Character Contact Shadows';
 shadows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 shadows.count=0;
 shadows.frustumCulled=false;
 shadows.renderOrder=2;
 shadows.raycast=()=>{};
 scene.add(shadows);

 const tmp=new THREE.Object3D();
 const groundRotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
 const screenPoint=new THREE.Vector3();
 const glowCtx=glows.getContext('2d',{alpha:true});
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
 let elapsed=0,lastSize='';
 const lastCam={x:NaN,y:NaN,z:NaN,zoom:NaN};
 let lastTint='';

 function markShadow(index,x,z){
  tmp.position.set(x,.055,z);
  tmp.quaternion.copy(groundRotation);
  // True ground-plane circle: hard edge, subtle constant-opacity contact.
  tmp.scale.set(.33,.33,1);
  tmp.updateMatrix();
  shadows.setMatrixAt(index,tmp.matrix);
 }
 function collectCharacterShadows(){
  let count=0;
  for(const o of getObjects()){
   if(count>=MAX_SHADOWS)break;
   const isCharacter=['avatar','npc','pedestrian','crowd','quest_npc'].includes(o.type)
    ||getCategory(o)==='actor';
   if(!isCharacter)continue;
   const root=getRoot(o.id);
   if(!root||root.visible===false)continue;
   if(o.type==='crowd'){
    const agent=getAgent(o.id);
    for(const part of agent?.parts||[]){
     if(count>=MAX_SHADOWS)break;
     if(part.child?.visible===false)continue;
     markShadow(count++,
      root.position.x+(part.child?.position?.x||0),
      root.position.z+(part.child?.position?.z||0));
    }
   }else{
    markShadow(count++,root.position.x,root.position.z);
   }
  }
  shadows.count=count;
  shadows.instanceMatrix.needsUpdate=true;
 }
 function resizeGlows(){
  const rect=canvas.getBoundingClientRect();
  const dpr=Math.min(1.5,window.devicePixelRatio||1);
  const w=Math.max(1,Math.round(rect.width*dpr));
  const h=Math.max(1,Math.round(rect.height*dpr));
  const size=w+'x'+h;
  if(size!==lastSize){
   glows.width=w;glows.height=h;lastSize=size;
  }
  return {width:rect.width,height:rect.height,dpr};
 }
 function projected(x,y,z,rect){
  screenPoint.set(x,y,z).project(camera);
  if(screenPoint.z<-1||screenPoint.z>1)return null;
  const sx=(screenPoint.x*.5+.5)*rect.width;
  const sy=(-screenPoint.y*.5+.5)*rect.height;
  if(sx<-12||sy<-12||sx>rect.width+12||sy>rect.height+12)return null;
  return {x:sx,y:sy};
 }
 function isStreetLamp(o){
  if(o.type==='lamp'||getCategory(o)==='lamp')return true;
  const identity=[o.name,o.asset,o.subtype].filter(Boolean).join(' ');
  return /lampu|street.?light|lamp|tiang.?lamp/i.test(identity)
   &&!['building','shop','vehicle'].includes(o.type);
 }
 // Per-variant lamp-head anchors measured from the authored PNG: alpha bbox
 // center of each head (the wide top fixture, split left/right of the pole).
 // World conversion matches semesta-pipeline-ground (PX=√2/64, PY=PX*2/√3;
 // a pixel's screen-right offset is world (+X,−Z) = (hx-pivotX)/64).
 // Live Semesta aliases saved pipeline:lampu_taman → lampu_taman_jakarta
 // (dual-head). The older 22×126 lampu_taman sprite is the catalog fallback.
 const LAMP_HEADS={
  lampu_taman_jakarta:{
   sw:{pivot:[18,145],heads:[[8,10.5],[27,16]]},
   se:{pivot:[16,145],heads:[[6,15.5],[26,10]]}
  },
  lampu_taman:{
   sw:{pivot:[7,121],heads:[[6.5,15]]},
   se:{pivot:[7,121],heads:[[6.5,15]]}
  }
 };
 const LAMP_PY=Math.SQRT2/64*2/Math.sqrt(3);
 function lampFacing(deg=0){
  return ['sw','se','ne','nw'][((Math.round((Number(deg)||0)/90)%4)+4)%4];
 }
 function lampHeadKey(source,o){
  const names=[source?.aliasOf,source?.id,o?.asset,o?.subtype]
   .filter(Boolean).map(n=>String(n).replace(/^pipeline:/,''));
  for(const name of names)if(LAMP_HEADS[name])return name;
  return null;
 }
 function lampHeadOffsets(source,o){
  const key=lampHeadKey(source,o);if(!key)return null;
  const table=LAMP_HEADS[key];
  const spec=table[lampFacing(o.rotation)]||table.sw||table.se;
  if(!spec)return null;
  const [pivotX,pivotY]=spec.pivot;
  return spec.heads.map(([hx,hy])=>{
   const dx=(hx-pivotX)/64;
   return {x:dx,y:(pivotY-hy)*LAMP_PY,z:-dx};
  });
 }
 function drawLampPixels(model){
  const rect=resizeGlows();
  glowCtx.setTransform(rect.dpr,0,0,rect.dpr,0,0);
  glowCtx.clearRect(0,0,rect.width,rect.height);
  const light=clamp(Number(model?.glow)||0,0,1);
  if(light<.03)return;
  // Only the lamp asset's bulb gets a faint opaque-edged square highlight;
  // no background halo, radial gradient, screen blend or vehicle headlights.
  glowCtx.globalAlpha=light*.17;
  glowCtx.fillStyle='#ffe5a8';
  let n=0;
  for(const o of getObjects()){
   if(n>=120)break;
   if(!isStreetLamp(o))continue;
   const root=getRoot(o.id);
   if(!root||root.visible===false)continue;
   const source=getSpec?.(o);
   const heads=lampHeadOffsets(source,o);
   const points=heads&&heads.length?heads.map(a=>({
    x:root.position.x+a.x,y:root.position.y+a.y,z:root.position.z+a.z
   })):[{
    x:root.position.x,
    y:root.position.y+clamp(Number(o.h||source?.height)||4.2,1.3,9)*.79,
    z:root.position.z
   }];
   const side=clamp(Math.round(Math.min(rect.width,rect.height)/135),3,6);
   for(const pt of points){
    if(n>=120)break;
    const p=projected(pt.x,pt.y,pt.z,rect);
    if(!p)continue;
    // Pixel-perfect warm point, never a blurred radius.
    glowCtx.fillRect(Math.round(p.x-side/2),Math.round(p.y-side/2),side,side);
    n++;
   }
  }
  glowCtx.globalAlpha=1;
 }
 function applyTint(model){
  const night=clamp(Number(model?.night)||0,0,1);
  const opacity=clamp(night*.28,0,.22); // At midnight: subtly darker, not black.
  const tintKey=opacity.toFixed(3);
  if(lastTint!==tintKey){
   lastTint=tintKey;
   tint.style.backgroundColor='rgb(22,34,56)';
   tint.style.opacity=String(opacity);
  }
  // Keep the background from becoming almost black at midnight; the clock
  // still supplies soft sky transitions between day/evening/night.
  scene.background.set(model?.sky||'#9aafbd');
 }
 function update(dt,model,force=false){
  elapsed+=Math.max(0,Number(dt)||0);
  const c=camera.position;
  const moving=Math.abs(c.x-lastCam.x)+Math.abs(c.y-lastCam.y)+
   Math.abs(c.z-lastCam.z)>.0002||camera.zoom!==lastCam.zoom;
  lastCam.x=c.x;lastCam.y=c.y;lastCam.z=c.z;lastCam.zoom=camera.zoom;
  if(!force&&!moving&&elapsed<.045)return;
  elapsed=0;
  applyTint(model);
  collectCharacterShadows();
  drawLampPixels(model);
 }
 function dispose(){
  scene.remove(shadows);
  circle.dispose();material.dispose();
 }
 return {update,dispose,resizeGlows};
}
g.VLSemestaWorldEffects=Object.freeze({makeWorldEffects});
})(window);
