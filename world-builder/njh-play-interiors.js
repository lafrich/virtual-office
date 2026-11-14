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
const TEMPLATES={kost:'njh_kos',warteg:'njh_warteg_kharisma'};
const FALLBACK={warteg:'njh_warung_makan'};
const MEAL_PRICE=12000;
const ENTER_RADIUS=2.2;
const ORIGIN={kost:{x:240,z:0},warteg:{x:260,z:0}};
const KOST_PATTERN=/kost|kos_|boarding.?room|cove|kamar.?sewa/i;
const WARTEG_PATTERN=/warteg|warung|nasi|food.vendor/i;
const PLAY_KOST_ID='__njh_play_kost__';
const NAME={kost:'Kost',warteg:'Warteg'};

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
  const wanted=new Set([...Object.values(TEMPLATES),...Object.values(FALLBACK)]);
  await Promise.all([...wanted].map(async id=>{
   if(scenes[id])return;
   try{const r=await fetch(base+id+'.interior-scene.json',{cache:'no-cache'});
    if(r.ok)scenes[id]=await r.json();}catch(_e){}
  }));
  const files=new Set();
  for(const typ of Object.values(items)){
   for(const view of Object.values(typ||{}))if(view?.file)files.add(view.file);
  }
  await Promise.all([...files].map(file=>new Promise(resolve=>{
   if(images.has(file))return resolve();
   const img=new Image();
   img.onload=()=>{images.set(file,img);resolve();};
   img.onerror=()=>resolve();
   img.src=base+'art/'+file;
  })));
  return {catalog,scenes,ready:images.size};
 }

 function findBuilding(kind,world){
  const objects=world?.objects||opts.getWorld?.()?.objects||[];
  const pat=kind==='kost'?KOST_PATTERN:WARTEG_PATTERN;
  return objects.find(o=>o.id!==PLAY_KOST_ID&&o.type==='sprite'&&pat.test(textOf(o)))
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
  buildings={};
  for(const [kind,obj] of [['kost',kost],['warteg',warteg]]){
   if(!obj)continue;
   const template=scenes[TEMPLATES[kind]]?TEMPLATES[kind]:(FALLBACK[kind]||TEMPLATES[kind]);
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
  if(obj.njhInteriorTemplate===TEMPLATES.kost||obj.id===PLAY_KOST_ID||KOST_PATTERN.test(textOf(obj)))return 'kost';
  if(obj.njhInteriorTemplate===TEMPLATES.warteg||obj.njhInteriorTemplate===FALLBACK.warteg||WARTEG_PATTERN.test(textOf(obj)))return 'warteg';
  return null;
 }

 function canEnter(kind){
  if(kind==='warteg')return {ok:true};
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

 function buildRoom(kind){
  const rec=buildings[kind];if(!rec?.scene||!THREE||!scene)return null;
  disposeRoom();
  const origin=ORIGIN[kind],sc=rec.scene,w=num(sc.width,8),d=num(sc.depth,6);
  group=new THREE.Group();group.name='njh-play-interior-'+kind;
  const floorMat=new THREE.MeshBasicMaterial({color:sc.theme==='aqua'?0xd0e9f0:0xe8dbc7,side:THREE.DoubleSide});
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(w,d),floorMat);
  floor.rotation.x=-Math.PI/2;floor.position.set(origin.x+w/2,0.045,origin.z+d/2);
  group.add(floor);
  // Only the TWO FAR walls (iso cutaway). The near-side wall used to sit
  // in front of the camera and hide right-wall fixtures (shower, toilet, sink).
  const wallH=View?.WALL_HEIGHT||2.8;
  const far=View?.farWalls?.(opts.cameraDirection)||{back:true,left:true,right:false,front:false};
  const paint=root?.VLWartegInteriorArt;
  const bake=side=>((sc.theme==='warteg'||kind==='warteg')&&View?.bakeWallTexture)
   ?View.bakeWallTexture(side,{width:w,depth:d},paint):null;
  const wallMaterial=(side,fallback)=>{
   const can=bake(side);
   if(can&&THREE){
    const tex=new THREE.CanvasTexture(can);
    tex.colorSpace=THREE.SRGBColorSpace;tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;
    tex.needsUpdate=true;
    return new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,depthTest:true,depthWrite:true});
   }
   return new THREE.MeshBasicMaterial({color:fallback,side:THREE.DoubleSide,depthTest:true,depthWrite:true});
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
   const pos=tilePos(origin,item,foot);
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
    kind:item.assetId,furnitureId:item.assetId,label:item.name||item.assetId,
    x:pos.x,z:pos.z,fw:pos.fw,fd:pos.fd,blocking:item.blocking!==false,
    c:item.c,r:item.r,roomId:kind,source:'interior',height
   });
  }
  // Door mat at entrance
  const ent=sc.entrance||{c:Math.floor(w/2),r:d-1};
  const door={x:origin.x+num(ent.c,4)+0.5,z:origin.z+num(ent.r,d-1)+0.5};
  scene.add(group);
  return {origin,width:w,depth:d,furniture,door,entrance:ent};
 }

 function hideOutdoor(hide){
  if(!hide){
   for(const rec of hidden){if(rec.obj)rec.obj.visible=rec.prev;}
   hidden=[];
   try{opts.setGroundVisible?.(true);}catch(_e){}
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
  try{opts.setGroundVisible?.(false);}catch(_e){}
 }

 function persistSession(){
  const state=opts.getState?.();
  if(!state)return;
  if(session)state.interior={id:session.template,kind:session.kind,buildingId:session.buildingId,
   exit:session.exit,schema:1};
  else delete state.interior;
  opts.persist?.();
 }

 function enter(kind,reason){
  const rec=buildings[kind];
  if(!rec)return {ok:false,reason:'Interior belum siap'};
  const gate=canEnter(kind);if(!gate.ok)return gate;
  const pos=opts.getPos?.()||{x:0,z:0};
  const built=buildRoom(kind);if(!built)return {ok:false,reason:'Gagal membangun interior'};
  hideOutdoor(true);
  session={kind,template:rec.template,buildingId:rec.object.id,
   exit:session?.exit||{x:pos.x,z:pos.z},...built};
  const spawn=built.door;
  opts.teleport?.(spawn.x,spawn.z,8,{keepView:true});
  fitRoomCamera();
  persistSession();
  opts.message?.((kind==='kost'?'🏠 Masuk kost':'🍚 Masuk warteg')+(reason?' · '+reason:''));
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
  const exitAt=session.exit||buildings[session.kind]?.door||{x:0,z:0};
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
  if(!saved?.kind||!buildings[saved.kind])return {ok:false};
  if(session?.kind===saved.kind)return {ok:true,kind:session.kind,restored:true};
  if(session)exit();
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
  // Exit when near the interior door
  if(Math.hypot(p.x-session.door.x,p.z-session.door.z)<=1.4)
   push('exit_interior','Keluar',0,{},undefined,'Pintu');
  if(session.kind==='warteg'){
   const eatSpots=session.furniture.filter(f=>(View?.eatSpot?.(f.assetId)||['dining_table','food_vitrine','cashier','table','counter'].includes(f.assetId))
    &&Math.hypot(p.x-f.x,p.z-f.z)<=2.2);
   if(eatSpots.length)
    push('eat','Makan Warteg',MEAL_PRICE,{price:MEAL_PRICE,buyerId:'warteg'},eatSpots[0].furnitureId,eatSpots[0].label);
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
  View.warnIfClipped(fit.clipped,session.kind);
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
  loadAssets,wireWorld,ensureKost,findBuilding,kindOfBuilding,canEnter,enter,enterNearby,exit,fitRoomCamera,cameraLocked,
  restoreIfNeeded,furniture,extraActions,obstacles,constrain,update,candidates,
  doorWorld,wrapInterior,tilePos,dirFor,TEMPLATES,FALLBACK,MEAL_PRICE,ENTER_RADIUS,ORIGIN,PLAY_KOST_ID,KOST_PATTERN,WARTEG_PATTERN,
  place:(x,z,size)=>{if(!Number.isFinite(Number(x))||!Number.isFinite(Number(z)))return {ok:false};opts.teleport?.(Number(x),Number(z),size||12,{keepView:!!session});return {ok:true,x:Number(x),z:Number(z)};},
  active:()=>session,kind:()=>session?.kind||null,buildings:()=>buildings,

  isPlayObject:id=>id===PLAY_KOST_ID||String(id||'').startsWith('__njh_play_')
 };
}

return Object.freeze({
 PIXEL_WORLD,VERTICAL_COMP,TEMPLATES,FALLBACK,MEAL_PRICE,ORIGIN,PLAY_KOST_ID,KOST_PATTERN,WARTEG_PATTERN,
 wrapInterior,tilePos,dirFor,doorWorld,create,baseUrl
});
});
