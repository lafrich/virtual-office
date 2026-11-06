/* Emotion Studio — Google Drive sync, standalone and limited to app-owned files.
 * Requires a Google OAuth Web client ID with origin https://lafrich.github.io.
 * A Google account access token lives only in page memory, never localStorage.
 */
(function(root,factory){"use strict";const api=factory(root);if(typeof module==="object"&&module.exports)module.exports=api;if(root)root.EmotionDrive=api;})(typeof window!=="undefined"?window:null,function(root){
"use strict";
const SCOPE="https://www.googleapis.com/auth/drive.file";
const CLIENT_KEY="emotion-studio-drive-client-id-v1";
const CLIENT_DEFAULT="369223065433-idbuhhj6akuf2cmo6vpbiblkhu019csn.apps.googleusercontent.com"; // Public OAuth Web Client ID; not a secret.
const API="https://www.googleapis.com/drive/v3/files";
const UPLOAD="https://www.googleapis.com/upload/drive/v3/files";
const FOLDER_TYPE="application/vnd.google-apps.folder";
const FORMAT="mahluk-2-universal-emotions-v1";
const DIRECTIONS=["se","sw","ne","nw"];
const NAME_ROOT="Membangun",NAME_CHILD="Emotion Studio";
let token="",expires=0,clientId="",folderId="",pendingTokenClient=null;
function storedClientId(){
 try{return (typeof localStorage!=="undefined"&&localStorage.getItem(CLIENT_KEY))||CLIENT_DEFAULT}catch{return CLIENT_DEFAULT}
}
clientId=storedClientId();
function ready(){return !!token&&Date.now()<expires-60000}
function client(){return clientId}
function connected(){return ready()}
function status(){return {connected:ready(),configured:!!clientId,scope:SCOPE,folderId}}
function validateId(s){
 const value=String(s||"").trim();
 if(!/^[0-9]+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(value))throw Error("Gunakan OAuth Client ID jenis Web application, bukan API key atau Client Secret");
 return value;
}
function configure(value){
 clientId=validateId(value);token="";expires=0;folderId="";
 try{localStorage.setItem(CLIENT_KEY,clientId)}catch{}
 return clientId;
}
function disconnect(){
 token="";expires=0;folderId="";
 pendingTokenClient=null;
}
async function connect(){
 if(!clientId)throw Error("Setel Google OAuth Web Client ID terlebih dahulu");
 if(!root?.google?.accounts?.oauth2?.initTokenClient)throw Error("Google Identity belum siap. Buka di Chrome, reload halaman, lalu coba Connect lagi.");
 const result=await new Promise((resolve,reject)=>{
  try{
   pendingTokenClient=root.google.accounts.oauth2.initTokenClient({
    client_id:clientId,scope:SCOPE,include_granted_scopes:true,
    callback:r=>{
     if(r?.error||!r?.access_token)return reject(Error(r?.error_description||r?.error||"Google Login dibatalkan"));
     if(root.google.accounts.oauth2.hasGrantedAllScopes&&!root.google.accounts.oauth2.hasGrantedAllScopes(r,SCOPE))
      return reject(Error("Izin drive.file belum diberikan"));
     resolve(r);
    },
    error_callback:e=>reject(Error("Google Sign-In popup gagal: "+(e?.message||e?.type||"unknown")))
   });
   // Call from direct user click to prevent browser popup blocking.
   pendingTokenClient.requestAccessToken({prompt:""});
  }catch(e){reject(e)}
 });
 token=result.access_token;expires=Date.now()+(Number(result.expires_in)||3500)*1000;
 folderId="";
 return status();
}
async function request(url,options={}){
 if(!ready())throw Error("Google Drive belum login atau sesi kedaluwarsa. Klik CONNECT DRIVE kembali.");
 const headers=new Headers(options.headers||{});
 headers.set("Authorization","Bearer "+token);
 const r=await fetch(url,{...options,headers,cache:"no-store"});
 if(!r.ok){
  let message="Google Drive HTTP "+r.status;
  try{const data=await r.json();message+=": "+(data?.error?.message||JSON.stringify(data).slice(0,240))}catch{}
  if(r.status===401){token="";expires=0}
  throw Error(message);
 }
 return r;
}
function escapeQuery(s){return String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'")}
async function listFiles(parent,extra=""){
 let pageToken="",files=[];
 do{
  const params=new URLSearchParams({q:"'"+escapeQuery(parent)+"' in parents and trashed = false"+(extra?" and "+extra:""),
   fields:"nextPageToken,files(id,name,mimeType,modifiedTime,webViewLink,appProperties,size)",pageSize:"1000"});
  if(pageToken)params.set("pageToken",pageToken);
  const data=await (await request(API+"?"+params)).json();
  files.push(...(data.files||[]));pageToken=data.nextPageToken||"";
 }while(pageToken);
 return files;
}
async function findFolder(parent,name){
 const q="name = '"+escapeQuery(name)+"' and mimeType = '"+FOLDER_TYPE+"'";
 const files=await listFiles(parent,q);
 return files[0]||null;
}
async function ensureFolder(parent,name){
 const old=await findFolder(parent,name);if(old)return old.id;
 const r=await request(API+"?fields=id,name",{method:"POST",
  headers:{"Content-Type":"application/json"},
  body:JSON.stringify({name,mimeType:FOLDER_TYPE,parents:[parent]})});
 return (await r.json()).id;
}
async function ensureLibrary(){
 if(folderId)return folderId;
 const first=await ensureFolder("root",NAME_ROOT);
 folderId=await ensureFolder(first,NAME_CHILD);
 return folderId;
}
async function list(){
 const folder=await ensureLibrary();
 const files=await listFiles(folder,"mimeType != '"+FOLDER_TYPE+"'");
 return files.filter(f=>f.name.endsWith(".emotion.json")||f.name.endsWith(".png"));
}
function safeId(entry){
 if(!entry||typeof entry.id!=="string"||!/^[a-z0-9_-]{1,64}$/.test(entry.id))throw Error("Invalid emotion ID");
 return entry.id;
}
function documentFor(entry){
 const id=safeId(entry);
 const clean={...entry};
 delete clean.template;delete clean.driveFileId;delete clean.driveModifiedTime;
 return {format:FORMAT,cell:[64,112],directions:DIRECTIONS,entries:[clean]};
}
function multipartBody(meta,contents,type){
 const boundary="emotionstudio_"+Math.random().toString(36).slice(2);
 return {boundary,body:new Blob([
  "--"+boundary+"\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n",
  JSON.stringify(meta),"\r\n--"+boundary+"\r\nContent-Type: "+type+"\r\n\r\n",
  contents,"\r\n--"+boundary+"--"
 ],{type:"multipart/related; boundary="+boundary})};
}
async function saveFile({existing,folder,name,mime,contents,emotionId,kind}){
 if(existing){
  const url=UPLOAD+"/"+encodeURIComponent(existing.id)+"?uploadType=media&fields=id,name,modifiedTime,webViewLink";
  const result=await request(url,{method:"PATCH",headers:{"Content-Type":mime},body:contents});
  return result.json();
 }
 const meta={name,mimeType:mime,parents:[folder],appProperties:{emotionId,kind}};
 const {boundary,body}=multipartBody(meta,contents,mime);
 const url=UPLOAD+"?uploadType=multipart&fields=id,name,modifiedTime,webViewLink";
 const result=await request(url,{method:"POST",headers:{"Content-Type":"multipart/related; boundary="+boundary},body});
 return result.json();
}
async function save(entry,opts={}){
 const id=safeId(entry),folder=await ensureLibrary();
 if(!entry.png||!/^data:image\/png;base64,/.test(entry.png))throw Error("Emotion PNG atlas belum ada");
 const assets=await list();
 const jsonName=id+".emotion.json",pngName=id+".png";
 const oldJson=assets.find(x=>x.name===jsonName);
 const oldPng=assets.find(x=>x.name===pngName);
 if(oldJson&&(!opts.expectedModifiedTime||oldJson.modifiedTime!==opts.expectedModifiedTime))
  throw Error("CONFLICT: Emotion ini sudah ada atau diubah di Drive. Connect/Refresh Drive untuk membandingkan versi sebelum menimpa.");
 // Upload PNG first, and only declare success once the editable JSON also persists.
 const pngBlob=await (await fetch(entry.png)).blob();
 const png=await saveFile({existing:oldPng,folder,name:pngName,mime:"image/png",
  contents:pngBlob,emotionId:id,kind:"atlas"});
 const json=await saveFile({existing:oldJson,folder,name:jsonName,mime:"application/json",
  contents:JSON.stringify(documentFor(entry),null,2),emotionId:id,kind:"project"});
 return {project:json,atlas:png,folderId:folder};
}
async function loadOne(file){
 if(!file?.id)throw Error("Missing Drive file ID");
 const response=await request(API+"/"+encodeURIComponent(file.id)+"?alt=media");
 const project=await response.json();
 if(project.format!==FORMAT||JSON.stringify(project.cell)!=="[64,112]"||
    JSON.stringify(project.directions)!==JSON.stringify(DIRECTIONS)||project.entries?.length!==1)
  throw Error("Project Drive tidak cocok dengan atlas 64×112 / SE SW NE NW");
 const entry=project.entries[0];
 safeId(entry);
 return {...entry,driveFileId:file.id,driveModifiedTime:file.modifiedTime};
}
async function loadAll(onProgress){
 const files=(await list()).filter(x=>x.name.endsWith(".emotion.json"));
 const result=[],errors=[];
 for(let i=0;i<files.length;i+=4){
  const batch=files.slice(i,i+4);
  const values=await Promise.all(batch.map(f=>loadOne(f).catch(error=>{errors.push({file:f.name,message:error.message});return null})));
  result.push(...values.filter(Boolean));
  if(onProgress)onProgress(result.length,files.length);
 }
 return {entries:result,files,errors,folderId};
}
async function removeProject(id){
 const folder=await ensureLibrary(),rows=await list();
 const names=[safeId({id})+".emotion.json",id+".png"];
 let count=0;
 for(const f of rows.filter(r=>names.includes(r.name))){
  await request(API+"/"+encodeURIComponent(f.id),{method:"DELETE"});count++;
 }
 return count;
}
return Object.freeze({SCOPE,client,configured:()=>!!clientId,configure,connect,disconnect,connected,status,ensureLibrary,list,loadOne,loadAll,save,removeProject,documentFor});
});
