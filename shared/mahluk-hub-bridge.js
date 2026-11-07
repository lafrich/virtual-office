/* Read-only MAHLUK HIDUP.EXE data bridge for Semesta, Bangun Ruang and Jiwa.
 * No draft or Grok preview becomes a playable action automatically.
 * Same origin localStorage (and VLHub BroadcastChannel) is the source of truth.
 */
(function(root,factory){
 "use strict";
 const api=factory(root);
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.VLMahlukUnifiedBridge=api;
})(typeof window!=="undefined"?window:null,function(root){
 "use strict";
 const ACTION_KEY="mahluk-action-situations-v1";
 const CLIPS_KEY="vl-v6p-act-clips-v1";
 const SHARED="mahluk-unified-bridge-v1";
 function parse(k){
  try{return JSON.parse(root?.localStorage?.getItem(k)||"null")}catch{return null}
 }
 function validAction(row){
  return !!row&&/^[a-z][a-z0-9_]{1,47}$/.test(row.id)&&typeof row.name==="string"&&row.name.length<=80&&
   ["interact","event","automatic","script"].includes(row.trigger)&&
   ["any","chair","bed","toilet","shower","table","door","vehicle","npc","custom"].includes(row.object)&&
   ["enter","loop","exit"].every(p=>typeof row[p]==="string"&&row[p].length<=150);
 }
 function situationDrafts(){
  const data=parse(ACTION_KEY);
  if(data?.format!=="mahluk-situation-database-v1"||!Array.isArray(data.items))return [];
  return data.items.filter(validAction).slice(0,150).map(r=>Object.freeze({
   id:r.id,name:r.name,trigger:r.trigger,object:r.object,
   enter:r.enter,loop:r.loop,exit:r.exit,
   offsetX:Number(r.offsetX)||0,offsetY:Number(r.offsetY)||0,
   notes:String(r.notes||"").slice(0,400),
   status:"draft_unapproved",playable:false,source:"mahluk-hidup-exe"
  }));
 }
 function animationDrafts(){
  const data=parse(CLIPS_KEY);
  if(data?.format!=="v6p-act-clips-store-v1"||!data.clips)return [];
  return Object.entries(data.clips).filter(([id,row])=>
   /^[a-z][a-z0-9_]{0,70}$/.test(id)&&row?.manifest&&Array.isArray(row.manifest.frames))
  .map(([id,row])=>Object.freeze({
   id,label:String(row.manifest.name||id).slice(0,60),frames:row.manifest.frames.length,
   loop:row.manifest.loop!==false,
   status:row.manifest.reviewStatus||"user_draft",playable:false,source:"mahluk-hidup-exe"
  }));
 }
 // Never expose the entire sensitive user record or render original sprites in
 // other modules without an explicit approved gameplay contract.
 function playableActions(){return []}
 function subscribe(handler){
  if(typeof handler!=="function")return ()=>{};
  const listener=e=>{if(e?.key===ACTION_KEY||e?.key===CLIPS_KEY)handler({type:"mahluk-database-updated",key:e.key})};
  root?.addEventListener?.("storage",listener);
  const unsub=root?.VLHub?.subscribe?.(["actions","animations"],handler)||(()=>{});
  return ()=>{root?.removeEventListener?.("storage",listener);unsub()};
 }
 return Object.freeze({
  FORMAT:SHARED,ACTION_KEY,CLIPS_KEY,situationDrafts,animationDrafts,playableActions,subscribe,
  editorUrl:"https://lafrich.github.io/virtual-life-asset-pipeline/mahluk-hidup.html"
 });
});
