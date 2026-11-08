/* mainkan.exe — authoritative HUD layout editor. No Semesta authoring dependency. */
(function(root){
'use strict';
const HL=root.VLHudLayout,$=id=>document.getElementById(id);
if(!HL)return;
const LABELS={lifePanel:'Survival / Stats',money:'Saldo',hpButton:'HP',bagButton:'Bag',
 phone:'Nokia Window',bag:'Inventory Window',action:'ACTION',run:'RUN',
 needs:'Needs (legacy)',toast:'Notifications',dock:'Dock (legacy)'};
const PREVIEW={lifePanel:'ENERGY 80%\nHYGIENE 75%\nMORAL 50%',
 money:'Rp 6.000',hpButton:'▣ HP',bagButton:'▣ BAG',
 phone:'NOKIA\nPHONE WINDOW',bag:'BAG\nINVENTORY',action:'ACTION',run:'RUN',
 needs:'Hunger ███\nEnergy ███',toast:'Notification',dock:'HUD DOCK'};
const stage=$('hudStage'),select=$('uiElement'),status=$('uiStatus');
const gridSettings={show:true,snap:true,size:16};
let profile='desktop',selected='action',drag=null,dirty=false;
const original=HL.resolveSavedLayout(null,localStorage)?.layout||HL.defaults();
let draft=HL.normalize(original);
const nodes={};
const cap=(n,a,b)=>Math.max(a,Math.min(b,n));
const report=(msg,good=false)=>{status.textContent=msg;status.style.color=good?'#0f693d':'#594720';};
function slot(id=selected){return draft[profile][id];}
function rect(id){
 const el=nodes[id],s=slot(id),W=stage.clientWidth,H=stage.clientHeight;
 const w=el.offsetWidth*s.scale,h=el.offsetHeight*s.scale;
 const [v,u]=s.anchor.split('-');
 const x=u==='right'?W-w-s.x:u==='center'?(W-w)/2+s.x:s.x;
 const y=v==='bottom'?H-h-s.y:v==='center'?(H-h)/2+s.y:s.y;
 return {x:cap(x,0,Math.max(0,W-w)),y:cap(y,0,Math.max(0,H-h)),w,h,W,H};
}
function render(){
 stage.classList.toggle('phone',profile==='phone');
 const grid=$('grid');grid.hidden=!gridSettings.show;
 grid.style.backgroundSize=gridSettings.size+'px '+gridSettings.size+'px';
 $('uiProfile').value=profile;
 for(const id of HL.ELEMENTS){
  const el=nodes[id],s=slot(id),r=rect(id);
  el.style.left=r.x+'px';el.style.top=r.y+'px';
  el.style.transform='scale('+s.scale+')';
  el.classList.toggle('selected',id===selected);
  el.querySelector('.resize').hidden=id!==selected;
 }
 updateControls();
}
function updateControls(){
 const s=slot();
 select.value=selected;$('uiAnchor').value=s.anchor;
 $('uiX').value=Math.round(s.x);$('uiY').value=Math.round(s.y);
 $('uiScale').value=s.scale;$('uiScaleLabel').value=Math.round(s.scale*100)+'%';
 $('uiShowGrid').checked=gridSettings.show;$('uiSnap').checked=gridSettings.snap;
 $('uiGridSize').value=String(gridSettings.size);
 $('uiSelectedInfo').textContent=LABELS[selected]+' · '+profile.toUpperCase()+
  ' · Posisi '+Math.round(s.x)+', '+Math.round(s.y)+
  ' · Scale '+Math.round(s.scale*100)+'%';
}
function changed(values){
 draft[profile][selected]=HL.normalizeSlot({...slot(),...values},slot());
 dirty=true;render();report('UNSAVED · Simpan melalui SAVE GLOBAL UI.');
}
function selectItem(id){
 if(!HL.ELEMENTS.includes(id))return;
 selected=id;render();
}
function positionSlot(base,r,x,y){
 const [v,u]=base.anchor.split('-');
 const left=cap(x,0,Math.max(0,r.W-r.w)),top=cap(y,0,Math.max(0,r.H-r.h));
 return {x:Math.round(cap(u==='right'?r.W-r.w-left:u==='center'?left-(r.W-r.w)/2:left,-HL.OFFSET_LIMIT,HL.OFFSET_LIMIT)),
  y:Math.round(cap(v==='bottom'?r.H-r.h-top:v==='center'?top-(r.H-r.h)/2:top,-HL.OFFSET_LIMIT,HL.OFFSET_LIMIT))};
}
function down(e,id){
 if(e.button!==0||drag||e.isPrimary===false)return;
 selectItem(id);
 const r=rect(id);
 drag={id,pointerId:e.pointerId,x:e.clientX,y:e.clientY,rect:r,slot:{...slot()},
  resize:!!e.target.closest('.resize')};
 e.preventDefault();e.stopPropagation();
 try{nodes[id].setPointerCapture(e.pointerId);}catch{}
}
function move(e){
 if(!drag||e.pointerId!==drag.pointerId)return;
 const d=drag,dx=e.clientX-d.x,dy=e.clientY-d.y;
 if(Math.hypot(dx,dy)<2)return;
 if(e.cancelable)e.preventDefault();
 if(d.resize){
  const factor=1+Math.max(dx/Math.max(1,d.rect.w),dy/Math.max(1,d.rect.h));
  changed({scale:Math.round(cap(d.slot.scale*factor,.5,1.5)*100)/100});
 }else{
  const snap=n=>gridSettings.snap?Math.round(n/gridSettings.size)*gridSettings.size:n;
  const position=positionSlot(d.slot,d.rect,snap(d.rect.x+dx),snap(d.rect.y+dy));
  changed(position);
 }
}
function end(e){if(drag&&(!e||e.pointerId===drag.pointerId))drag=null;}
function center(axis){
 const s=slot(),[v,u]=s.anchor.split('-');
 changed({anchor:(axis==='y'||axis==='both'?'center':v)+'-'+(axis==='x'||axis==='both'?'center':u),
  x:axis==='x'||axis==='both'?0:s.x,
  y:axis==='y'||axis==='both'?0:s.y});
}
function save(){
 const result=HL.saveGlobalLayout(draft,localStorage);
 if(!result.ok){report('SAVE FAILED · '+result.reason);return false;}
 dirty=false;
 report('SAVED ✓ GLOBAL UI · '+new Date(result.at).toLocaleTimeString('id-ID')+
  ' · Mainkan dan seluruh kota memakai layout ini.',true);
 return true;
}
function resetProfile(){
 if(!confirm('Reset tampilan '+profile.toUpperCase()+' ke default? Belum tersimpan sebelum klik Save.'))return;
 draft[profile]=profile==='phone'?HL.phoneProfile():HL.desktopProfile();
 dirty=true;render();report('RESET PREVIEW · Klik Save untuk menerapkan.');
}
function discard(){
 draft=HL.normalize(HL.resolveSavedLayout(null,localStorage)?.layout||HL.defaults());
 dirty=false;render();report('Perubahan yang belum disimpan dibuang.');
}
function initialize(){
 for(const id of HL.ELEMENTS){
  const item=document.createElement('div');
  item.className='hud-chip';item.dataset.element=id;
  item.textContent=PREVIEW[id]||id;item.title='Drag '+LABELS[id]+' to reposition';
  const handle=document.createElement('span');handle.className='resize';
  handle.title='Drag to resize';handle.hidden=true;item.append(handle);
  stage.append(item);nodes[id]=item;
  item.addEventListener('pointerdown',e=>down(e,id));
  select.add(new Option(LABELS[id]||id,id));
 }
 for(const anchor of HL.ANCHORS)$('uiAnchor').add(new Option(anchor,anchor));
 $('uiProfile').addEventListener('change',e=>{profile=e.target.value==='phone'?'phone':'desktop';end();render();});
 select.addEventListener('change',e=>selectItem(e.target.value));
 $('uiAnchor').addEventListener('change',e=>changed({anchor:e.target.value}));
 for(const [id,key] of [['uiX','x'],['uiY','y']])
  $(id).addEventListener('change',e=>{const n=Number(e.target.value);if(Number.isFinite(n))changed({[key]:cap(n,-HL.OFFSET_LIMIT,HL.OFFSET_LIMIT)});});
 $('uiScale').addEventListener('input',e=>changed({scale:Number(e.target.value)}));
 $('uiSave').addEventListener('click',save);
 $('uiResetProfile').addEventListener('click',resetProfile);
 $('uiRevert').addEventListener('click',discard);
 $('uiCenterX').addEventListener('click',()=>center('x'));
 $('uiCenterY').addEventListener('click',()=>center('y'));
 $('uiCenterBoth').addEventListener('click',()=>center('both'));
 $('uiShowGrid').addEventListener('change',e=>{gridSettings.show=e.target.checked;render();});
 $('uiSnap').addEventListener('change',e=>{gridSettings.snap=e.target.checked;render();});
 $('uiGridSize').addEventListener('change',e=>{if([8,16,24,32,48].includes(Number(e.target.value)))gridSettings.size=Number(e.target.value);render();});
 root.addEventListener('pointermove',move,{passive:false});
 root.addEventListener('pointerup',end);root.addEventListener('pointercancel',end);
 root.addEventListener('resize',render);
 root.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(render).observe(stage);
 render();
}
root.MainkanUIEditor=Object.freeze({previewLayout:()=>HL.normalize(draft),save,
 select:selectItem,setDevice:p=>{profile=p==='phone'?'phone':'desktop';render();},
 dirty:()=>dirty,active:()=>true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});
else initialize();
})(window);