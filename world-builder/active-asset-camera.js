/* Semesta — placed-object browser and non-destructive orthographic camera aim.
 * Works on authored city objects and their LIVE rendered roots (traffic/NPCs).
 * No map geometry changes, network calls, or localStorage writes.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VLActiveAssetCamera=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const finite=v=>Number.isFinite(v);
 function list(objects){
  if(!Array.isArray(objects))return [];
  return objects.filter(o=>o&&typeof o.id==='string'&&o.id&&typeof o.type==='string')
   .map(o=>({id:o.id,name:String(o.name||o.id),type:o.type}));
 }
 function target(objects,owners,id){
  if(!id)return null;
  const obj=objects?.find(o=>o.id===id);
  if(!obj)return null;
  const live=owners?.get?.(id)?.position;
  const x=finite(live?.x)?live.x:obj.x,z=finite(live?.z)?live.z:obj.z;
  if(!finite(x)||!finite(z))return null;
  const dimensions=[obj.w,obj.d,obj.h].filter(finite).map(n=>Math.abs(n));
  return {id:obj.id,name:obj.name||obj.id,type:obj.type,x,z,
   extent:Math.max(1,...dimensions)};
 }
 function viewSize(current,t){
  const n=finite(current)?current:35;
  if(!t)return Math.min(180,Math.max(8,n));
  // Zoom into a distant object from wide map view, but keep user zoom
  // when already close. Larger building footprints still fit.
  return Math.min(180,Math.max(8,Math.max(Math.min(n,30),t.extent*2.7)));
 }
 function ease(focus,t,dt){
  if(!focus||!t)return {moved:false,arrived:true};
  const before=Math.hypot(t.x-focus.x,t.z-focus.z);
  if(before<.012){
   if(before>0){focus.x=t.x;focus.z=t.z;}
   return {moved:before>0,arrived:true};
  }
  const alpha=1-Math.exp(-Math.max(0,Math.min(.1,Number(dt)||0))*11);
  focus.x+=(t.x-focus.x)*alpha;focus.z+=(t.z-focus.z)*alpha;
  return {moved:true,arrived:Math.hypot(t.x-focus.x,t.z-focus.z)<.012};
 }
 return Object.freeze({list,target,viewSize,ease});
});
