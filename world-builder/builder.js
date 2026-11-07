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
// Read the published Mahluk Hidup catalog and local Character Storage
// before loading any saved city, so custom profiles survive import.
const mahluk=window.VLMahlukHidup;
const characterSync=mahluk?await mahluk.load():{loaded:false,total:0,custom:0};
const hideLegacyCharacters=mahluk?.referenceReset===true;
const approvedCharacter=profile=>!!mahluk?.get?.(profile)?.v2;
const indonesiaSync=await window.VLIndonesiaAssets?.load();
const jakartaUrbanSync=await window.VLJakartaUrban?.load();
let assetCatalog=window.VLAssetCatalog||[];
const assetByName=new Map(assetCatalog.map(x=>[x.file,x]));
if(window.VLSemestaTrafficLights){
 window.VLSemestaTrafficLights.registerCatalog();
 assetCatalog=window.VLAssetCatalog||assetCatalog;
 for(const e of window.VLSemestaTrafficLights.catalogEntries()){
  if(e?.file&&!assetByName.has(e.file))assetByName.set(e.file,e);
 }
}
const style=window.VLWorldStyle;
const terrain=window.VLMapTerrain;
const physics=window.VLWorldPhysics;
const studioSprites=window.VLSemestaStudioSprite;
const pipelineGround=window.VLSemestaPipelineGround;
const vegetationGround=window.VLSemestaVegetationGround;
const traffic=window.VLSemestaTraffic;
const trafficFlow=window.VLSemestaTrafficFlow;
const trafficLights=window.VLSemestaTrafficLights;
const trafficCatalog=window.VLSemestaCatalog;
const trafficArt=window.VLSemestaArt;
const vehiclePlacement=window.VLSemestaVehiclePlacement;
const schema=window.VLMapSchema;
const PIXEL_WORLD=Math.SQRT2/64, VERTICAL_COMP=2/Math.sqrt(3);
const actorType=t=>t==='avatar'||t==='npc';
const automaticType=t=>['vehicle','pedestrian','crowd','quest_npc'].includes(t);
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
const BUILD_SIZES=window.VLSemestaBuildingSpecs?.nativeDefaults||Object.freeze({small:{w:3,d:3,h:3.8,color:'#d2a883'},medium:{w:5,d:4,h:6.2,color:'#90a9ba'},large:{w:8,d:6,h:10.5,color:'#b9b9ae'}});
let pendingVaultCategory='prop',pendingVaultImageSize=null;
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
// Upgrade the built-in template immediately, without touching authored city data.
try{
 const starter=window.VLKebonSirihStyle?.upgrade(defaultSeed,assetCatalog);
 if(starter?.map){defaultSeed=sanitize(starter.map);documentMap=clone(defaultSeed);}
}catch(error){console.warn('Kebon Sirih starter upgrade',error);}
// Existing working drafts keep their coordinates, IDs and custom sprites.
// Only recognizable proxy objects are migrated; preserve their old draft.
try{
 const previousRaw=localStorage.getItem(STORE),saved=JSON.parse(previousRaw||'null');
 if(saved&&saved.format===seed.format&&Array.isArray(saved.objects)){
  const upgrade=window.VLKebonSirihStyle?.upgrade(saved,assetCatalog);
  if(upgrade?.changed&&previousRaw){
   try{
    const backupKey=STORE+'-backup-pre-kebon-sirih';
    if(!localStorage.getItem(backupKey))localStorage.setItem(backupKey,previousRaw);
   }catch(error){console.warn('Cannot retain old working draft backup',error);}
  }
  documentMap=sanitize(upgrade?.map||saved);
  if(upgrade?.changed){
   try{localStorage.setItem(STORE,JSON.stringify(mapForPersist()));}
   catch(error){console.warn('Could not auto-save upgraded draft',error);}
  }
 }
}catch(e){console.warn('World Builder previous draft',e);}
documentMap.map.unbounded=true;
documentMap.map.terrain=terrain.normalize(documentMap.map.terrain||terrain.seeded(documentMap.map.worldBounds,documentMap.map.road),null);
defaultSeed.map.unbounded=true;
defaultSeed.map.terrain=terrain.normalize(defaultSeed.map.terrain||terrain.seeded(defaultSeed.map.worldBounds,defaultSeed.map.road),null);
const dayClock=window.VLSemestaDayNight.makeClock(documentMap.map.environmentClock);
function syncClockToMap(){documentMap.map.environmentClock=dayClock.snapshot();}
function restoreCityClock(){
 dayClock.restore(documentMap.map.environmentClock||{minute:420,day:1,speed:1,paused:false});
}
function sanitize(v){
 if(!v||!Array.isArray(v.objects))throw Error('Expected objects array');
 if(v.objects.length>10000)throw Error('Too many objects (max 10000 per draft)');
 let ids=new Set(),out=clone(seed);out.objects=[];
 for(const p of v.objects){
  if(!p||typeof p.id!=='string'||p.id.length>100||ids.has(p.id))continue;
  if(!['building','shop','bench','lamp','tree','box','sprite','avatar','npc','marker','vehicle','pedestrian','crowd','quest_npc','virtual_asset'].includes(p.type))continue;
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
  if(typeof p.assetPath==='string'&&p.assetPath.length<=240&&!p.assetPath.includes('..')&&
    !p.assetPath.startsWith('/')&&/\.(png|webp|jpe?g|gif)$/i.test(p.assetPath))e.assetPath=p.assetPath;
  if(p.type==='virtual_asset'){
   if(!e.assetPath)continue;
   e.assetCategory=['building','prop','tree'].includes(p.assetCategory)?p.assetCategory:'prop';
  }
  if(p.type==='sprite'){if(typeof p.asset!=='string'||!assetByName.has(p.asset))continue;e.asset=p.asset;}
  if(p.type==='sprite'&&/^(?:env|street2)\/[a-z0-9_/-]+\.png$/.test(p.asset||'')&&assetByName.has(p.asset))e.asset=p.asset;
  if(actorType(p.type)){
    e.facing=directions.includes(p.facing)?p.facing:'sw';
    e.pose=['sit','sleep','lie','sleep_bed_right','sleep_bed_left','bathe','bathtub_bathe','toilet','work'].includes(p.pose)?p.pose:null;
    e.variant='pipeline-v6b';
    e.profile=(mahluk?.has(p.profile)||window.VLCharacterRig?.profiles?.[p.profile])?p.profile:'ichsan';
  }
  if(automaticType(p.type)){
   if(p.type==='vehicle'){
    if(!trafficCatalog?.vehicle(p.vehicleId))continue;
    e.vehicleId=p.vehicleId;
    // Preserve authored visual tuning on import, reload, undo and city drafts.
    e.visualOffset=vehiclePlacement.offset(p.visualOffset);
    e.autoGround=vehiclePlacement.autoGround(p);
   }else if(p.type==='quest_npc'){
    if(!trafficCatalog?.quest(p.questId)&&!mahluk?.has(p.profile))continue;
    e.questId=trafficCatalog?.quest(p.questId)?p.questId:'custom';
    e.profile=mahluk?.has(p.profile)?p.profile:
      mahluk?.questProfile(p.questId)||'ichsan';
   }else e.profile=(mahluk?.has(p.profile)||window.VLCharacterRig?.profiles?.[p.profile])?p.profile:'ichsan';
   if(p.motion&&typeof p.motion==='object')e.motion=clone(p.motion);
   e.facing=directions.includes(p.facing)?p.facing:'sw';
  }
  // Keep unknown action metadata as data only. No gameplay execution.
  if(p.action&&typeof p.action==='object')e.action=clone(p.action);
  if(p.type==='quest_npc'&&typeof p.jobId==='string')e.jobId=p.jobId.slice(0,80);
  if(p.collision!==undefined)e.collision=!!p.collision;
  if(p.type==='building'&&['small','medium','large'].includes(p.sizeClass))e.sizeClass=p.sizeClass;
  if(p.replaceable!==undefined)e.replaceable=!!p.replaceable;
  for(const key of ['layer','subtype','tags','interactions','capacity','entranceFacing','markerKind','blocking','notes','interactive','enterable','entrance','interior','actionSlots']){
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
let cloudCitySaveTimer=null;
async function persistWorkingCityForCloud(){
 if(!activeDraftId||!draftDirty||!window.VLCityDrafts)return null;
 const id=activeDraftId;
 const name=window.VLCityDrafts.cleanName(documentMap.map?.name);
 const copy=mapForPersist();
 const record=await window.VLCityDrafts.save({id,name,document:copy});
 // Do not overwrite a newer active selection if the user switched cities meanwhile.
 if(activeDraftId!==id)return null;
 draftDirty=false;
 $('saveStatus').textContent='☁ City saved locally · syncing Google Drive';
 return window.VLCityDrafts.load(record.id);
}
function scheduleCloudCitySave(){
 if(cloudCitySaveTimer)clearTimeout(cloudCitySaveTimer);
 if(!activeDraftId||!window.MembangunCloudDrive?.connected())return;
 cloudCitySaveTimer=setTimeout(async()=>{
  cloudCitySaveTimer=null;
  if(!draftDirty||!activeDraftId)return;
  try{
   const record=await persistWorkingCityForCloud();
   if(record)window.dispatchEvent(new CustomEvent('membangun:local-saved',{
    detail:{app:'semesta',kind:'city',record}
   }));
  }catch(e){$('saveStatus').textContent='⚠ Cloud autosave pending · '+e.message}
 },3200);
}
function saved(){
 syncClockToMap();
 draftDirty=true;
 try{
  localStorage.setItem(STORE,JSON.stringify(mapForPersist()));
  $('saveStatus').textContent=activeDraftId?'● Edited · auto-save pending':'● Working draft';
  scheduleCloudCitySave();
 }catch(e){$('saveStatus').textContent='⚠ Storage full · free browser space before saving';}
}
function undoPoint(){undoStack.push(JSON.stringify(documentMap));if(undoStack.length>60)undoStack.shift();redoStack=[];}
function restoreStack(from,to){
 if(!from.length)return;
 if(cameraFollowId)leaveCharacterCamera(true);
 to.push(JSON.stringify(documentMap));
 documentMap=sanitize(JSON.parse(from.pop()));restoreCityClock();selectedId=null;rebuild();rebuildTerrain();saved();
}
let toastTimer=null;
function tell(msg){
 let t=$('toast');t.textContent=msg;t.style.display='block';clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>t.style.display='none',2100);
 if(window.VLPlayHud&&typeof window.VLPlayHud.toast==='function'&&document.documentElement.classList.contains('vl-play-hud-active')){
  window.VLPlayHud.toast(msg);
 }
}
const scene=new THREE.Scene();
scene.background=new THREE.Color(0xbed8de);
const renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.setClearColor(0xbad0d8,1);
renderer.sortObjects=true;
let refreshWindow=()=>{},refreshAutoRoutes=()=>{};
const camera=new THREE.OrthographicCamera(-20,20,20,-20,.1,350);
const cameraFocus=new THREE.Vector3(4,0,35);
// True 2:1 pixel-isometric ground (30° elevation), orthographic = no perspective resizing.
const direction=new THREE.Vector3(1,Math.sqrt(2/3),1).normalize();
let viewSize=35;
// Camera follow tracks the live actor mesh (not the saved JSON coordinates).
// This ensures Walk Test stays a non-destructive preview.
let cameraFollowId=null,mapCameraBeforeFollow=null;
const activeAssetCamera=window.VLActiveAssetCamera;
let activeAssetAimId=null,activeAssetTracking=false,activeAssetListKey='';
function resetCamera(){
 if(documentMap.map?.preset?.startsWith('jakarta-city-')){
  cameraFocus.set(10,0,49);viewSize=145;
 }else if(documentMap.map?.preset==='reference-city-v1'){
  cameraFocus.set(14,0,49);viewSize=140;
 }else if(documentMap.map?.name?.includes('City Sample')){
  cameraFocus.set(4,0,37);viewSize=78;
 }else{cameraFocus.set(4,0,34.8);viewSize=35;}
 fitCamera();
}
function focusCameraAt(x,z,size){
 cameraFocus.set(Number(x)||0,0,Number(z)||0);
 if(size)viewSize=Math.max(8,Number(size));
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
const cityStyle=window.VLKebonSirihStyle;
// Material sprites are built from the Virtual Life Asset Pipeline; 3D planes
// project the tile textures into the editor's fixed 2:1 orthographic world.
const cityTextureLoader=new THREE.TextureLoader(),cityTextures=new Map();
function cityTexture(name){
 const url=cityStyle?.tileUrl(name);
 if(!url)return null;
 if(!cityTextures.has(name)){
  const tex=cityTextureLoader.load(url,()=>{
   if(baseGround?.material&&name==='grass'){baseGround.material.needsUpdate=true;}
   renderer.render(scene,camera);
  },undefined,()=>console.warn('Kebon Sirih texture unavailable',name));
  tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.magFilter=tex.minFilter=THREE.NearestFilter;
  tex.generateMipmaps=false;
  tex.colorSpace=THREE.SRGBColorSpace;
  cityTextures.set(name,tex);
 }
 return cityTextures.get(name);
}
const tilePalette={
 grass:0x409750,road:0x565d69,sidewalk:0xc2c6c8,
 water:0x459ac5,river:0x39727f,drain:0x6c7271,plaza:0xd9cfb5,soil:0x9c815e
};
// An infinite visual plane with sparse tile overrides avoids creating millions
// of objects: only terrain near the current camera is rendered.
const baseGround=new THREE.Mesh(new THREE.PlaneGeometry(1,1),texMat('grass',1,1));
baseGround.rotation.x=-Math.PI/2;baseGround.position.y=0;
baseGround.name='Unbounded ground';scene.add(baseGround);
const nativeGrass=cityTexture('grass');
if(nativeGrass){baseGround.material.map=nativeGrass;baseGround.material.needsUpdate=true;}

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
 baseGround.material.map.repeat.set(nativeGrass?w:w/2.4,nativeGrass?d:d/2.4);
 baseGround.material.map.needsUpdate=true;
 clearTerrain();
 const t=documentMap.map.terrain||{default:'grass',cells:[]};
 const tileIndex=new Map(t.cells.map(o=>[o.c+','+o.r,o.type]));
 const byVisualTile=new Map();
 for(const cell of t.cells){
  if(cell.c<b.minX||cell.c>=b.maxX||cell.r<b.minZ||cell.r>=b.maxZ||cell.type===t.default)continue;
  const assetName=cityStyle?.tile(cell.type,cell,tileIndex)||cell.type;
  if(!byVisualTile.has(assetName))byVisualTile.set(assetName,[]);
  byVisualTile.get(assetName).push(cell);
 }
 const tmp=new THREE.Object3D();
 for(const [assetName,items] of byVisualTile){
  if(!items.length)continue;
  const kind=assetName.startsWith('sidewalk')?'sidewalk':
   assetName.startsWith('road_')?'road':assetName;
  const source=cityTexture(assetName);
  const material=new THREE.MeshBasicMaterial({
   map:source||null,color:source?0xffffff:tilePalette[kind]||tilePalette.grass,
   depthTest:true,depthWrite:true
  });
  const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),material,items.length);
  mesh.name='Kebon Sirih · '+assetName;
  for(let i=0;i<items.length;i++){
   const cell=items[i],y=kind==='road'?.024:kind==='sidewalk'?.036:['water','river','drain'].includes(kind)?.015:.026;
   tmp.position.set(cell.c+.5,y,cell.r+.5);
   tmp.rotation.set(-Math.PI/2,0,0);tmp.scale.set(1,1,1);tmp.updateMatrix();
   mesh.setMatrixAt(i,tmp.matrix);
   if(['grass','water','river','soil'].includes(kind)){
    const variation=((cell.c*12347+cell.r*2917)>>>0)%9;
    mesh.setColorAt(i,new THREE.Color(source?0xffffff:tilePalette[kind]).multiplyScalar(.94+variation*.009));
   }
  }
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  mesh.frustumCulled=false;
  tileGround.add(mesh);
 }
 rebuildGrid(b);
 if(force)refreshAutoRoutes();
}
refreshWindow=()=>rebuildTerrain(false);
rebuildTerrain();

const texLoader=new THREE.TextureLoader();
const spriteTexture=new Map(),spriteDepthTexture=new Map();
function pixelDepthTexture(name,dir='sw'){
 const spec=assetByName.get(name),data=spec?.variants?.[dir]||
  spec?.variants?.sw||spec?.variants?.se;
 if(spec?.source!=='pipeline-street'||!data?.file)return null;
 const key=name+'|'+dir;
 if(!spriteDepthTexture.has(key)){
  const path=data.file.slice(0,-4)+'__depth.png';
  const source='https://raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/main/assets/street_buildings/'+path;
  const src=window.VLIndonesiaAssets?.cacheBust?.(spec,source)||source;
  const t=texLoader.load(src,()=>renderer.render(scene,camera),undefined,
   ()=>console.warn('Missing native pixel depth',name,dir,src));
  t.magFilter=t.minFilter=THREE.NearestFilter;
  t.colorSpace=THREE.NoColorSpace;
  t.generateMipmaps=false;
  spriteDepthTexture.set(key,t);
 }
 return spriteDepthTexture.get(key);
}
function spriteDirection(deg=0){return ['sw','se','ne','nw'][((Math.round(deg/90)%4)+4)%4]}
function pixelTexture(name,dir='sw'){
 const spec=assetByName.get(name);
 const view=spec?.variants?.[dir]?dir:spec?.variants?.sw?'sw':spec?.variants?.se?'se':dir;
 const id=name+'|'+view;
 if(!spriteTexture.has(id)){
  const src=spec?.source==='loak-v2'?(spec.url||window.VLLoakV2?.image(spec)||('./legacy-assets/loak-v2/'+(spec.relativeFile||''))):
    spec?.source==='legacy-local'?(spec.url||window.VLLegacyObjects?.image(spec)||('./legacy-assets/virtual-life-legacy/'+(spec.relativeFile||''))):
    spec?.source==='traffic-light'?(spec.url||window.VLSemestaTrafficLights?.spriteUrl(spec.facing||'sw','red')||('./legacy-assets/traffic-light/'+(spec.relativeFile||''))):
    spec?.source==='bangun-object'?window.VLBangunObjects?.image(spec.id,view):
     spec?.source==='custom-building'?window.VLBuildingBridge?.image(spec.id,view):
    spec?.source==='pipeline-street'?window.VLPipelineAssets.building(spec.id,view):
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
function originalPathFor(item){
 if(item.assetPath)return item.assetPath;
 const vault=window.VLAssetVault;
 if(!vault?.status().unlocked)return null;
 if(item.type==='sprite'){
  const spec=assetByName.get(item.asset);
  if(vault.allowed(item.asset))return item.asset;
  if(spec?.source==='pipeline-street'||spec?.source==='pipeline-vegetation')
   return vault.automaticMatch(spec.id)||null;
 }
 if((item.type==='building'||item.type==='shop')&&item.subtype)
  return vault.automaticMatch(item.subtype)||null;
 return null;
}
function showOriginalImage(root,item,path){
 const vault=window.VLAssetVault;
 if(!path||!vault?.allowed(path))return;
 vault.getImage(path).then(img=>{
  // Avoid resurrecting a removed/rebuilt object after an asynchronous unlock.
  if(owners.get(item.id)!==root||root.parent!==assetRoots)return;
  const width=Math.max(.7,Math.min(26,Number(item.width)||img.naturalWidth*PIXEL_WORLD));
  const height=Math.max(1,Math.min(33,Number(item.height)||img.naturalHeight*PIXEL_WORLD*VERTICAL_COMP));
  const texture=new THREE.Texture(img);texture.colorSpace=THREE.SRGBColorSpace;
  texture.magFilter=texture.minFilter=THREE.NearestFilter;
  texture.generateMipmaps=false;texture.needsUpdate=true;
  const mat=new THREE.MeshBasicMaterial({map:texture,alphaTest:.32,
   transparent:true,side:THREE.DoubleSide,depthWrite:true,depthTest:true});
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);
  const pivot=Number.isFinite(Number(item.pivotY))?Math.max(0,Math.min(1,Number(item.pivotY))):.86;
  plane.position.y=height*(pivot-.5);
  plane.userData.billboardPart=true;
  plane.userData.assetFile='__vault:'+path;
  plane.userData.aspectFixed=true;
  plane.userData.authorWidth=width;plane.userData.authorHeight=height;
  for(let i=billboardSprites.length-1;i>=0;i--)
   if(billboardSprites[i].root===root)billboardSprites.splice(i,1);
  // A real original asset may arrive while Outline mode is enabled.
  // Destroy its previous source/guide and rebuild lines from the new image.
  removeBuildingGuide(item.id);
  for(const child of [...root.children]){
   root.remove(child);child.traverse(node=>{
    if(node.geometry)node.geometry.dispose();
    if(node.material){
     for(const m of Array.isArray(node.material)?node.material:[node.material])m.dispose();
    }
   });
  }
  root.add(plane);billboardSprites.push({root,plane});
  applyBuildingGuide(root,item);
  root.userData.originalVirtualLifePath=path;
  if(physics.bigStructure(item,assetByName,style))registerBigOccluder(root,item);
  renderer.render(scene,camera);
 }).catch(err=>console.warn('Original image fallback',item.id,err.message));
}
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

 // Warteg is a depth-tested 3D building: the authored 1× art is
 // mapped onto reconstructed roof, walls and serving-front surfaces.
 // All four rotations retain their own original sprite texture.
 if(window.VLWarteg3D?.supported(spec)){
  const views=new Map();
  for(const dir of ['sw','se','ne','nw']){
   const layer=new THREE.Group();
   const ok=window.VLWarteg3D.attach(THREE,layer,spec,dir,pixelTexture(item.asset,dir));
   if(!ok)continue;
   layer.visible=dir===spriteDirection(item.rotation);
   root.add(layer);views.set(dir,layer);
  }
  if(views.size){
   root.userData.warteg3DVariants=views;
   root.userData.wartegTrueDepth=true;
   return;
  }
 }
 const view=spriteDirection(item.rotation);
 // Pipeline buildings, electricity poles, park lamps and street props have
 // an authored 2:1 GROUND apron below the center anchor. Render that apron
 // on world XZ instead of letting the terrain clip a below-ground quad.
 // Studio mesh Warteg and existing vegetation have independent grounding.
 if(pipelineGround?.supports(spec)){
  const grounded=pipelineGround.attach(THREE,root,spec,view,pixelTexture(item.asset,view),pixelDepthTexture(item.asset,view));
  if(grounded){
   grounded.facade.userData.assetFile=item.asset;
   grounded.facade.userData.groundBundle=grounded;
   billboardSprites.push({root,plane:grounded.facade});
   return;
  }
 }
 const data=spec.variants?.[view]||spec.variants?.sw||spec.variants?.se;
 const size=data?.size||spec.size,pivot=data?.pivot||spec.pivot;
 const width=item.width||spec.width||4,height=item.height||spec.height||4;
 const py=pivot&&size?pivot[1]/size[1]:spec.pivotY??.8;
 const px=pivot&&size?(size[0]/2-pivot[0])/size[0]*width:0;
 // Native isometric art spans the ground plane on BOTH sides of its
 // central footprint pivot. Compositing a studio sprite with the normal 3D
 // depth test causes grass to erase the front wall and entrance.
 const studio=studioSprites?.isStudio(spec)===true;
 for(const part of [{file:item.asset,off:0},...(spec.front?[{file:spec.front,off:.025}]:[])]){
  const flags=studio?studioSprites.spriteMaterial():
   {transparent:false,depthTest:true,depthWrite:true,alphaTest:.5};
  const mat=new THREE.MeshBasicMaterial({map:pixelTexture(part.file,view),...flags,side:THREE.DoubleSide});
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);
  if(studio){
   // Render after terrain and ordinary opaque meshes. Custom studio buildings
   // are 2D isometric compositing layers, not full 3D opaque volumes.
   plane.renderOrder=2;
   plane.userData.studioGroundComposite=true;
  }
  plane.position.set(px,height*(py-.5),part.off);
  plane.userData.billboardPart=true;plane.userData.assetFile=part.file;
  plane.userData.displayFacing=view;plane.userData.pivotY=py;plane.userData.pivotX=pivot&&size?(size[0]/2-pivot[0])/size[0]:0;plane.userData.authorWidth=width;
  plane.userData.authorHeight=height;plane.userData.aspectFixed=false;
  root.add(plane);billboardSprites.push({root,plane});
 }
}
const rigs=new Map(),automatedAgents=new Map(),transportRiders=new Map();
function resetAutoRoute(agent,obj){
 const mode=obj.type==='vehicle'?'vehicle':'pedestrian';
 agent.settings=traffic.config(obj);
 agent.record=obj;
 agent.distance=0;
 agent.awaitingRespawn=false;
 agent.spawnNeedsCheck=obj.type==='vehicle';
 agent.stalledSeconds=0;
 if(obj.type==='quest_npc'){
  agent.route=null;
  // Stationary job NPCs are intentionally allowed on road, sidewalk and
  // plaza (Pak Ogah can direct traffic from the road, not only sidewalk).
  const t=documentMap.map.terrain||{default:'grass',cells:[]};
  const tile=traffic.kind(t,Math.floor(obj.x),Math.floor(obj.z),traffic.index(t));
  agent.root.visible=['road','sidewalk','plaza'].includes(tile);
  return;
 }
 // Preserve the preview's current location when a road/sidewalk is repainted;
 // only a newly authored or manually repositioned agent starts at obj.x/z.
 const origin=agent.route?{x:agent.root.position.x,z:agent.root.position.z}:{x:obj.x,z:obj.z};
 // Plan around solid authored geometry; a path that ends at a bench/tree
 // must turn around instead of freezing or popping into another tile.
 let sidewalkOpen=null;
 if(mode==='pedestrian'){
  const boxes=documentMap.objects.filter(other=>
   other.id!==obj.id&&other.collision!==false&&other.blocking!=='no'&&
   !['vehicle','pedestrian','crowd'].includes(other.type)&&other.type!=='marker'
  ).map(other=>physics.area(other,assetByName,style));
  sidewalkOpen=(c,r)=>{
   const q={minX:c+.18,maxX:c+.82,minZ:r+.18,maxZ:r+.82};
   return !boxes.some(box=>physics.intersect(q,box));
  };
 }
 const point=traffic.spawnPosition(documentMap.map,origin.x,origin.z,mode,8,sidewalkOpen);
 agent.route=point?traffic.makeRoute(documentMap.map,point.x,point.z,mode,agent.settings.direction,sidewalkOpen):null;
 // A single isolated sidewalk square is a valid standing place even if
 // it has no traversable path; do not make the NPC vanish from the map.
 agent.root.visible=!!agent.route||(mode==='pedestrian'&&!!point);
 if(!agent.route&&point&&mode==='pedestrian')
  agent.root.position.set(point.x,obj.y||0,point.z);
 if(agent.route){
  agent.distance=traffic.nearestDistance(agent.route,point);
  const location=traffic.sample(agent.route,agent.distance);
  if(location)agent.root.position.set(location.x,obj.y||0,location.z);
  for(const part of agent.parts){
   const count=agent.parts.length;
   part.distance=agent.distance+(part.part||0)*agent.route.length/Math.max(1,count);
   const p=traffic.sample(agent.route,part.distance);
   if(p)part.child.position.set(p.x-agent.root.position.x,0,p.z-agent.root.position.z);
  }
 }
}
function loadVehicleImage(gfx,obj){
 // Vehicles have their own canonical Mahluk Hidup sprite loader. The
 // encrypted archive is historical and its fuzzy filename matches used to
 // overwrite Gojek/triple art with the wrong image and wrong frame geometry.
 // Keep user-linked per-instance art opt-in; job NPCs may still use the vault.
 const source=obj.assetPath||(obj.type==='vehicle'?null:
   window.VLAssetVault?.automaticMatch(obj.questId));
 if(!source||!window.VLAssetVault?.allowed(source))return;
 window.VLAssetVault.getImage(source).then(img=>{
  // Vehicle sprite is nested in its visual-offset group. Job NPC sprites
  // are direct root children. Both must still belong to the active scene.
  let ancestor=gfx.mesh;
  while(ancestor&&ancestor!==assetRoots)ancestor=ancestor.parent;
  if(ancestor!==assetRoots)return;
  const isNPC=obj.type==='quest_npc';
  const spec=trafficCatalog.vehicle(obj.vehicleId);
  const cv=document.createElement('canvas');
  cv.width=isNPC?64:(spec?.size[0]||160);
  cv.height=isNPC?112:(spec?.size[1]||108);
  const ctx=cv.getContext('2d');ctx.imageSmoothingEnabled=false;
  let sx=0,sy=0,sw=img.naturalWidth,sh=img.naturalHeight;
  if(isNPC&&sw>=128&&sh>=448&&sw%64===0&&sh%112===0){
   sw=64;sh=112;sy=448; // First idle frame in a V6B-compatible sheet.
  }
  const scale=Math.min(cv.width/sw,cv.height/sh),dw=sw*scale,dh=sh*scale;
  ctx.drawImage(img,sx,sy,sw,sh,(cv.width-dw)/2,cv.height-dh,dw,dh);
  const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
  tex.minFilter=tex.magFilter=THREE.NearestFilter;tex.needsUpdate=true;
  const originalUpdate=gfx.update;
  if(originalUpdate)gfx.update=(dir,cam,root)=>{
   originalUpdate(dir,cam,root);
   gfx.mesh.material.map=tex;gfx.mesh.material.needsUpdate=true;
  };
  gfx.mesh.material.map=tex;gfx.mesh.material.needsUpdate=true;
  // Vault images are fitted into a padded preview canvas, not the original
  // atlas frame. Keep the padded-asset ground pivot instead of the source one.
  gfx.setGroundPivot?.('fitted');
  const prevDispose=gfx.dispose;
  gfx.dispose=()=>{tex.dispose();prevDispose();};
 }).catch(()=>{});
}
function makeAutomated(root,obj){
 if(hideLegacyCharacters&&obj.type!=="vehicle"&&!approvedCharacter(obj.profile)){
  root.visible=false;return; // Saved city NPC data remains intact.
 }
 const kind=obj.type,settings=traffic.config(obj);
 const agent={id:obj.id,root,kind,route:null,distance:0,settings,parts:[],graphic:null};
 if(kind==='vehicle'){
  // Keep the route/collision root on the lane centre. Only the child art
  // moves when editing its pixel placement (including live moving vehicles).
  const visual=new THREE.Group();
  visual.name='Vehicle Visual Placement';visual.userData.visualOnly=true;
  root.add(visual);
  const gfx=trafficArt.vehicleGraphic(THREE,obj);
  visual.add(gfx.mesh);
  vehiclePlacement.apply(visual,obj);
  agent.visual=visual;agent.graphic=gfx;loadVehicleImage(gfx,obj);
 }else if(kind==='quest_npc'){
  const profile=mahluk?.has(obj.profile)?obj.profile:mahluk?.questProfile(obj.questId);
  const factory=window.VLCharacterRig;
  if(profile&&factory){
   const rig=factory.createRig(THREE,{profile,direction:obj.facing||'sw',
    pose:settings.idleAction||'idle'});
   root.add(rig.mesh);
   agent.graphic={step(dt,cam,pos,action){
    if(rig.state.direction!==(obj.facing||'sw'))rig.setDirection(obj.facing||'sw');
    rig.setPose(action||'idle');
    rig.step(dt,cam,pos?.position||pos);
   },dispose(){rig.dispose();}};
  }else{
   const gfx=trafficArt.questGraphic(THREE,obj);
   root.add(gfx.mesh);agent.graphic=gfx;loadVehicleImage(gfx,obj);
  }
 }else{
  const factory=window.VLCharacterRig;
  if(factory){
   const candidates=['ichsan','noor','nadia','raka','ellen','bima','theodore','warteg','barista','kasir'];
   const n=kind==='crowd'?settings.count:1;
   for(let i=0;i<n;i++){
    const profile=kind==='crowd'?candidates[(i*3+2)%candidates.length]:obj.profile||'ichsan';
    const rig=factory.createRig(THREE,{profile,direction:obj.facing||'sw'});
    const child=new THREE.Group();root.add(child);child.add(rig.mesh);
    agent.parts.push({child,rig,part:i});
   }
  }
 }
 automatedAgents.set(obj.id,agent);resetAutoRoute(agent,obj);
}
refreshAutoRoutes=()=>{
 for(const [id,agent] of automatedAgents){
  const o=documentMap.objects.find(v=>v.id===id);
  if(o)resetAutoRoute(agent,o);
 }
};
function trafficArea(record,position,dx=1,dz=0){
 const motor=record.type==='vehicle',source=motor?trafficCatalog.vehicle(record.vehicleId):null;
 const specFootprint=source?.editorFootprint||source?.footprint||[2.9,.85];
 let w=motor?Math.max(.95,Number(specFootprint[0])):.53;
 let depth=motor?Math.max(.6,Number(specFootprint[1])):.53;
 if(Math.abs(dz)>Math.abs(dx))[w,depth]=[depth,w];
 return {minX:position.x-w/2,maxX:position.x+w/2,minZ:position.z-depth/2,maxZ:position.z+depth/2};
}
function movingOverlap(record,candidate,dx,dz,ignore){
 const area=trafficArea(record,candidate,dx,dz);
 for(const [id,agent] of automatedAgents){
  if(id===ignore||agent.kind==='quest_npc'||!agent.root.visible)continue;
  const other=documentMap.objects.find(o=>o.id===id);
  if(!other)continue;
  const parts=agent.kind==='crowd'?agent.parts.map(part=>({
   x:part.child.position.x+agent.root.position.x,
   z:part.child.position.z+agent.root.position.z
  })):[agent.root.position];
  for(const pt of parts){
   const box=trafficArea(other,pt,agent.lastDx||1,agent.lastDz||0);
   if(physics.intersect(area,box))return true;
  }
 }
 return false;
}
function simulationObstacles(){
 const obstacles=documentMap.objects.filter(o=>!automaticType(o.type)||o.type==='quest_npc');
 for(const [id,agent] of automatedAgents){
  if(agent.kind==='quest_npc'||!agent.root.visible)continue;
  const source=documentMap.objects.find(o=>o.id===id);
  if(!source)continue;
  if(agent.kind==='crowd'){
   agent.parts.forEach((part,i)=>obstacles.push({
    id:id+':person-'+i,type:'npc',collision:true,blocking:'auto',scale:1,
    x:agent.root.position.x+part.child.position.x,
    z:agent.root.position.z+part.child.position.z
   }));
  }else obstacles.push({
   ...source,x:agent.root.position.x,z:agent.root.position.z,
   collision:true,blocking:'auto'
  });
 }
 return obstacles;
}
// When another car fills the start of the same straight road,
 // wait off-map rather than teleporting on top of it.
function recycleVehicle(agent){
 agent.awaitingRespawn=true;
 agent.root.visible=false;
 agent.distance=0;
 agent.stalledSeconds=0;
}
function vehicleProbe(obj,position){
 return {...obj,x:position.x,z:position.z,collision:true,blocking:'auto'};
}
function stopVehicle(agent,cfg,dt,heading,following=false){
 if(following){
  // A real queue stays in position until the car ahead moves. Do not
  // recycle drivers just because normal following traffic is congested.
  agent.stalledSeconds=0;
 }else if(cfg.enabled){
  agent.stalledSeconds=(agent.stalledSeconds||0)+dt;
  // A permanently blocked authored road must not accumulate a static
  // pile of vehicles. Requeue this car off-map and retry from the start.
  if(agent.stalledSeconds>6){recycleVehicle(agent);return;}
 }
 agent.graphic?.update(heading||'se',camera,agent.root);
}
function attemptVehicleRespawn(agent,obj,cfg,blockers,live,cars){
 if(!cfg.enabled)return;
 const p=traffic.sample(agent.route,0);
 if(!p||!traffic.allowed(documentMap.map,p.x,p.z,'vehicle'))return;
 if(!trafficFlow.spawnClear(agent,cars))return;
 const probe=vehicleProbe(obj,p);
 if(!physics.check(probe,p,blockers,documentMap.map,assetByName,style,live).ok)return;
 if(movingOverlap(probe,p,p.dx,p.dz,obj.id))return;
 agent.awaitingRespawn=false;
 agent.root.visible=true;
 agent.root.position.set(p.x,obj.y||0,p.z);
 agent.distance=0;agent.stalledSeconds=0;
 agent.lastDx=p.dx;agent.lastDz=p.dz;
 agent.graphic?.update(window.VLCharacterRig?.directionFromWorld(p.dx,p.dz,'se')||'se',camera,agent.root);
}
let trafficLightTime=0,trafficLightFrozen=false;
function trafficLightSettings(){
 const TL=window.VLSemestaTrafficLights;
 if(!TL)return {enabled:false,cycleSeconds:32};
 return TL.moduleSettings(typeof currentPlayGameplay==='function'?currentPlayGameplay():null);
}
function currentTrafficPhase(){
 const TL=window.VLSemestaTrafficLights;
 const s=trafficLightSettings();
 if(!TL||!s.enabled)return null;
 return TL.phaseAt(trafficLightTime,s.cycleSeconds);
}
function textureFromUrl(url){
 if(!url)return null;
 if(!spriteTexture.has(url)){
  const t=texLoader.load(url,()=>renderer.render(scene,camera),undefined,()=>console.warn('Missing sprite',url));
  t.colorSpace=THREE.SRGBColorSpace;t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;
  spriteTexture.set(url,t);
 }
 return spriteTexture.get(url);
}
function refreshTrafficLights(){
 const TL=window.VLSemestaTrafficLights;
 if(!TL||typeof owners==='undefined')return;
 const s=trafficLightSettings();
 const phase=s.enabled?TL.phaseAt(trafficLightTime,s.cycleSeconds):null;
 if(!phase)return;
 const paints=TL.poleStates(documentMap.objects,phase);
 for(const p of paints){
  const rec=documentMap.objects.find(o=>o.id===p.id);
  if(rec){
   if(!rec.trafficLight)rec.trafficLight={};
   rec.trafficLight.lamp=p.lamp;
   rec.trafficLight.facing=p.facing;
   rec.trafficLight.approach=p.approach;
  }
  const root=owners.get(p.id);
  if(!root||root.userData.tlUrl===p.url)continue;
  root.userData.tlUrl=p.url;root.userData.tlLamp=p.lamp;
  root.traverse(node=>{
   if(node.isMesh&&node.userData.billboardPart){
    const tex=textureFromUrl(p.url);
    if(tex){node.material.map=tex;node.material.needsUpdate=true;}
   }
  });
 }
}
function vehicleLightCap(agent){
 const TL=window.VLSemestaTrafficLights;
 const s=trafficLightSettings();
 if(!TL||!s.enabled)return Infinity;
 return TL.stopAhead(agent,documentMap.map,documentMap.objects,TL.phaseAt(trafficLightTime,s.cycleSeconds));
}
function seedTrafficLightsOnMap(){
 const TL=window.VLSemestaTrafficLights;
 if(!TL)return {added:0};
 const existing=TL.polesOf(documentMap.objects);
 if(existing.length)return {added:0,existing:existing.length,ids:existing.map(o=>o.id)};
 const seeded=TL.seedObjects(documentMap.map);
 for(const o of seeded.objects){
  if(documentMap.objects.some(x=>x.id===o.id))continue;
  documentMap.objects.push(o);
  instantiate(o);
 }
 refreshTrafficLights();
 if(typeof saved==='function')saved();
 return {added:seeded.objects.length,boxes:(seeded.boxes||[]).map(b=>b.id)};
}
function placeTrafficLightAt(x,z,facing,approach){
 const f=facing==='se'?'se':'sw';
 const o={
  id:'tl-place-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),
  type:'sprite',asset:'traffic_light_'+f,name:'traffic_light_'+f,label:'Lampu lalu lintas',
  source:'traffic-light',x:Number(x)||0,z:Number(z)||0,y:0,rotation:0,scale:1,
  width:1.15,height:2.4,collision:false,blocking:'no',replaceable:true,
  trafficRole:'signal',trafficLight:{facing:f,approach:approach==='ew'?'ew':'ns',lamp:'red'}
 };
 documentMap.objects.push(o);
 instantiate(o);
 refreshTrafficLights();
 return o;
}
function inspectTrafficLights(){
 const TL=window.VLSemestaTrafficLights;
 const s=trafficLightSettings();
 const phase=s.enabled&&TL?TL.phaseAt(trafficLightTime,s.cycleSeconds):null;
 const poles=TL?TL.polesOf(documentMap.objects):[];
 const boxes=TL?TL.boxesForPoles(documentMap.map,documentMap.objects):[];
 const live=[...automatedAgents.values()].filter(a=>a.kind==='vehicle'&&a.root?.visible!==false&&!a.awaitingRespawn);
 const cars=live.map(a=>({
  id:a.id||a.record?.id,x:a.root?.position?.x,z:a.root?.position?.z,distance:a.distance||0,
  vehicleId:a.record?.vehicleId,stalled:a.stalledSeconds||0
 }));
 const overlapIds=[];
 for(let i=0;i<live.length;i++){
  for(let j=i+1;j<live.length;j++){
   const a=live[i],b=live[j];
   if(trafficFlow.sameLane(a,b)){
    const need=(trafficFlow.lengthOf(a.record)+trafficFlow.lengthOf(b.record))/2+trafficFlow.GAP;
    if(Math.abs((a.distance||0)-(b.distance||0))<need-0.0001)overlapIds.push([a.record?.id,b.record?.id]);
   }else{
    const dx=(a.root.position.x-b.root.position.x),dz=(a.root.position.z-b.root.position.z);
    if(Math.hypot(dx,dz)<0.45)overlapIds.push([a.record?.id,b.record?.id]);
   }
  }
 }
 let maxStall=0;
 live.forEach(a=>{maxStall=Math.max(maxStall,a.stalledSeconds||0);});
 const depth=[];
 for(const pole of poles){
  const root=owners.get(pole.id);
  let flags=null;
  root?.traverse(node=>{
   if(!flags&&node.isMesh&&node.userData.billboardPart){
    flags={depthTest:node.material.depthTest!==false,depthWrite:node.material.depthWrite!==false,y:root.position.y};
   }
  });
  depth.push({id:pole.id,flags,x:pole.x,z:pole.z});
 }
 return {
  time:trafficLightTime,phase,enabled:s.enabled,cycleSeconds:s.cycleSeconds,
  poles:poles.length,boxes:boxes.map(b=>b.id),cars,collisions:overlapIds.length,
  overlapIds,maxStall,depth,
  states:TL?TL.poleStates(documentMap.objects,phase||'NS_GREEN'):[]
 };
}

function updateVehicle(agent,obj,cfg,dt,blockers,live,cars){
 const route=agent.route;
 if(!route?.length)return;
 if(agent.awaitingRespawn){
  attemptVehicleRespawn(agent,obj,cfg,blockers,live,cars);
  return;
 }
 if(!agent.root.visible)return;
 const current=traffic.sample(route,Math.min(agent.distance,route.length-.0001));
 const dir=current?window.VLCharacterRig?.directionFromWorld(current.dx,current.dz,'se')||'se':'se';
 if(!cfg.enabled){agent.graphic?.update(dir,camera,agent.root);return;}
 const remaining=route.length-agent.distance;
 const desired=trafficFlow.pace(agent,cars,cfg.speed,dt,vehicleLightCap(agent));
 // Cars do not attempt a modulo wrap while still physically on the road.
 // Upon reaching the last road tile, they leave the world and enter FIFO
 // re-entry. No collision check is run on a teleport across the map.
 if(remaining<=.001||desired>=remaining-.0001&&desired>0){
  recycleVehicle(agent);return;
 }
 if(desired<=.00001){stopVehicle(agent,cfg,dt,dir,true);return;}
 const destination=traffic.sample(route,agent.distance+desired);
 if(!destination||!traffic.allowed(documentMap.map,destination.x,destination.z,'vehicle')){
  stopVehicle(agent,cfg,dt,dir);return;
 }
 const probe=vehicleProbe(obj,{x:agent.root.position.x,z:agent.root.position.z});
 const valid=physics.check(probe,destination,blockers,documentMap.map,assetByName,style,live).ok;
 const busy=movingOverlap(probe,destination,destination.dx,destination.dz,obj.id);
 if(!valid||busy){stopVehicle(agent,cfg,dt,dir);return;}
 agent.distance+=desired;
 agent.root.position.set(destination.x,obj.y||0,destination.z);
 agent.lastDx=destination.dx;agent.lastDz=destination.dz;
 agent.stalledSeconds=0;
 agent.graphic?.update(window.VLCharacterRig?.directionFromWorld(destination.dx,destination.dz,'se')||'se',camera,agent.root);
}
function reconcileVehicleSpawns(cars){
 // A previously saved draft can start multiple cars on the same point.
 // Keep the foremost car and place overlapping followers into the spawn
 // queue immediately, instead of letting all of them remain motionless.
 const active=cars.filter(c=>c.route?.length&&c.root.visible&&!c.awaitingRespawn)
  .sort((a,b)=>b.distance-a.distance||a.id.localeCompare(b.id));
 const kept=[];
 for(const agent of active){
  if(!agent.spawnNeedsCheck){kept.push(agent);continue;}
  agent.spawnNeedsCheck=false;
  const overlapping=kept.some(other=>trafficFlow.sameLane(agent,other)&&
   Math.abs(other.distance-agent.distance)<
   (trafficFlow.lengthOf(agent.record)+trafficFlow.lengthOf(other.record))/2+trafficFlow.GAP);
  if(overlapping)recycleVehicle(agent);
  else kept.push(agent);
 }
}
function updateAutomated(dt){
 const blockers=documentMap.objects.filter(o=>o.collision!==false&&o.blocking!=='no'&&
  (!automaticType(o.type)||o.type==='quest_npc'));
 const live=new Map([...rigs].map(([id,rec])=>[id,rec.root.position]));
 const cars=[...automatedAgents.entries()]
  .filter(([,a])=>a.kind==='vehicle').map(([id,a])=>a);
 reconcileVehicleSpawns(cars);
 for(const [id,agent] of automatedAgents){
  const record=documentMap.objects.find(o=>o.id===id);
  if(!record)continue;
  const cfg=traffic.config(record);
  if(record.type==='quest_npc'){
   agent.graphic?.step(dt,camera,agent.root,cfg.idleAction);
   continue;
  }
  if(record.type==='vehicle'){
   updateVehicle(agent,record,cfg,dt,blockers,live,cars);
   continue;
  }
  const route=agent.route;
  if(!route||!route.length||!agent.root.visible){
   agent.graphic?.update('se',camera,agent.root);
   for(const part of agent.parts){
    part.rig.setMoving(0,0,false);
    part.rig.step(dt,camera,agent.root.position);
   }
   continue;
  }
  const isCrowd=record.type==='crowd',n=isCrowd?agent.parts.length:1;
  // Walking people are small, non-solid decorative actors. Formerly every
  // opposing walker/crowd treated the other as a blocking vehicle and
  // all characters could freeze forever at sidewalk junctions.
  // Keep solid-world collision (large buildings, benches, trees and water),
  // but allow walkers to pass each other on opposite sides of the pavement.
  for(let i=0;i<n;i++){
   const member=isCrowd?agent.parts[i]:agent.parts[0];
   const oldX=isCrowd?member.child.position.x+agent.root.position.x:agent.root.position.x;
   const oldZ=isCrowd?member.child.position.z+agent.root.position.z:agent.root.position.z;
   const previous=isCrowd?(member.distance??(agent.distance+i*route.length/n)):agent.distance;
   const target=(previous+(cfg.enabled?cfg.speed*dt:0))%route.length;
   const p=traffic.sample(route,target);
   if(!p)continue;
   const side=.14+(isCrowd?(i%3)*.035:0);
   // With right-of-travel offset, opposite-direction pedestrians naturally
   // take opposite sides rather than overlapping in the middle.
   const shifted={x:p.x-p.dz*side,z:p.z+p.dx*side};
   const probe={id:id+(isCrowd?':'+i:''),type:'pedestrian',
    motion:record.motion,x:oldX,z:oldZ,scale:1};
   const candidate=traffic.allowed(documentMap.map,shifted.x,shifted.z,'pedestrian')&&
    physics.check(probe,shifted,blockers,documentMap.map,assetByName,style,live).ok?
    shifted:{x:p.x,z:p.z};
   const clear=physics.check(probe,candidate,blockers,
    documentMap.map,assetByName,style,live).ok;
   if(!clear){
    member.rig.setMoving(0,0,false);
    member.rig.step(dt,camera,{x:oldX,z:oldZ});
    continue;
   }
   const TL=window.VLSemestaTrafficLights;
   const tlSet=trafficLightSettings();
   const tlPhase=tlSet.enabled&&TL?TL.phaseAt(trafficLightTime,tlSet.cycleSeconds):null;
   if(TL&&tlPhase){
    const held=TL.constrainPedestrian({x:oldX,z:oldZ},candidate,documentMap.map,documentMap.objects,tlPhase);
    if(held.x===oldX&&held.z===oldZ&&(candidate.x!==oldX||candidate.z!==oldZ)){
     member.rig.setMoving(0,0,false);
     member.rig.step(dt,camera,{x:oldX,z:oldZ});
     continue;
    }
   }
   if(isCrowd){
    member.distance=target;
    member.child.position.set(candidate.x-agent.root.position.x,0,
     candidate.z-agent.root.position.z);
   }else{
    agent.distance=target;
    agent.root.position.set(candidate.x,record.y||0,candidate.z);
   }
   agent.lastDx=p.dx;agent.lastDz=p.dz;
   member.rig.setMoving(p.dx,p.dz,cfg.enabled);
   member.rig.step(dt,camera,candidate);
  }
 }
}

function makeAvatar(root,item){
 if(hideLegacyCharacters&&!approvedCharacter(item.profile))return;
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
 // Larger invisible touch target. The visible pin stays small, but a thumb
 // can select it reliably without a precision tap on the tiny diamond.
 const pickMat=new THREE.MeshBasicMaterial({
  color:0xffffff,transparent:true,opacity:0,depthWrite:false,
  colorWrite:false,depthTest:false,side:THREE.DoubleSide
 });
 const hit=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,1.4,8),pickMat);
 hit.position.y=.73;hit.userData.logicMarkerPick=true;
 root.add(hit);
 root.userData.editorMarker=tag;
}
const owners=new Map(),assetRoots=new THREE.Group();scene.add(assetRoots);
const MARKER_VIEW_KEY='semesta-logic-marker-visible-v1';
let markerShown=true;
try{markerShown=localStorage.getItem(MARKER_VIEW_KEY)!=='false';}catch{}
function visibleMarkerCount(){return documentMap.objects.filter(o=>o.type==='marker').length;}
function syncMarkerButtons(){
 const count=visibleMarkerCount();
 $('markerVisibility').setAttribute('aria-pressed',String(markerShown));
 $('markerVisibilityTool').setAttribute('aria-pressed',String(markerShown));
 $('markerVisibilityTool').classList.toggle('active',markerShown);
 $('markerVisibility').textContent='⚑ Markers '+(markerShown?'ON':'OFF')+' ('+count+')';
 $('markerVisibilityTool').title='Yellow logic markers '+(markerShown?'visible':'hidden')+' · '+count+' total';
}
function setMarkerVisible(show){
 markerShown=!!show;
 for(const o of documentMap.objects)if(o.type==='marker'){
  const root=owners.get(o.id);if(root)root.visible=markerShown;
 }
 if(!markerShown&&item()?.type==='marker')select(null);
 syncMarkerButtons();
 try{localStorage.setItem(MARKER_VIEW_KEY,String(markerShown));}catch{}
 renderer.render(scene,camera);
 tell(markerShown?'⚑ Logic markers visible · tap yellow pin to select':'⚑ Logic markers hidden · City Draft unchanged');
}
function refreshMarkerManager(){
 const picker=$('markerPicker'),previous=picker.value;
 const markers=documentMap.objects.filter(o=>o.type==='marker');
 picker.replaceChildren();
 for(const marker of markers){
  const opt=document.createElement('option');
  opt.value=marker.id;opt.textContent=(marker.name||marker.markerKind||'Marker')+' · '+Math.round(marker.x)+','+Math.round(marker.z);
  picker.appendChild(opt);
 }
 if(!markers.length){
  const empty=document.createElement('option');empty.value='';empty.textContent='No logic markers';
  picker.append(empty);
 }
 const selected=item();
 const target=selected?.type==='marker'?selected.id:previous;
 if(target&&markers.some(o=>o.id===target))picker.value=target;
 if(!picker.value&&markers.length)picker.selectedIndex=0;
 $('markerFind').disabled=!markers.length;
 $('markerDelete').disabled=!markers.length;
 $('markerDeleteAll').disabled=!markers.length;
 syncMarkerButtons();
}
// A presentation-only switch: the same authored buildings, click targets,
// collision footprints, interiors and City Draft JSON remain unchanged.
const buildingGuides=new Map();
const BUILDING_VIEW_KEY='semesta-building-view-v1';
let buildingViewMode='solid';
try{if(localStorage.getItem(BUILDING_VIEW_KEY)==='outline')buildingViewMode='outline';}catch{}
function buildingGuideTarget(o){
 return !!o&&style.category(o,assetByName)==='building';
}
function removeBuildingGuide(id){
 const existing=buildingGuides.get(id);if(!existing)return;
 buildingGuides.delete(id);
 const root=owners.get(id);
 if(root){
  root.remove(existing.group);
  for(const part of existing.sources)if(part.parent===root)part.visible=true;
 }
 existing.dispose();
}
function applyBuildingGuide(root,o){
 removeBuildingGuide(o.id);
 if(buildingViewMode!=='outline'||!buildingGuideTarget(o)||!root)return;
 const painter=window.VLSemestaBuildingOutline;
 if(!painter?.build)return;
 const sources=[...root.children];
 const created=painter.build(THREE,root,o,assetByName);
 if(!created)return;
 for(const node of sources)node.visible=false;
 root.add(created.group);
 buildingGuides.set(o.id,{...created,sources});
}
function syncBuildingViewControls(){
 const outline=buildingViewMode==='outline';
 $('buildingViewMode').value=buildingViewMode;
 $('buildingOutlineTool').classList.toggle('active',outline);
 $('buildingOutlineTool').setAttribute('aria-pressed',String(outline));
 $('buildingOutlineTool').title=outline?'Building View: Outline ON — switch to Solid':'Building View: Solid — switch to Outline';
}
function setBuildingView(next){
 const requested=next==='outline'?'outline':'solid';
 if(buildingViewMode!==requested){
  buildingViewMode=requested;
  for(const o of documentMap.objects){
   if(!buildingGuideTarget(o))continue;
   const root=owners.get(o.id);
   if(root)applyBuildingGuide(root,o);
  }
 }
 syncBuildingViewControls();
 try{localStorage.setItem(BUILDING_VIEW_KEY,buildingViewMode);}catch{}
 if(highlight)highlight.update();
 renderer.render(scene,camera);
 tell(buildingViewMode==='outline'?
  '◇ Building Outline ON · garis bentuk gedung, atap, jendela, pintu & tapak':
  '■ Building Solid ON · tampilan gedung normal');
}

const bigOccluders=new Map();
const occlusionRay=new THREE.Ray(),occlusionHit=new THREE.Vector3();
function refreshBigOccluder(id){
 const entry=bigOccluders.get(id),o=documentMap.objects.find(x=>x.id===id);
 if(!entry||!o)return;
 const b=physics.bigBox(o,assetByName,style);
 entry.box.min.set(b.min.x,b.min.y,b.min.z);
 entry.box.max.set(b.max.x,b.max.y,b.max.z);
}
function registerBigOccluder(root,o){
 if(!physics?.bigStructure(o,assetByName,style))return;
 const materials=new Map();
 root.traverse(part=>{
  if(!part.isMesh||!part.material)return;
  for(const mat of (Array.isArray(part.material)?part.material:[part.material])){
   if(!materials.has(mat))materials.set(mat,{
    opacity:mat.opacity??1,transparent:!!mat.transparent,depthWrite:!!mat.depthWrite
   });
  }
 });
 if(!materials.size)return;
 bigOccluders.set(o.id,{root,box:new THREE.Box3(),materials,alpha:1});
 refreshBigOccluder(o.id);
}
function updateLargeOcclusion(dt){
 const id=cameraFollowId||(mode==='walk'?walkActorId:null)||
  (selectedId&&actorType(item()?.type)?selectedId:null);
 const actor=owners.get(id);
 if(actor){
  occlusionRay.origin.set(actor.position.x,actor.position.y+1.25,actor.position.z);
  // Orthographic camera is positioned along +direction from its ground focus.
  occlusionRay.direction.copy(direction);
 }
 for(const [oid,entry] of bigOccluders){
  const point=actor?occlusionRay.intersectBox(entry.box,occlusionHit):null;
  const blocked=!!point&&point.distanceTo(occlusionRay.origin)>.15&&
   point.distanceTo(occlusionRay.origin)<115;
  const target=blocked?0.23:1;
  if(target===1&&entry.alpha===1)continue;
  const alpha=1-Math.exp(-dt*12);
  entry.alpha+=(target-entry.alpha)*alpha;
  if(Math.abs(target-entry.alpha)<.002)entry.alpha=target;
  const isFaded=entry.alpha<.995;
  for(const [mat,original] of entry.materials){
   const transparent=isFaded||original.transparent;
   const depthWrite=isFaded?false:original.depthWrite;
   if(mat.transparent!==transparent||mat.depthWrite!==depthWrite){
    mat.transparent=transparent;mat.depthWrite=depthWrite;mat.needsUpdate=true;
   }
   mat.opacity=original.opacity*entry.alpha;
  }
 }
}
let highlight=null;
function instantiate(o){
 const root=new THREE.Group();root.name=o.name;root.userData.itemId=o.id;
 root.position.set(o.x,o.y,o.z);root.rotation.y=actorType(o.type)?0:(o.rotation||0)*Math.PI/180;
 root.scale.setScalar(actorType(o.type)?1:(o.scale||1));
 switch(o.type){
  case 'building':case 'shop':makeBuilding(root,o);break;
  case 'virtual_asset':if(o.assetCategory==='building')makeBuilding(root,o);else makePixelProp(root,o.assetCategory==='tree'?'tree':'box',o);break;
  case 'bench':makePixelProp(root,'bench',o);break;
  case 'lamp':makePixelProp(root,'lamp',o);break;
  case 'tree':makePixelProp(root,'tree',o);break;
  case 'box':makePixelProp(root,'box',o);break;
  case 'sprite':{
   makeSprite(root,o);
   const vehicleSpec=assetByName.get(o.asset);
   const riderSet=hideLegacyCharacters?null:window.VLSemestaTransportNPC?.create?.(THREE,root,vehicleSpec,o);
   if(riderSet)transportRiders.set(o.id,riderSet);
   break;
  }
  case 'avatar':case 'npc':makeAvatar(root,o);if(hideLegacyCharacters&&!approvedCharacter(o.profile))root.visible=false;break;
  case 'vehicle':case 'pedestrian':case 'crowd':case 'quest_npc':
   makeAutomated(root,o);
   if(hideLegacyCharacters&&o.type!=='vehicle'&&!approvedCharacter(o.profile))root.visible=false;
   break;
  case 'marker':makeMarker(root,o);root.visible=markerShown;break;
 }
 assetRoots.add(root);owners.set(o.id,root);
 if(o.type==='sprite'&&playPickedIds.has(String(o.id)))root.visible=mode!=='walk';
 registerBigOccluder(root,o);
 applyBuildingGuide(root,o);
 if(['virtual_asset','sprite','building','shop'].includes(o.type)){
  const path=originalPathFor(o);
  if(path)showOriginalImage(root,o,path);
 }
}
function clearAll(){
 // The normal scene disposal below also releases the guide line geometry.
 buildingGuides.clear();
 for(const agent of automatedAgents.values()){
  agent.graphic?.dispose();
  for(const part of agent.parts)part.rig.dispose();
 }
 automatedAgents.clear();
 for(const riders of transportRiders.values())riders.dispose();
 transportRiders.clear();
 bigOccluders.clear();
 for(const {rig} of rigs.values())rig.dispose();
 rigs.clear();billboardSprites.length=0;
 while(assetRoots.children.length){
  const ch=assetRoots.children[0];assetRoots.remove(ch);
  ch.traverse(o=>{if(o.geometry)o.geometry.dispose();
   if(o.userData?.assetFile?.startsWith('__vault:')&&o.material?.map)o.material.map.dispose();
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
function syncActiveAssetUI(){
 const rows=(activeAssetCamera?.list(documentMap.objects)||[]).filter(o=>
  !hideLegacyCharacters||!['avatar','npc','pedestrian','crowd','quest_npc'].includes(o.type)||approvedCharacter(o.profile));
 const picker=$('activeAssetPicker');
 const key=rows.map(o=>[o.id,o.name,o.type].join('~')).join('|');
 if(key!==activeAssetListKey){
  activeAssetListKey=key;picker.replaceChildren();
  const empty=document.createElement('option');
  empty.value='';empty.textContent='— SELECT PLACED ASSET —';picker.append(empty);
  for(const o of rows){
   const opt=document.createElement('option');opt.value=o.id;
   opt.textContent=o.name+' · '+o.type.toUpperCase();picker.append(opt);
  }
 }
 const cur=item(),has=!!cur&&owners.has(cur.id);
 picker.value=cur?.id||'';
 $('activeAssetCount').textContent=String(rows.length);
 $('activeAssetMeta').textContent=cur?cur.type.toUpperCase()+' · '+cur.name:'NO ASSET SELECTED';
 $('focusActiveAsset').disabled=!has;
 $('trackActiveAsset').disabled=!has;
 const tracking=!!cur&&activeAssetTracking&&activeAssetAimId===cur.id;
 $('trackActiveAsset').setAttribute('aria-pressed',String(tracking));
 $('trackActiveAsset').textContent=tracking?'◉ TRACKING':'◉ TRACK';
}
function cancelActiveAssetAim(){
 activeAssetAimId=null;activeAssetTracking=false;syncActiveAssetUI();
}
function focusPlacedAsset(id,track=false){
 const obj=documentMap.objects.find(o=>o.id===id);
 const target=activeAssetCamera?.target(documentMap.objects,owners,id);
 if(!obj||!target){tell('Select a placed asset first');return false;}
 if(cameraFollowId)leaveCharacterCamera(false);
 activeAssetAimId=id;activeAssetTracking=!!track;
 viewSize=activeAssetCamera.viewSize(viewSize,target);
 // Apply zoom immediately even when already centered and no easing is needed.
 fitCamera();
 syncActiveAssetUI();
 tell((track?'◉ Tracking ':'◎ Focus ')+obj.name);
 return true;
}
$('activeAssetPicker').onchange=()=>{
 const id=$('activeAssetPicker').value;
 if(id){select(id);focusPlacedAsset(id,false);}
 else{cancelActiveAssetAim();select(null);}
};
$('focusActiveAsset').onclick=()=>{if(item())focusPlacedAsset(item().id,false);};
$('trackActiveAsset').onclick=()=>{
 const obj=item();if(!obj)return;
 if(activeAssetTracking&&activeAssetAimId===obj.id)cancelActiveAssetAim();
 else focusPlacedAsset(obj.id,true);
};
let interiorPreview=null;
$('quickEnterBuilding').onclick=()=>{
 const building=item();
 if(building&&interiorPreview?.openFor)interiorPreview.openFor(building);
};
function selectionGuide(cur){
 const spec=cur?.type==='sprite'?assetByName.get(cur.asset):null;
 if(!studioSprites?.isStudio(spec))return new THREE.BoxHelper(owners.get(cur.id),0xf5df42);
 // BoxHelper on the bitmap uses PNG bounds, which include a large below-
 // pivot apron. The editable building occupies a ground footprint and only
 // the authored HEIGHT ABOVE the pivot, not a subterranean sprite quad.
 const bounds=new THREE.Box3();
 const guide=new THREE.Box3Helper(bounds,0xf5df42);
 guide.update=()=>{
  const obj=documentMap.objects.find(o=>o.id===cur.id)||cur;
  const [w,d]=style.footprint(obj,assetByName);
  const h=studioSprites.metrics(spec,obj.rotation,obj.scale).height;
  const x=Number(obj.x)||0,z=Number(obj.z)||0,y=Number(obj.y)||0;
  bounds.min.set(x-w/2,y+.02,z-d/2);
  bounds.max.set(x+w/2,y+Math.max(1,h),z+d/2);
  guide.updateMatrixWorld(true);
 };
 guide.update();
 return guide;
}
function updateSelection(){
 const cur=item();
 syncActiveAssetUI();
 $('selectedName').textContent=cur?cur.name:'Belum ada objek dipilih';
 $('selectedType').textContent=cur?cur.type.toUpperCase():'MAP DRAFT';
 $('objectId').value=cur?.id||'';
 for(const k of ['x','z','y','rotation','scale']){
  $(k).value=cur?String(round(cur[k]??0)):'';
  $(k).disabled=!cur||(actorType(cur?.type)&&['rotation','scale'].includes(k))||
   (cur?.type==='vehicle'&&k==='rotation');
 }
 $('tools').querySelectorAll('button').forEach(b=>b.disabled=!cur);
 $('replaceAsset').disabled=!cur||actorType(cur.type)||automaticType(cur.type);
 for(const id of ['rotateL','rotateR','scaleDown','scaleUp'])
   $(id).disabled=!cur||actorType(cur.type)||(cur.type==='vehicle'&&id.startsWith('rotate'));
 // Vehicle artwork is camera-facing: regular 90° object rotation cannot
 // steer it, so hide misleading tools and offer a real route-direction flip.
 const isVehicle=cur?.type==='vehicle';
 $('rotateL').hidden=isVehicle;$('rotateR').hidden=isVehicle;
 $('rotationField').hidden=isVehicle;
 const rotateLocked=cur?.type==='sprite'&&(!assetByName.get(cur.asset)?.variants||Object.keys(assetByName.get(cur.asset).variants).length<2);
 if(rotateLocked){$('rotation').disabled=true;$('rotateL').disabled=true;$('rotateR').disabled=true;}
 const actor=!!cur&&actorType(cur.type);
 $('actorControls').classList.toggle('visible',actor);
 $('facing').disabled=!actor;$('pose').disabled=!actor;
 if(actor){
   $('facing').value=cur.facing||'sw';
   $('profile').value=cur.profile||'ichsan';
   actionChoices(cur.profile,'pose',cur.pose||'');
 }
 $('profile').disabled=!actor;
 // The placed Indonesian bike/becak/andong keeps its own empty sprite.
 // Select the real Mahluk Hidup driver/passenger templates here.
 const transportSpec=cur?.type==='sprite'?assetByName.get(cur.asset):null;
 const modularTransport=!!transportSpec?.npcTransport?.modular;
 $('transportNPCControls').hidden=hideLegacyCharacters||!modularTransport;
 if(modularTransport){
  const slots=transportSpec.npcTransport.slots||[];
  const driver=slots.find(s=>s.role==='driver');
  const pax=slots.find(s=>s.role==='passenger_1');
  const available=mahluk?.list?.()||[];
  for(const [selectId,slot] of [['transportNPCDriver',driver],['transportNPCPassenger',pax]]){
   const select=$(selectId);
   const chosen=cur.npcProfiles?.[slot?.role]||slot?.profile||'';
   select.replaceChildren();
   const seen=new Set();
   const insertOption=(id,label)=>{
    if(!id||seen.has(id))return;seen.add(id);
    const option=document.createElement('option');option.value=id;
    option.textContent=label;select.append(option);
   };
   insertOption(chosen,mahluk?.get?.(chosen)?.name||chosen);
   for(const actor of available){
    if(actor.id==='human_child_base'&&!pax)continue;
    insertOption(actor.id,actor.name||actor.id);
   }
   select.value=chosen;select.disabled=!slot;
  }
  $('transportNPCEnabled').checked=cur.npcDisabled!==true;
  $('transportNPCAnimate').checked=cur.npcAnimation!==false;
  $('transportNPCPassengerRow').hidden=!pax;
  $('transportNPCPassengerToggle').hidden=!pax;
  $('transportNPCHasPassenger').checked=!!pax&&
   (cur.npcPassengers?.passenger_1??(pax.enabledByDefault===true||!pax.optional));
 }
 const vehicle=cur?.type==='vehicle';
 $('vehicleControls').hidden=!vehicle;
 if(vehicle){
  const scale=vehiclePlacement.scale(cur.scale);
  const offset=vehiclePlacement.offset(cur.visualOffset);
  $('scale').min=String(vehiclePlacement.SCALE_MIN);
  $('scale').max=String(vehiclePlacement.SCALE_MAX);
  $('vehicleVisualScale').value=String(scale);
  $('vehicleVisualScaleValue').textContent=scale.toFixed(2)+'×';
  $('vehicleOffsetX').value=String(offset.x);
  $('vehicleOffsetY').value=String(offset.y);
  $('vehicleOffsetZ').value=String(offset.z);
  $('vehicleAutoGround').checked=vehiclePlacement.autoGround(cur);
  $('vehicleOffsetY').disabled=vehiclePlacement.autoGround(cur);
  const agent=automatedAgents.get(cur.id);
  const heading=traffic.routeHeading(agent?.route,agent?.distance)||
   traffic.config(cur).direction;
  const labels={east:'EAST →',west:'WEST ←',south:'SOUTH ↓',north:'NORTH ↑'};
  $('vehicleHeadingLabel').textContent=labels[heading]||'NO ROAD DIRECTION';
  $('vehicleFlipDirection').disabled=!traffic.flipDirection(
   traffic.config(cur).direction,agent?.route,agent?.distance);
 }else{
  $('scale').min='.1';$('scale').max='1.15';
 }
 const dynamic=cur&&automaticType(cur.type);
 $('motionControls').hidden=!dynamic;
 if(dynamic){
  const cfg=traffic.config(cur);
  $('motionMode').value=cfg.mode;
  $('motionMode').disabled=true;
  $('motionSpeed').value=cfg.speed;
  $('motionSpeed').disabled=cur.type==='quest_npc';
  $('motionDirection').value=cfg.direction;
  $('motionDirection').disabled=cur.type==='quest_npc';
  $('crowdCount').value=cfg.count;
  $('crowdCount').closest('label').hidden=cur.type!=='crowd';
  if(cur.type==='quest_npc'){
   const charProfile=mahluk?.has(cur.profile)?cur.profile:mahluk?.questProfile(cur.questId);
   actionChoices(charProfile,'questAction',cfg.idleAction);
  }else $('questAction').value=cfg.idleAction;
  $('questAction').closest('label').hidden=cur.type!=='quest_npc';
  $('jobRoleLabel').hidden=cur.type!=='quest_npc';
  $('jobRole').value=cur.jobId||'community_job';
  $('motionEnabled').checked=cfg.enabled;
  $('motionHint').textContent=cur.type==='vehicle'?
   'Mobil dan motor hanya di jalan · otomatis loop.':
   cur.type==='quest_npc'?'NPC quest idle/aksi di tempat.':
   'NPC mengikuti trotoar lurus lalu mengulang rute.';
 }
 const editableBuilding=cur?.type==='building'||cur?.type==='shop';
 $('buildingControls').hidden=!editableBuilding;
 for(const [key,field] of [['buildingW','w'],['buildingD','d'],['buildingH','h']]){
  $(key).value=editableBuilding?cur[field]||'':'';
  $(key).disabled=!editableBuilding;
 }
 updateLogicUI();
 interiorPreview?.update(cur,cur?.type==='sprite'?assetByName.get(cur.asset):null);
 const enterAvailable=!!cur&&cur.enterable===true&&
  (cur?.interior?.floors?.length||(cur.type==='sprite'&&assetByName.get(cur.asset)?.interior?.floors?.length));
 $('quickEnterBuilding').hidden=!enterAvailable;
 const canEditInterior=!!cur&&window.VLSemestaCityBuildings?.isBuilding(cur,assetCatalog)===true;
 $('editInBangunRuang').hidden=!canEditInterior;
 $('editInBangunRuang').disabled=!canEditInterior;
 $('quickEditBuilding').hidden=!canEditInterior;
 $('quickEditBuilding').disabled=!canEditInterior;
 if(highlight&&highlight.userData.selected===cur?.id){
   highlight.update();
 }else{
   if(highlight){scene.remove(highlight);highlight.geometry.dispose();highlight.material.dispose();highlight=null;}
   if(cur&&owners.has(cur.id)){
     highlight=selectionGuide(cur);
     highlight.userData.selected=cur.id;
     highlight.material.depthTest=false;highlight.material.transparent=true;
     highlight.renderOrder=100;scene.add(highlight);
   }
 }
}
function select(id,options={}){
 selectedId=id;
 if(!id&&activeAssetAimId)cancelActiveAssetAim();
 if(id&&activeAssetTracking&&activeAssetAimId!==id){
  activeAssetAimId=null;activeAssetTracking=false;
 }
 updateSelection();
 if(id&&options.focus)focusPlacedAsset(id,false);
 if(id)tell(owners.get(id)?.userData?.pendingPipelineImage?'Preview sementara: PNG sumber belum dipublikasikan.':'Selected: '+item()?.name+'. Pilih Move lalu drag.');
 renderer.render(scene,camera);
}
// Contextual Semesta -> Bangun Ruang editor: a city instance is identified by
// its stable City Draft ID and object ID. Unsaved working cities receive an ID
// before navigation so edits never target the wrong building.
async function editSelectedBuildingInterior(){
 const target=item();
 if(!target||!window.VLSemestaCityBuildings?.isBuilding(target,assetCatalog))return;
 const targetId=target.id;
 try{
  if(!activeDraftId||draftDirty){
   $('draftName').value=documentMap.map?.name||'Semesta City';
   await saveNamedCity(false);
  }
  if(!activeDraftId)throw Error('Save City first');
  if(!documentMap.objects.some(o=>o.id===targetId))throw Error('Building selection changed');
  // Finish the existing conflict-aware cloud reconciliation before leaving
  // this app, when the Google login is active in the current tab.
  if(window.MembangunCloudDrive?.connected()&&window.MembangunCloudUI?.syncOnConnect)
   await window.MembangunCloudUI.syncOnConnect();
  const params=new URLSearchParams({cityId:activeDraftId,objectId:targetId,editor:'interior'});
  window.location.assign('./bangun-ruang/?'+params.toString());
 }catch(error){tell('⚠ Cannot open Bangun Ruang: '+error.message);}
}
$('editInBangunRuang').onclick=editSelectedBuildingInterior;
$('quickEditBuilding').onclick=editSelectedBuildingInterior;
function edit(fn,validatePosition=true){
 if(!item())return;
 const before=clone(item());undoPoint();fn(item());
 style.normalize(item(),assetByName);schema.normalize(item(),assetByName,style);
 const blocked=validatePosition?style.reason(item(),documentMap.objects,documentMap.map,assetByName):'';
 if(blocked){Object.assign(item(),before);undoStack.pop();updateSelection();tell(blocked);return;}
 applyItem();saved();
}
// Changing the sprite art must not reset traffic to its authored spawn.
// The adjustment can be made while the selected vehicle is in motion.
function editVehicleVisual(fn){
 const o=item();
 if(o?.type!=='vehicle')return;
 undoPoint();fn(o);
 vehiclePlacement.normalize(o);
 const root=owners.get(o.id);
 if(root){
  root.scale.setScalar(o.scale);
  const agent=automatedAgents.get(o.id);
  if(agent?.visual)vehiclePlacement.apply(agent.visual,o);
 }
 updateSelection();
 renderer.render(scene,camera);
 saved();
}
function applyItem(){
 const o=item();if(!o)return;
 const r=owners.get(o.id);if(!r)return;
 r.position.set(o.x,o.y,o.z);
 r.rotation.y=actorType(o.type)?0:o.rotation*Math.PI/180;
 r.scale.setScalar(actorType(o.type)?1:o.scale);
 if(r.userData.warteg3DVariants){
  const display=spriteDirection(o.rotation);
  for(const [dir,group] of r.userData.warteg3DVariants)group.visible=dir===display;
 }
 if(o.type==='vehicle'){
  const agent=automatedAgents.get(o.id);
  if(agent?.visual)vehiclePlacement.apply(agent.visual,o);
 }
 refreshBigOccluder(o.id);
 if(automaticType(o.type)){
  const agent=automatedAgents.get(o.id);
  if(agent)resetAutoRoute(agent,o);
 }
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
 if(hideLegacyCharacters&&(
  type==='avatar'||type==='npc'||type.startsWith('character:')||
  type.startsWith('pedestrian:')||type.startsWith('crowd:')||
  type.startsWith('quest:')||type.startsWith('quest-character:')
 )&&!/^character:mh2_[a-z0-9]+$/.test(type)&&
   !/^pedestrian:mh2_[a-z0-9]+$/.test(type)&&
   !/^quest-character:mh2_[a-z0-9]+$/.test(type))return null;
 const customActor=type.startsWith('character:')?type.slice(10):null;
 const customQuest=type.startsWith('quest-character:')?type.slice(16):null;
 const isVault=type.startsWith('vault:');
 const preset=style.presets[type],chosen=preset?'sprite:'+preset:type;
 const automatic=type.startsWith('vehicle:')?'vehicle':
  type.startsWith('pedestrian:')?'pedestrian':type.startsWith('crowd:')?'crowd':
  (type.startsWith('quest:')||customQuest)?'quest_npc':null;
 const isCustom=type.startsWith('building:'),sizeClass=type.split(':')[1];
 const isMarker=type.startsWith('marker:'),isSprite=chosen.startsWith('sprite:'),asset=isSprite?chosen.slice(7):undefined;
 const spec=assetByName.get(asset),dims=BUILD_SIZES[sizeClass]||BUILD_SIZES.small;
 const obj={id:id(isVault?'virtual_asset':automatic|| (customActor?'npc':isCustom?'building':isMarker?'marker':isSprite?'sprite':type)),
  type:isVault?'virtual_asset':automatic|| (customActor?'npc':isCustom?'building':isMarker?'marker':isSprite?'sprite':type),
  name:isCustom?sizeClass.toUpperCase()+' Building · replaceable':isSprite?(spec?.label||type):actorType(type)?'Virtual Life Character':type,
  x:round(point?.x??cameraFocus.x),z:round(point?.z??cameraFocus.z),y:0,rotation:0,scale:1};
 if(isVault){
  let path='';
  try{path=decodeURIComponent(type.slice(6));}catch{return null;}
  if(!window.VLAssetVault?.allowed(path))return null;
  const meta=pendingVaultImageSize,category=pendingVaultCategory;
  obj.assetPath=path;obj.assetCategory=category;
  obj.name=path.split('/').pop()||'Original Asset';
  obj.replaceable=true;obj.collision=true;
  obj.w=category==='building'?Math.max(2,Math.min(14,Math.ceil((meta?.width||200)/55))):category==='tree'?1.4:1.3;
  obj.d=category==='building'?Math.max(2,Math.min(11,Math.ceil(obj.w*.7))):category==='tree'?1.4:1.3;
  obj.h=Math.max(2,Math.min(23,(meta?.height||170)*PIXEL_WORLD*VERTICAL_COMP));
  obj.layer=category==='building'?'structure':category==='tree'?'vegetation':'prop';
  obj.tags=['virtual-life','original-asset-reference'];
  obj.notes='Original game image reference. Unlock Virtual Life vault to display.';
 }
 if(isCustom){Object.assign(obj,dims);obj.sizeClass=sizeClass;obj.replaceable=true;obj.collision=true;obj.layer='structure';obj.subtype='custom_building';obj.tags=['placeholder','building'];}
 if(isSprite){if(!spec)return null;obj.asset=asset;obj.width=spec.width;obj.height=spec.height;obj.collision=spec.collision!==false;
  if(spec.source==='bangun-object'){
   obj.layer=spec.layer||'prop';obj.subtype=spec.objectCategory||'decor';
   obj.tags=['bangun-ruang','pixel-object',spec.objectCategory||'decor'];
   obj.interactions=Array.isArray(spec.interactions)?[...spec.interactions]:[];
   obj.blocking=spec.blocking||'auto';
  }
  if(spec.source==='custom-building'){
   obj.rotation=spec.entranceFacing==='se'?90:0;
   obj.layer='structure';obj.subtype=spec.id;obj.tags=['bangun-ruang','building'];
   obj.interactions=spec.interactions||['enter'];obj.entranceFacing=spec.entranceFacing||'';
   obj.blocking=spec.blocking||'auto';
   obj.interactive=spec.interactive===true;obj.enterable=spec.enterable===true;
   obj.interior=spec.interior?clone(spec.interior):null;
   obj.entrance=spec.entrance?clone(spec.entrance):null;
   obj.actionSlots=spec.actionSlots?clone(spec.actionSlots):[];
  }
 }
 if(actorType(type)||customActor){
  if(customActor&&!mahluk?.has(customActor))return null;
  obj.type=customActor?'npc':type;obj.facing='sw';obj.pose=null;
  obj.variant='pipeline-v6b';obj.profile=customActor|| (type==='npc'?'noor':'ichsan');
  obj.name=customActor?mahluk.get(customActor).name:obj.name;
  obj.collision=true;obj.layer='character';
}
 if(automatic){
  const variation=customQuest||type.slice(type.indexOf(':')+1);
  if(customQuest&&!mahluk?.has(customQuest))return null;
  obj.facing='sw';
  obj.vehicleId=automatic==='vehicle'?variation:undefined;
  obj.questId=automatic==='quest_npc'?(customQuest?'custom':variation):undefined;
  obj.profile=['pedestrian','crowd'].includes(automatic)?variation:
   automatic==='quest_npc'?(customQuest||mahluk?.questProfile(variation)||'ichsan'):'ichsan';
  if(automatic==='crowd')obj.profile='ichsan';
  obj.name=automatic==='vehicle'?trafficCatalog?.vehicle(variation)?.label||variation:
   automatic==='quest_npc'?mahluk?.get(obj.profile)?.name||
     trafficCatalog?.quest(variation)?.label||variation:
   automatic==='crowd'?'Crowd · 5 pedestrians':'Pedestrian · '+variation;
  obj.motion={mode:automatic==='vehicle'?'road':automatic==='quest_npc'?'idle':'sidewalk',
   speed:automatic==='vehicle'?(variation.includes('bus')?2.7:4):1.5,
   direction:'auto',count:automatic==='crowd'?Math.max(2,Math.min(12,Number(variation)||5)):5,enabled:true,
   idleAction:automatic==='quest_npc'?
    (mahluk?.available(obj.profile,trafficCatalog?.quest(variation)?.defaultAction||'idle')?
      trafficCatalog.quest(variation).defaultAction:
      (mahluk?.available(obj.profile,'idle')?'idle':
       mahluk?.motions(obj.profile)?.[0]?.id||'idle')):'idle'};
  obj.layer=automatic==='vehicle'?'prop':'character';
  obj.collision=automatic==='quest_npc';
  obj.blocking=automatic==='quest_npc'?'auto':'no';
  obj.tags=['semesta','loop-preview',automatic];
  if(automatic==='quest_npc'){
   obj.tags.push('job_provider');
   obj.interactions=['talk','accept_job'];
   obj.jobId={
    manusia_silver:'street_performer',
    pak_ogah:'traffic_assistant',
    kang_parkir:'parking_attendant',
    babeh_pemilik:'flea_market_trade',
    babeh_jam:'watch_vendor',
    babeh_tas:'secondhand_bag_vendor'
   }[variation]||'community_job';
  }
  obj.notes=automatic==='quest_npc'?
   'Stationary Mahluk Hidup NPC with authored actions. Preview only; no live quest payout.':
   'Auto-loop on painted '+obj.motion.mode+' cells. Non-production preview.';
 }
 if(isMarker){obj.markerKind=type.split(':')[1]||'interaction';obj.name=obj.markerKind+' marker';obj.collision=false;}
 if(type==='tree')obj.collision=true;
 if((type==='building'||type==='shop')&&!isSprite)return null;
 style.normalize(obj,assetByName);schema.normalize(obj,assetByName,style);
 return obj;
}
function snapAutomaticToSurface(o,point){
 if(!automaticType(o.type)||!point)return false;
 if(o.type==='quest_npc'){
  // A stationary NPC is an exact placement, not a sidewalk route agent.
  o.x=Math.floor(point.x)+.5;o.z=Math.floor(point.z)+.5;
  return true;
 }
 const mode=o.type==='vehicle'?'vehicle':'pedestrian';
 const spot=traffic.spawnPosition(documentMap.map,point.x,point.z,mode,5);
 if(!spot)return false;
 o.x=spot.x;o.z=spot.z;
 return true;
}
function add(type,point=null){
 const obj=makeObject(type,point);
 if(!obj){tell('Asset/prefab belum tersedia');return false;}
 if(point){
  if(automaticType(obj.type)){
   if(!snapAutomaticToSurface(obj,point)){
    tell(obj.type==='vehicle'?'Tidak ada jalan dekat posisi itu.':'Tidak ada trotoar dekat posisi itu.');
    return false;
   }
  }else{
   const [fw,fd]=style.footprint(obj,assetByName);
   obj.x=Math.floor(point.x-fw/2)+fw/2;
   obj.z=Math.floor(point.z-fd/2)+fd/2;
  }
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
 // Mobile-first screen-space selection for the small yellow logic pins.
 // Markers get a 24 px hit radius independent of camera zoom and mesh size.
 if(markerShown&&mode!=='paint'&&mode!=='fill'){
  const rect=canvas.getBoundingClientRect(),isTouch=e.pointerType!=='mouse';
  const radius=isTouch?27:20;
  let closest=null,nearest=radius*radius;
  for(const o of documentMap.objects){
   if(o.type!=='marker'||owners.get(o.id)?.visible===false)continue;
   const pos=new THREE.Vector3(o.x,(o.y||0)+.55,o.z).project(camera);
   const sx=rect.left+(pos.x+1)*rect.width/2;
   const sy=rect.top+(1-pos.y)*rect.height/2;
   const distance=(e.clientX-sx)**2+(e.clientY-sy)**2;
   if(distance<nearest){closest=o.id;nearest=distance;}
  }
  if(closest)return closest;
 }
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
 if(automaticType(test.type)){
  if(!snapAutomaticToSurface(test,point)){placementPreview.visible=false;return;}
 }else{
  test.x=Math.floor(point.x-fw/2)+fw/2;test.z=Math.floor(point.z-fd/2)+fd/2;
 }
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
 e.preventDefault();
 // A remote Fold touchpad dispatches synthetic PointerEvents into this canvas.
 // Chromium rejects setPointerCapture for synthetic pointer IDs, so preserve
 // the pan gesture instead of aborting the handler on NotFoundError.
 try{canvas.setPointerCapture(e.pointerId)}catch{}
 pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size===2){
  const pts=[...pointers.values()],mid={x:(pts[0].x+pts[1].x)/2,y:(pts[0].y+pts[1].y)/2};
  pinch={dist:Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y),mid,view:viewSize,focus:cameraFocus.clone(),ground:floorPoint({clientX:mid.x,clientY:mid.y})};
  if(drag?.kind==='paint'&&drag.changed)saved();
  for(const holder of rigs.values())holder.rig.setMoving(0,0,false);
  drag=null;placementPreview.visible=false;return;
 }
 const point=floorPoint(e);
 // Explicit Pan mode must never select or move a clicked object.
 // Unlike Select, dragging over vehicles, buildings or NPCs always pans.
 if(mode==='pan'){
  if(activeAssetAimId)cancelActiveAssetAim();
  drag={kind:'pan',id:e.pointerId,start:point?.clone()||null,
   focus:cameraFocus.clone(),sx:e.clientX,sy:e.clientY,hit:false,changed:false};
  return;
 }
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
 if(hit&&mode!=='walk')select(hit,{focus:mode==='select'});
 if(hit&&mode==='walk'){
   const touched=documentMap.objects.find(x=>x.id===hit);
   if(touched&&actorType(touched.type)){
    walkActorId=hit;select(hit);
    if(cameraFollowId){cameraFollowId=hit;updateCharacterCameraUI();}
   }
 }else if(mode==='walk'&&playControllerOnly()){
  // controllerOnly: no tap-to-move player. Ground presses only pan the camera.
 }
 const p=floorPoint(e);
 if(mode==='move'&&hit&&p){
  undoPoint();const o=item();
  // For an already-driving car, anchor Move to its LIVE road position,
  // not its older authored spawn (otherwise the first drag jumps backward).
  const liveCar=o.type==='vehicle'?owners.get(o.id):null;
  drag={kind:'move',id:e.pointerId,start:p.clone(),
   x:liveCar?.position.x??o.x,z:liveCar?.position.z??o.z,
   rollbackX:o.x,rollbackZ:o.z,changed:false,actor:actorType(o.type)};
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
  // Reject a move before rendering it, rather than letting a building,
  // player or prop pass through another solid object while dragging.
  const blocked=style.reason(o,documentMap.objects,documentMap.map,assetByName);
  if(blocked){
   o.x=oldX;o.z=oldZ;
   if(drag.actor)rigs.get(o.id)?.rig.setMoving(0,0,false);
   return;
  }
  const moved=o.x!==oldX||o.z!==oldZ;
  if(drag.actor&&moved){
    o.facing=window.VLCharacterRig?.directionFromWorld(o.x-oldX,o.z-oldZ,o.facing||'sw')||o.facing;
    o.pose=null;
  }
  drag.changed=drag.changed||moved;
  if(moved)applyItem();
  if(drag.actor)rigs.get(o.id)?.rig.setMoving(o.x-oldX,o.z-oldZ,moved);
 }else if(drag.kind==='pan'&&!drag.hit){
  // Deliberate one-finger pan exits Follow, leaving the camera at its current location.
  if(cameraFollowId&&Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>5)
   leaveCharacterCamera(false);
  if(activeAssetAimId&&Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)>5)
   cancelActiveAssetAim();
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
   if(blocked){o.x=drag.rollbackX;o.z=drag.rollbackZ;applyItem();undoStack.pop();tell(blocked);}
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
// Walking near a Warteg doorway (rather than crossing solid wall collision)
 // opens the editor's authored interior preview; no multiplayer teleport.
 function enterNearbyBuilding(){
  const root=owners.get(walkActorId);
  if(!root||!interiorPreview)return false;
  const candidates=documentMap.objects.filter(o=>
   o.enterable===true&&
   (o.interior?.floors?.length||(o.type==='sprite'&&assetByName.get(o.asset)?.interior?.floors?.length)));
  const sorted=candidates.map(o=>{
   const spec=assetByName.get(o.asset);
   const door=window.VLWarteg3D?.supported(spec)?
    window.VLWarteg3D.doorPosition(o):{x:o.x,z:o.z};
   return {o,distance:Math.hypot(root.position.x-door.x,root.position.z-door.z)};
  }).sort((a,b)=>a.distance-b.distance);
  const nearest=sorted[0];
  if(!nearest||nearest.distance>2.1){
   tell('Dekati pintu bangunan, lalu tekan E untuk masuk.');return false;
  }
  for(const k of Object.keys(walkInput))walkInput[k]=false;
  rigs.get(walkActorId)?.rig.setMoving(0,0,false);
  interiorPreview.openFor(nearest.o);
  return true;
 }
 // Walk Test previews canonical movement and 3D occlusion without mutating
// the authored map or touching multiplayer / player data.
const walkInput={up:false,down:false,left:false,right:false};
let walkActorId=null;
const PLAY_SPEED_SCALE=4.1/1.4; // default walk 1.4 matches the previous 4.1 world units
let walkRunning=false;
let playHud=null;
function currentPlayGameplay(){
 const JG=window.JiwaGameplay;
 let raw=null;
 try{
  const key=(window.VLHub&&window.VLHub.GAMEPLAY_KEY)||'virtual-life-gameplay-v1';
  raw=JSON.parse(localStorage.getItem(key)||'null');
 }catch{raw=null;}
 return JG?JG.normalizeGameplay(raw):raw;
}
function playWorldSpeed(){
 const g=currentPlayGameplay()||{};
 const move=g.modules&&g.modules.movement;
 if(move&&move.enabled===false)return 0;
 const JG=window.JiwaGameplay;
 const life=window.SemestaLifePlay;
 const factor=life&&life.active()?life.speedFactor():1;
 const energy=life&&life.active()?life.state()?.energy:80;
 const base=JG?JG.walkSpeedAt(g,walkRunning,energy):(walkRunning?2.2:1.4);
 return Number(base||0)*PLAY_SPEED_SCALE*factor;
}
function playControllerOnly(){
 const g=currentPlayGameplay();
 const move=g&&g.modules&&g.modules.movement;
 return !move||move.controllerOnly!==false;
}

function walkWorldPos(){
 const rec=rigs.get(walkActorId);
 if(rec&&rec.root&&rec.root.position)return rec.root.position;
 const o=documentMap.objects.find(x=>x.id===walkActorId);
 return o||{x:0,z:0};
}
/* Play-session pickup hide: sprites vanish in Walk Test / Play only.
 * The city draft is not mutated — object records stay in documentMap, no
 * _pickedPreview flag is written, and Save City / Drive persist a sanitized
 * copy with those preview flags stripped. Visibility is tracked in
 * sessionStorage (semesta-play-picked-ids-v1), not in the saved city.
 * Leaving Walk Test shows the objects again in the editor; re-entering Play
 * hides the already-picked instances for this browser tab session. */
const PLAY_PICK_KEY='semesta-play-picked-ids-v1';
const playPickedIds=new Set();
try{(JSON.parse(sessionStorage.getItem(PLAY_PICK_KEY)||'[]')||[]).forEach(id=>playPickedIds.add(String(id)));}catch{}
function persistPlayPicked(){
 try{sessionStorage.setItem(PLAY_PICK_KEY,JSON.stringify([...playPickedIds]));}catch{}
}
function hideObjectForPlay(o){
 if(!o||!o.id)return false;
 playPickedIds.add(String(o.id));
 persistPlayPicked();
 applyPlayPickupVisibility();
 return true;
}
function applyPlayPickupVisibility(){
 for(const o of documentMap.objects){
  if(o.type!=='sprite'||!playPickedIds.has(String(o.id)))continue;
  const root=owners.get(o.id);
  if(root)root.visible=mode!=='walk';
 }
}
function mapForPersist(){
 const copy=JSON.parse(JSON.stringify(documentMap));
 if(Array.isArray(copy.objects)){
  copy.objects=copy.objects.filter(o=>o.id!=='__semesta_life_temporary_player__');
  for(const o of copy.objects){delete o._pickedPreview;delete o._playHidden;}
 }
 return copy;
}
function previewPickupById(id){
 const o=documentMap.objects.find(x=>x.id===id);
 if(!o)return {ok:false,reason:'missing'};
 const spec=assetByName.get(o.asset)||{};
 const res=window.VLLoakPlay?window.VLLoakPlay.pickup(spec.legacyId||spec.id||o.asset):{ok:false,reason:'no loak'};
 if(res&&res.ok){hideObjectForPlay(o);syncPlayHud();}
 const root=owners.get(o.id);
 return {ok:!!(res&&res.ok),hidden:mode==='walk'&&!!(root&&root.visible===false),
  stillInDraft:documentMap.objects.some(x=>x.id===o.id),id:o.id};
}
function tryLoakPickup(){
 if(!window.VLLoakPlay||mode!=='walk')return false;
 const here=walkWorldPos();
 let best=null,bestD=1.85;
 for(const o of documentMap.objects){
  if(o.type!=='sprite'||playPickedIds.has(String(o.id)))continue;
  const spec=assetByName.get(o.asset);
  if(!spec||spec.jiwaAction!=='pickup')continue;
  const d=Math.hypot((o.x||0)-here.x,(o.z||0)-here.z);
  if(d<bestD){best=o;bestD=d;}
 }
 if(!best)return false;
 const spec=assetByName.get(best.asset);
 const res=window.VLLoakPlay.pickup(spec.legacyId||spec.id||best.asset);
 if(res.ok){
  hideObjectForPlay(best);
  tell('Ambil: '+(spec.label||res.name)+' · tas '+res.slots);
  syncPlayHud();
 }else tell(res.reason||'Tidak bisa mengambil');
 return true;
}
function tryLoakSellNearby(){
 if(!window.VLLoakPlay||!window.VLLoakPlay.loakOn()||mode!=='walk')return false;
 if(!window.VLLoakPlay.inventory().length)return false;
 const here=walkWorldPos();
 let nearSell=false;
 for(const o of documentMap.objects){
  const spec=assetByName.get(o.asset||'');
  const sellish=spec&&(spec.jiwaAction==='search'||spec.category==='spots'||/loak|babeh/i.test(spec.label||''));
  if(!sellish)continue;
  if(Math.hypot((o.x||0)-here.x,(o.z||0)-here.z)<2.2){nearSell=true;break;}
 }
 if(!nearSell)return false;
 const first=window.VLLoakPlay.inventory()[0];
 const sold=window.VLLoakPlay.sell(first.typeId, first.qty);
 if(sold.ok){
  tell('Jual ke Babeh: '+sold.name+' ×'+sold.qty+' · +Rp '+sold.amount);
  syncPlayHud();
 }else tell(sold.reason||'Belum bisa jual');
 return true;
}

function ensurePlayHud(){
 if(playHud||!window.VLPlayHud)return playHud;
 const wrap=$('canvas-wrap');
 if(!wrap)return null;
 playHud=window.VLPlayHud.mount(wrap,{
  mode:'overlay',withWalkPad:true,getGameplay:currentPlayGameplay,
  onAction:()=>{if(window.SemestaLifePlay?.handleAction?.())return;if(tryLoakPickup()||tryLoakSellNearby())return;if(!enterNearbyBuilding())tell('ACTION · no nearby context');},
  onActionDown:ev=>window.SemestaLifePlay?.actionDown?.(ev),
  onActionUp:ev=>window.SemestaLifePlay?.actionUp?.(ev),
  onPhone:()=>window.SemestaLifePlay?.openPhone?.()||false,
  onBag:()=>window.SemestaLifePlay?.openBag?.()||false,
  onRunChange:on=>{walkRunning=!!on;},
  toast:tell,
  getInventory:()=>window.SemestaLifePlay?.active?.()?window.SemestaLifePlay.bag():window.VLLoakPlay?window.VLLoakPlay.bagLabels():[],
  getMoney:()=>window.SemestaLifePlay?.active?.()?window.SemestaLifePlay.money():window.VLLoakPlay?window.VLLoakPlay.money():0
 });
 return playHud;
}
function syncPlayHud(){
 const hud=ensurePlayHud();
 if(!hud)return;
 const g=currentPlayGameplay();
 hud.apply(g);
 hud.setVisible(mode==='walk');
}

const LIFE_TEST_ACTOR_ID='__semesta_life_temporary_player__';
function makeTemporaryLifePlayer(){
 const existing=documentMap.objects.find(o=>o.id===LIFE_TEST_ACTOR_ID);
 if(existing)return existing;
 const p={x:0,z:0};
 const pool=window.VLSpawnRespawn?.validPool?.(spawnModule(),spawnWorldAdapter())||[];
 if(pool.length){p.x=pool[0].x;p.z=pool[0].z;}
 else{
  const first=documentMap.objects.find(o=>Number.isFinite(Number(o.x))&&Number.isFinite(Number(o.z)));
  p.x=Number(first?.x)||0;p.z=Number(first?.z)||0;
 }
 const player={id:LIFE_TEST_ACTOR_ID,type:'avatar',name:'PLAY TEST / PLAYER PLACEHOLDER',
  x:p.x,z:p.z,y:0,collision:true,scale:1,facing:'se',profile:'placeholder'};
 const root=new THREE.Group();root.name=player.name;root.position.set(p.x,0,p.z);
 const mat=new THREE.MeshBasicMaterial({color:0x4e8ac6});
 const body=new THREE.Mesh(new THREE.CylinderGeometry(.3,.38,1.05,8),mat);body.position.y=.73;root.add(body);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.29,10,8),new THREE.MeshBasicMaterial({color:0xe5c29a}));head.position.y=1.53;root.add(head);
 const rig={mesh:root,state:{loaded:true,failed:false},setMoving(){},setPose(){},setDirection(){},
  setProfile(){},step(){},dispose(){}};
 documentMap.objects.push(player);assetRoots.add(root);owners.set(player.id,root);rigs.set(player.id,{rig,root});
 tell('Placeholder player aktif untuk Play Mode (tidak masuk City Draft).');
 return player;
}
function clearTemporaryLifePlayer(){
 if(!documentMap.objects.some(o=>o.id===LIFE_TEST_ACTOR_ID))return;
 const rec=rigs.get(LIFE_TEST_ACTOR_ID);
 if(rec){
  rec.root.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});
  rec.root.removeFromParent();rigs.delete(LIFE_TEST_ACTOR_ID);
 }
 owners.delete(LIFE_TEST_ACTOR_ID);
 documentMap.objects=documentMap.objects.filter(o=>o.id!==LIFE_TEST_ACTOR_ID);
 if(selectedId===LIFE_TEST_ACTOR_ID)selectedId=null;
 if(cameraFollowId===LIFE_TEST_ACTOR_ID){cameraFollowId=null;mapCameraBeforeFollow=null;updateCharacterCameraUI();}
 walkActorId=null;
}
function clearWalk(){
 try{window.VLSpawnHobo&&window.VLSpawnHobo.dispose();}catch{}
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
 clearTemporaryLifePlayer();
}
function setMode(m){
 if(mode==='walk'&&m!=='walk'){window.SemestaLifePlay?.stop?.();clearWalk();}
 if(m==='pan'&&activeAssetAimId)cancelActiveAssetAim();
 mode=m;
 applyPlayPickupVisibility();
 for(const type of ['select','move','pan','walk','paint','fill']){
  const button=$(type+'Mode');
  button?.classList.toggle('active',m===type);
  if(button)button.setAttribute('aria-pressed',String(m===type));
 }
 canvas.classList.toggle('pan-tool-active',m==='pan');
 if(m!=='place')placementType=null;
 if(placementPreview)placementPreview.visible=m==='place';
 $('walkPad').classList.toggle('active',m==='walk');
 if(m==='walk'){
   const first=(item()&&actorType(item().type)&&rigs.has(item().id)&&owners.get(item().id)?.visible!==false?item():
    documentMap.objects.find(x=>actorType(x.type)&&rigs.has(x.id)&&owners.get(x.id)?.visible!==false))||makeTemporaryLifePlayer();
   walkActorId=first.id;select(first.id);
   window.SemestaLifePlay?.start?.();
   rigs.get(walkActorId)?.rig.setPose(null);
   tell('Walk Test: WASD / arrow keys / touch D-pad. Edits are not saved.');
   try{beginSpawnRespawn(first,'playStart');}catch(err){console.warn('spawn/respawn preview',err);}
 }
 syncPlayHud();
 applyDevicePreview();
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
 if(activeAssetAimId)cancelActiveAssetAim();
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
 if(activeAssetAimId)cancelActiveAssetAim();
 if(cameraFollowId)leaveCharacterCamera(true);
 else resetCamera();
}
$('cameraToCharacter').onclick=enterCharacterCamera;
$('focusSelectedCharacter').onclick=enterCharacterCamera;
$('cameraCharacter').onclick=enterCharacterCamera;
$('cameraMapView').onclick=cameraMapView;
updateCharacterCameraUI();
$('selectMode').onclick=()=>setMode('select');
$('moveMode').onclick=()=>setMode('move');
$('panMode').onclick=()=>{
 setMode('pan');
 tell('✋ Pan · drag dari mana saja di map untuk menggeser kamera. Objek tidak ikut berpindah.');
};
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
$('markerVisibility').onclick=()=>setMarkerVisible(!markerShown);
$('markerVisibilityTool').onclick=()=>setMarkerVisible(!markerShown);
$('markerPicker').onchange=()=>{const id=$('markerPicker').value;if(id)select(id);};
$('markerFind').onclick=()=>{
 const id=$('markerPicker').value;
 const marker=documentMap.objects.find(o=>o.id===id&&o.type==='marker');
 if(!marker){tell('No logic marker selected');return;}
 if(!markerShown)setMarkerVisible(true);
 cameraFocus.x=marker.x;cameraFocus.z=marker.z;fitCamera();
 select(marker.id);closeMobileSheets();
 tell('⚑ Marker selected: '+marker.name+' · use Delete in Properties or LOGIC tab');
};
$('markerDelete').onclick=()=>{
 const id=$('markerPicker').value;
 if(!documentMap.objects.some(o=>o.type==='marker'&&o.id===id))return;
 select(id);remove();
 tell('⚑ Yellow logic marker removed (Undo available)');
};
$('markerDeleteAll').onclick=()=>{
 const count=visibleMarkerCount();if(!count)return;
 if(!confirm('Remove '+count+' yellow LOGIC MARKERS from this City Draft? Buildings and collision stay unchanged. Undo is available.'))return;
 undoPoint();
 documentMap.objects=documentMap.objects.filter(o=>o.type!=='marker');
 selectedId=null;rebuild();saved();
 tell(count+' yellow logic markers removed · Undo available');
};
syncMarkerButtons();
$('buildingViewMode').onchange=()=>setBuildingView($('buildingViewMode').value);
$('buildingOutlineTool').onclick=()=>setBuildingView(buildingViewMode==='solid'?'outline':'solid');
syncBuildingViewControls();
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
window.addEventListener('keydown',e=>{if(e.key==='Shift')walkRunning=true;},true);
window.addEventListener('keyup',e=>{if(e.key==='Shift')walkRunning=false;},true);
window.addEventListener('blur',()=>{walkRunning=false;for(const k of Object.keys(walkInput))walkInput[k]=false;});
if(window.VLHub)window.VLHub.subscribe('gameplay',()=>syncPlayHud());

const DEVICE_KEY='semesta-play-device-v1';
const DEVICE_PRESETS={
 phone:{w:390,h:844,label:'Phone'},
 landscape:{w:844,h:390,label:'Landscape'},
 fold:{w:717,h:746,label:'Fold'}
};
function isDeviceFrame(){
 try{return new URLSearchParams(location.search).get('deviceFrame')==='1';}catch{return false;}
}
function readDevicePref(){
 try{return Object.assign({mode:'desktop',preset:'phone'},JSON.parse(localStorage.getItem(DEVICE_KEY)||'{}')||{});}
 catch{return {mode:'desktop',preset:'phone'};}
}
function writeDevicePref(next){
 const cur=Object.assign(readDevicePref(),next||{});
 if(!DEVICE_PRESETS[cur.preset])cur.preset='phone';
 if(cur.mode!=='phone')cur.mode='desktop';
 try{localStorage.setItem(DEVICE_KEY,JSON.stringify({mode:cur.mode,preset:cur.preset}));}catch{}
 return cur;
}
function ensureDeviceChrome(){
 if(isDeviceFrame())return;
 const wrap=$('canvas-wrap');
 if(!wrap||$('semestaDeviceBar'))return;
 wrap.insertAdjacentHTML('beforeend',
  '<div id="semestaDeviceBar" hidden>'+
   '<span>Preview</span>'+
   '<button type="button" id="semestaDeviceDesktop">Desktop</button>'+
   '<button type="button" id="semestaDevicePhone">Phone</button>'+
   '<select id="semestaDevicePreset" aria-label="Phone preset">'+
    '<option value="phone">Portrait 390×844</option>'+
    '<option value="landscape">Landscape 844×390</option>'+
    '<option value="fold">Fold 717×746</option>'+
   '</select></div>'+
  '<div id="semestaDeviceStage" hidden><div id="semestaDeviceBezel">'+
   '<iframe id="semestaDeviceFrame" title="Phone preview"></iframe></div></div>');
 $('semestaDeviceDesktop').onclick=()=>{writeDevicePref({mode:'desktop'});applyDevicePreview();};
 $('semestaDevicePhone').onclick=()=>{writeDevicePref({mode:'phone'});applyDevicePreview();};
 $('semestaDevicePreset').onchange=e=>{writeDevicePref({mode:'phone',preset:e.target.value});applyDevicePreview();};
}
function applyDevicePreview(){
 ensureDeviceChrome();
 const pref=writeDevicePref({});
 const bar=$('semestaDeviceBar'),stage=$('semestaDeviceStage'),frame=$('semestaDeviceFrame');
 if(isDeviceFrame()){
  document.documentElement.classList.add('vl-device-frame');
  if(bar)bar.hidden=true;
  if(stage)stage.hidden=true;
  return;
 }
 const phoneOn=mode==='walk'&&pref.mode==='phone';
 if(bar){
  bar.hidden=mode!=='walk';
  bar.dataset.mode=pref.mode;
  $('semestaDeviceDesktop')?.classList.toggle('active',pref.mode==='desktop');
  $('semestaDevicePhone')?.classList.toggle('active',pref.mode==='phone');
  if($('semestaDevicePreset')){
   $('semestaDevicePreset').value=DEVICE_PRESETS[pref.preset]?pref.preset:'phone';
   $('semestaDevicePreset').hidden=pref.mode!=='phone';
  }
 }
 if(!stage||!frame)return;
 if(!phoneOn){
  stage.hidden=true;
  if(frame.getAttribute('src')){frame.removeAttribute('src');frame.dataset.src='';}
  $('walkPad')?.classList.toggle('active',mode==='walk');
  syncPlayHud();
  return;
 }
 const spec=DEVICE_PRESETS[pref.preset]||DEVICE_PRESETS.phone;
 frame.style.width=spec.w+'px';
 frame.style.height=spec.h+'px';
 const url=new URL(location.href);
 url.searchParams.set('deviceFrame','1');
 const next=url.pathname+url.search+url.hash;
 if(frame.dataset.src!==next){
  frame.dataset.src=next;
  frame.src=next;
 }
 stage.hidden=false;
 $('walkPad')?.classList.remove('active');
 const hud=ensurePlayHud();
 if(hud)hud.setVisible(false);
 fitDeviceStage();
}
function fitDeviceStage(){
 const stage=$('semestaDeviceStage'),bezel=$('semestaDeviceBezel'),frame=$('semestaDeviceFrame');
 if(!stage||!bezel||!frame||stage.hidden)return;
 const w=parseFloat(frame.style.width)||390,h=parseFloat(frame.style.height)||844;
 const pad=36,availW=Math.max(120,stage.clientWidth-pad),availH=Math.max(160,stage.clientHeight-pad);
 const s=Math.min(1,availW/w,availH/h);
 bezel.style.transform=s<0.999?('scale('+s+')'):'';
}
function bootDeviceFrame(){
 if(!isDeviceFrame())return;
 document.documentElement.classList.add('vl-device-frame');
 document.body.classList.add('vl-device-frame');
 try{window.VLQuickTutorial&&window.VLQuickTutorial.close(false);}catch{}
 const overlay=$('tutorialOverlay');if(overlay)overlay.hidden=true;
 setTimeout(()=>{if(mode!=='walk')setMode('walk');},280);
}


function spawnWorldAdapter(){
 return {
  map:documentMap.map,
  objects:documentMap.objects,
  tileAt(x,z){
   const terr=documentMap.map&&documentMap.map.terrain;
   if(!terr)return 'grass';
   if(window.VLMapTerrain){
    const cells=window.VLMapTerrain.dict(terr);
    const hit=cells.get(Math.floor(Number(x))+','+Math.floor(Number(z)));
    return (hit&&hit.type)||terr.default||'grass';
   }
   return window.VLSpawnRespawn?window.VLSpawnRespawn.tileAt({map:documentMap.map},x,z):'grass';
  },
  blocked(x,z){
   const dummy={id:'__hobo-tent__',type:'sprite',name:'Hobo tent',x,z,w:2.45,d:2.45,collision:true};
   return !!style.reason(dummy,documentMap.objects,documentMap.map,assetByName);
  }
 };
}
function spawnModule(){
 const g=currentPlayGameplay()||{};
 const SR=window.VLSpawnRespawn;
 const raw=g.modules&&g.modules.spawnRespawn;
 return SR?SR.normalizeModule(raw):raw||{};
}
function beginSpawnRespawn(actor,trigger){
 const SR=window.VLSpawnRespawn;
 if(!SR)return null;
 const rawMod=spawnModule();
 const mod=window.SemestaLifePlay?.spawnModule?.(rawMod,spawnWorldAdapter())||rawMod;
 if(mod.enabled===false)return null;
 const triggers=mod.triggers||{};
 if(trigger==='playStart'&&triggers.playStart===false)return null;
 if(trigger==='spawnRequest'&&triggers.spawnRequest===false)return null;
 if(trigger==='reconnect'&&triggers.reconnect===false)return null;
 const holder=actor&&rigs.get(actor.id);
 if(!holder)return null;
 const lifePlayer=window.SemestaLifePlay?.spawnEntitlement?.();
 const rawDecision=SR.resolve({
  homeAccess:lifePlayer?lifePlayer.homeAccess:!!mod.previewOwnsRoom,
  ownedRoom:lifePlayer?lifePlayer.ownedRoom:mod.ownedRoom,
  profile:actor.profile
 },mod,spawnWorldAdapter(),Math.random);
 const decision=rawDecision?.ok?rawDecision:(lifePlayer?.homeAccess&&lifePlayer.ownedRoom?
  {ok:true,kind:'home',playExitTent:false,point:lifePlayer.ownedRoom,reason:'kost-play-placeholder'}:
  window.SemestaLifePlay?.fallbackSpawn?.()||rawDecision);
 window.__semestaLastSpawn=decision;
 window.SemestaLifePlay?.onSpawn?.(decision);
 if(!decision||!decision.ok||!decision.point){
  tell('Spawn: no valid roadside tent point');
  return decision;
 }
 holder.root.position.set(decision.point.x,holder.root.position.y||0,decision.point.z);
 if(decision.kind==='home'){
  tell('Spawn in owned room · '+decision.point.x.toFixed(1)+', '+decision.point.z.toFixed(1));
  return decision;
 }
 const facing=decision.point.facing==='sw'?'sw':'se';
 holder.rig.setDirection(facing);
 if(decision.playExitTent&&window.VLSpawnHobo){
  focusCameraAt(decision.point.x,decision.point.z,14);
  window.VLSpawnHobo.play({
   THREE,scene,camera,
   actorRoot:holder.root,rig:holder.rig,
   point:decision.point,facing,profile:actor.profile||''
  }).then(()=>tell('Keluar tenda · '+facing+' @ '+decision.point.x.toFixed(1)+','+decision.point.z.toFixed(1)))
   .catch(err=>tell('Spawn tent art missing: '+(err&&err.message||err)));
 }else{
  tell('Hobo spawn without exit-tent · '+decision.point.x.toFixed(1)+', '+decision.point.z.toFixed(1));
 }
 return decision;
}
function spawnRespawnApi(){
 const SR=window.VLSpawnRespawn;
 return {
  module:spawnModule,
  last:()=>window.__semestaLastSpawn||null,
  playing:()=>!!(window.VLSpawnHobo&&window.VLSpawnHobo.busy()),
  snapshot:()=>window.VLSpawnHobo&&window.VLSpawnHobo.snapshot&&window.VLSpawnHobo.snapshot(),
  validate:(point)=>SR?SR.validatePoint(point,spawnWorldAdapter()):{ok:false},
  pool:()=>SR?SR.collectPool(spawnModule(),spawnWorldAdapter()):[],
  validPool:()=>SR?SR.validPool(spawnModule(),spawnWorldAdapter()):[],
  resolve:(rand)=>SR?SR.resolve({homeAccess:!!spawnModule().previewOwnsRoom,ownedRoom:spawnModule().ownedRoom},spawnModule(),spawnWorldAdapter(),rand):null,
  respawn:(opts={})=>{
   const actor=documentMap.objects.find(o=>o.id===walkActorId)||documentMap.objects.find(o=>o.type==='avatar')||item();
   if(!actor)return {ok:false,reason:'no-actor'};
   if(window.VLSpawnHobo)window.VLSpawnHobo.dispose();
   const lifePlayer=window.SemestaLifePlay?.spawnEntitlement?.();
   const mod=window.SemestaLifePlay?.spawnModule?.(spawnModule(),spawnWorldAdapter())||spawnModule();
   const rawDecision=SR.resolve({homeAccess:lifePlayer?lifePlayer.homeAccess:!!mod.previewOwnsRoom,
    ownedRoom:lifePlayer?lifePlayer.ownedRoom:mod.ownedRoom,profile:actor.profile},mod,spawnWorldAdapter(),opts.rand);
   const decision=rawDecision?.ok?rawDecision:(lifePlayer?.homeAccess&&lifePlayer.ownedRoom?
    {ok:true,kind:'home',playExitTent:false,point:lifePlayer.ownedRoom,reason:'kost-play-placeholder'}:
    window.SemestaLifePlay?.fallbackSpawn?.()||rawDecision);
   window.__semestaLastSpawn=decision;
   window.SemestaLifePlay?.onSpawn?.(decision);
   const holder=rigs.get(actor.id);
   if(decision&&decision.ok&&decision.point&&holder){
    holder.root.position.set(decision.point.x,holder.root.position.y||0,decision.point.z);
    if(decision.kind==='hobo'&&decision.playExitTent&&window.VLSpawnHobo){
     focusCameraAt(decision.point.x,decision.point.z,14);
     window.VLSpawnHobo.play({
      THREE,scene,camera,actorRoot:holder.root,rig:holder.rig,
      point:decision.point,facing:decision.point.facing,profile:actor.profile||''
     }).catch(()=>{});
    }
   }
   return decision;
  },
  addPoint:(point)=>{
   const g=currentPlayGameplay()||{};
   const next=SR.normalizeModule(g.modules&&g.modules.spawnRespawn);
   const cleaned=SR.cleanPoint(point,next.pool.length);
   if(!cleaned)return {ok:false,reason:'bad-point'};
   next.pool.push(cleaned);
   try{
    const raw=JSON.parse(localStorage.getItem((window.VLHub&&window.VLHub.GAMEPLAY_KEY)||'virtual-life-gameplay-v1')||'{}');
    raw.modules=raw.modules||{};raw.modules.spawnRespawn=next;
    const saved=window.JiwaGameplay?window.JiwaGameplay.normalizeGameplay(raw):raw;
    localStorage.setItem((window.VLHub&&window.VLHub.GAMEPLAY_KEY)||'virtual-life-gameplay-v1',JSON.stringify(saved));
    window.VLHub&&window.VLHub.publish('gameplay',{live:true,source:'spawn-pool'});
   }catch{}
   return {ok:true,point:cleaned,module:next};
  }
 };
}

window.SemestaPlay=Object.freeze({
 gameplay:currentPlayGameplay,
 worldSpeed:playWorldSpeed,
 running:()=>walkRunning,
 controllerOnly:playControllerOnly,
 hud:()=>playHud,
 loak:()=>window.VLLoakPlay||null,
 pickedIds:()=>[...playPickedIds],
 pickupPreview:previewPickupById,
 playObjects:()=>documentMap.objects.map(o=>({id:o.id,type:o.type,asset:o.asset})),
 spawnRespawn:spawnRespawnApi(),
 devicePref:readDevicePref,
 setDevice:(mode,preset)=>{writeDevicePref({mode,preset});applyDevicePreview();return readDevicePref();},
 isDeviceFrame,
 seedTrafficLights:seedTrafficLightsOnMap,
 placeTrafficLight:placeTrafficLightAt,
 focusAt:focusCameraAt,
 trafficLightTime:()=>trafficLightTime,
 setTrafficLightTime:t=>{trafficLightTime=Number(t)||0;refreshTrafficLights();return inspectTrafficLights();},
 freezeTrafficLights:on=>{trafficLightFrozen=!!on;refreshTrafficLights();return {frozen:trafficLightFrozen,time:trafficLightTime};},
 trafficLightPhase:currentTrafficPhase,
 trafficLightSettings,
 inspectTraffic:inspectTrafficLights,
 stepTraffic:dt=>{
  const step=Math.max(0,Number(dt)||0);
  trafficLightTime+=step;updateAutomated(step);refreshTrafficLights();
  return inspectTrafficLights();
 }
});

if(window.SemestaLifePlay){
 window.SemestaLifePlay.attach({
  THREE,
  getWorld:()=>documentMap,
  getScene:()=>scene,
  getCityId:()=>activeDraftId||'__semesta_working_copy__',
  getPosition:walkWorldPos,
  getRoot:()=>rigs.get(walkActorId)?.root||null,
  mountTo:()=>$('canvas-wrap'),
  syncHud:syncPlayHud,
  tell,
  canStand:(x,z)=>{
   const world=spawnWorldAdapter();
   const tile=world.tileAt(x,z);
   return !['road','water','river','drain'].includes(tile)&&!world.blocked(x,z);
  },
  teleport:(x,z)=>{
   if(window.VLSpawnHobo?.busy?.())window.VLSpawnHobo.dispose();
   const holder=rigs.get(walkActorId);
   if(!holder||!Number.isFinite(Number(x))||!Number.isFinite(Number(z)))return false;
   holder.root.position.set(Number(x),holder.root.position.y||0,Number(z));
   holder.rig?.setMoving(0,0,false);
   focusCameraAt(Number(x),Number(z),14);
   return true;
  },
  respawn:()=>spawnRespawnApi().respawn()
 });
}
$('addType').onchange=e=>{add(e.target.value);e.target.value='';setMode('move');};
$('home').onclick=cameraMapView;
$('rotateL').onclick=()=>{if(item()&&!actorType(item().type)&&item().type!=='vehicle')edit(o=>{o.rotation=(o.rotation-90+360)%360;});};
$('rotateR').onclick=()=>{if(item()&&!actorType(item().type)&&item().type!=='vehicle')edit(o=>{o.rotation=(o.rotation+90)%360;});};
$('scaleDown').onclick=()=>{
 if(item()?.type==='vehicle')editVehicleVisual(o=>{o.scale=vehiclePlacement.scale(o.scale-.05);});
 else if(item()&&!actorType(item().type))edit(o=>{o.scale=clamp(round(o.scale-.05),.1,1.15);});
};
$('scaleUp').onclick=()=>{
 if(item()?.type==='vehicle')editVehicleVisual(o=>{o.scale=vehiclePlacement.scale(o.scale+.05);});
 else if(item()&&!actorType(item().type))edit(o=>{o.scale=clamp(round(o.scale+.05),.1,1.15);});
};
$('duplicate').onclick=duplicate;$('delete').onclick=remove;
for(const prop of ['x','z','y','rotation','scale'])$(prop).addEventListener('change',()=>{
 const v=Number($(prop).value);
 if(!Number.isFinite(v)||!item())return;
 if((actorType(item().type)&&['rotation','scale'].includes(prop))||
  (item().type==='vehicle'&&prop==='rotation')){updateSelection();return;}
 if(prop==='scale'&&item().type==='vehicle'){
  editVehicleVisual(o=>{o.scale=vehiclePlacement.scale(v);});return;
 }
 edit(o=>{o[prop]=prop==='scale'?clamp(v,.1,1.15):prop==='rotation'?((v%360)+360)%360:clamp(v,-1000000,1000000);});
});
// Vehicle size and art offsets do not affect road route, footprint, or
// existing instance motion. Position C/X and R/Z above remains the spawn.
$('vehicleVisualScale').addEventListener('input',()=>{
 const v=vehiclePlacement.scale($('vehicleVisualScale').value);
 $('vehicleVisualScaleValue').textContent=v.toFixed(2)+'×';
 // A continuous slider gesture should create just one Undo checkpoint.
 const target=item();if(target?.type!=='vehicle')return;
 target.scale=v;const root=owners.get(target.id);
 if(root){
  root.scale.setScalar(v);
  const agent=automatedAgents.get(target.id);
  if(agent?.visual)vehiclePlacement.apply(agent.visual,target);
  if(highlight?.userData.selected===target.id)highlight.update();
 }
 $('scale').value=String(v);renderer.render(scene,camera);
});
$('vehicleVisualScale').addEventListener('change',()=>{
 const target=item();if(target?.type!=='vehicle')return;
 const next=vehiclePlacement.scale($('vehicleVisualScale').value);
 const previous=vehicleScaleStart;
 // Previous value retained when pointerdown/keyboard interaction began.
 if(Math.abs(previous-next)<.0001){updateSelection();return;}
 undoPoint();
 // Capture previous scale in Undo stack while preserving currently animated art.
 const old=undoStack.pop();if(old){
  try{const snapshot=JSON.parse(old),found=snapshot.objects.find(o=>o.id===target.id);
   if(found)found.scale=previous;
   undoStack.push(JSON.stringify(snapshot));
  }catch{undoStack.push(old);}
 }
 target.scale=next;vehiclePlacement.normalize(target);
 updateSelection();saved();
});
let vehicleScaleStart=1;
$('vehicleVisualScale').addEventListener('pointerdown',()=>{vehicleScaleStart=vehiclePlacement.scale(item()?.scale);});
$('vehicleVisualScale').addEventListener('focus',()=>{vehicleScaleStart=vehiclePlacement.scale(item()?.scale);});
$('vehicleAutoGround').addEventListener('change',()=>{
 const automatic=$('vehicleAutoGround').checked;
 editVehicleVisual(o=>{o.autoGround=automatic;});
});
for(const [id,axis] of [['vehicleOffsetX','x'],['vehicleOffsetY','y'],['vehicleOffsetZ','z']]){
 $(id).addEventListener('change',()=>{
  const n=Number($(id).value);
  if(!Number.isFinite(n)||item()?.type!=='vehicle'){updateSelection();return;}
  editVehicleVisual(o=>{o.visualOffset={...vehiclePlacement.offset(o.visualOffset),[axis]:n};});
 });
}
$('vehicleResetVisual').onclick=()=>editVehicleVisual(o=>{
 o.scale=1;o.visualOffset={x:0,y:0,z:0};o.autoGround=true;
});
// Change an existing vehicle's ACTUAL lane direction, not just its picture.
// Keep its live position mid-route, even while driving or paused. This also
// updates the correct original four-view sprite immediately.
function setVehicleDirection(direction){
 const o=item();if(o?.type!=='vehicle')return;
 if(!['auto','east','west','south','north'].includes(direction))return;
 if(traffic.config(o).direction===direction)return;
 const agent=automatedAgents.get(o.id);
 const before=agent?.route?{x:agent.root.position.x,z:agent.root.position.z}:null;
 undoPoint();
 o.motion={...o.motion,direction};
 if(agent){
  resetAutoRoute(agent,o);
  if(agent.route?.length){
   // Reset the route's arc-length based on where the transport was already
   // driving; reversing it must not teleport it back to its City Draft spawn.
   if(before)agent.distance=traffic.nearestDistance(agent.route,before);
   const p=traffic.sample(agent.route,Math.min(agent.distance,agent.route.length-.0001));
   if(p){
    agent.root.position.set(p.x,o.y||0,p.z);
    agent.lastDx=p.dx;agent.lastDz=p.dz;
    const view=window.VLCharacterRig?.directionFromWorld(p.dx,p.dz,'se')||'se';
    agent.graphic?.update(view,camera,agent.root);
   }
  }
 }
 updateSelection();renderer.render(scene,camera);saved();
 tell('⇄ Kendaraan menghadap '+direction.toUpperCase()+' · arah perjalanan dibalik');
}
$('vehicleFlipDirection').onclick=()=>{
 const o=item();if(o?.type!=='vehicle')return;
 const agent=automatedAgents.get(o.id);
 const opposite=traffic.flipDirection(traffic.config(o).direction,
  agent?.route,agent?.distance);
 if(!opposite){tell('Letakkan kendaraan pada ruas jalan untuk flip arah');return;}
 setVehicleDirection(opposite);
};
$('facing').onchange=()=>{if(item()&&actorType(item().type))edit(o=>{o.facing=$('facing').value;o.pose=null;});};
$('pose').onchange=()=>{if(item()&&actorType(item().type))edit(o=>{o.pose=$('pose').value||null;});};
$('profile').onchange=()=>{if(item()&&actorType(item().type))
 edit(o=>{o.profile=$('profile').value;o.pose=null;});};

function editTransportNPC(fn){
 const obj=item(),spec=obj?.type==='sprite'?assetByName.get(obj.asset):null;
 if(!spec?.npcTransport?.modular)return;
 edit(o=>{fn(o)},false);
 rebuild(); // Mahluk seats/rigs must be reattached to the saved asset.
}
$('transportNPCEnabled').onchange=()=>editTransportNPC(o=>{
 o.npcDisabled=!$('transportNPCEnabled').checked;
});
$('transportNPCAnimate').onchange=()=>editTransportNPC(o=>{
 o.npcAnimation=$('transportNPCAnimate').checked;
});
$('transportNPCHasPassenger').onchange=()=>editTransportNPC(o=>{
 o.npcPassengers={...o.npcPassengers,
  passenger_1:$('transportNPCHasPassenger').checked};
});
for(const [id,role] of [['transportNPCDriver','driver'],
                        ['transportNPCPassenger','passenger_1']]){
 $(id).onchange=()=>editTransportNPC(o=>{
  const profile=$(id).value;
  if(!mahluk?.has(profile))return;
  o.npcProfiles={...o.npcProfiles,[role]:profile};
 });
}

function changeMotion(field,value,rebuildCrowd=false){
 const selected=item();if(!selected||!automaticType(selected.type))return;
 edit(o=>{o.motion={...o.motion,[field]:value};},false);
 if(rebuildCrowd)rebuild();
}
$('motionSpeed').onchange=()=>changeMotion('speed',Number($('motionSpeed').value));
$('motionDirection').onchange=()=>{
 if(item()?.type==='vehicle')setVehicleDirection($('motionDirection').value);
 else changeMotion('direction',$('motionDirection').value);
};
$('crowdCount').onchange=()=>changeMotion('count',Number($('crowdCount').value),true);
$('questAction').onchange=()=>changeMotion('idleAction',$('questAction').value);
$('motionEnabled').onchange=()=>changeMotion('enabled',$('motionEnabled').checked);


function assetCategory(spec){
 if(!spec)return 'street';
 if(spec.pack==='indonesia-v1'||spec.pack==='indonesia-200-v1')return 'indonesia';
 if(spec.source==='bangun-object')return spec.objectCategory==='plant'?'vegetation':
  spec.objectCategory==='furniture'?'interior':'street';
 const kind=style.category({type:'sprite',asset:spec.file},assetByName);
 if(spec.source==='pipeline-vegetation'||kind==='tree'||kind==='ground')return 'vegetation';
 if(spec.source==='loak-v2'||spec.objectCategory==='item'||spec.group==='Loak Objects')return 'object';
 if(spec.source==='legacy-local'&&(spec.category==='props'||spec.category==='spots'||spec.category==='items'))return 'object';
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
 refreshMarkerManager();
}
function refreshCharacterOptions(){
 const current=$('profile').value;
 const sel=$('profile');
 sel.replaceChildren();
 const old=document.createElement('optgroup');old.label='VIRTUAL LIFE / ORIGINAL';
 for(const [id,name] of [['ichsan','Ichsan'],['theodore','Theodore'],['noor','Noor'],['grok','Grok Bot'],['raka','Raka'],['bima','Bima'],['ellen','Ellen'],['nadia','Nadia'],['warteg','Bu Warteg'],['barista','Barista'],['kasir','Kasir']]){
  if(hideLegacyCharacters)continue;
  const opt=document.createElement('option');opt.value=id;opt.textContent=name;old.append(opt);
 }
 if(old.children.length)sel.append(old);
 if(hideLegacyCharacters){
  const placeholder=document.createElement('option');placeholder.value='';
  placeholder.textContent='MENUNGGU ACUAN RIG BARU';sel.append(placeholder);
 }
 const published=document.createElement('optgroup');published.label='MAHLUK HIDUP / PUBLISHED';
 const custom=document.createElement('optgroup');custom.label='MAHLUK HIDUP / CHAR STORAGE';
 for(const c of (mahluk?.list()||[])){
  const opt=document.createElement('option');opt.value=c.id;opt.textContent=c.name;
  (c.custom?custom:published).append(opt);
 }
 if(published.children.length)sel.append(published);
 if(custom.children.length)sel.append(custom);
 if(Array.from(sel.options).some(o=>o.value===current))sel.value=current;
}
function actionChoices(actorId,selectId,selectedAction){
 const sourceId=window.VLCharacterRig?.canonical(actorId)||actorId;
 const sel=$(selectId),actions=mahluk?.motions(sourceId)||[];
 const templates=window.VLActionTemplates?.list(sourceId)||[];
 sel.replaceChildren();
 if(selectId==='pose'){
  const blank=document.createElement('option');blank.value='';blank.textContent='Idle / no action';sel.append(blank);
 }
 if(actions.length){
  const group=document.createElement('optgroup');group.label='MAHLUK HIDUP / NATIVE MOTIONS';
  for(const action of actions.filter(m=>m.available!==false)){
   const opt=document.createElement('option');opt.value=action.id;
   opt.textContent=action.name||action.id.replace(/_/g,' ').toUpperCase();group.append(opt);
  }
  sel.append(group);
 }
 // Each actor receives universal bed poses only if its own native LIE
 // frames are present. An absent pose must remain unavailable.
 const shared=window.VLUniversalSleep,character=mahluk?.get(sourceId);
 if(shared&&character){
  const available=shared.IDs.filter(id=>shared.resolve(character,id));
  if(available.length){
   const group=document.createElement('optgroup');group.label='UNIVERSAL / BED SLEEP';
   for(const id of available){
    const opt=document.createElement('option');opt.value=id;
    opt.textContent=id==='sleep_bed_right'?
     'SLEEP / BED RIGHT':'SLEEP / BED LEFT';
    group.append(opt);
   }
   sel.append(group);
  }
 }
 if(templates.length){
  const group=document.createElement('optgroup');group.label='SEMESTA / SAVED CUSTOM ACTIONS';
  for(const action of templates){
   const opt=document.createElement('option');opt.value=action.action;
   opt.textContent=(action.ready?'✓ ':'DRAFT · ')+action.name.toUpperCase();
   opt.disabled=!action.ready;group.append(opt);
  }
  sel.append(group);
 }
 if(Array.from(sel.options).some(o=>o.value===selectedAction&&!o.disabled))
  sel.value=selectedAction;
 else if(selectId==='pose')sel.value='';
 else sel.value=actions.find(m=>m.id==='idle')?.id||'';
}
// Pixel thumbnails are read from the same catalog entries used by placement.
// Browsing never writes to the map. Every asset row retains the original click action.
const assetThumbnails=window.VLAssetThumbnails;
let assetViewMode='list',assetPreviewRevision=0;
function assignAssetImage(img,fallback,urlOrPromise,lazy=true){
 const rev=Symbol('asset-picture');img._assetThumbRevision=rev;
 img.hidden=true;img.removeAttribute('src');fallback.hidden=false;
 void Promise.resolve(urlOrPromise).then(url=>{
  if(img._assetThumbRevision!==rev||!url)return;
  img.style.opacity='0';img.decoding='async';img.loading=lazy?'lazy':'eager';
  img.onload=()=>{
   if(img._assetThumbRevision!==rev)return;
   img.hidden=false;img.style.opacity='1';fallback.hidden=true;
  };
  img.onerror=()=>{
   if(img._assetThumbRevision!==rev)return;
   img.hidden=true;fallback.hidden=false;img.removeAttribute('src');
  };
  img.src=url;
 }).catch(()=>{if(img._assetThumbRevision===rev)fallback.hidden=false;});
}
function previewAssetCard(a,info){
 if(!info||!a)return;
 const img=$('assetPreviewImage'),icon=$('assetPreviewIcon');
 $('assetPreviewName').textContent=a.title;
 $('assetPreviewDetail').textContent=info.category+
  (info.footprint?' · '+info.footprint:'')+' · '+info.source;
 icon.textContent=info.fallback;
 const revision=++assetPreviewRevision;
 img.hidden=true;icon.hidden=false;img.removeAttribute('src');
 void Promise.resolve(info.url).then(url=>{
  if(revision!==assetPreviewRevision||!url)return;
  img.style.opacity='0';img.decoding='async';
  img.onload=()=>{
   if(revision!==assetPreviewRevision)return;
   img.hidden=false;img.style.opacity='1';icon.hidden=true;
  };
  img.onerror=()=>{
   if(revision!==assetPreviewRevision)return;
   img.hidden=true;icon.hidden=false;img.removeAttribute('src');
  };
  img.src=url;
 }).catch(()=>{if(revision===assetPreviewRevision)icon.hidden=false;});
}
function setAssetViewMode(view){
 assetViewMode=view==='grid'?'grid':'list';
 $('assetList').dataset.view=assetViewMode;
 for(const [id,v] of [['assetViewList','list'],['assetViewGrid','grid']]){
  $(id).classList.toggle('active',v===assetViewMode);
  $(id).setAttribute('aria-pressed',String(v===assetViewMode));
 }
}
$('assetViewList').onclick=()=>setAssetViewMode('list');
$('assetViewGrid').onclick=()=>setAssetViewMode('grid');
setAssetViewMode('list');
// Change only the selected instance, not every object sharing its source art.
// Preserve world coordinates, rotation, scale and stable ID for Jiwa bindings.
function replacePlacedAsset(id,file){
 const old=documentMap.objects.find(o=>o.id===id),spec=assetByName.get(file);
 if(!old||!spec||spec.published===false){tell('Asset pengganti tidak tersedia');return false;}
 if(actorType(old.type)||automaticType(old.type)){
  tell('Replace khusus objek statis; NPC dan kendaraan menggunakan sistem terpisah');return false;
 }
 const previous=clone(old);
 Object.assign(old,{type:'sprite',asset:file,name:spec.label,collision:spec.collision!==false,replaceable:true,
  w:undefined,d:undefined,h:undefined,sizeClass:undefined,width:spec.width,height:spec.height,
  interactive:spec.interactive===true,enterable:spec.enterable===true,
  entrance:spec.entrance?clone(spec.entrance):null,
  interior:spec.interior?clone(spec.interior):null,
  actionSlots:spec.actionSlots?clone(spec.actionSlots):[],
  interactions:spec.interactions?clone(spec.interactions):[],
  entranceFacing:spec.entranceFacing||'',npcProfiles:undefined,npcPassengers:undefined,
  npcDisabled:undefined,npcAnimation:undefined});
 style.normalize(old,assetByName);schema.normalize(old,assetByName,style);
 const collision=style.reason(old,documentMap.objects,documentMap.map,assetByName);
 if(collision){
  Object.keys(old).forEach(k=>delete old[k]);Object.assign(old,previous);
  tell('Replace gagal: '+collision);updateSelection();return false;
 }
 undoStack.push(JSON.stringify({...documentMap,objects:documentMap.objects.map(o=>o.id===id?previous:o)}));
 redoStack.length=0;rebuild();saved();select(id);
 tell('Replaced '+previous.name+' → '+spec.label+' (Undo tersedia)');
 return true;
}
function renderAssetList(){
 const q=$('searchAsset').value.trim().toLowerCase(),cat=$('assetCategory').value;
 const assets=[
  ...[
    {title:'Road · paint',tag:'terrain:road',category:'terrain',label:'TERRAIN / DRIVABLE'},
    {title:'Sidewalk · paint',tag:'terrain:sidewalk',category:'terrain',label:'TERRAIN / WALKABLE'},
    {title:'Grass · paint',tag:'terrain:grass',category:'terrain',label:'TERRAIN / GROUND'},
    {title:'Water · paint',tag:'terrain:water',category:'terrain',label:'TERRAIN / NOT WALKABLE'},
    {title:'Selokan · paint',tag:'terrain:drain',category:'terrain',label:'JAKARTA / DRAIN · NOT WALKABLE'},
    {title:'Sungai · paint',tag:'terrain:river',category:'terrain',label:'JAKARTA / RIVER · NOT WALKABLE'},
    {title:'Plaza / Paving · paint',tag:'terrain:plaza',category:'terrain',label:'TERRAIN / PLAZA'},
    {title:'Soil · paint',tag:'terrain:soil',category:'terrain',label:'TERRAIN / DIRT'},
    {title:'Ruko Kebon Sirih · 3×6',tag:'sprite:pipeline:ruko_a',category:'custom',label:'PIPELINE / PIXEL'},
    {title:'Rumah perkotaan · 4×3',tag:'sprite:pipeline:rumah_kampung_d',category:'custom',label:'PIPELINE / PIXEL'},
    {title:'Gedung perkantoran · 7×6',tag:'sprite:pipeline:kantor_a',category:'custom',label:'PIPELINE / PIXEL'},
    {title:'Kiara payung · native',tag:'sprite:vegetation:pohon_kiara_payung',category:'vegetation',label:'PIPELINE / PNG'},
    {title:'Street Light · preview',tag:'lamp',category:'street',label:'PIXEL PLANE / PREVIEW'},
    {title:'Park Bench · preview',tag:'bench',category:'street',label:'PIXEL PLANE / PREVIEW'},
    {title:'Trash Bin · original',tag:'sprite:street2/loak/props/tong_sampah_besi_se.png',category:'street',label:'GPT / ORIGINAL · login'},
    {title:'Walking NPC · Ichsan',tag:'pedestrian:ichsan',category:'people',label:'V6B / SIDEWALK LOOP'},
    {title:'Walking NPC · Noor',tag:'pedestrian:noor',category:'people',label:'V6B / SIDEWALK LOOP'},
    {title:'Walking NPC · Raka',tag:'pedestrian:raka',category:'people',label:'V6B / SIDEWALK LOOP'},
    {title:'Walking NPC · Ellen',tag:'pedestrian:ellen',category:'people',label:'V6B / SIDEWALK LOOP'},
    {title:'Walking NPC · Nadia',tag:'pedestrian:nadia',category:'people',label:'V6B / SIDEWALK LOOP'},
    {title:'Crowd · 5 people',tag:'crowd:5',category:'people',label:'V6B / SIDEWALK LOOP'},
    {title:'Crowd · 8 people',tag:'crowd:8',category:'people',label:'V6B / SIDEWALK LOOP'},
    ...trafficCatalog.vehicles.map(v=>({
     title:v.label,tag:'vehicle:'+v.id,category:'vehicles',
     label:trafficArt?.sourcePublished(v.id)?'MAHLUK HIDUP / ORIGINAL PNG':'MAHLUK HIDUP / PIXEL PREVIEW',
      origin:trafficArt?.sourcePublished(v.id)?'published':'unpublished'
    })),
    ...trafficCatalog.questNPCs.map(v=>({
     title:v.label,tag:'quest:'+v.id,category:'quest',
     label:mahluk?.questProfile(v.id)?'MAHLUK HIDUP / REAL ACTIONS':
       'STATIONARY JOB NPC / PIXEL PREVIEW',
     origin:mahluk?.questProfile(v.id)?'published':'unpublished'
    })),
    ...(mahluk?.list()||[]).map(c=>({
     title:c.name,tag:'character:'+c.id,category:'character',
     label:c.custom?'MAHLUK HIDUP / CHARACTER STORAGE':
       'MAHLUK HIDUP / '+c.motions.length+' REAL ACTIONS',origin:'published'
    })),
    ...(mahluk?.list()||[]).filter(c=>c.motions.some(m=>m.id==='walk')).map(c=>({
     title:'Walker · '+c.name,tag:'pedestrian:'+c.id,category:'people',
     label:c.custom?'CHAR STORAGE / SIDEWALK':'MAHLUK HIDUP / SIDEWALK',origin:'published'
    })),
    ...(mahluk?.list()||[]).filter(c=>c.motions.some(m=>m.id!=='idle'&&m.id!=='walk')).map(c=>({
     title:'NPC Quest · '+c.name,tag:'quest-character:'+c.id,category:'quest',
     label:c.custom?'CHAR STORAGE / STATIONARY':'MAHLUK HIDUP / STATIONARY ACTION',
     origin:'published'
    }))
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
   label:spec.source==='bangun-object'?
    (spec.builtIn?'BANGUN RUANG / BUILT-IN PIXEL':'BANGUN RUANG / CUSTOM PIXEL'):
    spec.source==='custom-building'?
    (spec.enterable?'BANGUN RUANG / ENTERABLE':'BANGUN RUANG / DECORATIVE'):
    spec.source==='loak-v2'?'LOAK OBJECTS / ITEM':
    spec.source==='gpt-original'?'GPT / ORIGINAL · login':
    spec.published?'PIPELINE / PNG':'PIPELINE / MANIFEST ONLY',
   origin:spec.source==='gpt-original'?'original':spec.published?'published':'unpublished'
  }))
 ];
 const list=assets.filter(a=>(!hideLegacyCharacters||
  !['character','people','quest'].includes(a.category)||
  /^(character|pedestrian|quest-character):mh2_[a-z0-9]+$/.test(a.tag))&&
  (cat==='all'||a.category===cat)&&
  (a.title+' '+a.tag+' '+a.label).toLowerCase().includes(q));
 if(cat==='object'){
  list.sort((a,b)=>{
   const al=a.label==='LOAK OBJECTS / ITEM'?0:1;
   const bl=b.label==='LOAK OBJECTS / ITEM'?0:1;
   return al-bl;
  });
 }
 $('assetCount').textContent=String(list.length).padStart(2,'0');
 const holder=$('assetList');holder.replaceChildren();
 for(const a of list){
  const btn=document.createElement('button');btn.type='button';
  btn.className='asset-card';btn.setAttribute('role','listitem');
  btn.title='Click to place · '+a.title;
  const meta=assetThumbnails?.describe(a,assetByName)||{
   fallback:'◇',category:a.category.toUpperCase(),source:a.label,footprint:'',url:null
  };
  const thumb=document.createElement('span');thumb.className='asset-thumb';
  thumb.setAttribute('aria-hidden','true');
  const picture=document.createElement('img');
  const noPicture=document.createElement('span');noPicture.className='asset-thumb-fallback';
  noPicture.textContent=meta.fallback;
  thumb.append(noPicture,picture);
  assignAssetImage(picture,noPicture,meta.url,true);
  const info=document.createElement('span');info.className='asset-card-info';
  const name=document.createElement('span');name.className='asset-title';name.textContent=a.title;
  const detail=document.createElement('span');detail.className='asset-card-meta';
  detail.textContent=meta.category+(meta.footprint?' · '+meta.footprint:'');
  const origin=document.createElement('span');origin.className='asset-origin '+(a.origin||'');origin.textContent=a.label;
  info.append(name,detail,origin);
  btn.append(thumb,info);
  btn.addEventListener('pointerenter',()=>previewAssetCard(a,meta));
  btn.addEventListener('focus',()=>previewAssetCard(a,meta));
  btn.onclick=()=>{
   previewAssetCard(a,meta);
   if(a.tag.startsWith('terrain:')){
    activeTerrain=a.tag.slice(8);
    $('terrainLabel').textContent=activeTerrain.toUpperCase();
    setMode('paint');tell('Paint '+activeTerrain+' · drag on canvas');
   }else if(replaceTarget&&a.tag.startsWith('sprite:')){
    replacePlacedAsset(replaceTarget,a.tag.slice(7));
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

window.addEventListener('semesta-vault-unlocked',event=>{
 // Rebuild unlocked-original references and reattempt source-name matching.
 rebuild();tell('Virtual Life assets unlocked · '+event.detail.count+' original images available');
});
window.addEventListener('semesta-vault-locked',()=>{
 // Restore preview art rather than retaining decrypted imagery in a canvas.
 rebuild();tell('Virtual Life asset vault locked · previews restored');
});
window.addEventListener('semesta-vault-apply',event=>{
 const path=event.detail?.path,selected=item();
 if(!window.VLAssetVault?.allowed(path)){tell('Original asset unavailable');return;}
 if(!selected){tell('Select building, vehicle, NPC or prop first.');return;}
 if(!['building','shop','sprite','virtual_asset','vehicle','quest_npc'].includes(selected.type)){
  tell('Select a compatible building, prop, vehicle or job NPC');return;
 }
 undoPoint();selected.assetPath=path;schema.normalize(selected,assetByName,style);
 rebuild();saved();tell('Original assigned: '+path.split('/').pop());
});
window.addEventListener('semesta-vault-place',async event=>{
 const path=event.detail?.path;
 if(!window.VLAssetVault?.allowed(path))return;
 pendingVaultCategory=['building','tree','prop'].includes(event.detail.category)?event.detail.category:'prop';
 try{
  const img=await window.VLAssetVault.getImage(path);
  pendingVaultImageSize={width:img.naturalWidth,height:img.naturalHeight};
 }catch{
  pendingVaultImageSize=null;
 }
 placementType='vault:'+encodeURIComponent(path);
 setMode('place');placementType='vault:'+encodeURIComponent(path);
 closeMobileSheets();
 tell('Tap map to place original '+path.split('/').pop());
});
window.addEventListener('semesta-vault-autolink',event=>{
 const matches=event.detail?.map||{},changed=[];
 for(const o of documentMap.objects){
  const name=o.type==='vehicle'?o.vehicleId:o.type==='quest_npc'?o.questId:null;
  if(name&&matches[name]&&!o.assetPath){
   changed.push(o.id);
  }
 }
 if(!changed.length){tell('No additional matching original image filenames');return;}
 undoPoint();
 for(const o of documentMap.objects){
  if(!changed.includes(o.id))continue;
  o.assetPath=matches[o.type==='vehicle'?o.vehicleId:o.questId];
 }
 rebuild();saved();
 tell(changed.length+' vehicles / job NPCs linked to original image references');
});

// Categorized bulk placeholder replacement. The original city map is never
// mutated until REPLACE ALL or RANDOMIZE is pressed; one undoPoint per batch.
const placeholderBatch=window.VLPlaceholderReplace;
function placeholderBatchSetup(){
 if(!placeholderBatch)return;
 const $choice=$('placeholderAssetChoices'),picked=new Map();
 const categorySelect=$('placeholderCategory'),modeSelect=$('placeholderMode');
 const scopeSelect=$('placeholderScope'),seedInput=$('placeholderSeed');
 const getSelected=()=>[...$choice.querySelectorAll('input:checked')].map(x=>x.value);
 function remember(){picked.set(categorySelect.value,getSelected());}
 function ensureOne(){
  if(modeSelect.value!=='single')return;
  const inputs=[...$choice.querySelectorAll('input[type=checkbox]')];
  const chosen=inputs.find(x=>x.checked)||inputs[0];
  for(const i of inputs)i.checked=i===chosen;
 }
 function refreshChoices(){
  const category=categorySelect.value,available=placeholderBatch.candidates(assetCatalog,category);
  const defaults=placeholderBatch.CATEGORIES.find(c=>c.id===category)?.defaults||[];
  const previous=picked.get(category)||defaults;
  $choice.replaceChildren();
  for(const spec of available){
   const label=document.createElement('label'),input=document.createElement('input');
   input.type='checkbox';input.value=spec.id;input.checked=previous.includes(spec.id);
   const name=document.createElement('span');name.textContent=spec.label;
   label.append(input,name);$choice.append(label);
  }
  if(!$choice.querySelector('input:checked')&&available.length)
   $choice.querySelector('input').checked=true;
  ensureOne();refreshSummary();
 }
 function refreshSummary(){
  const category=categorySelect.value,scope=scopeSelect.value;
  const targets=documentMap.objects.filter(o=>placeholderBatch.target(o,assetCatalog,category,scope)).length;
  const options=placeholderBatch.candidates(assetCatalog,category).length;
  $('placeholderSummary').textContent=targets+' objek target · '+options+
   ' aset pipeline tersedia · 1 batch = 1 Undo · koordinat tetap';
  $('placeholderApply').disabled=targets===0||options===0;
  $('placeholderShuffle').disabled=targets===0||options===0||modeSelect.value!=='mixed';
 }
 function applyBatch(){
  const category=categorySelect.value,selected=getSelected();
  if(!selected.length){tell('Pilih minimal satu aset pengganti.');return;}
  let result;
  try{
   result=placeholderBatch.replace(documentMap.objects,assetCatalog,{
    category,scope:scopeSelect.value,mode:modeSelect.value,
    selected,seed:Number(seedInput.value)||2026
   },(candidate,items)=>{
    style.normalize(candidate,assetByName);
    schema.normalize(candidate,assetByName,style);
    return !style.reason(candidate,items,documentMap.map,assetByName);
   });
  }catch(err){tell(err.message);return;}
  if(!result.changed){
   tell(result.skipped?result.skipped+' objek dilewati karena footprint / collision.':
    result.matched?'Semua objek sudah sesuai pilihan.':'Tidak ada placeholder pada kategori ini.');
   refreshSummary();return;
  }
  undoPoint();documentMap.objects=result.objects;
  rebuild();saved();refreshSummary();
  tell(result.changed+' '+category+' diganti'+(result.skipped?' · '+result.skipped+' dilewati (footprint)':'')+' · Undo tersedia');
 }
 $choice.onchange=e=>{
  if(modeSelect.value==='single'&&e.target.matches('input[type=checkbox]'))
   for(const i of $choice.querySelectorAll('input'))i.checked=i===e.target;
  remember();refreshSummary();
 };
 categorySelect.onchange=refreshChoices;
 scopeSelect.onchange=refreshSummary;
 modeSelect.onchange=()=>{ensureOne();remember();refreshSummary();};
 $('placeholderReplaceMenu').ontoggle=refreshSummary;
 $('placeholderApply').onclick=applyBatch;
 $('placeholderShuffle').onclick=()=>{
  seedInput.value=String(((Number(seedInput.value)||0)+1)>>>0);
  applyBatch();
 };
 refreshChoices();
}
placeholderBatchSetup();
refreshCharacterOptions();
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
 if(!current||actorType(current.type)||automaticType(current.type))return;
 replaceTarget=current.id;
 $('assetCategory').value=['building','shop'].includes(current.type)?'building':'all';
 $('searchAsset').value='';
 renderAssetList();
 $('assetsPanel').classList.add('mobile-open');
 $('inspector').classList.remove('mobile-open');
 tell('REPLACE '+current.name+' · pilih asset pengganti (posisi dan ID tetap)');
};
$('exportShortcut').onclick=()=>$('export').click();
renderAssetList();
const assetLibrary=window.VLSemestaAssetLibrary?.mount({
 catalog:()=>assetCatalog,
 vehicles:()=>trafficCatalog?.vehicles||[],
 grokVehicles:()=>window.VLGrokAssetReview?.items?.filter(x=>x.category==='vehicle')||[],
 characters:()=>mahluk?.list?.()||[],
 refreshCustom:()=>refreshBangunRuang(),
 thumbnail:spec=>assetThumbnails?.sourceFor?.(spec)||null,
 vehicleImage:(id,dir)=>trafficArt?.vehiclePreviewAsync?.(id,dir)||null,
 characterImage:(id,dir)=>window.VLCharacterRig?.characterPreview?.(id,dir)||null,
 replace:spec=>{
  const current=item();
  if(!current||!assetByName.has(spec.file)||spec.published===false)return false;
  const success=replacePlacedAsset(current.id,spec.file);
  if(success){replaceTarget=null;setMode('select');closeMobileSheets();}
  return success;
 },
 replaceTarget:()=>{const o=item();return o&&!actorType(o.type)&&!automaticType(o.type)?o:null;},
 place:spec=>{
  if(!assetByName.has(spec.file)||spec.published===false)return false;
  placementType='sprite:'+spec.file;
  setMode('place');placementType='sprite:'+spec.file;
  tell('Klik map untuk menempatkan '+spec.label);
  closeMobileSheets();return true;
 }
});
window.addEventListener('semesta-vehicle-source-loaded',()=>{renderAssetList();assetLibrary?.refresh();});

/* Local Membangun sync: apply authored buildings without reloading the map.
 * Preserve explicit per-instance edits, coordinate transforms, and draft state.
 * Never changes the protected original Virtual Life Online game.
 */
function refreshBangunRuang(){
 const bridge=window.VLBuildingBridge;
 if(!bridge)return;
 const oldByName=new Map(assetByName);
 const summary=bridge.refresh();
 const objects=window.VLBangunObjects?.refresh();
 assetCatalog=window.VLAssetCatalog||[];
 assetByName.clear();
 for(const spec of assetCatalog)assetByName.set(spec.file,spec);
 let updated=0,missing=0;
 const fields=['width','height','collision','layer','blocking','interactive','enterable',
  'entrance','interior','actionSlots','interactions','entranceFacing'];
 for(const obj of documentMap.objects){
  if(obj.type!=='sprite'||!
   (String(obj.asset||'').startsWith('studio:')||String(obj.asset||'').startsWith('object:')))continue;
  const next=assetByName.get(obj.asset),old=oldByName.get(obj.asset);
  if(!next){missing++;continue;}
  // A city instance can override actions/entry settings independently.
  // Only follow revisions from the studio when its value still matches the
  // former source prefab, so explicit local city edits are not overwritten.
  for(const field of fields){
   const prior=old?.[field];
   if(!old||JSON.stringify(obj[field])===JSON.stringify(prior)){
    if(next[field]!==undefined)obj[field]=clone(next[field]);
   }
  }
  updated++;
 }
 for(const texture of spriteTexture.values())texture.dispose();
 spriteTexture.clear();
 rebuild();updateSelection();renderAssetList();assetLibrary?.refresh();saved();
 tell('Bangun Ruang synced · '+summary.count+' buildings / '+(objects?.count||0)+' objects · '+updated+
  ' placed updated'+(missing?' · '+missing+' missing in studio':''));
}
async function refreshMahlukHidup(full=true){
 const stat=full?await mahluk?.load():mahluk?.localSync();
 if(full)trafficArt?.retrySources();
 refreshCharacterOptions();renderAssetList();
 window.VLCharacterRig?.retry();
 for(const tex of spriteTexture.values())tex.dispose();
 spriteTexture.clear();
 rebuild();updateSelection();
 tell(stat?.loaded===false?'Mahluk Hidup catalog unavailable; older game sprites retained':
  'Mahluk Hidup synced · '+(mahluk?.list().length||0)+' characters · '+(trafficArt?.originalCount()||0)+' original vehicle types');
}
$('refreshAssets').onclick=()=>refreshMahlukHidup(true);
// Rebuild live instances when Mahluk 2.0 publishes on another same-origin tab.
window.addEventListener('storage',e=>{
 if(e.key==='mahluk-2-library-v1')refreshMahlukHidup(false).catch(console.warn);
});
$('syncBangunObjects').onclick=refreshBangunRuang;
// A building saved from Bangun Ruang edits ONE placed instance in the
// already-open named City Draft. Patch that instance here without replacing
// the rest of the live 3D map (unsaved roads, NPCs and placements survive).
const cityBuildingLink=window.VLSemestaCityBuildings;
let lastCityBuildingNotice=null;
try{lastCityBuildingNotice=localStorage.getItem(cityBuildingLink?.UPDATE_KEY||'virtual-life-city-building-update-v1');}catch{}
function reconcileExternalCityBuilding(raw){
 if(!raw||raw===lastCityBuildingNotice)return;
 lastCityBuildingNotice=raw;
 let notice;
 try{notice=JSON.parse(raw);}catch{return;}
 if(!cityBuildingLink||notice?.draftId!==activeDraftId)return;
 const index=documentMap.objects.findIndex(o=>o.id===notice.objectId);
 if(index<0)return;
 const asset=cityBuildingLink.getAsset(notice.assetId);
 if(!asset){tell('City building update unavailable · refresh Bangun Ruang assets');return;}
 try{
  const wasDirty=draftDirty;
  // Rebuild the current catalog first to register the newly authored sprite.
  refreshBangunRuang();
  const updated=notice.interiorOnly?cityBuildingLink.replaceInterior(documentMap.objects[index],asset):
    cityBuildingLink.replaceInstance(documentMap.objects[index],asset);
  style.normalize(updated,assetByName);schema.normalize(updated,assetByName,style);
  documentMap.objects[index]=updated;
  rebuild();updateSelection();saved();
  draftDirty=wasDirty;
  if(!wasDirty)$('saveStatus').textContent='● City Draft building synced';
  tell('✓ Bangun Ruang → '+asset.name+' updated in '+(documentMap.map?.name||'Semesta'));
 }catch(error){tell('⚠ City building sync failed: '+error.message);}
}
window.addEventListener('storage',e=>{
 if(['virtual-life-character-storage-v1','virtual-life-accessory-equipment-v1',
     'virtual-life-accessories-v1'].includes(e.key))refreshMahlukHidup(false);
 if([window.VLActionTemplates?.key,window.VLActionTemplates?.frameKey].includes(e.key)){
  window.VLActionTemplates?.invalidate();window.VLActionFrames?.invalidate();
  for(const holder of rigs.values())holder.rig?.refresh?.();
  updateSelection();
 }
 if(e.key===window.VLBuildingBridge?.key||e.key===window.VLBangunObjects?.key)refreshBangunRuang();
 if(e.key===cityBuildingLink?.UPDATE_KEY)reconcileExternalCityBuilding(e.newValue);
});
// Backgrounded mobile tabs can miss a StorageEvent while suspended.
// Reconciling on focus also covers a same-tab visit back from Bangun Ruang.
let lastBuildingPayload=null,lastObjectPayload=null;
try{lastBuildingPayload=localStorage.getItem(window.VLBuildingBridge?.key||'virtual-life-bangun-ruang-v1');
 lastObjectPayload=localStorage.getItem(window.VLBangunObjects?.key||'virtual-life-bangun-objects-v1');}catch{}
window.addEventListener('focus',()=>{
 try{reconcileExternalCityBuilding(localStorage.getItem(cityBuildingLink?.UPDATE_KEY||'virtual-life-city-building-update-v1'));}catch{}
 let next;
 try{next=localStorage.getItem(window.VLBuildingBridge?.key||'virtual-life-bangun-ruang-v1');}catch{return;}
 let nextObjects;
 try{nextObjects=localStorage.getItem(window.VLBangunObjects?.key||'virtual-life-bangun-objects-v1');}catch{}
 if(next!==lastBuildingPayload||nextObjects!==lastObjectPayload){
  lastBuildingPayload=next;lastObjectPayload=nextObjects;refreshBangunRuang();}
 window.VLActionTemplates?.invalidate();window.VLActionFrames?.invalidate();
 updateSelection();
});
if(window.VLHub){
 window.VLHub.subscribe(['rooms','objects'],()=>refreshBangunRuang());
 window.VLHub.subscribe(['characters','accessories','emotions'],()=>{refreshMahlukHidup(false).catch(console.warn);});
 window.VLHub.subscribe('cityBuilding',msg=>{
  try{reconcileExternalCityBuilding(JSON.stringify(msg.payload||{}));}catch{}
 });
 window.VLHub.subscribe('world',()=>{refreshDraftPicker(activeDraftId).catch(console.warn);});
}

$('openGame').onclick=()=>{}; // old Virtual Life archive removed
$('viewRef').onclick=()=>{
 $('assetReference').hidden=false;
 const img=$('street2Ref');
 if(img&&img.dataset.src&&!img.dataset.bound){
  img.dataset.bound='1';
  img.addEventListener('error',()=>{img.removeAttribute('src');img.hidden=true;});
  img.src=img.dataset.src;
 }
};
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
   id:asNew?null:activeDraftId,name,document:mapForPersist()
  });
  activeDraftId=result.id;draftDirty=false;
  try{localStorage.setItem(ACTIVE_DRAFT_KEY,result.id);}catch{}
  $('saveStatus').textContent='● City Draft saved';
  $('draftName').value=name;
  await refreshDraftPicker(result.id);
  tell('City Draft saved: '+name);
  // Only a successful named local Save can request optional Google Drive backup.
  try{
   const cloudRecord=await drafts.load(result.id);
   window.dispatchEvent(new CustomEvent('membangun:local-saved',{
    detail:{app:'semesta',kind:'city',record:cloudRecord}
   }));
  }catch(error){console.warn('Optional cloud save event unavailable',error)}
  return result;
 }catch(error){
  documentMap.map.name=previousName;
  throw error;
 }
}

// Google Drive storage adapter: named City Drafts only, never live game state.
// Cloud imports are validated, backed up locally and explicitly opened in this editor.
window.MembangunCloudAdapter=Object.freeze({
 app:'semesta',
 async prepareLocalSync(){
  // If the user edited their already-named city while offline, preserve its working
  // copy before comparing PC/HP versions. A new unsaved scene is not published.
  await persistWorkingCityForCloud();
 },
 async assetCatalogSnapshot(){return assetLibrary?.assetCatalogSnapshot?.()||null;},
 async assetLocalRecords(){return assetLibrary?.assetLocalRecords?.()||[];},
 async importRemoteQuiet(payload){
  if(payload?.app!=='semesta'||!payload.record)throw Error('Not a Semesta cloud record');
  if(payload.kind==='assetBuilding'||payload.kind==='assetObject'){
   if(!assetLibrary?.importRemoteQuiet)throw Error('Asset Library unavailable');
   await assetLibrary.importRemoteQuiet(payload);return;
  }
  if(payload.kind!=='city'||payload.record.format!=='vl-city-draft-1'||
     !Array.isArray(payload.record.document?.objects))throw Error('Invalid remote city document');
  const record=payload.record,db=window.VLCityDrafts;
  let old=null;try{old=await db.load(record.id)}catch{}
  if(old&&JSON.stringify(old.document)!==JSON.stringify(record.document)){
   await db.save({id:null,name:old.name+' · Before Cloud Sync',document:old.document});
  }
  await db.save({id:record.id,name:record.name,document:record.document});
  await refreshDraftPicker(activeDraftId);
  // No camera jumps, city placement or scene replacement during background sync.
 },
 async currentRecord(){
  if(!activeDraftId)return null;
  return {kind:'city',record:await window.VLCityDrafts.load(activeDraftId)};
 },
 async localRecords(){
  const rows=await window.VLCityDrafts.list();
  const docs=await Promise.all(rows.map(x=>window.VLCityDrafts.load(x.id).catch(()=>null)));
  return docs.filter(Boolean).map(record=>({kind:'city',record}));
 },
 async importRemote(payload){
  const record=payload?.record;
  if(payload?.kind!=='city'||record?.format!=='vl-city-draft-1'||
     !Array.isArray(record.document?.objects))throw Error('Incompatible Semesta City Draft');
  const errors=schema.validate(record.document,assetByName,style);
  if(errors.length)throw Error('Drive city not valid: '+errors.join('; '));
  let original=null;
  try{original=await window.VLCityDrafts.load(record.id)}catch{}
  if(original){
   // Preserve the last local version as a distinct named backup before replacing.
   await window.VLCityDrafts.save({id:null,name:original.name+' / Before Drive',document:original.document});
  }
  const imported=await window.VLCityDrafts.save({id:record.id,name:record.name,document:record.document});
  const migrated=window.VLKebonSirihStyle?.upgrade(record.document,assetCatalog);
  if(cameraFollowId)leaveCharacterCamera(false);
  undoPoint();
  documentMap=sanitize(migrated?.map||record.document);
  restoreCityClock();selectedId=null;activeDraftId=imported.id;
  draftDirty=!!migrated?.changed;
  try{localStorage.setItem(ACTIVE_DRAFT_KEY,activeDraftId)}catch{}
  rebuild();rebuildTerrain();resetCamera();saved();
  draftDirty=!!migrated?.changed;
  $('saveStatus').textContent='☁ Drive City opened'+(migrated?.changed?' / Save upgraded copy':'');
  await refreshDraftPicker(activeDraftId);
  tell('✓ Opened Drive City: '+record.name+' / local draft backed up');
 }
});

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
  const migrated=window.VLKebonSirihStyle?.upgrade(record.document,assetCatalog);
  if(cameraFollowId)leaveCharacterCamera(false);
  undoPoint();documentMap=sanitize(migrated?.map||record.document);restoreCityClock();
  selectedId=null;activeDraftId=record.id;draftDirty=!!migrated?.changed;
  try{localStorage.setItem(ACTIVE_DRAFT_KEY,record.id);}catch{}
  rebuild();rebuildTerrain();resetCamera();saved();draftDirty=!!migrated?.changed;
  $('saveStatus').textContent=migrated?.changed?
   '● Kebon Sirih upgrade · Save City to keep':'● City Draft opened';
  closeDraftDialog();
  tell('Opened: '+record.name+(migrated?.changed?' · '+migrated.changed+' placeholder diperbarui, Save City untuk menyimpan':''));
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
  undoPoint();documentMap=sanitize(window.VLKebonSirihStyle?.upgrade(reference,assetCatalog).map||reference);restoreCityClock();selectedId=null;
  activeDraftId=null;draftDirty=true;
  try{localStorage.removeItem(ACTIVE_DRAFT_KEY);}catch{}
  closeMobileSheets();setMode('select');
  rebuild();rebuildTerrain();resetCamera();saved();
  tell('Reference City ready · tap Save Draft to keep a named copy');
 }catch(error){tell('Reference City gagal: '+error.message);}
}
$('referenceCity').onclick=loadReferencePreset;
async function loadJakartaCity(){
 if(!window.VLJakartaCity||!window.VLCityDrafts){tell('Jakarta preset belum tersedia');return;}
 if(!confirm('Create Jakarta City as a NEW saved city? Current unsaved canvas will be replaced. Save it first if needed.'))return;
 try{
  const jakarta=window.VLJakartaCity.create(defaultSeed,assetByName,style,schema);
  const upgraded=window.VLKebonSirihStyle?.upgrade(jakarta,assetCatalog)?.map||jakarta;
  const fresh=sanitize(upgraded);
  fresh.map.name='Jakarta City';
  const record=await window.VLCityDrafts.save({id:null,name:'Jakarta City',document:clone(fresh)});
  if(cameraFollowId)leaveCharacterCamera(false);
  undoPoint();documentMap=fresh;restoreCityClock();selectedId=null;
  activeDraftId=record.id;draftDirty=false;
  try{localStorage.setItem(ACTIVE_DRAFT_KEY,activeDraftId);}catch{}
  closeMobileSheets();setMode('select');
  rebuild();rebuildTerrain();resetCamera();saved();
  draftDirty=false;
  await refreshDraftPicker(activeDraftId);
  tell('Jakarta City · '+fresh.objects.length+' objects / '+fresh.map.terrain.cells.filter(c=>c.type==='drain').length+' drain tiles / '+fresh.map.terrain.cells.filter(c=>c.type==='river').length+' river tiles · saved');
 }catch(error){console.error('Jakarta City',error);tell('Jakarta City gagal: '+error.message);}
}
$('jakartaCity').onclick=loadJakartaCity;

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
 return sanitize(window.VLKebonSirihStyle?.upgrade(city,assetCatalog).map||city);
}
$('newCity').onclick=()=>{
 if(!confirm('Start City Sample? Map draft saat ini akan diganti. Gunakan Save City untuk menyimpan layout lama.'))return;
 if(cameraFollowId)leaveCharacterCamera(false);
 undoPoint();documentMap=makeCityExample();restoreCityClock();selectedId=null;
 activeDraftId=null;draftDirty=true;
 try{localStorage.removeItem(ACTIVE_DRAFT_KEY);}catch{}
 rebuild();rebuildTerrain();resetCamera();saved();
 tell('City Sample ready · roads, park, water, placeholders');
};
$('reset').onclick=()=>{
 if(!confirm('Reset seluruh map draft 3D ke default?'))return;
 if(cameraFollowId)leaveCharacterCamera(false);
 undoPoint();documentMap=clone(defaultSeed);restoreCityClock();selectedId=null;
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
   undoPoint();documentMap=d;restoreCityClock();selectedId=null;
   activeDraftId=null;draftDirty=true;
   try{localStorage.removeItem(ACTIVE_DRAFT_KEY);}catch{}
   rebuild();rebuildTerrain();resetCamera();saved();tell('Map imported as working copy');
 }catch(err){tell('Import gagal: '+err.message);}
 e.target.value='';
};
window.addEventListener('keydown',e=>{
 if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement||
  e.target instanceof HTMLTextAreaElement||e.target?.isContentEditable)return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();restoreStack(undoStack,redoStack);}
  else if(e.key.toLowerCase()==='e'&&mode==='walk'){e.preventDefault();if(!window.SemestaLifePlay?.handleAction?.())enterNearbyBuilding();}
 else if(e.key.toLowerCase()==='h'){toggleGrid();}
 else if(e.key==='Delete'&&item())remove();
 else if(e.key.toLowerCase()==='g')setMode('move');
 else if(e.key.toLowerCase()==='p')setMode('pan');
 else if(e.key==='Escape')select(null);
});
window.addEventListener('error',e=>{console.error('World Builder runtime',e.error);});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();fail.style.display='flex';fail.textContent='WebGL context lost. Reload editor; changes are saved locally.';});
interiorPreview=window.VLSemestaInteriorPreview?.mount({
 getSelected:()=>item(),catalog:assetByName,message:tell,
 previewAction:(prop,action)=>{
  const pose=window.VLBuildingInterior?.poseFor?.(prop?.assetId,prop?.actionId)??action?.pose;
  if(!pose)return false;
  const avatar=documentMap.objects.find(o=>actorType(o.type)&&rigs.has(o.id));
  if(!avatar)return false;
  const rig=rigs.get(avatar.id)?.rig;
  if(!rig)return false;
  rig.setPose(pose);renderer.render(scene,camera);return true;
 }
})||null;
// The visual clock is game-time, independent of the editing and Walk Test
// simulation. Screen-space shadows use live roots, including moving crowds.
const worldEffects=window.VLSemestaWorldEffects.makeWorldEffects({
 THREE,scene,camera,canvas,tint:$('dayNightTint'),glows:$('nightGlow'),
 getObjects:()=>documentMap.objects,
 getRoot:id=>owners.get(id),
 getAgent:id=>automatedAgents.get(id),
 getCategory:o=>style.category(o,assetByName),
 getFootprint:o=>style.footprint(o,assetByName),
 getSpec:o=>assetByName.get(o.asset),
 isOutline:()=>buildingViewMode==='outline'
});
let clockLastHUD='',clockLastSaved=0,clockOpen=false;
function updateClockHUD(force=false){
 const snapshot=dayClock.get(),solar=dayClock.solar();
 const time=dayClock.label(),day=''+snapshot.day;
 const label=time+'/'+day+'/'+snapshot.speed+'/'+snapshot.paused+'/'+solar.phase;
 if(force||label!==clockLastHUD){
  clockLastHUD=label;
  $('timeDisplay').textContent=time;
  $('timeDay').textContent=dayClock.weekday()+' · DAY '+String(snapshot.day).padStart(2,'0');
  $('timePhase').textContent=solar.phase;
  $('timeIcon').textContent=solar.phase==='MALAM'?'☾':
   solar.phase==='SENJA'?'☽':solar.phase==='FAJAR'?'◒':'☀';
  $('timePause').textContent=snapshot.paused?'▶ Play':'Ⅱ Pause';
  $('timePause').setAttribute('aria-pressed',String(snapshot.paused));
  $('timeSpeed').value=String(snapshot.speed);
  $('timeScrubLabel').textContent=time;
  if(document.activeElement!==$('timeScrub'))$('timeScrub').value=String(Math.floor(snapshot.minute));
 }
}
function openTimePanel(open){
 clockOpen=!!open;
 $('timePanel').hidden=!clockOpen;
 $('timeToggle').setAttribute('aria-expanded',String(clockOpen));
}
$('timeToggle').onclick=()=>openTimePanel(!clockOpen);
$('timeScrub').oninput=()=>{
 dayClock.setMinute($('timeScrub').value);
 updateClockHUD(true);worldEffects.update(.2,dayClock.solar(),true);
 renderer.render(scene,camera);
};
$('timeScrub').onchange=()=>{syncClockToMap();saved();};
$('timePause').onclick=()=>{
 dayClock.setPaused(!dayClock.get().paused);updateClockHUD(true);saved();
};
$('timeSpeed').onchange=()=>{
 dayClock.setSpeed($('timeSpeed').value);updateClockHUD(true);saved();
};
$('timeMorning').onclick=()=>{
 dayClock.setMinute(7*60);updateClockHUD(true);
 worldEffects.update(.2,dayClock.solar(),true);saved();
};
document.addEventListener('pointerdown',e=>{
 if(clockOpen&&!$('worldClockHud').contains(e.target))openTimePanel(false);
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&clockOpen)openTimePanel(false);
});
rebuild();resetCamera();resize();saved();updateClockHUD(true);
ensureDeviceChrome();bootDeviceFrame();
addEventListener('resize',()=>fitDeviceStage());
worldEffects.update(.2,dayClock.solar(),true);
let priorFrame=performance.now();
function frame(now){
 requestAnimationFrame(frame);
 const elapsedReal=Math.min(.5,Math.max(0,(now-priorFrame)/1000));
 const dt=Math.min(.05,elapsedReal);priorFrame=now;
 dayClock.tick(elapsedReal);
 updateClockHUD();
 clockLastSaved+=elapsedReal;
 // Save the running virtual time at low frequency, without dirtying the
 // geometry/draft or hammering localStorage at 60 frames per second.
 if(clockLastSaved>=25){
  clockLastSaved=0;
  try{syncClockToMap();localStorage.setItem(STORE,JSON.stringify(mapForPersist()));}catch{}
 }
 if(mode==='walk'&&walkActorId&&rigs.has(walkActorId)&&!(window.VLSpawnHobo&&window.VLSpawnHobo.busy())){
   const holder=rigs.get(walkActorId);
   let dx=Number(walkInput.right)-Number(walkInput.left);
   let dz=Number(walkInput.down)-Number(walkInput.up);
   const len=Math.hypot(dx,dz);
   if(len>.1){
     dx/=len;dz/=len;
     const speed=playWorldSpeed();
     // Physics is checked on the unsaved live actor position, not the
     // initial JSON spawn. Swept substeps prevent tunneling; blocked diagonal
     // movement slides along the X or Z wall instead of freezing.
     const actor=documentMap.objects.find(o=>o.id===walkActorId);
     if(actor){
      const live=new Map([...rigs].map(([id,rec])=>[id,rec.root.position]));
      const start={x:holder.root.position.x,z:holder.root.position.z};
      let next=physics.move(actor,start,dx*speed*dt,dz*speed*dt,
       simulationObstacles(),documentMap.map,assetByName,style,live);
      const TL=window.VLSemestaTrafficLights;
      const tlSet=trafficLightSettings();
      const tlPhase=tlSet.enabled&&TL?TL.phaseAt(trafficLightTime,tlSet.cycleSeconds):null;
      if(TL&&tlPhase){
       const held=TL.constrainPlayer(start,next,documentMap.map,documentMap.objects,tlPhase);
       if(held.x!==next.x||held.z!==next.z){
        next={x:held.x,z:held.z,moved:held.x!==start.x||held.z!==start.z};
       }
      }
      holder.root.position.x=next.x;
      holder.root.position.z=next.z;
      holder.rig.setMoving(next.x-start.x,next.z-start.z,next.moved);
     }
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
 if(!trafficLightFrozen){trafficLightTime+=dt;updateAutomated(dt);}refreshTrafficLights();
 for(const riders of transportRiders.values())riders.step(dt,camera);
 if(activeAssetAimId&&!cameraFollowId){
  const target=activeAssetCamera?.target(documentMap.objects,owners,activeAssetAimId);
  if(!target)cancelActiveAssetAim();
  else{
   const move=activeAssetCamera.ease(cameraFocus,target,dt);
   if(move.moved)fitCamera();
   if(move.arrived&&!activeAssetTracking)activeAssetAimId=null;
  }
 }
 if(highlight&&selectedId&&automatedAgents.has(selectedId))highlight.update();
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
   const groundBundle=plane.userData.groundBundle;
   if(groundBundle&&spec&&pipelineGround){
    const dir=spriteDirection(root.rotation.y*180/Math.PI);
    if(dir!==groundBundle.view){
     pipelineGround.configure(THREE,groundBundle,spec,dir,pixelTexture(key,dir),pixelDepthTexture(key,dir));
    }
    pipelineGround.faceCamera(groundBundle,root,camera);
    continue;
   }
   if(spec&&['pipeline-street','custom-building'].includes(spec.source)){
     const dir=spriteDirection(root.rotation.y*180/Math.PI);
     if(dir!==plane.userData.displayFacing){
       plane.material.map=pixelTexture(key,dir);
       plane.material.needsUpdate=true;
       plane.userData.displayFacing=dir;plane.userData.aspectFixed=false;
       const native=spec.variants?.[dir]||spec.variants?.sw||spec.variants?.se;
       if(native?.size&&native?.pivot){
         plane.userData.pivotY=native.pivot[1]/native.size[1];
         plane.userData.pivotX=(native.size[0]/2-native.pivot[0])/native.size[0];
       }
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
     const authoredPivot=plane.userData.pivotY??.8;
     plane.position.y=realH*(authoredPivot-.5);
     plane.position.x=realW*(plane.userData.pivotX||0);
     // Non-depth-mapped art is a vertical plane. Its visible opaque feet can
     // be BELOW the metadata pivot and vanish behind the raised terrain.
     // Ground the lowest opaque row instead; retain depth tests and world XY.
     // Native depth-mapped facades and custom studio buildings use their own
     // independent physical/compositing grounding, so don't alter them here.
     if(!plane.userData.studioGroundComposite&&!vegetationGround?.isTree(spec)){
      const contact=window.VLSemestaWheelGround?.contact(img,authoredPivot);
      const ratio=Math.max(authoredPivot,contact?.source==='authored-fallback'?1:(contact?.ratio??1));
      plane.position.y=realH*(ratio-.5)+.055;
      plane.userData.autoGround=true;
      plane.userData.nativeContactRatio=ratio;
      plane.userData.nativeContactSource=contact?.source||'bottom-fallback';
     }
     // For 22 published tree species the authored pipeline pivot is under
     // the trunk, but the grass skirt may extend below it in 2:1 space.
     // Seat the lowest OPAQUE root/skirt pixels on the terrain automatically
     // (while retaining the normal WebGL depth test and character occlusion).
     if(vegetationGround?.isTree(spec)){
      const contact=vegetationGround.anchor(spec,img,realH);
      if(contact){
       plane.position.y=contact.y;
       plane.userData.autoGround=true;
       plane.userData.nativeContactRatio=contact.ratio;
       plane.userData.nativeContactSource=contact.source;
      }
     }
     plane.userData.aspectFixed=true;
   }
   const yaw=Math.atan2(camera.position.x-root.position.x,camera.position.z-root.position.z);
   plane.rotation.y=yaw-root.rotation.y;
 }
 updateLargeOcclusion(dt);
 try{window.VLSpawnHobo&&window.VLSpawnHobo.tick(dt,camera);}catch{}
 try{window.SemestaLifePlay?.tick?.(dt);}catch(err){console.warn('life play tick',err);}
 worldEffects.update(elapsedReal,dayClock.solar());
 renderer.render(scene,camera);
}
requestAnimationFrame(frame);
