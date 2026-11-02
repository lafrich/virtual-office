/* GPT Version-only recovery overlay. Loaded by the isolated beta service worker. */
'use strict';
function gptLoadingUI(){
  var root=null, retry=null, visible=false, visibleAt=0, badAt=0, stableAt=0, lastFault=0;
  var started=performance.now(), lastReason='asset', wasReady=false;
  function make(){
    if(root)return;
    root=document.createElement('div');
    root.id='gpt-loading-screen';
    root.className='on';
    root.setAttribute('role','status');
    root.setAttribute('aria-live','polite');
    root.innerHTML='<div class="gpt-xp-dialog"><div class="gpt-xp-title"><span class="gpt-xp-flag">▦</span> Virtual Life <span class="gpt-xp-title-right">●</span></div><div class="gpt-xp-content"><div class="gpt-xp-heading">Now loading...</div><div class="gpt-xp-sub">Preparing the world, please wait.</div><div class="gpt-xp-progress"><div class="gpt-xp-progress-motion"></div></div><div class="gpt-xp-footer"><span>Loading game assets</span><button type="button" id="gpt-loading-retry" hidden>Retry</button></div></div></div>';
    document.body.appendChild(root);
    retry=root.querySelector('#gpt-loading-retry');
    retry.addEventListener('click',function(){location.reload();});
    visible=true; visibleAt=performance.now();
  }
  function show(now){
    if(!root)make();
    if(!visible){visible=true;visibleAt=now;root.classList.add('on');root.setAttribute('aria-hidden','false');}
  }
  function hide(){
    if(!root||!visible)return;
    visible=false;
    root.classList.remove('on');
    root.setAttribute('aria-hidden','true');
    retry.hidden=true;
  }
  window.__gptLoader={
    fault:function(reason){lastReason=reason||'render';lastFault=performance.now();},
    state:function(){return {visible:visible,reason:lastReason,hadHealthyScene:wasReady};}
  };
  function tick(now){
    if(!document.hidden){
      var health=null;
      try{health=window.__gptLoaderHealth&&window.__gptLoaderHealth();}catch(e){health={ready:false,reason:'scene'};}
      var ready=health&&health.ready===true&&!!document.getElementById('stage');
      if(ready)wasReady=true;
      var justFailed=lastFault>0&&now-lastFault<850;
      var bad=!ready||justFailed;
      if(bad){
        stableAt=0;
        if(!badAt)badAt=now;
        if(!ready&&health&&health.reason)lastReason=health.reason;
        // A single missed frame must not flash a dialog. Initial boot starts covered.
        if(!wasReady||now-badAt>=160)show(now);
      }else{
        badAt=0;
        if(!stableAt)stableAt=now;
        // Wait for a stable scene and respect a minimum visible time.
        if(visible&&now-stableAt>=650&&now-visibleAt>=850)hide();
      }
      if(retry&&visible)retry.hidden=(now-visibleAt<9500);
    }
    requestAnimationFrame(tick);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',make,{once:true});
  else make();
  requestAnimationFrame(tick);
}
function gptLoadingPatch(html){
  function replaceOnce(a,b){
    if(html.split(a).length!==2)throw Error('GPT_LOADING_ANCHOR '+a.slice(0,65));
    html=html.replace(a,b);
  }
  // State is read from the same lexical scope as the encrypted world engine.
  replaceOnce('window.__v16={phase:function(t){',
    "window.__gptLoaderHealth=function(){"+
    "if(!OUT_ON)return {ready:true};"+
    "if(!EXT.built||!XC.b)return {ready:false,reason:'world'};"+
    "var farExpected=me.r>XG.curbF+.20&&!WT.on&&!CV.on&&!FMI.on;"+
    "if(farExpected){"+
    "if(!V16.farLoaded)return {ready:false,reason:'map'};"+
    "if(typeof S2!=='undefined'&&(!S2.ready||S2.fail||!S2.url||!XC.imgs.get(S2.url)||!XC.imgs.get(S2.url).naturalWidth))return {ready:false,reason:'background'};"+
    "}return {ready:true};};\n"+
    'window.__v16={phase:function(t){');
  // Detect missing outdoor canvas without altering the physics or painter order.
  replaceOnce('function xcFrame(dt){ if(!XC.b) return;',
    "function xcFrame(dt){ if(!XC.b){if(OUT_ON&&window.__gptLoader)window.__gptLoader.fault('canvas');return;}");
  // Keep the existing non-destructive renderer recovery; signal its failure to the overlay.
  replaceOnce("if(!XC._gptWarned){console.warn('xcFrame recovery',e);XC._gptWarned=true;} XC.skip=null;",
    "if(!XC._gptWarned){console.warn('xcFrame recovery',e);XC._gptWarned=true;} XC.skip=null; if(OUT_ON&&window.__gptLoader)window.__gptLoader.fault('renderer');");
  var css='\
<style id="gpt-loading-xp-css">\
#gpt-loading-screen{position:fixed;inset:0;z-index:2147483630;display:grid;place-items:center;padding:18px;background:rgba(194,218,244,.63);-webkit-backdrop-filter:blur(10px) saturate(.85);backdrop-filter:blur(10px) saturate(.85);opacity:0;visibility:hidden;pointer-events:none;transition:opacity .23s ease,visibility .23s ease;font:12px Tahoma,Verdana,sans-serif;color:#1b263b}\
#gpt-loading-screen.on{opacity:1;visibility:visible;pointer-events:auto}\
.gpt-xp-dialog{width:min(350px,calc(100vw - 42px));background:#ece9d8;border:2px solid #1353d7;border-radius:8px 8px 3px 3px;box-shadow:2px 5px 0 #173f7833,0 15px 45px #0e386652;overflow:hidden}\
.gpt-xp-title{height:32px;display:flex;align-items:center;gap:7px;padding:0 10px;background:linear-gradient(180deg,#5bb5ff 0%,#2074e9 27%,#0750c9 64%,#0342b6 100%);color:white;font:bold 13px Tahoma,sans-serif;text-shadow:0 1px #123c90}\
.gpt-xp-flag{font-size:17px;line-height:1;color:#ffdd58}.gpt-xp-title-right{margin-left:auto;font-size:9px;color:#d8eaff}\
.gpt-xp-content{padding:22px 20px 17px}.gpt-xp-heading{font-weight:bold;font-size:16px;margin-bottom:8px}.gpt-xp-sub{font-size:11px;color:#4e5260;margin-bottom:17px}\
.gpt-xp-progress{position:relative;overflow:hidden;height:20px;border:1px solid #7f9db9;background:linear-gradient(#fff,#f3f3f3);box-shadow:inset 1px 1px 1px #b5becb}\
.gpt-xp-progress-motion{position:absolute;top:2px;bottom:2px;left:-34%;width:34%;background:repeating-linear-gradient(90deg,#159f27 0,#46c63b 10px,#2baa29 11px,transparent 12px,transparent 16px);animation:gpt-xp-load 1.75s linear infinite}\
@keyframes gpt-xp-load{from{left:-34%}to{left:100%}}\
.gpt-xp-footer{min-height:28px;display:flex;align-items:center;justify-content:space-between;margin-top:9px;font-size:10px;color:#6a6e70}\
#gpt-loading-retry{background:linear-gradient(#fff,#dbe6f5);border:1px solid #3c68a0;border-radius:3px;color:#173260;font:11px Tahoma,Verdana,sans-serif;padding:4px 12px;cursor:pointer}\
@media(prefers-reduced-motion:reduce){.gpt-xp-progress-motion{animation-duration:4s}#gpt-loading-screen{transition:none}}\
</style>';
  replaceOnce('</head>',css+'</head>');
  replaceOnce('</body>','<script>('+gptLoadingUI.toString()+')();<\/script></body>');
  return html;
}
self.gptLoadingPatch=gptLoadingPatch;