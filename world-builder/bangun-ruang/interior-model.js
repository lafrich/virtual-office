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
const dimensions=cfg=>[limit(Number(cfg?.w)*2||6,4,24),limit(Number(cfg?.d)*2||6,4,24)];
function layout(cfg,theme='empty'){
 const [width,depth]=dimensions(cfg);
 return {format:'virtual-life-interior-v1',version:1,width,depth,theme,entrance:{c:Math.floor(width/2),r:depth-1},
  items:[],floor:1,notes:'Interior action slots are editor metadata; game runtime hookup pending.'};
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
 if(raw.entrance&&Number.isInteger(raw.entrance.c)&&Number.isInteger(raw.entrance.r))
  base.entrance={c:limit(raw.entrance.c,0,base.width-1),r:limit(raw.entrance.r,0,base.depth-1)};
 base.items=[];
 const ids=new Set();
 for(const old of Array.isArray(raw.items)?raw.items.slice(0,100):[]){
  if(!TYPES[old.assetId]||typeof old.id!=='string'||ids.has(old.id))continue;
  const c=Number(old.c),r=Number(old.r),rot=[0,90,180,270].includes(old.rotation)?old.rotation:0;
  if(!Number.isInteger(c)||!Number.isInteger(r)||!canPlace(base,old.assetId,c,r,null,rot))continue;
  ids.add(old.id);
  const obj={id:old.id.slice(0,90),assetId:old.assetId,name:TYPES[old.assetId].label,
   c,r,rotation:rot,actionId:TYPES[old.assetId].actions[0],
   pose:null,capacity:limit(old.capacity||1,1,8),
   blocking:old.blocking!==false,triggerRadius:Math.max(.4,Math.min(3,Number(old.triggerRadius)||1.15))};
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
 dimensions,create:layout,preset,normalize,canPlace,add,move,action,occupied,slots,clone});
})(window);
