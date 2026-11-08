/* Mainkan owns the player-facing HUD. Semesta retains only game systems and Nokia/Bag implementation.
 * Same-origin iframe bridge avoids copying the gameplay code or maintaining two economies.
 */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const iframe=$('semestaFrame');
 function nativeButton(id){
  try{return iframe.contentWindow?.document?.getElementById(id)||null;}
  catch{return null;}
 }
 function nativeClick(id){
  const button=nativeButton(id);
  if(button){button.click();try{iframe.focus();}catch{}}
 }
 $('gamePhone').addEventListener('click',()=>nativeClick('ptPhoneBtn'));
 $('gameBag').addEventListener('click',()=>nativeClick('ptBagBtn'));
 const action=$('gameAction');action.style.touchAction='none';
 const trigger=type=>{
  const inner=nativeButton('ptActionBtn');
  if(!inner)return;
  const e=new PointerEvent(type,{bubbles:true,pointerType:'touch',pointerId:1});
  inner.dispatchEvent(e);
 };
 action.addEventListener('pointerdown',e=>{
  if(!nativeButton('ptActionBtn'))return;
  e.preventDefault();
  try{action.setPointerCapture(e.pointerId);}catch{}
  trigger('pointerdown');
 });
 for(const type of ['pointerup','pointercancel','lostpointercapture']){
  action.addEventListener(type,()=>trigger(type==='pointerup'?'pointerup':'pointercancel'));
 }
 action.addEventListener('click',()=>nativeClick('ptActionBtn'));
 function number(value){
  const n=Number(value);return Number.isFinite(n)?n:null;
 }
 function fmtNeed(state,name){
  const n=number(state[name]??state.needs?.[name]);
  return n===null?'—':Math.max(0,Math.min(100,Math.round(n)))+'%';
 }
 function poll(){
  const game=document.getElementById('gameScreen');
  if(!game||game.hidden)return;
  let st=null;
  try{st=iframe.contentWindow?.SemestaLifePlay?.state?.();}catch{}
  if(!st)return;
  const amount=number(st.wallet??st.money??st.cash);
  if(amount!==null)$('gameWallet').textContent='Rp '+Math.round(amount).toLocaleString('id-ID');
 }

 // Mainkan positions its visible HUD against the actual world viewport.
 // The Semesta iframe keeps the same canonical HUD layout for popups.
 const bar=$('mainkanGameBar'),viewport=$('viewport');
 if(bar&&viewport)viewport.appendChild(bar);
 const HUD_ELEMENTS={money:'gameWallet',
  hpButton:'gamePhone',bagButton:'gameBag',action:'gameAction',run:'gameRun'};
 function layout(){
  const HL=window.VLHudLayout;
  if(!HL||!viewport||!bar)return null;
  const profile=HL.detectProfile(document);
  const saved=HL.resolveSavedLayout(null,localStorage);
  const slots=HL.normalize(saved?.layout||HL.defaults())[profile];
  const W=viewport.clientWidth,H=viewport.clientHeight;
  for(const [key,id] of Object.entries(HUD_ELEMENTS)){
   const el=$(id),slot=slots[key];if(!el||!slot)continue;
   const w=el.offsetWidth*slot.scale,h=el.offsetHeight*slot.scale;
   const [v,u]=slot.anchor.split('-');
   const x=u==='right'?W-w-slot.x:u==='center'?(W-w)/2+slot.x:slot.x;
   const y=v==='bottom'?H-h-slot.y:v==='center'?(H-h)/2+slot.y:slot.y;
   el.style.left=Math.max(0,Math.min(Math.max(0,W-w),x))+'px';
   el.style.top=Math.max(0,Math.min(Math.max(0,H-h),y))+'px';
   el.style.transform='scale('+slot.scale+')';
  }
  return {profile,slots};
 }
 const run=$('gameRun');
 if(run){
  run.style.touchAction='none';
  let held=false;
  function runEvent(type){
   const btn=nativeButton('ptRunBtn');if(!btn)return;
   btn.dispatchEvent(new PointerEvent(type,{bubbles:true,pointerId:1,pointerType:'touch'}));
  }
  run.addEventListener('pointerdown',e=>{
   if(!nativeButton('ptRunBtn'))return;
   e.preventDefault();held=true;run.classList.add('on');
   try{run.setPointerCapture(e.pointerId);}catch{}
   runEvent('pointerdown');
  });
  const release=()=>{
   if(!held)return;held=false;run.classList.remove('on');runEvent('pointerup');
  };
  ['pointerup','pointercancel','pointerleave','lostpointercapture'].forEach(e=>run.addEventListener(e,release));
 }
 if(typeof ResizeObserver!=='undefined'&&viewport)new ResizeObserver(layout).observe(viewport);
 window.addEventListener('resize',layout);
 window.addEventListener('pageshow',layout);
 window.addEventListener('storage',e=>{
  if(e.key===window.VLHudLayout?.GLOBAL_LAYOUT_KEY){
   layout();
   try{iframe.contentWindow?.SemestaPlay?.refreshHud?.();}catch{}
  }
 });
 window.MainkanHUDLayout=Object.freeze({refresh:layout,elements:HUD_ELEMENTS});
 layout();
 setInterval(poll,900);
 iframe.addEventListener('load',()=>{setTimeout(poll,150);layout();});
})();
