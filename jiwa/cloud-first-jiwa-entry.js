/* JIWA.EXE: verified Universal Cloud v1 project and activity sync.
 * Owns no local deletion. Ambiguous versions fail closed; offline recovery remains.
 */
(function(root){"use strict";
 function init(){
  if(new URLSearchParams(root.location.search).get("cloudLegacy")==="1")return;
  const U=root.MembangunUniversal,Shell=root.MembangunCloudStartup,Factory=root.MembangunCloudFirstDrive;
  const Projects=root.JiwaCloudProjects,Activities=root.JiwaActivityEditor;
  if(!U||!Shell||!Factory||!Projects||!Activities)throw Error("Jiwa cloud dependencies not initialized");
  const D=Factory.create("jiwa");
  const key=row=>row.app+"/"+row.kind+"/"+row.id;
  const activityRow=()=>({app:"jiwa",kind:"activities",id:"global-game-activities",data:Activities.get()});
  const projectRow=p=>({app:"jiwa",kind:"mechanics",id:Projects.idFor(p.cityId),data:p});
  const status=document.createElement("span");
  status.style.cssText="font:11px Tahoma;color:#063c24";
  async function localRows(){
   const list=(await Projects.list()).map(projectRow);
   if(Activities.hasLocal())list.push(activityRow());
   return list;
  }
  function check(row){
   if(row.app!=="jiwa"||!["mechanics","activities"].includes(row.kind))throw Error("Unknown Jiwa record type");
   if(row.kind==="mechanics"&&(!row.data?.cityId||!row.data?.updatedAt||
       row.id!==Projects.idFor(row.data.cityId)||typeof row.data.bindings!=="object"))
    throw Error("Invalid Jiwa mechanics project");
   if(row.kind==="activities"&&(row.id!=="global-game-activities"||
      row.data?.format!==root.JiwaActivities?.FORMAT||!Array.isArray(row.data.activities)))
    throw Error("Invalid Jiwa activity catalog");
  }
  async function safeApply(remote){
   const present=new Map((await localRows()).map(r=>[key(r),r]));
   for(const incoming of remote){
    check(incoming);
    const old=present.get(key(incoming));
    if(old&&await U.hash(old.data)!==await U.hash(incoming.data))
     throw Error("LOCAL CONFLICT: "+key(incoming)+". Browser and Drive copies were preserved.");
   }
   let imported=0;
   for(const incoming of remote){
    if(present.has(key(incoming)))continue;
    if(incoming.kind==="mechanics")await Projects.putNew(incoming.data);
    else Activities.applyCloud(incoming.data);
    imported++;
   }
   if(imported)await Projects.reload();
   return imported;
  }
  async function reconcile(){
   const data=await D.loadAll();
   if(!data.verified)throw Error("Unverified Jiwa cloud response");
   const remote=new Map(data.records.map(r=>[key(r),r]));
   const locals=await localRows();
   for(const r of data.records)check(r);
   for(const local of locals){
    check(local);
    const cloud=remote.get(key(local));
    if(cloud&&await U.hash(cloud.data)!==await U.hash(local.data))
     throw Error("CONFLICT: "+key(local)+" has different local and Drive revisions. No overwrite.");
   }
   let uploaded=0;
   for(const local of locals){
    if(remote.has(key(local)))continue;
    const receipt=await D.upload(local);
    const readback=await D.readback(local,receipt);
    if(await U.hash(readback.data)!==await U.hash(local.data))
     throw Error("Jiwa cloud upload verification failed: "+key(local));
    uploaded++;
   }
   const imported=await safeApply(data.records);
   return {verified:true,imported,uploaded,count:data.records.length+uploaded};
  }
  const adapter={
   connect:()=>D.connect(),
   loadAll:()=>D.loadAll(),
   upload:async row=>{check(row);return D.upload(row)},
   readback:(row,receipt)=>D.readback(row,receipt),
   apply:safeApply,
   exportRows:()=>D.exportRows(),
   cleanup:async()=>{/* Never clear browser drafts. */}
  };
  let busy=false,active=false;
  const gate=Shell.mount({app:"jiwa",adapter,
   async onReady(){
    await reconcile();
    active=true;status.textContent="✓ DRIVE VERIFIED";
    const bar=document.createElement("div");bar.id="jiwa-cloud-tools";
    bar.style.cssText="position:fixed;right:12px;bottom:12px;z-index:2147481000;background:#c0c0c0;border:2px solid;border-color:#fff #555 #555 #fff;display:flex;gap:4px;padding:4px;align-items:center";
    const sync=document.createElement("button"),download=document.createElement("button");
    sync.type=download.type="button";sync.textContent="↻ SYNC DRIVE";download.textContent="↓ UNIVERSAL";
    for(const b of [sync,download])b.style.cssText="padding:6px;font:11px Tahoma;background:#eee;color:#111";
    sync.onclick=async()=>{sync.disabled=true;
     try{const a=await reconcile();status.textContent="✓ DRIVE VERIFIED · "+a.uploaded+" uploaded"}
     catch(e){status.textContent="SYNC FAILED: "+e.message}finally{sync.disabled=false}};
    download.onclick=async()=>{download.disabled=true;
     try{await gate.exportUniversal();status.textContent="✓ UNIVERSAL EXPORTED"}
     catch(e){status.textContent="EXPORT ERROR: "+e.message}finally{download.disabled=false}};
    bar.append(status,sync,download);document.body.append(bar);
   },onOffline(){active=false;}
  });
  async function saved(row){
   if(!active||!D.connected())return;
   try{
    const a=await D.upload(row),back=await D.readback(row,a);
    if(await U.hash(back.data)!==await U.hash(row.data))throw Error("Cloud readback hash mismatch");
    status.textContent="✓ SAVED TO DRIVE · "+row.id;
   }catch(e){status.textContent="LOCAL SAVED · DRIVE ERROR: "+e.message}
  }
  root.JiwaCloudEntry=Object.freeze({
   gate,reconcile,isOnline:()=>active&&D.connected(),
   projectSaved:project=>saved(projectRow(project)),
   activitySaved:activity=>saved({app:"jiwa",kind:"activities",id:"global-game-activities",data:activity})
  });
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{try{init()}catch(e){console.error(e)}},{once:true});
 else try{init()}catch(e){console.error(e)}
})(window);
