/* Namanya Juga Hidup — the Game · Win98 UI layer (presentation only).
 * - wizard step bar for the existing onboarding flow (reads screen visibility)
 * - fullscreen play mode + Win98 HUD windows over the Semesta iframe
 * - optional Fullscreen API toggle (user gesture only)
 * - clearly labelled placeholders for flows that have no logic yet
 * Reads SemestaLifePlay.state() and the iframe clock READ-ONLY. It never calls
 * runAction, never writes storage, never changes postMessage contracts.
 */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const frame=$('semestaFrame');
if(!frame)return;
const STEP_OF={welcomeScreen:'welcome',loginScreen:'login',characterScreen:'character',confirmScreen:'confirm',loadingScreen:'tutorial',tutorialScreen:'tutorial',gameScreen:'play',pauseScreen:'play'};
const ORDER=['welcome','login','character','confirm','tutorial','play'];
const SCREENS=Object.keys(STEP_OF).concat(['splashScreen','messageScreen']);
const seen=new Set();
let current='';

/* ---------- 16px pixel icons (crisp SVG rects, no emoji) ---------- */
const px=(rows,pal)=>{
 let r='';rows.forEach((row,y)=>{for(let x=0;x<row.length;x++){const c=pal[row[x]];if(c)r+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+c+'"/>';}});
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
const titleIcon=document.querySelector('.titlebar .icon');
if(titleIcon)titleIcon.innerHTML=ICON.app;
document.querySelectorAll('#njhTutorialCards .card').forEach(c=>{const i=c.querySelector('i');if(i)i.innerHTML=(ICON[c.dataset.icon]||'').replace('width="20" height="20"','width="32" height="32"');});

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
function onScreen(){
 const now=visibleScreen();
 if(now===current)return;
 current=now;
 if(now==='welcomeScreen')seen.clear();
 if(STEP_OF[now])seen.add(STEP_OF[now]);
 paintSteps();
 const playing=now==='gameScreen';
 document.body.classList.toggle('njh-play',playing);
 document.body.classList.toggle('njh-paused',now==='pauseScreen');
 const hud=$('njhHud');if(hud)hud.hidden=!playing;
 if(playing){injectWorld();tick();}
 else closeWindows();
 paintFull();
}
const mo=new MutationObserver(onScreen);
SCREENS.forEach(id=>{const el=$(id);if(el)mo.observe(el,{attributes:true,attributeFilter:['hidden']});});

/* ---------- login back (re-uses the existing return-to-menu path) ---------- */
$('njhLoginBack')?.addEventListener('click',()=>$('homeButton')?.click());

/* ---------- fullscreen (optional, user gesture) ---------- */
const docEl=document.documentElement;
const fsSupported=!!(docEl.requestFullscreen||docEl.webkitRequestFullscreen);
const fsElement=()=>document.fullscreenElement||document.webkitFullscreenElement||null;
function toggleFull(){
 if(!fsSupported){
  notice('Layar Penuh','Browser ini belum mendukung layar penuh dari halaman web (umumnya iPhone/iPad). Mode main sudah memenuhi layar. Untuk tanpa bar browser: Bagikan → Tambah ke Layar Utama.');
  return;
 }
 try{
  if(fsElement())(document.exitFullscreen||document.webkitExitFullscreen).call(document);
  else{const r=(docEl.requestFullscreen||docEl.webkitRequestFullscreen).call(docEl,{navigationUI:'hide'});if(r&&r.catch)r.catch(()=>notice('Layar Penuh','Browser menolak layar penuh. Coba lagi dari tombol ini.'));}
 }catch{notice('Layar Penuh','Browser menolak layar penuh.');}
}
function paintFull(){
 const on=!!fsElement();
 const s=$('njhPauseFullState');if(s)s.textContent=fsSupported?(on?'Nyala':'Mati'):'Tidak didukung';
 const d=$('njhDockFull');if(d){d.classList.toggle('is-on',on);d.setAttribute('aria-pressed',String(on));}
}
document.addEventListener('fullscreenchange',paintFull);
document.addEventListener('webkitfullscreenchange',paintFull);
$('njhPauseFull')?.addEventListener('click',toggleFull);
$('njhTitleFull')?.addEventListener('click',toggleFull);
$('njhPauseReload')?.addEventListener('click',()=>{$('resumeGame')?.click();setTimeout(()=>$('reloadWorld')?.click(),0);});
$('njhTitleMenu')?.addEventListener('click',()=>$('pauseButton')?.click());

/* ---------- dock ---------- */
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
 adopt('gamePhone','Nokia','nokia','Buka HP Nokia');
 adopt('gameBag','Tas','bag','Buka tas / inventori');
 app('njhDockStatus','Status','status','Status pemain').addEventListener('click',()=>toggleWin('njhStatusWin',paintStatus));
 app('njhDockMap','Peta','map','Peta ada di Nokia → Peta').addEventListener('click',()=>{
  $('gamePhone')?.click();
  toast('Peta ada di Nokia: Menu → Peta.');
 });
 const sep=document.createElement('i');sep.className='njh-dsep';sep.setAttribute('aria-hidden','true');dock.append(sep);
 app('njhDockMenu','Menu','menu','Menu jeda').addEventListener('click',()=>$('pauseButton')?.click());
 app('njhDockFull','Layar','full','Layar penuh').addEventListener('click',toggleFull);
}

const modalClose=document.createElement('button');modalClose.type='button';modalClose.id='njhModalClose';modalClose.className='btn njh-modal-close';modalClose.hidden=true;
modalClose.addEventListener('click',()=>{try{world()?.document?.getElementById('ptWinClose')?.click();}catch{}setTimeout(paintModal,50);});
$('njhHud')?.append(modalClose);
/* ---------- Win98 windows ---------- */
function closeWindows(){document.querySelectorAll('.njh-win').forEach(w=>w.hidden=true);}
function toggleWin(id,paint){const w=$(id);if(!w)return;const open=w.hidden;closeWindows();if(open){paint&&paint();w.hidden=false;w.querySelector('[data-close]')?.focus();}}
document.addEventListener('click',e=>{const c=e.target.closest('.njh-win [data-close]');if(c)c.closest('.njh-win').hidden=true;});
function notice(title,text){
 const w=$('njhNotice');
 if(!w||$('njhHud')?.hidden){window.alert(text);return;}
 $('njhNoticeTitle').textContent=title;$('njhNoticeText').textContent=text;closeWindows();w.hidden=false;
}
let toastTimer=0;
function toast(text){
 let t=$('njhToast');
 if(!t){t=document.createElement('div');t.id='njhToast';t.setAttribute('role','status');
  t.style.cssText='position:absolute;left:50%;transform:translateX(-50%);bottom:calc(140px + env(safe-area-inset-bottom,0px));z-index:6;pointer-events:none;background:#ffffe1;color:#000;border:1px solid #000;padding:3px 6px;font:11px var(--w-font);max-width:calc(100% - 24px)';
  $('njhHud')?.append(t);}
 t.textContent=text;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{t.hidden=true;},2600);
}

/* ---------- read-only game data ---------- */
function world(){try{return frame.contentWindow||null;}catch{return null;}}
function lifeState(){try{return world()?.SemestaLifePlay?.state?.()||null;}catch{return null;}}
function worldText(id){try{return world()?.document?.getElementById(id)?.textContent?.trim()||'';}catch{return '';}}
const rp=n=>'Rp '+Math.round(Number(n)||0).toLocaleString('id-ID');
const clamp=v=>Math.max(0,Math.min(100,Math.round(Number(v)||0)));
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
 const st=lifeState()||{};
 const esc=v=>String(v??'—').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const rows=[['Nama',profile?.name||'Pemain'],['Tempat tinggal',st.housing?.room?'Kamar kost':'Tenda (hobo)'],['Dompet',rp(st.wallet)],
  ['Token listrik',(st.powerTokens??0)+' token'],['Tas',(st.inventory||[]).length+' barang'],['Furnitur',(st.furniture||[]).join(', ')||'belum ada'],
  ['Agama',st.identity?.religion||'—'],['Zodiak',profile?.zodiac||st.identity?.zodiac||'—']];
 const need=NEEDS.map(([k,l])=>[l,clamp(st[k])+' / 100']);
 b.innerHTML='<fieldset class="njh-group"><legend>Kondisi</legend><table>'+need.map(([k,v])=>'<tr><th>'+k+'</th><td>'+v+'</td></tr>').join('')+'</table></fieldset>'+
  '<fieldset class="njh-group"><legend>Hidup</legend><table>'+rows.map(([k,v])=>'<tr><th>'+esc(k)+'</th><td>'+esc(v)+'</td></tr>').join('')+'</table></fieldset>'+
  '<fieldset class="njh-group"><legend>Progres tempat tinggal <span class="njh-soon">SEGERA</span></legend><div class="njh-ladder" aria-label="Tenda, Kost, Rumah"><span class="'+(st.housing?.room?'':'on')+'">Tenda</span><span class="'+(st.housing?.room?'on':'')+'">Kost</span><span title="Belum ada logic level rumah">Rumah Lv.?</span></div><p class="micro">Level rumah belum ada logic-nya. Sekarang cuma Tenda atau Kost.</p></fieldset>'+
  '<fieldset class="njh-group"><legend>Skill &amp; reputasi <span class="njh-soon nologic">BELUM ADA LOGIC</span></legend><p class="micro">Skill bernama, reputasi, dan kepercayaan warga belum ada di ekonomi Jiwa. Sementara cuma EXP total.</p></fieldset>'+
  '<div class="njh-row"><button type="button" class="btn" disabled title="Belum ada logic: laporan harian">Laporan Hari <span class="njh-soon">SEGERA</span></button><button type="button" class="btn primary" data-close>OK</button></div>';
}
let lastSlpTitle=null;
function decorateWorld(){
 const w=world();if(!w)return;
 try{
  const h=w.document.querySelector('#semestaLifePlayPanel h3');
  if(h&&h!==lastSlpTitle){h.textContent='Aksi & Tas';lastSlpTitle=h;}
 }catch{}
}
function tick(){
 if(current!=='gameScreen')return;
 avatarTick++;
 decorateWorld();
 const st=lifeState();
 if(st){paintNeeds(st);paintProfile(st);}
 paintClock();
 if(avatarTick%2===0)paintAvatar();
 if(!$('njhStatusWin')?.hidden&&avatarTick%4===0)paintStatus();
 paintModal();
}
/* Nokia / bag popups live in the iframe; on phones the HUD steps aside while one is open */
function paintModal(){
 let kind='';
 try{const w=world()?.document?.getElementById('ptWindow');if(w&&!w.hidden&&w.offsetParent!==null)kind=w.getAttribute('data-kind')||'window';}catch{}
 document.body.classList.toggle('njh-modal',!!kind);
 const close=$('njhModalClose');
 if(close){close.hidden=!kind;close.textContent=kind==='phone'?'× Tutup Nokia':'× Tutup';}
}
setInterval(tick,500);

/* ---------- inject Win98 skin into the same-origin world iframe ---------- */
function injectWorld(){
 const w=world();
 try{
  const d=w?.document;if(!d||!d.documentElement)return;
  d.documentElement.classList.add('njh98');
  if(!d.getElementById('njh98-world-css')&&d.head){
   const l=d.createElement('link');l.id='njh98-world-css';l.rel='stylesheet';
   l.href=new URL('./njh98-world.css?v=njh98-1',location.href).href;d.head.appendChild(l);
  }
 }catch{}
}
frame.addEventListener('load',injectWorld);
$('njhClock')?.addEventListener('click',()=>{try{world()?.document?.documentElement?.classList.toggle('njh-show-clock');}catch{}});

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

onScreen();
})();
