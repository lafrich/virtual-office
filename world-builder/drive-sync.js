/* Membangun Drive storage for Semesta and Bangun Ruang.
 * Same public Google OAuth Web Client ID, separate Drive folders & file kinds.
 * OAuth tokens are never persisted. App-local saves remain authoritative offline.
 */
(function(root,factory){"use strict";const api=factory(root);if(typeof module==="object"&&module.exports)module.exports=api;if(root)root.MembangunCloudDrive=api;})(typeof window!=="undefined"?window:null,function(root){
"use strict";
const CLIENT_ID="369223065433-idbuhhj6akuf2cmo6vpbiblkhu019csn.apps.googleusercontent.com";
const SCOPE="https://www.googleapis.com/auth/drive.file";
const API="https://www.googleapis.com/drive/v3/files",UPLOAD="https://www.googleapis.com/upload/drive/v3/files";
const FOLDER="application/vnd.google-apps.folder",ROOT="Membangun",FORMAT="membangun-cloud-1";
const APPS={semesta:{folder:"Semesta",kind:"city"},bangun:{folder:"Bangun Ruang",kind:"building"}};
const KEY="membangun-google-client-id-v1";
let client=CLIENT_ID,token="",expires=0,folders={};
try{const id=root?.localStorage?.getItem(KEY);if(id)client=id}catch{}
function getClient(){return client}
function connected(){return !!token&&Date.now()+60000<expires}
function configure(value){
 const s=String(value||"").trim();
 if(!/^[0-9]+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(s))throw Error("Invalid Google OAuth Web Client ID");
 client=s;token="";expires=0;folders={};
 try{root.localStorage.setItem(KEY,s)}catch{}
}
function disconnect(){token="";expires=0;folders={}}
async function connect(){
 const oauth=root?.google?.accounts?.oauth2;
 if(!oauth?.initTokenClient)throw Error("Google Sign-In belum siap. Reload lewat Chrome.");
 const granted=await new Promise((resolve,reject)=>{
  try{oauth.initTokenClient({client_id:client,scope:SCOPE,include_granted_scopes:true,
   callback:r=>{if(r?.error||!r?.access_token){reject(Error(r?.error_description||r?.error||"Sign-In rejected"));return}
    if(oauth.hasGrantedAllScopes&&!oauth.hasGrantedAllScopes(r,SCOPE)){reject(Error("Google Drive permission not granted"));return}
    resolve(r)},
   error_callback:e=>reject(Error(e?.message||e?.type||"Popup closed"))
  }).requestAccessToken({prompt:""});}
  catch(e){reject(e)}
 });
 token=granted.access_token;expires=Date.now()+1000*(Number(granted.expires_in)||3500);folders={};
 return true;
}
async function request(url,options={}){
 if(!connected())throw Error("Google Drive session expired. Reconnect.");
 const headers=new Headers(options.headers||{});headers.set("Authorization","Bearer "+token);
 const res=await fetch(url,{...options,headers,cache:"no-store"});
 if(!res.ok){let message="Drive HTTP "+res.status;
  try{const obj=await res.json();message+=": "+(obj?.error?.message||"unknown")}catch{}
  if(res.status===401)disconnect();
  throw Error(message)}
 return res;
}
const quote=s=>String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'");
async function search(parent,filter=""){
 let files=[],next="";
 do{const q=new URLSearchParams({q:"'"+quote(parent)+"' in parents and trashed=false"+(filter?" and "+filter:""),
  fields:"nextPageToken,files(id,name,mimeType,modifiedTime,appProperties,webViewLink,size)",pageSize:"1000"});
  if(next)q.set("pageToken",next);
  const data=await(await request(API+"?"+q)).json();files.push(...(data.files||[]));next=data.nextPageToken||"";
 }while(next);
 return files;
}
async function ensureFolder(parent,name){
 const arr=await search(parent,"mimeType = '"+FOLDER+"' and name = '"+quote(name)+"'");
 if(arr[0])return arr[0].id;
 const r=await request(API+"?fields=id",{method:"POST",headers:{"Content-Type":"application/json"},
  body:JSON.stringify({name,mimeType:FOLDER,parents:[parent]})});
 return (await r.json()).id;
}
async function folder(app){
 if(folders[app])return folders[app];
 if(!APPS[app])throw Error("Unknown app: "+app);
 const top=await ensureFolder("root",ROOT);
 folders[app]=await ensureFolder(top,APPS[app].folder);
 return folders[app];
}
function safeId(value){
 const id=String(value||"").trim();
 if(!id||id.length>160||/[\u0000-\u001f]/.test(id))throw Error("Invalid document id");
 return id;
}
function filename(kind,id){return kind+"--"+encodeURIComponent(safeId(id))+".json"}
function validateRecord(app,kind,record){
 if(!APPS[app])throw Error("Unknown app");
 if(!["city","building","object"].includes(kind))throw Error("Unsupported document kind");
 if(app==="semesta"&&(kind!=="city"||record?.format!=="vl-city-draft-1"||!Array.isArray(record.document?.objects)))throw Error("Invalid Semesta city");
 if(app==="bangun"&&kind==="building"&&(!record?.config||!record?.views))throw Error("Invalid Bangun Ruang building");
 if(app==="bangun"&&kind==="object"&&(!record?.variants&&!record?.views))throw Error("Invalid Bangun Ruang pixel object");
 const id=safeId(record?.id);
 if(!record||typeof record!=="object")throw Error("Missing asset");
 return id;
}
async function list(app,kind=null){
 const base=await folder(app);
 const files=await search(base);
 return files.filter(f=>f.name.endsWith(".json")&&(!kind||f.name.startsWith(kind+"--")));
}
async function save(app,kind,record,knownFile=null){
 const id=validateRecord(app,kind,record),folderId=await folder(app);
 const name=filename(kind,id),existing=(await search(folderId,"name = '"+quote(name)+"'"))[0]||null;
 if(existing&&(!knownFile?.id||knownFile.id!==existing.id||knownFile.modifiedTime!==existing.modifiedTime))
  throw Error("A newer Drive version exists. Reload Drive before overwriting "+record.name);
 const data=JSON.stringify({format:FORMAT,app,kind,id,record,savedAt:new Date().toISOString()});
 let file;
 if(existing){
  file=await (await request(UPLOAD+"/"+encodeURIComponent(existing.id)+"?uploadType=media&fields=id,name,modifiedTime",
   {method:"PATCH",headers:{"Content-Type":"application/json"},body:data})).json();
 }else{
  const boundary="mb_"+Math.random().toString(36).slice(2);
  const body=new Blob(["--"+boundary+"\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n",
   JSON.stringify({name,mimeType:"application/json",parents:[folderId],appProperties:{app,kind,recordId:id}}),
   "\r\n--"+boundary+"\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n",data,
   "\r\n--"+boundary+"--"],{type:"multipart/related; boundary="+boundary});
  file=await (await request(UPLOAD+"?uploadType=multipart&fields=id,name,modifiedTime",
   {method:"POST",headers:{"Content-Type":"multipart/related; boundary="+boundary},body})).json();
 }
 return {file,folderId};
}
async function load(file){
 if(!file?.id)throw Error("Select a Drive file");
 const payload=await(await request(API+"/"+encodeURIComponent(file.id)+"?alt=media")).json();
 if(payload?.format!==FORMAT||!APPS[payload.app]||!payload.id||!["city","building","object"].includes(payload.kind))
  throw Error("Unknown cloud format");
 validateRecord(payload.app,payload.kind,payload.record);
 if(payload.record.id!==payload.id)throw Error("Record identifier mismatch");
 return payload;
}
return Object.freeze({CLIENT_ID,SCOPE,APPS,FORMAT,connected,getClient,configure,disconnect,connect,folder,list,save,load,filename,validateRecord});
});
