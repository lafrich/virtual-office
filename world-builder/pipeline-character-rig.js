/* Character puppet for Virtual Life World Builder.
 * ONLY official pixel art from lafrich/virtual-life-asset-pipeline.
 * 6 columns x 44 rows; frames 64x112; pivot 32,100.
 * Rows are action start + se/sw/ne/nw, exact upstream v6b ROWMAP.
 */
(function(g){
'use strict';
const DIR=['se','sw','ne','nw'];
const ROW={walk:0,idle:4,talk:8,sit:12,sit_type:16,sleep:20,tired:24,swim:28,float:32,lie:36,perch:40};
const FRAME={w:64,h:112,pivotX:32,pivotY:100};
const ALIAS={grok:'grok_bot',warteg:'bu_warteg',barista:'fm_barista',kasir:'fm_kasir'};
const profiles=Object.fromEntries(
 [...(g.VLPipelineAssets?.characters||[]).map(x=>x.id),...Object.keys(ALIAS)]
 .map(id=>[id,ALIAS[id]||id])
);
const canonical=id=>profiles[id]||'ichsan';
const cache=new Map();
function source(id){
  const url=g.VLPipelineAssets?.character(id);
  if(!url)return null;
  if(!cache.has(url)){
    const pic=new Image();pic.crossOrigin='anonymous';
    const state={pic,ready:false,error:false};
    pic.onload=()=>{state.ready=pic.naturalWidth>=FRAME.w*6&&pic.naturalHeight>=FRAME.h*44};
    pic.onerror=()=>{state.error=true;console.warn('Pipeline character not accessible',url)};
    pic.src=url;cache.set(url,state);
  }
  return cache.get(url);
}
function normalize(d){return DIR.includes(d)?d:'sw'}
function directionFromWorld(dx,dz,last='sw'){
  if(!Number.isFinite(dx)||!Number.isFinite(dz)||Math.hypot(dx,dz)<.00001)return normalize(last);
  return Math.abs(dx)>=Math.abs(dz)?dx>0?'se':'nw':dz>0?'sw':'ne';
}
function createRig(THREE,opt={}){
  let who=canonical(opt.profile||opt.characterId||'ichsan');
  const cv=document.createElement('canvas');cv.width=64;cv.height=112;
  const ctx=cv.getContext('2d',{alpha:true});ctx.imageSmoothingEnabled=false;
  const texture=new THREE.CanvasTexture(cv);texture.colorSpace=THREE.SRGBColorSpace;
  texture.magFilter=texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;
  const mat=new THREE.MeshBasicMaterial({map:texture,transparent:false,alphaTest:.45,
    depthTest:true,depthWrite:true,side:THREE.DoubleSide});
  // 64×32 source tile must project to a 2:1 diamond.
// A horizontal world tile projects to sqrt(2) units. At 30° elevation,
// vertical planes shorten by cos(30°); compensate that projection exactly.
 const pixelWorld=Math.SQRT2/64;
 const h=FRAME.h*pixelWorld/(Math.sqrt(3)/2),w=FRAME.w*pixelWorld;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
  mesh.position.y=h*(FRAME.pivotY/FRAME.h-.5);
  mesh.userData.characterBillboard=true;mesh.userData.characterSource='pipeline-v6b';
  mesh.userData.nativeFrame=FRAME;mesh.userData.tilePixels=[64,32];mesh.userData.pixelWorld=pixelWorld;
  const state={direction:normalize(opt.direction),moving:false,walk:0,pose:opt.pose||null,profile:opt.profile||opt.characterId||'ichsan',characterId:who,loaded:false,failed:false};
  let previous='',time=0;
  function draw(){
    const anim=({bathe:'swim',toilet:'sit',work:'sit_type'}[state.pose]||state.pose); const mode=ROW[anim]!==undefined?anim:state.moving?'walk':'idle';
    const frames=mode==='walk'?6:mode==='idle'?4:6;
    const frame=Math.floor(time/(mode==='walk'?.145:.24))%frames;
    const row=ROW[mode]+DIR.indexOf(state.direction);
    const key=who+':'+mode+':'+row+':'+frame;
    const sheet=source(who);
    state.loaded=!!sheet?.ready;state.failed=!!sheet?.error;
    if(!sheet?.ready||key===previous)return;
    ctx.clearRect(0,0,64,112);
    ctx.drawImage(sheet.pic,frame*64,row*112,64,112,0,0,64,112);
    texture.needsUpdate=true;previous=key;
  }
  function setMoving(dx,dz,active){
    const was=state.moving;state.moving=!!active;
    if(state.moving){state.direction=directionFromWorld(dx,dz,state.direction);state.pose=null;}
    if(was!==state.moving)previous='';
  }
  function setPose(p){state.pose=Object.hasOwn(ROW,p)||['bathe','toilet','work'].includes(p)?p:null;state.moving=false;previous=''}
  function setDirection(d){state.direction=normalize(d);state.moving=false;previous=''}
  function setCharacter(id){const name=canonical(id);if(g.VLPipelineAssets?.character(name)){who=name;state.profile=id;state.characterId=name;state.loaded=false;state.failed=false;previous='';source(who);}}
  function step(dt,camera,position){
    time+=Math.min(.1,Math.max(0,dt));
    if(camera){
      const p=position||{x:0,z:0};
      mesh.rotation.set(0,Math.atan2(camera.position.x-p.x,camera.position.z-p.z),0);
    }
    draw();
  }
  function dispose(){mesh.geometry.dispose();mat.dispose();texture.dispose()}
  source(who);
  return {mesh,state,setMoving,setPose,setDirection,setCharacter,setProfile:setCharacter,step,dispose};
}
function retry(){
 for(const [url,state] of cache){
  if(state.error||!state.ready)cache.delete(url);
 }
}
g.VLCharacterRig=Object.freeze({createRig,retry,DIR,ROW,FRAME,directionFromWorld,profiles});
})(window);
