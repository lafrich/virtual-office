/* Virtual Life Game Asset Bridge v1.
 * Opt-in original-source rig playback for editable Rebuild and encrypted Cove.
 * The untouched game renderer always remains the fallback.
 */
(function(global){
"use strict";
if(global.VOAssetBridge)return;
const BASE="https://lafrich.github.io/virtual-life-asset-pipeline/";
const ACTIVE=new URLSearchParams(global.location.search).get("assetbridge")==="1";
const DIRECTIONS=["se","sw","ne","nw"];
const POSES={bed:"sleep",tub:"bath",toilet:"toilet_sit",desk:"sit_type",
 work:"sit_type",sleep:"sleep",bathe:"bath",sit:"sit",lie:"sleep"};
const state={status:ACTIVE?"loading":"off",actor:"",pack:null,clips:[],catalog:null,
 images:new Map(),pending:new Map(),error:"",motion:"",started:0,preview:"",dir:"se",previewStart:0};
const api={enabled:ACTIVE,base:BASE,draw,selectActor,getStatus,
 ready:()=>state.status==="ready",getClip:id=>state.clips.find(c=>c.id===id)||null};
global.VOAssetBridge=Object.freeze(api);
if(!ACTIVE)return;
const runtime=global.VirtualLifeRig;
if(!runtime){state.status="error";state.error="Missing local rig runtime";return;}
function safePath(s,kind){
 if(typeof s!=="string"||s.length>160||s.includes("..")||s.includes("\\")||
    s.includes("?")||s.includes("#")||s.startsWith("/"))return false;
 if(kind==="catalog")return s==="rigs.json";
 if(kind==="pack")return /^motion-packs\/[a-z0-9_]+\.json$/.test(s);
 return /^media\/[A-Za-z0-9_.-]+\.png$/.test(s);
}
function assetUrl(s,kind){
 if(!safePath(s,kind))throw Error("Untrusted pipeline asset path");
 const u=new URL(s,BASE);
 if(u.origin!==new URL(BASE).origin)throw Error("Untrusted asset origin");
 return u.href;
}
async function jsonFile(path,kind){
 const r=await fetch(assetUrl(path,kind),{mode:"cors",credentials:"omit",cache:"default"});
 if(!r.ok)throw Error("Pipeline HTTP "+r.status);
 return r.json();
}
function getStatus(){
 return {enabled:ACTIVE,status:state.status,actor:state.actor,
 readyActions:state.clips.map(x=>x.id),error:state.error};
}
async function loadImage(clip){
 if(!clip||!safePath(clip.atlas,"atlas"))return null;
 if(state.images.has(clip.atlas))return state.images.get(clip.atlas);
 if(state.pending.has(clip.atlas))return state.pending.get(clip.atlas);
 const promise=new Promise((resolve,reject)=>{
  const img=new Image();img.crossOrigin="anonymous";img.decoding="async";
  img.onload=()=>{
   if(img.naturalWidth!==clip.columns*64||img.naturalHeight!==clip.rows*112)
     return reject(Error("Unexpected original atlas geometry"));
   state.images.set(clip.atlas,img);resolve(img);
  };
  img.onerror=()=>reject(Error("Original pixel atlas not available"));
  img.src=assetUrl(clip.atlas,"atlas");
 });
 state.pending.set(clip.atlas,promise);
 try{return await promise;}
 catch(e){state.error=e.message;return null;}
 finally{state.pending.delete(clip.atlas);}
}
function approvedClip(clip){
 return clip&&clip.status==="ready"&&safePath(clip.atlas,"atlas")&&
  Number.isInteger(clip.columns)&&Number.isInteger(clip.rows)&&clip.rows>=4&&
  Number.isInteger(clip.row_start)&&clip.row_start>=0&&clip.row_start+4<=clip.rows&&
  Number.isInteger(clip.frames)&&clip.frames>0&&clip.frames<=clip.columns&&
  Array.isArray(clip.frame_ms)&&clip.frame_ms.length===clip.frames&&
  clip.frame_ms.every(t=>Number.isInteger(t)&&t>0);
}
let generation=0;
async function selectActor(id){
 if(!state.catalog||!ACTIVE)return false;
 const actor=state.catalog.characters.find(c=>c.id===id);
 if(!actor)return false;
 const seq=++generation;
 state.status="loading";state.error="";state.actor=id;
 state.pack=null;state.clips=[];state.motion="";state.preview="";
 updatePanel();
 try{
  const pack=await jsonFile(actor.pack,"pack");
  if(seq!==generation)return false;
  if(pack.format!=="virtual-life-sprite-motion-v1"||pack.actor!==id||
     pack.model_type!==actor.model_type||!Array.isArray(pack.clips))
    throw Error("Wrong actor rig pack");
  state.pack=pack;state.clips=pack.clips.filter(approvedClip);
  const first=state.clips.find(c=>c.id==="walk")||
    state.clips.find(c=>c.id==="idle")||state.clips[0];
  state.preview=first?.id||"";
  state.previewStart=performance.now();
  state.status=state.clips.length?"ready":"empty";
  updatePanel();
  if(first)await loadImage(first);
  return state.status==="ready";
 }catch(e){
  if(seq!==generation)return false;
  state.status="error";state.error=e.message;updatePanel();return false;
 }
}
function selectClip(opts={}){
 const id=opts.actionId||POSES[opts.pose]||(opts.moving?"walk":"idle");
 let clip=state.clips.find(c=>c.id===id);
 if(!clip&&!opts.pose&&!opts.actionId)clip=state.clips.find(c=>c.id==="walk");
 return clip||null;
}
// Called from an existing render frame. True ONLY after a genuine actor's
// original atlas has loaded; missing action/asset => game's native renderer.
function draw(ctx,point,zoom,opts={}){
 if(state.status!=="ready"||!ctx||!point||!Number.isFinite(zoom)||zoom<=0)return false;
 const clip=selectClip(opts);if(!clip)return false;
 const img=state.images.get(clip.atlas);
 if(!img||!img.naturalWidth){
  if(!state.pending.has(clip.atlas))loadImage(clip); // asynchronously prepare action transition
  return false;
 }
 const dir=DIRECTIONS.includes(opts.direction)?opts.direction:"se";
 const key=opts.actionId||opts.pose||(opts.moving?"walk":"idle");
 if(state.motion!==key){state.motion=key;state.started=performance.now();}
 const t=key==="idle"&&clip.id==="walk"?0:performance.now()-state.started;
 ctx.save();const ok=runtime.draw(ctx,img,clip,dir,t,point.x,point.y,zoom*.9);ctx.restore();
 return ok;
}
let panel=null,selector=null,motionSelector=null,info=null,canvas=null;
function updatePanel(){
 if(!panel)return;
 const actor=state.catalog?.characters.find(c=>c.id===state.actor);
 if(info)info.textContent=state.status.toUpperCase()+" / "+(actor?.model_type||"NO MODEL")+
  " / "+state.clips.length+" READY"+(state.error?" / "+state.error:"");
 if(selector&&actor)selector.value=actor.id;
 if(motionSelector){
  motionSelector.replaceChildren();
  for(const clip of state.clips){
   const o=document.createElement("option");o.value=clip.id;o.textContent=clip.name||clip.id;
   motionSelector.append(o);
  }
  motionSelector.disabled=!state.clips.length;
  motionSelector.value=state.preview;
 }
}
function createUI(){
 if(panel)return;
 const css=document.createElement("style");
 css.textContent=[
  "#vo-asset-btn{position:fixed;left:12px;bottom:80px;z-index:2147482000;padding:8px;background:#eaf2ff;color:#163972;border:2px solid #29406d;font:bold 11px monospace;cursor:pointer}",
  "#vo-asset-panel{position:fixed;left:12px;bottom:120px;z-index:2147482100;width:min(350px,calc(100vw - 24px));max-height:72vh;overflow:auto;padding:10px;background:#ece9d8;border:3px solid #29406d;color:#172542;font:11px/1.5 monospace}",
  "#vo-asset-panel[hidden]{display:none!important}#vo-asset-panel select{display:block;width:100%;min-height:31px;margin:5px 0 9px;border:1px solid #7e8ca6;background:#fff}",
  "#vo-asset-panel button{border:1px solid #637999;background:#fff;padding:5px;cursor:pointer}#vo-asset-panel .ab-row{display:flex;gap:5px;flex-wrap:wrap;align-items:center;margin:7px 0}",
  "#vo-asset-panel canvas{display:block;background:#e2eaf8;margin:8px auto;max-width:100%;image-rendering:pixelated}#vo-asset-panel a{color:#123f82}"
 ].join("\n");document.head.append(css);
 const btn=document.createElement("button");btn.id="vo-asset-btn";btn.type="button";btn.textContent="▣ ASSET BRIDGE";
 const view=document.createElement("section");view.id="vo-asset-panel";view.hidden=true;
 const header=document.createElement("div");header.className="ab-row";
 const heading=document.createElement("strong");heading.textContent="VIRTUAL LIFE / PIPELINE";
 const close=document.createElement("button");close.type="button";close.textContent="✕";close.onclick=()=>{view.hidden=true;};
 header.append(heading,close);view.append(header);
 const caption=document.createElement("p");caption.textContent="Original-source model rigs / Developer preview";view.append(caption);
 selector=document.createElement("select");selector.setAttribute("aria-label","Character model");
 motionSelector=document.createElement("select");motionSelector.setAttribute("aria-label","Available animation");
 for(const [label,input] of [["CHARACTER / MODEL",selector],["READY MOTION",motionSelector]]){
  const l=document.createElement("label");l.textContent=label;l.append(input);view.append(l);
 }
 info=document.createElement("p");info.setAttribute("role","status");view.append(info);
 const dirs=document.createElement("div");dirs.className="ab-row";
 for(const dir of DIRECTIONS){
  const b=document.createElement("button");b.textContent=dir.toUpperCase();b.type="button";
  b.onclick=()=>{state.dir=dir;state.previewStart=performance.now();};dirs.append(b);
 }
 view.append(dirs);canvas=document.createElement("canvas");canvas.width=240;canvas.height=250;view.append(canvas);
 const links=document.createElement("div");links.className="ab-row";
 const a=document.createElement("a");a.href=BASE+"#rigs";a.target="_blank";a.rel="noopener noreferrer";a.textContent="OPEN RIG STUDIO";
 const copy=document.createElement("button");copy.type="button";copy.textContent="COPY PACK URL";
 copy.onclick=async()=>{
  const actor=state.catalog?.characters.find(c=>c.id===state.actor);if(!actor)return;
  try{await navigator.clipboard.writeText(assetUrl(actor.pack,"pack"));info.textContent="Copied actor motion-pack URL";}
  catch(e){info.textContent="Clipboard not available";}
 };
 links.append(a,copy);view.append(links);
 const note=document.createElement("p");note.textContent="Opt-in only (?assetbridge=1). Game logic and encrypted files are unchanged.";view.append(note);
 selector.onchange=()=>selectActor(selector.value);
 motionSelector.onchange=async()=>{
  state.preview=motionSelector.value;state.previewStart=performance.now();
  await loadImage(state.clips.find(c=>c.id===state.preview));
 };
 btn.onclick=()=>{view.hidden=!view.hidden;};
 for(const event of ["pointerdown","pointerup","keydown","keyup","touchstart","touchend","wheel"]){
  view.addEventListener(event,e=>e.stopPropagation());
  btn.addEventListener(event,e=>e.stopPropagation());
 }
 document.body.append(btn,view);panel=view;updatePanel();requestAnimationFrame(previewTick);
}
function previewTick(){
 if(!panel)return;requestAnimationFrame(previewTick);
 if(panel.hidden)return;
 const ctx=canvas.getContext("2d");
 ctx.fillStyle="#e2eaf8";ctx.fillRect(0,0,canvas.width,canvas.height);
 const clip=state.clips.find(c=>c.id===state.preview);
 const img=clip&&state.images.get(clip.atlas);
 if(img)runtime.draw(ctx,img,clip,state.dir,performance.now()-state.previewStart,canvas.width/2,canvas.height-10,2);
}
async function boot(){
 try{
  const result=await jsonFile("rigs.json","catalog");
  if(!result||!Array.isArray(result.characters)||!Array.isArray(result.types))throw Error("Invalid rig registry");
  state.catalog=result;createUI();
  for(const actor of result.characters){
   if(!/^[a-z0-9_]+$/.test(actor.id)||!safePath(actor.pack,"pack"))continue;
   const option=document.createElement("option");option.value=actor.id;option.textContent=actor.name+" / "+actor.model_type;
   selector.append(option);
  }
  const first=result.characters.find(c=>c.id==="ichsan")||result.characters.find(c=>c.ready_count>0);
  if(first)await selectActor(first.id);
 }catch(e){state.status="error";state.error=e.message;createUI();updatePanel();}
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})(window);
