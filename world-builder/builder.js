/* Virtual Life · World Builder 3D
 * True WebGL depth buffer + orthographic camera; canonical c/r grid.
 * Official characters and buildings come from the asset pipeline; GPT props remain optional.
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
const STORE='virtual-life-gpt-world-builder-pipeline-v3';
const ACTIVE_DRAFT_KEY='virtual-life-active-city-draft';
let activeDraftId=null,draftDirty=true;
try{activeDraftId=localStorage.getItem(ACTIVE_DRAFT_KEY)||null;}catch{}
const assetCatalog=window.VLAssetCatalog||[];
const assetByName=new Map(assetCatalog.map(x=>[x.file,x]));
const style=window.VLWorldStyle;
const terrain=window.VLMapTerrain;
const schema=window.VLMapSchema;
const PIXEL_WORLD=Math.SQRT2/64, VERTICAL_COMP=2/Math.sqrt(3);
const actorType=t=>t==='avatar'||t==='npc';
const directions=['sw','se','nw','ne'];
// Actual catalog artwork is 2D. These objects are independent world nodes;
// only authored meshes have complete depth geometry.
const assetGroup=$('assetGroup');
if(assetGroup){
 assetGroup.replaceChildren();
 for(const group of [...new Set(assetCatalog.map(e=>e.group))]){
   const section=document.createElement('optgroup');section.label=group;
   for(const entry of assetCatalog.filter(e=>e.group===group)){
     const option=document.createElement('option');
     option.value='sprite:'+entry.file;option.textContent=entry.label;
     section.appendChild(option);
   }
   assetGroup.parentNode.appendChild(section);
 }
 assetGroup.remove();
}
const clone=x=>JSON.parse(JSON.stringify(x));
const BUILD_SIZES=Object.freeze({small:{w:3,d:3,h:3.8,color:'#d2a883'},medium:{w:5,d:4,h:6.2,color:'#90a9ba'},large:{w:8,d:6,h:10.5,color:'#b9b9ae'}});
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const round=v=>Math.round(v*100)/100;
const seed={
 "format": "virtual-life-world-builder-v1",
 "version": 1,
 "map": {
  "name": "Virtual Life · Street / Office Study",
  "grid": "game:c,r",
  "units": "tile",
  "origin": {
   "x": 0,
   "z": 0
  },
  "worldBounds": {
   "minX": -30,
   "maxX": 40,
   "minZ": 20,
   "maxZ": 55
  },
  "road": {
   "z0": 32.75,
   "z1": 36.3
  },
  "notes": "Standalone 3D layout prototype. Obsolete Rebuild character and furniture art removed. Official Virtual Life Online art not yet migrated."
 },
 "objects": [
  {
   "id": "office-main",
   "type": "building",
   "name": "Virtual Office",
   "x": -6,
   "z": 25,
   "y": 0,
   "rotation": 0,
   "scale": 1,
   "w": 15,
   "d": 7,
   "h": 8,
   "color": "#647d95"
  },
  {
   "id": "office-annex",
   "type": "building",
   "name": "Office Annex",
   "x": 9,
   "z": 25.8,
   "y": 0,
   "rotation": 0,
   "scale": 1,
   "w": 12,
   "d": 5.3,
   "h": 7,
   "color": "#486a86"
  },
  {
   "id": "warteg-front",
   "type": "shop",
   "name": "Warteg",
   "x": 20,
   "z": 25.3,
   "y": 0,
   "rotation": 0,
   "scale": 1,
   "w": 9,
   "d": 6,
   "h": 4.8,
   "color": "#e5c17e"
  },
  {
   "id": "shop-east",
   "type": "shop",
   "name": "Toko Loak",
   "x": 26,
   "z": 42.7,
   "y": 0,
   "rotation": 0,
   "scale": 1,
   "w": 11,
   "d": 8,
   "h": 5.8,
   "color": "#cdb7a3"
  },
  {
   "id": "market-stalls",
   "type": "shop",
   "name": "Warung Sebrang",
   "x": 10,
   "z": 42.7,
   "y": 0,
   "rotation": 0,
   "scale": 1,
   "w": 13,
   "d": 7,
   "h": 5.2,
   "color": "#8dbdb9"
  },
  {
   "id": "shop-west",
   "type": "shop",
   "name": "Ruko Samping",
   "x": -8,
   "z": 42.7,
   "y": 0,
   "rotation": 0,
   "scale": 1,
   "w": 13,
   "d": 7.7,
   "h": 6.3,
   "color": "#b6bdc7"
  },
  {
   "id": "lamp-near",
   "type": "lamp",
   "name": "Street Lamp",
   "x": 8,
   "z": 31.2,
   "y": 0,
   "rotation": 0,
   "scale": 1
  },
  {
   "id": "tree-near",
   "type": "tree",
   "name": "Tree",
   "x": -13,
   "z": 28.1,
   "y": 0,
   "rotation": 0,
   "scale": 1
  },
  {
   "id": "tree-front",
   "type": "tree",
   "name": "Tree near Office",
   "x": 14,
   "z": 28.3,
   "y": 0,
   "rotation": 0,
   "scale": 1
  },
  {
   "id": "avatar-test",
   "type": "avatar",
   "name": "3D Character Placeholder",
   "x": 20.5,
   "z": 34,
   "y": 0,
   "rotation": 0,
   "scale": 1,
   "facing": "sw",
   "pose": null,
   "variant": "player",
   "collision": true
  },
  {
   "id": "npc-preview",
   "type": "npc",
   "name": "3D Character Placeholder",
   "x": 11,
   "z": 34.7,
   "y": 0,
   "rotation": 0,
   "scale": 1,
   "facing": "sw",
   "pose": null,
   "variant": "player",
   "collision": true
  }
 ]
};
let documentMap=clone(seed),defaultSeed=clone(seed),selectedId=null,mode='select',snap=true,undoStack=[],redoStack=[];
try{
 const r=await fetch('./world.json?v=p3',{cache:'no-store'});
 if(r.ok){defaultSeed=sanitize(await r.json());documentMap=clone(defaultSeed);}
}catch(err){console.warn('Using built-in map if world.json is unavailable',err);}
// Fresh installations start on the editable reference city; existing local
// editing sessions are restored below without overwriting their work.
try{
 if(window.VLReferenceCity){
  defaultSeed=sanitize(window.VLReferenceCity.create(defaultSeed,assetByName,style,schema));
  documentMap=clone(defaultSeed);
 }
}catch(error){console.warn('Could not seed Reference City; original map remains',error);}
try{
 const saved=JSON.parse(localStorage.getItem(STORE)||'null');
 if(saved&&saved.format===seed.format&&Array.isArray(saved.objects))documentMap=sanitize(saved);
}catch(e){console.warn('World Builder previous draft',e);}
documentMap.map.unbounded=true;
documentMap.map.terrain=terrain.normalize(documentMap.map.terrain||terrain.seeded(documentMap.map.worldBounds,documentMap.map.road),null);
defaultSeed.map.unbounded=true;
defaultSeed.map.terrain=terrain.normalize(defaultSeed.map.terrain||terrain.seeded(defaultSeed.map.worldBounds,defaultSeed.map.road),null);
function sanitize(v){
 if(!v||!Array.isArray(v.objects))throw Error('Expected objects array');
 if(v.objects.length>10000)throw Error('Too many objects (max 10000 per draft)');
 let ids=new Set(),out=clone(seed);out.objects=[];
 for(const p of v.objects){
  if(!p||typeof p.id!=='string'||p.id.length>100||ids.has(p.id))continue;
  if(!['building','shop','bench','lamp','tree','box','sprite','avatar','npc','marker'].includes(p.type))continue;
  ids.add(p.id);
  let e={
   id:p.id,name:String(p.name||p.type).slice(0,90),type:p.type,
   x:clamp(Number(p.x)||0,-1000000,1000000),
   z:clamp(Number(p.z)||0,-1000000,1000000),
   y:clamp(Number(p.y)||0,-20,45),
   rotation:actorType(p.type)?0:((Number(p.rotation)||0)%360+360)%360,
   scale:actorType(p.type)?1:clamp(Number(p.scale)||1,.1,8)
  };
  for(const k of ['w','d','h','width','height'])if(Number.isFinite(Number(p[k])))e[k]=clamp(Number(p[k]),.2,80);
  if(typeof p.color==='string'&&/^#[0-9a-fA-F]{6}$/.test(p.color))e.color=p.color;
  if(p.type==='sprite'){if(typeof p.asset!=='string'||!assetByName.has(p.asset))continue;e.asset=p.asset;}
  if(p.type==='sprite'&&/^(?:env|street2)\/[a-z0-9_/-]+\.png$/.test(p.asset||'')&&assetByName.has(p.asset))e.asset=p.asset;
  if(actorType(p.type)){
    e.facing=directions.includes(p.facing)?p.facing:'sw';
    e.pose=['sit','sleep','bathe','toilet','work'].includes(p.pose)?p.pose:null;
    e.variant='pipeline-v6b';
    e.profile=window.VLCharacterRig?.profiles?.[p.profile]?p.profile:'ichsan';
  }
  // Keep unknown action metadata as data only. No gameplay execution.
  if(p.action&&typeof p.action==='object')e.action=clone(p.action);
  if(p.collision!==undefined)e.collision=!!p.collision;
  if(p.type==='building'&&['small','medium','large'].includes(p.sizeClass))e.sizeClass=p.sizeClass;
  if(p.replaceable!==undefined)e.replaceable=!!p.replaceable;
  for(const key of ['layer','subtype','tags','interactions','capacity','entranceFacing','markerKind','blocking','notes']){
   if(Object.hasOwn(p,key))e[key]=clone(p[key]);
  }
  style.normalize(e,assetByName);schema.normalize(e,assetByName,style);
  out.objects.push(e);
 }
 if(v.map&&typeof v.map==='object')out.map={...out.map,...clone(v.map)};
 out.map.unbounded=true;
 out.map.terrain=terrain.normalize(v.map?.terrain||terrain.seeded(out.map.worldBounds,out.map.road),null);
 return out;
}
function saved(){
 draftDirty=true;
 try{
  localStorage.setItem(STORE,JSON.stringify(documentMap));
  $('saveStatus').textContent=activeDraftId?'● Edited · Save City':'● Working draft';
 }catch(e){$('saveStatus').textContent='⚠ Storage full · Export JSON';}
}
function undoPoint(){undoStack.push(JSON.stringify(documentMap));if(undoStack.length>60)undoStack.shift();redoStack=[];}
function restoreStack(from,to){
 if(!from.length)return;
 if(cameraFollowId)leaveCharacterCamera(true);
 to.push(JSON.stringify(documentMap));
 documentMap=sanitize(JSON.parse(from.pop()));selectedId=null;rebuild();rebuildTerrain();saved();
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
let refreshWindow=()=>{};
const camera=new THREE.OrthographicCamera(-20,20,20,-20,.1,350);
const cameraFocus=new THREE.Vector3(4,0,35);
// True 2:1 pixel-isometric ground (30° elevation), orthographic = no perspective resizing.
const direction=new THREE.Vector3(1,Math.sqrt(2/3),1).normalize();
let viewSize=35;
// Camera follow tracks the live actor mesh (not the saved JSON coordinates).
// This ensures Walk Test stays a non-destructive preview.
let cameraFollowId=null,mapCameraBeforeFollow=null;
function resetCamera(){
 if(documentMap.map?.preset==='reference-city-v1'){
  cameraFocus.set(14,0,49);viewSize=140;
 }else if(documentMap.map?.name?.includes('City Sample')){
  cameraFocus.set(4,0,37);viewSize=78;
 }else{cameraFocus.set(4,0,34.8);viewSize=35;}
 fitCamera();
}
function fitCamera(){
 const b=canvas.getBoundingClientRect();
 const aspect=Math.max(.3,b.width/Math.max(1,b.height));
 camera.left=-viewSize*aspect/2;camera.right=viewSize*aspect/2;
 camera.top=viewSize/2;camera.bottom=-viewSize/2;
 camera.position.copy(cameraFocus).addScaledVector(direction,100);
 camera.lookAt(cameraFocus);camera.updateProjectionMatrix();
 refreshWindow();
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

const tileGround=new THREE.Group();tileGround.name='Editable terrain';scene.add(tileGround);
const gridOverlay=new THREE.Group();gridOverlay.name='Grid overlay';scene.add(gridOverlay);
let gridShown=true;
const tilePalette={
 grass:0x409750,road:0x565d69,sidewalk:0xc2c6c8,
 water:0x459ac5,plaza:0xd9cfb5,soil:0x9c815e
};
// An infinite visual plane with sparse tile overrides avoids creating millions
// of objects: only terrain near the current camera is rendered.
const baseGround=new THREE.Mesh(new THREE.PlaneGeometry(1,1),texMat('grass',1,1));
baseGround.rotation.x=-Math.PI/2;baseGround.position.y=0;
baseGround.name='Unbounded ground';scene.add(baseGround);
const pickGroundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
const windowRay=new THREE.Raycaster();
const windowPoint=new THREE.Vector3();
let currentWindowKey='',currentVisibleRect=null;
function visibleWorldBounds(){
 const pts=[];
 for(const [x,y] of [[-1,-1],[-1,1],[1,-1],[1,1]]){
  windowRay.setFromCamera(new THREE.Vector2(x,y),camera);
  const p=windowRay.ray.intersectPlane(pickGroundPlane,windowPoint);
  if(p)pts.push({x:p.x,z:p.z});
 }
 if(pts.length!==4){
  const radius=Math.max(30,viewSize*2.5);
  return {minX:Math.floor(cameraFocus.x-radius),maxX:Math.ceil(cameraFocus.x+radius),
   minZ:Math.floor(cameraFocus.z-radius),maxZ:Math.ceil(cameraFocus.z+radius)};
 }
 const pad=3;
 return {minX:Math.floor(Math.min(...pts.map(p=>p.x))-pad),
  maxX:Math.ceil(Math.max(...pts.map(p=>p.x))+pad),
  minZ:Math.floor(Math.min(...pts.map(p=>p.z))-pad),
  maxZ:Math.ceil(Math.max(...pts.map(p=>p.z))+pad)};
}
function chunkWindow(v){
 const chunk=12;
 return {minX:Math.floor(v.minX/chunk)*chunk,maxX:Math.ceil(v.maxX/chunk)*chunk,
  minZ:Math.floor(v.minZ/chunk)*chunk,maxZ:Math.ceil(v.maxZ/chunk)*chunk};
}
function clearTerrain(){
 while(tileGround.children.length){
  const mesh=tileGround.children[0];tileGround.remove(mesh);
  mesh.material.dispose();mesh.geometry.dispose();
 }
}
function rebuildGrid(b){
 while(gridOverlay.children.length){
  const mesh=gridOverlay.children[0];gridOverlay.remove(mesh);
  mesh.geometry.dispose();mesh.material.dispose();
 }
 const verts=[];
 for(let c=b.minX;c<=b.maxX;c++)verts.push(c,.060,b.minZ,c,.060,b.maxZ);
 for(let r=b.minZ;r<=b.maxZ;r++)verts.push(b.minX,.060,r,b.maxX,.060,r);
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 const lines=new THREE.LineSegments(geo,new THREE.LineBasicMaterial({
  color:0xf8f4da,transparent:true,opacity:.4,depthTest:true,depthWrite:false}));
 lines.frustumCulled=false;lines.renderOrder=4;gridOverlay.add(lines);
 gridOverlay.visible=gridShown;
}
function rebuildTerrain(force=true){
 const v=visibleWorldBounds(),b=chunkWindow(v),key=[b.minX,b.maxX,b.minZ,b.maxZ].join(':');
 if(!force&&currentWindowKey===key)return;
 currentVisibleRect=b;currentWindowKey=key;
 const w=b.maxX-b.minX,d=b.maxZ-b.minZ;
 baseGround.position.set((b.minX+b.maxX)/2,.002,(b.minZ+b.maxZ)/2);
 baseGround.scale.set(w,d,1);
 baseGround.material.map.repeat.set(w/2.4,d/2.4);
 baseGround.material.map.needsUpdate=true;
 clearTerrain();
 const t=documentMap.map.terrain||{default:'grass',cells:[]};
 const itemsByKind=Object.fromEntries(terrain.types.map(type=>[type,[]]));
 for(const cell of t.cells){
  if(cell.c>=b.minX&&cell.c<b.maxX&&cell.r>=b.minZ&&cell.r<b.maxZ&&cell.type!==t.default)
   itemsByKind[cell.type]?.push(cell);
 }
 const tmp=new THREE.Object3D();
 for(const [kind,items] of Object.entries(itemsByKind)){
  if(!items.length)continue;
  const color=tilePalette[kind]||tilePalette.grass;
  const mat=new THREE.MeshBasicMaterial({color,depthTest:true,depthWrite:true});
  const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),mat,items.length);
  mesh.name='Painted '+kind;
  items.forEach((cell,i)=>{
   const y=kind==='road'?.024:kind==='sidewalk'?.036:kind==='water'?.015:.026;
   tmp.position.set(cell.c+.5,y,cell.r+.5);
   tmp.rotation.set(-Math.PI/2,0,0);tmp.scale.set(1,1,1);tmp.updateMatrix();
   mesh.setMatrixAt(i,tmp.matrix);
   if(kind==='grass'||kind==='water'||kind==='soil'){
    const variation=((cell.c*12347+cell.r*2917)>>>0)%9;
    mesh.setColorAt(i,new THREE.Color(color).multiplyScalar(.91+variation*.015));
   }
  });
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.frustumCulled=false;
  tileGround.add(mesh);
 }
 rebuildGrid(b);
}
refreshWindow=()=>rebuildTerrain(false);
rebuildTerrain();

const texLoader=new THREE.TextureLoader();
const spriteTexture=new Map();
function spriteDirection(deg=0){return ['sw','se','ne','nw'][((Math.round(deg/90)%4)+4)%4]}
function pixelTexture(name,dir='sw'){
 const spec=assetByName.get(name);
 const view=spec?.variants?.[dir]?dir:spec?.variants?.sw?'sw':spec?.variants?.se?'se':dir;
 const id=name+'|'+view;
 if(!spriteTexture.has(id)){
  const src=spec?.source==='pipeline-street'?window.VLPipelineAssets.building(spec.id,view):
    spec?.source==='pipeline-vegetation'?'https://raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/main/assets/vegetation_kebonsirih/'+spec.relativeFile:'../assets/'+name;
  const t=texLoader.load(src,()=>renderer.render(scene,camera),undefined,()=>console.warn('Missing sprite',name));
  t.colorSpace=THREE.SRGBColorSpace;t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;
  spriteTexture.set(id,t);
 }
 return spriteTexture.get(id);
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
 // Reference city landmarks have recognizable, still-replaceable silhouettes.
 // These are intentionally simple study geometry, not production artwork.
 const kind=String(item.subtype||'').toLowerCase();
 if(kind==='hospital'){
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(8,w*.58),1.15),
   new THREE.MeshBasicMaterial({map:labelTexture('HOSPITAL'),transparent:true,side:THREE.DoubleSide}));
  sign.position.set(0,h*.78,d/2+.13);root.add(sign);
  cuboid(root,0,h+.27,0,3.6,.12,3.6,0xecebe3);
  cuboid(root,0,h+.36,0,2.4,.08,.35,0x42669b);
  cuboid(root,0,h+.38,0,.35,.08,2.4,0x42669b);
 }else if(kind==='church'){
  cuboid(root,0,h+1.9,0,2.9,3.8,2.9,0xc4cfd2);
  cuboid(root,0,h+4.02,0,3.5,.46,3.5,0x334960);
  cuboid(root,0,h+5.0,0,.18,1.7,.18,0x55585c);
  cuboid(root,0,h+5.5,0,1.05,.14,.2,0x55585c);
 }else if(kind==='factory'){
  for(const x of [-w*.28,0,w*.28]){
   cuboid(root,x,h+1.75,-d*.22,1.45,3.5,1.45,0x8c7770);
   cuboid(root,x,h+3.56,-d*.22,1.7,.28,1.7,0x4d4747);
  }
 }else if(kind==='civic'&&/clock/i.test(item.name)){
  cuboid(root,0,h+2.5,0,3.6,5.0,3.6,0xc6b7a3);
  cuboid(root,0,h+4.98,0,4.2,.4,4.2,0x354456);
  for(const z of [-1,1]){
   const disc=new THREE.Mesh(new THREE.CircleGeometry(1.15,20),
    new THREE.MeshBasicMaterial({color:0xf5eedb,side:THREE.DoubleSide}));
   disc.position.set(0,h+3.3,z*1.84);if(z<0)disc.rotation.y=Math.PI;
   root.add(disc);
  }
 }else if(kind==='service'&&/gas/i.test(item.name)){
  cuboid(root,0,3.4,d*.35,w*.9,.35,d*.65,0xc44d37);
  for(const x of [-w*.33,w*.33])cuboid(root,x,1.7,d*.36,.28,3.4,.28,0xe3e1d5);
 }else if(['jail','school','library','hotel','warehouse','bank','police'].includes(kind)){
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(7,w*.76),.95),
   new THREE.MeshBasicMaterial({map:labelTexture(item.name),side:THREE.DoubleSide}));
  sign.position.set(0,Math.max(2.9,h*.67),d/2+.17);root.add(sign);
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
const billboardSprites=[];
function makePixelProp(root,type,item){
 const kind=style.isPixelProxy(type)?type:'box',art=style.proxyTexture(THREE,kind);
 // Keep fallback pixel art undistorted; published asset sizes stay canonical.
 const w=art.width,h=art.height;
 const mat=new THREE.MeshBasicMaterial({map:art.texture,transparent:false,alphaTest:.49,depthWrite:true,depthTest:true,side:THREE.DoubleSide});
 const plane=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
 plane.position.y=h*(art.pivot-.5);
 plane.userData.billboardPart=true;plane.userData.pixelProxy=true;
 plane.userData.aspectFixed=true;plane.userData.assetFile='__proxy:'+kind;
 root.userData.pixelProxy=true;root.add(plane);billboardSprites.push({root,plane});
}
function makeSprite(root,item){
 const spec=assetByName.get(item.asset);if(!spec)return;
 if((spec.source==='pipeline-street'||spec.source==='pipeline-vegetation')&&!spec.published){
  const kind=style.category(item,assetByName);
  if(kind==='building'){
   makeBuilding(root,{...item,type:spec.group==='loak'||spec.group==='kampung'?'shop':'building',
    w:spec.footprint?.[0]||3,d:spec.footprint?.[1]||3,
    h:Math.max(1.5,Math.min(19,spec.height*.9)),
    color:spec.group==='loak'?'#b39173':spec.group==='kampung'?'#b5ae9f':'#7294a8'});
  }else makePixelProp(root,kind,item);
  root.userData.pendingPipelineImage=spec.id;return;
 }

 const view=spriteDirection(item.rotation);
 const data=spec.variants?.[view]||spec.variants?.sw||spec.variants?.se;
 const size=data?.size||spec.size,pivot=data?.pivot||spec.pivot;
 const width=item.width||spec.width||4,height=item.height||spec.height||4;
 const py=pivot&&size?pivot[1]/size[1]:spec.pivotY??.8;
 const px=pivot&&size?(size[0]/2-pivot[0])/size[0]*width:0;
 for(const part of [{file:item.asset,off:0},...(spec.front?[{file:spec.front,off:.025}]:[])]){
  const mat=new THREE.MeshBasicMaterial({map:pixelTexture(part.file,view),transparent:false,alphaTest:.5,depthWrite:true,depthTest:true,side:THREE.DoubleSide});
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);
  plane.position.set(px,height*(py-.5),part.off);
  plane.userData.billboardPart=true;plane.userData.assetFile=part.file;
  plane.userData.displayFacing=view;plane.userData.pivotY=py;plane.userData.pivotX=pivot&&size?(size[0]/2-pivot[0])/size[0]:0;plane.userData.authorWidth=width;
  plane.userData.authorHeight=height;plane.userData.aspectFixed=false;
  root.add(plane);billboardSprites.push({root,plane});
 }
}
const rigs=new Map();
function makeAvatar(root,item){
 const factory=window.VLCharacterRig;
 if(factory){
   const rig=factory.createRig(THREE,{direction:item.facing||'sw',pose:item.pose||null,profile:item.profile||'ichsan'});
   root.add(rig.mesh);rigs.set(item.id,{rig,root});
 }else{
   console.warn('Canonical GPT character rig unavailable; actor art stays hidden.');
 }
}
function makeMarker(root,item){
 // Authoring-only marker: no production art, collision or gameplay side effects.
 const tag={spawn:'S',entrance:'E',interaction:'!',patrol:'P',trigger:'T'}[item.markerKind]||'!';
 const mat=new THREE.MeshBasicMaterial({color:0xfbd652,side:THREE.DoubleSide,depthTest:true,depthWrite:true});
 const body=new THREE.Mesh(new THREE.OctahedronGeometry(.23),mat);
 body.position.y=.5;root.add(body);
 const pole=new THREE.Mesh(new THREE.BoxGeometry(.045,.43,.045),mat);
 pole.position.y=.23;root.add(pole);
 root.userData.editorMarker=tag;
}
const owners=new Map(),assetRoots=new THREE.Group();scene.add(assetRoots);
let highlight=null;
function instantiate(o){
 const root=new THREE.Group();root.name=o.name;root.userData.itemId=o.id;
 root.position.set(o.x,o.y,o.z);root.rotation.y=actorType(o.type)?0:(o.rotation||0)*Math.PI/180;
 root.scale.setScalar(actorType(o.type)?1:(o.scale||1));
 switch(o.type){
  case 'building':case 'shop':makeBuilding(root,o);break;
  case 'bench':makePixelProp(root,'bench',o);break;
  case 'lamp':makePixelProp(root,'lamp',o);break;
  case 'tree':makePixelProp(root,'tree',o);break;
  case 'box':makePixelProp(root,'box',o);break;
  case 'sprite':makeSprite(root,o);break;
  case 'avatar':case 'npc':makeAvatar(root,o);break;
  case 'marker':makeMarker(root,o);break;
 }
 assetRoots.add(root);owners.set(o.id,root);
}
function clearAll(){
 for(const {rig} of rigs.values())rig.dispose();
 rigs.clear();billboardSprites.length=0;
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
 if(cameraFollowId&&!documentMap.objects.some(o=>o.id===cameraFollowId&&actorType(o.type))){
  cameraFollowId=null;mapCameraBeforeFollow=null;updateCharacterCameraUI();
 }
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
  $(k).disabled=!cur||(actorType(cur?.type)&&['rotation','scale'].includes(k));
 }
 $('tools').querySelectorAll('button').forEach(b=>b.disabled=!cur);
 for(const id of ['rotateL','rotateR','scaleDown','scaleUp'])
   $(id).disabled=!cur||actorType(cur.type);
 const rotateLocked=cur?.type==='sprite'&&(!assetByName.get(cur.asset)?.variants||Object.keys(assetByName.get(cur.asset).variants).length<2);
 if(rotateLocked){$('rotation').disabled=true;$('rotateL').disabled=true;$('rotateR').disabled=true;}
 const actor=!!cur&&actorType(cur.type);
 $('actorControls').classList.toggle('visible',actor);
 $('facing').disabled=!actor;$('pose').disabled=!actor;
 if(actor){
   $('facing').value=cur.facing||'sw';$('pose').value=cur.pose||'';
   $('profile').value=cur.profile||'ichsan';
 }
 $('profile').disabled=!actor;
 const editableBuilding=cur?.type==='building'||cur?.type==='shop';
 $('buildingControls').hidden=!editableBuilding;
 for(const [key,field] of [['buildingW','w'],['buildingD','d'],['buildingH','h']]){
  $(key).value=editableBuilding?cur[field]||'':'';
  $(key).disabled=!editableBuilding;
 }
 updateLogicUI();
 if(highlight&&highlight.userData.selected===cur?.id){
   highlight.update();
 }else{
   if(highlight){scene.remove(highlight);highlight.geometry.dispose();highlight.material.dispose();highlight=null;}
   if(cur&&owners.has(cur.id)){
     highlight=new THREE.BoxHelper(owners.get(cur.id),0xf5df42);
     highlight.userData.selected=cur.id;
     highlight.material.depthTest=false;highlight.material.transparent=true;
     highlight.renderOrder=100;scene.add(highlight);
   }
 }
}
function select(id){
 selectedId=id;updateSelection();
 if(id)tell(owners.get(id)?.userData?.pendingPipelineImage?'Preview sementara: PNG sumber belum dipublikasikan.':'Selected: '+item()?.name+'. Pilih Move lalu drag.');
 renderer.render(scene,camera);
}
function edit(fn,validatePosition=true){
 if(!item())return;
 const before=clone(item());undoPoint();fn(item());
 style.normalize(item(),assetByName);schema.normalize(item(),assetByName,style);
 const blocked=validatePosition?style.reason(item(),documentMap.objects,documentMap.map,assetByName):'';
 if(blocked){Object.assign(item(),before);undoStack.pop();updateSelection();tell(blocked);return;}
 applyItem();saved();
}
function applyItem(){
 const o=item();if(!o)return;
 const r=owners.get(o.id);if(!r)return;
 r.position.set(o.x,o.y,o.z);
 r.rotation.y=actorType(o.type)?0:o.rotation*Math.PI/180;
 r.scale.setScalar(actorType(o.type)?1:o.scale);
 const holder=rigs.get(o.id);
 if(holder){
   if(holder.rig.state.direction!==o.facing)holder.rig.setDirection(o.facing||'sw');
   if((holder.rig.state.pose||null)!==(o.pose||null))holder.rig.setPose(o.pose||null);
   if(holder.rig.state.profile!==(o.profile||'ichsan'))holder.rig.setProfile(o.profile||'ichsan');
 }
 updateSelection();renderer.render(scene,camera);
}
function id(type){return type+'-'+Math.random().toString(36).slice(2,8);}
function makeObject(type,point){
 const preset=style.presets[type],chosen=preset?'sprite:'+preset:type;
 const isCustom=type.startsWith('building:'),sizeClass=type.split(':')[1];
 const isMarker=type.startsWith('marker:'),isSprite=chosen.startsWith('sprite:'),asset=isSprite?chosen.slice(7):undefined;
 const spec=assetByName.get(asset),dims=BUILD_SIZES[sizeClass]||BUILD_SIZES.small;
 const obj={id:id(isCustom?'building':isMarker?'marker':isSprite?'sprite':type),
  type:isCustom?'building':isMarker?'marker':isSprite?'sprite':type,
  name:isCustom?sizeClass.toUpperCase()+' Building · replaceable':isSprite?(spec?.label||type):actorType(type)?'Virtual Life Character':type,
  x:round(point?.x??cameraFocus.x),z:round(point?.z??cameraFocus.z),y:0,rotation:0,scale:1};
 if(isCustom){Object.assign(obj,dims);obj.sizeClass=sizeClass;obj.replaceable=true;obj.collision=true;obj.layer='structure';obj.subtype='custom_building';obj.tags=['placeholder','building'];}
 if(isSprite){if(!spec)return null;obj.asset=asset;obj.width=spec.width;obj.height=spec.height;obj.collision=spec.collision!==false;}
 if(actorType(type)){obj.facing='sw';obj.pose=null;obj.variant='pipeline-v6b';obj.profile=type==='npc'?'noor':'ichsan';obj.collision=true;}
 if(isMarker){obj.markerKind=type.split(':')[1]||'interaction';obj.name=obj.markerKind+' marker';obj.collision=false;}
 if(type==='tree')obj.collision=true;
 if((type==='building'||type==='shop')&&!isSprite)return null;
 style.normalize(obj,assetByName);schema.normalize(obj,assetByName,style);
 return obj;
}
function add(type,point=null){
 const obj=makeObject(type,point);
 if(!obj){tell('Asset/prefab belum tersedia');return false;}
 if(point){
  const [fw,fd]=style.footprint(obj,assetByName);
  obj.x=Math.floor(point.x-fw/2)+fw/2;
  obj.z=Math.floor(point.z-fd/2)+fd/2;
  const reason=style.reason(obj,documentMap.objects,documentMap.map,assetByName);
  if(reason){tell(reason);return false;}
 }else if(!style.nearest(obj,documentMap.objects,documentMap.map,assetByName)){
  tell('Tidak ada lokasi kosong untuk objek baru');return false;
 }
 undoPoint();documentMap.objects.push(obj);instantiate(obj);select(obj.id);saved();
 tell('Placed: '+obj.name);return true;
}
function duplicate(){
 const o=item();if(!o)return;
 let q=clone(o);q.id=id(o.type);q.name=o.name+' copy';q.x+=1.2;q.z+=1.2;
 style.normalize(q,assetByName);schema.normalize(q,assetByName,style);
 if(!style.nearest(q,documentMap.objects,documentMap.map,assetByName)){tell('Tidak ada ruang untuk duplicate');return;}
 undoPoint();documentMap.objects.push(q);instantiate(q);select(q.id);saved();
}
function remove(){
 if(!item())return;
 if(cameraFollowId===selectedId)leaveCharacterCamera(false);
 undoPoint();
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
let activeTerrain='road',placementType=null,replaceTarget=null;
const placementPreview=new THREE.Mesh(new THREE.BoxGeometry(1,.07,1),new THREE.MeshBasicMaterial({color:0x50e677,transparent:true,opacity:.43,depthWrite:false}));
placementPreview.visible=false;placementPreview.position.y=.065;scene.add(placementPreview);
function previewPlace(point){
 if(!placementType||!point){placementPreview.visible=false;return;}
 const test=makeObject(placementType,point);if(!test)return;
 const [fw,fd]=style.footprint(test,assetByName);
 test.x=Math.floor(point.x-fw/2)+fw/2;test.z=Math.floor(point.z-fd/2)+fd/2;
 const reason=style.reason(test,documentMap.objects,documentMap.map,assetByName);
 placementPreview.position.set(test.x,.065,test.z);placementPreview.scale.set(fw,1,fd);
 placementPreview.material.color.setHex(reason?0xe35f5f:0x50e677);placementPreview.visible=true;
}
function paintAt(point,fill=false){
 if(!point)return 0;
 const c=Math.floor(point.x),r=Math.floor(point.z);
 const options={bounds:null,fillBounds:visibleWorldBounds(),roadClass:$('roadClass').value,autoSidewalk:$('autoSidewalk').checked};
 const t=documentMap.map.terrain;
 const n=fill?terrain.fill(t,c,r,activeTerrain,options):terrain.paint(t,c,r,activeTerrain,Number($('brushSize').value),options);
 if(n)rebuildTerrain(true);return n;
}
function onDown(e){
 if(e.button!==0&&e.pointerType==='mouse')return;
 e.preventDefault();canvas.setPointerCapture(e.pointerId);
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size===2){
  const pts=[...pointers.values()],mid={x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2};
  pinch={dist:Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y),mid,view:viewSize,focus:cameraFocus.clone(),ground:floorPoint({clientX:mid.x,clientY:mid.y})};
  if(drag?.kind==='paint'&&drag.changed)saved();
  for(const holder of rigs.values())holder.rig.setMoving(0,0,false);
  drag=null;placementPreview.visible=false;return;
 }
 const point=floorPoint(e);
 if(mode==='place'&&placementType){add(placementType,point);previewPlace(point);return;}
 if(mode==='paint'||mode==='fill'){
  if(!point)return;
  const c=Math.floor(point.x),r=Math.floor(point.z),kind=mode;
  undoPoint();
  const changed=paintAt(point,kind==='fill');
  drag=kind==='paint'?{kind:'paint',id:e.pointerId,last:c+','+r,changed:!!changed}:null;
  if(kind==='fill'){if(changed)saved();else undoStack.pop();}
  return;
 }
 const hit=pick(e);
 if(hit&&mode!=='walk')select(hit);
 if(hit&&mode==='walk'){
   const touched=documentMap.objects.find(x=>x.id===hit);
   if(touched&&actorType(touched.type)){
    walkActorId=hit;select(hit);
    if(cameraFollowId){cameraFollowId=hit;updateCharacterCameraUI();}
   }
 }
 const p=floorPoint(e);
 if(mode==='move'&&hit&&p){
  undoPoint();const o=item();
  drag={kind:'move',id:e.pointerId,start:p.clone(),x:o.x,z:o.z,changed:false,actor:actorType(o.type)};
 }else{
  drag={kind:'pan',id:e.pointerId,start:p?.clone()||null,focus:cameraFocus.clone(),sx:e.clientX,sy:e.clientY,hit:!!hit,changed:false};
 }
}
function onMove(e){
 if(!pointers.has(e.pointerId)){
  if(mode==='place'&&placementType)previewPlace(floorPoint(e));
  return;
 }
 const old=pointers.get(e.pointerId);old.x=e.clientX;old.y=e.clientY;
 if(pointers.size>=2&&pinch){
  const pts=[...pointers.values()],len=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
  const mid={x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2};
  viewSize=clamp(pinch.view*pinch.dist/Math.max(10,len),8,180);
  if(cameraFollowId){
   // In follow mode a pinch changes zoom, but does not pull the camera away.
   const actor=owners.get(cameraFollowId);
   if(actor)cameraFocus.set(actor.position.x,0,actor.position.z);
   fitCamera();return;
  }
  cameraFocus.copy(pinch.focus);fitCamera();
  const groundUnderFingers=floorPoint({clientX:mid.x,clientY:mid.y});
  if(groundUnderFingers&&pinch.ground){
    cameraFocus.x+=pinch.ground.x-groundUnderFingers.x;
    cameraFocus.z+=pinch.ground.z-groundUnderFingers.z;
  }
  fitCamera();return;
 }
 if(mode==='place'&&placementType&&pointers.size===1)previewPlace(floorPoint(e));
 if(!drag||drag.id!==e.pointerId)return;
 const p=floorPoint(e);
 if(drag.kind==='paint'&&p){
  const cell=Math.floor(p.x)+','+Math.floor(p.z);
  if(cell!==drag.last){drag.last=cell;drag.changed=!!paintAt(p)||drag.changed;}
  return;
 }
 if(drag.kind==='move'&&p&&item()){
  const o=item();let dx=p.x-drag.start.x,dz=p.z-drag.start.z;
  const oldX=o.x,oldZ=o.z;
  o.x=snap?Math.round((drag.x+dx)*2)/2:round(drag.x+dx);
  o.z=snap?Math.round((drag.z+dz)*2)/2:round(drag.z+dz);
  if(drag.actor&&(o.x!==oldX||o.z!==oldZ)){
    o.facing=window.VLCharacterRig?.directionFromWorld(o.x-oldX,o.z-oldZ,o.facing||'sw')||o.facing;
    o.pose=null;
  }
  drag.changed=true;applyItem();
  if(drag.actor)rigs.get(o.id)?.rig.setMoving(o.x-oldX,o.z-oldZ,true);
 }else if(drag.kind==='pan'&&!drag.hit){
  // Deliberate one-finger pan exits Follow, leaving the camera at its current location.
  if(cameraFollowId&&Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>5)
   leaveCharacterCamera(false);
  if(cameraFollowId)return;
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
 if(drag?.kind==='paint'&&drag.id===e.pointerId){
  if(drag.changed)saved();else undoStack.pop();
 }
 if(drag?.kind==='move'&&drag.id===e.pointerId){
   if(drag.actor){
     const rig=rigs.get(item()?.id)?.rig;
     if(rig)rig.setMoving(0,0,false);
   }
   if(drag.changed){
   const o=item(),blocked=o&&style.reason(o,documentMap.objects,documentMap.map,assetByName);
   if(blocked){o.x=drag.x;o.z=drag.z;applyItem();undoStack.pop();tell(blocked);}
   else saved();
  }else undoStack.pop();
 }
 drag=null;
}
canvas.addEventListener('pointerdown',onDown);
canvas.addEventListener('pointermove',onMove);
canvas.addEventListener('pointerup',onUp);
canvas.addEventListener('pointercancel',onUp);
// Desktop precision wheel stays as a non-UI fallback. Mobile uses pinch.
canvas.addEventListener('wheel',e=>{
 if(e.ctrlKey||e.pointerType==='mouse'||e.deltaMode===0){
  e.preventDefault();viewSize=clamp(viewSize*(e.deltaY>0?1.12:.89),8,180);fitCamera();
 }
},{passive:false});
// Walk Test previews canonical movement and 3D occlusion without mutating
// the authored map or touching multiplayer / player data.
const walkInput={up:false,down:false,left:false,right:false};
let walkActorId=null;
function clearWalk(){
 for(const k of Object.keys(walkInput))walkInput[k]=false;
 for(const [id,rec] of rigs){
   rec.rig.setMoving(0,0,false);
   const source=documentMap.objects.find(a=>a.id===id);
   if(source){
     rec.root.position.set(source.x,source.y,source.z);
     rec.rig.setPose(source.pose||null);
     rec.rig.setDirection(source.facing||'sw');
     rec.rig.setProfile(source.profile||'ichsan');
     if(source.pose)rec.rig.setPose(source.pose);
   }
 }
}
function setMode(m){
 if(mode==='walk'&&m!=='walk')clearWalk();
 mode=m;
 for(const type of ['select','move','walk','paint','fill'])
  $(type+'Mode')?.classList.toggle('active',m===type);
 if(m!=='place')placementType=null;
 if(placementPreview)placementPreview.visible=m==='place';
 $('walkPad').classList.toggle('active',m==='walk');
 if(m==='walk'){
   const first=(item()&&actorType(item().type)?item():documentMap.objects.find(x=>actorType(x.type)));
   if(!first){tell('Add character before Walk Test');setMode('select');return;}
   walkActorId=first.id;select(first.id);
   rigs.get(walkActorId)?.rig.setPose(null);
   tell('Walk Test: WASD / arrow keys / touch D-pad. Edits are not saved.');
 }
}

function updateCharacterCameraUI(){
 const following=!!cameraFollowId,button=$('cameraToCharacter'),icon=$('cameraCharacter');
 button.setAttribute('aria-pressed',String(following));
 icon.setAttribute('aria-pressed',String(following));
 icon.classList.toggle('active',following);
 const actor=following?documentMap.objects.find(o=>o.id===cameraFollowId):null;
 $('cameraFollowLabel').hidden=!following;
 $('cameraFollowLabel').textContent=actor?'🎥 FOLLOW · '+actor.name:'🎥 FOLLOW';
 $('cameraMapView').disabled=false;
}
function findCameraActor(){
 const selected=item();
 if(selected&&actorType(selected.type)&&owners.has(selected.id))return selected;
 const player=documentMap.objects.find(o=>o.type==='avatar'&&owners.has(o.id));
 return player||documentMap.objects.find(o=>actorType(o.type)&&owners.has(o.id))||null;
}
function enterCharacterCamera(){
 const actor=findCameraActor();
 if(!actor){
  tell('Belum ada karakter. Buka Assets → Characters, lalu place Player / NPC.');
  $('assetCategory').value='character';
  $('searchAsset').value='';
  renderAssetList();
  if(window.matchMedia('(max-width:780px)').matches)toggleMobileSheet('assetsPanel');
  return;
 }
 if(!cameraFollowId)mapCameraBeforeFollow={focus:cameraFocus.clone(),size:viewSize};
 cameraFollowId=actor.id;
 select(actor.id);
 setMode('walk');
 const root=owners.get(actor.id);
 if(root){
  cameraFocus.set(root.position.x,0,root.position.z);
  viewSize=16;
  fitCamera();
 }
 updateCharacterCameraUI();
 closeMobileSheets();
 tell('🎥 Camera mengikuti '+actor.name+' · gunakan D-pad atau WASD');
}
function leaveCharacterCamera(restore=true){
 const previous=mapCameraBeforeFollow;
 cameraFollowId=null;mapCameraBeforeFollow=null;
 if(mode==='walk')setMode('select'); // Clears temporary Walk Test positions.
 if(restore){
  if(previous){cameraFocus.copy(previous.focus);viewSize=previous.size;fitCamera();}
  else resetCamera();
 }
 updateCharacterCameraUI();
}
function cameraMapView(){
 if(cameraFollowId)leaveCharacterCamera(true);
 else resetCamera();
}
$('cameraToCharacter').onclick=enterCharacterCamera;
$('cameraCharacter').onclick=enterCharacterCamera;
$('cameraMapView').onclick=cameraMapView;
updateCharacterCameraUI();
$('selectMode').onclick=()=>setMode('select');
$('moveMode').onclick=()=>setMode('move');
$('paintMode').onclick=()=>setMode('paint');
$('fillMode').onclick=()=>setMode('fill');
function toggleGrid(){
 gridShown=!gridShown;gridOverlay.visible=gridShown;
 $('gridToggle').classList.toggle('active',gridShown);
 $('gridToggle').setAttribute('aria-pressed',String(gridShown));
 $('gridToolbar').textContent='# Grid '+(gridShown?'ON':'OFF');
 $('gridToolbar').setAttribute('aria-pressed',String(gridShown));
}
$('gridToggle').onclick=toggleGrid;
$('gridToolbar').onclick=toggleGrid;
$('gridToggle').classList.add('active');
$('snap').textContent='▦';$('snap').title='Snap: ON';

$('walkMode').onclick=()=>setMode(mode==='walk'?'select':'walk');
for(const b of $('walkPad').querySelectorAll('button[data-walk]')){
 const d=b.dataset.walk;
 b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);walkInput[d]=true;});
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])
   b.addEventListener(ev,()=>walkInput[d]=false);
}
function walkKey(e,down){
 if(mode!=='walk'||e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return false;
 const keys={w:'up',arrowup:'up',s:'down',arrowdown:'down',a:'left',arrowleft:'left',d:'right',arrowright:'right'};
 const target=keys[String(e.key).toLowerCase()];if(!target)return false;
 walkInput[target]=down;e.preventDefault();return true;
}
window.addEventListener('keydown',e=>walkKey(e,true),true);
window.addEventListener('keyup',e=>walkKey(e,false),true);
window.addEventListener('blur',()=>{for(const k of Object.keys(walkInput))walkInput[k]=false;});
$('addType').onchange=e=>{add(e.target.value);e.target.value='';setMode('move');};
$('home').onclick=cameraMapView;
$('rotateL').onclick=()=>{if(item()&&!actorType(item().type))edit(o=>{o.rotation=(o.rotation-90+360)%360;});};
$('rotateR').onclick=()=>{if(item()&&!actorType(item().type))edit(o=>{o.rotation=(o.rotation+90)%360;});};
$('scaleDown').onclick=()=>{if(item()&&!actorType(item().type))edit(o=>{o.scale=clamp(round(o.scale-.05),.85,1.15);});};
$('scaleUp').onclick=()=>{if(item()&&!actorType(item().type))edit(o=>{o.scale=clamp(round(o.scale+.05),.85,1.15);});};
$('duplicate').onclick=duplicate;$('delete').onclick=remove;
for(const prop of ['x','z','y','rotation','scale'])$(prop).addEventListener('change',()=>{
 const v=Number($(prop).value);
 if(!Number.isFinite(v)||!item())return;
 if(actorType(item().type)&&['rotation','scale'].includes(prop)){updateSelection();return;}
 edit(o=>{o[prop]=prop==='scale'?clamp(v,.85,1.15):prop==='rotation'?((v%360)+360)%360:clamp(v,-1000000,1000000);});
});
$('facing').onchange=()=>{if(item()&&actorType(item().type))edit(o=>{o.facing=$('facing').value;o.pose=null;});};
$('pose').onchange=()=>{if(item()&&actorType(item().type))edit(o=>{o.pose=$('pose').value||null;});};
$('profile').onchange=()=>{if(item()&&actorType(item().type))edit(o=>{o.profile=$('profile').value;});};

function assetCategory(spec){
 if(!spec)return 'street';
 const kind=style.category({type:'sprite',asset:spec.file},assetByName);
 if(spec.source==='pipeline-vegetation'||kind==='tree'||kind==='ground')return 'vegetation';
 if(spec.group==='Office'||spec.group==='Interior')return 'interior';
 if(kind==='building')return 'building';
 return 'street';
}
function updateLogicUI(){
 const cur=item();
 $('inspectorCount').textContent=documentMap.objects.length+' OBJ';
 const fields={
  logicName:cur?.name||'',logicLayer:cur?.layer||'prop',
  logicSubtype:cur?.subtype||'',logicTags:(cur?.tags||[]).join(', '),
  logicActions:(cur?.interactions||[]).join(', '),
  logicCapacity:cur?.capacity??1,
  logicFacing:cur?.entranceFacing||'',logicMarkerKind:cur?.markerKind||'',
  logicBlocking:cur?.blocking||'auto',logicNotes:cur?.notes||''
 };
 for(const [id,v] of Object.entries(fields)){$(id).value=v;$(id).disabled=!cur;}
 $('logicMarkerKind').disabled=!cur||cur.type!=='marker';
}
function renderAssetList(){
 const q=$('searchAsset').value.trim().toLowerCase(),cat=$('assetCategory').value;
 const assets=[
  ...[
    {title:'Road · paint',tag:'terrain:road',category:'terrain',label:'TERRAIN / DRIVABLE'},
    {title:'Sidewalk · paint',tag:'terrain:sidewalk',category:'terrain',label:'TERRAIN / WALKABLE'},
    {title:'Grass · paint',tag:'terrain:grass',category:'terrain',label:'TERRAIN / GROUND'},
    {title:'Water · paint',tag:'terrain:water',category:'terrain',label:'TERRAIN / NOT WALKABLE'},
    {title:'Plaza / Paving · paint',tag:'terrain:plaza',category:'terrain',label:'TERRAIN / PLAZA'},
    {title:'Soil · paint',tag:'terrain:soil',category:'terrain',label:'TERRAIN / DIRT'},
    {title:'Small Building · 3×3',tag:'building:small',category:'custom',label:'PLACEHOLDER / REPLACEABLE'},
    {title:'Medium Building · 5×4',tag:'building:medium',category:'custom',label:'PLACEHOLDER / REPLACEABLE'},
    {title:'Large Building · 8×6',tag:'building:large',category:'custom',label:'PLACEHOLDER / REPLACEABLE'},
    {title:'Park Tree · preview',tag:'tree',category:'vegetation',label:'PIXEL PLANE / PREVIEW'},
    {title:'Street Light · preview',tag:'lamp',category:'street',label:'PIXEL PLANE / PREVIEW'},
    {title:'Park Bench · preview',tag:'bench',category:'street',label:'PIXEL PLANE / PREVIEW'},
    {title:'Trash Bin · original',tag:'sprite:street2/loak/props/tong_sampah_besi_se.png',category:'street',label:'GPT / ORIGINAL · login'}
   ],
  ...[{title:'Player Spawn',tag:'marker:spawn',category:'logic',label:'LOGIC / SPAWN'},
      {title:'Entrance Point',tag:'marker:entrance',category:'logic',label:'LOGIC / DOOR'},
      {title:'Interaction Point',tag:'marker:interaction',category:'logic',label:'LOGIC / ACTION'},
      {title:'Patrol Point',tag:'marker:patrol',category:'logic',label:'LOGIC / PATH'},
      {title:'Trigger Zone',tag:'marker:trigger',category:'logic',label:'LOGIC / TRIGGER'},
      {title:'Character · Player',tag:'avatar',category:'character',label:'V6B / 64×112'},
      {title:'Character · NPC',tag:'npc',category:'character',label:'V6B / 64×112'}],
  ...assetCatalog.map(spec=>({
   title:spec.label,tag:'sprite:'+spec.file,category:assetCategory(spec),
   label:spec.source==='gpt-original'?'GPT / ORIGINAL · login':
    spec.published?'PIPELINE / PNG':'PIPELINE / MANIFEST ONLY',
   origin:spec.source==='gpt-original'?'original':spec.published?'published':'unpublished'
  }))
 ];
 const list=assets.filter(a=>(cat==='all'||a.category===cat)&&
  (a.title+' '+a.tag).toLowerCase().includes(q));
 $('assetCount').textContent=String(list.length).padStart(2,'0');
 const holder=$('assetList');holder.replaceChildren();
 for(const a of list){
  const btn=document.createElement('button');btn.type='button';
  const name=document.createElement('span');name.className='asset-title';name.textContent=a.title;
  const origin=document.createElement('span');origin.className='asset-origin '+(a.origin||'');origin.textContent=a.label;
  btn.append(name,origin);
  btn.onclick=()=>{
   if(a.tag.startsWith('terrain:')){
    activeTerrain=a.tag.slice(8);
    $('terrainLabel').textContent=activeTerrain.toUpperCase();
    setMode('paint');tell('Paint '+activeTerrain+' · drag on canvas');
   }else if(replaceTarget&&a.tag.startsWith('sprite:')){
    const idToReplace=replaceTarget,old=documentMap.objects.find(o=>o.id===idToReplace);
    const file=a.tag.slice(7),spec=assetByName.get(file);
    if(old&&spec){
     const previous=clone(old);
     Object.assign(old,{type:'sprite',asset:file,name:spec.label,collision:spec.collision!==false,replaceable:true,
      w:undefined,d:undefined,h:undefined,sizeClass:undefined,width:spec.width,height:spec.height});
     style.normalize(old,assetByName);schema.normalize(old,assetByName,style);
     const collision=style.reason(old,documentMap.objects,documentMap.map,assetByName);
     if(collision){Object.assign(old,previous);tell('Replace gagal: '+collision);}
     else {undoStack.push(JSON.stringify({...documentMap,objects:documentMap.objects.map(o=>o.id===idToReplace?previous:o)}));rebuild();saved();tell('Asset replaced');}
    }
    replaceTarget=null;setMode('select');
   }else{
    placementType=a.tag;setMode('place');placementType=a.tag;
    tell('Tap map to place '+a.title+' · green footprint = valid');
   }
   closeMobileSheets(); // The canvas must remain usable for building placement.

  };
  holder.appendChild(btn);
 }
}
$('searchAsset').oninput=renderAssetList;
$('assetCategory').onchange=renderAssetList;
for(const [key,field,kind] of [
 ['logicName','name','text'],['logicLayer','layer','text'],['logicSubtype','subtype','text'],
 ['logicTags','tags','csv'],['logicActions','interactions','csv'],
 ['logicCapacity','capacity','number'],['logicFacing','entranceFacing','text'],
 ['logicMarkerKind','markerKind','text'],['logicBlocking','blocking','text'],
 ['logicNotes','notes','text']
]){
 $(key).addEventListener('change',()=>{
  if(!item())return;
  const val=$(key).value;
  edit(o=>{o[field]=kind==='csv'?val.split(',').map(x=>x.trim()).filter(Boolean):
   kind==='number'?Math.max(0,Math.round(Number(val)||0)):val;},false);
 });
}
for(const [tab,pane,other,otherPane] of [
 ['tabLayout','layoutPane','tabLogic','logicPane'],
 ['tabLogic','logicPane','tabLayout','layoutPane']
]){
 $(tab).onclick=()=>{
  $(pane).hidden=false;$(otherPane).hidden=true;
  $(tab).classList.add('active');$(other).classList.remove('active');
 };
}
function closeMobileSheets(){
 $('assetsPanel').classList.remove('mobile-open');
 $('inspector').classList.remove('mobile-open');
 $('mobileAssets').setAttribute('aria-expanded','false');
 $('mobileInspector').setAttribute('aria-expanded','false');
}
function toggleMobileSheet(which){
 const panel=$(which),wasOpen=panel.classList.contains('mobile-open');
 closeMobileSheets();
 if(!wasOpen)panel.classList.add('mobile-open');
 const trigger=which==='inspector'?'mobileInspector':'mobileAssets';
 $(trigger).setAttribute('aria-expanded',String(!wasOpen));
}
$('mobileAssets').onclick=()=>toggleMobileSheet('assetsPanel');
$('mobileInspector').onclick=()=>toggleMobileSheet('inspector');
$('floatingInspector').onclick=()=>toggleMobileSheet('inspector');
$('closeAssets').onclick=closeMobileSheets;
$('closeInspector').onclick=closeMobileSheets;
window.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&($('inspector').classList.contains('mobile-open')||
  $('assetsPanel').classList.contains('mobile-open')))closeMobileSheets();
});
for(const [input,field] of [['buildingW','w'],['buildingD','d'],['buildingH','h']]){
 $(input).addEventListener('change',()=>{
  if(!item()||!['building','shop'].includes(item().type))return;
  const n=Number($(input).value);
  if(!Number.isFinite(n)){updateSelection();return;}
  edit(o=>{o[field]=Math.max(2,Math.min(20,field==='h'?Math.round(n*10)/10:Math.round(n)));});
  rebuild();
 });
}
$('replaceAsset').onclick=()=>{
 const current=item();
 if(!current||!['building','shop'].includes(current.type))return;
 replaceTarget=current.id;
 $('assetCategory').value='building';$('searchAsset').value='';
 renderAssetList();
 $('assetsPanel').classList.add('mobile-open');
 $('inspector').classList.remove('mobile-open');
 tell('Pilih asset dari BUILDINGS untuk mengganti placeholder');
};
$('exportShortcut').onclick=()=>$('export').click();
renderAssetList();

$('refreshAssets').onclick=()=>{
 window.VLCharacterRig?.retry();
 for(const tex of spriteTexture.values())tex.dispose();
 spriteTexture.clear();
 rebuild();
 tell('Sprites reloaded. If locked, open Virtual Life and sign in first.');
};
$('openGame').onclick=()=>window.open('../','_blank','noopener');
$('viewRef').onclick=()=>{$('assetReference').hidden=false;};
$('closeRef').onclick=()=>{$('assetReference').hidden=true;};
$('undo').onclick=()=>restoreStack(undoStack,redoStack);
$('redo').onclick=()=>restoreStack(redoStack,undoStack);
$('snap').onclick=()=>{snap=!snap;$('snap').title='Snap: '+(snap?'ON':'OFF');$('snap').classList.toggle('active',snap);};
async function refreshDraftPicker(selectId){
 const picker=$('draftPicker');
 picker.replaceChildren();
 let records=[];
 try{records=await window.VLCityDrafts.list();}
 catch(error){tell('Daftar draft gagal: '+error.message);return;}
 if(!records.length){
  const option=document.createElement('option');
  option.textContent='No saved cities yet';option.disabled=true;picker.appendChild(option);
  $('draftDetails').textContent='Save the current city to create your first named draft.';
  return;
 }
 for(const d of records){
  const o=document.createElement('option');o.value=d.id;
  o.textContent=d.name+' · '+d.objectCount+' objects';
  picker.appendChild(o);
 }
 picker.value=selectId||activeDraftId||records[0].id;
 if(!picker.value)picker.selectedIndex=0;
 updateDraftDetails(records);
}
function updateDraftDetails(records){
 const id=$('draftPicker').value,record=(records||[]).find(d=>d.id===id);
 if(!record){$('draftDetails').textContent='Choose a city to open.';return;}
 $('draftDetails').textContent=record.objectCount+' objects · '+record.tileCount+' terrain tiles · saved '+
  new Date(record.updatedAt).toLocaleString('id-ID');
}
async function openDraftDialog(){
 closeMobileSheets();
 $('draftDialog').hidden=false;
 $('draftName').value=documentMap.map?.name||'Untitled City';
 await refreshDraftPicker();
}
function closeDraftDialog(){$('draftDialog').hidden=true;}
async function saveNamedCity(asNew=false){
 const drafts=window.VLCityDrafts;
 if(!drafts)throw Error('Draft storage is not available');
 const name=drafts.cleanName($('draftName').value||documentMap.map?.name);
 const previousName=documentMap.map.name;
 documentMap.map.name=name;
 // Update the recovered working copy before writing the named snapshot.
 saved();
 try{
  const result=await drafts.save({
   id:asNew?null:activeDraftId,name,document:documentMap
  });
  activeDraftId=result.id;draftDirty=false;
  try{localStorage.setItem(ACTIVE_DRAFT_KEY,result.id);}catch{}
  $('saveStatus').textContent='● City Draft saved';
  $('draftName').value=name;
  await refreshDraftPicker(result.id);
  tell('City Draft saved: '+name);
  return result;
 }catch(error){
  documentMap.map.name=previousName;
  throw error;
 }
}
$('saveDraftMenu').onclick=()=>$('saveCityDraft').click();
$('openDraftMenu').onclick=openDraftDialog;
$('manageDrafts').onclick=openDraftDialog;
$('saveCityDraft').onclick=async()=>{
 if(activeDraftId){
  try{await saveNamedCity();}catch(e){tell('Save gagal: '+e.message);await openDraftDialog();}
 }else await openDraftDialog();
};
$('confirmSaveDraft').onclick=async()=>{
 try{await saveNamedCity(false);closeDraftDialog();}
 catch(error){tell('Save gagal: '+error.message);}
};
$('saveAsNewDraft').onclick=async()=>{
 try{await saveNamedCity(true);closeDraftDialog();}
 catch(error){tell('Save gagal: '+error.message);}
};
$('draftPicker').onchange=async()=>{
 try{updateDraftDetails(await window.VLCityDrafts.list());}
 catch(error){tell(error.message);}
};
$('loadDraft').onclick=async()=>{
 const id=$('draftPicker').value;
 if(!id)return;
 if(!confirm('Open selected City Draft? Current unsaved edits will be replaced. Save first if needed.'))return;
 try{
  const record=await window.VLCityDrafts.load(id);
  const errors=schema.validate(record.document,assetByName,style);
  if(errors.length)throw Error(errors.join('; '));
  if(cameraFollowId)leaveCharacterCamera(false);
  undoPoint();documentMap=sanitize(record.document);
  selectedId=null;activeDraftId=record.id;draftDirty=false;
  try{localStorage.setItem(ACTIVE_DRAFT_KEY,record.id);}catch{}
  rebuild();rebuildTerrain();resetCamera();saved();draftDirty=false;
  $('saveStatus').textContent='● City Draft opened';
  closeDraftDialog();
  tell('Opened: '+record.name);
 }catch(error){tell('Open draft gagal: '+error.message);}
};
$('deleteDraft').onclick=async()=>{
 const id=$('draftPicker').value;if(!id)return;
 if(!confirm('Delete selected City Draft from this browser? This cannot be undone.'))return;
 try{
  await window.VLCityDrafts.remove(id);
  if(activeDraftId===id){
   activeDraftId=null;draftDirty=true;
   try{localStorage.removeItem(ACTIVE_DRAFT_KEY);}catch{}
   $('saveStatus').textContent='● Working copy (draft deleted)';
  }
  await refreshDraftPicker();
  tell('Draft deleted; currently open canvas remains unchanged');
 }catch(error){tell('Delete gagal: '+error.message);}
};
$('closeDraftDialog').onclick=closeDraftDialog;
$('draftDialog').addEventListener('click',e=>{
 if(e.target===$('draftDialog'))closeDraftDialog();
});
window.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!$('draftDialog').hidden)closeDraftDialog();
});
function loadReferencePreset(){
 if(!confirm('Load Reference City layout? Current canvas will be replaced. Save your City Draft first if needed.'))return;
 try{
  const reference=window.VLReferenceCity.create(defaultSeed,assetByName,style,schema);
  if(cameraFollowId)leaveCharacterCamera(false);
  undoPoint();documentMap=sanitize(reference);selectedId=null;
  activeDraftId=null;draftDirty=true;
  try{localStorage.removeItem(ACTIVE_DRAFT_KEY);}catch{}
  closeMobileSheets();setMode('select');
  rebuild();rebuildTerrain();resetCamera();saved();
  tell('Reference City ready · tap Save Draft to keep a named copy');
 }catch(error){tell('Reference City gagal: '+error.message);}
}
$('referenceCity').onclick=loadReferencePreset;
function makeCityExample(){
 const city=clone(defaultSeed);
 city.objects=[];
 city.map.name='Virtual Life · City Sample (editable placeholders)';
 city.map.notes='Independent city-block authoring example. Buildings, parks and road intersections are replaceable layout drafts.';
 const bounds=city.map.worldBounds;
 const cells=new Map();
 const roads=new Set();
 const K=(c,r)=>c+','+r;
 for(let r=Math.ceil(bounds.minZ);r<bounds.maxZ;r++)for(let c=Math.ceil(bounds.minX);c<bounds.maxX;c++){
  const horizontal=(r>=24&&r<=26)||(r>=44&&r<=46);
  const vertical=(c>=-13&&c<=-11)||(c>=12&&c<=14)||(c>=29&&c<=31);
  if(horizontal||vertical)roads.add(K(c,r));
 }
 for(let r=Math.ceil(bounds.minZ);r<bounds.maxZ;r++)for(let c=Math.ceil(bounds.minX);c<bounds.maxX;c++){
  const key=K(c,r);
  if(roads.has(key)){cells.set(key,{c,r,type:'road',roadClass:'two_lane'});continue;}
  if([[1,0],[-1,0],[0,1],[0,-1]].some(([x,z])=>roads.has(K(c+x,r+z))))
   cells.set(key,{c,r,type:'sidewalk'});
 }
 // Park plaza with a small pond; all separate ground cells.
 for(let r=29;r<41;r++)for(let c=-8;c<9;c++){
  const k=K(c,r);if(roads.has(k))continue;
  if((c>=-1&&c<=2)&&(r>=34&&r<=36))cells.set(k,{c,r,type:'water'});
  else if(c===4||r===32||r===39)cells.set(k,{c,r,type:'plaza'});
  else cells.delete(k);
 }
 city.map.terrain={default:'grass',cells:[...cells.values()].sort((a,b)=>a.r-b.r||a.c-b.c)};
 const prefabs=[
  ['building:large',-22,30,'Hospital','hospital'],['building:medium',-21,40,'Office','office'],
  ['building:large',-22,51,'Factory','factory'],['building:medium',2,22,'Bank','bank'],
  ['building:medium',21,22,'School','school'],['building:large',21,34,'Office Tower','office'],
  ['building:medium',21,51,'Warehouse','warehouse'],['building:medium',1,51,'Shopping Row','shop'],
  ['building:small',-5,51,'Cafe','cafe'],['building:small',35,32,'House','house'],
  ['sprite:vegetation:pohon_asam_M',-6,31,'Park Tree','tree'],
  ['sprite:vegetation:pohon_asam_M',7,31,'Park Tree','tree'],
  ['sprite:vegetation:pohon_asam_M',-6,39,'Park Tree','tree'],
  ['sprite:vegetation:pohon_asam_M',7,39,'Park Tree','tree'],
  ['bench',-4,36,'Park Bench','bench'],['bench',6,36,'Park Bench','bench'],
  ['lamp',-9,34,'Street Light','lamp'],['lamp',10,33,'Street Light','lamp']
 ];
 for(const [tag,x,z,name,subtype] of prefabs){
  const obj=makeObject(tag,{x,z});if(!obj)continue;
  obj.name=name;obj.subtype=subtype;obj.tags=['city-sample','replaceable'];
  obj.replaceable=true;
  if(!style.reason(obj,city.objects,city.map,assetByName))city.objects.push(obj);
 }
 return sanitize(city);
}
$('newCity').onclick=()=>{
 if(!confirm('Start City Sample? Map draft saat ini akan diganti. Export JSON dulu jika ingin menyimpan layout lama.'))return;
 if(cameraFollowId)leaveCharacterCamera(false);
 undoPoint();documentMap=makeCityExample();selectedId=null;
 activeDraftId=null;draftDirty=true;
 try{localStorage.removeItem(ACTIVE_DRAFT_KEY);}catch{}
 rebuild();rebuildTerrain();resetCamera();saved();
 tell('City Sample ready · roads, park, water, placeholders');
};
$('reset').onclick=()=>{
 if(!confirm('Reset seluruh map draft 3D ke default?'))return;
 if(cameraFollowId)leaveCharacterCamera(false);
 undoPoint();documentMap=clone(defaultSeed);selectedId=null;
 activeDraftId=null;draftDirty=true;
 try{localStorage.removeItem(ACTIVE_DRAFT_KEY);}catch{}
 rebuild();rebuildTerrain();resetCamera();saved();tell('Reference City reset (working copy)');
};
$('export').onclick=()=>{
 const ready=schema.enrich(documentMap,assetByName,style);
 const errors=schema.validate(ready,assetByName,style);
 if(errors.length){tell('Map validation: '+errors.slice(0,2).join('; '));return;}
 let json=JSON.stringify(ready,null,2),blob=new Blob([json],{type:'application/json'}),url=URL.createObjectURL(blob);
 let a=document.createElement('a');a.href=url;a.download='virtual-life-ai-world-map-v3.json';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);tell('Map JSON exported');
};
$('import').onclick=()=>$('file').click();
$('file').onchange=async e=>{
 let f=e.target.files?.[0];if(!f)return;
 try{
  const payload=JSON.parse(await f.text());const errors=schema.validate(payload,assetByName,style);if(errors.length)throw Error(errors[0]);
  const d=sanitize(payload);
   if(cameraFollowId)leaveCharacterCamera(false);
   undoPoint();documentMap=d;selectedId=null;
   activeDraftId=null;draftDirty=true;
   try{localStorage.removeItem(ACTIVE_DRAFT_KEY);}catch{}
   rebuild();rebuildTerrain();resetCamera();saved();tell('Map imported as working copy');
 }catch(err){tell('Import gagal: '+err.message);}
 e.target.value='';
};
window.addEventListener('keydown',e=>{
 if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();restoreStack(undoStack,redoStack);}
  else if(e.key.toLowerCase()==='h'){toggleGrid();}
 else if(e.key==='Delete'&&item())remove();
 else if(e.key.toLowerCase()==='g')setMode('move');
 else if(e.key==='Escape')select(null);
});
window.addEventListener('error',e=>{console.error('World Builder runtime',e.error);});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();fail.style.display='flex';fail.textContent='WebGL context lost. Reload editor; changes are saved locally.';});
rebuild();resetCamera();resize();saved();
let priorFrame=performance.now();
function frame(now){
 requestAnimationFrame(frame);
 const dt=Math.min(.05,Math.max(0,(now-priorFrame)/1000));priorFrame=now;
 if(mode==='walk'&&walkActorId&&rigs.has(walkActorId)){
   const holder=rigs.get(walkActorId);
   let dx=Number(walkInput.right)-Number(walkInput.left);
   let dz=Number(walkInput.down)-Number(walkInput.up);
   const len=Math.hypot(dx,dz);
   if(len>.1){
     dx/=len;dz/=len;
     const speed=4.1;
     // Only editor preview movement, bounded to authored map envelope.
     let bounds=documentMap.map.worldBounds||{minX:-30,maxX:40,minZ:20,maxZ:55};
     holder.root.position.x+=dx*speed*dt;
     holder.root.position.z+=dz*speed*dt;
     holder.rig.setMoving(dx,dz,true);
   }else holder.rig.setMoving(0,0,false);
 }
 // Follow the live, unsaved Walk Test character position with frame-rate
 // independent easing. Orthographic projection prevents character scale changes.
 if(cameraFollowId){
  const actor=owners.get(cameraFollowId);
  if(!actor){leaveCharacterCamera(false);}
  else{
   const alpha=1-Math.exp(-dt*10);
   const x=actor.position.x,z=actor.position.z;
   const remaining=Math.hypot(x-cameraFocus.x,z-cameraFocus.z);
   if(remaining>0.003){
    cameraFocus.x+=(x-cameraFocus.x)*alpha;
    cameraFocus.z+=(z-cameraFocus.z)*alpha;
    fitCamera();
   }
  }
 }
 for(const {rig,root} of rigs.values())rig.step(dt,camera,root.position);
 const actorStates=[...rigs.values()].map(x=>x.rig.state);
 const notAvailable=actorStates.filter(x=>x.failed).length;
 const loading=actorStates.filter(x=>!x.loaded&&!x.failed).length;
 const pending=documentMap.objects.filter(o=>o.type==='sprite'&&assetByName.has(o.asset)&&
  (assetByName.get(o.asset).source==='pipeline-vegetation'||
   (assetByName.get(o.asset).source==='pipeline-street'&&!assetByName.get(o.asset).published))).length;
 const statusText=notAvailable?'V6B SPRITES UNAVAILABLE: '+notAvailable+' · reload/login':
  loading?'LOADING V6B ('+loading+')':
  'WORLD MAP READY · '+documentMap.objects.length+' OBJECTS';
 const finalStatus=statusText+(pending?' · '+pending+' source previews':'');
 if($('status').textContent!==finalStatus)$('status').textContent=finalStatus;
 // Old pixel assets are isometric single-view illustrations. Keep every
 // art plane CAMERA-FACING so rotating its parent never squashes the art.
 for(const entry of billboardSprites){
   const {root,plane}=entry;
   const key=plane.userData.assetFile,spec=assetByName.get(key);
   if(spec?.source==='pipeline-street'){
     const dir=spriteDirection(root.rotation.y*180/Math.PI);
     if(dir!==plane.userData.displayFacing){
       plane.material.map=pixelTexture(key,dir);plane.material.needsUpdate=true;
       plane.userData.displayFacing=dir;plane.userData.aspectFixed=false;
     }
   }
   const tex=plane.material.map,img=tex?.image;
   if(!plane.userData.aspectFixed&&img&&(img.naturalWidth||img.width)&&
       (img.naturalHeight||img.height)){
     const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;
     // Width is measured in 64px tile units; height compensates the camera
     // elevation so sprite pixels remain square in screen space.
     const realW=iw*PIXEL_WORLD,realH=ih*PIXEL_WORLD*VERTICAL_COMP;
     plane.scale.x=realW/plane.userData.authorWidth;
     plane.scale.y=realH/plane.userData.authorHeight;
     plane.position.y=realH*((plane.userData.pivotY??.8)-.5);
     plane.position.x=realW*(plane.userData.pivotX||0);
     plane.userData.aspectFixed=true;
   }
   const yaw=Math.atan2(camera.position.x-root.position.x,camera.position.z-root.position.z);
   plane.rotation.y=yaw-root.rotation.y;
 }
 renderer.render(scene,camera);
}
requestAnimationFrame(frame);
