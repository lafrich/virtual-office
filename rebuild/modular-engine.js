/* Virtual Office Rebuild — modular room and asset placement engine.
   Plain JS, deterministic layers, editable JSON, no encrypted assets. */
(function(global){
'use strict';
const VERSION=1,KEY='vo-rebuild-cove-modules-v1';
// Authoring size and world footprint are independent. Scale existing visual
// artwork without changing editor scale, physical collision or saved layout.
const ART_SCALE=Object.freeze({
 './assets/plant_base.svg':.52,
 './assets/lamp_base.svg':.54,
 './assets/rug_base.svg':.89,
 './assets/shower_base.svg':.47,
 './assets/partition_base.svg':.52,
 './assets/sink_base.svg':.52,
 './assets/mirror_base.svg':.40,
 './assets/door_base.svg':.48,
 './assets/street_props_base.svg':.57,
 './assets/warteg_sign_base.svg':.43
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const num=(v,d)=>Number.isFinite(Number(v))?Number(v):d;
const round=(v,p=100)=>Math.round(v*p)/p;
const def=(id,type,name,x,y,w,d,h,extra={})=>({
 id,type,name,at:{x,y},size:{w,d,h},offset:{x:0,y:0},elevation:0,depthBias:0,
 facing:'SW',scale:1,visible:true,sprite:null,
 visual:global.VOVisualSystem.describeAsset(id,type,w,d),
 action:null,collision:true,...extra
});
const COVE_ITEMS=[
 def('cove-bed','bed','Blue Bed',4.7,6.0,3.30,2.30,13,{
  action:{type:'sleep',label:'TIDUR',range:2.2,approach:{x:.3,y:1.7},pose:{x:0,y:.15}},
  layers:{base:-.34,front:2.1},
  sprite:{base:'./assets/bed_base.svg',front:'./assets/bed_front.svg',pivot:{x:.5,y:.7375}}
 }),
 def('cove-nightstand','nightstand','Nightstand',2.35,5.0,.85,.80,9,{sprite:{base:'./assets/nightstand_base.svg',pivot:{x:.5,y:.79}}}),
 def('cove-lamp','lamp','Bedside Lamp',2.35,5.0,.45,.45,16,{collision:false,elevation:12,sprite:{base:'./assets/lamp_base.svg',pivot:{x:.5,y:.79}}}),
 def('cove-desk','desk','Work Desk',5.45,2.2,2.9,1.15,13,{
  action:{type:'work',label:'KERJA',range:2.0,approach:{x:0,y:1.5}},
  sprite:{base:'./assets/desk_base.svg',pivot:{x:.5,y:.79}}
 }),
 def('cove-desk-chair','chair','Desk Chair',6.55,3.75,.85,.78,10,{
  action:{type:'sit',label:'DUDUK',range:1.4,approach:{x:0,y:.6},pose:{x:0,y:0}},
  layers:{base:-.2,front:1.2},
  sprite:{base:'./assets/chair_base.svg',front:'./assets/chair_front.svg',pivot:{x:.5,y:.79}}
 }),
 def('cove-bookshelf','bookshelf','Book Cabinet',7.60,2.25,1.25,.80,33,{sprite:{base:'./assets/bookshelf_base.svg',pivot:{x:.5,y:.79}}}),
 def('cove-plant','plant','Ficus Plant',8.25,4.10,.75,.72,27,{sprite:{base:'./assets/plant_base.svg',pivot:{x:.5,y:.79}}}),
 def('cove-rug','rug','Cream Rug',4.8,7.20,4.8,3.15,.3,{collision:false,depthBias:-4,sprite:{base:'./assets/rug_base.svg',pivot:{x:.5,y:.79}}}),
 def('cove-bath','bathtub','Green Bathtub',11.85,4.50,3.1,1.55,19,{
  action:{type:'bathe',label:'MANDI',range:2.0,approach:{x:0,y:1.5},pose:{x:0,y:0}},
  layers:{base:-.35,front:1.75},
  sprite:{base:'./assets/bathtub_base.svg',front:'./assets/bathtub_front.svg',pivot:{x:.5,y:.7375}}
 }),
 def('cove-shower','shower','Rain Shower',11.25,1.5,.25,.30,48,{collision:false,sprite:{base:'./assets/shower_base.svg',pivot:{x:.5,y:.79}}}),
 def('cove-partition','partition','Glass Partition',13.6,2.45,.22,2.9,43,{collision:true,depthBias:-2,sprite:{base:'./assets/partition_base.svg',pivot:{x:.5,y:.79}}}),
 def('cove-sink','sink','Bathroom Sink',14.35,4.5,.9,.75,24,{sprite:{base:'./assets/sink_base.svg',pivot:{x:.5,y:.79}}}),
 def('cove-mirror','mirror','Wall Mirror',14.45,2.2,.8,.20,42,{collision:false,elevation:12,sprite:{base:'./assets/mirror_base.svg',pivot:{x:.5,y:.79}}}),
 def('cove-toilet','toilet','Toilet',14.1,7.60,1.30,1.5,15,{
  action:{type:'pee',label:'PIPIS',range:1.7,approach:{x:-.7,y:.1},pose:{x:0,y:.25}},
  layers:{base:-.30,front:1.15},
  sprite:{base:'./assets/toilet_base.svg',front:'./assets/toilet_front.svg',pivot:{x:.5,y:.7375}}
 }),
 def('cove-dresser','dresser','Wood Dresser',7.2,5.40,1.45,.9,20,{sprite:{base:'./assets/dresser_base.svg',pivot:{x:.5,y:.79}}}),
 def('cove-door','door','Bedroom Door',9.0,7.20,.33,1.38,41,{
  sprite:{base:'./assets/door_base.svg',pivot:{x:.5,y:.79}},collision:false,action:{type:'zone',label:'OFFICE',to:'office',range:2,approach:{x:-1.2,y:.1}}
 })
];
const SAFE_FIELDS={
 'at.x':[-1,18],'at.y':[-1,13],
 'offset.x':[-48,48],'offset.y':[-48,48],
 'size.w':[.10,7],'size.d':[.10,7],'size.h':[.1,80],
 'elevation':[-20,60],'depthBias':[-4,4],'scale':[.40,2.5],
 'action.approach.x':[-4,4],'action.approach.y':[-4,4],
 'action.pose.x':[-4,4],'action.pose.y':[-4,4]
};
const directions=['SW','SE','NW','NE'];
function cleanData(src,base){
 const d=typeof structuredClone==='function'?structuredClone(base):JSON.parse(JSON.stringify(base));
 if(!src||typeof src!=='object')return d;
 for(const [path,bounds] of Object.entries(SAFE_FIELDS)){
  const segments=path.split('.');let source=src,target=d;
  for(let i=0;i<segments.length-1;i++){source=source?.[segments[i]];target=target?.[segments[i]]}
  const k=segments.at(-1);
  if(source&&target&&Object.prototype.hasOwnProperty.call(source,k)){
   const v=Number(source[k]);
   if(Number.isFinite(v))target[k]=round(clamp(v,...bounds),1000);
  }
 }
 if(typeof src.visible==='boolean')d.visible=src.visible;
 if(directions.includes(src.facing))d.facing=src.facing;
 // Optional sprites can be registered as safe same-origin paths; no injection/URLs.
 if(src.sprite&&typeof src.sprite==='object'){
  const sprite={};
  for(const part of ['base','front']){
   const path=src.sprite[part];
   if(typeof path==='string'&&/^\.\/assets\/[\w./-]+\.(?:png|svg)$/.test(path)&&!path.includes('..'))sprite[part]=path;
  }
  if(Object.keys(sprite).length){
   // Only built-in matching sprites inherit the calibrated non-bottom pivot.
   // Uploaded user sprites keep the original bottom-center convention.
   if(base.sprite?.pivot && sprite.base===base.sprite.base &&
      sprite.front===base.sprite.front) sprite.pivot={...base.sprite.pivot};
   d.sprite=sprite;
  }
 }
 return d;
}
class ModularWorld{
 constructor(options={}){
  this.room=options.room||'cove';
  this.key=this.room==='cove'?KEY:'vo-rebuild-modules-'+this.room+'-v1';
  this.width=options.width||16;this.height=options.height||11;
  this.tileSize={x:23,y:11.5};
  this.version=VERSION;
  const source=options.assets||COVE_ITEMS;
  this.defaultAssets=source.map(x=>JSON.parse(JSON.stringify(x)));
  this.assets=this.defaultAssets.map(x=>JSON.parse(JSON.stringify(x)));
  this.selectedId=this.assets[0]?.id||null;
  this.listeners=new Set();
  this.images=new Map();
  this.load();
  // Preload authored sprites before the first frame.
  for(const a of this.assets)for(const part of ['base','front'])if(a.sprite?.[part])this.image(a.sprite[part]);
 }
 onChange(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn)}
 changed(){for(const fn of this.listeners)try{fn(this)}catch(e){console.warn(e)}}
 get(id){return this.assets.find(x=>x.id===id)||null}
 get selected(){return this.get(this.selectedId)}
 select(id){if(this.get(id)){this.selectedId=id;this.changed();return true}return false}
 update(id,path,value,{silent=false}={}){
  const item=this.get(id),range=SAFE_FIELDS[path];if(!item||!range)return false;
  const n=Number(value);if(!Number.isFinite(n))return false;
  let v=round(clamp(n,...range),1000);
  const names=path.split('.');let dest=item;
  for(let i=0;i<names.length-1;i++)dest=dest[names[i]];
  dest[names.at(-1)]=v;
  if(!silent){this.save();this.changed()}
  return true;
 }
 toggle(id){const a=this.get(id);if(!a)return;a.visible=!a.visible;this.save();this.changed()}
 setCollision(id,value){const a=this.get(id);if(!a)return;a.collision=!!value;this.save();this.changed()}
 setSprite(id,part,path){
  const a=this.get(id);if(!a||!['base','front'].includes(part))return false;
  if(path&&!/^\.\/assets\/[\w./-]+\.(?:png|svg)$/.test(path)||path&&path.includes('..'))return false;
  if(!a.sprite)a.sprite={};if(path)a.sprite[part]=path;else delete a.sprite[part];
  // Custom sprites use the existing bottom-center convention by default.
  const base=this.defaultAssets.find(d=>d.id===id);
  if(a.sprite.pivot && (a.sprite.base!==base?.sprite?.base||
      a.sprite.front!==base?.sprite?.front))delete a.sprite.pivot;
  else if(base?.sprite?.pivot && a.sprite.base===base.sprite.base &&
      a.sprite.front===base.sprite.front)a.sprite.pivot={...base.sprite.pivot};
  this.save();this.changed();return true;
 }
 setFacing(id,value){const a=this.get(id);if(a&&directions.includes(value)){a.facing=value;this.save();this.changed()}}
 reset(id){
  if(id){
   const at=this.assets.findIndex(a=>a.id===id),base=this.defaultAssets.find(a=>a.id===id);
   if(at<0||!base)return;this.assets[at]=JSON.parse(JSON.stringify(base))
  }else this.assets=this.defaultAssets.map(a=>JSON.parse(JSON.stringify(a)));
  this.save();this.changed();
 }
 snapshot(){return {format:'virtual-office-modular-room',version:VERSION,room:this.room,
  grid:{width:this.width,height:this.height,tile:this.tileSize},
  assets:this.assets.map(a=>JSON.parse(JSON.stringify(a)))}}
 serialize(){return JSON.stringify(this.snapshot(),null,2)}
 applyJSON(text){
  let source=typeof text==='string'?JSON.parse(text):text;
  if(!source||source.format!=='virtual-office-modular-room'||source.room!==this.room||!Array.isArray(source.assets)){
   throw new Error('Format harus virtual-office-modular-room / cove');
  }
  // Only known IDs, only whitelisted placement fields. Never mutate registry entries.
  const mapped=new Map(source.assets.filter(x=>x&&typeof x.id==='string').map(x=>[x.id,x]));
  this.assets=this.defaultAssets.map(base=>cleanData(mapped.get(base.id),base));
  this.save();this.changed();return this.assets.length;
 }
 save(){try{localStorage.setItem(this.key,this.serialize())}catch(e){}}
 load(){try{const old=localStorage.getItem(this.key);if(old)this.applyJSON(old)}catch(e){console.warn('[modular] invalid saved layout, using defaults',e)}}
 actionPoints(){
  return this.assets.filter(a=>a.visible&&a.action).map(a=>{
   const act=a.action,anchor=act.approach||{x:0,y:0},pose=act.pose||{x:0,y:0};
   return {id:a.id,type:act.type,label:act.label,to:act.to||null,r:act.range||1.5,
    x:a.at.x+anchor.x,y:a.at.y+anchor.y,
    seatX:a.at.x+pose.x,seatY:a.at.y+pose.y,asset:a}
  })
 }
 nearestAction(p){
  let candidate=null,dist=Infinity;
  for(const a of this.actionPoints()){
   const d=Math.hypot(p.x-a.x,p.y-a.y);
   if(d<a.r&&d<dist){candidate=a;dist=d}
  }
  return candidate;
 }
 blocked(x,y,{ignoreId=null}={}){
  if(x<.35||x>this.width-.35||y<.35||y>this.height-.35)return true;
  // Collision uses tile footprint, entirely independent of pixel/sprite offsets.
  return this.assets.some(a=>{
   if(!a.visible||!a.collision||a.id===ignoreId)return false;
   const w=a.size.w*.81,d=a.size.d*.78;
   return Math.abs(x-a.at.x)<w/2+.14 && Math.abs(y-a.at.y)<d/2+.14;
  })
 }
 pick(screenX,screenY,project,{radius=28}={}){
  let winner=null,closest=Infinity;
  for(const a of this.assets){
   if(!a.visible)continue;
   const q=project(a.at.x,a.at.y,a.elevation);
   const x=q.x+a.offset.x*project.zoom,y=q.y+a.offset.y*project.zoom;
   const dist=Math.hypot(screenX-x,screenY-(y-a.size.h*project.zoom*.45));
   const limit=radius+a.size.w*4*project.zoom;
   if(dist<limit&&dist<closest){closest=dist;winner=a}
  }
  return winner;
 }
 commands(player){
  const entries=[];
  for(const a of this.assets){
   if(!a.visible)continue;
   const depth=a.at.x+a.at.y+a.depthBias;
   const front=a.layers&&Number.isFinite(a.layers.front);
   entries.push({kind:'asset',asset:a,part:'base',depth:depth+(a.layers?.base??-.1)});
   if(front)entries.push({kind:'asset',asset:a,part:'front',depth:depth+a.layers.front});
  }
  if(player)entries.push({kind:'player',depth:player.x+player.y+.05});
  entries.sort((a,b)=>a.depth-b.depth||(a.kind==='player'?1:-1));
  return entries;
 }
 image(src){
  if(!src)return null;
  if(!this.images.has(src)){
   const img=new Image();
   const entry={img,ready:false,failed:false};
   img.onload=()=>{entry.ready=true};img.onerror=()=>{entry.failed=true};
   img.src=src;this.images.set(src,entry)
  }
  const o=this.images.get(src);return o.ready?o.img:null
 }
 drawSprite(api,a,part,position=null){
  const img=a.sprite?.[part]&&this.image(a.sprite[part]);
  if(!img)return false;
  const zoom=api.zoom,g=api.ctx;
  const at=position||a.at;
  const p=api.iso(at.x,at.y,a.elevation);
  const scale=zoom*a.scale*(ART_SCALE[a.sprite[part]]||1);
  const pivot=a.sprite?.pivot;
  const px=Math.min(1,Math.max(0,Number.isFinite(pivot?.x)?pivot.x:.5));
  const py=Math.min(1,Math.max(0,Number.isFinite(pivot?.y)?pivot.y:1));
  // SVG artwork scales smoothly; custom PNG pixel sprites remain nearest-neighbour.
  g.save();
  g.imageSmoothingEnabled=/\.svg(?:\?|$)/i.test(a.sprite[part]);
  const width=img.width*scale,height=img.height*scale;
  g.drawImage(img,p.x-width*px,p.y-height*py,width,height);
  g.restore();
  return true;
 }
 render(api,player){
  const g=api.ctx,zoom=api.zoom;
  for(const job of this.commands(player)){
   if(job.kind==='player'){api.drawPlayer();continue}
   const a=job.asset;g.save();
   g.translate(Math.round(a.offset.x*zoom),Math.round(a.offset.y*zoom));
   const src=a.sprite?.[job.part],state=src&&this.images.get(src);
   // Never flash old geometric art while the authored SVG is loading.
   if(!this.drawSprite(api,a,job.part)&&api.drawPlaceholder&&(!src||state?.failed))
    api.drawPlaceholder(a,job.part);
   g.restore()
  }
 }
}
global.VOModular={ModularWorld,COVE_ITEMS,SAFE_FIELDS,VERSION};
})(window);
