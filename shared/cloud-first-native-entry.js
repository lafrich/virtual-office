/* Native Cloud Entry for Semesta / Bangun Ruang (non-destructive).
 * Reuses the EXISTING native Drive folders and save formats, not the trial folder.
 * No localStorage.removeItem, indexedDB deletion, or automatic overwrite.
 */
(function(root){"use strict";
 const U=root.MembangunUniversal,D=root.MembangunCloudDrive;
 const SUPPORTED={
  semesta:["city","assetCatalog","assetBuilding","assetObject"],
  bangun:["building","object","assetCatalog"]
 };
 function createNode(tag,text){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n}
 function init({app}={}){
  const params=new URLSearchParams(root.location?.search||"");
  // Player and device previews are read-only gameplay surfaces. Never block
  // Mainkan gameplay, phone previews, or isolated browser regression sessions.
  // ?njhMap=1 is the local NJH Semesta map preview (no Drive, no persist).
  if(app==="semesta"&&(params.get("player")==="1"||params.get("deviceFrame")==="1"||params.get("njhMap")==="1"))
   return Object.freeze({isReady:()=>true,mode:"read-only-player"});
  // Explicit opt-out for legacy smoke tests and emergency recovery only.
  // Ordinary editor URLs always get the Drive-first startup.
  if(params.get("cloudLegacy")==="1")
   return Object.freeze({isReady:()=>false,mode:"legacy-offline"});
  if(!SUPPORTED[app]||!U||!D)throw Error("Native cloud startup requires matching Drive and Universal modules");
  let isBusy=false,ready=false,pending=null;
  const overlay=createNode("section");overlay.id="mb-cloud-entry";overlay.setAttribute("role","dialog");
  overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","Membangun cloud startup");
  overlay.style.cssText="position:fixed;inset:0;z-index:2147483000;background:#008080;display:flex;align-items:center;justify-content:center;padding:12px;font:12px Tahoma,Arial,sans-serif";
  const windowBox=createNode("div");
  windowBox.style.cssText="width:min(96vw,480px);background:#c0c0c0;color:#111;padding:10px;border:2px solid;border-color:#fff #555 #555 #fff;box-shadow:4px 4px 0 #222;display:grid;gap:10px";
  const title=createNode("strong","▣ "+(app==="semesta"?"SEMESTA.EXE":"BANGUN RUANG.EXE")+" · DRIVE FIRST");
  title.style.cssText="background:#000080;color:#fff;padding:9px";
  const text=createNode("p","Sync membaca Drive dan menjaga data browser lama. Import Universal diunggah dan diverifikasi sebelum dimuat. Konflik tidak ditimpa.");
  text.style.cssText="margin:0;line-height:1.5";
  const controls=createNode("div");controls.style.cssText="display:grid;grid-template-columns:1fr 1fr;gap:8px";
  function button(label){const b=createNode("button",label);b.type="button";b.style.cssText="font:700 12px Tahoma;background:#dfdfdf;color:#101010;border:2px solid;border-color:#fff #555 #555 #fff;padding:10px;min-height:42px;cursor:pointer";return b}
  const sync=button("☁ SYNC GOOGLE DRIVE"),importSelect=button("↓ IMPORT UNIVERSAL");
  const upload=button("↑ UPLOAD IMPORT TO DRIVE");upload.style.gridColumn="1/-1";upload.hidden=true;
  const emergency=button("OPEN EXISTING DATA (OFFLINE)");emergency.style.gridColumn="1/-1";
  emergency.title="Emergency only. Browser data remains untouched and nothing is claimed saved to Drive.";
  const file=createNode("input");file.type="file";file.accept=".json,application/json";file.hidden=true;
  const status=createNode("p","NOT SYNCED · editor locked until you select an option");
  status.setAttribute("role","status");status.style.cssText="font:11px/1.5 Consolas,monospace;margin:0;white-space:pre-wrap;overflow-wrap:anywhere";
  const note=createNode("small","Browser drafts, Drive originals, and GitHub assets will NEVER be deleted by this feature.");
  controls.append(sync,importSelect,upload,emergency);
  windowBox.append(title,text,controls,file,status,note);overlay.append(windowBox);
  document.body.append(overlay);
  const message=(s,error=false)=>{status.textContent=s;status.style.color=error?"#9c0d17":"#134477"};
  const busy=v=>{isBusy=v;for(const btn of [sync,importSelect,upload,emergency])btn.disabled=v};
  function finish(offline){
   ready=!offline;overlay.remove();
   const tools=createNode("div");tools.id="mb-cloud-entry-tools";
   tools.style.cssText="position:fixed;right:10px;bottom:10px;z-index:2147481000;background:#c0c0c0;padding:5px;display:flex;gap:5px;border:2px solid;border-color:#fff #555 #555 #fff;font:11px Tahoma;color:#111";
   const state=createNode("span",offline?"LOCAL / NOT SYNCED":"✓ DRIVE SYNCED");state.style.cssText="align-self:center;margin:0 5px";
   const again=button("↻ SYNC"),exportBtn=button("↓ UNIVERSAL");
   again.style.cssText=exportBtn.style.cssText="padding:5px;font:11px Tahoma;background:#eee;color:#111;cursor:pointer";
   tools.append(state,again,exportBtn);document.body.append(tools);
   again.onclick=async()=>{again.disabled=true;state.textContent="SYNCING…";try{await connectAndSync();ready=true;state.textContent="✓ DRIVE SYNCED"}catch(e){state.textContent="SYNC FAILED · "+e.message}finally{again.disabled=false}};
   exportBtn.onclick=async()=>{exportBtn.disabled=true;state.textContent="EXPORTING…";
    try{if(!D.connected())throw Error("Connect Drive first");
     const rows=await exportNative();
     if(!rows.length)throw Error("No saved Drive records to export");
     const packet=await U.pack(rows,app);
     const blob=new Blob([JSON.stringify(packet,null,2)],{type:"application/json"});
     const url=URL.createObjectURL(blob),a=createNode("a");a.href=url;
     a.download="membangun-"+app+"-universal-"+new Date().toISOString().slice(0,10)+".json";
     document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
     state.textContent="✓ EXPORTED "+rows.length+" RECORDS";
    }catch(e){state.textContent="EXPORT FAILED · "+e.message}finally{exportBtn.disabled=false}};
  }
  async function connectAndSync(){
   if(!D.connected())await D.connect();
   const ui=root.MembangunCloudUI;
   if(typeof ui?.syncOnConnect!=="function")throw Error("Native Drive reconciliation not ready");
   const result=await ui.syncOnConnect();
   if(!result||result.failed||result.conflicts)
    throw Error("Sync needs review: "+(result?.conflicts??"?")+" conflicts, "+(result?.failed??"?")+" errors. Existing data kept.");
   return result;
  }
  const kinds=SUPPORTED[app];
  async function exportNative(){
   let rows=[];
   for(const kind of kinds){
    const files=await D.list(app,kind);
    for(const f of files){
     const data=await D.load(f);
     if(data.app!==app||data.kind!==kind)throw Error("Unexpected Drive record type");
     rows.push({app,kind,id:data.id,data:data.record});
    }
   }
   return rows;
  }
  async function importNative(json){
   const packet=await U.unpack(json);
   if(!packet.records.length)throw Error("Empty Universal file");
   if(packet.records.some(r=>r.app!==app||!kinds.includes(r.kind)))
    throw Error("This app can import only "+app+" records. Use the matching application for other records.");
   const planned=[];
   // Preflight the ENTIRE package before writing any file.
   for(const row of packet.records){
    D.validateRecord(app,row.kind,row.data);
    const matches=(await D.list(app,row.kind)).filter(f=>f.name===D.filename(row.kind,row.id));
    if(matches.length>1)throw Error("Duplicate Drive record: "+row.id);
    const prior=matches[0]||null;
    if(prior){
     const old=await D.load(prior);
     if(await U.hash(old.record)!==row.sha256)throw Error("CONFLICT: "+row.id+" already exists differently in Drive; nothing overwritten");
    }
    planned.push({row,prior});
   }
   const receipts=[];
   for(const {row,prior} of planned){
    let file=prior;
    if(!file){
     const result=await D.save(app,row.kind,row.data);
     file=result.file;
    }
    const back=await D.load(file);
    if(back.app!==row.app||back.kind!==row.kind||back.id!==row.id||
       await U.hash(back.record)!==row.sha256)
      throw Error("Drive readback failed for "+row.id);
    receipts.push({id:row.id,verified:true});
   }
   const ui=root.MembangunCloudUI;
   const stats=await ui.syncOnConnect();
   if(!stats||stats.failed||stats.conflicts)
    throw Error("Import uploaded, but library reconciliation needs review. No local data was deleted.");
   return receipts.length;
  }
  sync.onclick=async()=>{if(isBusy)return;busy(true);message("Connecting and reconciling native Drive library…");
   try{const result=await connectAndSync();
    message("SYNC VERIFIED · "+result.imported+" loaded, "+result.uploaded+" uploaded");
    finish(false);
   }catch(e){message("SYNC INCOMPLETE · "+e.message,true)}finally{busy(false)}};
  importSelect.onclick=()=>{if(!isBusy)file.click()};
  file.onchange=async()=>{const selected=file.files?.[0];if(!selected)return;
   try{if(selected.size>25*1024*1024)throw Error("Maximum import size 25 MB");
    pending=await selected.text();const parsed=await U.unpack(pending);
    if(parsed.records.some(r=>r.app!==app||!kinds.includes(r.kind)))
     throw Error("Universal file contains data for another app. Import it there.");
    upload.hidden=false;message("FILE VERIFIED · "+parsed.records.length+" records · upload to Drive to continue");
   }catch(e){pending=null;upload.hidden=true;message("IMPORT INVALID · "+e.message,true)}};
  upload.onclick=async()=>{if(isBusy||!pending)return;busy(true);message("Connecting Drive and verifying imported records…");
   try{if(!D.connected())await D.connect();
    const count=await importNative(pending);
    message("DRIVE IMPORT VERIFIED · "+count+" records");finish(false);
   }catch(e){message("IMPORT NOT COMPLETE · "+e.message,true)}finally{busy(false)}};
  emergency.onclick=()=>{if(isBusy)return;
   if(!root.confirm("Open existing browser data without syncing? Changes may not be on Drive. No data will be deleted."))return;
   finish(true);
  };
  return Object.freeze({isReady:()=>ready,connectAndSync,exportNative,importNative});
 }
 root.MembangunNativeCloudEntry=Object.freeze({init});
})(window);