/* Virtual Life city drafts — named local documents in IndexedDB.
 * Browser/device storage only; no cloud sync or multiplayer writes.
 * On platforms without IndexedDB, localStorage is a best-effort fallback.
 */
(function(g){
'use strict';
const DB='virtual-life-city-drafts',TABLE='cities',VERSION=1;
const PREFIX='virtual-life-city-draft-v1:';
let connection=null;
function openDB(){
 if(!('indexedDB' in g))return Promise.reject(Error('IndexedDB unavailable'));
 if(connection)return connection;
 connection=new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB,VERSION);
  request.onupgradeneeded=()=>{
   const db=request.result;
   if(!db.objectStoreNames.contains(TABLE))db.createObjectStore(TABLE,{keyPath:'id'});
  };
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||Error('Database unavailable'));
  request.onblocked=()=>reject(Error('Draft storage blocked by another tab'));
 }).catch(err=>{connection=null;throw err;});
 return connection;
}
function transaction(mode,method,arg){
 return openDB().then(db=>new Promise((resolve,reject)=>{
  const t=db.transaction(TABLE,mode),request=t.objectStore(TABLE)[method](arg);
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||Error('Draft storage error'));
  t.onabort=()=>reject(t.error||Error('Draft storage transaction aborted'));
 }));
}
const fallback={
 async get(id){
  const raw=localStorage.getItem(PREFIX+id);
  return raw?JSON.parse(raw):null;
 },
 async put(record){
  localStorage.setItem(PREFIX+record.id,JSON.stringify(record));
  return record.id;
 },
 async getAll(){
  const records=[];
  for(let i=0;i<localStorage.length;i++){
   const key=localStorage.key(i);
   if(key?.startsWith(PREFIX)){
    try{records.push(JSON.parse(localStorage.getItem(key)));}catch{}
   }
  }
  return records;
 },
 async delete(id){localStorage.removeItem(PREFIX+id);}
};
async function operation(method,arg){
 try{
  if(method==='get')return await transaction('readonly','get',arg);
  if(method==='getAll')return await transaction('readonly','getAll');
  if(method==='put')return await transaction('readwrite','put',arg);
  if(method==='delete')return await transaction('readwrite','delete',arg);
 }catch(e){
  // Do not silently mask quota errors in a working database.
  if(e.name==='QuotaExceededError')throw e;
  try{return await fallback[method](arg);}catch(error){throw Error('Could not save browser draft: '+error.message);}
 }
}
function cleanName(n){return String(n||'').trim().replace(/[\\<>]/g,'').slice(0,70)||'Untitled City';}
function newId(){
 return 'city-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
}
function metadata(x){
 return {id:x.id,name:x.name,updatedAt:x.updatedAt,createdAt:x.createdAt,
  objectCount:x.document?.objects?.length||0,tileCount:x.document?.map?.terrain?.cells?.length||0};
}
async function save(input){
 if(!input||!input.document||!Array.isArray(input.document.objects))throw Error('Invalid city document');
 const id=String(input.id||newId()),name=cleanName(input.name),now=new Date().toISOString();
 const existing=await operation('get',id);
 const record={id,name,createdAt:existing?.createdAt||now,updatedAt:now,
  document:JSON.parse(JSON.stringify(input.document)),format:'vl-city-draft-1'};
 await operation('put',record);
 try{g.VLHub&&g.VLHub.publish('world',{id:record.id,name:record.name,action:'save',objectCount:record.document.objects.length});}catch{}
 return metadata(record);
}
async function list(){
 const records=await operation('getAll');
 return records.filter(x=>x&&x.id&&x.document).map(metadata)
  .sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
}
async function load(id){
 const record=await operation('get',String(id));
 if(!record||!record.document)throw Error('City draft not found');
 return JSON.parse(JSON.stringify(record));
}
async function remove(id){
 await operation('delete',String(id));
 try{g.VLHub&&g.VLHub.publish('world',{id:String(id),action:'remove'});}catch{}
}
g.VLCityDrafts=Object.freeze({save,list,load,remove,newId,cleanName,storage:'local browser / IndexedDB'});
})(window);
