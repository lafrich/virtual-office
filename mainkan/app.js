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
const allowed=['genesis_male_nude','genesis_female_nude'];
const frame=$('semestaFrame');
const unavailable='Login tes belum terhubung. Gunakan Main Tanpa Akun.';
const previewMode=new URLSearchParams(location.search).get('flowPreview')==='1';
let graph=F.preset('default'),currentNode=null,stage='splashScreen',loginMode='login';
let testPlayerId='';
let guest=true,session=null,selected='genesis_male_nude',profile=null,characterDraft=null,worldCounter=0;
let previewApplied=false,booted=false,sequence=0,firstTime=true,worldReady=false;
let splashSeen=new Set(),pauseRequested=false;
const directions=['se','sw','ne','nw'],expressions=['neutral','happy','sad','angry','sleepy','surprised','fear','shy','cry'];
let charDirection=0,charWalk=false,charExpression=0,charTick=0,previewFrameShown=false;
function message(id,text,error){
 const el=$(id);if(!el)return;el.textContent=text;el.classList.toggle('error',!!error);
}
function screen(name){
 stage=name;
 document.body.classList.toggle('mainkan-playing',name==='gameScreen'||name==='pauseScreen');
 screens.forEach(id=>{$(id).hidden=id!==name;});
 $('statusText').textContent=({splashScreen:'Memuat…',welcomeScreen:'Menu Utama',loginScreen:'Login',characterScreen:'Buat Karakter',confirmScreen:'Konfirmasi Karakter',loadingScreen:'Masuk ke kota…',tutorialScreen:'Hari Pertama',gameScreen:'Main',pauseScreen:'Menu Jeda',messageScreen:'Info'})[name]||name;
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
     $('bootText').textContent=(n.description||'Memulai Namanya Juga Hidup')+' ('+index+'/'+repeats+')';
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
 guest=true;session=null;profile=null;testPlayerId='';firstTime=true;
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
   let data=null;
   try{data=await request('/players/profile',{method:'PUT',body:JSON.stringify({character:characterDraft})});}
   // No status = the browser blocked/failed the request (CORS preflight on the test Worker);
   // 403/404/405/501 = no save route. Either way keep the character on this device.
   catch(err){if(err.status&&![403,404,405,501].includes(err.status))throw err;}
   if(data&&data.saved!==true)throw Error('Server belum mengonfirmasi penyimpanan karakter.');
   // Test Worker has no profile route yet: keep the character on this device per player id.
   if(!data&&!saveLocalCharacter(characterDraft))throw Error('Karakter tidak bisa disimpan di perangkat ini.');
   profile={...(profile||{}),...(data?.player||{}),character:characterDraft};
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
$('retryWorld').addEventListener('click',()=>{frame.removeAttribute('src');worldReady=false;startWorld(true);});
function setLoginMode(value){
 loginMode='login';
 const loginBtn=$('loginTab'),registerBtn=$('registerTab');
 if(loginBtn){loginBtn.classList.add('active');loginBtn.setAttribute('aria-selected','true');}
 if(registerBtn){registerBtn.classList.remove('active');registerBtn.setAttribute('aria-selected','false');registerBtn.hidden=true;}
 $('authSubmit').textContent='Login';
 $('password').autocomplete='current-password';
 message('authMessage',apiReady?'':unavailable,!apiReady);
}
$('loginTab').addEventListener('click',()=>setLoginMode('login'));
$('registerTab').hidden=true;
// Per-player character on this device, used while the test Worker has no profile route.
function saveLocalCharacter(c){return !!window.MainkanLocalCharacter?.save(testPlayerId,c);}
function loadLocalCharacter(){const c=window.MainkanLocalCharacter?.load(testPlayerId);return c&&allowed.includes(c.base)?c:null;}
async function request(path,options){
 if(!apiReady)throw Error(unavailable);
 const response=await fetch(base+path,{credentials:'omit',headers:{'Content-Type':'application/json'},...options});
 let data={};try{data=await response.json();}catch{}
 if(!response.ok){const err=Error(data.message||'Server menolak permintaan ('+response.status+').');err.status=response.status;throw err;}
 return data;
}
$('authForm').addEventListener('submit',async e=>{
 e.preventDefault();
 if(!apiReady){message('authMessage',unavailable,true);return;}
 const button=$('authSubmit');button.disabled=true;
 try{
  const id=$('email').value.trim();
  const result=await request('/auth/login',{
   method:'POST',body:JSON.stringify({id,email:id,password:$('password').value})
  });
  if(result.authenticated!==true)throw Error('Server belum mengonfirmasi sesi login.');
  $('password').value='';guest=false;session=result;profile=result.player||null;
  testPlayerId=String(result.player?.id||result.id||id||'').toLowerCase();
  if(!profile?.character){const local=loadLocalCharacter();if(local)profile={...(profile||{}),character:local};}
  firstTime=!allowed.includes(profile?.character?.base);
  if(!firstTime)selected=profile.character.base;
  const route=firstTime?'new_player':'returning';
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
  const yes=el.dataset.character===asset;el.classList.toggle('selected',yes);
  el.setAttribute('aria-pressed',String(yes));
 });
 window.MainkanClassicCreator?.refresh?.();
 drawAvatar();
}
document.querySelectorAll('.choice').forEach(el=>el.addEventListener('click',()=>selectCharacter(el.dataset.character)));
function currentGenesisProfile(){
 const appearance={};
 for(const id of ['hairStyle','hairColor','skinTone','topStyle','topColor','pantsStyle','pantsColor','shoesStyle','shoesColor','glasses','facialHair'])
  appearance[id]=$(id)?.value||'';
 return window.VLGenesisPlayer?.normalizeProfile({
  base:selected,name:$('playerName')?.value||'Player',birthday:$('birthday')?.value||null,
  zodiac:$('zodiac')?.value||'',appearance
 })||null;
}
function drawAvatar(){
 if(stage!=='characterScreen')return;
 const c=$('charPreview'),ctx=c.getContext('2d');
 ctx.imageSmoothingEnabled=false;
 const profile=currentGenesisProfile();
 const action=charWalk?'walk':'idle';
 const frames=charWalk?6:4;
 const frame=Math.floor(charTick/(charWalk?1:2))%frames;
 const direction=directions[charDirection],emotion=expressions[charExpression];
 const shown=window.VLGenesisPlayer?.directPreview(c,profile,direction,action,frame,emotion,charTick/6);
 // Keep the previous fully rendered sprite until ALL new sheets are ready.
 if(shown)previewFrameShown=true;
 const status=window.VLGenesisPlayer?.imageStatus(profile,emotion,direction)||{loaded:0,total:1,pending:1,errors:[]};
 const fault=status.errors.length>0;
 const waiting=!shown&&(status.pending>0||fault);
 $('ccPreviewLoading').hidden=previewFrameShown||!waiting;
 $('ccPreviewUpdating').hidden=!previewFrameShown||!waiting;
 $('ccPreviewProgress').style.width=Math.round(100*status.loaded/Math.max(1,status.total))+'%';
 $('ccPreviewLoadingText').textContent=fault?'Asset tidak tersedia: '+status.errors.join(', '):
  'Memuat '+status.loaded+'/'+status.total+' layer Genesis / Emosi.exe...';
 $('ccPreviewUpdating').textContent=fault?'Sprite gagal dimuat · gambar sebelumnya dipertahankan':
  'Memuat perubahan... '+status.loaded+'/'+status.total+' layer';
 $('previewDirection').textContent='Genesis '+(selected==='genesis_female_nude'?'Female':'Male')+
  ' · '+direction.toUpperCase()+' · '+(charWalk?'Walk':'Idle')+' · Emosi '+emotion;
}
$('charRotate').addEventListener('click',()=>{charDirection=(charDirection+1)%4;drawAvatar();});
$('charAnimate').addEventListener('click',()=>{charWalk=!charWalk;drawAvatar();});
$('charExpression').addEventListener('click',()=>{charExpression=(charExpression+1)%expressions.length;drawAvatar();});
setInterval(()=>{if(stage==='characterScreen'){charTick++;drawAvatar();}},170);
const fields=['hairStyle','hairColor','skinTone','topStyle','topColor','pantsStyle','pantsColor','shoesStyle','shoesColor','glasses','facialHair'];
// Reflect pending asset loads immediately when any part changes, instead of
// waiting for the 170ms animation tick (which left a stale status on screen).
fields.forEach(id=>$(id)?.addEventListener('change',drawAvatar));
$('characterForm').addEventListener('submit',e=>{
 e.preventDefault();
 const name=$('playerName').value.trim(),birth=$('birthday').value,zodiac=$('zodiac').value;
 if(name.length<2||!zodiac){message('characterMessage','Nickname dan zodiak wajib diisi.',true);return;}
 if(birth&&(birth>new Date().toISOString().slice(0,10)||!zodiacFromBirthday(birth))){
  message('characterMessage','Tanggal lahir tidak valid.',true);return;
 }
 const appearance={};for(const id of fields)appearance[id]=$ (id).value;
 characterDraft=window.VLGenesisPlayer.normalizeProfile({name,zodiac,birthday:birth||null,base:selected,appearance});
 if(currentNode?.type==='character')branchCurrent();
 else showType('confirm');
});
function drawConfirm(){
 if(!characterDraft){
  characterDraft=currentGenesisProfile();
 }
 const ch=characterDraft;
 const lines=[
  ['Nickname',ch.name],['Birthday',ch.birthday||'Not entered'],['Zodiac',ch.zodiac],
  ['Body',ch.gender],['Base rig',ch.base],['Face database',ch.faceSource],
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
 $('retryWorld').hidden=true;
 $('worldProgress').style.width='3%';
 $('worldLoadingText').textContent='Memuat world WebGL, Jiwa, physics dan asset Semesta...';
 $('worldLoadingDetail').textContent='Menghubungkan engine Semesta...';
 $('worldLabel').textContent='World asli Semesta • perangkat ini';
 const url=new URL('../world-builder/',location.href);
 url.searchParams.set('player','1');
 url.searchParams.set('njhMap','1');
 url.searchParams.set('v',String(++worldCounter));
 frame.src=url.href;
 // Never mark an unfinished world as ready. Offer a non-destructive retry
 // if native art or WebGL stalls on a slower connection.
 setTimeout(()=>{
  if(!worldReady&&stage==='gameScreen'&&frame.getAttribute('src')===url.href){
   $('worldLoadingDetail').textContent='Masih menunggu Semesta / LGR-1. Coba muat ulang tanpa menghapus data.';
   $('retryWorld').hidden=false;
  }
 },35000);
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
 if(e.data.type==='mainkan:profile-request'){
  try{
   const data=profile?.character||characterDraft||currentGenesisProfile();
   const normalized=window.VLGenesisPlayer.normalizeProfile(data);
   frame.contentWindow?.postMessage({type:'mainkan:player-profile',profile:normalized,playerId:guest?'':testPlayerId},location.origin);
  }catch(err){
   frame.contentWindow?.postMessage({type:'mainkan:player-profile-error',message:String(err.message)},location.origin);
   $('worldLoadingText').textContent='Gagal memuat karakter Genesis: '+err.message;
   $('worldLoadingDetail').textContent='Data karakter aman. Coba muat ulang dunia.';
    $('retryWorld').hidden=false;
  }
  return;
 }
 if(e.data.type==='mainkan:player-loading'){
  const loaded=Number(e.data.loaded)||0,total=Math.max(1,Number(e.data.total)||1);
  $('worldProgress').style.width=Math.round(100*loaded/total)+'%';
  $('worldLoadingText').textContent='Menyiapkan Genesis + Emosi.exe...';
  $('worldLoadingDetail').textContent=loaded+'/'+total+' layer sprite siap. Karakter ditampilkan setelah lengkap.';
 }else if(e.data.type==='mainkan:semesta-ready'){
  worldReady=true;
  $('worldProgress').style.width='100%';
  $('worldLoading').hidden=true;
  $('retryWorld').hidden=true;
  $('cityName').textContent=e.data.city||'SEMESTA • Native World';
  $('worldLabel').textContent='Semesta WebGL · '+Number(e.data.count||0)+' objek · '+(guest?'Guest':'Player');
  $('statusText').textContent='SEMESTA • PLAYER READY';
  if(pauseRequested)frame.contentWindow?.postMessage({type:'mainkan:pause'},location.origin);
  else try{frame.focus();}catch{}
 }else if(e.data.type==='mainkan:semesta-error'){
  $('worldLoading').hidden=false;
  $('worldLoadingText').textContent=e.data.message||'Semesta tidak bisa dimuat. Coba Reload.';
  $('worldLoadingDetail').textContent='Karakter dan penyimpanan tidak dihapus. Coba muat ulang dunia.';
  $('retryWorld').hidden=false;
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
