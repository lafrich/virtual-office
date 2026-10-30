/* Build Mode — one touch-friendly edit UI for EVERY Virtual Office zone.
   Tap an object to select, drag it, nudge, Save or Cancel. */
(function(global){
'use strict';
function createEditor(initialWorld,opt={}){
 let world=initialWorld,open=false,drag=null,before=null;
 const button=document.getElementById('btnEditor');
 const panel=document.getElementById('moduleEditor');
 const getProject=opt.getProject||(()=>null);
 const getZone=opt.getZone||(()=>'office');
 const position=opt.pointerPosition|| (e=>({x:e.clientX,y:e.clientY}));
 const onState=opt.onState||(()=>{});
 if(!button||!panel)throw Error('Build Mode controls missing');
 panel.innerHTML=`
 <div class="build-ui">
   <header class="build-head">
    <strong>🛠 EDIT MODE</strong>
    <button type="button" id="buildCancelTop" aria-label="Cancel editing">✕</button>
   </header>
   <div class="build-content">
     <p class="build-tip">Tap furniture di ruangan untuk memilih, lalu <b>geser</b> dengan jari.</p>
     <select id="buildSelect" aria-label="Furniture yang dipilih"></select>
     <div class="build-selected" id="buildSelected">Pilih furniture</div>
     <div class="build-line-label">GESER FURNITURE</div>
     <div class="build-controls">
       <button data-step="left" aria-label="Geser kiri">←</button>
       <button data-step="up" aria-label="Geser atas">↑</button>
       <button data-step="down" aria-label="Geser bawah">↓</button>
       <button data-step="right" aria-label="Geser kanan">→</button>
     </div>
     <div class="build-controls build-fine">
       <button data-pixel="left">← 1px</button>
       <button data-pixel="up">↑ 1px</button>
       <button data-pixel="down">↓ 1px</button>
       <button data-pixel="right">→ 1px</button>
     </div>
     <details id="buildAdvanced">
       <summary>⚙ Pengaturan detail</summary>
       <div id="buildFields" class="build-fields"></div>
       <div class="build-options">
         <label><input id="buildVisible" type="checkbox"> Tampilkan</label>
         <label><input id="buildCollision" type="checkbox"> Collision</label>
       </div>
       <div class="build-io">
         <button id="buildExport" type="button">Export JSON</button>
         <button id="buildImport" type="button">Import JSON</button>
         <button id="buildReset" type="button">Reset objek</button>
       </div>
       <textarea id="buildJSON" aria-label="Layout JSON" placeholder="Layout JSON"></textarea>
     </details>
     <p id="buildInfo" class="build-info" aria-live="polite"></p>
   </div>
   <footer class="build-footer">
     <button type="button" id="buildCancel">BATAL</button>
     <button type="button" id="buildSave">✓ SIMPAN</button>
   </footer>
 </div>`;
 const $=id=>panel.querySelector('#'+id);
 const sel=$('buildSelect'),info=$('buildInfo'),fields=$('buildFields');
 const specs={
  'at.x':['GRID X',.1],'at.y':['GRID Y',.1],
  'offset.x':['PIXEL X',1],'offset.y':['PIXEL Y',1],
  'size.w':['WIDTH',.1],'size.d':['DEPTH',.1],'size.h':['HEIGHT',1],
  'elevation':['Z HEIGHT',1],'depthBias':['SORT BIAS',.05],'scale':['SCALE',.05],
  'action.approach.x':['ACTION X',.1],'action.approach.y':['ACTION Y',.1],
  'action.pose.x':['POSE X',.1],'action.pose.y':['POSE Y',.1]
 };
 const inputs={};
 const getAt=(item,path)=>path.split('.').reduce((obj,key)=>obj?.[key],item);
 for(const [path,[label,step]] of Object.entries(specs)){
   const wrap=document.createElement('label');wrap.className='build-field';
   const txt=document.createElement('span');txt.textContent=label;
   const inp=document.createElement('input');
   inp.type='number';inp.step=String(step);inp.dataset.path=path;
   inp.setAttribute('aria-label',label);
   wrap.appendChild(txt);wrap.appendChild(inp);fields.appendChild(wrap);
   inputs[path]=inp;
   inp.addEventListener('change',()=>{
     if(!world.selected)return;
     if(!world.update(world.selectedId,path,inp.value))info.textContent='Nilai tidak valid.';
     else info.textContent='Posisi diperbarui · tekan SIMPAN jika sudah pas.';
     refresh()
   });
 }
 let off=()=>{};
 function refresh(){
   if(!world)return;
   const selected=world.selected;
   if(!selected)return;
   $('buildSelected').textContent='● '+selected.name;
   sel.value=selected.id;
   $('buildVisible').checked=!!selected.visible;
   $('buildCollision').checked=!!selected.collision;
   for(const [path,inp] of Object.entries(inputs)){
     const v=getAt(selected,path);
     inp.disabled=!Number.isFinite(v);
     if(document.activeElement!==inp)inp.value=Number.isFinite(v)?String(v):'';
   }
 }
 function populate(){
   sel.innerHTML='';
   for(const a of world.assets){
     const op=document.createElement('option');op.value=a.id;op.textContent=a.name;
     sel.appendChild(op);
   }
   refresh()
 }
 function attach(next){
   off();world=next;
   if(world){off=world.onChange(refresh);populate()}
 }
 attach(world);
 function close(save){
   if(!open)return;
   if(!save&&before)world.applyJSON(before);
   if(save)world.save();
   open=false;drag=null;before=null;panel.hidden=true;
   button.classList.remove('editor-active');
   document.body.classList.remove('modular-editing');
   onState(false);
   info.textContent='';
 }
 function toggle(yes){
   if(yes===false){close(false);return false}
   if(open){close(false);return false}
   if(!world)return false;
   before=world.serialize();open=true;drag=null;
   panel.hidden=false;button.classList.add('editor-active');
   document.body.classList.add('modular-editing');
   populate();info.textContent='Mode edit: tap dan geser furniture. Perubahan belum disimpan.';
   onState(true);
   return true
 }
 button.addEventListener('click',()=>toggle(!open));
 $('buildCancelTop').addEventListener('click',()=>close(false));
 $('buildCancel').addEventListener('click',()=>close(false));
 $('buildSave').addEventListener('click',()=>close(true));
 sel.addEventListener('change',()=>{world.select(sel.value);info.textContent='Furniture dipilih.'});
 const nudges={left:[-.1,.1],up:[-.1,-.1],down:[.1,.1],right:[.1,-.1]};
 panel.querySelectorAll('[data-step]').forEach(b=>b.addEventListener('click',()=>{
   const a=world.selected;if(!a)return;
   const [dx,dy]=nudges[b.dataset.step];
   world.update(a.id,'at.x',a.at.x+dx,{silent:true});
   world.update(a.id,'at.y',a.at.y+dy,{silent:true});
   world.changed();info.textContent='Geser 0,1 grid · tekan SIMPAN.'
 }));
 const pixels={left:['x',-1],right:['x',1],up:['y',-1],down:['y',1]};
 panel.querySelectorAll('[data-pixel]').forEach(b=>b.addEventListener('click',()=>{
   const a=world.selected;if(!a)return;
   const [axis,step]=pixels[b.dataset.pixel];
   world.update(a.id,'offset.'+axis,a.offset[axis]+step,{silent:true});
   world.changed();info.textContent='Offset 1 pixel · tekan SIMPAN.'
 }));
 $('buildVisible').addEventListener('change',()=>world.toggle(world.selectedId));
 $('buildCollision').addEventListener('change',()=>world.setCollision(world.selectedId,$('buildCollision').checked));
 $('buildReset').addEventListener('click',()=>{world.reset(world.selectedId);info.textContent='Furniture kembali ke default.'});
 $('buildExport').addEventListener('click',()=>{
   const text=world.serialize();$('buildJSON').value=text;$('buildJSON').select();
   if(navigator.clipboard?.writeText)navigator.clipboard.writeText(text).catch(()=>{});
   info.textContent='Layout JSON siap disalin.'
 });
 $('buildImport').addEventListener('click',()=>{
   try{world.applyJSON($('buildJSON').value);info.textContent='Layout berhasil di-import.'}
   catch(e){info.textContent='JSON tidak valid: '+e.message}
 });
 function changeZone(next){
   if(open)close(false); // unsaved edits are never silently committed.
   attach(next);return !!world;
 }
 function pointerDown(e){
   if(!open)return false;
   const p=position(e),pr=getProject();
   if(!pr)return true;
   const chosen=world.pick(p.x,p.y,pr,{radius:27});
   if(chosen){
     world.select(chosen.id);
     drag={id:chosen.id,pointer:e.pointerId,origin:p,x:chosen.at.x,y:chosen.at.y};
     info.textContent='Menggeser: '+chosen.name;
   }else drag=null;
   e.preventDefault();return true
 }
 function pointerMove(e){
   if(!open)return false;
   if(!drag||e.pointerId!==drag.pointer)return true;
   const p=position(e),pr=getProject(),zoom=pr?.zoom||1;
   const sx=(p.x-drag.origin.x)/(23*zoom),sy=(p.y-drag.origin.y)/(11.5*zoom);
   const nx=drag.x+(sx+sy)*.5,ny=drag.y+(sy-sx)*.5;
   const snap=.1;
   world.update(drag.id,'at.x',Math.round(nx/snap)*snap,{silent:true});
   world.update(drag.id,'at.y',Math.round(ny/snap)*snap,{silent:true});
   world.changed();e.preventDefault();return true
 }
 function pointerUp(e){if(!open)return false;if(drag?.pointer===e.pointerId){drag=null;info.textContent='Posisi diperbarui · tekan SIMPAN.'}return true}
 function overlay(api){
   if(!open||!world)return;
   const g=api.ctx,pr=api.iso,z=api.zoom;
   g.save();
   // Visible selection handles; a tap or drop on the object selects it.
   for(const item of world.assets){
     if(!item.visible)continue;
     const p=pr(item.at.x,item.at.y,item.elevation);
     const x=p.x+item.offset.x*z,y=p.y+item.offset.y*z;
     g.lineWidth=1.5;g.strokeStyle=item.id===world.selectedId?'#ffe17b':'#80e1c7';
     g.strokeRect(x-4*z,y-4*z,8*z,8*z);
   }
   const a=world.selected;
   if(a){
     const p=pr(a.at.x,a.at.y,a.elevation),x=p.x+a.offset.x*z,y=p.y+a.offset.y*z;
     g.strokeStyle='#ffe17b';g.lineWidth=2;g.setLineDash([4,3]);
     g.strokeRect(x-a.size.w*13*z,y-a.size.h*z-8*z,a.size.w*26*z,a.size.h*z+20*z);
     g.setLineDash([]);
     g.font='bold '+Math.max(9,Math.round(11*z))+'px monospace';g.textAlign='center';
     g.fillStyle='#ffe17b';g.fillText(a.name,x,y-a.size.h*z-15*z);
   }
   g.restore();
 }
 return {get active(){return open},get world(){return world},toggle,close,changeZone,
   pointerDown,pointerMove,pointerUp,overlay};
}
global.VOModularEditor={createEditor};
})(window);
