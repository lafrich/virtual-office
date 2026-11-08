/* mainkan.exe owns player UI / onboarding while the existing Semesta WebGL iframe owns the world engine.
 * The flow graph is validated, read-only at runtime and received from Flow Editor via postMessage only in preview mode.
 * Production flows are bundled in flow-model.js; exporting a JSON file is author-only and never writes browser state.
 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const F=window.MainkanFlow;
const screens=['splashScreen','welcomeScreen','loginScreen','characterScreen','confirmScreen','loadingScreen','tutorialScreen','gameScreen','pauseScreen','messageScreen'];
const base=String(window.MAINKAN_CONFIG?.apiBase||'').replace(/\/$/,'');
const apiReady=/^https:\/\//i.test(base)||/^http:\/\/localhost(?::\d+)?$/i.test(base);
const allowed=['ichsan','noor','theodore'];
const frame=$('semestaFrame');
const unavailable='Login online belum tersedia. Backend autentikasi belum dikonfigurasi. Gunakan Mainkan Preview.';
const previewMode=new URLSearchParams(location.search).get('flowPreview')==='1';
let graph=F.preset('default'),currentNode=null,stage='splashScreen',loginMode='login';
let guest=true,session=null,selected='ichsan',profile=null,characterDraft=null,worldCounter=0;
let previewApplied=false,booted=false,sequence=0,firstTime=true,worldReady=false;
let splashSeen=new Set(),pauseRequested=false;
const assets=new Map(),directions=['SE','SW','NW','NE'],expressions=['','smile','happy','sad','surpr','sleepy'];
let charDirection=0,charWalk=false,charExpression=0,charTick=0;
function message(id,text,error){
 const el=$(id);if(!el)return;el.textContent=text;el.classList.toggle('error',!!error);
}
function screen(name){
 stage=name;
 document.body.classList.toggle('mainkan-playing',name==='gameScreen'||name==='pauseScreen');
 screens.forEach(id=>{$(id).hidden=id!==name;});
 $('statusText').textContent=name==='gameScreen'?'SEMESTA / NATIVE PLAY':name==='characterScreen'?'CHARACTER CREATOR':name==='pauseScreen'?'GAME MENU':name.toUpperCase();
}
function find(id){return F.get(graph,id);}
function nextFrom(n,branch){
 const id=F.next(graph,n,branch);
 if(!id&&n.type!=='game')message('authMessage','Flow node '+n.id+' has no NEXT link.',true);
 return id;
}
function chooseBranch(n){
 if(guest&&n.routes?.guest)return 'guest';
 if(profile?.character&&n.routes?.returning)return 'returning';
 if(firstTime&&n.routes?.first_time)return 'first_time';
 return 'default';
}
function showNode(id){
 let count=0;
 while(id&&count++<40){
  const n=find(id);
  if(!n){console.warn('Mainkan flow target missing:',id);return;}
  if(n.enabled===false){id=nextFrom(n);continue;}
  if(n.type==='branch'){id=nextFrom(n,chooseBranch(n));continue;}
  if(n.type==='splash'){
   const repeated=n.showRule==='once_per_session'&&splashSeen.has(n.id);
   const oldPlayer=n.showRule==='first_time_player'&&!firstTime;
   if(repeated||oldPlayer){id=nextFrom(n);continue;}
  }
  currentNode=n;
  sequence++;
  const ticket=sequence;
  switch(n.type){
   case 'splash':{
    screen('splashScreen');
    splashSeen.add(n.id);
    $('progressFill').style.width='0%';
    $('bootText').textContent=n.description||'Memuat dunia virtual Indonesia...';
    let repeats=Math.max(1,Math.min(5,n.showCount||1));
    const duration=Math.max(0,Math.min(15000,Number(n.duration)||0));
    let index=0;
    function part(){
     if(ticket!==sequence)return;
     index++;$('progressFill').style.width=(100*index/repeats)+'%';
     $('bootText').textContent=(n.description||'Mainkan.exe startup')+' ('+index+'/'+repeats+')';
     if(index<repeats)setTimeout(part,duration);
     else setTimeout(()=>{if(ticket===sequence)showNode(nextFrom(n));},duration);
    }
    part();$('skipSplash').hidden=n.skippable!==true;return;
   }
   case 'welcome':
    screen('welcomeScreen');$('welcomeCopy').textContent=n.description||'Bikin karakter, masuk kota, cari pekerjaan, dan jalani hidupmu.';return;
   case 'auth':
    screen('loginScreen');return;
   case 'character':
    screen('characterScreen');drawAvatar();return;
   case 'confirm':
    drawConfirm();screen('confirmScreen');return;
   case 'loading':{
    screen('loadingScreen');$('loadingCopy').textContent=n.description||'Menghubungkan Mainkan ke engine Semesta.';
    $('enterProgress').style.width='8%';
    requestAnimationFrame(()=>$('enterProgress').style.width='100%');
    setTimeout(()=>{if(sequence===ticket)showNode(nextFrom(n));},Math.max(0,Math.min(15000,Number(n.duration)||0)));return;
   }
   case 'tutorial':
    screen('tutorialScreen');$('tutorialSkip').hidden=n.skippable!==true;return;
   case 'game':
    startWorld();return;
   case 'pause':
    screen('pauseScreen');pauseRequested=true;frame.contentWindow?.postMessage({type:'mainkan:pause'},location.origin);return;
   case 'message':
    screen('messageScreen');$('customTitle').textContent=n.title||'Screen';
    $('customDescription').textContent=n.description||'Continue';return;
  }
  id=nextFrom(n);
 }
 if(count>=40)console.warn('Mainkan flow stopped: automatic navigation loop');
}
function branchCurrent(label){
 if(!currentNode)return;
 const next=nextFrom(currentNode,label);
 if(next)showNode(next);
}
function fallbackId(type){
 const found=graph.nodes.find(n=>n.type===type&&n.enabled!==false);
 return found?.id||null;
}
function showType(type){
 const id=fallbackId(type);
 if(id)showNode(id);
}
function switchGuest(){
 guest=true;session=null;profile=null;firstTime=true;
 const auth=currentNode?.type==='auth'?currentNode:graph.nodes.find(n=>n.type==='auth');
 if(auth)showNode(nextFrom(auth,'guest'));
 else showType('character');
}
$('skipSplash').addEventListener('click',()=>branchCurrent());
$('welcomeContinue').addEventListener('click',()=>branchCurrent());
$('welcomeGuest').addEventListener('click',switchGuest);
$('guestButton').addEventListener('click',switchGuest);
$('backToLogin').addEventListener('click',()=>showType('auth'));
$('confirmBack').addEventListener('click',()=>showType('character'));
$('confirmGo').addEventListener('click',async()=>{
 if(!characterDraft){message('confirmMessage','Karakter belum lengkap.',true);return;}
 const button=$('confirmGo');button.disabled=true;
 try{
  if(!guest){
   const data=await request('/players/profile',{method:'PUT',body:JSON.stringify({character:characterDraft})});
   if(data.saved!==true)throw Error('Server belum mengonfirmasi penyimpanan karakter.');
   profile={...(profile||{}),...(data.player||{}),character:characterDraft};
  }else profile={character:characterDraft};
  const n=currentNode;showNode(nextFrom(n));
 }catch(err){message('confirmMessage',err.message,true);}
 finally{button.disabled=false;}
});
$('tutorialDone').addEventListener('click',()=>branchCurrent());
$('tutorialSkip').addEventListener('click',()=>branchCurrent());
$('customContinue').addEventListener('click',()=>branchCurrent());
$('pauseButton').addEventListener('click',()=>{
 if(stage==='gameScreen'){
  if(currentNode?.type==='game'&&find(currentNode.next)?.type==='pause')showNode(currentNode.next);
  else showType('pause');
 }
});
$('resumeGame').addEventListener('click',()=>{
 frame.contentWindow?.postMessage({type:'mainkan:resume'},location.origin);
 pauseRequested=false;showType('game');
});
function returnToMenu(){
 if(frame.getAttribute('src'))frame.removeAttribute('src');
 worldReady=false;pauseRequested=false;
 showType('welcome');
}
$('pauseExit').addEventListener('click',returnToMenu);
$('exitGame').addEventListener('click',returnToMenu);
$('homeButton').addEventListener('click',returnToMenu);
$('reloadWorld').addEventListener('click',()=>{frame.removeAttribute('src');worldReady=false;startWorld(true);});
function setLoginMode(value){
 loginMode=value;
 for(const name of ['login','register']){
  const button=$(name+'Tab'),active=name===value;
  button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active));
 }
 $('authSubmit').textContent=value==='register'?'Daftar':'Login';
 $('password').autocomplete=value==='register'?'new-password':'current-password';
 message('authMessage',apiReady?'':unavailable,!apiReady);
}
$('loginTab').addEventListener('click',()=>setLoginMode('login'));
$('registerTab').addEventListener('click',()=>setLoginMode('register'));
async function request(path,options){
 if(!apiReady)throw Error(unavailable);
 const response=await fetch(base+path,{credentials:'include',headers:{'Content-Type':'application/json'},...options});
 let data={};try{data=await response.json();}catch{}
 if(!response.ok)throw Error(data.message||'Server menolak permintaan ('+response.status+').');
 return data;
}
$('authForm').addEventListener('submit',async e=>{
 e.preventDefault();
 if(!apiReady){message('authMessage',unavailable,true);return;}
 const button=$('authSubmit');button.disabled=true;
 try{
  const result=await request(loginMode==='register'?'/auth/register':'/auth/login',{
   method:'POST',body:JSON.stringify({email:$('email').value.trim(),password:$('password').value})
  });
  if(result.authenticated!==true)throw Error('Server belum mengonfirmasi sesi login.');
  $('password').value='';guest=false;session=result;profile=result.player||null;
  firstTime=!profile?.character;
  if(profile.character&&allowed.includes(profile.character.asset))selected=profile.character.asset;
  const route=profile.character?'returning':'new_player';
  branchCurrent(route);
 }catch(err){message('authMessage',err.message||'Login gagal',true);}
 finally{button.disabled=false;}
});
function zodiacFromBirthday(value){
 const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value||'');if(!match)return '';
 const month=Number(match[2]),day=Number(match[3]);
 const validDate=new Date(Date.UTC(+match[1],month-1,day));
 if(validDate.getUTCFullYear()!==+match[1]||validDate.getUTCMonth()+1!==month||validDate.getUTCDate()!==day)return '';
 const md=month*100+day;
 const all=[[120,'Capricorn'],[219,'Aquarius'],[320,'Pisces'],[420,'Aries'],[521,'Taurus'],[621,'Gemini'],[722,'Cancer'],[823,'Leo'],[923,'Virgo'],[1023,'Libra'],[1122,'Scorpio'],[1222,'Sagittarius'],[1231,'Capricorn']];
 return all.find(([boundary])=>md<=boundary)?.[1]||'Capricorn';
}
$('birthday').max=new Date().toISOString().slice(0,10);
$('birthday').addEventListener('change',e=>{const z=zodiacFromBirthday(e.target.value);if(z)$('zodiac').value=z;});
function selectCharacter(asset){
 if(!allowed.includes(asset))return;
 selected=asset;
 document.querySelectorAll('.choice').forEach(el=>{
  const yes=el.dataset.character===asset;
  el.classList.toggle('selected',yes);el.setAttribute('aria-pressed',String(yes));
 });
 drawAvatar(true);
}
document.querySelectorAll('.choice').forEach(el=>el.addEventListener('click',()=>selectCharacter(el.dataset.character)));
const rootAssets='https://raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/main/game/assets/chars/';
function spriteUrl(asset,expr){return rootAssets+asset+'_v6b_'+(expr?'f'+expr+'.png':'sheet.png');}
function loadSprite(asset,expression){
 const key=asset+'|'+(expression||'');
 if(assets.has(key))return assets.get(key);
 const image=new Image(),rec={image,ready:false,failed:false};
 image.onload=()=>{rec.ready=true;};
 image.onerror=()=>{rec.failed=true;};
 image.src=spriteUrl(asset,expression);
 assets.set(key,rec);return rec;
}
document.querySelectorAll('.choice img').forEach(img=>{
 const asset=img.parentNode?.dataset.character,rec=loadSprite(asset,'');
 const thumbnail=document.createElement('canvas');thumbnail.width=64;thumbnail.height=112;
 thumbnail.style.width='38px';thumbnail.style.height='65px';thumbnail.style.imageRendering='pixelated';
 img.replaceWith(thumbnail);
 function draw(){
  if(!rec.ready){if(!rec.failed)setTimeout(draw,140);return;}
  const c=thumbnail.getContext('2d');c.imageSmoothingEnabled=false;
  c.clearRect(0,0,64,112);c.drawImage(rec.image,0,0,64,112,0,0,64,112);
 }
 draw();
});
function drawAvatar(){
 if(stage!=='characterScreen')return;
 const c=$('charPreview'),g=c.getContext('2d');g.imageSmoothingEnabled=false;
 g.clearRect(0,0,64,112);
 const expr=expressions[charExpression];
 const data=loadSprite(selected,expr);
 const backup=loadSprite(selected,'');
 const use=data.ready?data:backup.ready?backup:null;
 if(use){
  const x=(charWalk?Math.floor(charTick/5)%6:0)*64,y=charDirection*112;
  try{g.drawImage(use.image,x,y,64,112,0,0,64,112);}catch{}
 }else{
  g.fillStyle='#688aa8';g.fillRect(21,46,22,44);g.fillStyle='#edc4a0';g.fillRect(22,15,20,31);
 }
 $('previewDirection').textContent='Direction '+directions[charDirection]+' · '+(charWalk?'Walk':'Idle')+(expr?' · '+expr:'');
}
$('charRotate').addEventListener('click',()=>{charDirection=(charDirection+1)%4;drawAvatar();});
$('charAnimate').addEventListener('click',()=>{charWalk=!charWalk;drawAvatar();});
$('charExpression').addEventListener('click',()=>{charExpression=(charExpression+1)%expressions.length;drawAvatar();});
setInterval(()=>{if(stage==='characterScreen'){charTick++;drawAvatar();}},170);
const fields=['hairStyle','hairColor','skinTone','topStyle','topColor','pantsStyle','pantsColor','shoesStyle','shoesColor','glasses','facialHair'];
$('characterForm').addEventListener('submit',e=>{
 e.preventDefault();
 const name=$('playerName').value.trim(),birth=$('birthday').value,zodiac=$('zodiac').value;
 if(name.length<2||!zodiac){message('characterMessage','Nickname dan zodiak wajib diisi.',true);return;}
 if(birth&&(birth>new Date().toISOString().slice(0,10)||!zodiacFromBirthday(birth))){
  message('characterMessage','Tanggal lahir tidak valid.',true);return;
 }
 const appearance={};for(const id of fields)appearance[id]=$ (id).value;
 characterDraft={name,zodiac,birthday:birth||null,asset:selected,
  gender:selected==='ichsan'?'male':selected==='noor'?'female':'astro',appearance};
 if(currentNode?.type==='character')branchCurrent();
 else showType('confirm');
});
function drawConfirm(){
 if(!characterDraft){
  characterDraft={name:$('playerName').value.trim()||'Preview',zodiac:$('zodiac').value||'Capricorn',asset:selected};
 }
 const ch=characterDraft;
 const lines=[
  ['Nickname',ch.name],['Birthday',ch.birthday||'Not entered'],['Zodiac',ch.zodiac],
  ['Body',ch.gender],['Base rig',ch.asset],
  ['Hair',ch.appearance?(ch.appearance.hairStyle+' · '+ch.appearance.hairColor):'Default'],
  ['Clothing',ch.appearance?(ch.appearance.topStyle+' / '+ch.appearance.pantsStyle):'Default'],
  ['Shoes',ch.appearance?ch.appearance.shoesStyle:'Default']
 ];
 const el=$('confirmList');el.replaceChildren();
 for(const [label,value] of lines){
  const line=document.createElement('div'),strong=document.createElement('strong');
  strong.textContent=label+': ';line.append(strong,document.createTextNode(String(value)));el.append(line);
 }
 message('confirmMessage',guest?'Guest Preview: akun tidak disimpan online.':'Saat lanjut, karakter dikirim ke backend.');
}
function startWorld(force=false){
 screen('gameScreen');$('cityName').textContent='SEMESTA • Native Runtime';
 if(!force&&frame.getAttribute('src')&&worldReady){
  if(pauseRequested)frame.contentWindow?.postMessage({type:'mainkan:resume'},location.origin);
  pauseRequested=false;return;
 }
 worldReady=false;$('worldLoading').hidden=false;
 $('worldLoading').textContent='Memuat world WebGL, Jiwa, physics dan asset Semesta...';
 $('worldLabel').textContent='World asli Semesta • perangkat ini';
 const url=new URL('../world-builder/',location.href);
 url.searchParams.set('player','1');
 url.searchParams.set('character',selected);
 url.searchParams.set('v',String(++worldCounter));
 frame.src=url.href;
}
window.addEventListener('message',e=>{
 if(e.origin!==location.origin||!e.data)return;
 if(previewMode&&e.source===window.parent&&e.data.type==='mainkan:flow-config'){
  if(previewApplied)return;
  try{graph=F.normalize(e.data.flow);previewApplied=true;booted=true;showNode(graph.start);}
  catch(err){console.warn('Invalid editor flow',err);}
  return;
 }
 if(e.source!==frame.contentWindow)return;
 if(e.data.type==='mainkan:semesta-ready'){
  worldReady=true;
  $('worldLoading').hidden=true;
  $('cityName').textContent=e.data.city||'SEMESTA • Native World';
  $('worldLabel').textContent='Semesta WebGL · '+Number(e.data.count||0)+' objek · '+(guest?'Guest':'Player');
  $('statusText').textContent='SEMESTA • PLAYER READY';
  if(pauseRequested)frame.contentWindow?.postMessage({type:'mainkan:pause'},location.origin);
  else try{frame.focus();}catch{}
 }else if(e.data.type==='mainkan:semesta-error'){
  $('worldLoading').textContent=e.data.message||'Semesta tidak bisa dimuat. Coba Reload.';
  $('statusText').textContent='SEMESTA • ERROR';
 }
});
$('importPlayerFlow').addEventListener('click',()=>$('importFlowFile').click());
$('importFlowFile').addEventListener('change',async e=>{
 const file=e.target.files?.[0];e.target.value='';if(!file)return;
 if(file.size>250000){$('statusText').textContent='IMPORT FAILED • FILE TOO LARGE';return;}
 try{
  const parsed=F.normalize(JSON.parse(await file.text()));
  if(frame.getAttribute('src'))frame.removeAttribute('src');
  graph=parsed;sequence++;splashSeen.clear();worldReady=false;booted=true;
  $('statusText').textContent='FLOW IMPORTED • '+graph.name;
  showNode(graph.start);
 }catch(err){$('statusText').textContent='IMPORT ERROR: '+String(err.message).slice(0,80);}
});
function startup(){
 if(booted)return;
 booted=true;showNode(graph.start);setLoginMode('login');
}
if(previewMode){
 if(window.parent!==window)window.parent.postMessage({type:'mainkan:flow-request'},location.origin);
 setTimeout(startup,1600);
}else startup();
function clock(){$('clock').textContent=new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});}
clock();setInterval(clock,60000);
})();
