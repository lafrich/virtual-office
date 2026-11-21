/* Playable KOST and WARTEG interiors for Mainkan player mode. PREVIEW only.
 * Kost uses Ellen's njh_kos. Warteg uses the Kharisma Bahari Bangun Ruang
 * layout (faithful placement + baked wall paint); Ellen's njh_warung_makan
 * remains on disk as fallback. Camera/walls come from VLSemestaInteriorView.
 * Does not mutate the authoring draft. Not live.
 */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.VLNjhPlayInteriors=api;
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:null,function(root){
'use strict';
const View=root?.VLSemestaInteriorView||(typeof require==='function'?require('./semesta-interior-view.js'):null);
const PIXEL_WORLD=View?.PIXEL_WORLD||Math.SQRT2/64, VERTICAL_COMP=View?.VERTICAL_COMP||2/Math.sqrt(3);
const DIR=['sw','se','ne','nw'];
const TEMPLATES={kost:'njh_kos',warteg:'njh_warteg_kharisma',minimarket:'njh_minimarket'};
const FALLBACK={warteg:'njh_warung_makan'};
const ROOM_SCENES=['njh_kos_cove_lobby','njh_kos_ichsan','njh_kos_noor'];
const PUBLIC_SCENES=['njh_laundry','njh_bengkel','njh_wc_mandi_umum','njh_rumah_biasa','njh_mushola','njh_koperasi','njh_toko_loak','njh_warung_madura','njh_nasi_sunda','njh_pecel_lele_tenda','njh_sate_madura_tenda'];
const LOBBY_ID='njh_kos_cove_lobby';
const ACTION_LABELS={sleep:'Tidur',store_fridge:'Simpan Kulkas',take_fridge:'Ambil dari Kulkas',
 store_home:'Simpan di Kost',take_home:'Ambil dari Kost',cook:'Masak Ikan',cook_recipe:'Masak Resep',
 wash:'Cuci',home_shower:'Mandi Kost',home_toilet:'WC Kost',bathe:'Mandi Kost',use_toilet:'WC Kost',
 exit_interior:'Keluar',enter_room:'Masuk'};
const MEAL_PRICE=12000;
const ENTER_RADIUS=2.2;
const ORIGIN={kost:{x:240,z:0},warteg:{x:260,z:0},minimarket:{x:280,z:0},public:{x:240,z:0},lobby:{x:240,z:0}};
const KOST_PATTERN=/kost|kos_|boarding.?room|cove|kamar.?sewa/i;
const WARTEG_PATTERN=/warteg|warung|nasi|food.vendor/i;
const MINIMARKET_PATTERN=/minimarket|njh.?mart|swalayan/i;
const PLAY_KOST_ID='__njh_play_kost__';
const NAME={kost:'Kost',warteg:'Warteg',minimarket:'NJH Mart',lobby:'Lobi kost',public:'Interior'};

function mapPreviewInteriorsBase(){
 try{
  const scripts=root.document?.getElementsByTagName('script')||[];
  for(let i=scripts.length-1;i>=0;i--){
   const src=scripts[i].src||'';
   if(/njh-map-preview\.js/.test(src))
    return src.replace(/njh-map-preview\.js(?:\?.*)?$/,'njh-map-preview/interiors/');
  }
 }catch(_e){}
 return './njh-map-preview/interiors/';
}
function readyTemplateIds(){
 const always=[...Object.values(TEMPLATES),...Object.values(FALLBACK),...ROOM_SCENES,...PUBLIC_SCENES];
 try{
  const t=root.VLNjhMapPreview?.readyTemplates;
  if(Array.isArray(t)&&t.length)return [...new Set([...always,...t])];
 }catch(_e){}
 return always;
}
function hasReadyInterior(obj){
 if(!obj)return false;
 if(obj.interior&&obj.njhInteriorPending!==true)return true;
 return Array.isArray(obj.njhDoors)&&obj.njhDoors.some(d=>d&&d.interior&&!d.pending);
}
function baseUrl(){
 try{
  const scripts=root.document?.getElementsByTagName('script')||[];
  for(let i=scripts.length-1;i>=0;i--){
   const src=scripts[i].src||'';
   if(/njh-play-interiors\.js/.test(src))
    return src.replace(/njh-play-interiors\.js(?:\?.*)?$/,'njh-play-interiors/');
  }
 }catch(_e){}
 return './njh-play-interiors/';
}
function dirFor(rot){return DIR[(Math.round((((Number(rot)||0)%360+360)%360)/90)%4)]||'sw';}
function num(v,d){const n=Number(v);return Number.isFinite(n)?n:(d??0);}
function textOf(o){return [o?.id,o?.name,o?.label,o?.asset,o?.type].filter(Boolean).join(' ');}
function AccessApi(){
 try{if(typeof require==='function')return require('./semesta-room-access.js');}catch(_e){}
 return root?.SemestaRoomAccess||null;
}
function doorUseWorld(origin,door){
 if(Array.isArray(door?.usePoint)&&door.usePoint.length>=2)
  return {x:origin.x+num(door.usePoint[0]),z:origin.z+num(door.usePoint[1])};
 if(Array.isArray(door?.useTile)&&door.useTile.length>=2)
  return {x:origin.x+num(door.useTile[0])+0.5,z:origin.z+num(door.useTile[1])+0.5};
 return {x:origin.x+num(door?.c,0)+0.5,z:origin.z+num(door?.r,0)+1.5};
}
function sceneDoors(sc){
 const all=[...(sc?.doors||[]),...(sc?.exits||[])];
 const seen=new Set();
 return all.filter(d=>{
  if(!d)return false;
  const id=d.id;if(!id)return true;
  if(seen.has(id))return false;seen.add(id);return true;
 });
}
function isExitDoor(d){return !!(d&&(d.role==='exit'||d.to==='street'||d.exitTo==='street'));}

function wrapInterior(scene){
 if(!scene)return null;
 return {format:'virtual-life-interiors-v1',
  floors:[Object.assign({},scene,{format:'virtual-life-interior-v1',floor:scene.floor||1})]};
}
function tilePos(origin,item,foot){
 const rot=num(item.rotation,0);
 let fw=num(foot?.[0],1),fd=num(foot?.[1],1);
 if(rot%180===90){const t=fw;fw=fd;fd=t;}
 return {x:origin.x+num(item.c,0)+fw/2,z:origin.z+num(item.r,0)+fd/2,fw,fd,rot};
}
function doorWorld(building){
 // Prefer Ellen's authored use tile; the art pivot / building centre is NOT a door.
 const authored=(building?.njhDoors||[]).find(d=>d&&!d.pending&&(d.use||d.usePoint));
 const point=authored?.use||authored?.usePoint;
 if(point){
  const x=Array.isArray(point)?point[0]:point.x,z=Array.isArray(point)?point[1]:point.z;
  if(Number.isFinite(Number(x))&&Number.isFinite(Number(z)))return {x:Number(x),z:Number(z)};
 }
 if(building?.njhUsePoint&&Number.isFinite(Number(building.njhUsePoint.x)))
  return {x:Number(building.njhUsePoint.x),z:Number(building.njhUsePoint.z)};
 const x=num(building?.x,0),z=num(building?.z,0);
 const d=Math.max(2,num(building?.d,building?.footprint?.[1],3));
 return {x,z:z+d/2+0.9};
}

function create(opts){
 opts=opts||{};
 const THREE=opts.THREE,scene=opts.scene;
 let catalog=opts.catalog||null,scenes=opts.scenes||{},images=new Map();
 let group=null,session=null,hidden=[],outdoorHidden=false,billboards=[],buildings={};
 const storage=opts.storage||(typeof localStorage!=='undefined'?localStorage:null);

 async function loadAssets(){
  const base=opts.baseUrl||baseUrl();
  if(!catalog){
   const r=await fetch(base+'catalog.json',{cache:'no-cache'});
   catalog=r.ok?await r.json():{items:{}};
  }
  const items=catalog.items||catalog;
  const wanted=new Set(readyTemplateIds());
  const mapBase=mapPreviewInteriorsBase();
  const publicIds=new Set(PUBLIC_SCENES);
  await Promise.all([...wanted].map(async id=>{
   if(scenes[id])return;
   const file=id+'.interior-scene.json';
   // Public r7 scenes live under njh-map-preview/interiors/. Play-first
   // scenes live under njh-play-interiors/. Pick the owning base first so
   // the other path is not probed (that 404s every load).
   const urls=publicIds.has(id)?[mapBase+file,base+file]:[base+file,mapBase+file];
   for(const url of urls){
    try{const r=await fetch(url,{cache:'no-cache'});
     if(r.ok){scenes[id]=await r.json();break;}}catch(_e){}
   }
  }));
  const files=new Set();
  for(const typ of Object.values(items)){
   for(const view of Object.values(typ||{}))if(view?.file)files.add(view.file);
  }
  for(const sc of Object.values(scenes)){
   for(const d of sceneDoors(sc)){
    if(d.sprite)files.add(d.sprite);
    for(const v of Object.values(d.sprites||{}))if(typeof v==='string')files.add(v);
   }
  }
  function loadImg(file){return new Promise(resolve=>{
   if(images.has(file))return resolve();
   const img=new Image();
   let tried=0;
   const srcs=file.startsWith('../')?[base+file]:
    [file.startsWith('art/')?base+file:base+'art/'+file];
   img.onload=()=>{images.set(file,img);resolve();};
   img.onerror=()=>{if(tried<srcs.length-1){img.src=srcs[++tried];}else resolve();};
   img.src=srcs[0];
  });}
  await Promise.all([...files].map(loadImg));
  return {catalog,scenes,ready:images.size};
 }

 function findBuilding(kind,world){
  const objects=world?.objects||opts.getWorld?.()?.objects||[];
  const pat=kind==='kost'?KOST_PATTERN:kind==='minimarket'?MINIMARKET_PATTERN:WARTEG_PATTERN;
  const notMart=o=>kind==='minimarket'||!MINIMARKET_PATTERN.test(textOf(o));
  const matches=objects.filter(o=>o.id!==PLAY_KOST_ID&&o.type==='sprite'&&pat.test(textOf(o))&&notMart(o));
  // An authored NJH entrance must win over a generic "warung" label.
  const primary=matches.find(o=>kind==='warteg'?(/warteg/i.test(textOf(o))||o.njhInteriorTemplate===TEMPLATES.warteg):
   kind==='minimarket'?(/minimarket|njh.?mart/i.test(textOf(o))):(/cove|njh-kos-noor/i.test(textOf(o))));
  return primary||matches[0]||objects.find(o=>o.id===PLAY_KOST_ID&&kind==='kost')||null;
 }

 function ensureKost(world){
  if(!world||!Array.isArray(world.objects))return null;
  const existing=findBuilding('kost',world);
  if(existing)return existing;
  const warteg=findBuilding('warteg',world);
  const x=warteg?num(warteg.x,16)-15:16.5;
  const z=warteg?num(warteg.z,25):25;
  const kost={id:PLAY_KOST_ID,type:'sprite',asset:'pipeline:rumah_kampung_a',
   name:'Kost',label:'Kost',x,z,rotation:0,scale:1,layer:'structure',
   collision:true,blocking:'auto',enterable:true,interactive:true,
   tags:['play-only','njh-play-interior'],playOnly:true};
  world.objects.push(kost);
  if(typeof opts.onAddObject==='function')opts.onAddObject(kost);
  return kost;
 }

 function adoptWiredScenes(world){
  for(const obj of world.objects||[]){
   const add=(id,interior)=>{
    if(!id||scenes[id]||!interior)return;
    const floor=interior.floors&&interior.floors[0];
    if(floor)scenes[id]=floor;
    else if(interior.format||interior.items)scenes[id]=interior;
   };
   add(obj.njhInteriorTemplate,obj.interior);
   for(const d of obj.njhDoors||[])add(d.template,d.interior);
  }
 }
 function wireWorld(world){
  if(!world)return buildings;
  adoptWiredScenes(world);
  const kost=ensureKost(world);
  const warteg=findBuilding('warteg',world);
  const minimarket=findBuilding('minimarket',world);
  buildings={};
  for(const [kind,obj] of [['kost',kost],['warteg',warteg],['minimarket',minimarket]]){
   if(!obj)continue;
   let template=scenes[TEMPLATES[kind]]?TEMPLATES[kind]:(FALLBACK[kind]||TEMPLATES[kind]);
   if(kind==='kost'&&scenes[LOBBY_ID]&&obj.id!==PLAY_KOST_ID&&/njh-kos-noor|cove/i.test(textOf(obj)+' '+(obj.id||'')))
    template=LOBBY_ID;
   const sceneData=scenes[template];
   obj.enterable=true;obj.interactive=true;
   obj.njhInteriorTemplate=template;
   obj.njhUsePoint=doorWorld(obj);
   if(sceneData)obj.interior=wrapInterior(sceneData);
   if(!Array.isArray(obj.interactions))obj.interactions=['enter'];
   else if(!obj.interactions.includes('enter'))obj.interactions=[...obj.interactions,'enter'];
   buildings[kind]={object:obj,template,door:obj.njhUsePoint,scene:sceneData};
  }
  return buildings;
 }

 function kindOfBuilding(obj){
  if(!obj)return null;
  // Template-first: an official njhInteriorTemplate wins over name regex.
  // Otherwise Warung Madura / Nasi Sunda / Pecel Lele / Warung Kopi match
  // WARTEG_PATTERN and open the warteg room (New Bot K1).
  const tpl=obj.njhInteriorTemplate;
  if(tpl){
   if(tpl===TEMPLATES.minimarket||tpl==='njh_minimarket')return 'minimarket';
   if(tpl===TEMPLATES.kost||tpl===PLAY_KOST_ID||tpl==='njh_kos'||tpl==='njh_kos_ichsan'||tpl==='njh_kos_noor')return 'kost';
   if(tpl===LOBBY_ID)return 'lobby';
   if(tpl===TEMPLATES.warteg||tpl===FALLBACK.warteg||tpl==='njh_warung_makan')return 'warteg';
   return kindOfRoom(tpl);
  }
  if(obj.id===PLAY_KOST_ID)return 'kost';
  if(MINIMARKET_PATTERN.test(textOf(obj)))return 'minimarket';
  if(KOST_PATTERN.test(textOf(obj)))return 'kost';
  if(WARTEG_PATTERN.test(textOf(obj)))return 'warteg';
  return null;
 }

 function canEnter(kind){
  if(kind==='warteg'||kind==='minimarket'||kind==='public')return {ok:true};
  if(kind!=='kost'&&kind!=='lobby')return {ok:false,reason:'Bukan pintu kost atau warteg'};
  const state=opts.getState?.();
  if(state?.housing?.room)return {ok:true};
  return {ok:false,reason:'Kost ini milik penghuni. Beli akses kost dulu.'};
 }

 function disposeRoom(){
  if(group&&group.parent)group.parent.remove(group);
  if(group)group.traverse(n=>{
   if(n.geometry)n.geometry.dispose();
   if(n.material){
    const mats=Array.isArray(n.material)?n.material:[n.material];
    for(const m of mats){m.map?.dispose?.();m.dispose?.();}
   }
  });
  group=null;billboards=[];
 }

 function makeTexture(img){
  const tex=new THREE.Texture(img);
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;
  tex.needsUpdate=true;
  return tex;
 }

 function resolvePlayTemplate(id){
  if(!id)return id;
  const raw=id;
  const A=AccessApi();
  const resolved=A?.resolveId?.(raw)||raw;
  // Official Warteg play room is Kharisma + Ibu Warteg. The door / NJH_READY
  // list may still name Ellen's njh_warung_makan fallback; upgrade when the
  // Kharisma scene is loaded so template-first does not reopen the old room.
  if(resolved==='warteg'||resolved===TEMPLATES.warteg||resolved===FALLBACK.warteg||resolved==='njh_warung_makan'||raw==='warteg')
   return scenes[TEMPLATES.warteg]?TEMPLATES.warteg:(scenes[FALLBACK.warteg]?FALLBACK.warteg:TEMPLATES.warteg);
  return resolved;
 }
 function sceneOf(id){
  if(!id)return null;
  const resolved=resolvePlayTemplate(id);
  if(scenes[resolved])return scenes[resolved];
  if(scenes[id])return scenes[id];
  if(resolved==='kost'||id==='kost')return scenes[TEMPLATES.kost]||buildings.kost?.scene||null;
  if(resolved==='minimarket'||id==='minimarket')return scenes[TEMPLATES.minimarket]||buildings.minimarket?.scene||null;
  return buildings[resolved]?.scene||buildings[id]?.scene||null;
 }
 function kindOfRoom(id){
  if(id==='warteg'||id===TEMPLATES.warteg||id===FALLBACK.warteg||id==='njh_warung_makan')return 'warteg';
  if(id==='minimarket'||id===TEMPLATES.minimarket)return 'minimarket';
  const A=AccessApi();
  if(id===LOBBY_ID||id==='njh-kos-noor'||A?.isLobby?.(id))return 'lobby';
  if(id==='kost'||id==='njh_kos'||id==='njh_kos_ichsan'||id==='njh_kos_noor')return 'kost';
  return 'public';
 }
 function pid(){return String(opts.getPlayerId?.()||opts.playerId?.()||'');}
 function rels(){return opts.getRelationships?.()||AccessApi()?.DEFAULT_RELATIONSHIPS||[];}

 function buildRoom(kind,sceneOverride,roomId){
  const sc=sceneOverride||sceneOf(roomId||kind)||buildings[kind]?.scene;
  const roomKind=kindOfRoom(roomId||kind);
  const themeKind=roomKind==='warteg'||roomKind==='minimarket'?roomKind:(ORIGIN[roomKind]?roomKind:'public');
  if(!sc||!THREE||!scene)return null;
  disposeRoom();
  const origin=ORIGIN[themeKind]||ORIGIN.kost,w=num(sc.width,8),d=num(sc.depth,6);
  group=new THREE.Group();group.name='njh-play-interior-'+(roomId||kind);
  const policy=View?.DRAW_POLICY||{};
  const floorY=policy.floor?.y??0.045;
  // MUST: floor never writes depth — iso sprite bases hang below the foot and
  // a depth-writing floor slices them on a diagonal.
  const floorMat=new THREE.MeshBasicMaterial({color:sc.theme==='aqua'?0xd0e9f0:themeKind==='minimarket'?0xeef0ec:0xe8dbc7,side:THREE.DoubleSide,
   depthTest:policy.floor?.depthTest!==false,depthWrite:false});
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(w,d),floorMat);
  floor.rotation.x=-Math.PI/2;floor.position.set(origin.x+w/2,floorY,origin.z+d/2);
  floor.renderOrder=policy.floor?.renderOrder??0;group.add(floor);
  // Only the TWO FAR walls (iso cutaway). The near-side wall used to sit
  // in front of the camera and hide right-wall fixtures (shower, toilet, sink).
  const wallH=View?.WALL_HEIGHT||2.8;
  const far=View?.farWalls?.(opts.cameraDirection)||{back:true,left:true,right:false,front:false};
  const paint=root?.VLWartegInteriorArt;
  const bake=side=>((sc.theme==='warteg'||themeKind==='warteg'||kind==='warteg')&&View?.bakeWallTexture)
   ?View.bakeWallTexture(side,{width:w,depth:d},paint):null;
  // NJH MART mandatory five-layer wall paint (Kharisma layout standard).
  // The source is the scene's published paint declaration, not a new asset.
  // Pixel geometry is baked to a nearest-filtered CanvasTexture once per room.
  const MART_WALL={back:0xf3f5f2,left:0xe2ece8};
  function bakeMartWall(side){/* also used as generic paint.layers hook for any scene */
   const declared=new Set((sc.paint?.layers||[]).map(x=>x.layer));
   if(!['dado','trim','midDisplay','identity','ceiling'].every(x=>declared.has(x)))return null;
   const unit=64,ww=side==='back'?w:d;
   const c=document.createElement('canvas');c.width=Math.max(64,Math.round(ww*unit));c.height=128;
   const ctx=c.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=false;
   const W=c.width,H=c.height,fromFloor=z=>H-z;
   ctx.fillStyle=side==='back'?'#F3F5F2':'#E2ECE8';ctx.fillRect(0,0,W,H);
   // DADO — glazed white tiles, with a teal belt across both far walls.
   ctx.fillStyle='#F6FAF7';ctx.fillRect(0,fromFloor(49),W,49);
   ctx.fillStyle='#CDDAD8';
   for(let x=0;x<W;x+=16)ctx.fillRect(x,fromFloor(49),1,49);
   for(let y=fromFloor(49);y<H;y+=12)ctx.fillRect(0,y,W,1);
   ctx.fillStyle='#22A094';ctx.fillRect(0,fromFloor(46),W,6);
   // TRIM — continuous orange identity rail at z=50.
   ctx.fillStyle='#F59E0B';ctx.fillRect(0,fromFloor(52),W,3);
   ctx.fillStyle='#B77811';ctx.fillRect(0,fromFloor(49),W,1);
   // MID DISPLAY — shelf-top shelf tickets, not floating pseudo-products.
   ctx.fillStyle='#CBD9D5';ctx.fillRect(0,fromFloor(70),W,2);
   for(let x=8;x+25<W;x+=48){
    ctx.fillStyle='#FEF9DE';ctx.fillRect(x,fromFloor(64),26,8);
    ctx.fillStyle='#164F50';ctx.fillRect(x+3,fromFloor(61),12,2);
   }
   // IDENTITY — an anchored NJH MART sign and category bands.
   if(side==='back'){
    const sw=Math.min(W-18,235),sx=Math.round((W-sw)/2);
    ctx.fillStyle='#0D635F';ctx.fillRect(sx,fromFloor(109),sw,35);
    ctx.fillStyle='#EAF5EC';ctx.fillRect(sx+4,fromFloor(106),sw-8,27);
    ctx.fillStyle='#123F42';ctx.font='bold 21px monospace';ctx.textAlign='center';
    ctx.fillText('NJH MART',Math.round(W/2),fromFloor(85));
    ctx.textAlign='left';
   }else{
    ctx.fillStyle='#0D635F';ctx.fillRect(8,fromFloor(106),W-16,26);
    ctx.fillStyle='#F1FCF8';ctx.font='bold 12px monospace';ctx.textAlign='center';
    ctx.fillText('SEGAR   SEMBAKO   MINUMAN',Math.round(W/2),fromFloor(90));
    ctx.textAlign='left';
   }
   // CEILING — three LED strips in the height band z=108–120.
   for(const u of [0.18,0.5,0.82]){
    const cx=Math.round(u*W),lx=Math.max(4,Math.min(W-42,cx-18));
    ctx.fillStyle='#718C90';ctx.fillRect(lx,fromFloor(120),37,7);
    ctx.fillStyle='#FAFFF6';ctx.fillRect(lx+3,fromFloor(118),31,3);
   }
   if(side==='back'){
    // CCTV dome above the cashier end, still part of paint/art dressing.
    const x=Math.round(W*.84);ctx.fillStyle='#345054';
    ctx.fillRect(x-6,fromFloor(115),12,5);
    ctx.fillStyle='#232E36';ctx.fillRect(x-4,fromFloor(110),8,4);
   }
   return c;
  }
  function layerOf(name){return (sc.paint?.layers||[]).find(x=>x&&x.layer===name)||null;}
  function layerPalette(layer){return (layer&&Array.isArray(layer.palette)&&layer.palette.length)?layer.palette:null;}
  function identityLabel(spec){
   const m=String(spec||'').match(/'([^']+)'|"([^"]+)"/);
   return String((m&&(m[1]||m[2]))||'').trim();
  }
  // Generic declared-paint baker: uses each layer's z-range, palette, and quoted
  // identity text. Must not reuse NJH MART branding on mushola / r7 rooms.
  function bakeDeclaredPaint(side){
   const layers=sc.paint&&Array.isArray(sc.paint.layers)?sc.paint.layers:[];
   if(!layers.length)return null;
   const unit=64,ww=side==='back'?w:d;
   const c=document.createElement('canvas');c.width=Math.max(64,Math.round(ww*unit));c.height=128;
   const ctx=c.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=false;
   const W=c.width,H=c.height,fromFloor=z=>H-z;
   ctx.fillStyle='#E8DBC7';ctx.fillRect(0,0,W,H);
   const dado=layerOf('dado'),trim=layerOf('trim'),mid=layerOf('midDisplay'),ident=layerOf('identity'),ceil=layerOf('ceiling');
   if(dado){
    const pal=layerPalette(dado)||['#8A8A8A','#B0B0B0','#D0D0D0','#EEEEEE','#FFFFFF'];
    const z0=Number(dado.z?.[0]??0),z1=Number(dado.z?.[1]??49);
    const top=fromFloor(Math.max(z0,z1)),h=Math.max(1,Math.abs(z1-z0)||1);
    ctx.fillStyle=pal[0];ctx.fillRect(0,top,W,h);
    ctx.fillStyle=pal[Math.min(2,pal.length-1)];
    for(let x=0;x<W;x+=16)ctx.fillRect(x,top,1,h);
    for(let y=top;y<top+h;y+=12)ctx.fillRect(0,y,W,1);
    if(pal.length>3){ctx.fillStyle=pal[3];ctx.fillRect(0,fromFloor(Math.max(z0,z1)-3),W,4);}
   }
   if(trim){
    const pal=layerPalette(trim)||['#444','#888'];
    const z=Number(trim.z?.[0]??50);
    ctx.fillStyle=pal[Math.min(2,pal.length-1)];ctx.fillRect(0,fromFloor(z+2),W,3);
    ctx.fillStyle=pal[0];ctx.fillRect(0,fromFloor(z),W,1);
   }
   if(mid){
    const pal=layerPalette(mid)||['#333','#666','#999'];
    const z0=Number(mid.z?.[0]??56),z1=Number(mid.z?.[1]??70);
    const top=fromFloor(Math.max(z0,z1)),h=Math.max(2,Math.abs(z1-z0)||2);
    ctx.fillStyle=pal[0];ctx.fillRect(0,top+h-3,W,2);
    const quote=identityLabel(mid.spec);
    ctx.fillStyle=pal[Math.min(3,pal.length-1)]||'#fff';
    ctx.font='bold 10px monospace';ctx.textAlign='center';
    ctx.fillText(quote||'',Math.round(W/2),fromFloor(z0+6));
    ctx.textAlign='left';
   }
   if(ident){
    const pal=layerPalette(ident)||['#123','#fff','#000'];
    const label=identityLabel(ident.spec);
    const z0=Number(ident.z?.[0]??69),z1=Number(ident.z?.[1]??116);
    if(side==='back'&&label){
     const sw=Math.min(W-18,Math.max(120,label.length*14+24)),sx=Math.round((W-sw)/2);
     ctx.fillStyle=pal[0];ctx.fillRect(sx,fromFloor(z1-8),sw,Math.min(36,z1-z0-8));
     ctx.fillStyle=pal[Math.min(3,pal.length-1)]||'#fff';ctx.fillRect(sx+3,fromFloor(z1-11),sw-6,Math.min(28,z1-z0-12));
     ctx.fillStyle=pal[Math.min(2,pal.length-1)]||'#111';
     ctx.font='bold 16px monospace';ctx.textAlign='center';
     ctx.fillText(label,Math.round(W/2),fromFloor(z1-28));
     ctx.textAlign='left';
    }else if(label){
     ctx.fillStyle=pal[0];ctx.fillRect(8,fromFloor(106),W-16,22);
     ctx.fillStyle=pal[Math.min(3,pal.length-1)]||'#fff';
     ctx.font='bold 11px monospace';ctx.textAlign='center';
     ctx.fillText(label,Math.round(W/2),fromFloor(92));
     ctx.textAlign='left';
    }
   }
   if(ceil){
    const pal=layerPalette(ceil)||['#333','#666','#FFD27A'];
    for(const u of [0.28,0.72]){
     const cx=Math.round(u*W),lx=Math.max(4,Math.min(W-28,cx-12));
     ctx.fillStyle=pal[0];ctx.fillRect(lx,fromFloor(120),24,6);
     ctx.fillStyle=pal[Math.min(3,pal.length-1)]||'#ffe';ctx.fillRect(lx+3,fromFloor(118),18,3);
    }
   }
   return c;
  }

  const wallMaterial=(side,fallback)=>{
   if(themeKind==='minimarket')fallback=MART_WALL[side]||fallback;
   const mart=themeKind==='minimarket'||sc.id==='njh_minimarket'||roomKind==='minimarket';
   const can=mart?bakeMartWall(side):(sc.paint&&Array.isArray(sc.paint.layers)&&sc.paint.layers.length?bakeDeclaredPaint(side):bake(side));
   if(can&&THREE){
    const tex=new THREE.CanvasTexture(can);
    tex.colorSpace=THREE.SRGBColorSpace;tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;
    tex.needsUpdate=true;
    return new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,depthTest:true,depthWrite:false});
   }
   return new THREE.MeshBasicMaterial({color:fallback,side:THREE.DoubleSide,depthTest:true,depthWrite:false});
  };
  if(far.back){
   const back=new THREE.Mesh(new THREE.PlaneGeometry(w,wallH),wallMaterial('back',0xd4c8ae));
   back.position.set(origin.x+w/2,wallH/2,origin.z-0.04);
   back.renderOrder=0;group.add(back);
  }
  if(far.left){
   const left=new THREE.Mesh(new THREE.PlaneGeometry(d,wallH),wallMaterial('left',0xc3ad8d));
   left.rotation.y=Math.PI/2;left.position.set(origin.x-0.04,wallH/2,origin.z+d/2);
   left.renderOrder=0;group.add(left);
  }
  if(far.right){
   const right=new THREE.Mesh(new THREE.PlaneGeometry(d,wallH),wallMaterial('left',0xc3ad8d));
   right.rotation.y=Math.PI/2;right.position.set(origin.x+w+0.04,wallH/2,origin.z+d/2);
   right.renderOrder=0;group.add(right);
  }
  if(far.front){
   const front=new THREE.Mesh(new THREE.PlaneGeometry(w,wallH),wallMaterial('back',0xc4b49a));
   front.position.set(origin.x+w/2,wallH/2,origin.z+d+0.04);
   front.renderOrder=0;group.add(front);
  }
  const items=catalog?.items||catalog||{};
  const furniture=[];
  for(const item of sc.items||[]){
   const typ=items[View?.artId?.(item.assetId)||item.assetId]||items[item.assetId]||{};
   const dir=dirFor(item.rotation);
   const view=typ[dir]||typ.sw||typ.se||null;
   const foot=view?.footprint||[1,1];
   let fw=num(foot[0],1),fd=num(foot[1],1);
   if((num(item.rotation,0)%180)===90){const t=fw;fw=fd;fd=t;}
   const snapped=View?.snapFootprint?.(item.c,item.r,fw,fd,w,d)||{c:num(item.c,0),r:num(item.r,0),fw,fd};
   const itemSnap=Object.assign({},item,{c:snapped.c,r:snapped.r});
   const pos=tilePos(origin,itemSnap,[snapped.fw,snapped.fd]);
   const img=view?.file?images.get(view.file):null;
   const size=view?.size||(img?[img.naturalWidth||img.width,img.naturalHeight||img.height]:[64,64]);
   const pivot=view?.pivot||[size[0]/2,size[1]*0.8];
   const width=size[0]*PIXEL_WORLD;
   const height=size[1]*PIXEL_WORLD*VERTICAL_COMP;
   const py=pivot[1]/size[1],px=(size[0]/2-pivot[0])/size[0]*width;
   const root=new THREE.Group();root.position.set(pos.x,0,pos.z);
   if(img&&THREE){
    const mat=new THREE.MeshBasicMaterial({map:makeTexture(img),transparent:true,alphaTest:.05,depthTest:true,depthWrite:true,side:THREE.DoubleSide});
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);
    plane.position.set(px,height*(py-.5)+.04,0);
    plane.userData.billboard=true;plane.renderOrder=1;plane.rotation.y=View?.isoBillboardYaw?.()||Math.PI/4;
    root.add(plane);billboards.push({root,plane,item,height});
   }
   // An authored sekat_wc must be a REAL solid privacy panel in play,
   // never the invisible footprint-stub that used to leave toilets exposed.
   if(item.assetId==='sekat_wc'&&!img){
    const alongC=((Number(item.rotation)||0)%180)===0;
    const dims=[alongC?.94:.12,alongC?.12:.94];
    for(const [lo,hi,color] of [[0,.78,0x58a3a2],[.78,2.2,0xe8eee7]]){
     const wall=new THREE.Mesh(new THREE.BoxGeometry(dims[0],hi-lo,dims[1]),
      new THREE.MeshBasicMaterial({color,side:THREE.DoubleSide}));
     wall.position.y=(lo+hi)/2;wall.renderOrder=2;root.add(wall);
    }
   }
   group.add(root);
   furniture.push({
    id:item.id,assetId:item.assetId,name:item.name,actionId:item.actionId,
    tags:item.tags||'',access:item.access||null,ownerId:item.ownerId||null,
    kind:item.assetId,furnitureId:item.assetId,label:item.name||item.assetId,
    x:pos.x,z:pos.z,fw:pos.fw,fd:pos.fd,blocking:item.blocking!==false,
    c:snapped.c,r:snapped.r,roomId:roomId||kind,source:'interior',height
   });
  }
  const A=AccessApi();
  const doorRecs=sceneDoors(sc).map(d=>{
   const use=doorUseWorld(origin,d);
   const rec=Object.assign({},d,{wx:use.x,wz:use.z});
   const privacy=d.role==='bathroom'||d.role==='stall';
   // Bathroom curtain/stall is NOT a locked lobby door. It is a walkable
   // privacy screen on the only opening, with no "Masuk Kamar" action.
   const spr=privacy?null:(A?A.doorSprite(d,pid()):(d.sprite||null));
   const file=privacy?null:(spr||d.sprite);
   if(privacy){
    const curtain=new THREE.Mesh(new THREE.PlaneGeometry(.94,2.05),
     new THREE.MeshBasicMaterial({color:0xc4dad6,transparent:true,opacity:.94,
      depthTest:true,depthWrite:false,side:THREE.DoubleSide}));
    curtain.rotation.y=(Number(d.rotation)||0)%180===90?Math.PI/2:0;
    curtain.position.set(origin.x+num(d.c,0)+.5,1.025,origin.z+num(d.r,0)+.5);
    curtain.renderOrder=3;group.add(curtain);
   }
   const img=file?images.get(file):null;
   if(img&&THREE){
    const size=[img.naturalWidth||img.width||64,img.naturalHeight||img.height||96];
    const width=size[0]*PIXEL_WORLD,height=size[1]*PIXEL_WORLD*VERTICAL_COMP;
    const rootG=new THREE.Group();
    rootG.position.set(origin.x+num(d.c,0)+0.5,0,origin.z+num(d.r,0)+0.5);
    const mat=new THREE.MeshBasicMaterial({map:makeTexture(img),transparent:true,alphaTest:.05,depthTest:true,depthWrite:true,side:THREE.DoubleSide});
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);
    plane.position.set(0,height*0.3+.04,0);
    plane.userData.billboard=true;plane.renderOrder=1;plane.rotation.y=View?.isoBillboardYaw?.()||Math.PI/4;
    rootG.add(plane);billboards.push({root:rootG,plane,item:d,height});
    group.add(rootG);
    rec.spriteFile=file;
   }
   return rec;
  });
  // Door mat at entrance
  const ent=sc.entrance||{c:Math.floor(w/2),r:d-1};
  const door={x:origin.x+num(ent.c,4)+0.5,z:origin.z+num(ent.r,d-1)+0.5};
  scene.add(group);
  return {origin,width:w,depth:d,furniture,door,entrance:ent,doors:doorRecs,sceneId:sc.id||roomId||kind};
 }

 function hideOutdoor(hide){
  if(!hide){
   if(!outdoorHidden)return;
   // Restore the original street visibility captured on the FIRST entry.
   // Room → lobby → room transitions must not overwrite it with false.
   for(const rec of hidden){if(rec.obj)rec.obj.visible=rec.prev;}
   hidden=[];outdoorHidden=false;
   try{opts.setGroundVisible?.(true);}catch(_e){}try{opts.setGroundDepthWrite?.(true);}catch(_e){}
   return;
  }
  if(outdoorHidden)return; // Idempotent across indoor-to-indoor transitions.
  outdoorHidden=true;hidden=[];
  const roots=typeof opts.getRoots==='function'?opts.getRoots():[];
  const playerId=opts.playerObjectId?.()||'';
  const keep=new Set([playerId,'__semesta_life_temporary_player__'].filter(Boolean));
  const actors=new Set((opts.getWorld?.()?.objects||[]).filter(o=>['avatar','npc'].includes(o.type)).map(o=>o.id));
  for(const rec of roots){
   const id=rec.id,obj=rec.root||rec.object||rec;
   if(!obj||keep.has(id)||actors.has(id))continue;
   hidden.push({obj,prev:obj.visible!==false});
   obj.visible=false;
  }
  try{opts.setGroundVisible?.(false);}catch(_e){}try{opts.setGroundDepthWrite?.(false);}catch(_e){}
 }

 function persistSession(){
  const state=opts.getState?.();
  if(!state)return;
  if(session)state.interior={id:session.template,kind:session.kind,roomId:session.roomId||session.template,
   buildingId:session.buildingId,exit:session.exit,schema:1};
  else delete state.interior;
  opts.persist?.();
 }

 function canEnterRoom(roomId){
  const kind=kindOfRoom(roomId);
  if(kind==='warteg'||kind==='minimarket'||kind==='public')return {ok:true};
  const A=AccessApi();
  if(!A)return canEnter(kind==='lobby'?'kost':kind);
  A.setRelationships?.(rels());
  const acc=A.roomAccess(pid(),roomId,opts.getState?.(),rels());
  if(acc&&acc.canEnter===false)return {ok:false,reason:acc.reason||'Terkunci',acc};
  return {ok:true,acc};
 }

 function enterInterior(roomId,reason){
  const A=AccessApi();
  const resolved=resolvePlayTemplate(A?.resolveId?.(roomId)||roomId);
  const sc=sceneOf(resolved);
  if(!sc)return {ok:false,reason:'Belum buka',closed:true};
  const gate=canEnterRoom(resolved);if(!gate.ok)return gate;
  const kind=kindOfRoom(resolved);
  const pos=opts.getPos?.()||{x:0,z:0};
  const streetExit=(session&&session.exit)?session.exit:{x:pos.x,z:pos.z};
  const lobbyReturn=session&&(session.kind==='lobby'||session.roomId===LOBBY_ID)
   ?{x:session.door.x,z:session.door.z,roomId:session.roomId||LOBBY_ID}
   :(session&&session.lobbyReturn)||null;
  const built=buildRoom(kind,sc,resolved);if(!built)return {ok:false,reason:'Gagal membangun interior'};
  hideOutdoor(true);
  session={kind,roomId:resolved,template:resolved,
   buildingId:buildings.kost?.object?.id||'njh-kos-noor',
   exit:streetExit,lobbyReturn,...built};
  const landing=spawnInside();
  opts.teleport?.(landing.x,landing.z,8,{keepView:true});
  fitRoomCamera();
  persistSession();
  const msg=kind==='lobby'?'🏠 Masuk lobi kost':kind==='warteg'?'🍚 Masuk warteg':kind==='minimarket'?'🛒 Masuk NJH Mart':kind==='public'?'🚪 Masuk':'🏠 Masuk kamar';
  opts.message?.(msg+(reason?' · '+reason:''));
  opts.onEnter?.(session);
  return {ok:true,kind,roomId:resolved,session};
 }

 function openInteriorById(id){
  const A=AccessApi();
  const raw=String(id||'');
  const resolved=resolvePlayTemplate(A?.resolveId?.(raw)||raw);
  if(raw==='njh-kos-noor'||resolved===LOBBY_ID||A?.isLobby?.(raw))
   return enterInterior(LOBBY_ID);
  if(sceneOf(resolved))return enterInterior(resolved);
  if(raw==='kost'||raw==='warteg'||raw==='minimarket'||resolved==='warteg'||resolved===TEMPLATES.warteg||resolved===FALLBACK.warteg)
   return enter(raw==='kost'||raw==='minimarket'?raw:'warteg');
  const k=kindOfBuilding({id:raw,name:raw})||kindOfRoom(resolved);
  if(k==='warteg'||k==='kost'||k==='minimarket')return enter(k);
  return {ok:false,reason:'Belum buka',closed:true};
 }

 function enter(kind,reason){
  if(kind==='kost'&&buildings.kost?.template===LOBBY_ID)
   return enterInterior(LOBBY_ID,reason);
  const rec=buildings[kind];
  if(!rec)return {ok:false,reason:'Belum buka',closed:true};
  const gate=canEnter(kind);if(!gate.ok)return gate;
  const pos=opts.getPos?.()||{x:0,z:0};
  const built=buildRoom(kind,rec.scene,rec.template);if(!built)return {ok:false,reason:'Gagal membangun interior'};
  hideOutdoor(true);
  session={kind,template:rec.template,roomId:rec.template,buildingId:rec.object.id,
   exit:session?.exit||{x:pos.x,z:pos.z},...built};
  const landing=spawnInside();
  opts.teleport?.(landing.x,landing.z,8,{keepView:true});
  fitRoomCamera();
  persistSession();
  opts.message?.((kind==='kost'?'🏠 Masuk kost':kind==='minimarket'?'🛒 Masuk NJH Mart':'🍚 Masuk warteg')+(reason?' · '+reason:''));
  opts.onEnter?.(session);
  return {ok:true,kind,session};
 }

 // One E press targets ONE nearby physical doorway. Never select Cove by
 // a saved room id, an unrelated UI button, or a building's remote pivot.
 function nearestDoor(){
  const p=opts.getPos?.()||{x:0,z:0};
  let best=null,limit=ENTER_RADIUS;
  if(session){
   for(const d of session.doors||[]){
    if(d.role==='bathroom'||d.role==='stall')continue;
    const distance=Math.hypot(p.x-d.wx,p.z-d.wz);
    if(distance>=Math.min(limit,1.45))continue;
    best={inside:true,door:d,kind:session.kind,distance};limit=distance;
   }
   if(!best){
    const distance=Math.hypot(p.x-session.door.x,p.z-session.door.z);
    if(distance<=1.4)best={inside:true,exit:true,kind:session.kind,distance};
   }
   return best;
  }
  function consider(obj,kind,template,pt,closed){
   if(!pt||!Number.isFinite(pt.x)||!Number.isFinite(pt.z))return;
   const distance=Math.hypot(p.x-pt.x,p.z-pt.z);
   if(distance<limit){best={inside:false,kind,door:pt,distance,objectId:obj&&obj.id,template:template||null,closed:!!closed};limit=distance;}
  }
  function pointOf(d,obj){
   const u=d&&(d.use||d.usePoint);
   if(Array.isArray(u))return {x:num(u[0]),z:num(u[1])};
   if(u&&Number.isFinite(Number(u.x)))return {x:num(u.x),z:num(u.z)};
   return obj?doorWorld(obj):null;
  }
  for(const kind of Object.keys(buildings)){
   const b=buildings[kind];
   const candidates=(b.object.njhDoors||[]).filter(d=>!d.pending&&d.interior&&(d.use||d.usePoint));
   if(candidates.length){for(const d of candidates)consider(b.object,kind,d.template||b.template,pointOf(d,b.object),false);}
   else consider(b.object,kind,b.template,b.door||doorWorld(b.object),!hasReadyInterior(b.object));
  }
  const world=opts.getWorld?.()||{};
  const seen=new Set(Object.values(buildings).map(b=>b.object&&b.object.id).filter(Boolean));
  for(const obj of world.objects||[]){
   if(!obj||seen.has(obj.id))continue;
   const doors=obj.njhDoors||[];
   const ready=doors.filter(d=>!d.pending&&d.interior);
   if(ready.length){
    for(const d of ready)consider(obj,kindOfBuilding(obj)||kindOfRoom(d.template||obj.njhInteriorTemplate),d.template||obj.njhInteriorTemplate,pointOf(d,obj),false);
   }else if(obj.njhInteriorTemplate&&hasReadyInterior(obj)){
    consider(obj,kindOfBuilding(obj)||kindOfRoom(obj.njhInteriorTemplate),obj.njhInteriorTemplate,doorWorld(obj),false);
   }else if(obj.enterable||doors.length||obj.njhInteriorPending||(Array.isArray(obj.interactions)&&obj.interactions.includes('enter'))){
    const pending=doors.filter(d=>d.pending||!d.interior);
    const pts=pending.length?pending.map(d=>pointOf(d,obj)):[doorWorld(obj)];
    for(const pt of pts)consider(obj,kindOfBuilding(obj),obj.njhInteriorTemplate,pt,true);
   }
  }
  return best;
 }

 function closedStreetDoor(){
  if(session)return null;
  const P=typeof window!=='undefined'?window.VLNjhMapPreview:null;
  if(!P?.closedDoorsNear)return null;
  const world=opts.getWorld?.()||{};
  const p=opts.getPos?.()||{x:0,z:0};
  const radius=P.enterRadius||ENTER_RADIUS||1.25;
  return P.closedDoorsNear(world.objects||[],p.x,p.z,radius)[0]||null;
 }
 function enterNearby(){
  const closed=closedStreetDoor();
  if(closed)return {ok:false,reason:closed.reason||'Belum buka',closed:true,doorId:closed.doorId,objectId:closed.object&&closed.object.id};
  const target=nearestDoor();
  if(!target)return {ok:false,reason:session?'Dekati pintu untuk berinteraksi':'Tidak ada pintu dalam jangkauan'};
  if(target.inside){
   const d=target.door;
   if(!d||isExitDoor(d))return exit();
   const A=AccessApi();
   const access=A?.doorAccess?.(pid(),d);
   if(access&&access.canEnter===false)return {ok:false,reason:access.reason||'Pintu terkunci'};
   return enterInterior(d.interiorTemplate||d.to,'pintu terdekat');
  }
  if(target.closed)return {ok:false,reason:'Belum buka',closed:true,doorId:target.doorId,objectId:target.objectId};
  // Kost / warteg / mart stay on enter(kind) so housing.room (not an unconfigured
  // Access record for the generic njh_kos template) still gates the play kost.
  if(target.kind&&buildings[target.kind]&&['kost','warteg','minimarket'].includes(target.kind))
   return enter(target.kind);
  if(target.template&&sceneOf(target.template))return enterInterior(target.template,'pintu terdekat');
  if(target.kind&&buildings[target.kind])return enter(target.kind);
  return {ok:false,reason:'Belum buka',closed:true,objectId:target.objectId};
 }

 // Interior rooms are separate from the street worldBounds. Check furniture
 // and walls here instead of running the city road/terrain collision solver.
 function freeInside(x,z,radius=.22){
  if(!session)return true;
  if(x<session.origin.x+.30||z<session.origin.z+.30||
     x>session.origin.x+session.width-.30||z>session.origin.z+session.depth-.30)return false;
  for(const f of session.furniture||[]){
   if(!f.blocking)continue;
   const left=f.x-f.fw/2-.10,right=f.x+f.fw/2+.10;
   const top=f.z-f.fd/2-.10,bottom=f.z+f.fd/2+.10;
   if(x+radius>left&&x-radius<right&&z+radius>top&&z-radius<bottom)return false;
  }
  return true;
 }
 function spawnInside(){
  if(!session)return null;
  const d=session.door,o=session.origin;
  const mid={x:o.x+session.width/2,z:o.z+session.depth/2};
  // Spawn beyond the exit-door action radius, otherwise the first E press
  // kicks a freshly spawned player straight back into the Cove lobby.
  const dx=mid.x-d.x,dz=mid.z-d.z,span=Math.max(.01,Math.hypot(dx,dz));
  const candidates=[2.2,1.95,1.7].map(distance=>({
   x:d.x+dx/span*distance,z:d.z+dz/span*distance
  }));
  candidates.push(mid);
  for(let r=1;r<=Math.max(session.width,session.depth);r+=1){
   for(let c=0;c<session.width;c++)for(let z=0;z<session.depth;z++){
    if(Math.abs(c+.5-(d.x-o.x))+Math.abs(z+.5-(d.z-o.z))<=r)
     candidates.push({x:o.x+c+.5,z:o.z+z+.5});
   }
  }
  const far=candidates.find(v=>freeInside(v.x,v.z)&&Math.hypot(v.x-d.x,v.z-d.z)>1.55);
  if(far)return far;
  const close={x:d.x+dx/span*.9,z:d.z+dz/span*.9};
  return [close,{x:d.x,z:d.z},...candidates].find(v=>freeInside(v.x,v.z))||{x:o.x+.5,z:o.z+.5};
 }
 function moveInside(start,dx,dz){
  if(!session)return null;
  let x=start.x,z=start.z,moved=false;
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.16));
  for(let i=0;i<steps;i++){
   const nx=x+dx/steps,nz=z+dz/steps;
   if(freeInside(nx,z)){x=nx;moved=true;}
   if(freeInside(x,nz)){z=nz;moved=true;}
  }
  return {x,z,moved};
 }

 function exit(){
  if(!session)return {ok:false,reason:'Tidak di dalam interior'};
  const A=AccessApi();
  if(session.kind!=='warteg'&&session.roomId&&A?.isRoom?.(session.roomId)&&sceneOf(session.lobbyReturn?.roomId||LOBBY_ID)){
   return enterInterior(session.lobbyReturn?.roomId||LOBBY_ID,'kembali ke lobi');
  }
  const exitAt=session.exit||buildings[session.kind==='lobby'?'kost':session.kind]?.door||{x:0,z:0};
  const kind=session.kind;
  hideOutdoor(false);
  disposeRoom();
  session=null;
  persistSession();
  opts.teleport?.(exitAt.x,exitAt.z,16,{keepView:false});
  opts.message?.('🚪 Keluar '+(NAME[kind]||kind));
  opts.onExit?.(kind);
  return {ok:true,kind,x:exitAt.x,z:exitAt.z};
 }

 function restoreIfNeeded(){
  const state=opts.getState?.();
  const saved=state?.interior;
  if(!saved?.kind&&!saved?.roomId)return {ok:false};
  if(saved.roomId&&session?.roomId===saved.roomId)return {ok:true,kind:session.kind,restored:true};
  if(session?.kind===saved.kind&&!saved.roomId)return {ok:true,kind:session.kind,restored:true};
  if(session){/* drop without street teleport */hideOutdoor(false);disposeRoom();session=null;}
  if(saved.roomId&&sceneOf(saved.roomId)){
   session={exit:saved.exit};
   return enterInterior(saved.roomId,'lanjut dari save');
  }
  if(!buildings[saved.kind])return {ok:false};
  const rec=buildings[saved.kind];
  const gate=canEnter(saved.kind);
  if(!gate.ok){delete state.interior;opts.persist?.();return gate;}
  session={exit:saved.exit||rec.door};
  return enter(saved.kind,'lanjut dari save');
 }

 function furniture(){
  if(!session)return [];
  // Privacy panels are physical collision, never interactive furniture.
  // They remain in session.furniture for obstacle/pathfinding checks.
  const items=session.furniture.filter(f=>f.assetId!=='sekat_wc').map(f=>({...f}));
  try{
   if(root.SemestaLifeHooks?.furnitureFromInteriorItems)
    return root.SemestaLifeHooks.furnitureFromInteriorItems(items);
  }catch(_e){}
  return items;
 }

 function extraActions(){
  if(!session){
   const closed=closedStreetDoor();
   if(!closed)return [];
   return [{id:'enter_closed',action:'enter_closed',label:'Belum buka',disabled:true,closed:true,
    price:0,spotLabel:closed.label,args:{doorId:closed.doorId,objectId:closed.object&&closed.object.id,reason:'Belum buka'}}];
  }
  const p=opts.getPos?.()||{x:0,z:0};
  const out=[];
  const push=(id,label,price,args,furnitureId,spotLabel)=>{
   out.push({id,action:id,label,price:price??0,furnitureId,spotLabel,args:args||{}});
  };
  const A=AccessApi();
  if(A)A.setRelationships?.(rels());
  const doors=session.doors||[];
  let offeredDoor=false;
  for(const d of doors){
   if(d.role==='bathroom'||d.role==='stall')continue; // curtain has no room-transition action
   if(Math.hypot(p.x-d.wx,p.z-d.wz)>1.4)continue;
   const acc=A?A.doorAccess(pid(),d):{canEnter:d.state!=='locked',label:d.label,reason:d.state==='locked'?'Terkunci':null};
   const isExit=isExitDoor(d);
   if(isExit){
    push('exit_interior',acc.label||'Keluar',0,{doorId:d.id,role:'exit'},d.id,'Pintu');
   }else{
    const locked=!acc.canEnter;
    push('enter_room',locked?'Terkunci':(d.label||'Masuk'),0,
     {doorId:d.id,roomId:d.interiorTemplate||d.to,locked,reason:acc.reason||(locked?'Terkunci':null)},
     d.id,d.label||'Pintu');
   }
   offeredDoor=true;
  }
  if(!offeredDoor&&Math.hypot(p.x-session.door.x,p.z-session.door.z)<=1.4)
   push('exit_interior','Keluar',0,{},undefined,'Pintu');
  for(const f of session.furniture||[]){
   if(Math.hypot(p.x-f.x,p.z-f.z)>2.2)continue;
   const ids=A?.mapActionIds?.(f)||[];
   for(const id of ids){
    if(out.some(a=>a.id===id&&a.furnitureId===f.id))continue;
    push(id,ACTION_LABELS[id]||id,0,{itemId:f.id,access:f.access,ownerId:f.ownerId,seatId:(id==='rest'||id==='sit')?f.id:undefined},f.id,f.label);
   }
  }
  if(session.kind==='warteg'){
   const ibu=session.furniture.find(f=>f.assetId==='npc_ibu_warteg'||f.id==='npc_ibu_warteg');
   const through=ibu&&Math.hypot(p.x-ibu.x,p.z-ibu.z)<=2.8?ibu:null;
   const eatSpots=session.furniture.filter(f=>(View?.eatSpot?.(f.assetId)||['dining_table','food_vitrine','cashier','table','counter'].includes(f.assetId))
    &&Math.hypot(p.x-f.x,p.z-f.z)<=2.2);
   const spot=through||eatSpots[0];
   if(spot)
    push('eat','Makan Warteg',MEAL_PRICE,{price:MEAL_PRICE,buyerId:'warteg',place:'warteg'},spot.furnitureId||spot.assetId,spot.label||'Ibu Warteg');
  }
  if(session.kind==='kost'){
   const toilet=session.furniture.find(f=>f.assetId==='squat_toilet'&&Math.hypot(p.x-f.x,p.z-f.z)<=2.2);
   if(toilet)push('home_toilet','WC Kost',0,{},toilet.furnitureId,toilet.label);
  }
  return out;
 }

 function obstacles(){
  if(!session)return [];
  return session.furniture.filter(f=>f.blocking).map(f=>({
   id:f.id,type:'sprite',collision:true,blocking:'auto',name:f.label,
   x:f.x,z:f.z,w:f.fw,d:f.fd
  }));
 }

 function constrain(start,next){
  if(!session||!next)return next;
  const minX=session.origin.x+0.35,maxX=session.origin.x+session.width-0.35;
  const minZ=session.origin.z+0.35,maxZ=session.origin.z+session.depth-0.35;
  const x=Math.max(minX,Math.min(maxX,next.x));
  const z=Math.max(minZ,Math.min(maxZ,next.z));
  const moved=x!==start.x||z!==start.z;
  return {x,z,moved};
 }

 function fitRoomCamera(){
  if(!session||!View?.fitInteriorCamera)return null;
  const aspect=opts.getViewAspect?.()||16/9;
  const props=(session.furniture||[]).map(f=>({id:f.assetId,x:f.x,z:f.z,h:f.height||2}));
  const fit=View.fitInteriorCamera({
   origin:session.origin,width:session.width,depth:session.depth,props,aspect,
   inset:View.playInset(aspect),wallHeight:View.WALL_HEIGHT
  });
  const clips=View.inspectPropClips?.({
   origin:session.origin,width:session.width,depth:session.depth,
   focus:fit.focus,viewSize:fit.viewSize,aspect,
   policy:View.DRAW_POLICY,
   props:(session.furniture||[]).map(f=>{
    const typ=(catalog?.items||catalog||{})[View.artId?.(f.assetId)||f.assetId]||{};
    const view=typ.sw||typ.se||{};
    return {id:f.assetId,assetId:f.assetId,x:f.x,z:f.z,c:f.c,r:f.r,
     fw:f.fw,fd:f.fd,footprint:[f.fw||1,f.fd||1],
     size:view.size,pivot:view.pivot,height:f.height};
   })
  })||fit.clipped;
  View.warnIfClipped([...(fit.clipped||[]),...clips],session.kind);
  opts.setView?.(fit.focus,fit.viewSize);
  session.camera=fit;
  return fit;
 }
 function cameraLocked(){return !!session;}

 function update(camera){
  if(!camera)return;
  const yaw=View?.isoBillboardYaw?.()||Math.PI/4;
  for(const {root,plane} of billboards){
   plane.rotation.y=yaw-(root.rotation.y||0);
  }
 }

 function candidates(){
  return Object.keys(buildings).map(kind=>{
   const b=buildings[kind];
   return {id:b.object.id,name:b.object.name||NAME[kind],kind,x:b.door.x,z:b.door.z,enterable:true};
  });
 }

 return {
  loadAssets,wireWorld,ensureKost,findBuilding,kindOfBuilding,resolvePlayTemplate,canEnter,canEnterRoom,enter,enterInterior,openInteriorById,nearestDoor,enterNearby,closedStreetDoor,exit,fitRoomCamera,cameraLocked,moveInside,freeInside,spawnInside,
  restoreIfNeeded,furniture,extraActions,obstacles,constrain,update,candidates,
  doorWorld,wrapInterior,tilePos,dirFor,TEMPLATES,FALLBACK,ROOM_SCENES,LOBBY_ID,MEAL_PRICE,ENTER_RADIUS,ORIGIN,PLAY_KOST_ID,KOST_PATTERN,WARTEG_PATTERN,MINIMARKET_PATTERN,
  place:(x,z,size)=>{if(!Number.isFinite(Number(x))||!Number.isFinite(Number(z)))return {ok:false};opts.teleport?.(Number(x),Number(z),size||12,{keepView:!!session});return {ok:true,x:Number(x),z:Number(z)};},
  active:()=>session,kind:()=>session?.kind||null,roomId:()=>session?.roomId||null,buildings:()=>buildings,

  isPlayObject:id=>id===PLAY_KOST_ID||String(id||'').startsWith('__njh_play_')
 };
}

return Object.freeze({
 PIXEL_WORLD,VERTICAL_COMP,TEMPLATES,FALLBACK,ROOM_SCENES,LOBBY_ID,MEAL_PRICE,ORIGIN,PLAY_KOST_ID,KOST_PATTERN,WARTEG_PATTERN,MINIMARKET_PATTERN,
 wrapInterior,tilePos,dirFor,doorWorld,doorUseWorld,sceneDoors,create,baseUrl
});
});
