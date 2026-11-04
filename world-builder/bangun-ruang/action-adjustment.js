/* Bangun Ruang / saved per-fixture action alignment (native sprite pixels).
 * A fixture may have multiple actions, each with a different alignment.
 * Geometry is untouched; this is the actor's pivot/visual offset ONLY.
 */
(function(root,factory){ "use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.VLInteractionAdjust=api;
})(typeof window!=="undefined"?window:null,function(){ "use strict";
 const MAX=120;
 const DIRECTIONS=["auto","sw","se","ne","nw"];
 const LAYERS=["behind","front"];
 const empty=Object.freeze({x:0,y:0,direction:"auto",layer:"behind"});
 const clamp=(n)=>Number.isFinite(Number(n))?Math.max(-MAX,Math.min(MAX,Math.round(Number(n)))):0;
 const actionOK=id=>typeof id==="string"&&/^[a-z][a-z0-9_]{0,79}$/.test(id);
 function normalize(raw){
  const d=DIRECTIONS.includes(raw?.direction)?raw.direction:"auto";
  const l=LAYERS.includes(raw?.layer)?raw.layer:"behind";
  return {x:clamp(raw?.x),y:clamp(raw?.y),direction:d,layer:l};
 }
 function all(raw,allowed){
  const out={};
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return out;
  for(const [id,value] of Object.entries(raw).slice(0,24)){
   if(actionOK(id)&&(!Array.isArray(allowed)||allowed.includes(id)))out[id]=normalize(value);
  }
  return out;
 }
 function get(item,action){
  return normalize(actionOK(action)?item?.actionAdjustments?.[action]:null);
 }
 function set(item,action,value,allowed){
  if(!item||!actionOK(action)||
     (Array.isArray(allowed)&&!allowed.includes(action)))return false;
  const entries=all(item.actionAdjustments,allowed);
  entries[action]=normalize(value);
  item.actionAdjustments=entries;
  return true;
 }
 function reset(item,action){
  if(!item||!actionOK(action))return false;
  const allActions=all(item.actionAdjustments);
  delete allActions[action];item.actionAdjustments=allActions;return true;
 }
 function apply(base,item,action){
  if(!base)return null;
  const a=get(item,action);
  return {...base,pixelOffsetX:(base.pixelOffsetX||0)+a.x,
   pixelOffsetY:(base.pixelOffsetY||0)+a.y,
   direction:a.direction==="auto"?base.direction:a.direction,
   objectLayer:a.layer,actionId:action};
 }
 return Object.freeze({MAX,DIRECTIONS,LAYERS,empty,normalize,all,get,set,reset,apply});
});