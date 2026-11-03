/* Bangun Ruang · editable interior authoring, NOT executable multiplayer gameplay.
 * Actor pose names follow Semesta's VLCharacterRig aliases (Mahluk Hidup v6b):
 * toilet -> sit, bathe -> swim, work -> sit_type, sleep -> sleep, sit -> sit.
 * Non-rigged actions (cook, wash, shop) stay explicit proposed hooks.
 */
(function(g){
'use strict';
const ACTIONS=Object.freeze({
 use_toilet:{label:'Use toilet',pose:'toilet',description:'Toilet / sit animation'},
 pee:{label:'Pee',pose:'toilet',description:'Toilet pose only; dedicated pee rig not available'},
 poop:{label:'Poop',pose:'toilet',description:'Toilet pose only; dedicated poop rig not available'},
 sleep:{label:'Sleep',pose:'sleep',description:'Sleep pose'},
 rest:{label:'Rest',pose:'lie',description:'Lie / rest pose'},
 sit:{label:'Sit',pose:'sit',description:'Sit pose'},
 relax:{label:'Relax',pose:'sit',description:'Sit pose'},
 work:{label:'Work',pose:'work',description:'Work / sit_type pose'},
 study:{label:'Study',pose:'work',description:'Work / sit_type pose'},
 bathe:{label:'Bathe',pose:'bathe',description:'Bathe / swim pose'},
 wash:{label:'Wash',pose:null,description:'Gameplay hook only; no authored wash animation'},
 cook:{label:'Cook',pose:null,description:'Gameplay hook only; no authored cook animation'},
 buy:{label:'Buy',pose:'talk',description:'Talk pose; checkout gameplay not implemented'},
 sell:{label:'Sell',pose:'talk',description:'Talk pose; vendor gameplay not implemented'},
 browse:{label:'Browse',pose:'idle',description:'Idle preview only'},
 open:{label:'Open',pose:null,description:'Interaction hook only'}
});
const TYPES=Object.freeze({
 wc:{label:'WC / Toilet',category:'Bathroom',glyph:'🚽',w:1,d:1,actions:['use_toilet','pee','poop']},
 shower:{label:'Shower',category:'Bathroom',glyph:'🚿',w:1,d:1,actions:['bathe']},
 bathtub:{label:'Bathtub',category:'Bathroom',glyph:'🛁',w:2,d:1,actions:['bathe']},
 sink:{label:'Sink',category:'Bathroom',glyph:'🚰',w:1,d:1,actions:['wash']},
 bed:{label:'Kasur',category:'Bedroom',glyph:'🛏',w:2,d:2,actions:['sleep','rest']},
 wardrobe:{label:'Wardrobe',category:'Bedroom',glyph:'▥',w:2,d:1,actions:['open']},
 chair:{label:'Kursi',category:'Living',glyph:'▣',w:1,d:1,actions:['sit']},
 sofa:{label:'Sofa',category:'Living',glyph:'▭',w:2,d:1,actions:['sit','relax']},
 table:{label:'Meja',category:'Living',glyph:'▤',w:2,d:1,actions:['browse']},
 desk:{label:'Work Desk',category:'Work',glyph:'▦',w:2,d:1,actions:['work','study']},
 office_chair:{label:'Office Chair',category:'Work',glyph:'▣',w:1,d:1,actions:['sit','work']},
 computer:{label:'Computer',category:'Work',glyph:'▧',w:1,d:1,actions:['work','study']},
 stove:{label:'Kompor',category:'Kitchen',glyph:'▥',w:1,d:1,actions:['cook']},
 fridge:{label:'Kulkas',category:'Kitchen',glyph:'▣',w:1,d:1,actions:['open']},
 kitchen_sink:{label:'Kitchen Sink',category:'Kitchen',glyph:'▨',w:1,d:1,actions:['wash']},
 cashier:{label:'Kasir',category:'Shop',glyph:'▣',w:2,d:1,actions:['buy','sell']},
 shelf:{label:'Rak Barang',category:'Shop',glyph:'▤',w:2,d:1,actions:['browse']},
 counter:{label:'Display Counter',category:'Shop',glyph:'▥',w:2,d:1,actions:['buy','sell']}
});
const TEMPLATES=Object.freeze({
 empty:{label:'Empty / Kosong',theme:'cream',items:[]},
 home:{label:'Rumah',theme:'warm',items:[['bed',2,1],['sofa',1,4],['table',3,4],['wc',5,1]]},
 bedroom:{label:'Kamar Tidur',theme:'warm',items:[['bed',2,1],['wardrobe',5,1],['chair',4,4]]},
 bathroom:{label:'Kamar Mandi',theme:'aqua',items:[['wc',1,1],['shower',3,1],['sink',2,4]]},
 office:{label:'Kantor',theme:'blue',items:[['desk',2,1],['office_chair',2,3],['computer',4,1]]},
 warung:{label:'Warung / Toko',theme:'warm',items:[['counter',3,1],['shelf',1,1],['cashier',4,3]]},
 cafe:{label:'Cafe',theme:'warm',items:[['table',2,2],['chair',2,4],['counter',4,1]]},
 kost:{label:'Kamar Kost',theme:'warm',items:[['bed',1,1],['desk',4,1],['chair',4,3],['wardrobe',1,4]]}
});
const clone=x=>JSON.parse(JSON.stringify(x));
const limit=(v,lo,hi)=>Math.min(hi,Math.max(lo,Math.round(Number(v)||lo)));
// Semesta exterior tiles are native 64x32 isometric. Each INTERIOR tile must
// represent exactly the same world unit: never multiply by two.
// Fractional footprints (e.g. 3×3.2) use only COMPLETE walkable tiles;
// 3 whole interior tiles fit inside 3.2 exterior tiles without stretching.
const tileCount=(v,fallback=3)=>Math.min(24,Math.max(2,Math.floor(Number(v)>0?Number(v):fallback)));
const dimensions=cfg=>[tileCount(cfg?.w),tileCount(cfg?.d)];
function layout(cfg,theme='empty'){
 const [width,depth]=dimensions(cfg);
 return {format:'virtual-life-interior-v1',version:2,width,depth,theme,
  tilePixels:[64,32],unit:'semesta-ground-tile',
  sourceFootprint:[Number(cfg?.w)||width,Number(cfg?.d)||depth],
  entrance:{c:Math.floor(width/2),r:depth-1},
  items:[],floor:1,notes:'1 interior tile = 1 exterior Semesta tile (64×32 px).'};
}
function occupied(item){const t=TYPES[item?.assetId];if(!t)return [];let w=t.w,d=t.d;if((item.rotation||0)%180===90)[w,d]=[d,w];
 const cells=[];for(let c=0;c<w;c++)for(let r=0;r<d;r++)cells.push((item.c+c)+','+(item.r+r));return cells;
}
function canPlace(scene,assetId,c,r,ignore=null,rotation=0){
 const t=TYPES[assetId];if(!t)return false;
 const candidate={assetId,c,r,rotation};
 const cells=occupied(candidate);
 if(!cells.length||cells.some(cell=>{const [x,z]=cell.split(',').map(Number);return x<0||z<0||x>=scene.width||z>=scene.depth;}))return false;
 // Always leave a clear entrance tile and adjacent walking tile.
 const entrance=scene.entrance||{c:Math.floor(scene.width/2),r:scene.depth-1};
 if(cells.includes(entrance.c+','+entrance.r))return false;
 const existing=new Set((scene.items||[]).filter(x=>x.id!==ignore).flatMap(occupied));
 return !cells.some(cell=>existing.has(cell));
}
function add(scene,assetId,c,r){
 const def=TYPES[assetId];if(!def)return null;
 const x=limit(c,0,scene.width-1),z=limit(r,0,scene.depth-1);
 if(!canPlace(scene,assetId,x,z))return null;
 const item={id:'prop-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),
  assetId,name:def.label,c:x,r:z,rotation:0,
  actionId:def.actions[0],pose:ACTIONS[def.actions[0]]?.pose||null,
  capacity:assetId==='sofa'?2:1,blocking:true,triggerRadius:1.15};
 scene.items.push(item);return item;
}
function move(scene,id,c,r,rotation){
 const item=scene.items.find(x=>x.id===id);if(!item)return false;
 const x=limit(c,0,scene.width-1),z=limit(r,0,scene.depth-1),rot=([0,90,180,270].includes(rotation)?rotation:item.rotation);
 if(!canPlace(scene,item.assetId,x,z,id,rot))return false;
 Object.assign(item,{c:x,r:z,rotation:rot});return true;
}
/* Quick furniture rotation is a one-tap operation. Keep the centre stable
 * whenever possible; if a 2x1 item turns into 1x2 at a wall, gently nudge it
 * to the nearest available tile instead of requiring a separate move step.
 * Existing collision and entrance protection remain authoritative.
 */
function rotate(scene,id,steps=1){
 const item=scene?.items?.find(x=>x.id===id);if(!item||!TYPES[item.assetId])return false;
 const turn=Number.isFinite(Number(steps))?Math.trunc(Number(steps)):1;
 const nextRotation=(((item.rotation||0)+turn*90)%360+360)%360;
 const [beforeW,beforeD]=((item.rotation||0)%180===90)?
  [TYPES[item.assetId].d,TYPES[item.assetId].w]:
  [TYPES[item.assetId].w,TYPES[item.assetId].d];
 const [nextW,nextD]=(nextRotation%180===90)?
  [TYPES[item.assetId].d,TYPES[item.assetId].w]:
  [TYPES[item.assetId].w,TYPES[item.assetId].d];
 const centreC=item.c+beforeW/2,centreR=item.r+beforeD/2;
 const maxC=scene.width-nextW,maxR=scene.depth-nextD;
 const candidates=[];
 for(let c=0;c<=maxC;c++)for(let r=0;r<=maxR;r++){
  const centreDist=(c+nextW/2-centreC)**2+(r+nextD/2-centreR)**2;
  const moveDist=(c-item.c)**2+(r-item.r)**2;
  candidates.push({c,r,centreDist,moveDist});
 }
 candidates.sort((a,b)=>a.centreDist-b.centreDist||a.moveDist-b.moveDist||
  Math.abs(a.c-item.c)+Math.abs(a.r-item.r)-
  (Math.abs(b.c-item.c)+Math.abs(b.r-item.r))||a.r-b.r||a.c-b.c);
 // Limit automatic correction to two floor tiles to prevent surprising jumps.
 for(const candidate of candidates){
  if(Math.abs(candidate.c-item.c)>2||Math.abs(candidate.r-item.r)>2)continue;
  if(!canPlace(scene,item.assetId,candidate.c,candidate.r,id,nextRotation))continue;
  Object.assign(item,{c:candidate.c,r:candidate.r,rotation:nextRotation});
  return true;
 }
 return false;
}
function action(scene,id,actionId){
 const item=scene.items.find(x=>x.id===id);if(!item)return false;
 if(!TYPES[item.assetId]?.actions.includes(actionId))return false;
 item.actionId=actionId;item.pose=ACTIONS[actionId]?.pose||null;return true;
}
function preset(cfg,key){
 const scene=layout(cfg,key);const p=TEMPLATES[key]||TEMPLATES.empty;scene.theme=p.theme;
 for(const [assetId,c,r] of p.items){
  const t=TYPES[assetId];if(!t)continue;
  const x=Math.min(c,scene.width-t.w),z=Math.min(r,scene.depth-t.d);
  let obj=add(scene,assetId,x,z);
  if(!obj){
   outer:for(let zz=0;zz<scene.depth;zz++)for(let xx=0;xx<scene.width;xx++){
    obj=add(scene,assetId,xx,zz);if(obj)break outer;
   }
  }
 }
 return scene;
}
function normalize(raw,cfg){
 const base=layout(cfg);
 if(!raw||raw.format!=='virtual-life-interior-v1')return base;
 base.theme=typeof raw.theme==='string'&&raw.theme.length<25?raw.theme:'empty';
 base.floor=limit(raw.floor||1,1,12);
 const oldWidth=Math.max(1,Number(raw.width)||base.width),oldDepth=Math.max(1,Number(raw.depth)||base.depth);
 // Old Bangun Ruang doubled the footprint; reproject legacy furniture into
 // matching exterior coordinates, preserving item IDs, actions and rotation.
 const oldScale=Number(raw.version||1)<2&&
  (Math.abs(oldWidth-base.width)>0.5||Math.abs(oldDepth-base.depth)>0.5);
 const rc=(x,oldD,newD)=>limit(
  oldScale?Math.floor((Number(x)+.5)*newD/oldD):Number(x),0,newD-1);
 if(raw.entrance&&Number.isInteger(raw.entrance.c)&&Number.isInteger(raw.entrance.r)){
  base.entrance={c:rc(raw.entrance.c,oldWidth,base.width),
   r:rc(raw.entrance.r,oldDepth,base.depth)};
 }
 // If source layout used the old doubled footprint, fix its door to the
 // current front edge; otherwise old entrance could remain in room centre.
 if(oldScale)base.entrance={c:Math.floor(base.width/2),r:base.depth-1};
 const ids=new Set();
 for(const old of Array.isArray(raw.items)?raw.items.slice(0,100):[]){
  if(!TYPES[old?.assetId]||typeof old.id!=='string'||ids.has(old.id))continue;
  const rot=[0,90,180,270].includes(old.rotation)?old.rotation:0;
  const c=rc(old.c,oldWidth,base.width),r=rc(old.r,oldDepth,base.depth);
  // Repack nearby rather than silently discarding saved furniture when
  // migrating 6x6 -> 3x3. Collision and the door are still authoritative.
  let pick=null;
  const positions=[];
  for(let zz=0;zz<base.depth;zz++)for(let xx=0;xx<base.width;xx++){
   positions.push({c:xx,r:zz,dist:Math.abs(xx-c)+Math.abs(zz-r)});
  }
  positions.sort((a,b)=>a.dist-b.dist);
  for(const pos of positions){
   if(canPlace(base,old.assetId,pos.c,pos.r,null,rot)){pick=pos;break;}
  }
  if(!pick)continue;
  ids.add(old.id);
  const obj={id:old.id.slice(0,90),assetId:old.assetId,name:TYPES[old.assetId].label,
   c:pick.c,r:pick.r,rotation:rot,actionId:TYPES[old.assetId].actions[0],
   pose:null,capacity:limit(old.capacity||1,1,8),
   blocking:old.blocking!==false,
   triggerRadius:Math.max(.4,Math.min(3,Number(old.triggerRadius)||1.15))};
  base.items.push(obj);
  action(base,obj.id,old.actionId||obj.actionId);
 }
 return base;
}

function slots(scene){
 return (scene?.items||[]).map(item=>({
  id:item.id,assetId:item.assetId,grid:{c:item.c,r:item.r},
  interaction:item.actionId,characterPose:item.pose,actionStatus:item.pose?'rig-preview':'gameplay-hook-only',
  trigger:{kind:'proximity',radius:item.triggerRadius,capacity:item.capacity},
  facing:item.rotation,blocking:item.blocking
 }));
}
g.VLBuildingInterior=Object.freeze({types:TYPES,actions:ACTIONS,templates:TEMPLATES,
 dimensions,create:layout,preset,normalize,canPlace,add,move,rotate,action,occupied,slots,clone});
})(window);
