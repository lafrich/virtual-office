/* Semesta editor-only Enter Building preview. Keeps map drafts intact.
 * Stored action slots bind to the canonical character rig aliases, but this
 * preview does not teleport a multiplayer character or execute game actions.
 */
(function(g){
'use strict';
const $=id=>document.getElementById(id),CELL=30,model=g.VLBuildingInterior,iso=g.VLInteriorIso;
function mount(opts){
 if(!model)return;
 const enter=$('enterBuilding'),dialog=$('interiorWalkthrough'),canvas=$('interiorWalkthroughCanvas');
 if(!enter||!dialog||!canvas)return;
 const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 let active=null,scene=null,selected=null,floor=1,view='iso',lastIso=null;
 function getInteriors(forItem=null){
  const item=forItem||opts.getSelected(),spec=item?.type==='sprite'?opts.catalog.get(item.asset):null;
  const raw=item?.interior?.format==='virtual-life-interiors-v1'?item.interior:spec?.interior;
  if(!raw||!Array.isArray(raw.floors))return null;
  const footprint=spec?.footprint||item?.footprint||raw.floors[0]?.sourceFootprint||[3,3];
  return {item,raw,cfg:{w:Number(footprint[0])||3,d:Number(footprint[1])||3}};

 }
 function changeView(next){
  view=next==='plan'||!iso?'plan':'iso';
  const isIso=view==='iso';
  const isoButton=$('interiorWalkthroughIso'),planButton=$('interiorWalkthroughPlan');
  isoButton.setAttribute('aria-pressed',String(isIso));
  planButton.setAttribute('aria-pressed',String(!isIso));
  isoButton.style.background=isIso?'#125fbb':'#f5f6f7';
  isoButton.style.color=isIso?'#fff':'#243c54';
  planButton.style.background=!isIso?'#125fbb':'#f5f6f7';
  planButton.style.color=!isIso?'#fff':'#243c54';
  draw();
 }
 function draw(){
  if(!scene)return;
  if(view==='iso'&&iso){
   lastIso=iso.draw(canvas,scene,{selectedId:selected?.id,grid:true});
   return;
  }
  lastIso=null;drawPlan();
 }
 function drawPlan(){
  if(!scene)return;
  const w=Math.max(2,Math.min(24,scene.width||3)),d=Math.max(2,Math.min(24,scene.depth||3));
  canvas.width=w*CELL;canvas.height=d*CELL;ctx.imageSmoothingEnabled=false;
  ctx.fillStyle=scene.theme==='aqua'?'#d0e9f0':scene.theme==='blue'?'#cbd9eb':'#e8dbc7';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle='#a2b0b8';ctx.lineWidth=1;
  for(let x=0;x<=w;x++){ctx.beginPath();ctx.moveTo(x*CELL+.5,0);ctx.lineTo(x*CELL+.5,canvas.height);ctx.stroke();}
  for(let y=0;y<=d;y++){ctx.beginPath();ctx.moveTo(0,y*CELL+.5);ctx.lineTo(canvas.width,y*CELL+.5);ctx.stroke();}
  const entry=scene.entrance||{c:Math.floor(w/2),r:d-1};
  ctx.fillStyle='#267c54';ctx.fillRect(entry.c*CELL+3,entry.r*CELL+CELL-8,CELL-6,6);
  ctx.fillStyle='#fff';ctx.font='9px monospace';ctx.textAlign='center';ctx.fillText('DOOR',(entry.c+.5)*CELL,entry.r*CELL+10);
  for(const obj of scene.items||[]){
   const def=model.types[obj.assetId];if(!def)continue;
   let iw=def.w,id=def.d;if(obj.rotation%180===90)[iw,id]=[id,iw];
   const x=obj.c*CELL,y=obj.r*CELL;
   ctx.fillStyle=selected?.id===obj.id?'#2f64c7':'#687b91';
   ctx.fillRect(x+1,y+1,iw*CELL-2,id*CELL-2);
   ctx.fillStyle=def.category==='Bathroom'?'#a3d3e8':def.category==='Bedroom'?'#ebc1aa':'#b7d0b9';
   ctx.fillRect(x+3,y+3,iw*CELL-6,id*CELL-6);
   if(g.VLInteriorPixels)g.VLInteriorPixels.draw(ctx,obj.assetId,x+3,y+3,iw*CELL-6,id*CELL-6);
   else{ctx.font='14px monospace';ctx.fillStyle='#1f3148';ctx.textAlign='center';ctx.fillText(def.label.slice(0,2),x+iw*CELL/2,y+id*CELL/2+6);}
  }
 }
 function floorSelected(n){
  floor=n;
  const original=active?.raw?.floors.find(x=>Number(x.floor)===n)||null;
  // Old saved buildings stored 6×6 interior for a 3×3 exterior.
  // Normalize the VIEW without mutating the user's persisted city draft.
  scene=original?model.normalize(original,active.cfg):null;
  selected=null;$('interiorWalkthroughUse').disabled=true;
  $('interiorWalkthroughDetail').textContent='Tap a furniture item to select its action.';
  draw();
 }
 function open(forItem=null){
  active=getInteriors(forItem);
  if(!active){opts.message?.('No interior data: edit this building in Bangun Ruang first.');return;}
  $('interiorWalkthroughTitle').textContent='INSIDE / '+String(active.item.name||'BUILDING').toUpperCase();
  const select=$('interiorWalkthroughFloor');select.replaceChildren();
  for(const entry of active.raw.floors){
   const n=Number(entry.floor)||1;const option=document.createElement('option');option.value=String(n);
   option.textContent='Floor '+n;select.append(option);
  }
  const first=Number(active.raw.activeFloor)||Number(active.raw.floors[0]?.floor)||1;
  select.value=String(first);floorSelected(first);
  changeView('iso');
  dialog.showModal();
 }
 function close(){dialog.close();active=null;scene=null;selected=null;}
 enter.onclick=()=>open();$('interiorWalkthroughClose').onclick=close;
 $('interiorWalkthroughFloor').onchange=()=>floorSelected(Number($('interiorWalkthroughFloor').value)||1);
 $('interiorWalkthroughIso').onclick=()=>changeView('iso');
 $('interiorWalkthroughPlan').onclick=()=>changeView('plan');
 canvas.addEventListener('pointerdown',e=>{
  if(!scene)return;
  const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
  let c,r,hit=null;
  if(view==='iso'&&iso){
   hit=iso.pointer(canvas,e,lastIso);
   if(!hit)return;
   c=hit.c;r=hit.r;
  }else{
   c=Math.floor((e.clientX-rect.left)*canvas.width/rect.width/CELL);
   r=Math.floor((e.clientY-rect.top)*canvas.height/rect.height/CELL);
  }
  selected=hit?.itemId?
   (scene.items||[]).find(obj=>obj.id===hit.itemId)||null:
   (scene.items||[]).find(obj=>model.occupied(obj).includes(c+','+r))||null;
  if(selected){
   const a=model.actions[selected.actionId],def=model.types[selected.assetId];
   const pose=model.poseFor?.(selected.assetId,selected.actionId)??a?.pose;
   $('interiorWalkthroughDetail').textContent=(def?.label||selected.assetId)+' / '+(a?.label||selected.actionId)+
    ' / '+(pose?'Rig preview: '+pose:'No authored rig; data trigger only');
   $('interiorWalkthroughUse').disabled=false;
  }else{
   $('interiorWalkthroughDetail').textContent='Tap a furniture item to select its action.';
   $('interiorWalkthroughUse').disabled=true;
  }draw();
 });
 $('interiorWalkthroughUse').onclick=()=>{
  if(!selected)return;
  const a=model.actions[selected.actionId];
  const pose=model.poseFor?.(selected.assetId,selected.actionId)??a?.pose;
  const result=opts.previewAction?.(selected,{...a,pose})||false;
  $('interiorWalkthroughDetail').textContent=
   (a?.label||selected.actionId)+' triggered as editor preview. '+
   (result?'Character rig pose: '+pose+'.':'No matching character rig; action metadata only.');
 };
 g.addEventListener('semesta:furniture-ready',()=>{if(active&&scene)draw();});
 return {
  openFor(item){model.refreshExternal?.();return open(item);},
  update(item,spec){
   const available=!!item&&(item.enterable===true||spec?.enterable===true)&&
    (item?.interior?.floors?.length||spec?.interior?.floors?.length);
   enter.hidden=!available;
   if(!available&&!dialog.hidden&&dialog.open)close();
  }
 };
}
g.VLSemestaInteriorPreview=Object.freeze({mount});
})(window);
