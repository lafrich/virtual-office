/* Semesta · lightweight isometric shadow and night-light renderer.
 * Uses shared instanced ground decals, not real-time shadow maps. Shadows
 * follow the virtual solar direction and the live simulated actor positions.
 * Compatible with unlit BasicMaterial pixel sprites and mobile WebGL.
 */
(function(g){
'use strict';
// Solid transparent pixel-step shadow masks; no radial gradients or blur.
function blockTexture(THREE,shape){
 const c=document.createElement('canvas');c.width=c.height=32;
 const ctx=c.getContext('2d',{alpha:true});
 ctx.imageSmoothingEnabled=false;
 // Hard silhouette with one-pixel staircase corners. Opacity is applied by
 // the shared materials, making the shadows flat translucent blocks.
 const isCast=shape==='cast',top=isCast?11:8,bottom=isCast?21:24;
 const margins=isCast?[8,6,4,3,2,2,2,3,4,6]:[11,8,6,4,3,2,2,2,2,2,2,2,2,3,4,6];
 ctx.fillStyle=isCast?'#101b2b':'#101b25';
 for(let y=top;y<bottom;y++){
  const i=y-top,left=margins[Math.min(i,margins.length-1)];
  ctx.fillRect(left,y,32-2*left,1);
 }
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
 tex.minFilter=tex.magFilter=THREE.NearestFilter;
 tex.generateMipmaps=false;tex.needsUpdate=true;
 return tex;
}
function makeWorldEffects({THREE,scene,camera,canvas,tint,glows,
 getObjects,getRoot,getAgent,getCategory,getFootprint,getSpec,isOutline}){
 const capacity=1000,castTex=blockTexture(THREE,'cast'),contactTex=blockTexture(THREE,'contact');
 const geom=new THREE.PlaneGeometry(1,1);
 const mat=(map,opacity)=>new THREE.MeshBasicMaterial({map,color:0xffffff,transparent:true,
  opacity,depthWrite:false,depthTest:true,side:THREE.DoubleSide});
 const castMat=mat(castTex,.29),contactMat=mat(contactTex,.22);
 const cast=new THREE.InstancedMesh(geom,castMat,capacity);
 const contact=new THREE.InstancedMesh(geom,contactMat,capacity);
 for(const mesh of [cast,contact]){
  mesh.name='Semesta Environment Shadow';
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.count=0;mesh.frustumCulled=false;mesh.renderOrder=2;
  mesh.raycast=()=>{};scene.add(mesh);
 }
 const tmp=new THREE.Object3D();
 const GROUND_ROT=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
 const UP=new THREE.Vector3(0,1,0);
 let elapsed=0,shadowElapsed=0,previousLightKey='',lastSize='';
 const lastCamera={x:NaN,y:NaN,z:NaN,zoom:NaN};
 const glowCtx=glows.getContext('2d',{alpha:true});
 const pos3=new THREE.Vector3();
 const cl=(v,a,b)=>Math.max(a,Math.min(b,v));
 function stamp(mesh,index,x,z,sx,sz,angle,y=.051){
  tmp.position.set(x,y,z);
  tmp.quaternion.setFromAxisAngle(UP,angle).multiply(GROUND_ROT);
  tmp.scale.set(Math.max(.02,sx),Math.max(.02,sz),1);
  tmp.updateMatrix();mesh.setMatrixAt(index,tmp.matrix);
 }
 function info(o){
  const cat=getCategory(o),fp=getFootprint(o),s=getSpec(o);
  const width=Math.max(.25,Math.min(24,Number(fp?.[0])||1));
  const depth=Math.max(.25,Math.min(24,Number(fp?.[1])||1));
  let kind='prop',height=1.3;
  if(cat==='building'||o.type==='building'||o.type==='shop'||o.assetCategory==='building'){
   kind='building';height=Math.max(2,Math.min(26,Number(o.h||o.height||s?.height)||6));
  }else if(o.type==='tree'||cat==='tree'||cat==='vegetation'){
   kind='tree';height=Math.max(3,Math.min(12,Number(o.h||s?.height)||5.6));
  }else if(o.type==='lamp'||/lamp|lampu/i.test(o.name||'')){
   kind='lamp';height=4.7;
  }else if(o.type==='vehicle'){
   kind='vehicle';height=1.25;
  }else if(['avatar','npc','pedestrian','crowd','quest_npc'].includes(o.type)||cat==='actor'){
   kind='actor';height=1.75;
  }else height=Math.max(.45,Math.min(7,Number(o.h||s?.height)||1.8));
  return {kind,width,depth,height};
 }
 function addShadow(o,at,model,count){
  if(count>=capacity||!at)return count;
  const p=info(o);
  const near=canvas.width>0; if(!near)return count;
  const maxDistance=180;
  const x=Number(at.x)||0,z=Number(at.z)||0;
  const distance=Math.hypot(x-camera.position.x,z-camera.position.z);
  if(distance>maxDistance)return count;
  let [w,d]=[p.width,p.depth];
  if(p.kind==='actor'){w=.63;d=.5;}
  else if(p.kind==='vehicle'){w=Math.max(.55,w);d=Math.max(.62,d);}
  else if(p.kind==='tree'){w=Math.max(1.5,w);d=Math.max(1.5,d);}
  else if(p.kind==='lamp'){w=.6;d=.6;}
  if(p.kind==='building'&&isOutline())return count;
  stamp(contact,count,x,z,w*1.12,d*1.17,0,.054);
  const length=p.height*(.24+1.6*(1-model.sun.height));
  const sunX=-model.sun.x,sunZ=-model.sun.z;
  const shadowX=x+sunX*length*.41,shadowZ=z+sunZ*length*.41;
  stamp(cast,count,shadowX,shadowZ,Math.max(w*.85,length+w*.3),Math.max(.5,d*.84),
   -Math.atan2(sunZ,sunX),.052);
  return count+1;
 }
 function collect(model){
  let count=0;
  const objects=getObjects();
  for(const o of objects){
   if(o.type==='marker'||o.blocking==='no'&&o.type==='trigger')continue;
   const root=getRoot(o.id);if(!root||!root.visible)continue;
   if(o.type==='crowd'){
    const agent=getAgent(o.id);
    for(const child of agent?.parts||[]){
     if(count>=capacity)break;
     count=addShadow({type:'pedestrian'},{
      x:root.position.x+child.child.position.x,
      z:root.position.z+child.child.position.z
     },model,count);
    }
   }else{
    count=addShadow(o,root.position,model,count);
   }
  }
  cast.count=count;contact.count=count;
  cast.instanceMatrix.needsUpdate=true;
  contact.instanceMatrix.needsUpdate=true;
  cast.material.opacity=model.cast;
  contact.material.opacity=model.contact;
 }
 function resizeGlows(){
  const rect=canvas.getBoundingClientRect(),dpr=Math.min(1.5,window.devicePixelRatio||1);
  const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
  const size=w+'x'+h;
  if(lastSize!==size){glows.width=w;glows.height=h;lastSize=size;}
  return {width:rect.width,height:rect.height,dpr};
 }
 function project(x,y,z,rect){
  pos3.set(x,y,z).project(camera);
  if(pos3.z<-1||pos3.z>1)return null;
  const px=(pos3.x*.5+.5)*rect.width,py=(-pos3.y*.5+.5)*rect.height;
  if(px<-90||py<-90||px>rect.width+90||py>rect.height+90)return null;
  return {x:px,y:py};
 }
 function glowCircle(x,y,radius,alpha,tone='warm'){
  if(alpha<=.003)return;
  const grad=glowCtx.createRadialGradient(x,y,0,x,y,radius);
  const rgb=tone==='head'?[243,248,255]:tone==='tail'?[255,70,52]:
   tone==='body'?[188,220,255]:[255,229,152];
  const middle=tone==='tail'?[255,90,60]:tone==='body'?[178,212,245]:tone==='head'?[237,239,215]:[255,186,82];
  grad.addColorStop(0,'rgba('+rgb.join(',')+','+cl(alpha,0,.86)+')');
  grad.addColorStop(.38,'rgba('+middle.join(',')+','+cl(alpha*.46,0,.6)+')');
  grad.addColorStop(1,'rgba('+rgb.join(',')+',0)');
  glowCtx.fillStyle=grad;
  glowCtx.fillRect(x-radius,y-radius,radius*2,radius*2);
 }
 function drawNightLights(model){
  const rect=resizeGlows();glowCtx.setTransform(rect.dpr,0,0,rect.dpr,0,0);
  glowCtx.clearRect(0,0,rect.width,rect.height);
  if(model.glow<=.02)return;
  glowCtx.globalCompositeOperation='screen';
  const size=cl(Math.min(rect.width,rect.height)/30,8,22);
  let n=0;
  const sceneObjects=getObjects();
  // Ambient vehicles are appended after buildings in Reference City. Draw
  // them first so an abundance of building lamps cannot consume the glow cap.
  const ordered=[...sceneObjects.filter(o=>o.type==='vehicle'),
   ...sceneObjects.filter(o=>o.type!=='vehicle')];
  for(const o of ordered){
   if(n>110)break;
   if(o.type==='marker')continue;
   const root=getRoot(o.id);if(!root||!root.visible)continue;
   const cat=getCategory(o),lamp=o.type==='lamp'||/lampu|lamp|light/i.test(o.name||'');
   const building=(cat==='building'||o.type==='building'||o.type==='shop');
   const vehicle=o.type==='vehicle';
   if(!lamp&&!building&&!vehicle)continue;
   if(vehicle){
    // A restrained vehicle body highlight and directional white/red lamps
    // render over the night tint, using the actual moving vehicle heading.
    const moving=getAgent(o.id);
    let dx=Number(moving?.lastDx)||0,dz=Number(moving?.lastDz)||0;
    if(Math.hypot(dx,dz)<.1){
     const dir=o.motion?.direction||'east';
     dx=dir==='west'?-1:dir==='east'?1:0;
     dz=dir==='north'?-1:dir==='south'?1:0;
     if(!dx&&!dz)dx=1;
    }
    const mag=Math.hypot(dx,dz)||1;dx/=mag;dz/=mag;
    const fp=getFootprint(o),len=Math.max(.8,Math.min(3.5,Number(fp?.[0])||2));
    const x=root.position.x,z=root.position.z;
    const body=project(x,.78,z,rect);
    const front=project(x+dx*len*.45,.46,z+dz*len*.45,rect);
    const back=project(x-dx*len*.45,.42,z-dz*len*.45,rect);
    if(body)glowCircle(body.x,body.y,size*1.4,model.glow*.22,'body');
    if(front)glowCircle(front.x,front.y,size*1.3,model.glow*.63,'head');
    if(back)glowCircle(back.x,back.y,size*.72,model.glow*.38,'tail');
    n++;continue;
   }
   const h=lamp?4.4:Math.max(2,Math.min(10,Number(o.h)||5))*.47;
   const p=project(root.position.x,h,root.position.z,rect);
   if(!p)continue;
   const radius=lamp?size*2.9:size*1.75;
   glowCircle(p.x,p.y,radius,model.glow*(lamp?.58:.26));
   n++;
  }
  glowCtx.globalCompositeOperation='source-over';
 }
 function applyTint(model){
  // A DOM color grade is necessary because the pixel-art scene intentionally
  // uses MeshBasicMaterial and ignores physically based lights.
  const color=model.tintRGB;
  tint.style.backgroundColor='rgb('+color.join(',')+')';
  tint.style.opacity=String(cl(model.night,0,.82));
  scene.background.set(model.sky);
 }
 function update(dt,model,force=false){
  const delta=Math.max(0,dt||0);
  elapsed+=delta;shadowElapsed+=delta;
  // The original 120ms throttle made streetlights lag the follow camera.
  const pos=camera.position;
  const cameraMoving=Math.abs(pos.x-lastCamera.x)+Math.abs(pos.y-lastCamera.y)+
   Math.abs(pos.z-lastCamera.z)>.0002||camera.zoom!==lastCamera.zoom;
  lastCamera.x=pos.x;lastCamera.y=pos.y;lastCamera.z=pos.z;lastCamera.zoom=camera.zoom;
  if(!force&&!cameraMoving&&elapsed<.035)return;
  elapsed=0;
  const key=model.sky+'/'+Math.round(model.night*100)+'/'+Math.round(model.glow*100);
  if(key!==previousLightKey||force){previousLightKey=key;applyTint(model);}
  if(force||shadowElapsed>=.05){collect(model);shadowElapsed=0;}
  drawNightLights(model);
 }
 function dispose(){
  scene.remove(cast,contact);
  for(const mesh of [cast,contact])mesh.dispose?.();
  geom.dispose();castMat.dispose();contactMat.dispose();
  castTex.dispose();contactTex.dispose();
 }
 return {update,dispose,resizeGlows};
}
g.VLSemestaWorldEffects=Object.freeze({makeWorldEffects});
})(window);
