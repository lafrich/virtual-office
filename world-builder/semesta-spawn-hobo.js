/* Preview: roadside hobo tent + Ellen exit-tent sheets (spawn_hobo). No invented art. */
(function(g){
'use strict';
const BASE='./legacy-assets/spawn-hobo/';
const PIXEL_WORLD=Math.SQRT2/64, VERTICAL_COMP=2/Math.sqrt(3);
const PHASES=[
 {id:'bangun',row:0,ms:[420,320,320,260,320,380]},
 {id:'merangkak',row:1,ms:[140,140,140,140,140,140],crawl:0.2417},
 {id:'berdiri',row:2,ms:[150,150,140,140,140,220]},
 {id:'peregangan',row:3,ms:[150,140,140,260,260,160,140,220]},
 {id:'menoleh',row:4,ms:[300,240,260,260,280,220,260,340]}
];
const TENTS={
 se:{size:[140,90],pivot:[80,54],tidur:[61,55],keluar:[115,82]},
 sw:{size:[148,90],pivot:[71,64],tidur:[69,55],keluar:[15,82]}
};
const CRAWL={se:{x:1,z:0},sw:{x:-1,z:0}};
let state=null;
let playGen=0;

function url(path){return BASE+path;}
function hideMesh(mesh){if(mesh)mesh.visible=false;}
function showMesh(mesh){if(mesh)mesh.visible=true;}
function sheetFor(profile,facing){
 const who=/^ichsan$/i.test(profile||'')?'ichsan':'npc';
 return url('sheets/spawn_'+who+'_'+facing+'.png');
}
function tentUrl(facing,layer){
 if(layer==='belakang')return url('sprites/tenda_buka_'+facing+'__belakang.png');
 if(layer==='depan')return url('sprites/tenda_buka_'+facing+'__depan.png');
 if(layer==='tutup')return url('sprites/tenda_tutup_'+facing+'.png');
 return url('sprites/tenda_buka_'+facing+'.png');
}
function pxToWorld(dxPx,dyPx){
 return {x:dxPx/64+dyPx/32,z:dyPx/32-dxPx/64};
}
// Ellen's tent pivot is the plot centre (tengah kavling), not the ground
// contact. On a vertical billboard that puts the near cardboard / stick
// pixels under the sidewalk. Seat both layers on the lowest opaque row
// of the tent base (ignore v6b shadow alpha 56). Same row for back+front
// so the split sprite stays registered.
function lowestOpaqueRow(img,minA){
 const thresh=minA==null?56:minA;
 const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
 if(!w||!h)return 0;
 const c=document.createElement('canvas');
 c.width=w;c.height=h;
 const ctx=c.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(img,0,0);
 const data=ctx.getImageData(0,0,w,h).data;
 for(let y=h-1;y>=0;y--){
  for(let x=0;x<w;x++){
   if(data[(y*w+x)*4+3]>thresh)return y;
  }
 }
 return h-1;
}
function tentLift(spec,contactY){
 const h=spec.size[1]*PIXEL_WORLD*VERTICAL_COMP;
 return h*((Number(contactY)-spec.pivot[1])/spec.size[1]);
}
function loadImage(src){
 return new Promise((res,rej)=>{
  const img=new Image();
  img.onload=()=>res(img);
  img.onerror=()=>rej(new Error('missing '+src));
  img.src=src;
 });
}
function makePlane(THREE,img,size,pivot,renderOrder,contactY){
 const w=size[0]*PIXEL_WORLD,h=size[1]*PIXEL_WORLD*VERTICAL_COMP;
 const tex=new THREE.Texture(img);
 tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;
 tex.colorSpace=THREE.SRGBColorSpace||tex.colorSpace;tex.needsUpdate=true;
 const mat=new THREE.MeshBasicMaterial({
  map:tex,transparent:true,alphaTest:.05,depthTest:true,depthWrite:renderOrder<5,
  side:THREE.DoubleSide
 });
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
 const groundY=Number.isFinite(contactY)?contactY:pivot[1];
 const py=groundY/size[1],px=(size[0]/2-pivot[0])/size[0];
 plane.position.set(w*px,h*(py-.5),0);
 plane.renderOrder=renderOrder;
 plane.frustumCulled=false;
 plane.userData.spawnHobo=true;
 plane.userData.groundY=groundY;
 return plane;
}
function frameList(){
 const out=[];
 for(const phase of PHASES){
  phase.ms.forEach((ms,i)=>out.push({phase:phase.id,row:phase.row,col:i,ms,crawl:phase.crawl||0}));
 }
 return out;
}
function insideDepth(frameIndex){
 // b starts at 1.0 and reaches -0.45 after 6 crawl frames (manifest).
 const crawlStart=PHASES[0].ms.length;
 const crawlCount=PHASES[1].ms.length;
 if(frameIndex<crawlStart)return 1;
 if(frameIndex>=crawlStart+crawlCount)return -0.45;
 const i=frameIndex-crawlStart;
 return 1-1.45*((i+1)/crawlCount);
}

function dispose(){
 playGen++;
 if(!state)return;
 showMesh(state.actorMesh);
 if(state.overlay){state.overlay.removeFromParent();state.overlay.geometry.dispose();state.overlay.material.map?.dispose();state.overlay.material.dispose();}
 if(state.group){
  state.group.traverse(n=>{
   if(n.material){n.material.map&&n.material.map.dispose();n.material.dispose();}
   if(n.geometry)n.geometry.dispose();
  });
  state.group.removeFromParent();
 }
 state=null;
}

function busy(){return !!(state&&state.playing);}

function crawlProgress(){
 if(!state)return 0;
 const crawlStart=PHASES[0].ms.length,crawlCount=PHASES[1].ms.length;
 if(state.index<crawlStart)return 0;
 if(state.index>=crawlStart+crawlCount)return 1;
 const step=state.frames[state.index];
 const frac=step&&step.ms?Math.min(1,state.elapsed/step.ms):0;
 return (state.index-crawlStart+frac)/crawlCount;
}
function openingAnchor(backImg,frontImg){
 const w=backImg&&(backImg.naturalWidth||backImg.width);
 const h=backImg&&(backImg.naturalHeight||backImg.height);
 if(!w||!h||!frontImg)return null;
 const c=document.createElement('canvas');
 c.width=w;c.height=h;
 const ctx=c.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(backImg,0,0);
 const back=ctx.getImageData(0,0,w,h).data;
 ctx.clearRect(0,0,w,h);
 ctx.drawImage(frontImg,0,0);
 const front=ctx.getImageData(0,0,w,h).data;
 let sx=0,sy=0,n=0;
 for(let y=0;y<h;y++){
  for(let x=0;x<w;x++){
   const i=(y*w+x)*4+3;
   if(back[i]>56&&front[i]<=56){sx+=x;sy+=y;n++;}
  }
 }
 return n?{c:sx/n,r:sy/n}:null;
}
function silhouetteMask(backImg,frontImg){
 const w=backImg&&(backImg.naturalWidth||backImg.width);
 const h=backImg&&(backImg.naturalHeight||backImg.height);
 if(!w||!h)return null;
 const c=document.createElement('canvas');
 c.width=w;c.height=h;
 const ctx=c.getContext('2d');
 ctx.drawImage(backImg,0,0);
 if(frontImg)ctx.drawImage(frontImg,0,0);
 return c;
}
function restPixel(spec,backImg,frontImg){
 const hole=openingAnchor(backImg,frontImg);
 if(!hole)return {c:spec.tidur[0],r:spec.tidur[1]+14};
 // Body center in the painted opening, tucked toward `tidur` so the
 // character reads as inside the tent, not under the opaque tarp and
 // not lying out in front of the door. Foot is +14 (lying mass at y 86).
 const bodyC=hole.c+(spec.tidur[0]-hole.c)*0.25;
 const bodyR=hole.r+(spec.tidur[1]-hole.r)*0.15;
 return {c:bodyC,r:bodyR+14};
}
function tentPixelAt(spec,progress){
 const t=Math.min(1,Math.max(0,progress));
 const start=(state&&state.restPixel)||{c:spec.tidur[0],r:spec.tidur[1]+14};
 return {
  c:start.c+(spec.keluar[0]-start.c)*t,
  r:start.r+(spec.keluar[1]-start.r)*t
 };
}
function placeInTent(){
 if(!state||!state.overlay||!state.spec)return;
 const spec=state.spec,p=tentPixelAt(spec,crawlProgress());
 const wT=spec.size[0]*PIXEL_WORLD,hT=spec.size[1]*PIXEL_WORLD*VERTICAL_COMP;
 const hC=112*PIXEL_WORLD*VERTICAL_COMP;
 // Overlay is parented to the back plane, so these are tent-sprite local pixels.
 // Foot pivot (32,100) lands on the inside / keluar pixel, not on a separate world XZ.
 state.overlay.position.x=(p.c/spec.size[0]-.5)*wT;
 state.overlay.position.y=(.5-p.r/spec.size[1])*hT+hC*(100/112-.5);
 state.overlay.position.z=0;
 if(state.actorRoot&&state.group){
  const off=pxToWorld(p.c-spec.pivot[0],p.r-spec.pivot[1]);
  state.actorRoot.position.set(state.group.position.x+off.x,0,state.group.position.z+off.z);
 }
}

function faceCamera(camera){
 if(!state||!camera)return;
 const root=state.group;
 const yaw=Math.atan2(camera.position.x-root.position.x,camera.position.z-root.position.z);
 state.group.children.forEach(plane=>{if(plane.isMesh)plane.rotation.y=yaw-root.rotation.y;});
 // Overlay inherits the back plane's billboard rotation; do not add a second yaw
 // or it leaves the tent layers and reads as lying in front of the door.
}

function paintFrame(){
 if(!state||!state.overlay||!state.sheet)return;
 const step=state.frames[state.index];
 const ctx=state.ctx;
 ctx.clearRect(0,0,64,112);
 ctx.drawImage(state.sheet,step.col*64,step.row*112,64,112,0,0,64,112);
 // While inside, clip the body to the tent silhouette so limbs do not
 // read as lying on the sidewalk in front of the door. Depan still
 // occludes the tarp; the opening stays visible. Clip lifts as they crawl out.
 const p=tentPixelAt(state.spec,crawlProgress());
 if(state.mask&&crawlProgress()<0.4){
  ctx.globalCompositeOperation='destination-in';
  ctx.drawImage(state.mask,32-p.c,100-p.r);
  ctx.globalCompositeOperation='source-over';
 }
 state.tex.needsUpdate=true;
 const depth=insideDepth(state.index);
 // Stay between belakang (3) and depan (5) while inside; never lift in Y
 // or the sprite sits on the roof instead of at ground inside the opening.
 state.overlay.renderOrder=depth>0.5?4:6;
 if(state.front)state.front.visible=true;
 placeInTent();
}

function applyCrawl(step,dtMs){
 // World XZ is driven by placeInTent() from the painted tidur→keluar path.
 if(state)placeInTent();
}

async function play(opts){
 dispose();
 const my=++playGen;
 const THREE=opts.THREE,scene=opts.scene,facing=opts.facing==='sw'?'sw':'se';
 const spec=TENTS[facing];
 const start=opts.point||{x:0,z:0};
 const group=new THREE.Group();
 group.name='spawn-hobo-tent';
 group.position.set(Number(start.x)||0,0,Number(start.z)||0);
 scene.add(group);
 const sleepOff=pxToWorld(spec.tidur[0]-spec.pivot[0],(spec.tidur[1]+14)-spec.pivot[1]);
 if(opts.actorRoot){
  opts.actorRoot.position.set(group.position.x+sleepOff.x,0,group.position.z+sleepOff.z);
 }
 const actorMesh=opts.rig&&(opts.rig.mesh||opts.rig.group||null);
 hideMesh(actorMesh);
 const frames=frameList();
 state={
  playing:true,group,back:null,front:null,overlay:null,tex:null,ctx:null,sheet:null,frames,
  index:0,elapsed:0,facing,actorRoot:opts.actorRoot,actorMesh,rig:opts.rig,
  phase:frames[0].phase,point:{x:group.position.x,z:group.position.z},
  done:false
 };

 let backImg,frontImg,sheetImg;
 try{
  [backImg,frontImg,sheetImg]=await Promise.all([
   loadImage(tentUrl(facing,'belakang')),
   loadImage(tentUrl(facing,'depan')),
   loadImage(sheetFor(opts.profile,facing))
  ]);
 }catch(err){
  if(my===playGen){
   showMesh(actorMesh);
   if(state&&state.group===group){group.removeFromParent();state=null;}
  }
  throw err;
 }
 if(my!==playGen){
  group.removeFromParent();
  return null;
 }
 const contactY=Math.max(lowestOpaqueRow(backImg),lowestOpaqueRow(frontImg));
 const back=makePlane(THREE,backImg,spec.size,spec.pivot,3,contactY);
 const front=makePlane(THREE,frontImg,spec.size,spec.pivot,5,contactY);
 front.material.depthWrite=false;
 group.add(back);group.add(front);

 const canvas=document.createElement('canvas');canvas.width=64;canvas.height=112;
 const ctx=canvas.getContext('2d');
 const tex=new THREE.Texture(canvas);
 tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;
 tex.colorSpace=THREE.SRGBColorSpace||tex.colorSpace;tex.needsUpdate=true;
 const overlay=makePlane(THREE,canvas,[64,112],[32,100],4);
 overlay.material.map=tex;
 overlay.material.depthTest=false;
 overlay.material.depthWrite=false;
 // Share the tent billboard so bangun sits in the painted interior. Front
 // layer (renderOrder 5) then occludes the body except through the opening.
 back.add(overlay);

 Object.assign(state,{
  spec,back,front,overlay,tex,ctx,sheet:sheetImg,contactY,tentLift:tentLift(spec,contactY),
  restPixel:restPixel(spec,backImg,frontImg),
  mask:silhouetteMask(backImg,frontImg)
 });
 hideMesh(actorMesh);
 placeInTent();
 paintFrame();
 return state;
}

function tick(dt,camera){
 if(!state)return;
 faceCamera(camera);
 if(!state.playing)return;
 hideMesh(state.actorMesh);
 if(!state.sheet||!state.overlay)return;
 const step=state.frames[state.index];
 if(!step)return;
 const ms=Math.max(0,(dt||0)*1000);
 state.elapsed+=ms;
 applyCrawl(step,ms);
 if(state.elapsed>=step.ms){
  state.elapsed=0;
  if(state.index>=state.frames.length-1){
   state.playing=false;state.done=true;state.phase='control';
   if(state.overlay){state.overlay.visible=false;}
   showMesh(state.actorMesh);
   return;
  }
  state.index++;
  state.phase=state.frames[state.index].phase;
  paintFrame();
 }
}

function snapshot(){
 if(!state)return null;
 const step=state.frames[state.index];
 return {
  playing:state.playing,done:state.done,phase:state.phase,index:state.index,
  facing:state.facing,point:state.point,frame:step&&{col:step.col,row:step.row,phase:step.phase},
  actor:state.actorRoot?{x:state.actorRoot.position.x,z:state.actorRoot.position.z}:null,
  contactY:state.contactY,tentLift:state.tentLift
 };
}

g.VLSpawnHobo=Object.freeze({
 BASE,PHASES,TENTS,sheetFor,tentUrl,pxToWorld,lowestOpaqueRow,tentLift,openingAnchor,silhouetteMask,restPixel,tentPixelAt,placeInTent,
 frameList,insideDepth,play,tick,dispose,busy,snapshot
});
})(window);
