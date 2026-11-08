/* Mainkan Flow Editor: verified Drive project, non-destructive and file export preserved.
 * Mainkan player remains independent; never mix player auth with Google Drive.
 */
(function(root){"use strict";
 function init(){
  if(new URLSearchParams(root.location.search).get("cloudLegacy")==="1")return;
  const U=root.MembangunUniversal,Shell=root.MembangunCloudStartup,Factory=root.MembangunCloudFirstDrive;
  const Editor=root.MainkanFlowCloudBridge,F=root.MainkanFlow;
  if(!U||!Shell||!Factory||!Editor||!F)throw Error("Mainkan flow cloud dependencies missing");
  const D=Factory.create("mainkan"),flowId="main-flow";
  const snapshot=()=>({app:"mainkan",kind:"flow",id:flowId,data:Editor.get()});
  const check=row=>{
   if(row.app!=="mainkan"||row.kind!=="flow"||row.id!==flowId)
    throw Error("This Mainkan editor supports exactly one active flow database");
   F.normalize(row.data);
  };
  let active=false,busy=false,pending=null;
  const adapter={
   connect:()=>D.connect(),
   loadAll:()=>D.loadAll(),
   async upload(row){check(row);return D.upload(row)},
   readback:(row,receipt)=>D.readback(row,receipt),
   async apply(rows){
    if(rows.length>1)throw Error("Only one Mainkan flow may be imported at a time");
    if(rows[0]){check(rows[0]);Editor.apply(rows[0].data)}
   },
   exportRows:()=>D.exportRows(),
   cleanup:async()=>{/* No browser drafts to remove. */}
  };
  const strip=document.createElement("div");
  strip.id="mainkan-cloud-tools";
  strip.style.cssText="position:fixed;right:12px;bottom:12px;z-index:2147481000;background:#c0c0c0;border:2px solid;border-color:#fff #555 #555 #fff;display:flex;gap:4px;padding:5px;align-items:center";
  const state=document.createElement("small");state.style.cssText="font:11px Tahoma;margin:0 6px";state.textContent="NOT SYNCED";
  const save=document.createElement("button"),download=document.createElement("button");
  save.textContent="☁ SAVE DRIVE";download.textContent="↓ UNIVERSAL";save.type=download.type="button";
  for(const b of [save,download])b.style.cssText="font:11px Tahoma;padding:6px;background:#eee;color:#111";
  strip.append(state,save,download);
  async function saveCurrent(){
   if(!active||!D.connected())throw Error("Connect Google Drive to save");
   if(busy)return;
   busy=true;save.disabled=true;state.textContent="SAVING TO DRIVE...";
   try{
    const record=snapshot(),receipt=await D.upload(record);
    const back=await D.readback(record,receipt);
    if(await U.hash(back.data)!==await U.hash(record.data))throw Error("Drive readback differs");
    state.textContent="✓ LATEST ON DRIVE";
    return true;
   }catch(e){state.textContent="DRIVE NOT SAVED: "+e.message;throw e}
   finally{busy=false;save.disabled=false}
  }
  const gate=Shell.mount({app:"mainkan",adapter,
   async onReady(data){
    if(data.records.length>1)throw Error("Multiple Drive flow records. Export/review before choosing one.");
    if(data.records[0]){check(data.records[0]);Editor.apply(data.records[0].data)}
    active=true;state.textContent="✓ DRIVE READY";
    document.body.append(strip);
    Editor.onEdit(()=>{
     if(pending)clearTimeout(pending);
     pending=setTimeout(()=>{pending=null;void saveCurrent().catch(console.warn)},1700);
    });
   },
   onOffline(){active=false;}
  });
  save.onclick=()=>{void saveCurrent().catch(console.warn)};
  download.onclick=async()=>{download.disabled=true;
   try{await gate.exportUniversal();state.textContent="✓ UNIVERSAL EXPORTED"}
   catch(e){state.textContent="EXPORT FAILED: "+e.message}finally{download.disabled=false}};
  root.MainkanCloudEntry=Object.freeze({gate,adapter,saveCurrent,isOnline:()=>active&&D.connected()});
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>{try{init()}catch(e){console.error(e)}},{once:true});
 else try{init()}catch(e){console.error(e)}
})(window);
