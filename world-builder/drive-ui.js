/* Shared Google Drive UI for Membangun apps — no implied game deployment. */
(function(window){"use strict";
const D=window.MembangunCloudDrive,$=id=>document.getElementById(id);
let app="",files=[],known=new Map(),busy=false;
function adapter(){return window.MembangunCloudAdapter}
function info(t,error=false){const el=$("mbCloudStatus");if(el){el.textContent=t;el.style.color=error?"#b5272f":"#174d8e"}}
function update(){
 const connected=!!D?.connected();
 for(const id of ["mbCloudRefresh","mbCloudSave","mbCloudBackup","mbCloudLoad","mbCloudDisconnect"])
  if($(id))$(id).disabled=!connected;
 if($("mbCloudConnect"))$("mbCloudConnect").textContent=connected?"✓ DRIVE CONNECTED / RECONNECT":"☁ CONNECT GOOGLE DRIVE";
}
function open(){if(!$("mbCloudDialog"))return;$("mbCloudDialog").hidden=false;info(D?.connected()?"CONNECTED · READY TO SYNC":"NOT CONNECTED · LOCAL SAVES REMAIN AVAILABLE");update()}
function close(){$("mbCloudDialog").hidden=true}
async function refresh(){
 if(!D?.connected())throw Error("Connect Drive first");
 info("LOADING DRIVE "+app.toUpperCase()+" ASSETS ...");
 files=await D.list(app);known=new Map(files.map(f=>[f.name,f]));
 const sel=$("mbCloudFiles");sel.replaceChildren();
 for(const f of files){
  const option=document.createElement("option");option.value=f.id;
  option.textContent=f.name.replace(/^(city|building|object)--/,"").replace(/\.json$/,"")+
   " · "+new Date(f.modifiedTime).toLocaleString("id-ID");
  sel.appendChild(option);
 }
 if(!files.length){const o=document.createElement("option");o.textContent="No Drive projects yet";o.disabled=true;sel.appendChild(o)}
 info("✓ "+files.length+" FILE(S) ON DRIVE · Membangun / "+(app==="semesta"?"Semesta":"Bangun Ruang"));
}
async function connect(){
 if(busy)return;busy=true;$("mbCloudConnect").disabled=true;
 try{
  const requested=$("mbCloudClient").value.trim();
  if(requested&&requested!==D.getClient())D.configure(requested);
  info("OPENING GOOGLE LOGIN ...");
  await D.connect();update();
  await refresh();
 }catch(error){info("GOOGLE DRIVE CONNECT FAILED · "+error.message,true)}
 finally{busy=false;$("mbCloudConnect").disabled=false;update()}
}
async function uploadRecord(item,{quiet=false}={}){
 if(!D.connected())return false;
 const a=adapter();if(!a||!item)return false;
 const {kind,record}=item;
 const fileName=D.filename(kind,record.id);
 try{
  if(!quiet)info("UPLOADING "+kind.toUpperCase()+" · "+(record.name||record.id));
  const saved=await D.save(app,kind,record,known.get(fileName)||null);
  known.set(fileName,saved.file);
  if(!quiet)info("✓ SAVED TO GOOGLE DRIVE · "+(record.name||record.id));
  return true;
 }catch(error){info("LOCAL COPY KEPT · DRIVE SAVE FAILED: "+error.message,true);return false}
}
async function saveCurrent(){
 if(!D.connected())return;
 if(busy)return;busy=true;$("mbCloudSave").disabled=true;
 try{
  const item=await adapter()?.currentRecord?.();
  if(!item)throw Error("Save a named city/building locally first");
  await uploadRecord(item);
  await refresh();
 }catch(e){info("SAVE FAILED: "+e.message,true)}
 finally{busy=false;$("mbCloudSave").disabled=false}
}
async function backupLocal(){
 if(!D.connected()||busy)return;
 let all=await adapter()?.localRecords?.()||[];
 if(!Array.isArray(all))all=[];
 const missing=all.filter(x=>!known.has(D.filename(x.kind,x.record.id)));
 if(!missing.length){info("EVERY LOCAL ITEM HAS A MATCHING DRIVE FILENAME");return}
 if(!window.confirm("Upload "+missing.length+" local items missing from Drive? Existing remote versions will not be overwritten."))return;
 busy=true;$("mbCloudBackup").disabled=true;let count=0;
 for(const item of missing){if(await uploadRecord(item,{quiet:true}))count++;info("BACKUP · "+count+"/"+missing.length+" UPLOADED")}
 await refresh();
 info("✓ BACKUP "+count+"/"+missing.length+" LOCAL PROJECT(S) · "+(missing.length-count)+" FAILED",count!==missing.length);
 busy=false;$("mbCloudBackup").disabled=false;
}
async function loadSelected(){
 if(!D.connected()||busy)return;
 const file=files.find(f=>f.id===$("mbCloudFiles").value);
 if(!file){info("SELECT A CLOUD FILE FIRST",true);return}
 if(!window.confirm("Open "+file.name+" from Google Drive? Current work should be saved locally first."))return;
 busy=true;$("mbCloudLoad").disabled=true;
 try{
  const payload=await D.load(file);
  if(payload.app!==app)throw Error("File belongs to another app");
  await adapter().importRemote(payload);
  close();info("✓ DRIVE FILE LOADED · "+payload.id);
 }catch(error){info("OPEN FROM DRIVE FAILED: "+error.message,true)}
 finally{busy=false;$("mbCloudLoad").disabled=false}
}
function disconnect(){D?.disconnect();files=[];known.clear();update();info("DRIVE DISCONNECTED · LOCAL LIBRARY UNCHANGED")}
function init(){
 if(!$("mbCloudDialog"))return;
 app=$("mbCloudDialog").dataset.app;
 if(!D||!D.APPS[app]){info("DRIVE MODULE NOT LOADED",true);return}
 $("mbCloudClient").value=D.getClient();
 $("mbCloudOpen").onclick=open;
 $("mbCloudClose").onclick=close;
 $("mbCloudDialog").addEventListener("click",e=>{if(e.target===$("mbCloudDialog"))close()});
 $("mbCloudConnect").onclick=connect;
 $("mbCloudDisconnect").onclick=disconnect;
 $("mbCloudRefresh").onclick=()=>refresh().catch(e=>info(e.message,true));
 $("mbCloudSave").onclick=saveCurrent;
 $("mbCloudBackup").onclick=()=>backupLocal().catch(e=>{busy=false;info(e.message,true)});
 $("mbCloudLoad").onclick=loadSelected;
 window.addEventListener("membangun:local-saved",event=>{
  if(!D.connected()||event.detail?.app!==app)return;
  // Fire-and-forget only when local saving already succeeded. Report actual cloud status separately.
  void uploadRecord({kind:event.detail.kind,record:event.detail.record});
 });
 update();
}
document.addEventListener("DOMContentLoaded",init);
window.MembangunCloudUI=Object.freeze({open,close});
})(window);
