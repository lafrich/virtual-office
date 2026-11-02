/* Canonical GPT Version actor adapter; source sprites remain encrypted at rest.
   The authenticated root Service Worker serves assets/chars/... after login. */
(function(global){
'use strict';
const BASE='../assets/chars/';
const SHEET={w:64,h:112,cols:6,rows:44,pivotX:32,pivotY:100};
const DIRS=['se','sw','ne','nw'];
const ANIMS={walk:[0,6,10],idle:[1,4,4],talk:[2,4,8],sit:[3,4,3],
sit_type:[4,4,10],sleep:[5,4,2],tired:[6,4,2],swim:[7,6,6],
float:[8,4,3],lie:[9,4,2],perch:[10,4,2]};
const POSES={sit:'sit',sleep:'lie',bathe:'swim',toilet:'sit',work:'sit_type'};
const PROFILES={ichsan:'ichsan_v6b',theodore:'theodore_v6b',noor:'noor_v6b',
grok:'grok_bot_v6b',raka:'raka_v6b',bima:'bima_v6b',
ellen:'ellen_v6b',nadia:'nadia_v6b',warteg:'bu_warteg_v6b',
barista:'fm_barista_v6b',kasir:'fm_kasir_v6b'};
const cache=new Map();
function directionFromWorld(dx,dz,last='sw'){
if(!Number.isFinite(dx)||!Number.isFinite(dz)||Math.max(Math.abs(dx),Math.abs(dz))<.00001)return last;
return Math.abs(dx)>=Math.abs(dz)?(dx>=0?'se':'nw'):(dz>=0?'sw':'ne');
}
function image(profile){
const preset=PROFILES[profile]||PROFILES.ichsan;
if(cache.has(preset))return cache.get(preset);
const img=new Image(),e={img,status:'loading'};cache.set(preset,e);
img.onload=()=>{e.status=img.naturalWidth>=384&&img.naturalHeight>=4928?'ready':'invalid';};
img.onerror=()=>{e.status='locked';};
img.src=BASE+preset+'_sheet.png';return e;
}
function retry(){
for(const [preset,e] of cache){if(e.status==='ready')continue;
cache.delete(preset);image(Object.keys(PROFILES).find(k=>PROFILES[k]===preset)||'ichsan');}
}
function createRig(THREE,opt={}){
const ctxCanvas=document.createElement('canvas');ctxCanvas.width=64;ctxCanvas.height=112;
const ctx=ctxCanvas.getContext('2d');
const tex=new THREE.CanvasTexture(ctxCanvas);tex.colorSpace=THREE.SRGBColorSpace;
tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;tex.generateMipmaps=false;
const mat=new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,
transparent:false,alphaTest:.49,depthTest:true,depthWrite:true});
const height=2.55;
const mesh=new THREE.Mesh(new THREE.PlaneGeometry(height*64/112,height),mat);
mesh.position.y=height*(100/112-.5);mesh.name='GPT character 4-way cutout';
const state={profile:PROFILES[opt.profile]?opt.profile:'ichsan',
direction:DIRS.includes(opt.direction)?opt.direction:'sw',
pose:POSES[opt.pose]?opt.pose:null,moving:false,clock:0,status:'loading',ready:false,last:''};
let entry=image(state.profile);
function setMoving(dx,dz,on){
state.moving=!!on;
if(on){state.direction=directionFromWorld(dx,dz,state.direction);state.pose=null;}
}
function setPose(p){state.pose=POSES[p]?p:null;state.clock=0;state.moving=false;state.last='';}
function setDirection(d){if(DIRS.includes(d))state.direction=d;state.moving=false;state.last='';}
function setProfile(p){if(!PROFILES[p])return;state.profile=p;entry=image(p);state.last='';}
function step(dt,camera,pos){
if(camera){const p=pos||{x:0,z:0};mesh.rotation.set(0,Math.atan2(camera.position.x-p.x,camera.position.z-p.z),0);}
const anim=state.pose?POSES[state.pose]:state.moving?'walk':'idle',cfg=ANIMS[anim];
state.clock+=Math.max(0,Math.min(.1,dt));
const col=Math.floor(state.clock*cfg[2])%cfg[1],row=cfg[0]*4+DIRS.indexOf(state.direction);
const key=state.profile+':'+row+':'+col;
state.status=entry.status;mesh.visible=entry.status==='ready';
if(entry.status==='ready'&&state.last!==key){
ctx.clearRect(0,0,64,112);
ctx.drawImage(entry.img,col*64,row*112,64,112,0,0,64,112);
tex.needsUpdate=true;state.last=key;state.ready=true;}
}
function dispose(){mesh.geometry.dispose();mat.dispose();tex.dispose();}
return{mesh,state,step,setMoving,setPose,setDirection,setProfile,dispose};
}
global.VLCharacterRig=Object.freeze({createRig,directionFromWorld,retry,
profiles:PROFILES,directions:DIRS,poses:Object.keys(POSES),sheet:SHEET,animations:ANIMS});
})(window);