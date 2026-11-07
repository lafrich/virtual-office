/* Shared Play HUD for Namanya Juga Hidup: The Game.
 * Used by Jiwa Play Test and Semesta Walk Test / Play so the chrome is not duplicated.
 * Visual language is the old Virtual Life HUD: v9a shell windows, v12a Y2K dock/orbs, v11a Nokia HP.
 */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.VLPlayHud=api;
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:null,function(root){
 'use strict';
 const STYLE_ID='ptHudStyle';
 const GAMEPLAY_KEY='virtual-life-gameplay-v1';
 const CSS_FILES=['shell.css','y2k.css','nokia.css','play-hud-adapter.css'];
 const JS_FILES=['phone_ellen.js','nokia-play.js'];
 let mounted=null,openWindow=null,opts={},artReady=false,running=false,tipTimer=0;

 function $(id){return (opts.document||(root&&root.document)||document).getElementById(id);}
 function docOf(){return opts.document||(root&&root.document)||document;}
 function projectName(){
  return (root&&root.VLHub&&root.VLHub.PROJECT_NAME)||
   (root&&root.JiwaGameplay&&root.JiwaGameplay.PROJECT_NAME)||
   'Namanya Juga Hidup: The Game';
 }
 function readRaw(){
  if(typeof opts.getGameplay==='function'){
   try{return opts.getGameplay();}catch{}
  }
  try{
   const key=(root&&root.VLHub&&root.VLHub.GAMEPLAY_KEY)||GAMEPLAY_KEY;
   const raw=root&&root.localStorage&&root.localStorage.getItem(key);
   return raw?JSON.parse(raw):null;
  }catch{return null;}
 }
 function current(){
  const JG=root&&root.JiwaGameplay;
  const raw=readRaw();
  return JG?JG.normalizeGameplay(raw):raw||null;
 }
 function hudBase(doc){
  const scripts=(doc||docOf()).querySelectorAll('script[src]');
  for(const s of scripts){
   if(/play-hud\.js/.test(s.src||s.getAttribute('src')||'')){
    return String(s.src).replace(/play-hud\.js.*$/,'vl-hud/');
   }
  }
  return '../shared/vl-hud/';
 }
 function injectStyle(doc){
  if(!doc||doc.getElementById(STYLE_ID))return;
  const base=hudBase(doc);
  for(const file of CSS_FILES){
   const id='ptHud_'+file.replace(/\W+/g,'_');
   if(doc.getElementById(id))continue;
   const link=doc.createElement('link');
   link.id=id;link.rel='stylesheet';link.href=base+file;
   (doc.head||doc.documentElement).appendChild(link);
  }
  const s=doc.createElement('style');s.id=STYLE_ID;
  s.textContent='/* play-hud loaded stylesheets from '+base+' */';
  (doc.head||doc.documentElement).appendChild(s);
  loadY2kArt(doc,base);
  injectHudScripts(doc);
 }
 function injectHudScripts(doc){
  const base=hudBase(doc);
  for(const file of JS_FILES){
   const id='ptHud_'+file.replace(/\W+/g,'_');
   if(doc.getElementById(id))continue;
   const s=doc.createElement('script');
   s.id=id;s.src=base+file;
   s.onerror=function(){};
   (doc.head||doc.documentElement).appendChild(s);
  }
 }
 function loadY2kArt(doc,base){
  if(artReady)return;
  const apply=function(ART){
   if(!ART||!doc.body)return;
   const url=k=>ART[k]?("url('"+ART[k]+"')"):'none';
   const V={'--y2-act-n':'act_normal','--y2-act-p':'act_pressed','--y2-act-d':'act_disabled',
    '--y2-hp-n':'hp_normal','--y2-hp-p':'hp_pressed','--y2-hp-d':'hp_disabled',
    '--y2-bag-n':'bag_normal','--y2-bag-p':'bag_pressed','--y2-bag-d':'bag_disabled',
    '--y2-coin':'i16_coin','--y2-hourglass':'i16_hourglass','--y2-warn':'i16_warn'};
   doc.body.classList.add('y2k','vs');
   Object.keys(V).forEach(k=>doc.body.style.setProperty(k,url(V[k])));
   artReady=true;
  };
  try{
   if(typeof fetch==='function'){
    fetch(base+'y2k_art.json').then(r=>r.ok?r.json():null).then(apply).catch(function(){});
   }
  }catch{}
 }
 function chromeHtml(includeCanvas){
  return (includeCanvas?
   '<div class="pt-title" id="ptTitle"></div><canvas id="playtestMap" width="720" height="360" aria-label="Play Test world"></canvas>':'')+
   '<div id="vs-hud">'+
    '<div id="vs-needs" class="vs-needs" aria-hidden="true">'+
     '<div class="vs-need" data-n="hunger"><i></i><span class="vs-tr"><span class="vs-fl" id="vsNeedHunger"></span></span></div>'+
     '<div class="vs-need" data-n="energy"><i></i><span class="vs-tr"><span class="vs-fl" id="vsNeedEnergy"></span></span></div>'+
     '<div class="vs-need" data-n="hygiene"><i></i><span class="vs-tr"><span class="vs-fl" id="vsNeedHygiene"></span></span></div>'+
     '<div class="vs-need" data-n="fun"><i></i><span class="vs-tr"><span class="vs-fl" id="vsNeedFun"></span></span></div>'+
    '</div>'+
    '<div class="y2-dock" id="y2-dock">'+
     '<div class="y2-bar" id="y2-bar">'+
      '<div class="y2-seg"><div id="vs-money" class="vs-money">Rp 0</div></div>'+
      '<i class="y2-sep"></i>'+
      '<div class="y2-seg"><button type="button" class="vs-rb vs-hp pt-btn pt-phone" id="ptPhoneBtn" aria-label="HP">HP</button><span class="y2-lb">HP</span></div>'+
      '<i class="y2-sep"></i>'+
      '<div class="y2-seg"><button type="button" class="vs-rb vs-bag pt-btn pt-bag" id="ptBagBtn" aria-label="Bag">BAG</button><span class="y2-lb">Bag</span></div>'+
     '</div>'+
     '<div class="vs-actw"><button type="button" class="vs-act pt-btn pt-action" id="ptActionBtn" aria-label="Action"><i></i>ACTION</button><div class="vs-actl">Action</div></div>'+
    '</div>'+
    '<button type="button" id="ptRunBtn" class="vs-run" aria-label="Hold to run">RUN</button>'+
    (includeCanvas?'':'<div class="pt-title" id="ptTitle"></div>')+
    '<div class="pt-readout" id="ptMoveReadout"></div>'+
   '</div>'+
   '<div id="vs-layer"><div class="vsw9 pt-window" id="ptWindow" hidden>'+
    '<div class="vst9 pt-winbar"><span id="ptWinTitle" class="vstt9"></span>'+
    '<button type="button" class="vsx9 pt-x" id="ptWinClose" aria-label="Close">×</button></div>'+
    '<div class="vsb9 pt-winbody" id="ptWinBody"></div></div></div>'+
   '<div id="vs-tip"></div>';
 }
 function applyHudLayout(g){
  const HL=root&&root.VLHudLayout;
  if(!HL||!mounted)return;
  try{HL.applyTo(mounted,g||current(),HL.detectProfile(docOf()));}catch(_e){}
 }
 function layoutHud(){
  const hud=$('vs-hud');if(!hud)return;
  const view=docOf().defaultView;
  const w=hud.getBoundingClientRect().width||(view&&view.innerWidth)||800;
  hud.classList.toggle('narrow',w<=420);
  applyHudLayout(current());
 }
 function setLayerOpen(on){
  const layer=$('vs-layer');
  if(layer)layer.classList.toggle('on',!!on);
  const body=docOf().body;
  if(body){
   body.classList.toggle('vs-win',!!on);
   body.classList.toggle('y2-hp-open',openWindow==='phone');
   body.classList.toggle('y2-bag-open',openWindow==='bag');
   body.classList.toggle('vs-nk-open',openWindow==='phone');
  }
 }
 function toggleWindow(name){
  const g=current()||{modules:{},hud:{}};
  if(!name||(openWindow===name))openWindow=null;
  else{
   openWindow=name;
   if(g.hud&&g.hud.oneWindowAtATime)openWindow=name;
   if(name==='phone'&&!(g.modules.phone&&g.modules.phone.enabled))openWindow=null;
   if(name==='bag'&&!(g.modules.bag&&g.modules.bag.enabled))openWindow=null;
  }
  renderWindows();
 }
 function renderWindows(){
  const win=$('ptWindow');if(!win)return;
  if(!openWindow){win.hidden=true;win.removeAttribute('data-kind');setLayerOpen(false);if(root&&root.VLNokiaPlay){try{root.VLNokiaPlay.close();}catch{}}return;}
  win.hidden=false;win.dataset.kind=openWindow;setLayerOpen(true);
  const g=current()||{modules:{}};
  const JG=root&&root.JiwaGameplay;
  const PROJECT=projectName();
  const doc=docOf();
  if(root&&root.VLNokiaPlay&&openWindow!=='phone'){try{root.VLNokiaPlay.close();}catch{}}
  if(openWindow==='phone'){
   $('ptWinTitle').textContent='NOKIA · '+PROJECT;
   const apps=JG?JG.enabledPhoneApps(g):Object.keys((g.modules.phone&&g.modules.phone.apps)||{}).filter(id=>g.modules.phone.apps[id]);
   const body=$('ptWinBody');body.replaceChildren();
   const hidden=doc.createElement('div');hidden.className='pt-nokia-apps';
   hidden.textContent=apps.length?('NOKIA · '+apps.map(id=>String(id).toUpperCase()).join(' ')):'NOKIA · No phone apps enabled.';
   body.append(hidden);
   if(root&&root.VLNokiaPlay&&typeof root.VLNokiaPlay.open==='function'){
    root.VLNokiaPlay.onHostClose(function(){if(openWindow==='phone')toggleWindow(null);});
    // Rendering the HUD happens after every Jiwa wallet/stat change.
    // Reopening an already-open handset would reset its screen to standby
    // and undo the player's menu selection mid-transaction.
    try{if(!root.VLNokiaPlay.isOpen?.())root.VLNokiaPlay.open();}catch{}
   }
  }else if(openWindow==='bag'){
   $('ptWinTitle').textContent='BAG';
   const slots=(g.modules.bag&&g.modules.bag.slots)||8;
   let items=[];
   try{items=(typeof opts.getInventory==='function'&&opts.getInventory())||[];}catch{items=[];}
   const body=$('ptWinBody');body.replaceChildren();
   const grid=doc.createElement('div');grid.className='pt-slots vs-slots';
   for(let i=0;i<slots;i++){
    const cell=doc.createElement('div');cell.className='pt-slot vs-slot';
    cell.textContent=items[i]||'—';
    grid.append(cell);
   }
   body.append(grid);
   if(root&&root.VLLoakPlay&&root.VLLoakPlay.loakOn()){
    const extra=doc.createElement('div');extra.className='vs-loak-sell';
    const qtitle=doc.createElement('p');qtitle.className='vs-note';
    qtitle.textContent='Toko Loak · jual '+(root.VLLoakPlay.sellScale()*100).toFixed(0)+'% harga katalog × kurs harian';
    extra.append(qtitle);
    for(const it of (root.VLLoakPlay.inventory()||[])){
     const row=doc.createElement('div');row.className='vs-row';
     const q=root.VLLoakPlay.quote(it.typeId);
     const info=doc.createElement('span');
     info.textContent=(it.name||it.typeId)+' ×'+it.qty+' · tawaran Rp '+(q?q.unit:0).toLocaleString('id-ID');
     const sell=doc.createElement('button');sell.type='button';sell.className='xp';sell.textContent='Jual';
     sell.onclick=()=>{const r=root.VLLoakPlay.sell(it.typeId,it.qty);toast(r.ok?('Terjual +Rp '+r.amount):r.reason);apply();};
     const hag=doc.createElement('button');hag.type='button';hag.className='xp';hag.textContent='Tawar';
     hag.disabled=!!(q&&q.haggled);
     hag.onclick=()=>{const r=root.VLLoakPlay.haggle(it.typeId,10);toast(r.ok?(r.accepted?'Deal! Rp '+r.unit:'Ditolak · Rp '+r.unit):r.reason);apply();};
     row.append(info,sell,hag);extra.append(row);
    }
    body.append(extra);
   }
  }
 }
 function paintNeeds(g){
  const energy=g&&g.modules&&g.modules.energy;
  const on=!(!energy||energy.enabled===false);
  const needs=$('vs-needs');
  if(needs&&opts.hideLegacyNeeds){needs.style.display='none';return;}
  if(needs){needs.style.display='';needs.style.opacity=on?'1':'0.85';}
  const bars={vsNeedHunger:70,vsNeedEnergy:on?80:64,vsNeedHygiene:62,vsNeedFun:58};
  for(const id of Object.keys(bars)){
   const el=$(id);if(!el)continue;
   el.style.width=bars[id]+'%';
   el.style.background=id==='vsNeedHunger'?'#2BC12B':id==='vsNeedEnergy'?'#4C96FF':id==='vsNeedHygiene'?'#86CCFF':'#FFD166';
  }
 }
 function apply(g){
  g=g||current()||{modules:{movement:{}},hud:{}};
  const move=g.modules&&g.modules.movement||{};
  if($('ptTitle'))$('ptTitle').textContent=projectName()+' — Play Test';
  if($('ptMoveReadout')){
   $('ptMoveReadout').textContent=(move.controllerOnly?'CONTROLLER ONLY · ':'')+
    'WALK '+(move.walkSpeed??1.4)+' · RUN '+(move.runSpeed??2.2)+
    (g.modules&&g.modules.energy&&g.modules.energy.enabled?' · ENERGY ON':'');
  }
  if($('ptBagBtn'))$('ptBagBtn').hidden=!(g.modules&&g.modules.bag&&g.modules.bag.enabled);
  if($('ptPhoneBtn'))$('ptPhoneBtn').hidden=!(g.modules&&g.modules.phone&&g.modules.phone.enabled);
  if($('ptActionBtn'))$('ptActionBtn').hidden=!(g.modules&&g.modules.action&&g.modules.action.enabled);
  if(openWindow==='phone'&&!(g.modules.phone&&g.modules.phone.enabled))openWindow=null;
  if(openWindow==='bag'&&!(g.modules.bag&&g.modules.bag.enabled))openWindow=null;
  if($('vs-money')){
   let money=0;
   try{money=(typeof opts.getMoney==='function'&&opts.getMoney())||0;}catch{money=0;}
   $('vs-money').textContent='Rp '+Number(money||0).toLocaleString('id-ID');
  }
  paintNeeds(g);
  layoutHud();
  renderWindows();
  applyHudLayout(g);
  return g;
 }
 function setRunning(on){
  running=!!on;
  const btn=$('ptRunBtn');
  if(btn)btn.classList.toggle('on',running);
  if(typeof opts.onRunChange==='function')opts.onRunChange(running);
 }
 function bindRun(btn){
  if(!btn||btn.dataset.bound)return;
  btn.dataset.bound='1';
  const down=ev=>{ev.preventDefault();setRunning(true);};
  const up=()=>setRunning(false);
  btn.addEventListener('pointerdown',down);
  btn.addEventListener('pointerup',up);
  btn.addEventListener('pointerleave',up);
  btn.addEventListener('pointercancel',up);
  btn.addEventListener('lostpointercapture',up);
 }
 function toast(msg){
  const tip=$('vs-tip');
  if(tip){
   tip.innerHTML=String(msg||'');
   tip.classList.add('on');
   tip.style.display='block';
   clearTimeout(tipTimer);
   tipTimer=setTimeout(()=>{tip.classList.remove('on');tip.style.display='none';},2200);
  }
  if(typeof opts.toast==='function'){try{opts.toast(msg);}catch{}}
 }
 function setVisible(show){
  if(!mounted)return;
  mounted.hidden=!show;
  const doc=mounted.ownerDocument||(root&&root.document);
  if(doc&&doc.documentElement){
   if(show)doc.documentElement.classList.add('vl-play-hud-active');
   else doc.documentElement.classList.remove('vl-play-hud-active');
   if(doc.body)doc.body.classList.toggle('y2k',!!show);
  }
  if(show)layoutHud();
  if(!show){openWindow=null;setRunning(false);renderWindows();}
 }
 function mount(container,options){
  opts=options||{};
  if(!container)return null;
  const doc=container.ownerDocument||(root&&root.document);
  opts.document=doc;
  injectStyle(doc);
  if(container.dataset.ready&&mounted)return apiHandle();
  const mode=opts.mode||'stage';
  if(mode==='overlay'){
   container.insertAdjacentHTML('beforeend',
    '<div id="vlPlayHud" class="pt-overlay'+(opts.withWalkPad?' pt-with-pad':'')+'" hidden>'+chromeHtml(false)+'</div>');
   mounted=$('vlPlayHud');
  }else{
   container.innerHTML='<div class="pt-stage" id="ptStage">'+chromeHtml(!!opts.includeCanvas)+'</div>';
   mounted=$('ptStage')||container;
  }
  container.dataset.ready='1';
  if($('ptBagBtn'))$('ptBagBtn').onclick=()=>{
   if(typeof opts.onBag==='function'&&opts.onBag()===true)return;
   toggleWindow('bag');
  };
  if($('ptPhoneBtn'))$('ptPhoneBtn').onclick=()=>{
   if(typeof opts.onPhone==='function'&&opts.onPhone()===true)return;
   toggleWindow('phone');
  };
  if($('ptActionBtn')){
   const action=$('ptActionBtn');
   action.onclick=()=>{if(typeof opts.onAction==='function')opts.onAction();};
   action.addEventListener('pointerdown',ev=>{if(typeof opts.onActionDown==='function')opts.onActionDown(ev);});
   ['pointerup','pointercancel','pointerleave','lostpointercapture'].forEach(event=>
    action.addEventListener(event,ev=>{if(typeof opts.onActionUp==='function')opts.onActionUp(ev);}));
  }
  if($('ptWinClose'))$('ptWinClose').onclick=()=>toggleWindow(null);
  bindRun($('ptRunBtn'));
  const view=doc.defaultView;
  if(view&&!view.__vlHudResize){
   view.__vlHudResize=true;
   view.addEventListener('resize',layoutHud);
  }
  apply(current());
  if(mode==='stage'){
   setVisible(true);
   if(root&&root.VLHudLayout){
    root.VLHudLayout.bindPreview(mounted,{
     getGameplay:current,
     setGameplay:next=>{
      if(root.JiwaGameplayBridge&&typeof root.JiwaGameplayBridge.set==='function')root.JiwaGameplayBridge.set(next);
      apply(next);
     }
    });
   }
  }
  return apiHandle();
 }
 function apiHandle(){
  return {apply,current,toggleWindow,renderWindows,setVisible,mount,toast,setRunning,
   getOpenWindow:()=>openWindow,isRunning:()=>running,root:mounted};
 }
 return {mount,apply,current,toggleWindow,renderWindows,setVisible,toast,setRunning,
  getOpenWindow:()=>openWindow,read:current,isRunning:()=>running,applyHudLayout};
});
