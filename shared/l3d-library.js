/* L3D asset contract shared by L3D.EXE and Semesta.
 * Data-only model JSON, same-origin library; existing 2D pipeline unchanged.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.VLL3DLibrary=api;
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:null,function(){
 'use strict';
 const KEY='virtual-life-l3d-library-v1',FORMAT='semesta-l3d-asset-v1',MAX_RECORD=3800000;
 const KINDS=['building','vehicle','prop','furniture'];
 const sane=n=>Number.isFinite(Number(n))?Number(n):0;
 const copy=v=>JSON.parse(JSON.stringify(v));
 function validate(input,options={}){
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('L3D record must be an object');
  if(input.format!==FORMAT)throw Error('Unsupported L3D format');
  if(!/^[a-z][a-z0-9_-]{1,63}$/.test(input.id||''))throw Error('Asset ID: use 2–64 lowercase letters/numbers/_/-');
  if(typeof input.name!=='string'||!input.name.trim()||input.name.length>100)throw Error('Invalid asset name');
  if(!KINDS.includes(input.kind))throw Error('Invalid L3D category');
  const fp=input.footprint;
  if(!Array.isArray(fp)||fp.length!==2||fp.some(v=>!Number.isFinite(v)||v<.1||v>100))throw Error('Footprint must be 0.1–100 tiles');
  if(!Number.isFinite(input.height)||input.height<.1||input.height>100)throw Error('Height must be 0.1–100 tiles');
  if(!input.model||input.model.metadata?.type!=='Object'||!input.model.object||typeof input.model.object!=='object')
   throw Error('Missing Three.js Object3D JSON');
  if(typeof input.thumbnail==='string'&&input.thumbnail&&!/^data:image\/png;base64,/.test(input.thumbnail))throw Error('Invalid thumbnail');
  const payload=JSON.stringify(input);
  if(options.enforceStorageLimit&&payload.length>MAX_RECORD)throw Error('Model too large for browser library; use Export JSON');
  return true;
 }
 function read(){
  try{
   const obj=JSON.parse(localStorage.getItem(KEY)||'{}');
   if(obj?.format!==FORMAT||!Array.isArray(obj.assets))return [];
   return obj.assets.filter(x=>{try{validate(x);return true}catch{return false}});
  }catch{return []}
 }
 function list(){return read().map(copy)}
 function get(id){const r=read().find(x=>x.id===id);return r?copy(r):null}
 function save(record){
  validate(record,{enforceStorageLimit:true});
  const assets=read().filter(x=>x.id!==record.id);
  assets.push(copy(record));
  try{localStorage.setItem(KEY,JSON.stringify({format:FORMAT,version:1,assets}));}
  catch(e){throw Error('Browser storage full. Export JSON first or remove unused 3D assets. '+e.message)}
  return get(record.id);
 }
 function remove(id){
  const all=read(),next=all.filter(x=>x.id!==id);
  if(all.length===next.length)return false;
  localStorage.setItem(KEY,JSON.stringify({format:FORMAT,version:1,assets:next}));
  return true;
 }
 function catalogEntries(){
  return read().map(x=>({
   id:x.id,file:'l3d:'+x.id,label:x.name,source:'l3d-3d',
   group:x.kind==='building'?'L3D Buildings':x.kind==='vehicle'?'L3D Vehicles':'L3D Objects',
   objectCategory:x.kind,footprint:x.footprint,width:x.footprint[0],
   height:x.height,collision:x.collision!==false,published:true,
   thumbnail:x.thumbnail||'',l3dId:x.id
  }));
 }
 function attach(THREE,root,spec){
  const id=String(spec?.l3dId||spec?.id||'');
  const record=get(id);
  if(!record||!THREE?.ObjectLoader)return false;
  try{
   const object=new THREE.ObjectLoader().parse(record.model);
   object.name='L3D / '+record.name;
   object.traverse?.(child=>{
    if(child.isMesh){child.castShadow=true;child.receiveShadow=true;}
   });
   root.add(object);
   root.userData.l3dId=record.id;
   root.userData.l3dType=record.kind;
   return true;
  }catch(e){console.warn('L3D model could not be loaded:',id,e);return false}
 }
 return Object.freeze({KEY,FORMAT,MAX_RECORD,KINDS,validate,list,get,save,remove,catalogEntries,attach});
});
