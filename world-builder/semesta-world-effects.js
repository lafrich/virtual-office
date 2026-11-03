/* Semesta · lightweight isometric shadow and night-light renderer.
 * Uses shared instanced ground decals, not real-time shadow maps. Shadows
 * follow the virtual solar direction and the live simulated actor positions.
 * Compatible with unlit BasicMaterial pixel sprites and mobile WebGL.
 */
(function(g){
'use strict';
function gradientTexture(THREE,shape){
 const c=document.createElement('canvas');c.width=c.height=96;
 const ctx=c.getContext('2d'),mid=48;
 ctx.clearRect(0,0,96,96);
 ctx.save();ctx.translate(mid,mid);
 if(shape==='cast')ctx.scale(1,.84);
 else ctx.scale(1,.76);
 const grad=ctx.createRadialGradient(0,0,2,0,0,46);
 if(shape==='cast'){
  grad.addColorStop(0,'rgba(9,16,29,.88)');
  grad.addColorStop(.56,'rgba(10,18,31,.62)');
  grad.addColorStop(.85,'rgba(12,22,33,.28)');
 }else{
  grad.addColorStop(0,'rgba(8,16,26,.96)');
  grad.addColorStop(.46,'rgba(12,23,34,.72)');
  grad.addColorStop(.82,'rgba(15,28,38,.27)');
 }
 grad.addColorStop(1,'rgba(18,28,38,0)');
 ctx.fillStyle=grad;ctx.fillRect(-48,-48,96,96);ctx.restore();
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
 tex.minFilter=tex.magFilter=THREE.LinearFilter;
 tex.generateMipmaps=false;tex.needsUpdate=true;
 return tex;
}
function makeWorldEffects({THREE,scene,camera,canvas,tint,glows,
 getObjects,getRoot,getAgent,getCategory,getFootprint,getSpec,isOutline}){
 const capacity=1000,castTex=gradientTexture(THREE,'cast'),contactTex=gradientTexture(THREE,'contact');
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
 let elapsed=0,previousLightKey='',lastSize='';
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
 function glowCircle(x,y,radius,alpha){
  if(alpha<=.003)return;
  const grad=glowCtx.createRadialGradient(x,y,0,x,y,radius);
  grad.addColorStop(0,'rgba(255,229,152,'+cl(alpha,0,.85)+')');
  grad.addColorStop(.38,'rgba(255,186,82,'+cl(alpha*.44,0,.6)+')');
  grad.addColorStop(1,'rgba(255,180,60,0)');
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
  for(const o of getObjects()){
   if(n>110)break;
   if(o.type==='marker')continue;
   const root=getRoot(o.id);if(!root||!root.visible)continue;
   const cat=getCategory(o),lamp=o.type==='lamp'||/lampu|lamp|light/i.test(o.name||'');
   const building=(cat==='building'||o.type==='building'||o.type==='shop');
   if(!lamp&&!building)continue;
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
  elapsed+=Math.max(0,dt||0);
  if(!force&&elapsed<.12)return;
  elapsed=0;
  const key=model.sky+'/'+Math.round(model.night*100)+'/'+Math.round(model.glow*100);
  if(key!==previousLightKey||force){previousLightKey=key;applyTint(model);}
  collect(model);
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
