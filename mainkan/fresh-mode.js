/* Preview-only ?fresh=1: isolate localStorage under njh-fresh-v1:, wipe that
   namespace on each load, and advertise window.NJH_FRESH_MODE. No credentials
   are stored here. Load this file first (non-deferred) in Mainkan and in the
   Semesta player iframe so later scripts never touch the live save keys. */
(function(root){
'use strict';
const params=new URLSearchParams(root.location.search);
if(params.get('fresh')!=='1'){root.NJH_FRESH_MODE=false;return;}
root.NJH_FRESH_MODE=true;
const PREFIX='njh-fresh-v1:';
const store=root.localStorage;
const proto=Storage.prototype;
const rawGet=proto.getItem,rawSet=proto.setItem,rawRemove=proto.removeItem,rawKey=proto.key,rawClear=proto.clear;
const rawLen=Object.getOwnPropertyDescriptor(Storage.prototype,'length');
function isLS(){return this===store;}
function freshKeys(){
 const out=[],n=rawLen.get.call(store);
 for(let i=0;i<n;i++){const k=rawKey.call(store,i);if(k&&k.startsWith(PREFIX))out.push(k);}
 return out;
}
try{freshKeys().forEach(k=>rawRemove.call(store,k));}catch{}
try{
 rawSet.call(store,PREFIX+'njh98:tutorial-done','1');
 rawSet.call(store,PREFIX+'njh98:intro-seen','1');
}catch{}
proto.getItem=function(k){return rawGet.call(this,isLS.call(this)?PREFIX+k:k);};
proto.setItem=function(k,v){return rawSet.call(this,isLS.call(this)?PREFIX+k:k,v);};
proto.removeItem=function(k){return rawRemove.call(this,isLS.call(this)?PREFIX+k:k);};
proto.clear=function(){
 if(!isLS.call(this))return rawClear.call(this);
 freshKeys().forEach(k=>rawRemove.call(store,k));
};
proto.key=function(i){
 if(!isLS.call(this))return rawKey.call(this,i);
 const k=freshKeys()[i];
 return k?k.slice(PREFIX.length):null;
};
try{
 Object.defineProperty(Storage.prototype,'length',{
  configurable:true,
  get:function(){return isLS.call(this)?freshKeys().length:rawLen.get.call(this);}
 });
}catch{}
root.NJH_FRESH_PREFIX=PREFIX;
})(window);
