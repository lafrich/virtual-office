/* Shared, data-only link between a named Semesta City Draft and one
 * Bangun Ruang building. Never moves other city objects or overwrites terrain.
 * Stored City Drafts are browser-local, not a multiplayer/cloud operation.
 */
(function(g){
'use strict';
const UPDATE_KEY='virtual-life-city-building-update-v1';
const WORKING_KEY='virtual-life-gpt-world-builder-pipeline-v3';
const ACTIVE_KEY='virtual-life-active-city-draft';
const ASSET_KEY='virtual-life-bangun-ruang-v1';
const clone=v=>JSON.parse(JSON.stringify(v));
const buildingGroups=new Set(['jalan','kampung','loak']);
function isBuilding(o,catalog){
 if(!o)return false;
 if(o.type==='building'||o.type==='shop')return true;
 if(o.type==='virtual_asset')return o.assetCategory==='building';
 if(o.type!=='sprite')return false;
 const spec=catalog?.find?.(s=>s.file===o.asset)||
   catalog?.get?.(o.asset);
 if(spec?.source==='custom-building')return true;
 if(spec?.source==='pipeline-street'&&buildingGroups.has(spec.group))return true;
 return o.layer==='structure'&&o.asset?.startsWith('studio:');
}
function inventory(document,catalog){
 const objects=Array.isArray(document?.objects)?document.objects:[];
 return objects.filter(o=>isBuilding(o,catalog));
}
function replaceInstance(original,asset){
 if(!original?.id||!asset?.id||!asset?.config||!asset?.views?.sw)
  throw Error('City instance or saved building asset is invalid');
 const main=asset.views.sw;
 const c=asset.config,enterable=asset.interactive===true&&asset.enterable===true;
 const updated={...clone(original),
  type:'sprite',asset:'studio:'+asset.id,
  name:String(asset.name||original.name||'Building').slice(0,90),
  width:main.size[0]/50,
  height:Math.max(1,main.pivot[1]*Math.SQRT2/64*2/Math.sqrt(3)),
  layer:'structure',subtype:asset.id,
  collision:c.collision!=='no',blocking:c.collision==='no'?'no':'yes',
  tags:[...new Set([...(Array.isArray(original.tags)?original.tags:[]),'bangun-ruang','building'])],
  interactions:Array.isArray(asset.interactions)?clone(asset.interactions):[],
  entranceFacing:enterable?(asset.entranceFacing||'sw'):'',
  interactive:enterable,enterable,
  entrance:enterable&&asset.entrance?clone(asset.entrance):null,
  interior:enterable&&asset.interior?clone(asset.interior):null,
  actionSlots:enterable&&Array.isArray(asset.actionSlots)?clone(asset.actionSlots):[],
  replaceable:true};
 // Old 3D placeholder sizing or original-vault refs must not override the
 // native studio footprint. Transform (x,z,y,rotation,scale) stays untouched.
 for(const key of ['sizeClass','w','d','h','assetPath','assetCategory'])delete updated[key];
 return updated;
}
// Interior-only edits must not replace the original building sprite/mesh,
// transform or collision. This is the default for Semesta's context action.
function replaceInterior(original,asset){
 if(!original?.id||!asset?.interior?.floors?.length||asset.interactive!==true)
  throw Error('Enable Interactive and save at least one interior floor');
 const actions=[...new Set([...(Array.isArray(original.interactions)?original.interactions:[]),
  ...(Array.isArray(asset.interactions)?asset.interactions:[]),'enter'])];
 return {...clone(original),interactive:true,enterable:true,
  interior:clone(asset.interior),actionSlots:clone(asset.actionSlots||[]),
  entrance:asset.entrance?clone(asset.entrance):original.entrance||null,
  entranceFacing:asset.entranceFacing||original.entranceFacing||'sw',
  interactions:actions.slice(0,30),
  tags:[...new Set([...(Array.isArray(original.tags)?original.tags:[]),'bangun-ruang','interior'])]};
}
function updateDocument(document,objectId,asset,{interiorOnly=false}={}){
 if(!document||!Array.isArray(document.objects))throw Error('Invalid City Draft document');
 let found=false;
 const next={...document,objects:document.objects.map(o=>{
  if(o.id!==objectId)return o;
  found=true;return interiorOnly?replaceInterior(o,asset):replaceInstance(o,asset);
 })};
 if(!found)throw Error('Building no longer exists in the saved city');
 return next;
}
function patchWorkingCopy(cityId,objectId,asset,options={}){
 try{
  if(localStorage.getItem(ACTIVE_KEY)!==cityId)return false;
  const original=JSON.parse(localStorage.getItem(WORKING_KEY)||'null');
  if(!original?.objects?.some(x=>x.id===objectId))return false;
  localStorage.setItem(WORKING_KEY,JSON.stringify(updateDocument(original,objectId,asset,options)));
  return true;
 }catch(e){console.warn('Could not patch live working copy',e);return false;}
}
function publishSignal(cityId,objectId,assetId,{interiorOnly=false}={}){
 const event={draftId:cityId,objectId,assetId,interiorOnly,
  nonce:Date.now()+'-'+Math.random().toString(36).slice(2)};
 localStorage.setItem(UPDATE_KEY,JSON.stringify(event));
 try{g.VLHub&&g.VLHub.publish('cityBuilding',event);}catch{}
 return event;
}
function getAsset(id){
 try{
  const assets=JSON.parse(localStorage.getItem(ASSET_KEY)||'[]');
  return Array.isArray(assets)?assets.find(a=>a?.id===id)||null:null;
 }catch{return null;}
}
g.VLSemestaCityBuildings=Object.freeze({
 UPDATE_KEY,WORKING_KEY,ACTIVE_KEY,ASSET_KEY,
 isBuilding,inventory,replaceInstance,replaceInterior,updateDocument,
 patchWorkingCopy,publishSignal,getAsset
});
})(window);
