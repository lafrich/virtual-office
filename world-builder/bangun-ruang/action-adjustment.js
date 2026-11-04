/* Bangun Ruang / global character-action anchors per OBJECT TYPE + ACTION.
 * WC.use_toilet, bed.sleep, chair.sit etc. are shared across all instances.
 * A new building starts EMPTY; defaults affect actor alignment, never spawn props.
 * Original per-instance offsets are read as legacy fallback, not the standard.
 */
(function(root,factory){"use strict";
 const api=factory(root);
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.VLInteractionAdjust=api;
})(typeof window!=="undefined"?window:null,function(root){"use strict";
 const KEY="virtual-life-object-action-presets-v1";
 const MAX=120,DIRECTIONS=["auto","sw","se","ne","nw"],LAYERS=["behind","front"];
 const empty=Object.freeze({x:0,y:0,direction:"auto",layer:"behind"});
 const clamp=n=>Number.isFinite(Number(n))?Math.max(-MAX,Math.min(MAX,Math.round(Number(n)))):0;
 const actionOK=id=>typeof id==="string"&&/^[a-z][a-z0-9_]{0,79}$/.test(id);
 const typeOK=actionOK;
 function normalize(raw){
  return {x:clamp(raw?.x),y:clamp(raw?.y),
   direction:DIRECTIONS.includes(raw?.direction)?raw.direction:"auto",
   layer:LAYERS.includes(raw?.layer)?raw.layer:"behind"};
 }
 function only(raw,allowed){
  const out={};
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return out;
  for(const [id,value] of Object.entries(raw).slice(0,24))
   if(actionOK(id)&&(!Array.isArray(allowed)||allowed.includes(id)))
    out[id]=normalize(value);
  return out;
 }
 function clean(raw){
  const out={};
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return out;
  for(const [assetId,entries] of Object.entries(raw).slice(0,96)){
   if(!typeOK(assetId))continue;
   const filtered=only(entries);
   if(Object.keys(filtered).length)out[assetId]=filtered;
  }
  return out;
 }
 function storage(){try{return root?.localStorage||null}catch{return null}}
 function read(store=storage()){
  if(!store)return {};
  try{return clean(JSON.parse(store.getItem(KEY)||"{}"))}catch{return {}}
 }
 let presets=read();
 function refresh(){presets=read();return presets}
 // Browser storage event synchronizes default edits across Bangun Ruang tabs.
 if(root?.addEventListener)root.addEventListener("storage",event=>{
  if(event.key===KEY)refresh();
 });
 function forType(assetId,allowed){
  if(!typeOK(assetId))return {};
  return only(presets[assetId],allowed);
 }
 function all(raw,allowed,assetId){
  // The most recently calibrated TYPE DEFAULT always wins over legacy
  // per-instance offsets, including when opening older saved buildings.
  return {...only(raw,allowed),...forType(assetId,allowed)};
 }
 function get(item,action){
  if(!actionOK(action))return normalize(null);
  const type=typeOK(item?.assetId)?presets[item.assetId]?.[action]:null;
  return normalize(type||item?.actionAdjustments?.[action]);
 }
 function getDefault(assetId,action){
  if(!typeOK(assetId)||!actionOK(action))return null;
  const a=presets[assetId]?.[action];
  return a?normalize(a):null;
 }
 function write(store,next){
  if(!store)return false;
  try{
   store.setItem(KEY,JSON.stringify(next));
   const stored=clean(JSON.parse(store.getItem(KEY)||"{}"));
   if(JSON.stringify(stored)!==JSON.stringify(next))return false;
   presets=next;
   return true;
  }catch{return false}
 }
 function setDefault(assetId,action,value,allowed,store=storage()){
  if(!typeOK(assetId)||!actionOK(action)||
   (Array.isArray(allowed)&&!allowed.includes(action)))return false;
  // Read current on-disk state before modifying it to avoid losing presets
  // saved by other tabs between this page load and the Save click.
  const old=read(store),next=clean({...old,
   [assetId]:{...(old[assetId]||{}),[action]:normalize(value)}});
  return write(store,next);
 }
 function migrateFromBuildings(buildings,store=storage()){
  if(!store||!Array.isArray(buildings))return 0;
  const previous=read(store),next=clean(previous);
  let migrated=0;
  // Saved library is newest-first. Adopt the newest old per-instance
  // calibration ONCE per object type/action so existing work is retained.
  for(const building of buildings){
   const floors=building?.interior?.floors;
   if(!Array.isArray(floors))continue;
   for(const floor of floors)for(const item of Array.isArray(floor?.items)?floor.items:[]){
    if(!typeOK(item?.assetId))continue;
    const stored=only(item?.actionAdjustments);
    for(const [action,value] of Object.entries(stored)){
     if(next[item.assetId]?.[action])continue;
     if(!next[item.assetId])next[item.assetId]={};
     next[item.assetId][action]=value;migrated++;
    }
   }
  }
  if(!migrated){presets=previous;return 0}
  return write(store,next)?migrated:0;
 }
 // Retained only for old building data and explicitly chosen per-instance
 // adjustments. The Actions inspector saves a shared type default instead.
 function set(item,action,value,allowed){
  if(!item||!actionOK(action)||
   (Array.isArray(allowed)&&!allowed.includes(action)))return false;
  item.actionAdjustments=only({...item.actionAdjustments,[action]:normalize(value)},allowed);
  return true;
 }
 function reset(item,action){
  if(!item||!actionOK(action))return false;
  const a=only(item.actionAdjustments);delete a[action];item.actionAdjustments=a;
  return true;
 }
 function apply(base,item,action){
  if(!base)return null;
  const a=get(item,action);
  return {...base,pixelOffsetX:(base.pixelOffsetX||0)+a.x,
   pixelOffsetY:(base.pixelOffsetY||0)+a.y,
   direction:a.direction==="auto"?base.direction:a.direction,
   objectLayer:a.layer,actionId:action};
 }
 return Object.freeze({KEY,MAX,DIRECTIONS,LAYERS,empty,normalize,only,
  all,get,getDefault,forType,setDefault,migrateFromBuildings,refresh,
  set,reset,apply});
});