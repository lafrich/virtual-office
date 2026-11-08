/* Emosi.exe: native verified Drive session and Universal import/export.
 * Existing local IndexedDB records are retained; no delete/clear operations.
 */
(function(root){"use strict";
 function init(){
  if(new URLSearchParams(root.location.search).get("cloudLegacy")==="1")return;
  const U=root.MembangunUniversal,Gate=root.MembangunCloudStartup,D=root.EmotionDrive;
  const B=root.EmosiCloudBridge,Valid=root.MH2UniversalEmotions?.validEntry;
  if(!U||!Gate||!D||!B||!Valid)throw Error("Emosi cloud dependencies not ready");
  const kind="emotion";
  const clean=entry=>D.documentFor(entry).entries[0];
  const row=entry=>({app:"emosi",kind,id:entry.id,data:clean(entry)});
  async function verifiedRows(){
   const response=await D.loadAll();
   if(response.errors?.length)throw Error("Some Google Drive emotions are corrupt: "+response.errors.map(e=>e.file).join(", "));
   const result=[];
   for(const entry of response.entries){if(!Valid(entry))throw Error("Drive emotion failed validation: "+entry.id);result.push(row(entry))}
   return result;
  }
  const adapter={
   connect:()=>D.connected()?Promise.resolve(true):D.connect(),
   async loadAll(){const records=await verifiedRows();return {verified:true,records,count:records.length}},
   async upload(incoming){
    if(incoming.app!=="emosi"||incoming.kind!==kind||incoming.id!==incoming.data?.id||
      !Valid(incoming.data))throw Error("Invalid Universal Emotion asset");
    const list=await D.list(),name=incoming.id+".emotion.json";
    const existing=list.filter(f=>f.name===name);
    if(existing.length>1)throw Error("Duplicate Drive emotion: "+incoming.id);
    if(existing.length){
     const previous=await D.loadOne(existing[0]);
     if(await U.hash(clean(previous))!==await U.hash(incoming.data))
      throw Error("CLOUD CONFLICT: "+incoming.id+" differs in Google Drive. Nothing overwritten.");
     return {verified:true,fileId:existing[0].id,unchanged:true};
    }
    const saved=await D.save(incoming.data);
    const response=await D.loadOne(saved.project);
    if(await U.hash(clean(response))!==await U.hash(incoming.data))
     throw Error("Emotion Drive readback verification failed");
    return {verified:true,fileId:saved.project.id};
   },
   async readback(incoming,receipt){
    const existing=await D.loadOne({id:receipt.fileId,name:incoming.id+".emotion.json"});
    return row(existing);
   },
   async apply(){/* Native refresh inside onReady hydrates after verified upload. */},
   exportRows:verifiedRows,
   async cleanup(){/* Intentionally no browser cleanup. */}
  };
  const gate=Gate.mount({app:"emosi",adapter,
   async onReady(){
    await B.reconcile();
    const title=document.querySelector(".title-actions");
    if(!title)return;
    const state=document.createElement("small");state.textContent="✓ DRIVE VERIFIED";
    const refresh=document.createElement("button");refresh.type="button";refresh.textContent="↻ SYNC DRIVE";
    const exportButton=document.createElement("button");exportButton.type="button";exportButton.textContent="↓ UNIVERSAL";
    for(const b of [refresh,exportButton]){b.style.cssText="font:11px Tahoma;padding:5px;min-height:28px"}
    refresh.onclick=async()=>{refresh.disabled=true;state.textContent="SYNCING...";
     try{await B.reconcile();state.textContent="✓ DRIVE VERIFIED"}
     catch(e){state.textContent="SYNC ERROR: "+e.message}finally{refresh.disabled=false}};
    exportButton.onclick=async()=>{exportButton.disabled=true;
     try{await gate.exportUniversal();state.textContent="✓ UNIVERSAL EXPORTED"}
     catch(e){state.textContent="EXPORT ERROR: "+e.message}finally{exportButton.disabled=false}};
    title.prepend(state,refresh,exportButton);
   },
   onOffline(){const online=document.getElementById("online");if(online)online.textContent="LOCAL / NOT SYNCED"}
  });
  root.EmosiCloudEntry=Object.freeze({gate,adapter});
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{try{init()}catch(e){console.error(e)}},{once:true});
 else try{init()}catch(e){console.error(e)}
})(window);
