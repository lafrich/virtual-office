/* Emosi.exe — native 4-view emotion record creation and safe forking.
 * A saved copy gets its own ID; never reuses source Drive metadata or ID.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.EmosiDatabase=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const cleanName=(name,fallback='NEW EMOTION')=>
  String(name||'').trim().replace(/\s+/g,' ').slice(0,90)||fallback;
 function newId(existing=[],stamp=Date.now(),entropy=''){
  const found=new Set(existing);
  const fragment=String(entropy||Math.random().toString(36).slice(2,8))
   .toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,8)||'new';
  const prefix='emotion-'+Math.max(0,Number(stamp)||0).toString(36)+'-'+fragment;
  let candidate=prefix,seq=2;
  while(found.has(candidate)){candidate=prefix+'-'+seq;seq++;}
  return candidate.slice(0,64);
 }
 function fork(source,{id,name,base,png}={}){
  if(!id||!/^[-a-z0-9_]{1,64}$/.test(id))throw Error('Invalid new database emotion ID');
  if(typeof png!=='string'||!/^data:image\/png;base64,[a-z\d+/=]+$/i.test(png))
   throw Error('A complete four-view PNG is required to create an emotion record');
  const original=source||{};
  const {
   driveFileId,driveModifiedTime,cloudSyncHash,template,
   ...ordinary
  }=original;
  return {...ordinary,id,name:cleanName(name,source?'COPY OF '+source.name:'NEW EMOTION'),
   base:base||original.base||'universal',
   frames:Number(original.frames)||1,
   fps:Number(original.fps)||6,
   png};
 }
 return Object.freeze({cleanName,newId,fork});
});
