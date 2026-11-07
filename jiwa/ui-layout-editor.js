/* JIWA.EXE — visual HUD layout studio; edits canonical VLHudLayout slots.
   Nokia internals and Semesta city objects are never modified. */
(function(root){
'use strict';
const HL=root.VLHudLayout,B=root.JiwaGameplayBridge;
const stage=document.getElementById('juiStage'),nodes=document.getElementById('juiNodes');
const inspector=document.getElementById('juiInspector'),list=document.getElementById('juiElements');
if(!HL||!B||!stage||!nodes||!inspector||!list)return;
const $=id=>document.getElementById(id);
const DEVICES={desktop:{w:1280,h:720},phone:{w:390,h:844}};
const SIZES={
 lifePanel:{w:350,h:260},needs:{w:165,h:84},dock:{w:245,h:70},
 action:{w:72,h:72},run:{w:72,h:40},phone:{w:194,h:360},
 bag:{w:240,h:250},toast:{w:210,h:44}
};
const TITLES={
 lifePanel:'Survival / Stats',needs:'Legacy Needs',dock:'Uang · HP · Tas',
 action:'Action',run:'Run',phone:'Nokia HP',bag:'Jendela Tas',toast:'Notifikasi'
};
const MIN_SIZE=20;
const LIMITS={min:.5,max:1.5};
let profile='desktop',selected='lifePanel',preview='game',drag=null,dirty=false;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const safeNum=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const styleRect=(slot,id)=>{
 const d=DEVICES[profile],size=SIZES[id],scale=slot.scale||1;
 const w=size.w*scale,h=size.h*scale;
 let x=slot.x,y=slot.y;
 if(slot.anchor.includes('right'))x=d.w-w-x;
 if(slot.anchor.includes('bottom'))y=d.h-h-y;
 x=clamp(x,0,Math.max(0,d.w-w));
 y=clamp(y,0,Math.max(0,d.h-h));
 return {x,y,w,h};
};
function gameplay(){return B.get();}
function current(){return HL.normalize(gameplay()?.modules?.hudLayout);}
function slot(id=selected){return current()[profile][id];}
function setLayout(next){
 const g=gameplay();if(!g||!g.modules)return;
 g.modules.hudLayout=HL.normalize(next);
 B.set(g);
 dirty=true;
 notice('Live Preview aktif • SAVE & SYNC untuk simpan permanen');
}
function notice(msg){const o=$('juiNotice');if(o)o.textContent=msg;}
function dimensions(){
 const d=DEVICES[profile];stage.style.aspectRatio=d.w+'/'+d.h;
 stage.dataset.profile=profile;
 return d;
}
function nodeMarkup(id){
 if(id==='lifePanel')return '<div class="jui-title">NAMANYA JUGA HIDUP</div><div class="jui-mock-body">🏕 HOBO &nbsp; Rp 6.000<hr><div class="jui-meter">Energi ▰▰▰▰▰▰▰</div><div class="jui-meter">Kebersihan ▰▰▰▰▰▱</div><div class="jui-meter">Pipis ▰▱▱▱▱▱</div><div class="jui-meter">Moral ▰▰▰▰▱▱</div></div>';
 if(id==='needs')return '<b>STATUS</b><div>Energi ▰▰▰▰▰</div><div>Kebersihan ▰▰▰▱▱</div>';
 if(id==='dock')return '<div class="jui-dock"><b>Rp 6.000</b><span>📱 HP</span><span>🎒 Tas</span></div>';
 if(id==='action')return '<div class="jui-orb">ACTION</div>';
 if(id==='run')return '<div class="jui-run">RUN</div>';
 if(id==='phone')return '<div class="jui-phone"><div class="jui-nokiabrand">NOKIA</div><div class="jui-lcd">PETA AKTIVITAS<small>● Pekerjaan<br>● Kost<br>● Warung<br>◉ Kamu</small></div><div class="jui-keys">◄ &nbsp; OK &nbsp; ►<div>1 &nbsp; 2 &nbsp; 3</div></div></div>';
 if(id==='bag')return '<div class="jui-title">🎒 TAS</div><div class="jui-bag">□ □ □ □<br>□ □ □ □</div>';
 return '<div class="jui-toast">Aktivitas di dekatmu</div>';
}
function shouldShow(id){
 if(id==='phone')return preview==='phone'||selected==='phone';
 if(id==='bag')return preview==='bag'||selected==='bag';
 if(preview==='phone'||preview==='bag')return id==='dock'||id==='action'||id==='lifePanel'||id==='toast';
 return true;
}
function draw(){
 const d=dimensions(),l=current()[profile];
 $('juiDesktop').classList.toggle('primary',profile==='desktop');
 $('juiPhone').classList.toggle('primary',profile==='phone');
 ['game','phone','bag'].forEach(v=>{const b=$('juiView_'+v);if(b)b.classList.toggle('primary',preview===v);});
 stage.classList.toggle('jui-popup',preview!=='game');
 nodes.replaceChildren();
 HL.ELEMENTS.forEach(id=>{
  if(!shouldShow(id))return;
  const r=styleRect(l[id],id);
  const div=document.createElement('div');div.className='jui-node jui-'+id+(id===selected?' selected':'');
  div.dataset.id=id;div.title=TITLES[id]+' · drag untuk pindah';
  div.style.left=(r.x/d.w*100)+'%';div.style.top=(r.y/d.h*100)+'%';
  div.style.width=(r.w/d.w*100)+'%';div.style.height=(r.h/d.h*100)+'%';
  div.innerHTML='<div class="jui-node-caption">'+TITLES[id]+'</div>'+
    '<div class="jui-node-mock">'+nodeMarkup(id)+'</div>'+
    (id===selected?'<span class="jui-resizer" title="Drag untuk resize" data-resize="1" aria-label="Resize '+TITLES[id]+'"></span>':'');
  nodes.append(div);
 });
 list.replaceChildren();
 for(const id of HL.ELEMENTS){
  const btn=document.createElement('button');btn.type='button';btn.textContent=TITLES[id];
  btn.dataset.juiSelect=id;if(id===selected)btn.classList.add('primary');
  btn.onclick=()=>{selected=id;if(id==='phone')preview='phone';else if(id==='bag')preview='bag';draw();};
  list.append(btn);
 }
 paintInspector();
}
function paintInspector(){
 const s=slot();const box=styleRect(s,selected);
 inspector.innerHTML='<h4>'+TITLES[selected]+'</h4><p>Geser langsung di preview. Tarik sudut kanan bawah untuk resize (scale).</p>'+
  '<label>Anchor<select id="juiAnchor">'+HL.ANCHORS.map(a=>'<option value="'+a+'"'+(a===s.anchor?' selected':'')+'>'+a+'</option>').join('')+'</select></label>'+
  '<div class="jui-numbers"><label>X offset (px)<input id="juiX" type="number" min="-480" max="480" step="1" value="'+s.x+'"></label>'+
  '<label>Y offset (px)<input id="juiY" type="number" min="-480" max="480" step="1" value="'+s.y+'"></label></div>'+
  '<label>Ukuran / scale <strong id="juiScaleValue">'+Math.round(s.scale*100)+'%</strong>'+
  '<input id="juiScale" type="range" min="0.5" max="1.5" step="0.01" value="'+s.scale+'"></label>'+
  '<p class="jui-hint">Posisi preview: '+Math.round(box.x)+', '+Math.round(box.y)+' · Scale '+s.scale.toFixed(2)+'×</p>';
 const patch=(f)=>{const l=current();f(l[profile][selected]);setLayout(l);draw();};
 $('juiAnchor').onchange=e=>patch(s=>s.anchor=e.target.value);
 $('juiX').onchange=e=>patch(s=>s.x=clamp(safeNum(e.target.value),-480,480));
 $('juiY').onchange=e=>patch(s=>s.y=clamp(safeNum(e.target.value),-480,480));
 $('juiScale').onchange=e=>patch(s=>s.scale=clamp(safeNum(e.target.value,1),.5,1.5));
}
function begin(ev){
 const el=ev.target.closest('.jui-node');if(!el||ev.button>0)return;
 const id=el.dataset.id,wasSelected=selected===id;selected=id;
 const s=slot(id),d=DEVICES[profile],r=stage.getBoundingClientRect();
 drag={id,mode:ev.target.closest('[data-resize]')?'resize':'move',startX:ev.clientX,startY:ev.clientY,
  original:{...s},device:d,viewW:r.width,viewH:r.height};
 ev.preventDefault();
 try{stage.setPointerCapture(ev.pointerId);}catch{}
 if(!wasSelected)draw();else paintInspector();
}
function move(ev){
 if(!drag)return;
 const d=drag.device;
 const dx=(ev.clientX-drag.startX)*d.w/Math.max(1,drag.viewW);
 const dy=(ev.clientY-drag.startY)*d.h/Math.max(1,drag.viewH);
 const next={...drag.original};
 if(drag.mode==='resize'){
  const sz=SIZES[drag.id],ratio=Math.max(dx/sz.w,dy/sz.h);
  next.scale=clamp(Math.round((drag.original.scale+ratio)*100)/100,.5,1.5);
 }else{
  const signX=next.anchor.includes('right')?-1:1,signY=next.anchor.includes('bottom')?-1:1;
  next.x=clamp(Math.round(drag.original.x+dx*signX),-480,480);
  next.y=clamp(Math.round(drag.original.y+dy*signY),-480,480);
 }
 const rect=styleRect(next,drag.id),node=nodes.querySelector('.jui-node[data-id="'+drag.id+'"]');
 if(node){
  node.style.left=(rect.x/d.w*100)+'%';node.style.top=(rect.y/d.h*100)+'%';
  node.style.width=(rect.w/d.w*100)+'%';node.style.height=(rect.h/d.h*100)+'%';
 }
 const f=$('juiInspector');
 if(f){f.querySelector('#juiX').value=next.x;f.querySelector('#juiY').value=next.y;
  f.querySelector('#juiScale').value=next.scale;f.querySelector('#juiScaleValue').textContent=Math.round(next.scale*100)+'%';}
 drag.next=next;
}
function end(){
 if(!drag)return;
 const d=drag;drag=null;
 if(!d.next){draw();return;}
 const layout=current();layout[profile][d.id]=HL.normalizeSlot(d.next,layout[profile][d.id]);
 setLayout(layout);draw();
}
stage.addEventListener('pointerdown',begin);
stage.addEventListener('pointermove',move);
stage.addEventListener('pointerup',end);
stage.addEventListener('pointercancel',end);
for(const kind of ['desktop','phone'])$('jui'+(kind==='desktop'?'Desktop':'Phone')).onclick=()=>{
 profile=kind;draw();notice('Profil '+(kind==='desktop'?'Desktop':'Phone')+' · editing hanya profil aktif');};
for(const kind of ['game','phone','bag'])$('juiView_'+kind).onclick=()=>{preview=kind;draw();};
$('juiReset').onclick=()=>{
 if(!confirm('Reset layout profil '+profile+' ke default?'))return;
 const layout=current();layout[profile]=profile==='desktop'?HL.desktopProfile():HL.phoneProfile();
 setLayout(layout);draw();
};
$('juiSave').onclick=()=>{
 document.getElementById('save')?.click();
 dirty=false;notice('Save requested · periksa status SAVED pada toolbar Jiwa.');
};
$('juiOpenSemesta').onclick=()=>root.open('../world-builder/','_blank','noopener');
function render(){if(!B.get())return;draw();}
root.addEventListener('jiwa:ui-layout:render',render);
root.addEventListener('jiwa:gameplay',()=>{if(!drag)render();});
root.addEventListener('jiwa:world-sync',render);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);else render();
root.JiwaUIVisualEditor=Object.freeze({render,profile:()=>profile,selected:()=>selected});
})(window);
