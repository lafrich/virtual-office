/* Namanya Juga Hidup — the Game · Win98 UI layer (presentation only).
 * - intro sequence (publisher card → title + preload → "tekan untuk mulai")
 * - wizard step bar + "Cara Main" how-to steps for the existing onboarding flow
 * - fullscreen play HUD over the Semesta iframe, one place per entry point
 * - context menu near objects (re-uses the native life-panel buttons), progress window,
 *   Tas window, virtual joystick (drives the existing WASD walk input), landscape prompt
 * - placeholder "keluar tenda" spawn reveal (no animation exists yet)
 * Gameplay goes only through existing hooks: the native panel buttons, SemestaLifePlay.runAction
 * (eat_item / discard_item from Tas), #ptActionBtn forwarding, and synthetic WASD keys.
 * New storage keys (UI only): njh98:intro-seen, njh98:tutorial-done.
 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const frame=$('semestaFrame');
if(!frame)return;
const params=new URLSearchParams(location.search);
const DEV=params.get('dev')==='1';
const store={get(k){try{return localStorage.getItem('njh98:'+k);}catch{return null;}},set(k,v){try{localStorage.setItem('njh98:'+k,v);}catch{}}};
const coarse=()=>matchMedia('(pointer:coarse)').matches;
if(DEV)document.body.classList.add('njh-devtools');
const STEP_OF={welcomeScreen:'welcome',loginScreen:'login',characterScreen:'character',confirmScreen:'confirm',loadingScreen:'tutorial',tutorialScreen:'tutorial',gameScreen:'play',pauseScreen:'play'};
const ORDER=['welcome','login','character','confirm','tutorial','play'];
const SCREENS=Object.keys(STEP_OF).concat(['splashScreen','messageScreen']);
const seen=new Set();
let current='';

/* ---------- 16px pixel icons (crisp SVG rects, no emoji) ---------- */
const px=(rows,pal)=>{
 let r='';rows.forEach((row,y)=>{for(let x=0;x<row.length&&x<16;x++){const c=pal[row[x]];if(c)r+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+c+'"/>';}});
 return '<svg viewBox="0 0 16 16" width="20" height="20" shape-rendering="crispEdges" aria-hidden="true">'+r+'</svg>';
};
const K={k:'#000',w:'#fff',g:'#808080',l:'#c0c0c0',n:'#000080',b:'#1084d0',y:'#ffff00',o:'#808000',r:'#800000',G:'#008000',L:'#9bbc0f',t:'#008080'};
const ICON={
 nokia:px(['.....kkkkkk.....','....kggggggk....','....kgLLLLgk....','....kgLkkLgk....','....kgLLLLgk....','....kgLLLLgk....','....kggggggk....','....kglwlwlk....','....kggggggk....','....kgwgwgwk....','....kggggggk....','....kgwgwgwk....','....kggggggk....','....kgwgwgwk....','....kggggggk....','.....kkkkkk.....'],K),
 bag:px(['................','.....kkkkkk.....','....kk....kk....','....k......k....','..kkkkkkkkkkkk..','..koooooooooook.','..koyyyyyyyyyok.','..koyokkkkoyyok.','..koyyyyyyyyyok.','..koyyyyyyyyyok.','..koyyyyyyyyyok.','..koyyyyyyyyyok.','..koooooooooook.','..kkkkkkkkkkkkk.','................','................'],K),
 status:px(['kkkkkkkkkkkkkkkk','kwwwwwwwwwwwwwwk','kwwwwwwwwwwrrwwk','kwwwwwwwwwwrrwwk','kwwwwwwnnwwrrwwk','kwwwwwwnnwwrrwwk','kwwGGwwnnwwrrwwk','kwwGGwwnnwwrrwwk','kwwGGwwnnwwrrwwk','kwwGGwwnnwwrrwwk','kwwGGwwnnwwrrwwk','kwwGGwwnnwwrrwwk','kwkkkkkkkkkkkkwk','kwwwwwwwwwwwwwwk','kkkkkkkkkkkkkkkk','................'],K),
 map:px(['................','kkkkkkkkkkkkkkk.','kGGGGkttttkyyyyk','kGGGGkttttkyyyyk','kGGrrkttttkyyyyk','kGrrrrttttkyyyyk','kGGrrkttttkyyyyk','kGGGGktttrrryyyk','kGGGGkttrrrrryyk','kGGGGktttrrryyyk','kGGGGkttttkryyyk','kGGGGkttttkyyyyk','kGGGGkttttkyyyyk','kkkkkkkkkkkkkkk.','................','................'],K),
 menu:px(['kkkkkkkkkkkkkkkk','knnnnnnnnnnnwwlk','knnnnnnnnnnnlklk','kkkkkkkkkkkkkkkk','klllllllllllllgk','klkkkkkkkklllllk','kllllllllllllllk','klkkkkkkkkkkklgk','kllllllllllllllk','klkkkkkklllllllk','kllllllllllllllk','klkkkkkkkkkklllk','kllllllllllllllk','kgggggggggggggggk','kkkkkkkkkkkkkkkk','................'],K),
 full:px(['................','.kkkk......kkkk.','.kkk........kkk.','.kk.k......k.kk.','.k...k....k...k.','.....k....k.....','................','................','................','................','.....k....k.....','.k...k....k...k.','.kk.k......k.kk.','.kkk........kkk.','.kkkk......kkkk.','................'],K),
 walk:px(['......kkk.......','......kyk.......','......kkk.......','.....knnnk......','....knnnnnk.....','....k.nnn.k.....','......nnn.......','.....kn.nk......','.....k...k......','....k.....k.....','....k.....k.....','...kk.....kk....','................','.kkkkkkkkkkkkkk.','.k.k.k.k.k.k.kk.','.kkkkkkkkkkkkkk.'],K),
 action:px(['................','.kkkkkkkkkkkkkk.','.kllllllllllllk.','.klwwwwwwwwwwlk.','.klwkkkkkkkkwlk.','.klwwwwwwwwwwlk.','.klwkkkkkwwwwlk.','.klwwwwwwwwwwlk.','.kllllllllllllk.','.kkkkkkkkkkkkkk.','........k.......','.......kyk......','......kyyyk.....','.....kyyyyyk....','......kkkkk.....','................'],K),
 needs:px(['................','..kk......kk....','.krrk....krrk...','krrrrk..krrrrk..','krrrrrkkrrrrrk..','krrrrrrrrrrrrk..','.krrrrrrrrrrk...','..krrrrrrrrk....','...krrrrrrk.....','....krrrrk......','.....krrk.......','......kk........','................','kkkkkkkkkkkkkkk.','kGGGGGGGGGkwwwk.','kkkkkkkkkkkkkkk.'],K),
 app:px(['kkkkkkkkkkkkkkkk','knnnnnnnnnnnnnnk','kkkkkkkkkkkkkkkk','kwwwwwwwwwwwwwwk','kwttwwwwwwwwwwwk','kwttwkkkkkkkkwwk','kwwwwwwwwwwwwwwk','kwttwkkkkkkwwwwk','kwttwwwwwwwwwwwk','kwwwwwwwwwwwwwwk','kwwwwwwwwwwwwwwk','kwwwwwwwwwwwwwwk','kwwwwwwwwwwwwwwk','kwwwwwwwwwwwwwwk','kkkkkkkkkkkkkkkk','................'],K)
};
const big=svg=>svg.replace('width="20" height="20"','width="32" height="32"');
const titleIcon=document.querySelector('.titlebar .icon');
if(titleIcon)titleIcon.innerHTML=ICON.app;

/* =================== intro sequence =================== */
(function intro(){
 const forced=params.get('intro')==='1';
 // Automated browsers (CI e2e) go straight to the existing splash/skip contract unless ?intro=1.
 if(navigator.webdriver&&!forced)return;
 const returning=store.get('intro-seen')==='1'&&!forced;
 const ov=document.createElement('div');ov.id='njhIntro';ov.className='njh-intro stage-logo';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Intro');
 ov.innerHTML='<div class="njh-intro-logo"><div class="njh-lafrich">'+big(px(['................','..kkkk..........','..kwwk..........','..kwwk..........','..kwwk..........','..kwwk..........','..kwwk..........','..kwwk..........','..kwwk..........','..kwwkkkkkkkk...','..kwwwwwwwwwk...','..kwwwwwwwwwk...','..kkkkkkkkkkk...','................','................','................'],K)).replace('width="32" height="32"','width="64" height="64"')+
  '<b>LAFRICH</b><small>mempersembahkan</small></div></div>'+
  '<div class="njh-intro-title"><section class="w98 njh-intro-win"><header class="w98-title"><span>'+ICON.app+' Namanya Juga Hidup — the Game</span></header><div class="w98-body">'+
  '<div class="hero njh-intro-hero"><span class="njh-byline">by Lafrich</span><strong>NAMANYA<br>JUGA HIDUP</strong><em class="njh-sub">the Game</em><small>Simulasi hidup sehari-hari di kota Indonesia.</small></div>'+
  '<div class="progress" role="progressbar" aria-label="Memuat aset"><div id="njhIntroFill"></div></div><div class="njh-intro-status"><span id="njhIntroText">Memuat aset…</span><span id="njhIntroCount"></span></div>'+
  '<p class="njh-intro-press" id="njhIntroPress" hidden>'+(coarse()?'Ketuk layar untuk mulai':'Tekan tombol apa saja / klik untuk mulai')+'</p></div></section></div>';
 document.body.appendChild(ov);
 let stage='logo',ready=false,done=false;
 const ASSETS=['./app.js','./classic-creator.js','./classic-creator.css','./njh98-world.css','../shared/genesis-player.js',
  '../world-builder/index.html','../world-builder/builder.js','../world-builder/semesta-life-play.js','../world-builder/xp.css',
  '../world-builder/semesta-player.css','../jiwa/life-economy.js','../shared/play-hud.js','../shared/vl-hud/phone_ellen.js',
  '../shared/vl-hud/nokia-play.js','../shared/vl-hud/shell.css','../shared/vl-hud/nokia.css'];
 let loaded=0;
 const paint=()=>{$('njhIntroFill').style.width=Math.round(100*loaded/ASSETS.length)+'%';$('njhIntroCount').textContent=loaded+'/'+ASSETS.length;};
 const preload=Promise.all(ASSETS.map(u=>fetch(u,{cache:'force-cache'}).then(r=>r.ok?r.arrayBuffer():null).catch(()=>null).finally(()=>{loaded++;paint();})));
 function showPrompt(){if(done)return;ready=true;stage='press';ov.className='njh-intro stage-press';$('njhIntroText').textContent='Siap.';$('njhIntroPress').hidden=false;}
 function toTitle(){
  if(stage!=='logo')return;stage='title';ov.className='njh-intro stage-title';paint();
  const minShow=new Promise(r=>setTimeout(r,returning?200:1200));
  Promise.race([Promise.all([preload,minShow]),new Promise(r=>setTimeout(r,8000))]).then(showPrompt);
 }
 function finish(){
  if(done)return;done=true;store.set('intro-seen','1');
  ov.classList.add('out');setTimeout(()=>ov.remove(),260);
  if(!$('splashScreen')?.hidden)$('skipSplash')?.click();
 }
 function input(e){
  if(done)return;
  if(e.type==='keydown'&&['Shift','Control','Alt','Meta'].includes(e.key))return;
  if(stage==='logo'){toTitle();return;}
  if(stage==='press'||(stage==='title'&&returning))finish();
 }
 ov.addEventListener('pointerdown',input);
 window.addEventListener('keydown',input);
 setTimeout(toTitle,returning?700:1500);
})();

/* ---------- step bar ---------- */
const steps=$('njhSteps');
function paintSteps(){
 if(!steps)return;
 const step=STEP_OF[current];
 steps.hidden=!step||current==='gameScreen'||current==='pauseScreen';
 const idx=ORDER.indexOf(step);
 steps.querySelectorAll('li').forEach(li=>{
  const i=ORDER.indexOf(li.dataset.step);
  li.classList.toggle('now',i===idx);
  li.classList.toggle('done',i<idx&&seen.has(li.dataset.step));
  li.classList.toggle('skip',i<idx&&!seen.has(li.dataset.step));
  if(i===idx)li.setAttribute('aria-current','step');else li.removeAttribute('aria-current');
 });
}
function visibleScreen(){return SCREENS.find(id=>{const el=$(id);return el&&!el.hidden;})||'';}
let wasPaused=false,howtoScreenSeen=false;
function onScreen(){
 const now=visibleScreen();
 if(now===current)return;
 const prev=current;current=now;
 if(now==='welcomeScreen'){seen.clear();spawnShown=false;}
 if(STEP_OF[now])seen.add(STEP_OF[now]);
 paintSteps();
 const playing=now==='gameScreen';
 document.body.classList.toggle('njh-play',playing);
 document.body.classList.toggle('njh-paused',now==='pauseScreen');
 const hud=$('njhHud');if(hud)hud.hidden=!playing;
 if(now==='tutorialScreen'){
  howtoScreenSeen=true;
  // Returning players never see the explanations again (Menu Jeda → Lihat Tutorial keeps them reachable).
  if(store.get('tutorial-done')==='1'&&!DEV){setTimeout(()=>{if(current==='tutorialScreen')$('tutorialDone')?.click();},0);}
  else howto.render('njhHowtoScreen',0);
 }
 if(playing){injectWorld();tick();if(store.get('tutorial-done')!=='1'&&!howtoScreenSeen)firstHowto=true;if(prev==='pauseScreen'&&pendingHowto){pendingHowto=false;openHowtoWin();}}
 else{closeWindows();closeCtx();joyRelease();}
 paintFull();
}
const mo=new MutationObserver(onScreen);
SCREENS.forEach(id=>{const el=$(id);if(el)mo.observe(el,{attributes:true,attributeFilter:['hidden']});});

/* ---------- Cara Main (how to play) ---------- */
const HOWTO=[
 {t:'Kontrol',c:[
  ['walk','Jalan','<span class="njh-kb"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> atau panah. Tahan <kbd>Shift</kbd> buat lari.</span><span class="njh-touch">Geser joystick di kiri bawah. Tahan <b>LARI</b> buat lari.</span>'],
  ['action','Aksi','Dekat objek atau orang, tekan <b>AKSI</b><span class="njh-kb"> / <kbd>E</kbd></span>. Muncul menu kecil, pilih aksinya. Di tempat kerja, <b>tahan</b> AKSI sampai bar penuh.']]},
 {t:'Fitur',c:[
  ['nokia','Nokia','Dompet, Skill, Kursus, Marketplace, Furnitur, <b>Peta</b>, Profil.'],
  ['bag','Tas','Isi tas: makan buah atau buang barang.'],
  ['status','Status','Tempat tinggal, token listrik, agama, zodiak.'],
  ['menu','Menu','Jeda, lihat tutorial lagi, atau keluar.']],n:'Semua tombol ini ada di dock kanan bawah. Bar <b>Kondisi</b> di kanan atas.'},
 {t:'Tujuan pertama',c:[
  ['needs','Bertahan hidup','Jaga Energi, Kebersihan, Kenyang, Moral. Kalau Buang Air penuh, cari WC!'],
  ['app','Kumpulkan uang buat kost','Kerja serabutan, hemat, lalu sewa kamar kost supaya nggak tidur di tenda lagi.']]}
];
const howto={page:{},
 render(id,p){
  const el=$(id);if(!el)return;p=Math.max(0,Math.min(HOWTO.length-1,p));this.page[id]=p;const s=HOWTO[p];
  el.innerHTML='<div class="njh-howto-head"><b>Langkah '+(p+1)+' dari '+HOWTO.length+':</b> '+s.t+'<span class="njh-dots">'+HOWTO.map((_,i)=>'<i class="'+(i===p?'on':'')+'"></i>').join('')+'</span></div>'+
   '<div class="njh-tut">'+s.c.map(([ic,h,txt])=>'<div class="card"><i>'+big(ICON[ic]||ICON.app)+'</i><div><b>'+h+'</b>'+txt+'</div></div>').join('')+'</div>'+(s.n?'<p class="micro">'+s.n+'</p>':'');
  const root=el.closest('#tutorialScreen,#njhHowtoWin');
  if(root){
   const last=p===HOWTO.length-1;
   root.querySelector('[data-howto=prev]').disabled=p===0;
   root.querySelector('[data-howto=next]').hidden=last;
   const fin=root.id==='tutorialScreen'?$('tutorialDone'):root.querySelector('[data-howto-last]');
   if(fin)fin.hidden=!last;
  }
 }};
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-howto]');if(!b)return;
 const id=b.closest('#tutorialScreen')?'njhHowtoScreen':'njhHowtoWinBody';
 howto.render(id,(howto.page[id]||0)+(b.dataset.howto==='next'?1:-1));
});
const markTutorial=()=>store.set('tutorial-done','1');
$('tutorialDone')?.addEventListener('click',markTutorial);
$('tutorialSkip')?.addEventListener('click',markTutorial);
let pendingHowto=false,firstHowto=false;
// Flow graphs that skip the Hari Pertama node (e.g. logged-in players) still get Cara Main once, in-game.
document.addEventListener('click',e=>{if(e.target.closest('#njhHowtoWin [data-close]'))markTutorial();});
function openHowtoWin(){closeWindows();howto.render('njhHowtoWinBody',0);$('njhHowtoWin').hidden=false;}
$('njhPauseHowto')?.addEventListener('click',()=>{pendingHowto=true;$('resumeGame')?.click();});

/* ---------- login back (re-uses the existing return-to-menu path) ---------- */
$('njhLoginBack')?.addEventListener('click',()=>$('homeButton')?.click());

/* ---------- fullscreen (optional, user gesture) + landscape lock ---------- */
const docEl=document.documentElement;
const fsSupported=!!(docEl.requestFullscreen||docEl.webkitRequestFullscreen);
const fsElement=()=>document.fullscreenElement||document.webkitFullscreenElement||null;
function lockLandscape(){try{const p=screen.orientation?.lock?.('landscape');if(p&&p.catch)p.catch(()=>{});}catch{}}
function toggleFull(){
 if(!fsSupported){
  notice('Layar Penuh','Browser ini belum mendukung layar penuh dari halaman web (umumnya iPhone/iPad). Mode main sudah memenuhi layar. Untuk tanpa bar browser: Bagikan → Tambah ke Layar Utama.');
  return;
 }
 try{
  if(fsElement())(document.exitFullscreen||document.webkitExitFullscreen).call(document);
  else{const r=(docEl.requestFullscreen||docEl.webkitRequestFullscreen).call(docEl,{navigationUI:'hide'});
   if(r&&r.then)r.then(lockLandscape,()=>notice('Layar Penuh','Browser menolak layar penuh. Coba lagi dari tombol ini.'));else lockLandscape();}
 }catch{notice('Layar Penuh','Browser menolak layar penuh.');}
}
function paintFull(){
 const on=!!fsElement();
 const d=$('njhDockFull');if(d){d.classList.toggle('is-on',on);d.setAttribute('aria-pressed',String(on));}
}
document.addEventListener('fullscreenchange',paintFull);
document.addEventListener('webkitfullscreenchange',paintFull);
$('njhPauseReload')?.addEventListener('click',()=>{$('resumeGame')?.click();setTimeout(()=>$('reloadWorld')?.click(),0);});

/* ---------- dock: one place per entry point ---------- */
const dock=$('njhDock');
function app(id,label,icon,title){
 const b=document.createElement('button');b.type='button';b.className='njh-app';b.id=id;b.title=title||label;
 b.innerHTML=ICON[icon]+'<span>'+label+'</span>';dock.append(b);return b;
}
function adopt(id,label,icon,title){
 const b=$(id);if(!b)return;
 b.innerHTML=ICON[icon]+'<span>'+label+'</span>';b.title=title;b.classList.remove('btn','compact');dock.append(b);
}
if(dock){
 adopt('gamePhone','Nokia','nokia','Nokia: Dompet, Skill, Kursus, Marketplace, Furnitur, Peta, Profil');
 adopt('gameBag','Tas','bag','Isi tas');
 app('njhDockStatus','Status','status','Status pemain').addEventListener('click',()=>toggleWin('njhStatusWin',paintStatus));
 app('njhDockMap','Peta','map','Peta kota').addEventListener('click',()=>{if(window.NJH98Mock?.openMap)window.NJH98Mock.openMap();else notice('Peta','Peta belum siap.');});
 const sep=document.createElement('i');sep.className='njh-dsep';sep.setAttribute('aria-hidden','true');dock.append(sep);
 app('njhDockMenu','Menu','menu','Menu jeda').addEventListener('click',()=>$('pauseButton')?.click());
 app('njhDockFull','Layar','full','Layar penuh').addEventListener('click',toggleFull);
}
// Tas opens its own window (bag grid) instead of switching the native panel into bag mode.
$('gameBag')?.addEventListener('click',e=>{if(DEV)return;e.stopImmediatePropagation();e.preventDefault();toggleWin('njhBagWin',paintBag);},true);

/* ---------- Win98 windows ---------- */
function closeWindows(){document.querySelectorAll('.njh-win').forEach(w=>w.hidden=true);}
function toggleWin(id,paint){const w=$(id);if(!w)return;const open=w.hidden;closeWindows();closeCtx();if(open){paint&&paint();w.hidden=false;w.querySelector('[data-close]')?.focus();}}
document.addEventListener('click',e=>{const c=e.target.closest('.njh-win [data-close]');if(c)c.closest('.njh-win').hidden=true;});
function notice(title,text){
 const w=$('njhNotice');
 if(!w||$('njhHud')?.hidden){window.alert(text);return;}
 $('njhNoticeTitle').textContent=title;$('njhNoticeText').textContent=text;closeWindows();w.hidden=false;
}
let toastTimer=0;
function toast(text){
 let t=$('njhToast');
 if(!t){t=document.createElement('div');t.id='njhToast';t.className='njh-toast';t.setAttribute('role','status');$('njhHud')?.append(t);}
 t.textContent=text;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{t.hidden=true;},2600);
}
const modalClose=document.createElement('button');modalClose.type='button';modalClose.id='njhModalClose';modalClose.className='btn njh-modal-close';modalClose.hidden=true;
modalClose.addEventListener('click',()=>{try{world()?.document?.getElementById('ptWinClose')?.click();}catch{}setTimeout(paintModal,50);});
$('njhHud')?.append(modalClose);

/* ---------- read-only game data ---------- */
function world(){try{return frame.contentWindow||null;}catch{return null;}}
function wdoc(){try{return world()?.document||null;}catch{return null;}}
function life(){try{return world()?.SemestaLifePlay||null;}catch{return null;}}
function lifeState(){try{return life()?.state?.()||null;}catch{return null;}}
function worldText(id){return wdoc()?.getElementById(id)?.textContent?.trim()||'';}
const rp=n=>'Rp '+Math.round(Number(n)||0).toLocaleString('id-ID');
const clamp=v=>Math.max(0,Math.min(100,Math.round(Number(v)||0)));
const esc=v=>String(v??'—').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const NEEDS=[['energy','Energi',v=>v<25],['hygiene','Kebersihan',v=>v<25],['bladder','Buang Air',v=>v>=80],['fullness','Kenyang',v=>v<25],['moral','Moral',v=>v<25],['experience','EXP',()=>false]];
const needsBody=$('njhNeedsBody');
if(needsBody)needsBody.innerHTML=NEEDS.map(([k,l])=>'<div class="njh-need" data-need="'+k+'"><label>'+l+'</label><div class="njh-bar" role="meter" aria-label="'+l+'" aria-valuemin="0" aria-valuemax="100"><i></i></div><output>—</output></div>').join('');
function paintNeeds(st){
 if(!needsBody)return;
 for(const [k,,warn] of NEEDS){
  const row=needsBody.querySelector('[data-need="'+k+'"]');if(!row)continue;
  const v=clamp(st[k]);
  row.querySelector('i').style.width=v+'%';row.querySelector('output').textContent=v;
  row.querySelector('.njh-bar').setAttribute('aria-valuenow',String(v));
  row.classList.toggle('warn',!!warn(v));
 }
}
const DAYS={SEN:'Sen',SEL:'Sel',RAB:'Rab',KAM:'Kam',JUM:'Jum',SAB:'Sab',MIN:'Min'};
function paintClock(){
 const t=worldText('timeDisplay'),d=worldText('timeDay'),phase=worldText('timePhase');
 if(t)$('njhTime').textContent=t;
 const m=/([A-Z]{3})\s*·\s*DAY\s*0*(\d+)/i.exec(d);
 if(m)$('njhDay').textContent=(DAYS[m[1].toUpperCase()]||m[1])+' · Hari '+m[2]+(phase?' · '+phase.charAt(0)+phase.slice(1).toLowerCase():'');
}
let profile=null,avatarTick=0;
function paintAvatar(){
 const c=$('njhAvatar'),G=window.VLGenesisPlayer;if(!c||!G||!profile)return;
 try{G.directPreview(c,profile,'se','idle',Math.floor(avatarTick/2)%4,'neutral',avatarTick/6);}catch{}
}
function paintProfile(st){
 $('njhWallet').textContent=rp(st.wallet);
 $('njhHousing').textContent=st.housing?.room?'Kost':'Tenda';
 if(profile?.name)$('njhName').textContent=profile.name;
}
function paintStatus(){
 const b=$('njhStatusBody');if(!b)return;
 if(typeof window.NJH98Mock?.statusHTML==='function'){try{b.innerHTML=window.NJH98Mock.statusHTML(lifeState()||{});return;}catch(err){console.warn(err);}}
 const st=lifeState()||{};
 const rows=[['Nama',profile?.name||'Pemain'],['Tempat tinggal',st.housing?.room?'Kamar kost':'Tenda (hobo)'],
  ['Token listrik',(st.powerTokens??0)+' token'],['Furnitur',(st.furniture||[]).join(', ')||'belum ada'],
  ['Agama',st.identity?.religion||'—'],['Zodiak',profile?.zodiac||st.identity?.zodiac||'—']];
 b.innerHTML='<fieldset class="njh-group"><legend>Hidup</legend><table>'+rows.map(([k,v])=>'<tr><th>'+esc(k)+'</th><td>'+esc(v)+'</td></tr>').join('')+'</table></fieldset>'+
  '<fieldset class="njh-group"><legend>Progres tempat tinggal <span class="njh-soon">SEGERA</span></legend><div class="njh-ladder" aria-label="Tenda, Kost, Rumah"><span class="'+(st.housing?.room?'':'on')+'">Tenda</span><span class="'+(st.housing?.room?'on':'')+'">Kost</span><span title="Belum ada logic level rumah">Rumah Lv.?</span></div><p class="micro">Level rumah belum ada logic-nya. Sekarang cuma Tenda atau Kost.</p></fieldset>'+
  '<fieldset class="njh-group"><legend>Skill &amp; reputasi <span class="njh-soon nologic">BELUM ADA LOGIC</span></legend><p class="micro">Skill bernama dan reputasi belum ada di ekonomi Jiwa. Sementara cuma EXP (bar Kondisi).</p></fieldset>'+
  '<div class="njh-row"><button type="button" class="btn primary" data-close>OK</button></div>';
}

/* ---------- Tas window (bag grid) ---------- */
let bagSel='';
function paintBag(){
 const st=lifeState()||{};const inv=st.inventory||[];
 if(bagSel&&!inv.includes(bagSel))bagSel='';
 const slots=Math.max(8,inv.length);
 $('njhBagTitle').textContent='Tas · '+inv.length+'/'+slots;
 const now=Number(st.elapsedMinutes);
 let html='';
 for(let i=0;i<slots;i++){
  const id=inv[i];
  if(!id){html+='<div class="njh-slot empty" aria-hidden="true"></div>';continue;}
  const meta=st.itemMeta?.[id]||{};const bad=Number.isFinite(now)&&Number.isFinite(Number(meta.expiresAt))&&!meta.inFridge&&Number(meta.expiresAt)<=now;
  html+='<button type="button" class="njh-slot'+(id===bagSel?' sel':'')+(bad?' bad':'')+'" data-item="'+esc(id)+'" title="'+esc(meta.label||id)+'"><span>'+esc(meta.label||id)+'</span>'+(bad?'<small>busuk</small>':'')+'</button>';
 }
 $('njhBagSlots').innerHTML=html;
 const meta=bagSel?st.itemMeta?.[bagSel]:null;
 $('njhBagInfo').textContent=bagSel?(meta?.label||bagSel)+' dipilih.':inv.length?'Pilih barang.':'Tas kosong. Mulung, mancing, atau ambil buah buat ngisi tas.';
 $('njhBagEat').disabled=!bagSel;$('njhBagDrop').disabled=!bagSel;
}
$('njhBagSlots')?.addEventListener('click',e=>{const b=e.target.closest('[data-item]');if(!b)return;bagSel=b.dataset.item;paintBag();});
function bagAction(action){
 if(!bagSel)return;
 let r=null;try{r=life()?.runAction?.(action,{itemId:bagSel});}catch{}
 paintBag();$('njhBagInfo').textContent=r?(r.ok?(r.changes&&r.changes.join(' · '))||'OK':(r.reason||'Gagal')):'Game belum siap.';
}
$('njhBagEat')?.addEventListener('click',()=>bagAction('eat_item'));
$('njhBagDrop')?.addEventListener('click',()=>bagAction('discard_item'));

/* ---------- context menu (native life-panel buttons, shown only near a spot) ---------- */
// body actions (Pipis di Tembok / Kentut): real nearbyActions entries win, otherwise the SIMULASI mock (njh98-mock.js).
// They live INSIDE the one Action menu — never as their own button.
function bodyActs(){try{return window.NJH98Mock?.bodyActions?.()||[];}catch{return [];}}
function ctxSpot(){
 // Future hook (Baymax): SemestaLifePlay.nearbyActions() → [{action,label,...}] with a spot label.
 try{const L=life();if(typeof L?.nearbyActions==='function'){const list=L.nearbyActions()||[];const spot=list.spot||list[0]?.spotLabel;
  if(Array.isArray(list)&&list.length&&!wdoc()?.getElementById('slpActions'))return {work:list.some(a=>a.hold),label:spot||'Aksi'};}}catch{}
 const d=wdoc();const acts=d?.getElementById('slpActions');if(!acts)return null;
 const work=!!acts.querySelector('#slpWork');
 const has=!!acts.querySelector('button[data-life-action],select');
 if(!work&&!has)return null;
 const spot=(d.querySelector('#semestaLifePlayPanel .slp-spot')?.textContent||'').replace(/^\s*📍\s*/,'').replace(/\s*\[PLACEHOLDER\]/,'').trim();
 return {work,label:spot||'Aksi'};
}
// "something actionable nearby" for the player cue + hint: any action except the always-on fart
const IDLE_ACT=new Set(['fart']);
function contextualNear(){
 try{const L=life();if(typeof L?.nearbyActions==='function'){const list=L.nearbyActions()||[];if(Array.isArray(list))return list.some(a=>!IDLE_ACT.has(String(a.id||a.action)));}}catch{}
 const ci=ctxInfo();return !!(ci&&(!ci.bodyOnly||ci.contextual));
}
function ctxInfo(){
 const spot=ctxSpot();if(spot&&spot.work)return spot;
 const body=bodyActs();
 if(spot)return {...spot,body};
 if(!body.length)return null;
 // no spot: the menu still opens for the body actions; only a contextual one (wall_pee) counts as "something nearby"
 return {work:false,label:'Aksi',body,bodyOnly:true,contextual:body.some(a=>a.contextual)};
}
let ctxOpen=false,ctxLabel='';
function setWorldClass(c,on){try{wdoc()?.documentElement?.classList.toggle(c,on);}catch{}}
function openCtx(){
 // enterable door nearby → its (placeholder) interior instead of the generic menu
 if(doorNearObj&&typeof window.NJH98Mock?.enterDoor==='function'){try{window.NJH98Mock.enterDoor(doorNearObj);}catch(err){console.warn(err);}return true;}
 const info=ctxInfo();if(!info||info.work)return false;
 ctxOpen=true;ctxLabel=info.label;setWorldClass('njh-ctx-open',true);decorateWorld(true);paintBody(info.body||[]);
 setTimeout(()=>{try{wdoc()?.querySelector('#slpActions button[data-life-action],#slpActions select')?.focus();}catch{}},0);
 return true;
}
function paintBody(list){
 const box=wdoc()?.getElementById('njhCtxBody');if(!box)return;
 box.hidden=!list.length;
 box.innerHTML=list.map(a=>'<button type="button" data-njh-body="'+esc(a.id)+'"'+(a.disabled?' disabled title="'+esc(a.hint||'')+'"':'')+'><span>'+esc(a.label)+'</span>'+(a.disabled&&a.hint?'<small>'+esc(a.hint)+'</small>':'')+(a.mock?'<span class="njh-sim">SIMULASI</span>':'')+'</button>').join('');
}
function closeCtx(){if(!ctxOpen)return;ctxOpen=false;setWorldClass('njh-ctx-open',false);try{frame.focus();}catch{}}
// AKSI button: near a spot with choices it opens the menu; at a job it still forwards the hold-to-work input.
(function(){
 const a=$('gameAction');if(!a)return;let mine=false;
 const stop=e=>{e.stopImmediatePropagation();e.preventDefault();};
 a.addEventListener('pointerdown',e=>{if(DEV)return;const info=ctxInfo();mine=!!info&&!info.work;if(mine){stop(e);ctxOpen?closeCtx():openCtx();}},true);
 for(const t of ['pointerup','pointercancel','lostpointercapture'])a.addEventListener(t,e=>{if(mine)stop(e);},true);
 a.addEventListener('click',e=>{if(DEV)return;if(mine){mine=false;stop(e);return;}const info=ctxInfo();if(info&&!info.work&&e.detail===0){stop(e);ctxOpen?closeCtx():openCtx();}},true);
})();

/* ---------- progress window (work hold or a ~4 s action pose) ---------- */
let pending=null,poseRun=null;
const IDLE=new Set(['idle','walk','run','stand','sit_idle','']);
function paintProgress(){
 const box=$('njhProgress');if(!box)return;
 let pct=-1,title='',text='';
 const fill=wdoc()?.getElementById('slpWorkFill');
 const w=parseFloat(fill?.style.width||'0');
 if(w>0){pct=w;title='Kerja: '+(ctxInfo()?.label||'');text='Tahan AKSI sampai penuh';}
 else{
  let pose='';try{pose=String(life()?.currentPose?.()||'');}catch{}
  if(pending&&!poseRun&&pose&&!IDLE.has(pose)&&performance.now()-pending.t<1500)poseRun={label:pending.label,t:performance.now()};
  if(poseRun){
   const el=performance.now()-poseRun.t;
   if(el>4300||(el>600&&IDLE.has(pose)))poseRun=null;
   else{pct=Math.min(100,el/40);title=poseRun.label;text='Sedang berlangsung…';}
  }
 }
 box.hidden=pct<0;
 if(pct>=0){$('njhProgressTitle').textContent=title;$('njhProgressFill').style.width=pct+'%';$('njhProgressText').textContent=text;}
}

/* ---------- near hint ---------- */
function paintNear(){
 const n=$('njhNear');if(!n)return;
 let info=(!ctxOpen&&current==='gameScreen'&&!doorNear)?ctxInfo():null;
 if(info?.bodyOnly){info=info.contextual?{...info,label:info.body.find(a=>a.contextual)?.label||'Aksi'}:null;}
 if(info&&!info.work&&!contextualNear())info=null;
 n.hidden=!info;
 if(info)n.textContent=(info.work?'Tahan AKSI: ':'AKSI'+(coarse()?'':' (E)')+': ')+info.label;
}

/* ---------- world decoration (iframe, visual only) ---------- */
let decorated=null;
function decorateWorld(force){
 const d=wdoc();if(!d)return;
 const outer=d.getElementById('semestaLifePlayPanel');if(!outer)return;
 const h=outer.querySelector('h3');
 if(h&&!DEV&&(force||ctxOpen))h.textContent=ctxLabel||'Aksi';
 if(decorated===outer)return;decorated=outer;
 if(DEV){if(h)h.textContent='Aksi & Tas (dev)';return;}
 const body=d.createElement('div');body.className='njh-ctx-body';body.id='njhCtxBody';body.hidden=true;outer.append(body);
 body.addEventListener('click',e=>{const b=e.target.closest('[data-njh-body]');if(!b||b.disabled||!ctxOpen)return;
  let msg='';try{msg=window.NJH98Mock?.runBody?.(b.dataset.njhBody)||'';}catch(err){console.warn(err);}
  if(msg)toast(msg);setTimeout(closeCtx,0);});
 const foot=d.createElement('div');foot.className='njh-ctx-foot';
 const cancel=d.createElement('button');cancel.type='button';cancel.id='njhCtxCancel';cancel.textContent='Batal';
 foot.append(cancel);outer.append(foot);
 cancel.addEventListener('click',closeCtx);
 outer.addEventListener('click',e=>{
  const b=e.target.closest('button[data-life-action]');if(!b||!ctxOpen)return;
  pending={label:(b.textContent||'').replace(/^[^\wÀ-ɏ]+\s*/u,'').trim(),t:performance.now()};
  setTimeout(closeCtx,0);
 });
}
function worldKeys(w){
 if(w.__njh98Keys)return;w.__njh98Keys=true;
 // capture-phase on the iframe window runs before Semesta's E handler; only the E/Esc keys are taken over
 w.addEventListener('keydown',e=>{
  if(DEV||current!=='gameScreen')return;
  const k=String(e.key).toLowerCase();
  if(k==='escape'&&ctxOpen){e.preventDefault();closeCtx();return;}
  if(k!=='e'||e.repeat)return;
  if(ctxOpen){e.preventDefault();e.stopImmediatePropagation();closeCtx();return;}
  const info=ctxInfo();
  if(info&&!info.work){e.preventDefault();e.stopImmediatePropagation();openCtx();}
 },true);
}

// same E / Esc handling when focus sits on the HUD (after closing a window) instead of the world
window.addEventListener('keydown',e=>{
 if(DEV||current!=='gameScreen'||e.repeat||/INPUT|SELECT|TEXTAREA/.test(e.target?.tagName||''))return;
 const k=String(e.key).toLowerCase();
 if(k==='escape'&&ctxOpen){e.preventDefault();closeCtx();return;}
 if(k!=='e')return;
 if(ctxOpen){e.preventDefault();closeCtx();return;}
 const info=ctxInfo();if(info&&!info.work){e.preventDefault();openCtx();}
});
/* ---------- popups on touch: HUD steps aside ---------- */
function paintModal(){
 let kind='';
 try{const w=wdoc()?.getElementById('ptWindow');if(w&&!w.hidden&&w.offsetParent!==null)kind=w.getAttribute('data-kind')||'window';}catch{}
 document.body.classList.toggle('njh-modal',!!kind);
 try{window.NJH98Mock?.onModal?.(kind);}catch{}
 if(modalClose){modalClose.hidden=!kind;modalClose.textContent=kind==='phone'?'× Tutup Nokia':'× Tutup';}
}

/* ---------- virtual joystick → existing WASD walk input ---------- */
const joy=$('njhJoy'),base=$('njhJoyBase'),knob=$('njhJoyKnob');
const KEY={up:'w',down:'s',left:'a',right:'d'};
let held=new Set(),joyId=null,joyOrigin=null;
function sendKey(type,dir){
 const w=world();if(!w)return;
 try{w.dispatchEvent(new w.KeyboardEvent(type,{key:KEY[dir],code:'Key'+KEY[dir].toUpperCase(),bubbles:true,cancelable:true}));}catch{}
}
function setDirs(next){
 for(const d of held)if(!next.has(d))sendKey('keyup',d);
 for(const d of next)if(!held.has(d))sendKey('keydown',d);
 held=next;
}
function joyRelease(){
 setDirs(new Set());joyId=null;joyOrigin=null;
 if(base){base.style.left='';base.style.top='';base.classList.remove('on');}
 if(knob)knob.style.transform='';
}
if(joy){
 const R=44;
 joy.addEventListener('pointerdown',e=>{
  if(joyId!==null)return;e.preventDefault();joyId=e.pointerId;try{joy.setPointerCapture(e.pointerId);}catch{}
  const r=joy.getBoundingClientRect();joyOrigin={x:e.clientX,y:e.clientY};
  base.style.left=(e.clientX-r.left)+'px';base.style.top=(e.clientY-r.top)+'px';base.classList.add('on');closeCtx();
 });
 joy.addEventListener('pointermove',e=>{
  if(e.pointerId!==joyId||!joyOrigin)return;
  let dx=e.clientX-joyOrigin.x,dy=e.clientY-joyOrigin.y;const len=Math.hypot(dx,dy);
  if(len>R){dx=dx/len*R;dy=dy/len*R;}
  knob.style.transform='translate('+dx+'px,'+dy+'px)';
  const next=new Set();
  if(len>12){const nx=dx/Math.max(len,1),ny=dy/Math.max(len,1);
   if(nx>0.38)next.add('right');if(nx<-0.38)next.add('left');if(ny>0.38)next.add('down');if(ny<-0.38)next.add('up');}
  setDirs(next);
 });
 for(const t of ['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(t,e=>{if(e.pointerId===joyId)joyRelease();});
}

/* ---------- spawn reveal (placeholder for Gerak's "keluar tenda" animation) ---------- */
let spawnShown=false;
function spawnReveal(kind){
 if(spawnShown)return;const st=lifeState();if(!st&&!kind)return;spawnShown=true;
 try{viewSize=sp()?.spawnRespawn?.last?.()?.playExitTent?14:16;}catch{}
 const kost=kind?kind==='kost':!!st.housing?.room;
 const el=$('njhSpawn');if(!el)return;
 let real=false;try{const H=world()?.VLSpawnHobo;real=!kost&&!!(H?.busy?.()||H?.snapshot?.());}catch{}
 el.classList.toggle('kost',kost);el.classList.toggle('real',real);
 $('njhSpawnTitle').textContent=kost?'Bangun di kost':'Keluar tenda';
 $('njhSpawnText').textContent=kost?'Pagi! Kamu bangun di kamar kost.':'Pagi! Kamu keluar dari tenda di pinggir jalan.';
 el.hidden=false;el.classList.remove('go');void el.offsetWidth;el.classList.add('go');
 setTimeout(()=>{el.hidden=true;el.classList.remove('go');if(firstHowto&&current==='gameScreen'){firstHowto=false;openHowtoWin();}},2600);
}

// Future hook (Baymax): Semesta posts mainkan:spawn-done {kind:'tent'|'kost'} after spawnAt(); use it when present.
window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===world()&&e.data?.type==='mainkan:spawn-done'){spawnShown=false;spawnHookSeen=true;spawnReveal(e.data.kind);}});
let spawnHookSeen=false;

/* ---------- world indicators: quest markers over NPCs + door glints/tooltips (overlay only) ----------
 * Projection: SemestaPlay.worldToScreen(x,y,z) if Baymax adds it; otherwise the known Semesta camera
 * (orthographic, 2:1 iso direction (1,√(2/3),1), follow cam viewSize 16, wheel zoom mirrored) centred on the
 * live player position (SemestaPlay.playerPosition() if present, else the VLSpawnHobo snapshot actor).
 * Data: SemestaPlay.questMarkers() → [{npcId,state:'available'|'ready'}] and SemestaPlay.enterables() →
 * [{id,name,x,z}] when present; else quest_npc objects from worldDirectory() (state unknown → '!') and a
 * PLACEHOLDER sample of enterables taken from the real life sites (no enterable flags in the map yet). */
const marks=$('njhMarks');
const SQ=Math.sqrt(2/3),CAM_R=[1/Math.SQRT2,0,-1/Math.SQRT2],CAM_U=[-SQ*Math.sqrt(3)/4,2*Math.sqrt(3)/4,-SQ*Math.sqrt(3)/4];
let viewSize=16,markPool=new Map(),demo=params.get('markers')==='demo'||DEV;
const SAMPLE_DOORS=/^(warung|coffee|kost|loak|course|public_wc|public_bath|prayer_|pasar_ikan)/;
function sp(){try{return world()?.SemestaPlay||null;}catch{return null;}}
function playerPos(){
 const S=sp();try{const p=S?.playerPosition?.();if(p&&Number.isFinite(p.x))return p;}catch{}
 // read-only: the Nokia map snapshot already carries the live player position
 try{const a=world()?.VL?.gameSnapshot?.()?.map?.player;if(a&&Number.isFinite(a.x))return a;}catch{}
 try{const a=world()?.VLSpawnHobo?.snapshot?.()?.actor;if(a&&Number.isFinite(a.x))return a;}catch{}
 return null;
}
// Semesta's follow camera eases toward the player (alpha = 1-exp(-dt·10)); mirror it so markers don't swim.
let camFocus=null,camT=0;
function cameraFocus(){
 const p=playerPos();const t=performance.now();if(!p){camFocus=null;return null;}
 if(!camFocus||Math.hypot(p.x-camFocus.x,p.z-camFocus.z)>12)camFocus={x:p.x,z:p.z};
 else{const a=1-Math.exp(-Math.min(.1,(t-camT)/1000)*10);camFocus={x:camFocus.x+(p.x-camFocus.x)*a,z:camFocus.z+(p.z-camFocus.z)*a};}
 camT=t;return {x:camFocus.x,z:camFocus.z,px:p.x,pz:p.z};
}
function canvasRect(){
 const fr=frame.getBoundingClientRect();
 let c=null;try{c=wdoc()?.querySelector('#canvas-wrap canvas')||wdoc()?.querySelector('canvas');}catch{}
 const r=c?.getBoundingClientRect();if(!r||!r.width)return null;
 const hr=$('njhHud').getBoundingClientRect();
 return {x:fr.left+r.left-hr.left,y:fr.top+r.top-hr.top,w:r.width,h:r.height};
}
function project(x,y,z,rect,me){
 const S=sp();
 // real hook: canvas pixels from the canvas top-left, {x,y,visible}
 if(typeof S?.worldToScreen==='function'){try{const p=S.worldToScreen(x,y,z);return p&&p.visible!==false&&Number.isFinite(p.x)?{x:rect.x+p.x,y:rect.y+p.y}:null;}catch{return null;}}
 if(!me)return null;
 const dx=x-me.x,dy=y,dz=z-me.z,k=rect.h/viewSize;
 return {x:rect.x+rect.w/2+(dx*CAM_R[0]+dz*CAM_R[2])*k,y:rect.y+rect.h/2-(dx*CAM_U[0]+dy*CAM_U[1]+dz*CAM_U[2])*k};
}
function questList(){
 const S=sp();if(!S)return [];
 let dir=[];try{dir=S.worldDirectory?.()||[];}catch{}
 if(typeof S.questMarkers==='function'){
  try{const byId=new Map(dir.map(o=>[String(o.id),o]));
   return (S.questMarkers()||[]).map(q=>{const o=byId.get(String(q.npcId));return o&&{id:'q:'+o.id,npc:o,x:o.x,z:o.z,name:o.name,state:q.state==='ready'?'ready':'available',sample:false};}).filter(Boolean);}catch{return [];}
 }
 const all=dir.filter(o=>o.type==='quest_npc');
 if(typeof window.NJH98Mock?.questState==='function')
  return all.map(o=>{const st=window.NJH98Mock.questState(o);return st&&{id:'q:'+o.id,npc:o,x:o.x,z:o.z,name:o.name||'NPC',state:st,sample:true};}).filter(Boolean);
 return all.map((o,i)=>({id:'q:'+o.id,npc:o,x:o.x,z:o.z,name:o.name||'NPC',state:demo&&i===1?'ready':'available',sample:true}));
}
function doorList(){
 const S=sp();
 // real hook first; an empty list (no interiors on this map yet) falls back to the marked sample
 if(typeof S?.enterables==='function'){try{const v=(S.enterables()||[]).map(d=>({id:'d:'+d.id,x:+d.x,z:+d.z,name:d.name||'Bangunan',sample:false}));if(v.length)return v;}catch{}}
 let dir=[];try{dir=S?.worldDirectory?.()||[];}catch{}
 const real=dir.filter(o=>o.enterable).map(o=>({id:'d:'+o.id,x:o.x,z:o.z,name:o.name||o.label||'Bangunan',sample:false}));
 if(real.length)return real;
 let sites=[];try{sites=life()?.sites?.()||[];}catch{}
 return sites.filter(s=>s&&(!s.placeholder||s.id==='kost')&&SAMPLE_DOORS.test(s.id)&&Number.isFinite(s.x)).map(s=>({id:'d:'+s.id,x:s.x,z:s.z,name:s.label,sample:true}));
}
function mark(id,cls,html){
 let el=markPool.get(id);
 if(!el){el=document.createElement('div');el.dataset.id=id;marks.append(el);markPool.set(id,el);}
 if(el.className!==cls)el.className=cls;if(el._h!==html){el.innerHTML=html;el._h=html;}
 el._live=true;return el;
}
let doorNear='',doorNearObj=null,cueT=0,cueOn=false;
function paintMarks(){
 if(!marks)return;
 const show=current==='gameScreen'&&!document.body.classList.contains('njh-modal')&&!ctxOpen;
 marks.hidden=!show;doorNear='';doorNearObj=null;
 if(!show)return;
 const rect=canvasRect(),me=cameraFocus();
 for(const el of markPool.values())el._live=false;
 if(rect){
  const qpts=[];
  for(const q of questList()){
   const p=project(q.x,2.15,q.z,rect,me);if(!p||p.x<rect.x-20||p.y<rect.y-30||p.x>rect.x+rect.w+20||p.y>rect.y+rect.h+20)continue;
   const el=mark(q.id,'njh-qmark '+q.state+(q.sample?' sample':''),'<b>'+(q.state==='ready'?'?':'!')+'</b>');
   el._q=q;el.title=q.name+(q.state==='ready'?' · quest siap diserahkan':' · punya quest')+(q.sample?' (status contoh)':'');
   el.style.transform='translate('+Math.round(p.x)+'px,'+Math.round(p.y)+'px)';qpts.push(p);
  }
  let best=null;
  for(const d of doorList()){
   const p=project(d.x,0.15,d.z,rect,me);if(!p||p.x<rect.x||p.y<rect.y||p.x>rect.x+rect.w||p.y>rect.y+rect.h)continue;
   const el=mark(d.id,'njh-glint'+(d.sample?' sample':''),'<i></i>');
   el.style.transform='translate('+Math.round(p.x)+'px,'+Math.round(p.y)+'px)';
   if(me){const dist=Math.hypot(d.x-me.px,d.z-me.pz);if(dist<4&&(!best||dist<best.dist))best={...d,dist,p:project(d.x,2.7,d.z,rect,me)||p};}
  }
  // interaction cue: visual-only "!" bubble above the PLAYER's head while something is actionable nearby (Action button / E opens the menu)
  let hp=null;
  if(me){const now=performance.now();if(now-cueT>180){cueT=now;cueOn=!!best||contextualNear();}
   hp=cueOn&&project(me.px,2.2,me.pz,rect,me);
   if(hp){const el=mark('pcue','njh-pcue','<b>!</b>');el.style.transform='translate('+Math.round(hp.x)+'px,'+Math.round(hp.y)+'px)';}}
  const nowR=performance.now();reacts=reacts.filter(r=>r.until>nowR);
  for(const r of reacts){const p=project(r.x,2.15,r.z,rect,me);if(!p)continue;const el=mark(r.id,'njh-emote','<b>~</b>');el.style.transform='translate('+Math.round(p.x)+'px,'+Math.round(p.y)+'px)';}
  if(best){
   doorNear=best.id;doorNearObj=best;const g=markPool.get(best.id);if(g)g._live=false;
   const el=mark('tip','njh-doortip','<b>'+esc(best.name)+'</b> · Masuk ['+(coarse()?'AKSI':'E')+']'+(best.sample?'<span class="njh-soon nologic">CONTOH</span>':''));
   // the door tooltip never covers the player's "!" cue: lift it above the bubble when they would meet
   // …nor an NPC's quest "!" (marker box spans y-26…y-4): stack the tooltip above whatever it would cover
   let ty=hp&&Math.abs(best.p.x-hp.x)<180?Math.min(best.p.y,hp.y-20):best.p.y;
   for(const q of qpts)if(Math.abs(q.x-best.p.x)<180&&ty>q.y-30&&ty-20<q.y-4)ty=q.y-30;
   el.style.transform='translate('+Math.round(best.p.x)+'px,'+Math.round(ty)+'px)';
  }
 }
 for(const [id,el] of markPool)if(!el._live){el.remove();markPool.delete(id);}
}
function markLoop(){paintMarks();requestAnimationFrame(markLoop);}
requestAnimationFrame(markLoop);
// Baymax: world dispatches CustomEvent 'mainkan:npc-react' {action, emote} (e.g. after a fart near an NPC).
// UI shows a small symbol-only bubble over the NPCs within ~2 tiles for 2.5 s. Nothing else happens.
let reacts=[];
function worldReact(w){
 if(w.__njh98React)return;w.__njh98React=true;
 w.addEventListener('mainkan:npc-react',e=>{try{
  const me=playerPos();if(!me)return;const t=performance.now()+2500;
  let pts=[];try{pts=(sp()?.worldDirectory?.()||[]).filter(o=>/npc/i.test(String(o.type||'')));}catch{}
  try{pts=pts.concat((life()?.sites?.()||[]).filter(o=>o.npc));}catch{}
  reacts=pts.filter(o=>Number.isFinite(o.x)&&Math.hypot(o.x-me.x,o.z-me.z)<=2.5).map(o=>({id:'r:'+(o.id||o.x+','+o.z),x:o.x,z:o.z,until:t,emote:String(e.detail?.emote||'')}));
 }catch{}});
}
function worldZoom(w){
 if(w.__njh98Zoom)return;w.__njh98Zoom=true;
 // mirror Semesta's wheel zoom (viewSize×1.12 / ×0.89, clamp 8..180) so the fallback projection stays aligned
 w.addEventListener('wheel',e=>{if(e.target?.tagName!=='CANVAS')return;if(e.ctrlKey||e.deltaMode===0)viewSize=Math.max(8,Math.min(180,viewSize*(e.deltaY>0?1.12:.89)));},{capture:true,passive:true});
}

/* ---------- main tick ---------- */
function tick(){
 if(current!=='gameScreen')return;
 avatarTick++;
 decorateWorld(false);
 const st=lifeState();
 if(st){paintNeeds(st);paintProfile(st);}
 paintClock();
 if(avatarTick%2===0)paintAvatar();
 if(!$('njhStatusWin')?.hidden&&avatarTick%4===0)paintStatus();
 if(!$('njhBagWin')?.hidden&&avatarTick%4===0)paintBag();
 if(ctxOpen){const info=ctxInfo();if(!info||info.work||info.label!==ctxLabel)closeCtx();}
 paintNear();paintModal();
 try{window.NJH98Mock?.tick?.(st);}catch(err){console.warn(err);}
 if(!spawnShown&&!spawnHookSeen&&$('worldLoading')?.hidden&&st)spawnReveal();
}
setInterval(tick,500);
setInterval(()=>{if(current==='gameScreen')paintProgress();},100);

/* ---------- inject Win98 skin into the same-origin world iframe ---------- */
function injectWorld(){
 const w=world();
 try{
  const d=w?.document;if(!d||!d.documentElement)return;
  d.documentElement.classList.add('njh98');
  d.documentElement.classList.toggle('njh-devtools',DEV);
  if(!d.getElementById('njh98-world-css')&&d.head){
   const l=d.createElement('link');l.id='njh98-world-css';l.rel='stylesheet';
   l.href=new URL('./njh98-world.css?v=njh98-5',location.href).href;d.head.appendChild(l);
  }
  worldKeys(w);worldZoom(w);worldReact(w);
 }catch{}
}
frame.addEventListener('load',()=>{decorated=null;viewSize=16;ctxOpen=false;spawnShown=false;injectWorld();});
$('njhClock')?.addEventListener('click',()=>{try{wdoc()?.documentElement?.classList.toggle('njh-show-clock');}catch{}});

/* observe (never alter) the profile Mainkan sends to Semesta, for the avatar + name */
window.addEventListener('message',e=>{
 if(e.origin!==location.origin||e.source!==world()||e.data?.type!=='mainkan:profile-request')return;
 injectWorld();
 try{
  e.source.addEventListener('message',ev=>{
   if(ev.origin===location.origin&&ev.data?.type==='mainkan:player-profile'&&ev.data.profile){profile=ev.data.profile;paintAvatar();}
  });
 }catch{}
});

/* placeholders are disabled; make sure nothing can activate them */
document.querySelectorAll('[data-njh-placeholder]').forEach(b=>{b.disabled=true;b.setAttribute('aria-disabled','true');});

window.NJH98=Object.freeze({world,wdoc,life,sp,lifeState,worldText,rp,esc,clamp,notice,toast,closeWindows,toggleWin,closeCtx,
 openHowto:openHowtoWin,paintStatus,ICON,big,coarse,DEV,store,NEEDS,profile:()=>profile,current:()=>current,
 playerPos,questList,doorList,doorNear:()=>doorNearObj});
onScreen();
})();
