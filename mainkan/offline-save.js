/* NJH offline single-player save boundary.
 * This module owns ONLY the local offline profile and NJH save keys.
 * Authoring/editor drafts, online-test accounts and other players are untouched.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.NJHOfflineSave=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const FORMAT='njh-offline-backup-v1';
 const PLAYER_ID='njh_offline';
 const CITY_ID='city-njh-semesta-draft1-with-pending';
 const CHARACTER_KEY='mainkan-character-v1:'+PLAYER_ID;
 const LIFE_KEY='semesta-life-play-v1:'+CITY_ID+'@'+PLAYER_ID;
 const SLOTS_KEY='semesta-life-slots-v1:'+CITY_ID+'@'+PLAYER_ID;
 const KEYS=Object.freeze([CHARACTER_KEY,LIFE_KEY,SLOTS_KEY]);
 const BASES=Object.freeze(['genesis_male_nude','genesis_female_nude']);
 const MAX_BYTES=4*1024*1024;
 function storage(provided){
  const st=provided||(typeof window!=='undefined'?window.localStorage:null);
  if(!st||typeof st.getItem!=='function'||typeof st.setItem!=='function'||typeof st.removeItem!=='function')throw Error('Local storage tidak tersedia.');
  return st;
 }
 function character(st){
  try{
   const data=JSON.parse(storage(st).getItem(CHARACTER_KEY)||'null');
   return data&&BASES.includes(data.base)&&typeof data.name==='string'?data:null;
  }catch{return null;}
 }
 function hasSave(st){
  try{const s=storage(st);return !!character(s)||!!s.getItem(LIFE_KEY);}catch{return false;}
 }
 function putCharacter(profile,st){
  if(!profile||!BASES.includes(profile.base)||typeof profile.name!=='string'||profile.name.trim().length<2)return false;
  try{storage(st).setItem(CHARACTER_KEY,JSON.stringify(profile));return true;}catch{return false;}
 }
 function clear(st){
  const s=storage(st);
  for(const k of KEYS)s.removeItem(k);
  return KEYS.every(k=>s.getItem(k)===null);
 }
 function makeBackup(st){
  const s=storage(st),records={};
  for(const k of KEYS){
   const v=s.getItem(k);
   if(v!==null)records[k]=v;
  }
  if(!records[CHARACTER_KEY])throw Error('Belum ada karakter offline untuk dicadangkan.');
  const payload={format:FORMAT,version:1,playerId:PLAYER_ID,cityId:CITY_ID,exportedAt:new Date().toISOString(),records};
  const text=JSON.stringify(payload);
  if(text.length>MAX_BYTES)throw Error('Backup terlalu besar (maksimal 4 MB).');
  return text;
 }
 function validate(raw){
  if(typeof raw!=='string'||raw.length>MAX_BYTES)throw Error('Ukuran backup tidak valid.');
  let data;try{data=JSON.parse(raw);}catch{throw Error('Backup bukan JSON yang valid.');}
  if(!data||data.format!==FORMAT||data.version!==1||data.playerId!==PLAYER_ID||data.cityId!==CITY_ID||
     !data.records||typeof data.records!=='object'||Array.isArray(data.records))throw Error('Format backup NJH tidak cocok.');
  const entries=Object.entries(data.records);
  if(entries.some(([k,v])=>!KEYS.includes(k)||typeof v!=='string'||v.length>MAX_BYTES))throw Error('Backup memuat data yang tidak dikenal.');
  const obj={};
  for(const [k,v] of entries){try{obj[k]=JSON.parse(v);}catch{throw Error('Data rusak: '+k);}}
  const c=obj[CHARACTER_KEY];
  if(!c||!BASES.includes(c.base)||typeof c.name!=='string'||c.name.trim().length<2)throw Error('Karakter backup tidak valid.');
  const life=obj[LIFE_KEY];
  if(life&&(!life.state||typeof life.state!=='object'||life.cityId!==CITY_ID||life.schema!==1))
   throw Error('Progres Jiwa backup tidak valid.');
  const slots=obj[SLOTS_KEY];
  if(slots&&(!slots.slots||typeof slots.slots!=='object'||slots.schema!==1||Array.isArray(slots.slots)))
   throw Error('Slot backup tidak valid.');
  return data;
 }
 function restoreBackup(raw,st){
  const data=validate(raw),s=storage(st),old=new Map();
  for(const k of KEYS)old.set(k,s.getItem(k));
  try{
   for(const k of KEYS){
    if(Object.prototype.hasOwnProperty.call(data.records,k))s.setItem(k,data.records[k]);
    else s.removeItem(k);
   }
   return true;
  }catch(error){
   for(const [k,v] of old){try{if(v===null)s.removeItem(k);else s.setItem(k,v);}catch{}}
   throw Error('Gagal mengimpor backup: '+String(error.message||error));
  }
 }
 return Object.freeze({FORMAT,PLAYER_ID,CITY_ID,CHARACTER_KEY,LIFE_KEY,SLOTS_KEY,KEYS,BASES,
  character,hasSave,putCharacter,clear,makeBackup,validate,restoreBackup});
});
