/* Jiwa.exe — same-origin character-root selector.
 * Reads Mahluk Hidup 2's published V6B characters in the same storage that
 * Semesta and Bangun Ruang already use. Does NOT edit game mechanics.
 */
(function(g){
 'use strict';
 const SOURCE='mahluk-2-library-v1',ACTIVE='jiwa-sandbox-actor-v1';
 const $=id=>document.getElementById(id);
 let rows=[],selection='';
 const valid=r=>r?.format==='mahluk-2-character-v1'&&
  /^mh2_[a-z0-9]+$/.test(r.id||'')&&typeof r.name==='string'&&
  typeof r.sprite==='string'&&/^data:image\/png;base64,[a-zA-Z0-9+/=]+$/.test(r.sprite)&&
  r.sprite.length<1250000;
 const read=()=>{
  try{const v=JSON.parse(localStorage.getItem(SOURCE)||'[]');
   return Array.isArray(v)?v.filter(valid).slice(-40):[];
  }catch{return []}
 };
 function draw(record){
  const canvas=$('jiwaActorPreview');if(!canvas)return;
  const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(!record)return;
  const img=new Image();
  img.onload=()=>{
   if(selection===record.id&&img.naturalWidth>=64&&img.naturalHeight>=448)
    ctx.drawImage(img,0,0,64,112,0,0,canvas.width,canvas.height);
  };
  img.src=record.sprite;
 }
 function refresh(){
  rows=read();const select=$('jiwaActor'),status=$('jiwaActorStatus');
  if(!select)return;
  const old=selection||select.value;
  select.replaceChildren();
  const empty=document.createElement('option');empty.value='';empty.textContent='NO CHARACTER / TEST SYSTEM ONLY';
  select.append(empty);
  for(const r of rows){
   const opt=document.createElement('option');opt.value=r.id;
   opt.textContent=r.name+' / '+(r.facelessBase||r.base||'HUMAN').toUpperCase();
   select.append(opt);
  }
  selection=rows.some(x=>x.id===old)?old:'';
  select.value=selection;
  if(status)status.textContent=rows.length?
   rows.length+' SHARED CHARACTER ROOT(S) · SOURCE MAHLUK HIDUP 2 · SE PREVIEW':
   'NO SAVED ROOTS · INSTALL MALE/FEMALE IN MAHLUK HIDUP 2 FIRST';
  draw(rows.find(r=>r.id===selection));
  return rows.length;
 }
 function select(id){
  if(!rows.some(r=>r.id===id))id='';
  selection=id;
  const control=$('jiwaActor');if(control)control.value=id;
  try{localStorage.setItem(ACTIVE,id)}catch{}
  draw(rows.find(r=>r.id===id));
 }
 if($('jiwaActor')){
  try{selection=localStorage.getItem(ACTIVE)||''}catch{}
  $('jiwaActor').onchange=e=>select(e.target.value);
  $('jiwaSyncActors').onclick=refresh;
  window.addEventListener('storage',e=>{
   if(e.key===SOURCE)refresh();
  });
  window.addEventListener('focus',refresh);
  refresh();
 }
 g.JiwaActorLink=Object.freeze({
  get id(){return selection},
  get record(){return rows.find(r=>r.id===selection)||null},
  list:()=>rows.slice(),
  refresh
 });
})(window);
