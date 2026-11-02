/* Virtual Life · World Builder 3D
 * True WebGL depth buffer + orthographic camera; canonical c/r grid.
 * Reuses the local rebuild SVG sprites. Layout data is JSON, not game logic.
 * Intentionally separate from production: no auth, economy or NPC side effects.
 */
const $=id=>document.getElementById(id);
const fail=$('empty'),canvas=$('world');
let THREE;
for(const url of [
  'https://cdn.jsdelivr.net/npm/three@0.181.0/build/three.module.js',
  'https://unpkg.com/three@0.181.0/build/three.module.js'
]){
  try{THREE=await import(url);break;}catch(e){console.warn('WorldBuilder engine CDN',e);}
}
if(!THREE){
  fail.style.display='flex';
  fail.textContent='WebGL editor engine gagal dimuat. Periksa koneksi internet dan muat ulang. Map online tidak berubah.';
  throw Error('THREE_MODULE_NOT_AVAILABLE');
}
const STORE='virtual-life-world-builder-v1';
const clone=x=>JSON.parse(JSON.stringify(x));
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const round=v=>Math.round(v*100)/100;
const seed={
 format:'virtual-life-world-builder-v1',version:1,
 map:{name:'Virtual Life · Street / Office Study',grid:'game:c,r',units:'tile',origin:{x:0,z:0},
   worldBounds:{minX:-30,maxX:40,minZ:20,maxZ:55},
   road:{z0:32.75,z1:36.3},notes:'Initial authored 3D mapping study based on existing world coordinate system; not a pixel-exact migration of encrypted world.'},
 objects:[
  {id:'office-main',type:'building',name:'Virtual Office',x:-6,z:25,y:0,rotation:0,scale:1,w:15,d:7,h:8,color:'#647d95'},
  {id:'office-annex',type:'building',name:'Office Annex',x:9,z:25.8,y:0,rotation:0,scale:1,w:12,d:5.3,h:7,color:'#486a86'},
  {id:'warteg-front',type:'shop',name:'Warteg',x:20,z:25.3,y:0,rotation:0,scale:1,w:9,d:6,h:4.8,color:'#e5c17e'},
  {id:'shop-east',type:'shop',name:'Toko Loak',x:26,z:42.7,y:0,rotation:0,scale:1,w:11,d:8,h:5.8,color:'#cdb7a3'},
  {id:'market-stalls',type:'shop',name:'Warung Sebrang',x:10,z:42.7,y:0,rotation:0,scale:1,w:13,d:7,h:5.2,color:'#8dbdb9'},
  {id:'shop-west',type:'shop',name:'Ruko Samping',x:-8,z:42.7,y:0,rotation:0,scale:1,w:13,d:7.7,h:6.3,color:'#b6bdc7'},
  {id:'bench-near',type:'bench',name:'Park Bench',x:-1,z:29.1,y:0,rotation:0,scale:1},
  {id:'lamp-near',type:'lamp',name:'Street Lamp',x:8,z:31.2,y:0,rotation:0,scale:1},
  {id:'tree-near',type:'tree',name:'Tree',x:-13,z:28.1,y:0,rotation:0,scale:1},
  {id:'tree-front',type:'tree',name:'Tree near Office',x:14,z:28.3,y:0,rotation:0,scale:1},
  {id:'plant-pixel',type:'sprite',name:'Plant · existing art',x:28,z:29,y:0,rotation:0,scale:1,asset:'plant_base.svg',width:3,height:3},
  {id:'bench-pixel',type:'sprite',name:'Bench · existing art',x:24,z:38.3,y:0,rotation:0,scale:1,asset:'park_bench_base.svg',width:4.6,height:4.6},
  {id:'avatar-test',type:'avatar',name:'Avatar depth test',x:20.5,z:34,y:0,rotation:0,scale:1}
 ]};
let documentMap=clone(seed),selectedId=null,mode='select',snap=true,undoStack=[],redoStack=[];
try{
 const saved=JSON.parse(localStorage.getItem(STORE)||'null');
 if(saved&&saved.format===seed.format&&Array.isArray(saved.objects))documentMap=sanitize(saved);
}catch(e){console.warn('World Builder previous draft',e);}
function sanitize(v){
 if(!v||!Array.isArray(v.objects))throw Error('Expected objects array');
 if(v.objects.length>350)throw Error('Maximum 350 objects');
 let ids=new Set(),out=clone(seed);out.objects=[];
 for(const p of v.objects){
  if(!p||typeof p.id!=='string'||p.id.length>100||ids.has(p.id))continue;
  if(!['building','shop','bench','lamp','tree','box','sprite','avatar'].includes(p.type))continue;
  ids.add(p.id);
  let e={
   id:p.id,name:String(p.name||p.type).slice(0,90),type:p.type,
   x:clamp(Number(p.x)||0,-100,100),
   z:clamp(Number(p.z)||0,-100,100),
   y:clamp(Number(p.y)||0,-20,45),
   rotation:((Number(p.rotation)||0)%360+360)%360,
   scale:clamp(Number(p.scale)||1,.1,8)
  };
  for(const k of ['w','d','h','width','height'])if(Number.isFinite(Number(p[k])))e[k]=clamp(Number(p[k]),.2,80);
  if(typeof p.color==='string'&&/^#[0-9a-fA-F]{6}$/.test(p.color))e.color=p.color;
  if(p.type==='sprite'&&/^[a-z0-9_-]+\.svg$/.test(p.asset||''))e.asset=p.asset;
  // Keep unknown action metadata as data only. No gameplay execution.
  if(p.action&&typeof p.action==='object')e.action=clone(p.action);
  if(p.collision!==undefined)e.collision=!!p.collision;
  out.objects.push(e);
 }
 if(v.map&&typeof v.map==='object')out.map={...out.map,...clone(v.map)};
 return out;
}
function saved(){try{localStorage.setItem(STORE,JSON.stringify(documentMap));$('saveStatus').textContent='● Saved locally';}catch(e){$('saveStatus').textContent='⚠ Storage full';}}
function undoPoint(){undoStack.push(JSON.stringify(documentMap));if(undoStack.length>60)undoStack.shift();redoStack=[];}
function restoreStack(from,to){
 if(!from.length)return;
 to.push(JSON.stringify(documentMap));
 documentMap=sanitize(JSON.parse(from.pop()));selectedId=null;rebuild();saved();
}
let toastTimer=null;
function tell(msg){
 let t=$('toast');t.textContent=msg;t.style.display='block';clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>t.style.display='none',2100);
}
const scene=new THREE.Scene();
scene.background=new THREE.Color(0xbed8de);
const renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.setClearColor(0xbad0d8,1);
renderer.sortObjects=true;
const camera=new THREE.OrthographicCamera(-20,20,20,-20,.1,350);
const cameraFocus=new THREE.Vector3(4,0,35);
const direction=new THREE.Vector3(1,1.02,1).normalize();
let viewSize=35;
function resetCamera(){cameraFocus.set(4,0,34.8);viewSize=35;fitCamera();}
function fitCamera(){
 const b=canvas.getBoundingClientRect();
 const aspect=Math.max(.3,b.width/Math.max(1,b.height));
 camera.left=-viewSize*aspect/2;camera.right=viewSize*aspect/2;
 camera.top=viewSize/2;camera.bottom=-viewSize/2;
 camera.position.copy(cameraFocus).addScaledVector(direction,100);
 camera.lookAt(cameraFocus);camera.updateProjectionMatrix();
}
function resize(){
 const r=$('canvas-wrap').getBoundingClientRect(),w=Math.max(10,Math.round(r.width)),h=Math.max(10,Math.round(r.height));
 renderer.setSize(w,h,false);fitCamera();renderer.render(scene,camera);
}
new ResizeObserver(resize).observe($('canvas-wrap'));
const palette={
 green:0x359b56,asphalt:0x505766,tiles:0xc1c6c7, yellow:0xe4bd43,
 wood:0xc79254,darkWood:0x805a37,metal:0x303d4c
};
function material(color){return new THREE.MeshBasicMaterial({color,side:THREE.FrontSide,depthTest:true,depthWrite:true});}
function texture(kind){
 const c=document.createElement('canvas');c.width=c.height=64;
 const x=c.getContext('2d');x.imageSmoothingEnabled=false;
 const bg=kind==='grass'?'#398f4d':kind==='road'?'#535966':'#b6bfc1';
 x.fillStyle=bg;x.fillRect(0,0,64,64);
 let colors=kind==='grass'?['#489c57','#287b44','#5aa763','#6a9858']:
  kind==='road'?['#454c58','#646b78','#5e6570','#4b5360']:['#ccd2d4','#adb6ba','#bbc3c5','#969fa3'];
 for(let iy=0;iy<64;iy++)for(let ix=0;ix<64;ix++){
  let h=(Math.imul(ix+37,2246822519)^Math.imul(iy+83,3266489917)^Math.imul(ix*iy+19,668265263))>>>0;
  if(h%27<2){x.fillStyle=colors[h%4];x.fillRect(ix,iy,1,1);}
 }
 if(kind==='pave'){
  x.strokeStyle='#899498';x.lineWidth=1;
  for(let i=0;i<=64;i+=16){x.beginPath();x.moveTo(i,0);x.lineTo(i,64);x.stroke();
   x.beginPath();x.moveTo(0,i);x.lineTo(64,i);x.stroke();}
 }
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
 tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;
 tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
 return tex;
}
const textures={grass:texture('grass'),road:texture('road'),pave:texture('pave')};
function texMat(kind,w,d,scale=2.4){
 const t=textures[kind].clone();t.needsUpdate=true;t.repeat.set(w/scale,d/scale);
 return new THREE.MeshBasicMaterial({map:t,depthTest:true,depthWrite:true});
}
function cuboid(parent,x,y,z,w,h,d,col){
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(col));
 mesh.position.set(x,y,z);parent.add(mesh);return mesh;
}
function plate(x,z,w,d,y,kind){
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d),texMat(kind,w,d));
 mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);scene.add(mesh);return mesh;
}
function ground(){
 const g=new THREE.Group();g.name='Locked ground (non-editable)';scene.add(g);
 plate(5,37.5,72,43,0,'grass');
 // Road and pavement are independent real meshes: they never appear above buildings.
 plate(5,34.52,72,4.08,.012,'road');
 plate(5,31.7,72,1.55,.017,'pave');
 plate(5,37.23,72,1.35,.017,'pave');
 for(const rz of [32.52,36.58]){
  const stripe=cuboid(g,5,.042,rz,72,.028,.12,0xe3b53b);
 }
 for(let x=-27;x<39;x+=3.3){
  if(x>=18&&x<=28)continue;
  cuboid(g,x,.043,34.53,1.6,.018,.075,0xd9dde1);
 }
 for(let x=19.6;x<=27.1;x+=.74){
  cuboid(g,x,.046,34.52,.40,.03,3.55,0xf4f1e8);
 }
 // Paving rhythm along the outer ground, only where the sidewalks exist.
 for(const z of [31.7,37.23]){
  for(let x=-30;x<=40;x+=2.0){
   cuboid(g,x,.034,z,.018,.006,1.45,0x8d999e);
  }
 }
}
ground();
const texLoader=new THREE.TextureLoader();
const spriteTexture=new Map();
function pixelTexture(name){
 if(!spriteTexture.has(name)){
  const tex=texLoader.load('../assets/'+name,()=>{renderer.render(scene,camera);},undefined,err=>tell('Asset '+name+' tidak bisa dimuat.'));
  tex.colorSpace=THREE.SRGBColorSpace;tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;
  spriteTexture.set(name,tex);
 }
 return spriteTexture.get(name);
}
function labelTexture(text){
 const c=document.createElement('canvas');c.width=256;c.height=64;const x=c.getContext('2d');
 x.fillStyle='#263e54';x.fillRect(0,0,256,64);
 x.fillStyle='#f8e9ba';x.font='bold 22px monospace';x.textAlign='center';
 x.fillText(text.slice(0,19).toUpperCase(),128,39);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.NearestFilter;
 return t;
}
function makeBuilding(root,item){
 let w=item.w||9,d=item.d||6,h=item.h||6;
 const col=new THREE.Color(item.color||'#92a8b1');
 const tones=[col.clone().multiplyScalar(.78),col.clone().multiplyScalar(.65),
  col.clone().multiplyScalar(1.08),col.clone().multiplyScalar(.8),
  col.clone(),col.clone().multiplyScalar(.90)];
 let walls=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),tones.map(c=>material(c)));
 walls.position.y=h/2;root.add(walls);
 cuboid(root,0,h+.11,0,w+.6,.22,d+.7,0x39434e);
 // Window panels on the two camera-facing walls. These are real geometry
 // and receive normal GPU occlusion by the avatar and other buildings.
 const winCount=Math.max(2,Math.floor(w/2.25));
 for(let i=0;i<winCount;i++){
  const xx=-w/2+.85+i*((w-1.7)/(Math.max(1,winCount-1)));
  cuboid(root,xx,h*.66,d/2+.03,.9,1.15,.055,0x91abb5);
  cuboid(root,xx,h*.66,d/2+.067,.07,1.2,.02,0x304456);
 }
 let sideCount=Math.max(1,Math.floor(d/2.1));
 for(let i=0;i<sideCount;i++){
  let zz=-d/2+1.0+i*(d-2.0)/Math.max(1,sideCount-1);
  cuboid(root,w/2+.035,h*.65,zz,.055,1.3,.75,0x6c8c9c);
 }
 const doorW=Math.min(2.4,w*.27);
 cuboid(root,0,1.35,d/2+.055,doorW,2.7,.06,0x494d50);
 if(item.type==='shop'){
  cuboid(root,0,3,d/2+.18,w*.85,.6,.22,0xbd7452);
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(6,w*.70),.75),
    new THREE.MeshBasicMaterial({map:labelTexture(item.name),depthWrite:true,depthTest:true}));
  sign.position.set(0,3.2,d/2+.31);root.add(sign);
 }
}
function makeBench(root){
 const wood=0xc99a5c,legs=0x3c4a56;
 cuboid(root,0,.65,0,2.8,.2,.85,wood);
 cuboid(root,0,1.24,-.35,2.8,1.05,.18,wood);
 for(const x of [-1.1,1.1])for(const z of [-.3,.3])cuboid(root,x,.35,z,.16,.7,.18,legs);
 for(const h of [.92,1.32])cuboid(root,0,h,-.27,2.87,.065,.11,0xe2af69);
}
function makeLamp(root){
 cuboid(root,0,2.2,0,.15,4.4,.15,0x354557);
 cuboid(root,0,4.45,0,.8,.48,.8,0xe5b647);
 cuboid(root,0,4.71,0,1.0,.10,.9,0x394c5a);
 cuboid(root,0,.12,0,.62,.25,.62,0x394c5a);
}
function makeTree(root){
 cuboid(root,0,2.0,0,.50,4.0,.52,0x886349);
 const leaves=[[0,4.4,0,2.4,1.8,2.5],[-1.10,3.8,-.13,2.3,1.9,2.0],
 [1.15,3.92,0,2.1,1.9,2.3],[-.1,4.8,1.0,2.5,1.7,1.7],
 [0,5.45,-.1,2.5,1.3,2.3]];
 for(const [x,y,z,w,h,d]of leaves)cuboid(root,x,y,z,w,h,d,0x318e55);
}
function makeBox(root,item){cuboid(root,0,.8,0,2,1.6,2,new THREE.Color(item.color||'#d4a86a'));}
function makeSprite(root,item){
 const width=item.width||4,height=item.height||4;
 const mat=new THREE.MeshBasicMaterial({map:pixelTexture(item.asset),transparent:false,alphaTest:.5,
   depthWrite:true,depthTest:true,side:THREE.DoubleSide});
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);
 plane.rotation.y=Math.PI/4;
 plane.position.y=height*.2375;
 root.add(plane);
}
function characterTexture(){
 const c=document.createElement('canvas');c.width=32;c.height=64;
 const g=c.getContext('2d'),r=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h)};
 r(8,8,16,18,'#242b39');r(11,14,11,10,'#dba887');r(10,8,13,6,'#191d27');
 r(9,26,14,23,'#33435a');r(8,48,7,14,'#272b3e');r(17,48,7,14,'#263147');
 r(12,18,4,3,'#191b22');r(19,18,3,3,'#191b22');r(11,20,12,2,'#50555f');
 r(7,32,3,12,'#dcaa87');r(23,32,3,12,'#dcaa87');r(7,62,9,2,'#1a2430');r(17,62,9,2,'#1a2430');
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.magFilter=THREE.NearestFilter;
 return tex;
}
const avatarTex=characterTexture();
function makeAvatar(root){
 const p=new THREE.Mesh(new THREE.PlaneGeometry(1.8,3.6),
  new THREE.MeshBasicMaterial({map:avatarTex,transparent:false,alphaTest:.5,depthWrite:true,depthTest:true,side:THREE.DoubleSide}));
 p.rotation.y=Math.PI/4;p.position.y=1.8;root.add(p);
}
const owners=new Map(),assetRoots=new THREE.Group();scene.add(assetRoots);
let highlight=null;
function instantiate(o){
 const root=new THREE.Group();root.name=o.name;root.userData.itemId=o.id;
 root.position.set(o.x,o.y,o.z);root.rotation.y=(o.rotation||0)*Math.PI/180;
 root.scale.setScalar(o.scale||1);
 switch(o.type){
  case 'building':case 'shop':makeBuilding(root,o);break;
  case 'bench':makeBench(root);break;
  case 'lamp':makeLamp(root);break;
  case 'tree':makeTree(root);break;
  case 'box':makeBox(root,o);break;
  case 'sprite':makeSprite(root,o);break;
  case 'avatar':makeAvatar(root);break;
 }
 assetRoots.add(root);owners.set(o.id,root);
}
function clearAll(){
 while(assetRoots.children.length){
  const ch=assetRoots.children[0];assetRoots.remove(ch);
  ch.traverse(o=>{if(o.geometry)o.geometry.dispose();
   // Shared cached SVG and generated textures remain reusable.
   if(o.material&&Array.isArray(o.material))o.material.forEach(m=>m.dispose());
   else if(o.material)o.material.dispose();});
 }
 owners.clear();
}
function rebuild(){
 if(highlight){scene.remove(highlight);highlight.geometry.dispose();highlight.material.dispose();highlight=null;}
 clearAll();for(const o of documentMap.objects)instantiate(o);
 updateSelection();
 renderer.render(scene,camera);
}
function item(){return documentMap.objects.find(o=>o.id===selectedId)||null;}
function updateSelection(){
 const cur=item();
 $('selectedName').textContent=cur?cur.name:'Belum ada objek dipilih';
 $('selectedType').textContent=cur?cur.type.toUpperCase():'MAP DRAFT';
 $('objectId').value=cur?.id||'';
 for(const k of ['x','z','y','rotation','scale']){
  $(k).value=cur?String(round(cur[k]??0)):'';
  $(k).disabled=!cur;
 }
 $('tools').querySelectorAll('button').forEach(b=>b.disabled=!cur);
 if(highlight){scene.remove(highlight);highlight.geometry.dispose();highlight.material.dispose();highlight=null;}
 if(cur&&owners.has(cur.id)){
  highlight=new THREE.BoxHelper(owners.get(cur.id),0xf5df42);highlight.material.depthTest=false;
  highlight.material.transparent=true;highlight.renderOrder=100;scene.add(highlight);
 }
}
function select(id){
 selectedId=id;updateSelection();
 if(id)tell('Selected: '+item()?.name+'. Pilih Move lalu drag.');
 renderer.render(scene,camera);
}
function edit(fn){
 if(!item())return;
 undoPoint();fn(item());applyItem();saved();
}
function applyItem(){
 const o=item();if(!o)return;
 const r=owners.get(o.id);if(!r)return;
 r.position.set(o.x,o.y,o.z);r.rotation.y=o.rotation*Math.PI/180;r.scale.setScalar(o.scale);
 updateSelection();renderer.render(scene,camera);
}
function id(type){return type+'-'+Math.random().toString(36).slice(2,8);}
function add(type){
 if(!type)return;undoPoint();
 const isSprite=type.startsWith('sprite:'),asset=isSprite?type.slice(7):undefined;
 const o={id:id(isSprite?'sprite':type),type:isSprite?'sprite':type,
  name:isSprite?asset.replace('_base.svg','').replaceAll('_',' '):type,
  x:round(cameraFocus.x),z:round(cameraFocus.z),y:0,rotation:0,scale:1};
 if(isSprite){o.asset=asset;o.width=4.0;o.height=4.0;}
 if(type==='building'||type==='shop'){o.w=7;o.d=5;o.h=5;}
 documentMap.objects.push(o);instantiate(o);select(o.id);saved();tell('New object added · Move to place');
}
function duplicate(){
 const o=item();if(!o)return;
 undoPoint();let q=clone(o);q.id=id(o.type);q.name=o.name+' copy';q.x+=1.2;q.z+=1.2;
 documentMap.objects.push(q);instantiate(q);select(q.id);saved();
}
function remove(){
 if(!item())return;undoPoint();
 documentMap.objects=documentMap.objects.filter(o=>o.id!==selectedId);select(null);rebuild();saved();tell('Object deleted (Undo available)');
}
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2(),groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
function mouseRay(e){
 const r=canvas.getBoundingClientRect();
 mouse.x=((e.clientX-r.left)/r.width)*2-1;
 mouse.y=-((e.clientY-r.top)/r.height)*2+1;
 ray.setFromCamera(mouse,camera);
}
function floorPoint(e){
 mouseRay(e);let p=new THREE.Vector3();
 return ray.ray.intersectPlane(groundPlane,p)?p:null;
}
function pick(e){
 mouseRay(e);
 const hits=ray.intersectObjects(assetRoots.children,true);
 for(const h of hits){
  let o=h.object;
  while(o&&o!==assetRoots&&!o.userData.itemId)o=o.parent;
  if(o?.userData?.itemId)return o.userData.itemId;
 }
 return null;
}
let drag=null,pointers=new Map(),pinch=null;
function onDown(e){
 if(e.button!==0&&e.pointerType==='mouse')return;
 e.preventDefault();canvas.setPointerCapture(e.pointerId);
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size===2){
  const pts=[...pointers.values()],mid={x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2};
  pinch={dist:Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y),mid,view:viewSize,focus:cameraFocus.clone()};
  drag=null;return;
 }
 const hit=pick(e);
 if(hit){select(hit);}
 const p=floorPoint(e);
 if(mode==='move'&&hit&&p){
  undoPoint();const o=item();
  drag={kind:'move',id:e.pointerId,start:p.clone(),x:o.x,z:o.z,changed:false};
 }else{
  drag={kind:'pan',id:e.pointerId,start:p?.clone()||null,focus:cameraFocus.clone(),sx:e.clientX,sy:e.clientY,hit:!!hit,changed:false};
 }
}
function onMove(e){
 if(!pointers.has(e.pointerId))return;
 const old=pointers.get(e.pointerId);old.x=e.clientX;old.y=e.clientY;
 if(pointers.size>=2&&pinch){
  const pts=[...pointers.values()],len=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
  viewSize=clamp(pinch.view*pinch.dist/Math.max(10,len),10,100);fitCamera();renderer.render(scene,camera);return;
 }
 if(!drag||drag.id!==e.pointerId)return;
 const p=floorPoint(e);
 if(drag.kind==='move'&&p&&item()){
  const o=item();let dx=p.x-drag.start.x,dz=p.z-drag.start.z;
  o.x=snap?Math.round((drag.x+dx)*2)/2:round(drag.x+dx);
  o.z=snap?Math.round((drag.z+dz)*2)/2:round(drag.z+dz);
  drag.changed=true;applyItem();
 }else if(drag.kind==='pan'&&!drag.hit){
  // Use camera-aligned world pan; horizontal drag translates on iso ground.
  let sx=e.clientX-drag.sx,sy=e.clientY-drag.sy,r=canvas.getBoundingClientRect(),
      pixel=viewSize/Math.max(1,r.height);
  let p1=new THREE.Vector3(1,0,-1).normalize(),p2=new THREE.Vector3(1,0,1).normalize();
  cameraFocus.copy(drag.focus).addScaledVector(p1,-sx*pixel).addScaledVector(p2,-sy*pixel*1.8);
  fitCamera();renderer.render(scene,camera);
 }
}
function onUp(e){
 pointers.delete(e.pointerId);
 if(pointers.size<2)pinch=null;
 if(drag?.kind==='move'&&drag.id===e.pointerId){if(drag.changed)saved();else undoStack.pop();}
 drag=null;
}
canvas.addEventListener('pointerdown',onDown);
canvas.addEventListener('pointermove',onMove);
canvas.addEventListener('pointerup',onUp);
canvas.addEventListener('pointercancel',onUp);
canvas.addEventListener('wheel',e=>{e.preventDefault();viewSize=clamp(viewSize*(e.deltaY>0?1.12:.89),10,100);fitCamera();renderer.render(scene,camera);},{passive:false});
function setMode(m){mode=m;for(const type of ['select','move'])$(type+'Mode').classList.toggle('active',m===type);}
$('selectMode').onclick=()=>setMode('select');$('moveMode').onclick=()=>setMode('move');
$('addType').onchange=e=>{add(e.target.value);e.target.value='';setMode('move');};
$('zoomIn').onclick=()=>{viewSize=clamp(viewSize*.8,10,100);fitCamera();};
$('zoomOut').onclick=()=>{viewSize=clamp(viewSize*1.25,10,100);fitCamera();};
$('home').onclick=resetCamera;
$('rotateL').onclick=()=>edit(o=>{o.rotation=(o.rotation-15+360)%360;});
$('rotateR').onclick=()=>edit(o=>{o.rotation=(o.rotation+15)%360;});
$('scaleDown').onclick=()=>edit(o=>{o.scale=clamp(round(o.scale-.1),.1,8);});
$('scaleUp').onclick=()=>edit(o=>{o.scale=clamp(round(o.scale+.1),.1,8);});
$('duplicate').onclick=duplicate;$('delete').onclick=remove;
for(const prop of ['x','z','y','rotation','scale'])$(prop).addEventListener('change',()=>{
 const v=Number($(prop).value);
 if(!Number.isFinite(v)||!item())return;
 edit(o=>{o[prop]=prop==='scale'?clamp(v,.1,8):prop==='rotation'?((v%360)+360)%360:clamp(v,-100,100);});
});
$('undo').onclick=()=>restoreStack(undoStack,redoStack);
$('redo').onclick=()=>restoreStack(redoStack,undoStack);
$('snap').onclick=()=>{snap=!snap;$('snap').textContent='Snap: '+(snap?'ON':'OFF');};
$('reset').onclick=()=>{
 if(!confirm('Reset seluruh map draft 3D ke default?'))return;
 undoPoint();documentMap=clone(seed);selectedId=null;rebuild();saved();tell('Map reset');
};
$('export').onclick=()=>{
 let json=JSON.stringify(documentMap,null,2),blob=new Blob([json],{type:'application/json'}),url=URL.createObjectURL(blob);
 let a=document.createElement('a');a.href=url;a.download='virtual-life-world-layout.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);tell('Map JSON exported');
};
$('import').onclick=()=>$('file').click();
$('file').onchange=async e=>{
 let f=e.target.files?.[0];if(!f)return;
 try{
  const d=sanitize(JSON.parse(await f.text()));undoPoint();documentMap=d;selectedId=null;rebuild();saved();tell('Map imported');
 }catch(err){tell('Import gagal: '+err.message);}
 e.target.value='';
};
window.addEventListener('keydown',e=>{
 if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();restoreStack(undoStack,redoStack);}
 else if(e.key==='Delete'&&item())remove();
 else if(e.key.toLowerCase()==='g')setMode('move');
 else if(e.key==='Escape')select(null);
});
window.addEventListener('error',e=>{console.error('World Builder runtime',e.error);});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();fail.style.display='flex';fail.textContent='WebGL context lost. Reload editor; changes are saved locally.';});
rebuild();resetCamera();resize();saved();
function frame(){
 requestAnimationFrame(frame);
 renderer.render(scene,camera);
}
frame();
