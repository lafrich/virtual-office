/* Virtual Office — on-screen precision editor for Cove modules. */
(function(global){
'use strict';
function createEditor(world,opt={}){
 const getZone=opt.getZone||(()=>'office');
 const screenToWorld=opt.screenToWorld||(()=>null);
 const getProject=opt.getProject||(()=>null);
 let active=false,drag=null,edited=false;
 const trigger=document.getElementById('btnEditor');
 const panel=document.getElementById('moduleEditor');
 if(!trigger||!panel)throw new Error('Modular editor UI elements missing');
 const fieldNames={
  'at.x':'GRID X','at.y':'GRID Y',
  'offset.x':'PIXEL X','offset.y':'PIXEL Y',
  'elevation':'HEIGHT Z','depthBias':'SORT BIAS',
  'size.w':'WIDTH','size.d':'DEPTH','size.h':'HEIGHT',
  'action.approach.x':'ACTION X','action.approach.y':'ACTION Y',
  'action.pose.x':'POSE X','action.pose.y':'POSE Y'
 };
 const fields=['at.x','at.y','offset.x','offset.y','elevation','depthBias',
 'size.w','size.d','size.h','action.approach.x','action.approach.y','action.pose.x','action.pose.y'];
 const steps={'at.x':.1,'at.y':.1,'offset.x':1,'offset.y':1,
  'elevation':1,'depthBias':.05,'size.w':.1,'size.d':.1,'size.h':1,
  'action.approach.x':.1,'action.approach.y':.1,
  'action.pose.x':.1,'action.pose.y':.1};
 const div=document.createElement('div');
 div.className='module-editor-inner';
 div.innerHTML=`
  <header class="me-head"><strong>🛠 COVE / MODULE EDITOR</strong>
   <button id="meClose" type="button" aria-label="Tutup editor">✕</button></header>
  <p class="me-help">Pilih aset, geser di canvas, atau atur angka presisi. Semua perubahan tersimpan lokal.</p>
  <label class="me-label" for="meAsset">SELECT ASSET</label>
  <select id="meAsset" class="me-select"></select>
  <div class="me-short">
    <button type="button" data-jog="at.x:-.1">← GRID</button>
    <button type="button" data-jog="at.y:-.1">↑ GRID</button>
    <button type="button" data-jog="at.y:.1">↓ GRID</button>
    <button type="button" data-jog="at.x:.1">→ GRID</button>
  </div>
  <div class="me-short">
    <button type="button" data-jog="offset.x:-1">← 1px</button>
    <button type="button" data-jog="offset.y:-1">↑ 1px</button>
    <button type="button" data-jog="offset.y:1">↓ 1px</button>
    <button type="button" data-jog="offset.x:1">→ 1px</button>
  </div>
  <div class="me-fields" id="meFields"></div>
  <div class="me-options"><label><input id="meSnap" type="checkbox" checked> Grid snap 0.1</label>
    <label><input id="meCollision" type="checkbox"> Collision</label></div>
  <label class="me-label" for="meFacing">DIRECTION / SPRITE</label>
  <select class="me-select" id="meFacing">
   <option>SW</option><option>SE</option><option>NW</option><option>NE</option>
  </select>
  <details class="me-advanced"><summary>PNG SPRITE (OPTIONAL)</summary>
    <label for="meSpriteBase">Base PNG</label><input id="meSpriteBase" type="text" placeholder="./assets/my-base.png">
    <label for="meSpriteFront">Front/occlusion PNG</label><input id="meSpriteFront" type="text" placeholder="./assets/my-front.png">
    <p>Hanya path lokal ./assets/*.png. Kosong = procedural fallback.</p>
    <button type="button" id="meApplySprite">APPLY SPRITE</button>
  </details>
  <div class="me-short me-operations">
    <button type="button" id="meResetItem">RESET ASSET</button>
    <button type="button" id="meResetAll">RESET ROOM</button>
  </div>
  <div class="me-short me-operations">
    <button type="button" id="meExport">EXPORT JSON</button>
    <button type="button" id="meImport">IMPORT JSON</button>
  </div>
  <textarea id="meJson" spellcheck="false" aria-label="Layout data JSON" placeholder="Layout JSON muncul setelah export; paste JSON di sini untuk import"></textarea>
  <p class="me-status" id="meStatus" role="status"></p>`;
 panel.appendChild(div);
 const el=id=>panel.querySelector('#'+id);
 const sel=el('meAsset');
 sel.innerHTML=world.assets.map(a=>'<option value="'+a.id+'">'+a.name+' — '+a.id+'</option>').join('');
 const inputs={};
 const container=el('meFields');
 for(const path of fields){
  const node=document.createElement('label');node.className='me-field';node.textContent=fieldNames[path];
  const inp=document.createElement('input');inp.type='number';inp.step=String(steps[path]||.1);
  inp.dataset.path=path;inp.setAttribute('aria-label',fieldNames[path]);
  node.appendChild(inp);container.appendChild(node);inputs[path]=inp;
  const sync=()=>{
   if(!world.selected)return;
   if(!world.selected.action&&path.startsWith('action.'))return;
   const parts=path.split('.');let v=world.selected;for(const p of parts)v=v?.[p];
   if(Number.isFinite(Number(v)))inp.value=String(v);
  };
  inp.addEventListener('change',()=>{
   if(world.update(world.selectedId,path,inp.value))status('Saved: '+fieldNames[path]);
   else status('Nilai tidak valid.',true);
   sync();
  });
 }
 const status=(msg,error=false)=>{const node=el('meStatus');node.textContent=msg;node.classList.toggle('error',error)};
 function redraw(){
  const selected=world.selected;if(!selected)return;
  sel.value=selected.id;
  for(const [path,inp] of Object.entries(inputs)){
   const enabled=!path.startsWith('action.')||!!selected.action;
   inp.disabled=!enabled;
   let obj=selected;
   for(const part of path.split('.'))obj=obj?.[part];
   if(document.activeElement!==inp)inp.value=enabled&&Number.isFinite(obj)?String(obj):'';
  }
  el('meCollision').checked=!!selected.collision;
  el('meFacing').value=selected.facing;
  el('meSpriteBase').value=selected.sprite?.base||'';
  el('meSpriteFront').value=selected.sprite?.front||'';
 }
 world.onChange(redraw);
 sel.addEventListener('change',()=>{world.select(sel.value);status('Editing '+world.selected.name)});
 el('meFacing').addEventListener('change',()=>world.setFacing(world.selectedId,el('meFacing').value));
 el('meCollision').addEventListener('change',()=>world.setCollision(world.selectedId,el('meCollision').checked));
 el('meApplySprite').addEventListener('click',()=>{
  const id=world.selectedId;
  const goodBase=world.setSprite(id,'base',el('meSpriteBase').value.trim());
  const goodFront=world.setSprite(id,'front',el('meSpriteFront').value.trim());
  status(goodBase&&goodFront?'Sprite paths updated.':'Gunakan ./assets/nama.png saja.',!(goodBase&&goodFront))
 });
 panel.querySelectorAll('[data-jog]').forEach(btn=>btn.addEventListener('click',()=>{
  const [path,delta]=btn.dataset.jog.split(':');
  const obj=world.selected;if(!obj)return;
  const value=path.split('.').reduce((o,k)=>o[k],obj);
  if(world.update(obj.id,path,Number(value)+Number(delta)))status('Nudge '+fieldNames[path]+' '+delta)
 }));
 el('meResetItem').addEventListener('click',()=>{world.reset(world.selectedId);status('Asset dikembalikan ke default')});
 el('meResetAll').addEventListener('click',()=>{
  if(!edited){edited=true;status('Tekan RESET ROOM sekali lagi untuk konfirmasi');return}
  edited=false;world.reset();status('Semua aset kembali ke posisi default')
 });
 el('meExport').addEventListener('click',()=>{
  const data=world.serialize();el('meJson').value=data;el('meJson').select();
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(data).catch(()=>{});
  status('JSON export siap. Teks bisa dicopy dan disimpan.')
 });
 el('meImport').addEventListener('click',()=>{
  try{const count=world.applyJSON(el('meJson').value);status('Import berhasil: '+count+' assets')}
  catch(e){status('Gagal import: '+e.message,true)}
 });
 function toggle(on){
  active=!!on&&getZone()==='cove';
  panel.hidden=!active;trigger.classList.toggle('editor-active',active);
  document.body.classList.toggle('modular-editing',active);
  if(active){redraw();status('Editor aktif · tap aset di world untuk memilih')}
  else drag=null;
  return active;
 }
 trigger.addEventListener('click',()=>toggle(!active));
 el('meClose').addEventListener('click',()=>toggle(false));
 function zoneChanged(){trigger.hidden=getZone()!=='cove';if(trigger.hidden)toggle(false)}
 function pointerDown(ev,box){
  if(!active||getZone()!=='cove')return false;
  const project=getProject();
  if(!project)return true;
  const pos=box(ev),p=world.pick(pos.x,pos.y,project,{radius:20});
  if(p){
   world.select(p.id);
   drag={pointerId:ev.pointerId,screen:pos,startX:p.at.x,startY:p.at.y};
   status('Selected '+p.name+' · drag untuk memindah aset');
  }else drag=null;
  ev.preventDefault();return true
 }
 function pointerMove(ev,box){
  if(!active)return false;
  if(!drag||drag.pointerId!==ev.pointerId)return true;
  const point=box(ev),proj=getProject();if(!proj)return true;
  const deltaX=(point.x-drag.screen.x)/(23*proj.zoom),
        deltaY=(point.y-drag.screen.y)/(11.5*proj.zoom);
  const nx=drag.startX+(deltaX+deltaY)/2,
        ny=drag.startY+(deltaY-deltaX)/2;
  const snap=el('meSnap').checked?.1:.02;
  world.update(world.selectedId,'at.x',Math.round(nx/snap)*snap,{silent:true});
  world.update(world.selectedId,'at.y',Math.round(ny/snap)*snap,{silent:true});
  world.changed();ev.preventDefault();return true;
 }
 function pointerUp(ev){if(!active)return false;if(drag){world.save();status('Posisi '+world.selected.name+' disimpan');drag=null}return true}
 function overlay(api){
  if(!active||getZone()!=='cove')return;
  const p=world.selected;if(!p||!p.visible)return;
  const g=api.ctx,q=api.iso(p.at.x,p.at.y,p.elevation),s=api.zoom,
  x=q.x+p.offset.x*s,y=q.y+p.offset.y*s;
  const cx=p.at.x,cy=p.at.y,w=p.size.w/2,d=p.size.d/2;
  const verts=[[cx-w,cy-d],[cx+w,cy-d],[cx+w,cy+d],[cx-w,cy+d]].map(v=>api.iso(v[0],v[1],p.elevation));
  g.save();g.strokeStyle='#ffe277';g.lineWidth=2;g.setLineDash([4,3]);g.beginPath();
  verts.forEach((v,i)=>i?g.lineTo(v.x+p.offset.x*s,v.y+p.offset.y*s):g.moveTo(v.x+p.offset.x*s,v.y+p.offset.y*s));g.closePath();g.stroke();
  g.setLineDash([]);g.fillStyle='#ffe277';g.fillRect(x-3,y-3,6,6);
  const a=p.action;if(a){
   const approach=api.iso(cx+(a.approach?.x||0),cy+(a.approach?.y||0),0);
   g.strokeStyle='#53ffcb';g.beginPath();g.arc(approach.x,approach.y,5*s,0,Math.PI*2);g.stroke();
  }
  g.font='bold '+Math.round(11*s)+'px monospace';g.fillStyle='#ffe277';g.textAlign='center';
  g.fillText(p.name,x,y-p.size.h*s-9*s);
  g.restore();
 }
 zoneChanged();redraw();
 return{get active(){return active},toggle,zoneChanged,pointerDown,pointerMove,pointerUp,overlay};
}
global.VOModularEditor={createEditor};
})(window);
