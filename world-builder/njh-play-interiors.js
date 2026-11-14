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
const LOBBY_ID='njh_kos_cove_lobby';
const ACTION_LABELS={sleep:'Tidur',store_fridge:'Simpan Kulkas',take_fridge:'Ambil dari Kulkas',
 store_home:'Simpan di Kost',take_home:'Ambil dari Kost',cook:'Masak Ikan',cook_recipe:'Masak Resep',
 wash:'Cuci',home_shower:'Mandi Kost',home_toilet:'WC Kost',bathe:'Mandi Kost',use_toilet:'WC Kost',
 exit_interior:'Keluar',enter_room:'Masuk'};
const MEAL_PRICE=12000;
const ENTER_RADIUS=2.2;
const ORIGIN={kost:{x:240,z:0},warteg:{x:260,z:0},minimarket:{x:280,z:0}};
const KOST_PATTERN=/kost|kos_|boarding.?room|cove|kamar.?sewa/i;
const WARTEG_PATTERN=/warteg|warung|nasi|food.vendor/i;
const MINIMARKET_PATTERN=/minimarket|njh.?mart|swalayan/i;
const PLAY_KOST_ID='__njh_play_kost__';
const NAME={kost:'Kost',warteg:'Warteg',minimarket:'NJH Mart'};

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
 let group=null,session=null,hidden=[],billboards=[],buildings={};
 const storage=opts.storage||(typeof localStorage!=='undefined'?localStorage:null);

 async function loadAssets(){
  const base=opts.baseUrl||baseUrl();
  if(!catalog){
   const r=await fetch(base+'catalog.json',{cache:'no-cache'});
   catalog=r.ok?await r.json():{items:{}};
  }
  const items=catalog.items||catalog;
  const wanted=new Set([...Object.values(TEMPLATES),...Object.values(FALLBACK),...ROOM_SCENES]);
  await Promise.all([...wanted].map(async id=>{
   if(scenes[id])return;
   try{const r=await fetch(base+id+'.interior-scene.json',{cache:'no-cache'});
    if(r.ok)scenes[id]=await r.json();}catch(_e){}
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
   const srcs=[file.startsWith('art/')?base+file:base+'art/'+file, base+file];
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
  return objects.find(o=>o.id!==PLAY_KOST_ID&&o.type==='sprite'&&pat.test(textOf(o))&&notMart(o))
   ||objects.find(o=>o.id===PLAY_KOST_ID&&kind==='kost')
   ||null;
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

 function wireWorld(world){
  if(!world)return buildings;
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
  if(obj.njhInteriorTemplate===TEMPLATES.minimarket||MINIMARKET_PATTERN.test(textOf(obj)))return 'minimarket';
  if(obj.njhInteriorTemplate===TEMPLATES.kost||obj.id===PLAY_KOST_ID||KOST_PATTERN.test(textOf(obj)))return 'kost';
  if(obj.njhInteriorTemplate===TEMPLATES.warteg||obj.njhInteriorTemplate===FALLBACK.warteg||WARTEG_PATTERN.test(textOf(obj)))return 'warteg';
  return null;
 }

 function canEnter(kind){
  if(kind==='warteg'||kind==='minimarket')return {ok:true};
  if(kind!=='kost')return {ok:false,reason:'Bukan pintu kost atau warteg'};
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

 function sceneOf(id){
  if(!id)return null;
  if(scenes[id])return scenes[id];
  const A=AccessApi();
  const resolved=A?.resolveId?.(id);
  if(resolved&&scenes[resolved])return scenes[resolved];
  if(id==='kost')return scenes[TEMPLATES.kost]||buildings.kost?.scene||null;
  if(id==='warteg')return scenes[TEMPLATES.warteg]||scenes[FALLBACK.warteg]||buildings.warteg?.scene||null;
  if(id==='minimarket')return scenes[TEMPLATES.minimarket]||buildings.minimarket?.scene||null;
  return buildings[id]?.scene||null;
 }
 function kindOfRoom(id){
  if(id==='warteg'||id===TEMPLATES.warteg||id===FALLBACK.warteg)return 'warteg';
  if(id==='minimarket'||id===TEMPLATES.minimarket)return 'minimarket';
  const A=AccessApi();
  if(id===LOBBY_ID||id==='njh-kos-noor'||A?.isLobby?.(id))return 'lobby';
  return 'kost';
 }
 function pid(){return String(opts.getPlayerId?.()||opts.playerId?.()||'');}
 function rels(){return opts.getRelationships?.()||AccessApi()?.DEFAULT_RELATIONSHIPS||[];}

 function buildRoom(kind,sceneOverride,roomId){
  const sc=sceneOverride||sceneOf(roomId||kind)||buildings[kind]?.scene;
  const roomKind=kindOfRoom(roomId||kind);
  const themeKind=roomKind==='warteg'||roomKind==='minimarket'?roomKind:'kost';
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
  // Minimarket paint (scene.paint): white tile dado + teal band; flat preview colours until a baked hook exists.
  const MART_WALL={back:0xf3f5f2,left:0xe2ece8};
  const wallMaterial=(side,fallback)=>{
   if(themeKind==='minimarket')fallback=MART_WALL[side]||fallback;
   const can=bake(side);
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
   const width=size[0]*PIXEL_WORLD,height=size[1]*PIXEL_WORLD*VERTICAL_COMP;
   const py=pivot[1]/size[1],px=(size[0]/2-pivot[0])/size[0]*width;
   const root=new THREE.Group();root.position.set(pos.x,0,pos.z);
   if(img&&THREE){
    const mat=new THREE.MeshBasicMaterial({map:makeTexture(img),transparent:true,alphaTest:.05,depthTest:true,depthWrite:true,side:THREE.DoubleSide});
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(width,height),mat);
    plane.position.set(px,height*(py-.5)+.04,0);
    plane.userData.billboard=true;plane.renderOrder=1;plane.rotation.y=View?.isoBillboardYaw?.()||Math.PI/4;
    root.add(plane);billboards.push({root,plane,item,height});
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
   const spr=A?A.doorSprite(d,pid()):(d.sprite||null);
   const file=spr||d.sprite;
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
   for(const rec of hidden){if(rec.obj)rec.obj.visible=rec.prev;}
   hidden=[];
   try{opts.setGroundVisible?.(true);}catch(_e){}try{opts.setGroundDepthWrite?.(true);}catch(_e){}
   return;
  }
  hidden=[];
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
  if(kind==='warteg')return {ok:true};
  const A=AccessApi();
  if(!A)return canEnter(kind==='lobby'?'kost':kind);
  A.setRelationships?.(rels());
  const acc=A.roomAccess(pid(),roomId,opts.getState?.(),rels());
  if(acc&&acc.canEnter===false)return {ok:false,reason:acc.reason||'Terkunci',acc};
  return {ok:true,acc};
 }

 function enterInterior(roomId,reason){
  const A=AccessApi();
  const resolved=A?.resolveId?.(roomId)||roomId;
  const sc=sceneOf(resolved);
  if(!sc)return {ok:false,reason:'Interior belum siap'};
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
  opts.teleport?.(built.door.x,built.door.z,8,{keepView:true});
  fitRoomCamera();
  persistSession();
  const msg=kind==='lobby'?'🏠 Masuk lobi kost':kind==='warteg'?'🍚 Masuk warteg':'🏠 Masuk kamar';
  opts.message?.(msg+(reason?' · '+reason:''));
  opts.onEnter?.(session);
  return {ok:true,kind,roomId:resolved,session};
 }

 function openInteriorById(id){
  const A=AccessApi();
  const raw=String(id||'');
  const resolved=A?.resolveId?.(raw)||raw;
  if(raw==='njh-kos-noor'||resolved===LOBBY_ID||A?.isLobby?.(raw))
   return enterInterior(LOBBY_ID);
  if(sceneOf(resolved))return enterInterior(resolved);
  if(raw==='kost'||raw==='warteg'||raw==='minimarket')return enter(raw);
  const k=kindOfBuilding({id:raw,name:raw})||kindOfRoom(resolved);
  if(k==='warteg'||k==='kost'||k==='minimarket')return enter(k);
  return {ok:false,reason:'Interior tidak dikenal'};
 }

 function enter(kind,reason){
  if(kind==='kost'&&buildings.kost?.template===LOBBY_ID)
   return enterInterior(LOBBY_ID,reason);
  const rec=buildings[kind];
  if(!rec)return {ok:false,reason:'Interior belum siap'};
  const gate=canEnter(kind);if(!gate.ok)return gate;
  const pos=opts.getPos?.()||{x:0,z:0};
  const built=buildRoom(kind,rec.scene,rec.template);if(!built)return {ok:false,reason:'Gagal membangun interior'};
  hideOutdoor(true);
  session={kind,template:rec.template,roomId:rec.template,buildingId:rec.object.id,
   exit:session?.exit||{x:pos.x,z:pos.z},...built};
  const spawn=built.door;
  opts.teleport?.(spawn.x,spawn.z,8,{keepView:true});
  fitRoomCamera();
  persistSession();
  opts.message?.((kind==='kost'?'🏠 Masuk kost':kind==='minimarket'?'🛒 Masuk NJH Mart':'🍚 Masuk warteg')+(reason?' · '+reason:''));
  opts.onEnter?.(session);
  return {ok:true,kind,session};
 }

 function enterNearby(){
  if(session){
   const p=opts.getPos?.()||{x:0,z:0};
   if(Math.hypot(p.x-session.door.x,p.z-session.door.z)<=1.4)return exit();
   return {ok:false,reason:'Dekati pintu untuk keluar'};
  }
  const p=opts.getPos?.()||{x:0,z:0};
  let best=null,bestD=ENTER_RADIUS;
  for(const kind of Object.keys(buildings)){
   const b=buildings[kind];
   const door=b.door||doorWorld(b.object);
   const d=Math.hypot(p.x-door.x,p.z-door.z);
   if(d<bestD){best=kind;bestD=d;}
  }
  if(!best)return {ok:false,reason:'Dekati pintu kost atau warteg'};
  return enter(best);
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
  const items=session.furniture.map(f=>({...f}));
  try{
   if(root.SemestaLifeHooks?.furnitureFromInteriorItems)
    return root.SemestaLifeHooks.furnitureFromInteriorItems(items);
  }catch(_e){}
  return items;
 }

 function extraActions(){
  if(!session)return [];
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
    push(id,ACTION_LABELS[id]||id,0,{itemId:f.id,access:f.access,ownerId:f.ownerId},f.id,f.label);
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
  loadAssets,wireWorld,ensureKost,findBuilding,kindOfBuilding,canEnter,canEnterRoom,enter,enterInterior,openInteriorById,enterNearby,exit,fitRoomCamera,cameraLocked,
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
