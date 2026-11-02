/* Virtual Life canonical directional character atlas -> camera-facing 3D cutout.
 * Uses VOCharacterSystem from ../character-system.js for exact frame mapping.
 * Physically vertical billboard, fixed X/Z dimension, no 3D yaw squash.
 */
(function(global){
'use strict';
const native=global.VOCharacterSystem;
if(!native)throw Error('Existing VOCharacterSystem must load before character rig');
const FRAME=native.frame;
const dirs=native.directions;
const poses=native.poses;
const imageCache=new Map();
function source(name){
 const u=native.sheetPaths[name];
 if(!u)return null;
 if(!imageCache.has(u)){
  const img=new Image();
  const state={img,loaded:false,error:false};
  img.onload=()=>{state.loaded=img.naturalWidth>0};
  img.onerror=()=>{state.error=true};
  img.src=u;imageCache.set(u,state);
 }
 return imageCache.get(u);
}
function normalized(dx,dz,keep){
 return native.directionFromWorld(dx,dz,keep);
}
function createRig(THREE,options={}){
 const canvas=document.createElement('canvas');
 canvas.width=FRAME.w;canvas.height=FRAME.h;
 const ctx=canvas.getContext('2d',{alpha:true});
 const tex=new THREE.CanvasTexture(canvas);
 tex.colorSpace=THREE.SRGBColorSpace;
 tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;
 tex.generateMipmaps=false;
 const mat=new THREE.MeshBasicMaterial({
  map:tex,side:THREE.DoubleSide,transparent:false,alphaTest:.48,
  depthTest:true,depthWrite:true
 });
 // Character dimensions are authored in WORLD UNITS. No affine nonuniform
 // scaling of the sprite can occur when a world object is rotated.
 const width=Number(options.width)||1.72;
 const height=Number(options.height)||2.55;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);
 mesh.name='Canonical 4-direction character puppet';
 mesh.position.y=height*(FRAME.pivotY/FRAME.h-.5);
 mesh.userData.characterBillboard=true;
 const s={direction:native.normalizeDirection(options.direction||'sw'),moving:false,
  walk:0,pose:poses.includes(options.pose)?options.pose:null,
  variant:options.variant==='baymax'?'baymax':'player',
  velocity:{x:0,z:0},lastFrame:'',ready:false};
 function draw(){
  let pose=poses.includes(s.pose)?s.pose:null;
  let category=pose?(s.variant==='baymax'?'baymax':'poses'):'walk';
  let sheet=source(category);
  const row=pose?0:dirs.indexOf(s.direction),col=pose?poses.indexOf(pose):
   native.frameIndex({moving:s.moving,walk:s.walk});
  const k=category+':'+row+':'+col;
  if(sheet?.loaded){
   if(k!==s.lastFrame||!s.ready){
    ctx.clearRect(0,0,FRAME.w,FRAME.h);
    ctx.drawImage(sheet.img,col*FRAME.w,row*FRAME.h,FRAME.w,FRAME.h,
      0,0,FRAME.w,FRAME.h);
    tex.needsUpdate=true;s.lastFrame=k;s.ready=true;
   }
  }else if(!s.ready){
   // Explicit loading silhouette; never synthesize a different identity.
   ctx.clearRect(0,0,FRAME.w,FRAME.h);
   ctx.fillStyle='#39485a';ctx.fillRect(44,75,40,55);
   ctx.fillStyle='#dbaf91';ctx.fillRect(47,40,34,35);
   ctx.fillStyle='#202a35';ctx.fillRect(46,31,37,17);
   ctx.fillStyle='#2a3442';ctx.fillRect(47,130,15,15);ctx.fillRect(68,130,15,15);
   tex.needsUpdate=true;
  }
 }
 function setMoving(dx,dz,isMoving){
  s.moving=!!isMoving;
  if(s.moving){
   s.velocity={x:dx,z:dz};s.direction=normalized(dx,dz,s.direction);
   s.pose=null;
  }
 }
 function setPose(p){s.pose=poses.includes(p)?p:null;s.moving=false;}
 function step(dt,camera,worldPosition){
  if(s.moving)s.walk+=Math.max(0,Math.min(.09,dt))*2;
  // Cylindrical billboard: rotate about world Y only, never pitch, roll
  // or apply viewport perspective to sprite dimensions.
  if(camera){
   const target=worldPosition||{x:0,z:0};
   const dx=camera.position.x-target.x,dz=camera.position.z-target.z;
   mesh.rotation.set(0,Math.atan2(dx,dz),0);
  }
  draw();
 }
 function dispose(){mesh.geometry.dispose();mat.dispose();tex.dispose();}
 return{mesh,state:s,step,setMoving,setPose,dispose,
  setDirection(d){s.direction=native.normalizeDirection(d);s.moving=false;s.pose=null;},
  dimensions:{width,height},source:native.sheetPaths};
}
global.VLCharacterRig=Object.freeze({
 createRig,dirs,poses,
 directionFromWorld:normalized,
 frameIndex:native.frameIndex,
 sheetPaths:native.sheetPaths
});
})(window);
