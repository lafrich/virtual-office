/* GPT Version v16a — original engine patch. Runs only in isolated beta SW. */
'use strict';
function gptWorldV16(){
  const CA=['sedan_red','taxi_bluebird','hatchback_orange','van_cream','sedan_teal','mpv_silver'];
  const RI=['gojek','maxim_pax','commuter_batik_sogan','sma_triple','maxim','commuter_batik_blue','gojek_pax','commuter_batik_red'];
  const ROUTES=[[33.05,1,14,-1,0,0],[33.05,1,14,-4.5,0,1],[33.05,1,14,-8,0,2],[33.05,1,14,-11.5,0,3],[34.85,-1,16,-2,2,0],[34.85,-1,16,-7.333333,0,4],[34.85,-1,16,-12.666667,0,5],[33.05,1,14,-2.75,1,0],[33.05,1,14,-6.25,1,1],[33.05,1,14,-9.75,1,2],[33.05,1,14,-13.25,1,3],[34.85,-1,16,-4.666667,1,4],[34.85,-1,16,-10,1,5],[34.85,-1,16,-14.444444,1,6],[34.85,-1,16,-16.222222,1,7]];
  var V16={T:{epoch:1767225600000,cyc:{period:40000,busy:12000,clear:[26000,32000]},road:{n:32.7,f:36.3,c0:-20,c1:34},spawn:{near:{r:32,c0:-20,c1:34},far:{r:36.95,c0:19.9,c1:25.1}},veh:ROUTES.map(function(a){return {r:a[0],d:a[1],dur:a[2],del:a[3],rot:a[4]===2?['bus_transjakarta']:a[4]===1?RI:CA,k0:a[5],pc:a[1]>0?0.6319:0.3681,t:a[4]===1?'rid':'car'};})},made:false,cars:[],laneA:[],backLaneA:false,start:'near',hitT:0,hits:0,lastSync:0,onRoad:false,farLoaded:false,farQueue:null,fxQueue:null,gangEntered:false};
  function trfHash(i,n){var x=Math.imul(i+1,0x9e3779b1)^Math.imul(n|0,0x85ebca77);x^=x>>>15;x=Math.imul(x,0x2c1b3c6d);x^=x>>>12;x=Math.imul(x,0x297a2d39);x^=x>>>15;return (x>>>0)/4294967296;}
  function trfPhase(t){var x=((t-V16.T.epoch)%40000+40000)%40000;return x<12000?'busy':x>=26000&&x<32000?'clear':'quiet';}
  // Exact hitbox dimensions from Grok v16a/src/traffic.json; these also match each visual sprite.
  const VEH_DIMS={sedan_red:[.875,2.9,.75],taxi_bluebird:[.9688,3.1,.75],hatchback_orange:[.7188,2.6,.75],van_cream:[1.0938,3.4,.75],sedan_teal:[.875,2.9,.75],mpv_silver:[.9688,3.1,.75],bus_transjakarta:[2.75,6.6,.85],gojek:[.1562,1.3,.55],maxim_pax:[.1562,1.3,.55],commuter_batik_sogan:[.1562,1.3,.55],sma_triple:[.2812,1.55,.55],maxim:[.1562,1.3,.55],commuter_batik_blue:[.1562,1.3,.55],gojek_pax:[.1562,1.3,.55],commuter_batik_red:[.1562,1.3,.55]};
  function trfDim(k){var dims=VEH_DIMS[k];if(!dims)throw Error('Unknown vehicle sprite kind: '+k);return dims;}
  function trfVeh(i,t){var V=V16.T.veh[i],dur=V.dur*1000,a=t-V16.T.epoch-V.del*1000,n=Math.floor(a/dur),pr=(a-n*dur)/dur,tp=V16.T.epoch+V.del*1000+n*dur+V.pc*dur,phase=trfPhase(tp),on=trfHash(i,n)<(phase==='busy'?1:phase==='clear'?0:.2);
    var kind=V.rot[((V.k0+n)%V.rot.length+V.rot.length)%V.rot.length],dims=trfDim(kind),c=(V.d>0?-28:52)+(V.d>0?80*pr:-80*pr)+dims[0];
    return {on:on,kind:kind,n:n,pr:pr,c0:c-dims[1]/2,c1:c+dims[1]/2,hw:dims[2],r:V.r};}
  function trfHit(c,r,t){if(!(r>32.7&&r<36.3))return null;for(var i=0;i<V16.T.veh.length;i++){var x=trfVeh(i,t);if(x.on&&Math.abs(r-x.r)<x.hw&&c>=x.c0-.2&&c<=x.c1+.2)return x;}return null;}
  function v16Now(){return Date.now()+(V16.off==null?(S2X.sig&&S2X.sig.off||0):V16.off);}
  function v16RoadOK(c,r){if(c<-20||c>34||r<EXT.yard.r1-.05||r>36.5)return false;return !EXT.blk.some(function(b){return Math.hypot(c-b.c,r-b.r)<b.rad;});}
  function s2xOK(c,r){return v16RoadOK(c,r)||(s2xInFar(c,r)&&!EXT.blk.some(function(b){return Math.hypot(c-b.c,r-b.r)<b.rad;}));}
  function s2xSideCheck(){}
  function s2xCtx(){return false;}
  function s2xAction(){}
  function s2Signals(){}
  function v16Make(){if(!EXT.cars||EXT.cars.length!==V16.T.veh.length)return false;
    V16.cars=EXT.cars.map(function(w,i){
      // Own the visible transform: native CSS keyframes and clock corrections must never fight.
      w.style.animation='none';w.style.animationPlayState='paused';
      return {w:w,V:V16.T.veh[i],i:i,n:null,xy:''};
    });
    V16.laneA=V16.cars.filter(function(o){return o.V.r===33.05;}).map(function(o){return o.w;});
    return true;}
  function v16LaneA(){return V16.laneA;}
  function v16VisualXY(v,dir){
    // Original CSS keys: carA (-448,-224)→(832,416), carB reverse.
    // Progress is EXACTLY the same trfVeh() value used for the collision box.
    var x=(dir>0?-448:832)+(dir>0?1280:-1280)*v.pr;
    var y=(dir>0?-224:416)+(dir>0?640:-640)*v.pr;
    return [Math.round(x*2)/2,Math.round(y*2)/2];
  }
  function v16Traffic(){var t=v16Now();V16.cars.forEach(function(o){
    var v=trfVeh(o.i,t),w=o.w;
    if(v.n!==o.n){o.n=v.n;if(w._vk!==v.kind){if(o.V.t==='rid')vRidSet(w,v.kind);else vSprSet(w,v.kind);}}
    var op=v.on?'':'0';if(w.style.opacity!==op)w.style.opacity=op;
    var xy=v16VisualXY(v,o.V.d),transform='translate('+xy[0]+' '+xy[1]+')';
    if(transform!==o.xy){o.xy=transform;w.setAttribute('transform',transform);}
  });}
  function v16Side(c,r){return r<=32.7?'near':r>=36.3&&s2xInFar(c,r)?'far':null;}
  // Search for a collision-free curb position, rather than dropping the player inside a stall or wall.
  function v16Spawn(side,atC){var S=V16.T.spawn[side],c=Math.max(S.c0,Math.min(S.c1,atC));
    for(var k=0;k<40;k++){var delta=k===0?0:(k%2?1:-1)*Math.ceil(k/2)*.3;
      var x=Math.min(S.c1,Math.max(S.c0,c+delta));if(extOK(x,S.r))return {c:x,r:S.r};}
    return {c:22.55,r:S.r};}
  function v16Respawn(side){var q=v16Spawn(side,me.c);
    V16.hitT=performance.now();V16.hits++;me.path=[];me.c=q.c;me.r=q.r;me.dir=side==='far'?'ne':'sw';me.forceAnim=null;me.moving=false;
    try{tmark.classList.remove('on');}catch(e){}
    try{say('Awas kendaraan! Balik ke tepi jalan');}catch(e){}
    try{meEl.classList.add('v16hit');setTimeout(function(){meEl.classList.remove('v16hit');},900);}catch(e){}}
  function v16Player(){if(SPEC||WT.on||CV.on||FMI.on){V16.onRoad=false;return;}
    var side=v16Side(me.c,me.r);if(side){V16.start=side;S2X.side=side;if(typeof S2L!=='undefined')S2L.side=side;}
    V16.onRoad=me.r>32.7&&me.r<36.3;if(!V16.onRoad||performance.now()-V16.hitT<2500)return;
    if(trfHit(me.c,me.r,v16Now()))v16Respawn(V16.start);}
  function s2xCrossers(dt){var now=performance.now();S2X.cr.forEach(function(n,i){if(i>=3){if(n.g)n.g.style.display='none';return;}
    if(n.st==='wait'){if(!n.go)n.go=now+3000+Math.random()*9000;if(now>=n.go){n.go=now+700;var safe=true;for(var t=v16Now();t<v16Now()+3000;t+=350){if(trfHit(n.c,33.05,t)||trfHit(n.c,34.85,t)){safe=false;break;}}if(safe){n.st='walk';n.go=0;}}}
    if(n.st==='walk'){var to=n.side==='near'?XG.wait.far:XG.wait.near,step=1.5*dt,dr=to-n.r;n.dir=dr>0?'sw':'ne';if(Math.abs(dr)<=step){n.r=to;n.side=n.side==='near'?'far':'near';n.st='wait';n.go=0;}else n.r+=Math.sign(dr)*step;n.t+=dt*800;n.f=Math.floor(n.t/S2X.cfg.crossers.ms)%6;}else n.f=0;
    var p=P(n.c,n.r),dir=S2X.cfg.atlas.dirs.indexOf(n.dir),vb=(n.f*64)+' '+((n.who*4+dir)*112)+' 64 112',x=(Math.round((p.x-16)*PPU)/PPU).toFixed(1),y=(Math.round((p.y-50)*PPU)/PPU).toFixed(1);
    if(n.sv._x!==x){n.sv._x=x;n.sv.setAttribute('x',x);}if(n.sv._y!==y){n.sv._y=y;n.sv.setAttribute('y',y);}
    if(n.sv._vb!==vb){n.sv._vb=vb;n.sv.setAttribute('viewBox',vb);n.sv.setAttribute('data-crop',vb.replace(/ /g,','));}s2xPlace(n.g,n.c,n.r);});}
  window.__s2xPost=function(){var p=S2X.p;if(p.ov){p.ov=false;meSpr.style.backgroundImage=p.bg;meSpr._k='';if(me.ex&&me.ex.d)me.ex.k='';}};
  window.__s2xTick=function(dt){
    if(!S2X.made){if(typeof EXT==='undefined'||!EXT.built||!EXT.gC||!OUT_ON)return;S2X.made=true;s2xMakeCrossers();xcImg(S2XA+S2X.cfg.crossers.file);}
    // Spread far-side image decode over frames before the crossing to avoid a 17-image main-thread spike.
    if(V16.farQueue===null&&OUT_ON&&me.r>=30.7)V16.farQueue=S2X.cfg.levels.filter(function(pair){return !!pair[1];}).map(function(pair){return S2XA+pair[1].file;});
    if(V16.farQueue&&V16.farQueue.length){var budget=me.r>35.8?V16.farQueue.length:3;
      while(budget--&&V16.farQueue.length)xcImg(V16.farQueue.shift());
      if(!V16.farQueue.length)V16.farLoaded=true;}
    if(!V16.fxQueue&&typeof S2L!=='undefined'&&S2L.props&&S2L.props.length){
      // Prefetch every original three-frame item glint; prevents blank texture between frames.
      V16.fxQueue=[];
      S2L.props.forEach(function(o){for(var f=0;f<3;f++)V16.fxQueue.push(S2LA+'props/'+o.k+'__kilau_f'+f+'.png');});
      for(var f=0;f<3;f++)V16.fxQueue.push(S2LA+'kilau_item_f'+f+'.png');
    }
    if(V16.fxQueue&&V16.fxQueue.length){var budget=3;while(budget--&&V16.fxQueue.length)xcImg(V16.fxQueue.shift());}
    // Existing baked alley extends to r=50; expose its full walkable corridor.
    if(S2X.cfg&&S2X.cfg.region&&S2X.cfg.region.lane){
      S2X.cfg.region.lane=[21.85,24.15,37.6,50];
    }
    if(!V16.gangEntered&&me.r>=47&&me.c>=21.85&&me.c<=24.15){
      V16.gangEntered=true;
      try{say('Ujung gang bisa dijelajahi');}catch(e){}
    }
    if(!V16.made&&EXT.cars&&EXT.cars.length)V16.made=v16Make();
    if(!OUT_ON){if(S2X.far)s2xFar(false);V16.onRoad=false;return;}
    if(V16.made)v16Traffic();v16Player();s2xCrossers(dt);
    var far=!WT.on&&!CV.on&&!FMI.on&&me.r>XG.curbF;s2xFar(far);if(far)s2xFarDepth();
    // Native painter order: never reparent vehicles to a synthetic lane group.
    // Hysteresis prevents rapidly toggling the vehicle back-canvas at the lane boundary.
    var canBack=V16.made&&!WT.on&&!CV.on&&!FMI.on;
    V16.backLaneA=canBack&&(V16.backLaneA?me.r>33.24:me.r>33.56);
    XC.skip=far?[EXT.gC,S2X.gFB]:(V16.backLaneA?v16LaneA():null);
  };
  (function(){var old=window.__s2xPost,owned=false;window.__s2xPost=function(){if(old)old();var active=OUT_ON&&((typeof S2L!=='undefined'&&S2L.p&&S2L.p.an)||(S2X.p&&S2X.p.an));if(active){owned=true;return;}if(owned){owned=false;if(me.forceAnim==='idle'||me.forceAnim==='walk')me.forceAnim=null;}};})();
  window.__v16={phase:function(t){return trfPhase(t==null?v16Now():t);},hit:function(c,r,t){return trfHit(c,r,t==null?v16Now():t);},
    st:function(){return {made:V16.made,hits:V16.hits,start:V16.start,onRoad:V16.onRoad,farLoaded:V16.farLoaded,cars:V16.cars.length,backLaneA:V16.backLaneA,fxPending:V16.fxQueue?V16.fxQueue.length:null,gangEntered:V16.gangEntered};},
    cars:function(){return V16.cars.map(function(o){return {kind:o.w._vk,op:o.w.style.opacity,xy:o.xy,inNativeLayer:o.w.parentNode===EXT.gC,cssAnimation:o.w.style.animation};});},
    veh:function(t){return V16.T.veh.map(function(_,i){return trfVeh(i,t==null?v16Now():t);});},
    spawn:function(side,c){return v16Spawn(side,c);},setOff:function(ms){V16.off=ms;},roadOK:function(c,r){return extOK(c,r);}};
}
function gptApplyA(html){
  if(html.indexOf('vc-street2-xing')<0||html.indexOf('Virtual Life v15a')<0)throw Error('GROK_V16_INCOMPATIBLE_BASE');
  var applied=[],s=html;
  function rep(a,b,required){var parts=s.split(a);if(parts.length!==2){if(required!==false)throw Error('GROK_V16_ANCHOR '+a.slice(0,50)+' '+(parts.length-1));return false;}s=parts.join(b);applied.push(a.slice(0,38));return true;}
  ['function s2xOK(c, r){','function s2xSideCheck(){','function s2xCtx(C){','function s2xAction(c){','function s2Signals(){','function s2xCrossers(dt, P_){'].forEach(function(fn){rep(fn,fn.replace('(', '_v15('));});
  rep("if(nm!=='bus_transjakarta') w.addEventListener('animationiteration',()=>vSprSet(w,VROT[(VROT.indexOf(w._vk)+1)%VROT.length]));","/* v16: kinds follow traffic schedule */");
  rep("w.addEventListener('animationiteration',()=>vRidSet(w,RROT[(RROT.indexOf(w._vk)+1)%RROT.length]));   /* next rider kind at the off-screen loop wrap */","/* v16: riders follow traffic schedule */");
  var fn=gptWorldV16.toString(),start=fn.indexOf('{'),end=fn.lastIndexOf('}');
  rep("\n\n/* vc-street2-loak (v15a PREVIEW", "\n"+fn.slice(start+1,end)+"\n\n/* vc-street2-loak (v15a PREVIEW");
  // Grok's roof-occlusion fix: relocate loak search spots from the buried roof cells.
  var spotsAt=s.indexOf('"spots":[{"id":"s1"');
  if(spotsAt<0)throw Error('GROK_V16_LOAK_SPOTS_MISSING');
  var spotsEnd=s.indexOf('],"sell"',spotsAt);
  if(spotsEnd<0)throw Error('GROK_V16_LOAK_SPOTS_END');
  rep(s.slice(spotsAt,spotsEnd+1),'"spots":'+JSON.stringify([{"id":"s1","prop":"tong_sampah_besi","dir":"sw","area":"trotoar","c":15.6,"r":32.25},{"id":"s2","prop":"got_kecil","dir":"sw","area":"jalan","c":29.2,"r":32.3},{"id":"s3","prop":"tong_sampah_besi","dir":"se","area":"belakang_indomaret","c":20.2,"r":37.9},{"id":"s4","prop":"tumpukan_kardus","dir":"sw","area":"sekitar_warung","c":24.8,"r":37.95},{"id":"s6","prop":"kantong_kresek","dir":"se","area":"gang","c":22.3,"r":37.85},{"id":"s7","prop":"karung_rongsok","dir":"se","area":"gang","c":23.5,"r":37.85}]));
  rep("sp=(running?190:83)*K*dt*(window.__vjSlow||1);","sp=(running?64:44)*K*dt*(window.__vjSlow||1);");
  rep("stp=(running?4.4:2.1)*dt*(window.__vjSlow||1);","stp=(running?2.9:1.7)*dt*(window.__vjSlow||1);");
  rep("me.at+=(dt||0)*(an==='walk'&&!MOB&&(me.run||keys.has('run'))?1.8:1);","me.at+=(dt||0)*(an==='walk'?(!MOB&&(me.run||keys.has('run'))?1.3:0.8):1);");
  rep("walk: 1.95, run: 3.12 };","walk: 1.5, run: 2.4 };");
  rep("const p=toSvg(e), g=toGrid(p.x,p.y); if(okG(g.c,g.r)) goTo({c:g.c,r:g.r});","/* beta A1: floor tap disabled; NPC/object click remains */");
  rep("const DM_SLOTS=[{h:12,dir:1},{h:19,dir:-1}]","const DM_SLOTS=[]");
  // The production loak glint is server-gated. In the offline beta there is
  // intentionally no multiplayer state; keep its ORIGINAL 3-frame animation visible.
  rep("const on = s2lReady(o.s); if (on !== o.on)",
      "const on = !S2L.st || !S2L.bag || s2lReady(o.s); if (on !== o.on)");
  // Stabilize layering at the original far-side painter boundary.
  rep("const G_ = b > pd + 0.02 ? EXT.gF : S2X.gFB;",
      "const band=0.16; const G_=n.parentNode===EXT.gF ? (pd>b+band?S2X.gFB:EXT.gF) : (pd<b-band?EXT.gF:S2X.gFB);");
  rep("const G_ = s2xGroupFor(c, r, c + r > me.c + me.r + 0.02);",
      "const depth=c+r-me.c-me.r; n._gptFront=n._gptFront===undefined ? depth>0 : (n._gptFront ? depth>-.15 : depth>.15); const G_ = s2xGroupFor(c,r,n._gptFront);");
  rep("function dmTick(dt){ if(!DM.built){","function dmTick(dt){ if(!DM.built && !DM.run && !/[?&]demo=(noon|eve)/.test(location.search)) return; if(!DM.built){");
  // Keep the HUD map ONLY if the in-phone map is absent.
  var phoneMap=s.indexOf("if (id === 'map')")>=0&&s.indexOf('vs-bigmap')>=0;
  var css="/* GPT Package A */html,body{height:100%;min-height:100%;overflow:hidden}body .app{height:100dvh;min-height:0;grid-template-rows:minmax(0,1fr)}body .app>header{display:none!important}body #stage{height:100%;min-height:0;overflow:hidden}#vs-notif,#vs-notifs,#vs-bell,.vs-bell,.vs-notif-drawer{display:none!important}.s2l-spark,[class*=sparkle]{opacity:.45!important}@media(max-width:600px){#vj-toast{top:clamp(192px,32dvh,285px)!important;bottom:auto!important;max-width:min(300px,calc(100vw - 28px))}}";
  if(phoneMap)css+="body.y2k .y2-map,#vs-hud .vs-mini{display:none!important}";
  rep("</head>","<style id=\"gpt-v16a-css\">"+css+"</style></head>");
  rep("window.__vsBuild = 'Virtual Life v15a';","window.__vsBuild = 'Virtual Life v16a · GPT beta';");
  rep("</body>","<div id=\"gpt-pkg-a\" style=\"position:fixed;top:4px;right:8px;z-index:2147483000;pointer-events:none;background:#183758d9;color:#fff;padding:3px 7px;font:bold 10px Tahoma\">GPT VERSION · v16a</div></body>");
  if(!phoneMap)console.warn('[gpt-a] Phone map absent; HUD minimap retained');
  return {html:s,applied:applied.length,phoneMap:phoneMap};
}
self.gptApplyA=gptApplyA;
