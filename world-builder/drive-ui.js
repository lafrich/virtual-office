/* Shared Google Drive UI for Membangun apps — no implied game deployment. */
(function(window){"use strict";
const D=window.MembangunCloudDrive,$=id=>document.getElementById(id);
let app="",files=[],known=new Map(),busy=false;
function adapter(){return window.MembangunCloudAdapter}
function info(t,error=false){const el=$("mbCloudStatus");if(el){el.textContent=t;el.style.color=error?"#b5272f":"#174d8e"}}
function update(){
 const connected=!!D?.connected();
 for(const id of ["mbCloudRefresh","mbCloudSave","mbCloudBackup","mbCloudLoad","mbCloudDisconnect","mbCloudAssetBackup","mbCloudAssetRestore"])
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

async function backupEntireAssetLibrary(){
 if(!D.connected()||busy)return;
 const a=adapter();
 if(!a?.assetCatalogSnapshot)throw Error("Built-in Asset Library adapter unavailable");
 busy=true;
 if($("mbCloudAssetBackup"))$("mbCloudAssetBackup").disabled=true;
 if($("mbCloudAssetRestore"))$("mbCloudAssetRestore").disabled=true;
 let success=0,failed=[],catalogCount=0;
 try{
  const snapshot=await a.assetCatalogSnapshot();
  catalogCount=snapshot.record?.entries?.length||0;
  const all=[snapshot,...(await a.localRecords?.()||[])];
  const folderFiles=(await Promise.all(["assetCatalog"].map(kind=>D.list(app,kind)))).flat();
  const mainFiles=await D.list(app);
  const knownByName=new Map([...folderFiles,...mainFiles].map(x=>[x.name,x]));
  info("BACKING UP "+catalogCount+" NATIVE ASSETS AND "+(all.length-1)+" SAVED CUSTOM RECORDS ...");
  for(let i=0;i<all.length;i++){
   const item=all[i];if(!item?.record?.id){failed.push("Missing asset ID");continue}
   const name=D.filename(item.kind,item.record.id);
   try{
    const result=await D.save(app,item.kind,item.record,knownByName.get(name)||null);
    knownByName.set(name,result.file);success++;
   }catch(e){failed.push(item.kind+":"+item.record.id+" "+e.message)}
   info("ASSET LIBRARY "+(i+1)+"/"+all.length+" · "+success+" SAVED · "+
     failed.length+" FAILED");
  }
  info("✓ DRIVE ASSET LIBRARY "+success+"/"+all.length+
   " FILES · "+catalogCount+" NATIVE FURNITURE / INTERIOR / EXTERIOR INDEX ENTRIES"+
   (failed.length?" · ERRORS: "+failed.slice(0,2).join("; "):""),!!failed.length);
 }catch(error){info("ASSET LIBRARY BACKUP FAILED: "+error.message,true)}
 finally{busy=false;if($("mbCloudAssetBackup"))$("mbCloudAssetBackup").disabled=false;
  if($("mbCloudAssetRestore"))$("mbCloudAssetRestore").disabled=false}
}
async function restoreEntireAssetLibrary(){
 if(!D.connected()||busy)return;
 const a=adapter();if(!a?.assetCatalogSnapshot)return;
 busy=true;
 if($("mbCloudAssetRestore"))$("mbCloudAssetRestore").disabled=true;
 try{
  const native=await D.list(app,"assetCatalog");
  const remote=await D.list(app);
  const custom=remote.filter(f=>/^(?:building|object)--/.test(f.name));
  if(!native.length&&!custom.length){info("NO ASSET LIBRARY BACKUP FOUND. SAVE ASSET LIBRARY ON PC FIRST.",true);return}
  if(!window.confirm("Restore "+custom.length+" custom Bangun Ruang assets from Drive? "+
    "Existing local IDs are skipped; built-in furniture, interiors and exteriors already load from the published sources."))return;
  const local=await a.localRecords();
  const seen=new Set(local.map(x=>x.kind+":"+x.record.id));
  let added=0,skipped=0,failed=0;
  for(let i=0;i<custom.length;i++){
   const f=custom[i];
   try{
    const doc=await D.load(f),key=doc.kind+":"+doc.id;
    if(seen.has(key)){skipped++;continue}
    await a.importRemote(doc);seen.add(key);added++;
   }catch(e){failed++;console.warn("Bangun asset restore failure",f.name,e)}
   info("RESTORE "+(i+1)+"/"+custom.length+" · "+added+" ADDED, "+
    skipped+" ALREADY HERE, "+failed+" ERRORS");
  }
  const index=native[0]?await D.load(native[0]):null;
  const nativeCount=index?.record?.entries?.length||0;
  info("✓ ASSET LIBRARY RESTORED · "+added+" CUSTOM ASSETS · "+nativeCount+
   " BUILT-IN REFERENCES / TEMPLATES AVAILABLE FROM PUBLISHED LIBRARY · "+
   skipped+" SKIPPED · "+failed+" FAILED",failed>0);
 }catch(e){info("LIBRARY RESTORE FAILED: "+e.message,true)}
 finally{busy=false;if($("mbCloudAssetRestore"))$("mbCloudAssetRestore").disabled=false}
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
 if($("mbCloudAssetBackup"))$("mbCloudAssetBackup").onclick=()=>backupEntireAssetLibrary().catch(e=>info(e.message,true));
 if($("mbCloudAssetRestore"))$("mbCloudAssetRestore").onclick=()=>restoreEntireAssetLibrary().catch(e=>info(e.message,true));
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
