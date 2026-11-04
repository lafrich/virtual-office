/* Semesta × Mahluk Hidup — modular transport NPCs.
 * A vehicle is only a vehicle: people are NEVER baked into Indonesia 200
 * transport PNGs. Attach independently animated canonical Mahluk templates.
 * Supports existing saved city drafts by reading the asset catalog metadata,
 * and allows per-instance actor profiles/optional passenger flags.
 */
(function(g){
'use strict';
const DIR=['sw','se','ne','nw'];
const ACTIONS=Object.freeze({
 pedal_becak:'sit',pedal_bicycle:'sit',ride_idle_driver:'sit',
 ride_idle_passenger:'sit',sit_idle_transport:'sit'
});
const BASES=Object.freeze(['human_male_base','human_female_base','human_child_base']);
const safeId=id=>typeof id==='string'&&/^[a-z0-9_-]{1,90}$/.test(id);
const kindOf=action=>/^pedal_/.test(action)?'pedal':/^ride_/.test(action)?'ride':'sit';
const facing=deg=>DIR[((Math.round((Number(deg)||0)/90)%4)+4)%4];
const bound=(n,lo,hi,def)=>Number.isFinite(Number(n))?
 Math.max(lo,Math.min(hi,Number(n))):def;
function slotsFor(spec,record={}){
 const data=spec?.npcTransport;
 if(!data?.modular||!data.emptyVehicle||!Array.isArray(data.slots)||
    spec?.source!=='pipeline-street'||spec?.pack!=='indonesia-200-v1'||
    spec?.category!=='transport'||record.npcDisabled===true)return [];
 const override=record.npcProfiles&&typeof record.npcProfiles==='object'?
  record.npcProfiles:{};
 const passengers=record.npcPassengers&&typeof record.npcPassengers==='object'?
  record.npcPassengers:{};
 return data.slots.filter(s=>{
  if(!s||!safeId(s.role)||!safeId(s.profile)||!Array.isArray(s.anchor)||
     s.anchor.length!==3||!s.anchor.every(Number.isFinite))return false;
  if(s.optional&&passengers[s.role]===false)return false;
  if(s.optional&&s.enabledByDefault!==true&&passengers[s.role]!==true)return false;
  return true;
 }).map(s=>({
  role:s.role,profile:safeId(override[s.role])?override[s.role]:s.profile,
  action:safeId(s.action)?s.action:'sit_idle_transport',
  anchor:s.anchor.map(Number),scale:bound(s.scale,.25,1.4,.6),
  layer:s.layer==='rear'?'rear':'front',optional:!!s.optional,
  equipment:Array.isArray(s.equipment)?s.equipment.filter(safeId):[]
 }));
}
function actionFor(bridge,profile,action){
 // The Action Editor may publish the actual pedal or ride action; do not
 // substitute a different actor's action sheet or display NO RIG placeholders.
 if(g.VLActionTemplates?.get?.(profile,action)?.ready)return action;
 if(bridge?.available?.(profile,action))return action;
 if(bridge?.available?.(profile,ACTIONS[action]||'sit'))
  return ACTIONS[action]||'sit';
 if(bridge?.available?.(profile,'sit'))return 'sit';
 if(bridge?.available?.(profile,'idle'))return 'idle';
 return null;
}
function create(THREE,root,spec,record={},rigFactory=g.VLCharacterRig){
 const desired=slotsFor(spec,record);
 if(!desired.length||!rigFactory?.createRig||!THREE?.Group)return null;
 const bridge=g.VLMahlukHidup;
 const group=new THREE.Group();group.name='Modular Transport NPCs';
 group.userData.transportNPC=true;group.userData.assetId=spec.id;
 root.add(group);
 const actors=new Map();
 let time=0,disposed=false,prevDirection='';
 const npcLabel=(slot)=>'NPC '+slot.role+' / '+slot.profile;
 function install(slot){
  // A real child template must exist; never shrink a grown human and call
  // it a child. Optional guests wait until the Mahluk catalog is ready.
  // Only instantiate a genuinely published Mahluk profile. Otherwise
  // createRig() permanently resolves the early placeholder as Ichsan.
  if(!bridge?.ready||!bridge?.has?.(slot.profile))return;
  const profile=slot.profile;
  const seat=new THREE.Group();
  seat.name=npcLabel(slot);
  seat.position.set(slot.anchor[0],slot.anchor[1],slot.anchor[2]);
  seat.scale.setScalar(slot.scale);
  seat.userData.seatRole=slot.role;
  seat.userData.characterId=profile;
  seat.userData.animation=slot.action;
  seat.userData.layer=slot.layer;
  group.add(seat);
  const rig=rigFactory.createRig(THREE,{profile,direction:'sw'});
  seat.add(rig.mesh);
  // Layered presentation remains depth-tested, just like ojol and every
  // other genuine isometric occupant; never force a translucent overlay.
  rig.mesh.userData.transportOccupant=true;
  rig.mesh.userData.transportRole=slot.role;
  rig.mesh.renderOrder=slot.layer==='rear'?1:3;
  const actor={slot,seat,rig,action:null,profile,timeOffset:actors.size*.45};
  actors.set(slot.role,actor);
  return actor;
 }
 for(const slot of desired)install(slot);
 function step(dt,camera){
  if(disposed)return;
  time+=Math.min(.075,Math.max(0,Number(dt)||0));
  // When Mahluk finishes fetching its catalog, optional real children
  // and guest passengers can spawn automatically, without rebuilding city.
  if(bridge?.ready){
   for(const slot of desired){
    if(!actors.has(slot.role))install(slot);
   }
  }
  const dir=facing(record.rotation ?? 0);
  if(dir!==prevDirection)prevDirection=dir;
  const yaw=(Number(root.rotation?.y)||0);
  for(const actor of actors.values()){
   const {slot,rig,seat}=actor;
   const pose=actionFor(bridge,actor.profile,slot.action);
   if(!pose){seat.visible=false;continue;}
   seat.visible=true;
   if(actor.action!==pose){rig.setPose(pose);actor.action=pose;}
   if(rig.state.direction!==dir)rig.setDirection(dir);
   const origin=root.getWorldPosition?
    root.getWorldPosition(new THREE.Vector3()):root.position;
   rig.step(dt,camera,origin);
   // The world sprite faces the camera. Cancel the parent's authored
   // 0/90/180/270° placement rotation to prevent crab-like rider turns.
   rig.mesh.rotation.y-=yaw;
   // Native Mahluk sit frames are animateable. Procedural physical motion
   // adds subtle bob/lean for a vehicle with its own four-way art. Dedicated
   // pedal-becak action sheets, when published, take priority automatically.
   const style=kindOf(slot.action),active=record.npcAnimation!==false;
   const rate=style==='pedal'?1.55:style==='ride'?0.93:0.52;
   const phi=(time+actor.timeOffset)*Math.PI*2*rate;
   const a=active?Math.sin(phi):0;
   const b=active?Math.sin(phi*2):0;
   rig.mesh.position.y+=style==='pedal'?a*.028:b*.013;
   rig.mesh.position.x+=style==='pedal'?a*.026:a*.008;
   rig.mesh.rotation.z+=style==='pedal'?a*.017:a*.009;
   seat.userData.cyclePhase=phi%(Math.PI*2);
   seat.userData.motionSource=pose===slot.action?'mahluk-action':'mahluk-'+pose+'+procedural';
  }
 }
 function dispose(){
  if(disposed)return;disposed=true;
  for(const actor of actors.values()){
   actor.seat.remove(actor.rig.mesh);
   actor.rig.dispose();
  }
  actors.clear();
  group.parent?.remove(group);
 }
 return {group,actors,step,dispose,slots:desired,assetId:spec.id};
}
g.VLSemestaTransportNPC=Object.freeze({slotsFor,actionFor,create,facing,ACTIONS});
})(typeof window!=='undefined'?window:globalThis);
