/* SEMESTA — direct, live HUD position editor. 
 * Uses original HUD elements, and stores one global layout for every city.
 * No Jiwa editor, extra game state, or map-specific copy.
 */
(function(root){
'use strict';
const $=id=>document.getElementById(id);
const HL=root.VLHudLayout;
if(!HL)return;
const LABELS={
 lifePanel:'Survival / Stats',money:'Saldo',hpButton:'HP Button',
 bagButton:'Tas Button',phone:'Nokia',bag:'Tas Window',
 action:'Action',run:'Run',needs:'Needs (legacy)',toast:'Notifikasi',dock:'Dock'
};
const GRID_SIZES=[8,16,24,32,48];
const GRID_PREF='semesta-global-ui-grid-v1';
const grid=(()=>{
 try{const v=JSON.parse(localStorage.getItem(GRID_PREF)||'null')||{};
  return {show:v.show!==false,snap:v.snap!==false,size:GRID_SIZES.includes(v.size)?v.size:16};
 }catch{return {show:true,snap:true,size:16};}
})();
const saveGrid=()=>{try{localStorage.setItem(GRID_PREF,JSON.stringify(grid));}catch{}};
const cap=(v,a,b)=>Math.max(a,Math.min(b,v));
const valid=n=>Number.isFinite(Number(n));
const sn=n=>grid.snap?Math.round(n/grid.size)*grid.size:n;
let active=false,draft=null,selected='action',drag=null,overlay=null,raf=0,lastStamp=0;
let dirty=false,profile='desktop',externalDraft=null,previewFrame=null,previewFrameReady=false;
const onlySelected={desktop:false,phone:true};
const play=()=>root.SemestaPlay?.gameplay?.()||null;
function environment(){
 const frame=$('semestaDeviceFrame'),stage=$('semestaDeviceStage');
 const phone=!!frame&&!!stage&&!stage.hidden&&root.SemestaPlay?.devicePref?.().mode==='phone';
 if(!phone)return {phone:false,doc:document,win:root,frame:null,
  host:$('vlPlayHud'),scaleX:1,scaleY:1};
 let doc=null,win=null;
 try{doc=frame.contentDocument;win=frame.contentWindow;}catch(_e){}
 const rect=frame.getBoundingClientRect();
 return {phone:true,doc,win,frame,host:doc?.getElementById('vlPlayHud')||null,
  scaleX:rect.width/Math.max(1,frame.clientWidth||parseFloat(frame.style.width)||390),
  scaleY:rect.height/Math.max(1,frame.clientHeight||parseFloat(frame.style.height)||844)};
}
const hud=()=>environment().win?.SemestaPlay?.hud?.()||null;
const host=()=>environment().host;
const currentLayout=()=>HL.resolveSavedLayout(null,localStorage)?.layout||HL.defaults();
const currentSlot=()=>draft?.[profile]?.[selected]||null;
const status=(message,success=false)=>{
 const el=$('suiStatus');if(!el)return;el.textContent=message;el.dataset.success=success?'true':'false';
};
const GHOST_SIZES={lifePanel:[275,200],money:[84,30],hpButton:[44,44],
 bagButton:[44,44],phone:[182,320],bag:[225,245],action:[70,70],
 run:[66,44],needs:[155,80],toast:[192,42],dock:[255,65]};
function visibleElement(id,env=environment()){
 if(!env.doc)return null;
 for(const selector of HL.SELECTORS[id]||[]){
  const el=env.doc.querySelector(selector);
  if(!el||el.hidden||!el.isConnected)continue;
  if(id==='bag'&&el.id==='ptWindow'&&el.dataset.kind!=='bag')continue;
  if(id==='phone'&&el.id==='ptWindow'&&el.dataset.kind!=='phone'&&!el.querySelector('.vs-nk'))continue;
  if(el.closest('[hidden]'))continue;
  const rect=el.getBoundingClientRect();
  if(rect.width>2&&rect.height>2)return {el,rect};
 }
 return null;
}
function geometry(id){
 const env=environment(),h=env.host;
 if(!h)return null;
 const found=visibleElement(id,env),stage=h.getBoundingClientRect(),wrap=$('canvas-wrap').getBoundingClientRect();
 let lx,ly,lw,lh;
 if(found){
  lx=found.rect.left-stage.left;ly=found.rect.top-stage.top;
  lw=found.rect.width;lh=found.rect.height;
 }else{
  // Not every HUD is visible during play (legacy Needs, collapsed tips,
  // closed popups). The selected item still has a drag/resize handle.
  const slot=draft?.[profile]?.[id];
  if(!slot||id!==selected)return null;
  const [bw,bh]=GHOST_SIZES[id]||[80,56];
  lw=bw*slot.scale;lh=bh*slot.scale;
  const [v,u]=slot.anchor.split('-');
  lx=u==='right'?stage.width-lw-slot.x:u==='center'?(stage.width-lw)/2+slot.x:slot.x;
  ly=v==='bottom'?stage.height-lh-slot.y:v==='center'?(stage.height-lh)/2+slot.y:slot.y;
 }
 const screenLeft=stage.left+lx,screenTop=stage.top+ly;
 const scaleX=env.phone?env.scaleX:1,scaleY=env.phone?env.scaleY:1;
 const outerX=env.phone?env.frame.getBoundingClientRect().left+screenLeft*scaleX:screenLeft;
 const outerY=env.phone?env.frame.getBoundingClientRect().top+screenTop*scaleY:screenTop;
 return {el:found?.el||null,ghost:!found,
  x:outerX-wrap.left,y:outerY-wrap.top,w:lw*scaleX,h:lh*scaleY,
  logical:{x:lx,y:ly,w:lw,h:lh,stageW:stage.width,stageH:stage.height},
  scaleX,scaleY,stage};
}
function openPopupFor(id){
 const h=hud();
 if(!h)return;
 if(id==='phone'||id==='bag'){
  if(h.getOpenWindow?.()!==id)h.toggleWindow?.(id);
 }else if(h.getOpenWindow?.() && id!=='toast'){
  // Only show a popup while placing that popup.
  h.toggleWindow?.(null);
 }
}
function ensureOverlay(){
 if(overlay)return;
 const wrap=$('canvas-wrap');if(!wrap)return;
 overlay=document.createElement('div');
 overlay.id='semestaUIOverlay';
 overlay.innerHTML='<div class="sui-phone-shield"></div>'+
  '<div class="sui-grid-layer"></div>'+
  '<div class="sui-guide x"></div><div class="sui-guide y"></div>'+
  '<div class="sui-hint-bar">EDIT UI · Pilih via panel kanan · Drag / resize · SAVE</div>';
 for(const id of HL.ELEMENTS){
  const node=document.createElement('div');node.className='sui-outline';
  node.dataset.suiId=id;node.hidden=true;
  const tag=document.createElement('span');tag.className='sui-tag';tag.textContent=LABELS[id]||id;node.append(tag);
  const handle=document.createElement('span');handle.className='sui-resizer';handle.title='Resize '+id;handle.hidden=true;node.append(handle);
  node.addEventListener('pointerdown',e=>pointerStart(e,id));
  overlay.append(node);
 }
 // When Selected Only is enabled, other outlines are intentionally hidden.
 // Hit-test the live HUD beneath the transparent shield so users can still
 // select and drag a different element directly, without using the dropdown.
 overlay.querySelector('.sui-phone-shield').addEventListener('pointerdown',ev=>{
  const id=pickAt(ev.clientX,ev.clientY);
  if(id)pointerStart(ev,id);
 });
 overlay.addEventListener('lostpointercapture',pointerEnd);
 overlay.querySelector('.sui-grid-layer').style.backgroundSize='16px 16px';
 wrap.append(overlay);
}
function syncFramePreview(clear=false){
 const frame=$('semestaDeviceFrame');
 if(!frame)return false;
 try{
  const win=frame.contentWindow,api=win?.SemestaUIEditor;
  if(!api?.setExternalPreview||!win?.SemestaPlay)return false;
  api.setExternalPreview(clear?null:draft);
  win.SemestaPlay.refreshHud?.();
  return true;
 }catch(_e){return false;}
}
function profileAndFrame(){
 // On a physical phone the HUD is in this document (not in an iframe).
 // Never reset its phone profile to desktop on the next animation frame.
 const env=environment(),next=env.phone?'phone':HL.detectProfile(document);
 if(profile!==next){
  profile=next;drag=null;
  if(active){updateControls();status('MODE '+next.toUpperCase()+' · Edit menggunakan posisi HUD '+next+'.');}
 }
 if(env.phone&&env.win?.SemestaUIEditor&&
    previewFrameReady!==env.win.SemestaUIEditor&&
    env.win?.SemestaLifePlay?.active?.()){
  if(active&&syncFramePreview()){
   previewFrameReady=env.win.SemestaUIEditor;
   openPopupFor(selected);
  }
 }else if(!env.phone)previewFrameReady=false;
 return env;
}
function refreshBoxes(now=0){
 if(!active||!overlay)return;
 const env=profileAndFrame(),h=env.host,w=h?.getBoundingClientRect(),wrap=$('canvas-wrap')?.getBoundingClientRect();
 // Phone is a distinct same-origin iframe; it takes time to finish loading.
 // Never terminate the selection loop while waiting for the game HUD.
 if(!w||!w.width||!w.height||!wrap){
  for(const node of overlay.querySelectorAll('.sui-outline'))node.hidden=true;
  const hint=$('suiVisibility');
  if(hint)hint.textContent=env.phone?'Menyiapkan HUD Phone Preview…':'HUD belum siap di Play Mode.';
  raf=requestAnimationFrame(refreshBoxes);
  return;
 }
 overlay.dataset.profile=profile;
 const outer=env.phone?env.frame.getBoundingClientRect():wrap;
 const x=outer.left-wrap.left,y=outer.top-wrap.top,width=outer.width,height=outer.height;
 const setArea=(el)=>{
  if(!el)return;
  el.style.inset='auto';el.style.left=x+'px';el.style.top=y+'px';
  el.style.width=width+'px';el.style.height=height+'px';
 };
 const cell=overlay.querySelector('.sui-grid-layer'),shield=overlay.querySelector('.sui-phone-shield');
 setArea(cell);setArea(shield);
 // Both the scaled phone preview AND a real mobile viewport need the
 // input shield, so taps cannot activate the underlying game while editing.
 if(shield)shield.hidden=profile!=='phone';
 cell.hidden=!grid.show;
 cell.style.backgroundSize=grid.size*(env.phone?env.scaleX:1)+'px '+
  grid.size*(env.phone?env.scaleY:1)+'px';
 const gx=overlay.querySelector('.sui-guide.x'),gy=overlay.querySelector('.sui-guide.y');
 if(gx){gx.style.left=x+width/2+'px';gx.style.top=y+'px';gx.style.height=height+'px';gx.style.bottom='auto';}
 if(gy){gy.style.top=y+height/2+'px';gy.style.left=x+'px';gy.style.width=width+'px';gy.style.right='auto';}
 const solo=onlySelected[profile];
 const toggle=$('suiSelectedOnly');if(toggle)toggle.checked=solo;
 const mode=$('suiDeviceHint');
 if(mode)mode.textContent=env.phone?
  'PHONE MODE · Tap elemen untuk pilih lalu drag. ◀ ▶ untuk yang bertumpuk.':
  'DESKTOP MODE · Geser elemen di layar game.';
 for(const node of overlay.querySelectorAll('.sui-outline')){
  const id=node.dataset.suiId;
  if(solo&&id!==selected){node.hidden=true;continue;}
  const g=geometry(id);
  node.hidden=!g;if(!g)continue;
  node.style.left=g.x+'px';node.style.top=g.y+'px';
  node.style.width=g.w+'px';node.style.height=g.h+'px';
  node.classList.toggle('selected',selected===id);
  node.classList.toggle('ghost',!!g.ghost);
  node.querySelector('.sui-resizer').hidden=selected!==id;
 }
 if(now-lastStamp>170){
  lastStamp=now;const g=geometry(selected);
  const field=$('suiVisibility');
  if(field)field.textContent=!g?'HUD masih loading. Coba pilih elemen di daftar.':
   g.ghost?'PLACEHOLDER · Elemen sedang tersembunyi, posisinya tetap bisa diatur.':
   ('VISIBLE · '+Math.round(g.logical.x)+', '+Math.round(g.logical.y)+
    ' · '+Math.round(g.logical.w)+' × '+Math.round(g.logical.h)+' px');
 }
 raf=requestAnimationFrame(refreshBoxes);
}
function updateControls(){
 const slot=currentSlot();if(!slot)return;
 $('suiElement').value=selected;
 $('suiAnchor').value=slot.anchor;
 $('suiX').value=slot.x;$('suiY').value=slot.y;
 $('suiScale').value=slot.scale;
 $('suiScaleLabel').textContent=Math.round(slot.scale*100)+'%';
 $('suiShowGrid').checked=grid.show;$('suiSnap').checked=grid.snap;
 $('suiGridSize').value=String(grid.size);
}
function syncPreview(){
 if(!active)return;
 // Parent game and the scaled phone iframe each need the SAME unsaved draft.
 root.SemestaPlay?.refreshHud?.();
 if(environment().phone)syncFramePreview();
 // The already-running animation loop refreshes the selection geometry.
}
function changeSlot(value){
 if(!active||!draft)return;
 const base=currentSlot(),next={...base,...value};
 draft[profile][selected]=HL.normalizeSlot(next,base);
 dirty=true;syncPreview();updateControls();
 status('UNSAVED · Preview aktif, klik SAVE GLOBAL UI untuk simpan.');
}
function relativeToSlot(before,id,x,y,w,h,stageW,stageH){
 // All coordinates passed here are measured in the target game viewport,
 // not the scaled parent rectangle of the phone iframe.
 const left=cap(x,0,Math.max(0,stageW-w)),top=cap(y,0,Math.max(0,stageH-h));
 const [v,u]=before.anchor.split('-');
 const ox=u==='right'?stageW-w-left:u==='center'?left-(stageW-w)/2:left;
 const oy=v==='bottom'?stageH-h-top:v==='center'?top-(stageH-h)/2:top;
 return {anchor:before.anchor,scale:before.scale,
  x:Math.round(cap(ox,-HL.OFFSET_LIMIT,HL.OFFSET_LIMIT)),
  y:Math.round(cap(oy,-HL.OFFSET_LIMIT,HL.OFFSET_LIMIT))};
}
function pickAt(clientX,clientY){
 const rect=$('canvas-wrap')?.getBoundingClientRect();
 if(!rect)return null;
 const x=clientX-rect.left,y=clientY-rect.top;
 const hits=[];
 for(const id of HL.ELEMENTS){
  const g=geometry(id);
  if(!g||g.ghost)continue;
  if(x>=g.x&&x<=g.x+g.w&&y>=g.y&&y<=g.y+g.h)
   hits.push({id,area:g.w*g.h});
 }
 // Prefer a small button over its enclosing panel/dock, not the first
 // SELECTORS entry. Overlapping items can still be cycled in the inspector.
 hits.sort((a,b)=>a.area-b.area||HL.ELEMENTS.indexOf(a.id)-HL.ELEMENTS.indexOf(b.id));
 return hits[0]?.id||null;
}
function pointerStart(ev,id){
 if(!active||drag||ev.button!==0||ev.isPrimary===false)return;
 const box=geometry(id);if(!box||!draft?.[profile]?.[id])return;
 ev.preventDefault();ev.stopPropagation();
 if(selected!==id){selected=id;updateControls();}
 const resizing=!!ev.target.closest('.sui-resizer');
 drag={id,pointerId:ev.pointerId,pointerType:ev.pointerType,
  mode:resizing?'resize':'move',startX:ev.clientX,startY:ev.clientY,
  g:{...box},slot:{...draft[profile][id]}};
 try{ev.currentTarget.setPointerCapture(ev.pointerId);}catch{}
}
function pointerMove(ev){
 if(!active||!drag||ev.pointerId!==drag.pointerId)return;
 const d=drag;
 const pixelX=ev.clientX-d.startX,pixelY=ev.clientY-d.startY;
 // A simple tap selects without marking the global layout as modified.
 if(Math.hypot(pixelX,pixelY)<(d.pointerType==='touch'?4:2))return;
 if(ev.cancelable)ev.preventDefault();
 const dx=pixelX/d.g.scaleX,dy=pixelY/d.g.scaleY;
 if(d.mode==='resize'){
  const factor=1+Math.max(dx/Math.max(d.g.logical.w,1),dy/Math.max(d.g.logical.h,1));
  changeSlot({scale:Math.round(cap(d.slot.scale*factor,.5,1.5)*100)/100});
 }else{
  const g=d.g.logical;
  const targetX=sn(g.x+dx),targetY=sn(g.y+dy);
  changeSlot(relativeToSlot(d.slot,d.id,targetX,targetY,g.w,g.h,g.stageW,g.stageH));
 }
}
function pointerEnd(ev){
 if(drag&&(!ev||ev.pointerId===drag.pointerId))drag=null;
}
function select(id){
 if(!HL.ELEMENTS.includes(id))return;
 selected=id;openPopupFor(id);updateControls();syncPreview();
}
function cycle(direction){
 const list=HL.ELEMENTS,i=list.indexOf(selected);
 select(list[(i+direction+list.length)%list.length]);
}
function center(axis){
 const before=currentSlot();
 if(!before)return;
 const [v,u]=before.anchor.split('-');
 const anchor=(axis==='y'||axis==='both'?'center':v)+'-'+
  (axis==='x'||axis==='both'?'center':u);
 const next={anchor,x:(axis==='x'||axis==='both')?0:before.x,
  y:(axis==='y'||axis==='both')?0:before.y};
 changeSlot(next);
}
function start(){
 if(active){select(selected);return true;}
 if(!root.SemestaPlay||!root.VLHudLayout)return false;
 // Enter Play Mode before enabling input capture, so the editor has real
 // geometry from the exact same HUD that is used during gameplay.
 if(!root.SemestaLifePlay?.active?.())$('walkMode')?.click();
 if(!root.SemestaLifePlay?.active?.()){
  status('Tidak bisa membuka Play Mode. Coba tombol 🎮 dahulu.');return false;
 }
 active=true;dirty=false;profile=environment().phone?'phone':HL.detectProfile(document);
 draft=HL.normalize(currentLayout());
 $('inspector').classList.add('sui-editing');
 $('inspector').classList.add('mobile-open');
 $('semestaUIEditorPane').hidden=false;
 $('layoutPane').hidden=true;$('logicPane').hidden=true;
 $('tabLayout').classList.remove('active');$('tabLogic').classList.remove('active');
 $('tabUIEditor').classList.add('active');
 ensureOverlay();overlay.hidden=false;
 select(selected);
 cancelAnimationFrame(raf);raf=requestAnimationFrame(refreshBoxes);
 status('EDIT UI AKTIF · Elemen HUD langsung di Semesta. Belum ada perubahan.');
 return true;
}
function stop(){
 if(!active)return;
 syncFramePreview(true);
 active=false;drag=null;
 cancelAnimationFrame(raf);raf=0;
 if(overlay)overlay.hidden=true;
 $('inspector').classList.remove('sui-editing');
 $('semestaUIEditorPane').hidden=true;
 $('tabUIEditor').classList.remove('active');
 if(!$('tabLayout').classList.contains('active')&&!$('tabLogic').classList.contains('active')){
  $('tabLayout').classList.add('active');$('layoutPane').hidden=false;
 }
 draft=null;dirty=false;
 // Discard only unsaved preview. Saved global HUD stays untouched.
 root.SemestaPlay?.refreshHud?.();
}
function save(){
 if(!active||!draft)return;
 const result=HL.saveGlobalLayout(draft,localStorage);
 if(!result?.ok){status('SAVE FAILED · '+(result?.reason||'Penyimpanan gagal'));return;}
 dirty=false;
 root.SemestaPlay?.refreshHud?.();
 try{root.VLHub?.publish('gameplay',{scope:'global-game-ui',at:result.at,source:'semesta'});}catch{}
 status('SAVED ✓ GLOBAL GAME UI · '+new Date(result.at).toLocaleTimeString('id-ID')+
  ' · Berlaku untuk semua map/kota.',true);
}
function reset(){
 if(!active)return;
 if(!confirm('Reset layout '+profile.toUpperCase()+' ke default? Perubahan baru disimpan setelah klik SAVE.'))return;
 draft[profile]=profile==='phone'?HL.phoneProfile():HL.desktopProfile();
 dirty=true;syncPreview();updateControls();status('RESET PREVIEW · Klik SAVE untuk menyimpan reset.');
}
function init(){
 const btn=$('tabUIEditor'),pane=$('semestaUIEditorPane');
 if(!btn||!pane)return;
 const list=$('suiElement'),anchors=$('suiAnchor');
 for(const id of HL.ELEMENTS){list.add(new Option(LABELS[id]||id,id));}
 for(const id of HL.ANCHORS)anchors.add(new Option(id,id));
 btn.addEventListener('click',start);
 $('tabLayout').addEventListener('click',stop);
 $('tabLogic').addEventListener('click',stop);
 $('suiCancel').addEventListener('click',stop);
 $('suiElement').addEventListener('change',e=>select(e.target.value));
 $('suiPrev').addEventListener('click',()=>cycle(-1));
 $('suiNext').addEventListener('click',()=>cycle(1));
 $('suiSelectedOnly').addEventListener('change',e=>{onlySelected[profile]=e.target.checked;});
 $('suiSave').addEventListener('click',save);
 $('suiReset').addEventListener('click',reset);
 $('suiCenterX').addEventListener('click',()=>center('x'));
 $('suiCenterY').addEventListener('click',()=>center('y'));
 $('suiCenterBoth').addEventListener('click',()=>center('both'));
 $('suiShowGrid').addEventListener('change',e=>{grid.show=e.target.checked;saveGrid();});
 $('suiSnap').addEventListener('change',e=>{grid.snap=e.target.checked;saveGrid();});
 $('suiGridSize').addEventListener('change',e=>{if(GRID_SIZES.includes(Number(e.target.value)))grid.size=Number(e.target.value);saveGrid();});
 $('suiAnchor').addEventListener('change',e=>changeSlot({anchor:e.target.value}));
 for(const [id,key] of [['suiX','x'],['suiY','y']]){
  $(id).addEventListener('change',e=>{
   if(valid(e.target.value))changeSlot({[key]:cap(Math.round(Number(e.target.value)),-HL.OFFSET_LIMIT,HL.OFFSET_LIMIT)});
  });
 }
 $('suiScale').addEventListener('input',e=>changeSlot({scale:Number(e.target.value)}));
 $('suiScale').addEventListener('change',e=>changeSlot({scale:Number(e.target.value)}));
 // Captured pointer events bubble to window even if the finger/mouse moves
 // beyond the canvas. Filter by pointerId so second touches never move HUD.
 window.addEventListener('pointermove',pointerMove,{passive:false});
 window.addEventListener('pointerup',pointerEnd);
 window.addEventListener('pointercancel',pointerEnd);
 $('suiDragOnScreen')?.addEventListener('click',()=>{
  // A native phone's inspector covers the bottom HUD (Action / Nokia).
  // Temporarily close the sheet; the canvas-toolbar Inspector opens it again.
  $('inspector')?.classList.remove('mobile-open');
 });
 window.addEventListener('keydown',e=>{if(active&&e.key==='Escape'){e.stopPropagation();stop();}});
 updateControlsIfLoaded();
}
function updateControlsIfLoaded(){if(active)updateControls();}
root.SemestaUIEditor=Object.freeze({start,stop,save,select,active:()=>active,
 // In deviceFrame this is an externally driven preview. The unsaved layout
 // is never stored in Jiwa or per-map city data.
 setExternalPreview:layout=>{externalDraft=layout?HL.normalize(layout):null;return true;},
 previewLayout:()=>active&&draft?HL.normalize(draft):
  externalDraft?HL.normalize(externalDraft):null,
 selected:()=>selected,profile:()=>profile,dirty:()=>dirty,
 frameGeometry:id=>geometry(id),onDeviceChanged:()=>{if(active)profileAndFrame();}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})(window);
