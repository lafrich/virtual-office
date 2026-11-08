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
  $('gameNeeds').textContent='Hunger '+fmtNeed(st,'hunger')+' · Energy '+fmtNeed(st,'energy');
 }
 setInterval(poll,900);
 iframe.addEventListener('load',()=>{setTimeout(poll,150);});
})();
