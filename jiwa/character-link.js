/* Jiwa.exe — read-only selection from the Mahluk Hidup 1 V6B catalog.
 * Preserves custom V1 characters and existing game mechanics.
 * V2 projects are not surfaced, but no browser data is deleted.
 */
(function(g){"use strict";
const BASE=new URL("/virtual-life-asset-pipeline/",location.origin);
const CUSTOM="virtual-life-character-storage-v1",ACTIVE="jiwa-sandbox-actor-v1";
const $=id=>document.getElementById(id),ASSET=/^media\/[a-z0-9_.-]+\.png$/i;
let rows=[],selection="",loadError="";
function local(){try{const d=JSON.parse(localStorage.getItem(CUSTOM)||"[]");return Array.isArray(d)?d:[]}catch{return []}}
function draw(record){
 const canvas=$("jiwaActorPreview");if(!canvas)return;
 const ctx=canvas.getContext("2d");ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,canvas.width,canvas.height);
 if(!record)return;
 const img=new Image(),id=record.id;
 img.onload=()=>{
  if(selection===id&&img.naturalWidth>=64&&img.naturalHeight>=(record.row+1)*112)
   ctx.drawImage(img,0,record.row*112,64,112,0,0,canvas.width,canvas.height);
 };
 img.src=new URL(record.sprite,BASE).href;
}
async function refresh(){
 const control=$("jiwaActor"),status=$("jiwaActorStatus");if(!control)return 0;
 const previous=selection||control.value;
 try{
  const resp=await fetch(new URL("catalog.json",BASE),{cache:"no-store"});
  if(!resp.ok)throw Error("HTTP "+resp.status);
  const catalog=await resp.json();if(!Array.isArray(catalog.characters))throw Error("Invalid catalog");
  const native=catalog.characters.filter(a=>a?.id&&ASSET.test(a.sheet||"")&&!/^(?:legacy_)?otis$/.test(a.id))
   .slice(0,200).map(a=>({id:a.id,name:a.name||a.id,base:a.id,
     sprite:a.sheet,row:Math.max(0,Math.min(43,Number(a.row_starts?.idle??4))),
     category:a.template_category||"npc"}));
  const byId=new Map(native.map(r=>[r.id,r]));
  for(const saved of local().slice(0,60)){
   if(!/^custom_(astro|human)_[a-z0-9-]+$/.test(saved.id||""))continue;
   const parent=byId.get(saved.base);if(parent)
    native.push({...parent,id:saved.id,base:saved.base,name:String(saved.name||saved.id).slice(0,50)});
  }
  rows=native;loadError="";
 }catch(e){loadError=String(e.message||e)}
 control.replaceChildren();
 const empty=document.createElement("option");empty.value="";empty.textContent="NO CHARACTER / TEST SYSTEM ONLY";control.append(empty);
 for(const r of rows){const opt=document.createElement("option");opt.value=r.id;
  opt.textContent=r.name+" / "+r.category.toUpperCase();control.append(opt)}
 selection=rows.some(r=>r.id===previous)?previous:"";control.value=selection;
 if(status)status.textContent=loadError?"MAHLUK HIDUP 1 SYNC GAGAL · "+loadError:
  rows.length+" V6B CHARACTERS · PUBLISHED + LOCAL CUSTOM";
 draw(rows.find(r=>r.id===selection));return rows.length;
}
function select(id){
 selection=rows.some(r=>r.id===id)?id:"";
 const control=$("jiwaActor");if(control)control.value=selection;
 try{localStorage.setItem(ACTIVE,selection)}catch{}
 draw(rows.find(r=>r.id===selection));
}
if($("jiwaActor")){
 try{selection=localStorage.getItem(ACTIVE)||""}catch{}
 $("jiwaActor").onchange=e=>select(e.target.value);
 $("jiwaSyncActors").onclick=()=>void refresh();
 window.addEventListener("storage",e=>{if(e.key===CUSTOM)void refresh()});
 window.addEventListener("focus",()=>void refresh());
 if(window.VLHub)window.VLHub.subscribe(["characters","accessories","emotions"],()=>void refresh());
 void refresh();
}
g.JiwaActorLink=Object.freeze({
 get id(){return selection},get record(){return rows.find(r=>r.id===selection)||null},
 list:()=>rows.slice(),refresh
});
})(window);
