/* Mainkan.exe: player onboarding shell for the ORIGINAL Semesta engine.
 * Do not draw a second map, reimplement collisions or copy Semesta assets.
 * Semesta ?player=1 owns WebGL, physics, Jiwa, camera, traffic and HUD.
 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const screens=['splashScreen','loginScreen','characterScreen','gameScreen'];
const base=String(window.MAINKAN_CONFIG?.apiBase||'').replace(/\/$/,'');
const apiReady=/^https:\/\//i.test(base)||/^http:\/\/localhost(?::\d+)?$/i.test(base);
const allowed=['ichsan','noor','theodore'];
const frame=$('semestaFrame');
const unavailable='Login online belum tersedia. Backend autentikasi belum dikonfigurasi. Gunakan Mainkan Preview.';
let stage='splashScreen',loginMode='login',guest=true,session=null,selected='ichsan',profile=null,worldCounter=0;
function message(id,text,error){
 const el=$(id);el.textContent=text;el.classList.toggle('error',!!error);
}
function screen(name){
 stage=name;
 document.body.classList.toggle('mainkan-playing',name==='gameScreen');
 screens.forEach(id=>{$(id).hidden=id!==name;});
 $('statusText').textContent=name==='gameScreen'?'SEMESTA / LIVE PLAY':name==='characterScreen'?'CHARACTER PREVIEW':name==='loginScreen'?'ACCOUNT / GUEST':'BOOTING';
}
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
async function request(path,options){
 if(!apiReady)throw Error(unavailable);
 const r=await fetch(base+path,{credentials:'include',headers:{'Content-Type':'application/json'},...options});
 let data={};try{data=await r.json();}catch{}
 if(!r.ok)throw Error(data.message||'Server menolak permintaan ('+r.status+').');
 return data;
}
function setLoginMode(value){
 loginMode=value;
 for(const name of ['login','register']){
  const button=$(name+'Tab'),active=name===value;
  button.classList.toggle('active',active);
  button.setAttribute('aria-selected',String(active));
 }
 $('authSubmit').textContent=value==='register'?'Daftar':'Login';
 $('password').autocomplete=value==='register'?'new-password':'current-password';
 message('authMessage',apiReady?'':unavailable,!apiReady);
}
$('loginTab').addEventListener('click',()=>setLoginMode('login'));
$('registerTab').addEventListener('click',()=>setLoginMode('register'));
$('authForm').addEventListener('submit',async e=>{
 e.preventDefault();
 if(!apiReady){message('authMessage',unavailable,true);return;}
 const btn=$('authSubmit');btn.disabled=true;
 try{
  const result=await request(loginMode==='register'?'/auth/register':'/auth/login',{
   method:'POST',body:JSON.stringify({email:$('email').value.trim(),password:$('password').value})
  });
  if(result.authenticated!==true)throw Error('Server belum mengonfirmasi sesi.');
  $('password').value='';guest=false;session=result;profile=result.player||null;
  if(profile?.character && allowed.includes(profile.character.asset)){
   selected=profile.character.asset;enterWorld();
  }else screen('characterScreen');
 }catch(err){message('authMessage',err.message,true);}
 finally{btn.disabled=false;}
});
$('guestButton').addEventListener('click',()=>{guest=true;session=null;profile=null;screen('characterScreen');});
$('backToLogin').addEventListener('click',()=>screen('loginScreen'));
function selectCharacter(asset){
 if(!allowed.includes(asset))return;
 selected=asset;
 document.querySelectorAll('.choice').forEach(el=>{
  const active=el.dataset.character===asset;
  el.classList.toggle('selected',active);
  el.setAttribute('aria-pressed',String(active));
 });
}
document.querySelectorAll('.choice').forEach(el=>el.addEventListener('click',()=>selectCharacter(el.dataset.character)));
document.querySelectorAll('.choice img').forEach(img=>{
 const source=img.getAttribute('src'),native=new Image();
 native.onload=()=>{
  const tile=document.createElement('canvas');
  tile.width=64;tile.height=112;tile.style.width='54px';tile.style.height='94px';tile.style.imageRendering='pixelated';
  const c=tile.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(native,0,0,64,112,0,0,64,112);
  img.replaceWith(tile);
 };
 native.onerror=()=>{img.style.visibility='hidden';};
 native.src=source;
});
$('characterForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const name=$('playerName').value.trim(),zodiac=$('zodiac').value;
 if(name.length<2||!zodiac){message('characterMessage','Nama dan zodiak wajib diisi.',true);return;}
 const character={name,zodiac,asset:selected,gender:selected==='ichsan'?'male':selected==='noor'?'female':'astro'};
 if(!guest){
  try{
   const result=await request('/players/profile',{method:'PUT',body:JSON.stringify({character})});
   if(result.saved!==true)throw Error('Server belum mengonfirmasi penyimpanan karakter.');
   profile={...(profile||{}),...(result.player||{}),character};
  }catch(err){message('characterMessage','Karakter belum tersimpan: '+err.message,true);return;}
 }else profile={character};
 enterWorld();
});
function enterWorld(){
 screen('gameScreen');
 $('worldLoading').hidden=false;
 $('worldLoading').textContent='Menjalankan Semesta asli: renderer WebGL, physics, Jiwa dan aset...';
 $('cityName').textContent='SEMESTA • Native Runtime';
 $('worldLabel').textContent='Memuat kota dari Semesta (working city pada perangkat ini)...';
 const url=new URL('../world-builder/',location.href);
 url.searchParams.set('player','1');
 url.searchParams.set('character',selected);
 url.searchParams.set('v',''+(++worldCounter));
 frame.src=url.href;
}
window.addEventListener('message',e=>{
 if(stage!=='gameScreen'||e.origin!==location.origin||e.source!==frame.contentWindow||!e.data)return;
 if(e.data.type==='mainkan:semesta-ready'){
  $('worldLoading').hidden=true;
  $('cityName').textContent=e.data.city||'SEMESTA • Native World';
  $('worldLabel').textContent='Semesta WebGL asli • '+Number(e.data.count||0)+' objek • '+(guest?'Guest Preview':'Player Preview');
  $('statusText').textContent='SEMESTA • PLAYER MODE READY';
  try{frame.focus();}catch{}
 }else if(e.data.type==='mainkan:semesta-error'){
  $('worldLoading').textContent=e.data.message||'Gagal menjalankan Semesta. Tekan Reload.';
  $('statusText').textContent='SEMESTA • PLAYER ERROR';
 }
});
$('reloadWorld').addEventListener('click',()=>enterWorld());
$('exitGame').addEventListener('click',()=>{
 // Closing the iframe ends the local play loop; it does not save editor state.
 frame.removeAttribute('src');screen('loginScreen');
});
$('homeButton').addEventListener('click',()=>{
 if(stage==='gameScreen')frame.removeAttribute('src');
 screen('loginScreen');
});
function clock(){
 $('clock').textContent=new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
}
clock();setInterval(clock,60000);
$('skipSplash').addEventListener('click',()=>{if(stage==='splashScreen')screen('loginScreen');});
(async function startup(){
 const parts=['Mempersiapkan mainkan.exe...','Menyiapkan sesi player...','Memuat Semesta native renderer saat mulai bermain...'];
 for(let i=0;i<parts.length;i++){
  if(stage!=='splashScreen')break;
  $('bootText').textContent=parts[i];$('progressFill').style.width=((i+1)*33.34)+'%';
  await sleep(matchMedia('(prefers-reduced-motion:reduce)').matches?15:260);
 }
 if(stage==='splashScreen')screen('loginScreen');
 setLoginMode('login');
})();
})();
