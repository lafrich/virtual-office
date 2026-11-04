/* Bangun Ruang UI controller: mobile-first inspector and interactive tile interior.
 * Non-destructive: edits only user-selected building asset JSON in browser.
 */
(function(g){
'use strict';
const $=id=>document.getElementById(id);
const model=g.VLBuildingInterior,adjust=g.VLInteractionAdjust,gizmo=g.VLActionGizmo;
if(!model)return;
const copy=model.clone;
const names={exterior:['tabExterior','exteriorPane'],interior:['tabInterior','interiorPane'],
 actions:['tabActions','actionPane'],metadata:['tabMetadata','metadataPane']};
const CELL=28;
const iso=g.VLInteriorIso;
function init(api){
 let enabled=false,scenes={},floor=1,selected=null,placing=null,
   preview='exterior',tab='exterior',interiorView='iso',lastIso=null,
   adjustmentDraft=null,adjustmentKey='',lastAdjusted=null,actionTapTarget=null,
   objectGizmoActive=false,objectDrag=null,undoStack=[];
 const canvas=$('interiorCanvas'),ctx=canvas.getContext('2d');
 ctx.imageSmoothingEnabled=false;
 const categories=[...new Set(Object.values(model.types).map(t=>t.category))];
 const group=$('interiorCategory'),asset=$('interiorAsset');
 const tray=$('interiorQuickBar'),trayContainer=$('interiorQuickTools');
 const tiles=new Map();
 const HISTORY_LIMIT=40;
 function snapshot(){return {scenes:copy(scenes),floor,selected,lastAdjusted:lastAdjusted?{...lastAdjusted}:null};}
 function recordUndo(before=snapshot()){
  undoStack.push(before);if(undoStack.length>HISTORY_LIMIT)undoStack.shift();
  updateUndoButton();
 }
 function updateUndoButton(){const b=$('actionUndo');if(b)b.disabled=!undoStack.length;}
 function undo(){
  if(!undoStack.length)return;
  api.getScaleController?.()?.endAdjustment?.();
  const state=undoStack.pop();
  scenes=copy(state.scenes);floor=state.floor;selected=state.selected;
  lastAdjusted=state.lastAdjusted;placing=null;objectDrag=null;
  objectGizmoActive=false;actionTapTarget=null;
  adjustmentKey='';adjustmentDraft=null;
  $('interiorFloor').value=String(floor);refresh();updateTray();updateUndoButton();
  onStatus('Undo · previous editor state restored');
 }
 function objectOrigin(item){
  if(!item)return null;
  if(interiorView==='iso'&&iso){
   const type=model.types[item.assetId],turn=item.rotation%180===90;
   const w=turn?type.d:type.w,d=turn?type.w:type.d;
   const [x,y]=iso.point(lastIso||iso.bounds(scene()),item.c+w/2,item.r+d/2,0);
   return {x,y:y-23};
  }
  const type=model.types[item.assetId],turn=item.rotation%180===90;
  return {x:(item.c+(turn?type.d:type.w)/2)*CELL,y:(item.r+(turn?type.w:type.d)/2)*CELL};
 }
 function drawObjectGizmo(){
  if(!objectGizmoActive||placing||!selected||!gizmo||preview!=='interior')return;
  const item=scene().items.find(x=>x.id===selected),p=objectOrigin(item);
  if(p)gizmo.draw(ctx,p,{mode:'move',hot:objectDrag?.handle||'',direction:'sw',baseDirection:'sw'});
 }
 function pointOnCanvas(e){
  const b=canvas.getBoundingClientRect();
  if(!b.width||!b.height)return null;
  return {x:(e.clientX-b.left)*canvas.width/b.width,y:(e.clientY-b.top)*canvas.height/b.height};
 }
 function beginObjectDrag(e){
  if(!objectGizmoActive||placing||!selected||!gizmo)return false;
  const p=pointOnCanvas(e),item=scene().items.find(x=>x.id===selected);
  const center=objectOrigin(item);
  if(!p||!center)return false;
  const handle=gizmo.hit(center,p);
  if(!handle)return false;
  objectDrag={id:e.pointerId,handle,start:p,center,base:{c:item.c,r:item.r,rotation:item.rotation},before:snapshot(),changed:false};
  canvas.setPointerCapture?.(e.pointerId);e.preventDefault();return true;
 }
 function dragObject(e){
  const d=objectDrag;if(!d||d.id!==e.pointerId)return;
  const p=pointOnCanvas(e);if(!p)return;
  const item=scene().items.find(x=>x.id===selected);if(!item)return;
  if(d.handle==='rotate'){
   const from=Math.atan2(d.start.y-d.center.y,d.start.x-d.center.x);
   const to=Math.atan2(p.y-d.center.y,p.x-d.center.x);
   const turns=Math.round((to-from)/(Math.PI/2));
   const delta=((turns+4)%4);
   const target=((d.base.rotation+delta*90)%360+360)%360;
   if(target!==item.rotation&&model.move(scene(),item.id,item.c,item.r,target))d.changed=true;
  }else{
   const dx=p.x-d.start.x,dy=p.y-d.start.y;
   // Inverse of the 2:1 isometric projection: X=32(C-R), Y=16(C+R).
   const dc=interiorView==='iso'?(dx/32+dy/16)/2:dx/CELL;
   const dr=interiorView==='iso'?(dy/16-dx/32)/2:dy/CELL;
   const c=d.base.c+Math.round(dc),r=d.base.r+Math.round(dr);
   if((d.handle!=='y'||c===d.base.c)&&(d.handle!=='x'||r===d.base.r)){
    if((c!==item.c||r!==item.r)&&model.move(scene(),item.id,c,r))d.changed=true;
   }
  }
  draw();e.preventDefault();
 }
 function endObjectDrag(e){
  if(!objectDrag||objectDrag.id!==e.pointerId)return;
  const d=objectDrag;objectDrag=null;
  try{canvas.releasePointerCapture?.(e.pointerId)}catch{}
  const item=scene().items.find(x=>x.id===selected);
  if(d.changed&&item&&(item.c!==d.base.c||item.r!==d.base.r||item.rotation!==d.base.rotation)){
   recordUndo(d.before);renderObjects();renderActions();
  }
  draw();e.preventDefault();
 }
 canvas.addEventListener('pointermove',dragObject);
 canvas.addEventListener('pointerup',endObjectDrag);
 canvas.addEventListener('pointercancel',endObjectDrag);

 for(const key of categories){const option=document.createElement('option');option.value=key;option.textContent=key;group.append(option);}
 for(const [key,t] of Object.entries(model.templates)){const o=document.createElement('option');o.value=key;o.textContent=t.label;$('interiorTemplate').append(o);}
 function cfg(){return api.getConfig();}
 function numFloors(){return Math.max(1,Math.min(12,Number(cfg().floors)||1));}
 function onStatus(message){api.status(message);}
 function normalizeScene(n){
  const raw=scenes[n];
  scenes[n]=model.normalize(raw,cfg());
  scenes[n].floor=n;
  return scenes[n];
 }
 function scene(){return normalizeScene(floor);}
 function selectFloor(n){
  floor=Math.max(1,Math.min(numFloors(),Math.round(Number(n)||1)));
  $('interiorFloor').value=String(floor);selected=null;placing=null;refresh();
 }
 function fillFloors(){
  const count=numFloors(),control=$('interiorFloor'),previous=String(floor);
  control.replaceChildren();
  for(let n=1;n<=count;n++){const o=document.createElement('option');o.value=String(n);o.textContent=n===1?'Ground Floor / 1':'Floor '+n;control.append(o);}
  if(floor>count)floor=count;
  control.value=String(floor);
 }
 function updateCategories(){
  asset.replaceChildren();
  const matches=Object.entries(model.types).filter(([key,t])=>t.category===group.value);
  for(const [key,t] of matches){const o=document.createElement('option');o.value=key;o.textContent=t.glyph+' '+t.label;asset.append(o);}
  if(placing&&model.types[placing]?.category!==group.value)placing=null;
  updateTray();
 }
 function armPlacement(type){
  if(!enabled||!model.types[type])return;
  // Placement takes priority over the action actor overlay.
  // Otherwise its pointer layer swallows taps intended for a new fixture.
  api.getScaleController?.()?.endAdjustment?.();
  objectGizmoActive=false;objectDrag=null;
  actionTapTarget=null;
  placing=placing===type?null:type;selected=null;
  if(placing){
   group.value=model.types[placing].category;
   // Keep classic inspector dropdown compatible with the quick picker.
   asset.replaceChildren();
   for(const [key,t] of Object.entries(model.types).filter(([key,t])=>t.category===group.value)){
    const opt=document.createElement('option');opt.value=key;opt.textContent=t.label;asset.append(opt);
   }
   asset.value=placing;
  }
  setPreview('interior');draw();renderObjects();updateTray();updateRotateBar();
  onStatus(placing?'Tap floor to place '+model.types[placing].label:'Placement cancelled');
 }
 function updateTray(){
  for(const [key,button] of tiles){button.classList.toggle('active',key===placing);button.setAttribute('aria-pressed',String(key===placing));}
  $('quickCancel').hidden=!placing;
  $('quickPlaceHint').textContent=placing?'PLACE '+model.types[placing].label.toUpperCase()+' · TAP FLOOR':'Tap asset → tap floor';
 }
 function buildTray(){
  tray.replaceChildren();tiles.clear();
  for(const [key,def] of Object.entries(model.types)){
   const button=document.createElement('button');button.type='button';
   button.className='interior-quick-card';button.dataset.interiorAsset=key;
   button.setAttribute('aria-label','Place '+def.label);
   button.setAttribute('aria-pressed','false');
   const thumb=document.createElement('canvas');
   thumb.className='quick-asset-thumb';thumb.width=48;thumb.height=48;
   const tctx=thumb.getContext('2d');tctx.imageSmoothingEnabled=false;
   if(g.VLInteriorPixels)g.VLInteriorPixels.draw(tctx,key,2,2,44,44);
   const title=document.createElement('span');title.textContent=def.label;
   button.append(thumb,title);button.onclick=()=>armPlacement(key);
   tray.append(button);tiles.set(key,button);
  }
  updateTray();
 }
 function syncToolRail(){
  for(const [id,active] of [
   ['toolExterior',preview==='exterior'],
   ['toolInterior',preview==='interior'],
   ['toolIso',preview==='interior'&&interiorView==='iso'],
   ['toolPlan',preview==='interior'&&interiorView==='plan']
  ]){
   const button=$(id);if(!button)continue;
   button.classList.toggle('active',active);
   button.setAttribute('aria-pressed',String(active));
   button.disabled=id!=='toolExterior'&&!enabled;
  }
 }
 function updateRotateBar(){
  syncToolRail();
  const item=enabled&&preview==='interior'&&!placing?
   scene().items.find(x=>x.id===selected):null;
  const bar=$('interiorRotateBar');
  bar.hidden=!item;
  $('toolRotateLeft').disabled=!item;
  $('toolRotateRight').disabled=!item;
  if(!item)return;
  const facing=['↙ SW','↘ SE','↗ NE','↖ NW'][((item.rotation||0)/90)%4];
  $('rotateSelection').textContent=(model.types[item.assetId]?.glyph||'□')+' '+item.name;
  $('rotateHint').textContent=facing+' · '+(item.rotation||0)+'° · R shortcut';
 }
 function rotateSelected(steps){
  if(!enabled||preview!=='interior'||placing||!selected)return false;
  const current=scene(),item=current.items.find(x=>x.id===selected);
  if(!item)return false;
  const before=snapshot();
  if(!model.rotate(current,item.id,steps)){
   onStatus('Cannot rotate '+item.name+' here · blocked by another object or doorway');
   return false;
  }
  recordUndo(before);renderObjects();renderActions();draw();updateRotateBar();
  onStatus('Rotated '+item.name+' to '+item.rotation+'° · Save Asset to keep changes');
  return true;
 }
 function setPreview(value){
  if(value==='interior'&&!enabled)return;
  preview=value;
  $('preview').hidden=value!=='exterior';canvas.hidden=value!=='interior';
  $('interiorViewTools').hidden=value!=='interior';
  trayContainer.hidden=value!=='interior';
  api.showExterior?.(value==='exterior');
  document.querySelector('.direction-bar').hidden=value==='interior';
  $('showExterior').classList.toggle('active',value==='exterior');
  $('showInterior').classList.toggle('active',value==='interior');
  if(value==='interior')draw();
  updateRotateBar();
 }
 function selectTab(which){
  if(!names[which]||(which==='interior'||which==='actions')&&!enabled)return;
  if(tab!==which)actionTapTarget=null;
  tab=which;
  for(const [key,[button,pane]] of Object.entries(names)){
   const active=key===which;$(button).classList.toggle('active',active);
   $(button).setAttribute('aria-selected',String(active));$(pane).hidden=!active;
  }
  if(which==='interior')setPreview('interior');
  if(which==='exterior')setPreview('exterior');
  if(which==='actions'){renderActions();if(enabled)setPreview('interior');}
  if(which==='metadata')renderMetadata();
 }
 function setMode(active){
  enabled=!!active;
  $('buildingMode').value=enabled?'interactive':'decorative';
  $('buildingModeHint').textContent=enabled?
   'Enterable: doorway opens an interior floor plan with interactive props and character action slots.':
   'Non-interactive: exterior and collision only; no enter action or interior.';
  $('showInterior').disabled=!enabled;
  $('tabInterior').disabled=!enabled;$('tabActions').disabled=!enabled;
  $('actions').closest('label').hidden=!enabled;
  if(!enabled){placing=null;selected=null;selectTab('exterior');setPreview('exterior');}
  if(enabled){normalizeScene(floor);draw();renderObjects();renderActions();}
  updateTray();
  updateRotateBar();
  renderMetadata();
 }
 function setInteriorView(mode){
  interiorView=mode==='plan'||!iso?'plan':'iso';
  $('interiorViewIso').classList.toggle('active',interiorView==='iso');
  $('interiorViewPlan').classList.toggle('active',interiorView==='plan');
  $('interiorViewIso').setAttribute('aria-pressed',String(interiorView==='iso'));
  $('interiorViewPlan').setAttribute('aria-pressed',String(interiorView==='plan'));
  draw();
  syncToolRail();
 }
 function draw(){
  if(!enabled||preview!=='interior')return;
  if(interiorView==='iso'&&iso){
   lastIso=iso.draw(canvas,scene(),{selectedId:selected,grid:true});
   drawObjectGizmo();
   g.VLBuildingPreviewScale?.interior([canvas.width,canvas.height],'iso');
   $('placementHint').textContent=placing?
    'Tap an empty diamond tile to place '+(model.types[placing]?.label||placing)+'. Door tile stays clear.':
    selected?'Tap furniture to edit, or tap an empty diamond to move it. Switch to Plan for precise placement.':
    'Isometric 2:1 · tap furniture to edit its action, or choose Plan to arrange tiles.';
   return;
  }
  lastIso=null;drawPlan();
 }
 function drawPlan(){
  if(!enabled||preview!=='interior')return;
  const s=scene(),width=s.width*CELL,height=s.depth*CELL;
  if(canvas.width!==width)canvas.width=width;
  if(canvas.height!==height)canvas.height=height;
  ctx.imageSmoothingEnabled=false;
  const theme=({'warm':'#e1d3bc','aqua':'#b9dfe5','blue':'#bdd1e6','cream':'#e9e2d2'})[s.theme]||'#e6e2d5';
  ctx.fillStyle=theme;ctx.fillRect(0,0,width,height);
  ctx.strokeStyle='#adb6ad';ctx.lineWidth=1;
  for(let c=0;c<=s.width;c++){ctx.beginPath();ctx.moveTo(c*CELL+.5,0);ctx.lineTo(c*CELL+.5,height);ctx.stroke();}
  for(let r=0;r<=s.depth;r++){ctx.beginPath();ctx.moveTo(0,r*CELL+.5);ctx.lineTo(width,r*CELL+.5);ctx.stroke();}
  ctx.fillStyle='#157a52';
  ctx.fillRect(s.entrance.c*CELL+3,s.entrance.r*CELL+CELL-8,CELL-6,6);
  ctx.fillStyle='#ffffff';ctx.font='bold 9px monospace';ctx.textAlign='center';
  ctx.fillText('DOOR',s.entrance.c*CELL+CELL/2,s.entrance.r*CELL+10);
  const colors={Bathroom:'#92bfd6',Bedroom:'#e1aa8a',Living:'#9dacdb',Work:'#b7a8d6',Kitchen:'#e7c48c',Shop:'#a2c5ac'};
  for(const item of s.items){
   const def=model.types[item.assetId];if(!def)continue;
   let w=def.w,d=def.d;if(item.rotation%180===90)[w,d]=[d,w];
   const x=item.c*CELL,y=item.r*CELL;
   ctx.fillStyle=item.id===selected?'#2459b9':'#6b8193';
   ctx.fillRect(x+1,y+1,w*CELL-2,d*CELL-2);
   ctx.fillStyle=colors[def.category]||'#c7ccd3';
   ctx.fillRect(x+3,y+3,w*CELL-6,d*CELL-6);
   if(g.VLInteriorPixels)g.VLInteriorPixels.draw(ctx,item.assetId,x+3,y+3,w*CELL-6,d*CELL-6);
   else{ctx.fillStyle='#263e54';ctx.textAlign='center';ctx.font='14px monospace';ctx.fillText(def.label.slice(0,2),x+w*CELL/2,y+d*CELL/2+5);}
   // Direction chip stays visible for square props (WC, bed and chairs),
   // whose footprint does not change when rotated in Plan / Edit mode.
   const arrow=['↓','→','↑','←'][((Number(item.rotation)||0)/90)%4]||'↓';
   const ax=x+w*CELL-14,ay=y+3;
   ctx.fillStyle='#17459c';ctx.fillRect(ax,ay,11,13);
   ctx.fillStyle='#fff';ctx.font='bold 11px monospace';ctx.textAlign='center';
   ctx.fillText(arrow,ax+5.5,ay+10);
   if(item.id===selected){
    ctx.strokeStyle='#f7e48f';ctx.lineWidth=2;
    ctx.strokeRect(x+2,y+2,w*CELL-4,d*CELL-4);ctx.lineWidth=1;
   }
  }
  drawObjectGizmo();
  g.VLBuildingPreviewScale?.interior([canvas.width,canvas.height],'plan');
  $('placementHint').textContent=placing?
   'Tap an empty tile to place '+(model.types[placing]?.label||placing)+'. Entrance is kept clear.':
   selected?'Tap a free tile to move the selected object. Tap another object to select it.':
   'Tap an interior object to edit its trigger, animation and position.';
 }
 function hitItem(c,r){
  return [...scene().items].reverse().find(item=>model.occupied(item).includes(c+','+r));
 }
 function renderObjects(){
  const holder=$('interiorItemList');holder.replaceChildren();
  const items=scene().items;
  if(!items.length){const p=document.createElement('div');p.className='interior-empty';
    p.textContent='No furniture yet. Pick an asset above, tap “Place On Grid”, then tap the floor plan.';holder.append(p);}
  for(const item of items){
   const info=model.types[item.assetId],button=document.createElement('button');
   button.type='button';button.classList.toggle('active',item.id===selected);
   const a=document.createElement('span'),b=document.createElement('strong'),small=document.createElement('small');
   b.textContent=(info?.glyph||'□')+' '+item.name;
   small.textContent='Tile '+item.c+','+item.r+' · '+model.actions[item.actionId]?.label;
   a.append(b,small);const edit=document.createElement('span');edit.textContent=item.id===selected?'●':'Edit';
   button.append(a,edit);
   button.onclick=()=>{selected=item.id;placing=null;showItem();setPreview('interior');draw();renderObjects();renderActions();};
   holder.append(button);
  }
  showItem();
 }
 function showItem(){
  const item=scene().items.find(x=>x.id===selected);
  $('interiorItemEditor').hidden=!item;
  updateRotateBar();
  if(!item)return;
  $('interiorItemName').textContent=(model.types[item.assetId]?.glyph||'□')+' '+item.name;
  $('interiorItemC').value=item.c;$('interiorItemR').value=item.r;
  $('interiorItemFacing').value=String(item.rotation);$('interiorCapacity').value=String(item.capacity);
  $('interiorItemRadius').value=String(item.triggerRadius);
  const choices=$('interiorItemAction');choices.replaceChildren();
  for(const name of model.types[item.assetId].actions){
   const opt=document.createElement('option');opt.value=name;opt.textContent=model.actions[name].label;
   choices.append(opt);
  }
  choices.value=item.actionId;
  $('interiorActorHint').textContent=model.actions[item.actionId]?.description||'Proposed action';
 }
 function renderActions(){
  const summary=$('actionBuildingSummary');
  if(!enabled){summary.textContent='Decorative building: no interior entrance and no interactive actions.';return;}
  const count=Object.values(scenes).reduce((sum,s)=>sum+(s.items?.length||0),0);
  summary.textContent='ENTERABLE / Door facing '+String(cfg().front||'sw').toUpperCase()+
   ' / '+numFloors()+' floor(s) / '+count+' action objects. Entry is a proposed map trigger; online game integration pending.';
  const list=$('actionSlotList');list.replaceChildren();
  let any=false;
  for(let n=1;n<=numFloors();n++){
   const s=scenes[n];if(!s)continue;
   for(const item of s.items){any=true;
    const row=document.createElement('div');row.className='action-row';
    const glyph=document.createElement('span');glyph.className='glyph';glyph.textContent=model.types[item.assetId]?.glyph||'▣';
    const text=document.createElement('div');const label=document.createElement('strong');
    label.textContent='F'+n+' · '+item.name+' → '+(model.actions[item.actionId]?.label||item.actionId);
    const desc=document.createElement('div');desc.className='actor-action';
    const shared=adjust?.getDefault(item.assetId,item.actionId);
    const instance=item.actionAdjustments?.[item.actionId];
    const placement=shared|| (instance?adjust.normalize(instance):null);
    desc.textContent=(item.pose?'Mahluk Hidup pose: '+item.pose:'Action hook only · no dedicated character rig')+
      (placement?' · ✓ '+(shared?'TYPE DEFAULT':'LEGACY POSITION')+' ('+placement.x+', '+placement.y+
       ', '+(placement.direction==='auto'?'AUTO':placement.direction.toUpperCase())+')':' · default placement');
    const edit=document.createElement('button');edit.type='button';
    edit.textContent='✥ Adjust';
    edit.onclick=()=>{
      if(n!==floor)selectFloor(n);
      selected=item.id;placing=null;renderObjects();renderActions();openSelectedAdjustment();
    };
    text.append(label,desc);row.append(glyph,text,edit);list.append(row);
   }
  }
  if(!any){const msg=document.createElement('p');msg.className='interior-empty';msg.textContent='No action spots. Place WC, bed, chair or other props in Interior.';list.append(msg);}
  showAdjustment();
 }
 function adjustmentItem(){return enabled?scene().items.find(item=>item.id===selected)||null:null;}
 function adjustmentId(item){return item?floor+':'+item.id+':'+item.actionId:'';}
 function fillAdjustment(){
  if(!adjustmentDraft)return;
  $('actionAdjustX').value=String(adjustmentDraft.x);
  $('actionAdjustY').value=String(adjustmentDraft.y);
  $('actionAdjustDirection').value=adjustmentDraft.direction;
  $('actionAdjustLayer').value=adjustmentDraft.layer;
  const item=adjustmentItem();
  const base=item?g.VLInteriorIso?.actionAnchor?.(item,{raw:true,generic:true})?.direction:'sw';
  const facing=gizmo?.facing(adjustmentDraft.direction,base)||'sw';
  const degrees=gizmo?.degrees(adjustmentDraft.direction,base)||0;
  $('actionTurnValue').textContent=degrees+'° / '+facing.toUpperCase()+
   (adjustmentDraft.direction==='auto'?' (AUTO)':'');
  $('actionAdjustStatus').textContent='X '+adjustmentDraft.x+'px, Y '+adjustmentDraft.y+
   'px / Facing '+adjustmentDraft.direction.toUpperCase()+' / '+adjustmentDraft.layer.toUpperCase()+
   ' · Save as default for ALL '+(model.types[item?.assetId]?.label||'similar objects')+
   ' using '+(model.actions[item?.actionId]?.label||'this action');
 }
 function showAdjustment(){
  const item=adjustmentItem(),panel=$('actionAdjustmentEditor');panel.hidden=!item;
  if(!item){adjustmentKey='';adjustmentDraft=null;return;}
  $('actionAdjustObject').textContent=(model.types[item.assetId]?.glyph||'▣')+' '+item.name+
   ' · '+(model.types[item.assetId]?.label||item.assetId)+
   ' / '+(model.actions[item.actionId]?.label||item.actionId)+' · TYPE DEFAULT';
  const selector=$('actionAdjustAction');selector.replaceChildren();
  for(const id of model.types[item.assetId].actions){
   const opt=document.createElement('option');opt.value=id;opt.textContent=model.actions[id]?.label||id;
   selector.append(opt);
  }
  selector.value=item.actionId;
  if(adjustmentKey!==adjustmentId(item)||!adjustmentDraft){
   adjustmentKey=adjustmentId(item);
   adjustmentDraft=adjust?.get(item,item.actionId)||{x:0,y:0,direction:'auto',layer:'behind'};
  }
  fillAdjustment();
 }
 function setTransformMode(mode){
  const effective=['select','move','rotate'].includes(mode)?mode:'move';
  for(const [id,isActive] of [['actionModeSelect',effective==='select'],
     ['actionModeMove',effective==='move'],['actionModeRotate',effective==='rotate']]){
   $(id)?.classList.toggle('active',isActive);
   $(id)?.setAttribute('aria-pressed',String(isActive));
  }
  api.getScaleController?.()?.setTransformMode?.(effective);
 }
 function setActionZoom(value,clientX,clientY){
  const stage=$('previewStage'),box=stage.getBoundingClientRect();
  const oldZoom=g.VLBuildingPreviewScale?.actionZoom||1;
  const x=Number.isFinite(clientX)?clientX-box.left:box.width/2;
  const y=Number.isFinite(clientY)?clientY-box.top:box.height/2;
  const beforeX=stage.scrollLeft+x,beforeY=stage.scrollTop+y;
  const zoom=g.VLBuildingPreviewScale?.setActionZoom?.(value)||1;
  stage.classList.toggle('action-adjust-viewport',zoom!==1);
  // Keep the point under the touchpad cursor in place while zooming.
  const ratio=zoom/oldZoom;
  stage.scrollLeft=beforeX*ratio-x;
  stage.scrollTop=beforeY*ratio-y;
  api.getScaleController?.()?.sync?.();
 }
 api.onTransformModeChange=mode=>setTransformMode(mode);
 function previewAdjustment(){
  const item=adjustmentItem();
  if(!item)return onStatus('Select a furniture item to adjust its action');
  setPreview('interior');setInteriorView('iso');showAdjustment();
  const controller=api.getScaleController?.();
  controller?.setTransformSnap?.($('actionTransformSnap').value);
  controller?.beginAdjustment?.(adjustmentDraft);
  $('previewStage').classList.add('action-adjust-viewport');
  setTransformMode('move');
  $('actionAdjustStatus').textContent='Drag X / Y / center to move or the ring to rotate. Tap another object to change target.';
 }
 function changeAdjustment(next){
  const item=adjustmentItem();if(!item||!adjust)return;
  if(adjustmentKey!==adjustmentId(item))showAdjustment();
  adjustmentDraft=adjust.normalize({...adjustmentDraft,...next});
  fillAdjustment();
  const scale=api.getScaleController?.();
  if(scale?.isAdjusting?.(item.id,item.actionId))scale.previewAdjustment(adjustmentDraft);
  else previewAdjustment();
 }
 function openSelectedAdjustment({scroll=true}={}){
  if(!adjustmentItem()){onStatus('Select an interior object first');return;}
  // A new adjustment session must load the SAVED preset, not a stale draft.
  adjustmentKey='';adjustmentDraft=null;
  selectTab('actions');showAdjustment();previewAdjustment();
  if(scroll)$('actionAdjustmentEditor').scrollIntoView?.({block:'nearest',behavior:'smooth'});
 }
 // In the Actions tab: first tap selects a fixture, second tap opens its gizmo.
 // Another fixture always becomes the new target, never moves the old fixture.
 function tapActionObject(event){
  if(!enabled||tab!=='actions'||placing||preview!=='interior')return false;
  const target=iso?.pointer?.(canvas,event,lastIso,{preferFloor:false});
  const id=target?.itemId||null,controller=api.getScaleController?.();
  if(!id){
   objectGizmoActive=false;actionTapTarget=null;
   controller?.setTransformMode?.('select');
   return true;
  }
  const same=id===actionTapTarget&&id===selected;
  if(!same){
   objectGizmoActive=false;
   actionTapTarget=id;
   if(controller?.actor?.adjusting)controller.endAdjustment();
   selected=id;adjustmentKey='';adjustmentDraft=null;
   renderObjects();renderActions();draw();
   onStatus('Selected '+(scene().items.find(x=>x.id===id)?.name||'object')+' · tap again to adjust');
  }else if(!controller?.isAdjusting?.(id,adjustmentItem()?.actionId)){
   openSelectedAdjustment({scroll:false});
  }else if(controller?.actor?.transformMode==='select'){
   controller.setTransformMode('move');
  }
  return true;
 }
 api.onActionCanvasTap=tapActionObject;
 function resumeSavedAdjustment(){
  if(!enabled||!lastAdjusted)return false;
  const n=Math.max(1,Math.min(numFloors(),Number(lastAdjusted.floor)||1));
  const room=scenes[n],item=room?.items?.find(x=>x.id===lastAdjusted.itemId);
  if(!item||!model.types[item.assetId]?.actions.includes(lastAdjusted.actionId))return false;
  floor=n;fillFloors();$('interiorFloor').value=String(n);
  selected=item.id;placing=null;
  model.action(scene(),item.id,lastAdjusted.actionId);
  renderObjects();renderActions();openSelectedAdjustment();
  return true;
 }
 function renderMetadata(){
  const c=cfg(),total=enabled?Object.values(scenes).reduce((sum,s)=>sum+(s.items?.length||0),0):0;
  $('metadataPreview').textContent=JSON.stringify({
   source:c.baseId,footprint:[c.w,c.d],projection:'iso-2:1',tilePixels:[64,32],
   directions:['sw','se','ne','nw'],mode:enabled?'interactive':'decorative',
   enterable:enabled,entranceFacing:enabled?c.front:null,
   interiorFloorCount:enabled?numFloors():0,actionObjects:total,storage:'local browser / Semesta same origin'
  },null,2);
 }
 function serialize(){
  const c=cfg();if(!enabled)return {interactive:false,enterable:false,entrance:null,interior:null,actionSlots:[],interactions:[]};
  const floors=[],slots=[];
  for(let n=1;n<=numFloors();n++){
   const s=normalizeScene(n);floors.push(copy(s));
   for(const item of model.slots(s))slots.push({...item,floor:n});
  }
  return {interactive:true,enterable:true,
   entrance:{facing:c.front,groundFloor:1,entry:{...floors[0].entrance},exit:{...floors[0].entrance}},
   interior:{format:'virtual-life-interiors-v1',version:1,activeFloor:floor,floors},
   actionSlots:slots,
   lastAdjusted:lastAdjusted?{...lastAdjusted}:null,
   interactions:[...new Set(['enter',...slots.map(slot=>slot.interaction)])]};
 }
 function load(pack){
  undoStack=[];objectGizmoActive=false;updateUndoButton();
  const c=cfg();scenes={};floor=1;selected=null;placing=null;
  adjustmentKey='';adjustmentDraft=null;actionTapTarget=null;
  const last=pack?.lastAdjusted;
  lastAdjusted=last&&typeof last.itemId==='string'&&typeof last.actionId==='string'?
   {floor:Number(last.floor)||1,itemId:last.itemId,actionId:last.actionId}:null;
  const interior=pack?.interior;
  if(interior?.format==='virtual-life-interiors-v1'&&Array.isArray(interior.floors)){
   for(const s of interior.floors.slice(0,12)){
    const n=Math.max(1,Math.min(numFloors(),Number(s.floor)||1));
    scenes[n]=model.normalize(s,c);scenes[n].floor=n;
   }
   floor=Math.max(1,Math.min(numFloors(),Number(interior.activeFloor)||1));
  }
  fillFloors();setMode(pack?.interactive===true||c.interactive===true);
  setPreview('exterior');selectTab('exterior');refresh();
 }
 function reset(){
  undoStack=[];objectGizmoActive=false;updateUndoButton();
  scenes={};floor=1;selected=null;placing=null;
  adjustmentKey='';adjustmentDraft=null;lastAdjusted=null;fillFloors();
  setMode(false);setPreview('exterior');selectTab('exterior');refresh();
 }
 function refresh(){
  fillFloors();if(enabled)normalizeScene(floor);
  if(preview==='interior'&&enabled)draw();
  if(enabled)renderObjects();
  else updateRotateBar();
  renderActions();renderMetadata();
 }
 function moveSelectedTo(c,r){
  const s=scene();
  if(placing){
   const before=snapshot();
   const obj=model.add(s,placing,c,r);
   if(obj){recordUndo(before);selected=obj.id;placing=null;renderObjects();renderActions();draw();updateTray();onStatus('Placed '+obj.name+' · action '+obj.actionId);}
   else onStatus('Invalid tile: collides or blocks entrance');
   return;
  }
  const hit=hitItem(c,r);
  if(hit){
   const same=selected===hit.id;
   selected=hit.id;objectGizmoActive=same?!objectGizmoActive:false;
   renderObjects();renderActions();draw();return;
  }
  if(selected){
   const before=snapshot();
   if(model.move(s,selected,c,r,undefined)){recordUndo(before);renderObjects();draw();onStatus('Moved interior prop to '+c+','+r);}
   else onStatus('Cannot move: occupied or outside floor plan');
  }
 }
 canvas.addEventListener('pointerdown',e=>{
  if(!enabled||preview!=='interior')return;
  const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
  let c,z,hit=null;
  if(interiorView==='iso'&&iso){
   hit=iso.pointer(canvas,e,lastIso,{preferFloor:!!placing});
   if(!hit)return;
   ({c,r:z}=hit);
  }else{
   c=Math.floor((e.clientX-r.left)*canvas.width/r.width/CELL);
   z=Math.floor((e.clientY-r.top)*canvas.height/r.height/CELL);
  }
  if(objectGizmoActive&&beginObjectDrag(e))return;
  if(c<0||z<0||c>=scene().width||z>=scene().depth)return;
  e.preventDefault();
  if(tab==='actions'&&!placing){tapActionObject(e);return;}
  if(api.onFloorClick?.(c,z,hit)===true)return;
  if(hit?.itemId&&!placing){
   selected=hit.itemId;renderObjects();renderActions();draw();return;
  }
  moveSelectedTo(c,z);
 });
 for(const [key,[button]] of Object.entries(names))$(button).onclick=()=>selectTab(key);
 $('showExterior').onclick=()=>setPreview('exterior');
 $('showInterior').onclick=()=>{setPreview('interior');selectTab('interior');};
 $('interiorViewIso').onclick=()=>setInteriorView('iso');
 $('interiorViewPlan').onclick=()=>setInteriorView('plan');
 $('buildingMode').onchange=()=>{setMode($('buildingMode').value==='interactive');onStatus(enabled?'Interactive: floor editor enabled':'Decorative building: interior disabled');};
 $('interiorFloor').onchange=()=>selectFloor($('interiorFloor').value);
 group.onchange=updateCategories;updateCategories();
 $('applyInteriorTemplate').onclick=()=>{
  const current=scene(),template=$('interiorTemplate').value;
  if(current.items.length&&!confirm('Replace this floor\'s furniture with '+model.templates[template].label+' template?'))return;
  const next=model.preset(cfg(),template);next.floor=floor;scenes[floor]=next;
  selected=null;placing=null;refresh();setPreview('interior');onStatus('Floor '+floor+' template: '+model.templates[template].label);
 };
 $('clearInteriorRoom').onclick=()=>{
  if(scene().items.length&&!confirm('Remove all furniture on this floor?'))return;
  scenes[floor]=model.create(cfg());scenes[floor].floor=floor;selected=null;placing=null;refresh();
 };
 $('addInteriorItem').onclick=()=>armPlacement(asset.value);
 $('cancelInteriorPlacement').onclick=()=>{placing=null;draw();updateTray();updateRotateBar();};
 $('quickCancel').onclick=()=>{placing=null;draw();updateTray();updateRotateBar();};
 $('rotateLeft').onclick=()=>rotateSelected(-1);
 $('rotateRight').onclick=()=>rotateSelected(1);
 $('toolExterior').onclick=()=>selectTab('exterior');
 $('toolInterior').onclick=()=>selectTab('interior');
 $('toolIso').onclick=()=>{selectTab('interior');setInteriorView('iso');};
 $('toolPlan').onclick=()=>{selectTab('interior');setInteriorView('plan');};
 $('toolRotateLeft').onclick=()=>rotateSelected(-1);
 $('toolRotateRight').onclick=()=>rotateSelected(1);
 // E / R switch ACTOR gizmo, arrow keys nudge. Furniture-R still
 // rotates the object when actor adjustment is not active.
 document.addEventListener('keydown',e=>{
  if(!enabled||preview!=='interior'||e.repeat||e.altKey||e.metaKey)return;
  const focus=document.activeElement;
  if(focus&&(['INPUT','TEXTAREA','SELECT'].includes(focus.tagName)||
    focus.isContentEditable))return;
  const key=String(e.key).toLowerCase();
  if((e.ctrlKey||e.metaKey)&&key==='z'){
   e.preventDefault();undo();return;
  }
  if(e.ctrlKey||e.metaKey||placing||!selected)return;
  const ctl=api.getScaleController?.(),item=adjustmentItem();
  const active=!!item&&ctl?.isAdjusting?.(item.id,item.actionId);
  if(active){
   if(key==='escape'||key==='q'){
    e.preventDefault();setTransformMode('select');return;
   }
   if(key==='e'||key==='r'){
    e.preventDefault();setTransformMode(key==='r'?'rotate':'move');return;
   }
   const steps={arrowleft:[-1,0],arrowright:[1,0],
    arrowup:[0,-1],arrowdown:[0,1]};
   if(steps[key]){
    e.preventDefault();
    const grid=Number($('actionTransformSnap').value)||1;
    const pace=e.shiftKey?Math.max(grid,8):grid;
    changeAdjustment({x:(adjustmentDraft?.x||0)+steps[key][0]*pace,
     y:(adjustmentDraft?.y||0)+steps[key][1]*pace});
    return;
   }
  }
  if(key==='r'){
   e.preventDefault();rotateSelected(e.shiftKey?-1:1);
  }
 });
 // Trackpad pinch emits a ctrl+wheel gesture in Chromium.
 // Do not hijack ordinary scrolling or page-wide browser zoom.
 const stage=$('previewStage');
 stage.addEventListener('wheel',event=>{
  if(!enabled||preview!=='interior')return;
  const rect=canvas.getBoundingClientRect();
  if(event.clientX<rect.left||event.clientX>rect.right||
     event.clientY<rect.top||event.clientY>rect.bottom)return;
  event.preventDefault();
  setActionZoom((g.VLBuildingPreviewScale?.actionZoom||1)*Math.exp(-event.deltaY*.008),event.clientX,event.clientY);
 },{passive:false});
 const touches=new Map();
 stage.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch'||!enabled||preview!=='interior')return;
  touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
 },true);
 stage.addEventListener('pointermove',e=>{
  if(!touches.has(e.pointerId))return;
  touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(touches.size!==2)return;
  const [a,b]=[...touches.values()];
  const dist=Math.hypot(a.x-b.x,a.y-b.y);
  if(stage._pinchDistance){
   setActionZoom((g.VLBuildingPreviewScale?.actionZoom||1)*dist/stage._pinchDistance,
    (a.x+b.x)/2,(a.y+b.y)/2);
  }
  stage._pinchDistance=dist;
  e.preventDefault();
 },{passive:false,capture:true});
 for(const name of ['pointerup','pointercancel'])
  stage.addEventListener(name,e=>{touches.delete(e.pointerId);stage._pinchDistance=0;},true);
 $('actionTransformSnap').onchange=()=>api.getScaleController?.()
  ?.setTransformSnap?.($('actionTransformSnap').value);
 function stepFacing(delta){
  const item=adjustmentItem();if(!item||!adjust||!gizmo)return;
  if(adjustmentId(item)!==adjustmentKey)showAdjustment();
  const base=g.VLInteriorIso?.actionAnchor?.(item,{raw:true,generic:true})?.direction||'sw';
  changeAdjustment({direction:gizmo.rotate(adjustmentDraft.direction,base,delta)});
 }
 $('actionTurnLeft').onclick=()=>stepFacing(-1);
 $('actionTurnRight').onclick=()=>stepFacing(1);
 $('actionAdjustAction').onchange=()=>{
  const item=adjustmentItem();if(!item)return;
  if(!model.action(scene(),item.id,$('actionAdjustAction').value))return;
  adjustmentKey='';renderObjects();renderActions();previewAdjustment();
 };
 for(const [id,field] of [['actionAdjustX','x'],['actionAdjustY','y'],
  ['actionAdjustDirection','direction'],['actionAdjustLayer','layer']]){
  $(id).addEventListener('input',()=>changeAdjustment({[field]:$(id).value}));
 }
 for(const [id,dx,dy] of [['actionNudgeLeft',-1,0],['actionNudgeUp',0,-1],
  ['actionNudgeDown',0,1],['actionNudgeRight',1,0]]){
  $(id).onclick=()=>{
   const grid=Number($('actionTransformSnap').value)||1;
   changeAdjustment({x:(adjustmentDraft?.x||0)+dx*grid,
    y:(adjustmentDraft?.y||0)+dy*grid});
  };
 }
 $('actionAdjustPreview').onclick=previewAdjustment;
 $('actionAdjustSave').onclick=()=>{
  const item=adjustmentItem();if(!item||!adjust||!adjustmentDraft)return;
  const original=adjust.get(item,item.actionId),oldLast=lastAdjusted;
  if(!adjust.set(item,item.actionId,adjustmentDraft,model.types[item.assetId].actions))return;
  const expected=adjust.normalize(adjustmentDraft);
  lastAdjusted={floor,itemId:item.id,actionId:item.actionId};
  // Validate the edited instance first. The existing global type default
  // intentionally overrides local slots UNTIL the replacement is committed.
  const local=adjustmentItem()?.actionAdjustments?.[item.actionId];
  if(!local||JSON.stringify(adjust.normalize(local))!==JSON.stringify(expected)){
   lastAdjusted=oldLast;
   $('actionAdjustStatus').textContent='⚠ Action adjustment was not kept in the editor.';
   return;
  }
  // Persist the TYPE/ACTION default independently from the building asset,
  // so a newly added WC inherits this alignment without any copy operation.
  if(!adjust.setDefault(item.assetId,item.actionId,expected,
     model.types[item.assetId].actions)){
   const live=adjustmentItem()||item;
   adjust.set(live,item.actionId,original,model.types[live.assetId].actions);
   lastAdjusted=oldLast;
   $('actionAdjustStatus').textContent='⚠ TYPE DEFAULT NOT SAVED — browser storage blocked the update.';
   onStatus('⚠ Could not save a reusable default for '+item.name);
   return;
  }
  // Every matching object in every floor of THIS building inherits the
  // saved type preset. Old buildings import it on their next open.
  const data=serialize();
  const matches=data.actionSlots.filter(x=>x.assetId===item.assetId&&
   x.actionAdjustments?.[item.actionId]);
  if(!matches.length||matches.some(x=>
    JSON.stringify(adjust.normalize(x.actionAdjustments[item.actionId]))!==
    JSON.stringify(expected))){
   $('actionAdjustStatus').textContent='⚠ Default saved, but building slots need refreshing.';
   return;
  }
  const saved=api.saveAsset?.();
  if(!saved){
   $('actionAdjustStatus').textContent='⚠ Object TYPE DEFAULT saved, but building save failed. Export building JSON.';
   onStatus('⚠ Global action default saved; building was not saved');
   return;
  }
  const confirmed=saved.actionSlots?.find(x=>x.floor===floor&&x.id===item.id)
    ?.actionAdjustments?.[item.actionId];
  const shared=adjust.getDefault(item.assetId,item.actionId);
  if(!confirmed||!shared||
   JSON.stringify(adjust.normalize(confirmed))!==JSON.stringify(expected)||
   JSON.stringify(shared)!==JSON.stringify(expected)){
   onStatus('⚠ Default saved, but building export needs refreshing');
   return;
  }
  api.getScaleController?.()?.previewAdjustment?.(expected);
  adjustmentDraft=expected;
  refresh();
  $('actionAdjustStatus').textContent='✓ SAVED TYPE DEFAULT / '+model.types[item.assetId].label+
   ' / '+item.actionId+' / X '+expected.x+' Y '+expected.y+
   ' / '+expected.direction.toUpperCase()+' · ALL MATCHING OBJECTS';
  onStatus('✓ '+model.types[item.assetId].label+' / '+item.actionId+
    ' saved as a reusable default for every matching object');
  renderActions();
 };
 $('actionAdjustReset').onclick=()=>changeAdjustment({x:0,y:0,direction:'auto',layer:'behind'});
 $('actionAdjustExit').onclick=()=>{
  api.getScaleController?.()?.endAdjustment?.();
  setActionZoom(1);
  $('previewStage').classList.remove('action-adjust-viewport');
  adjustmentKey='';adjustmentDraft=null;showAdjustment();
  onStatus('Action adjustment closed; changes not saved');
 };
 $('updateInteriorItem').onclick=()=>{
  const s=scene(),item=s.items.find(x=>x.id===selected);if(!item)return;
  const before=snapshot();
  const moved=model.move(s,item.id,Number($('interiorItemC').value),Number($('interiorItemR').value),Number($('interiorItemFacing').value));
  if(!moved){onStatus('Cannot save placement: collision or outside');return;}
  model.action(s,item.id,$('interiorItemAction').value);adjustmentKey='';
  item.capacity=Math.max(1,Math.min(8,Number($('interiorCapacity').value)||1));
  item.triggerRadius=Math.max(.4,Math.min(3,Number($('interiorItemRadius').value)||1));
  recordUndo(before);refresh();onStatus('Saved '+item.name+' → '+item.actionId);
 };
 $('removeInteriorItem').onclick=()=>{
  const before=snapshot(),s=scene();s.items=s.items.filter(x=>x.id!==selected);
  recordUndo(before);selected=null;objectGizmoActive=false;refresh();onStatus('Removed interior prop');
 };
 $('duplicateInteriorItem').onclick=()=>{
  const s=scene(),old=s.items.find(x=>x.id===selected);if(!old)return;
  const before=snapshot();
  const attempts=[[old.c+1,old.r],[old.c,old.r+1],[old.c+2,old.r+1],[old.c+1,old.r+2]];
  let obj=null;
  for(const [c,r] of attempts){obj=model.add(s,old.assetId,c,r);if(obj)break;}
  if(!obj){onStatus('No free adjacent tile to duplicate');return;}
  recordUndo(before);
  model.action(s,obj.id,old.actionId);selected=obj.id;refresh();onStatus('Duplicated '+obj.name);
 };
 $('actionUndo').onclick=undo;
 $('metadataExport').onclick=api.exportAsset;
 // No hard-coded fixed height; use a mobile-only Base header and collapsible storage.
 const base=document.querySelector('.panel.left .preset'),library=document.querySelector('.panel.left');
 const parent=base.parentNode,mark=document.createComment('Semesta base editor anchor');
 parent.insertBefore(mark,base);
 const mobileBase=$('mobileBase');
 function relocate(){
  const mobile=matchMedia('(max-width:640px)').matches;
  if(mobile){mobileBase.append(base);mobileBase.hidden=false;}
  else {mark.parentNode?.insertBefore(base,mark.nextSibling);mobileBase.hidden=true;}
 }
 relocate();g.addEventListener('resize',relocate);
 $('mobileMenuBtn').onclick=()=>{
  const nav=document.querySelector('nav'),state=nav.classList.toggle('menu-open');
  $('mobileMenuBtn').setAttribute('aria-expanded',String(state));
 };
 $('savedToggle').onclick=()=>{
  const active=$('app').classList.toggle('show-library');
  $('savedToggle').textContent=active?'▣ Hide Saved Buildings':'▣ Show Saved Buildings';
  $('savedToggle').setAttribute('aria-expanded',String(active));
  if(active)library.scrollIntoView({behavior:'smooth',block:'nearest'});
 };
 fillFloors();buildTray();updateCategories();renderMetadata();setInteriorView('iso');
 return {load,reset,refresh,serialize,isInteractive:()=>enabled,
  openSelectedAdjustment,resumeSavedAdjustment,updateAdjustmentFromDrag(next){
   const item=adjustmentItem();if(!item||!adjust||adjustmentKey!==adjustmentId(item))return;
   adjustmentDraft=adjust.normalize({...adjustmentDraft,...next});fillAdjustment();
  },
  setPreview,selectTab,setInteriorView,selectFloor,
  getScene:()=>enabled?scene():null,getSelectedProp:()=>scene().items.find(x=>x.id===selected)||null,
  getInteriorView:()=>interiorView};
}
g.VLStudioInteriors=Object.freeze({init});
})(window);
