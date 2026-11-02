/* GPT Version v16a — original engine patch. Runs only in isolated beta SW. */
'use strict';
function gptWorldV16(){
  const CA=['sedan_red','taxi_bluebird','hatchback_orange','van_cream','sedan_teal','mpv_silver'];
  const RI=['gojek','maxim_pax','commuter_batik_sogan','sma_triple','maxim','commuter_batik_blue','gojek_pax','commuter_batik_red'];
  const ROUTES=[[33.05,1,14,-1,0,0],[33.05,1,14,-4.5,0,1],[33.05,1,14,-8,0,2],[33.05,1,14,-11.5,0,3],[34.85,-1,16,-2,2,0],[34.85,-1,16,-7.333333,0,4],[34.85,-1,16,-12.666667,0,5],[33.05,1,14,-2.75,1,0],[33.05,1,14,-6.25,1,1],[33.05,1,14,-9.75,1,2],[33.05,1,14,-13.25,1,3],[34.85,-1,16,-4.666667,1,4],[34.85,-1,16,-10,1,5],[34.85,-1,16,-14.444444,1,6],[34.85,-1,16,-16.222222,1,7]];
  var V16={T:{epoch:1767225600000,cyc:{period:40000,busy:12000,clear:[26000,32000]},road:{n:32.7,f:36.3,c0:-20,c1:34},spawn:{near:{r:32,c0:-20,c1:34},far:{r:36.95,c0:19.9,c1:25.1}},veh:ROUTES.map(function(a){return {r:a[0],d:a[1],dur:a[2],del:a[3],rot:a[4]===2?['bus_transjakarta']:a[4]===1?RI:CA,k0:a[5],pc:a[1]>0?0.6319:0.3681,t:a[4]===1?'rid':'car'};})},made:false,cars:[],laneA:[],backLaneA:false,start:'near',hitT:0,hits:0,lastSync:0,onRoad:false,farLoaded:false,farQueue:null,farImages:null,fxQueue:null,gangEntered:false};
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
    if(V16.farQueue===null&&OUT_ON){
      // Start prefetch as soon as outdoors; never switch to a front mask whose PNGs are missing.
      V16.farImages=S2X.cfg.levels.filter(function(pair){return !!pair[1];}).map(function(pair){return S2XA+pair[1].file;});
      V16.farQueue=V16.farImages.slice();
    }
    if(!V16.farLoaded&&V16.farQueue){
      var budget=3;
      while(budget--&&V16.farQueue.length)xcImg(V16.farQueue.shift());
      if(!V16.farQueue.length)V16.farLoaded=V16.farImages.every(function(url){return !!xcImg(url);});
    }
    if(!V16.fxQueue&&typeof S2L!=='undefined'&&S2L.props&&S2L.props.length){
      // Prefetch every original three-frame item glint; prevents blank texture between frames.
      V16.fxQueue=[];
      S2L.props.forEach(function(o){for(var f=0;f<3;f++)V16.fxQueue.push(S2LA+'props/'+o.k+'__kilau_f'+f+'.png');});
      for(var f=0;f<3;f++)V16.fxQueue.push(S2LA+'kilau_item_f'+f+'.png');
    }
    if(V16.fxQueue&&V16.fxQueue.length){var budget=3;while(budget--&&V16.fxQueue.length)xcImg(V16.fxQueue.shift());}
    // The artwork extends BEYOND the old r=50 collision edge: facade F=51,
    // rear local road r=51..55. Keep this path continuous with the existing alley.
    // Only expose ground actually present in Grok's baked Street2 scene.
    if(S2X.cfg&&S2X.cfg.region){
      var region=S2X.cfg.region;
      region.lane=[21.85,24.15,37.6,52.05];
      // Rear local road baked by Grok covers the full east-west street.
      // Keep finite art bounds, rather than stopping 4 cells either side of the alley.
      region.terminal=[-40,34,51.4,54.7];
    }
    if(!V16.gangEntered&&me.r>51&&me.r<54.8&&me.c>=21.85&&me.c<=24.15){
      V16.gangEntered=true;
      try{say('Gang tembus ke jalan belakang!');}catch(e){}
    }
    if(!V16.made&&EXT.cars&&EXT.cars.length)V16.made=v16Make();
    if(!OUT_ON){if(S2X.far)s2xFar(false);V16.onRoad=false;return;}
    if(V16.made)v16Traffic();v16Player();s2xCrossers(dt);
    var far=V16.farLoaded&&(typeof S2==='undefined'||!!(S2.ready&&!S2.fail&&S2.url&&xcImg(S2.url)))&&!WT.on&&!CV.on&&!FMI.on&&(S2X.far?me.r>XG.curbF-.14:me.r>XG.curbF+.14);s2xFar(far);if(far)s2xFarDepth();
    // Native painter order: never reparent vehicles to a synthetic lane group.
    // Hysteresis prevents rapidly toggling the vehicle back-canvas at the lane boundary.
    var canBack=V16.made&&!WT.on&&!CV.on&&!FMI.on;
    V16.backLaneA=canBack&&(V16.backLaneA?me.r>33.24:me.r>33.56);
    if(V16.made)v16DepthSkip(far);
    else XC.skip=far?[EXT.gC,S2X.gFB]:null;
  };
  (function(){var old=window.__s2xPost,owned=false;window.__s2xPost=function(){if(old)old();var active=OUT_ON&&((typeof S2L!=='undefined'&&S2L.p&&S2L.p.an)||(S2X.p&&S2X.p.an));if(active){owned=true;return;}if(owned){owned=false;if(me.forceAnim==='idle'||me.forceAnim==='walk')me.forceAnim=null;}};})();
  // Real-world depth: XC.b renders behind the player, XC.f in front.
  // Never erase the entire foreground with the player's alpha: that makes
  // the player render ABOVE pedestrians and cars that should occlude them.
  function v16DepthSkip(far){
    var back=[], playerFoot=me.c+me.r, now=v16Now();
    V16.cars.forEach(function(o){
      var v=trfVeh(o.i,now), footprint=(v.c0+v.c1)*.5+v.r;
      var delta=footprint-playerFoot, previous=!!o.back;
      o.back=far|| (previous ? delta<.18 : delta<-.18);
      if(o.back)back.push(o.w);
    });
    if(far&&S2X.gFB)back.push(S2X.gFB);
    // The generated level overlays also contain FLAT pavement (not only roofs).
    // On the road, put the baked ground overlay behind the avatar, but keep
    // individual cars, NPCs and solid foreground props correctly depth-sorted.
    // The baked gate/frontage atlas includes a redundant horizontal floor plane.
    // Move THAT raster behind the avatar only while their feet are on the
    // passage/sidewalk; keep independent poles, NPCs and vehicles depth-sorted.
    // The front level image is cleaned ON LOAD: gate pavement removed from
    // foreground, while the red/white pillars, poles and shop roof remain.
    // Do not move the entire level group based on player's r coordinate.
    var roadLevel=far&&S2X.lv&&S2X.lv.g&&me.r>=51.25&&me.r<=54.85;
    if(roadLevel)back.push(S2X.lv.g);
    XC.skip=back.length?back:null;
  }
  // Precise foreground safety pass. Only world props whose footpoints are in
  // front of the player and whose pixels intersect the sprite get drawn.
  // Preserve native geometry, collisions, original source and other characters.
  var v16OccCanvas=null,v16OccCtx=null;
  function v16DrawOcclusion(){
    if(!OUT_ON||!EXT.dyn||!EXT.dyn.length||!XC.b){
      if(v16OccCanvas&&v16OccCtx)v16OccCtx.clearRect(0,0,v16OccCanvas.width,v16OccCanvas.height);
      return;
    }
    if(!v16OccCanvas){
      v16OccCanvas=document.createElement('canvas');
      v16OccCanvas.className='gpt-depth-overlay';
      v16OccCanvas.setAttribute('aria-hidden','true');
      v16OccCanvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;z-index:12;pointer-events:none;image-rendering:pixelated';
      floor.appendChild(v16OccCanvas);
      v16OccCtx=v16OccCanvas.getContext('2d');
    }
    var cv=v16OccCanvas,ctx=v16OccCtx,fr=floor.getBoundingClientRect(),d=window.devicePixelRatio||1;
    var W=Math.max(1,Math.round(fr.width*d)),H=Math.max(1,Math.round(fr.height*d));
    if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,W,H);
    if(meEl.style.visibility==='hidden')return;
    var avatar=meSpr.getBoundingClientRect();
    if(avatar.width<2||avatar.height<2)avatar=meSvg.getBoundingClientRect();
    if(avatar.width<2||avatar.height<2)return;
    // Pixel-precise overlap clips to the body, never the floating YOU label.
    var clipX=Math.max(0,Math.floor((avatar.left-fr.left-2)*d)),clipY=Math.max(0,Math.floor((avatar.top-fr.top-2)*d));
    var clipW=Math.min(W-clipX,Math.ceil((avatar.width+4)*d)),clipH=Math.min(H-clipY,Math.ceil((avatar.height+4)*d));
    if(clipW<=0||clipH<=0)return;
    var pd=me.c+me.r,hits=[];
    for(var i=0;i<EXT.dyn.length;i++){
      var n=EXT.dyn[i];
      if(!n||!n.isConnected||n._b==null||n._b<pd-.08)continue;
      var b=n.getBoundingClientRect();
      if(b.width<1||b.height<1)continue;
      if(b.right<avatar.left||b.left>avatar.right||b.bottom<avatar.top||b.top>avatar.bottom)continue;
      if(!n.querySelector('image'))continue;
      hits.push(n);
    }
    hits.sort(function(a,b){return (a._d||0)-(b._d||0);});
    if(!hits.length)return;
    ctx.save();ctx.beginPath();ctx.rect(clipX,clipY,clipW,clipH);ctx.clip();
    try{for(var j=0;j<hits.length;j++)xcDraw(cv,hits[j],true);}
    catch(e){if(!cv._gptWarned){console.warn('gpt depth occlusion',e);cv._gptWarned=true;}}
    finally{ctx.restore();ctx.globalAlpha=1;ctx.setTransform(1,0,0,1,0,0);}
  }
  window.__gptDepthDraw=v16DrawOcclusion;
  window.__v16={phase:function(t){return trfPhase(t==null?v16Now():t);},hit:function(c,r,t){return trfHit(c,r,t==null?v16Now():t);},
    st:function(){return {made:V16.made,hits:V16.hits,start:V16.start,onRoad:V16.onRoad,farLoaded:V16.farLoaded,cars:V16.cars.length,backLaneA:V16.backLaneA,fxPending:V16.fxQueue?V16.fxQueue.length:null,gangEntered:V16.gangEntered};},
    cars:function(){return V16.cars.map(function(o){return {kind:o.w._vk,op:o.w.style.opacity,xy:o.xy,inNativeLayer:o.w.parentNode===EXT.gC,cssAnimation:o.w.style.animation};});},
    veh:function(t){return V16.T.veh.map(function(_,i){return trfVeh(i,t==null?v16Now():t);});},
    spawn:function(side,c){return v16Spawn(side,c);},setOff:function(ms){V16.off=ms;},roadOK:function(c,r){return extOK(c,r);},
    passage:function(){return {lane:S2X.cfg.region.lane,terminal:S2X.cfg.region.terminal,player:{c:me.c,r:me.r},entered:V16.gangEntered,foregroundPreserved:true,depthSort:'node-based'};}};
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
  // Baked foreground occluder level changes only after crossing a small dead-band.
  rep("const e = LV[k][1];\n  if (!S2X.lv)",
      "if(S2X.lv&&S2X.lv.k>=0&&k!==S2X.lv.k){var oldk=S2X.lv.k,edge=k>oldk?LV[k][0]+.12:LV[oldk][0]-.12; if(k>oldk?pd<edge:pd>edge)k=oldk;} const e = LV[k][1];\n  if (!S2X.lv)");
  rep("const G_ = b > pd + 0.02 ? EXT.gF : S2X.gFB;",
      "const band=0.16; const G_=n.parentNode===EXT.gF ? (pd>b+band?S2X.gFB:EXT.gF) : (pd<b-band?EXT.gF:S2X.gFB);");
  rep("const G_ = s2xGroupFor(c, r, c + r > me.c + me.r + 0.02);",
      "const depth=c+r-me.c-me.r; n._gptFront=n._gptFront===undefined ? depth>0 : (n._gptFront ? depth>-.15 : depth>.15); const G_ = s2xGroupFor(c,r,n._gptFront);");
  // Preserve the complete baked world across crossings; never hide whole
  // front occluder bitmaps (that caused the background pop/dropout).
  // The player-only alpha cutout is applied AFTER XC.f is drawn.
  // A single transient draw failure must not permanently shut down both
  // outdoor canvases (the original catch sets XC.b=null and strips body.xcv).
  // Drop the suspect skip list for that frame and recover on the next frame.
  rep("console.warn('xcFrame',e); XC.b=null; document.body.classList.remove('xcv');",
      "if(!XC._gptWarned){console.warn('xcFrame recovery',e);XC._gptWarned=true;} XC.skip=null;");
  // Office-front shadow only: keep v12 tree size, bake a smaller/fainter
  // projected shadow once from the active PNG's black-alpha shadow pixels.
  // This does not resize or edit the live encrypted source asset.
  // Remove projected PNG shadow from front-office species only; this fixes
  // the grey oval spilling onto the building after v12 tree enlargement.
  rep("function vegHref(n) { return VEG.data[n] || (VEG.dir + n + '.png'); }",
      "function vegHref(n) { return VEG.data[n] || (VEG.dir + n + '.png'); }\nfunction gptOfficeShadowData(n) {\n  // These PNGs use *exactly* alpha 56/90 black pixels for the projected\n  // shadow. Remove only those semi-transparent shadow pixels; leave every\n  // opaque trunk, canopy, root, and grass pixel untouched.\n  const im=VEG.img[n]; if(!im) return VEG.data[n];\n  try {\n    const w=im.naturalWidth,h=im.naturalHeight;\n    const cv=document.createElement('canvas');cv.width=w;cv.height=h;\n    const ctx=cv.getContext('2d',{willReadFrequently:true});\n    ctx.drawImage(im,0,0);\n    const pixels=ctx.getImageData(0,0,w,h);\n    let removed=0;\n    for(let i=0;i<pixels.data.length;i+=4){\n      if(pixels.data[i]===0 && pixels.data[i+1]===0 &&\n         pixels.data[i+2]===0 && pixels.data[i+3]>0 &&\n         pixels.data[i+3]<=110){\n        pixels.data[i+3]=0;\n        removed++;\n      }\n    }\n    if(!removed)return VEG.data[n];\n    ctx.putImageData(pixels,0,0);\n    return cv.toDataURL('image/png');\n  } catch(err){\n    console.warn('office shadow variant',err);\n    return VEG.data[n];\n  }\n}");
  rep("VEG.imgs.push([im, nm]); g._k = 'veg:' + nm;",
      "VEG.imgs.push([im, officeLawn ? 'gpt-office-shadow:'+nm : nm]); g._k = 'veg:' + nm;");
  // Replace the original tree PNG data BEFORE vegApply() / extCompose() bake.
  // The older variant-only approach could miss the already-composed outdoor raster.
  rep("VEG.data[n] = u; VEG.img[n] = im; res();",
      "VEG.data[n] = u; VEG.img[n] = im; if(/^pohon_/.test(n)) VEG.data[n]=gptOfficeShadowData(n); if([].concat(...Object.values(VEG.layout.trees.front)).includes(n)) VEG.data['gpt-office-shadow:'+n]=VEG.data[n]; res();");
  // ACTIVE tree renderer: VEG.on routes extTree() to vegTree() BEFORE any
  // legacy SVG tWide/tRound is executed. Previous 09–11 changes only touched
  // that legacy path and were invisible for the PNG vegetation in screenshots.
  // Scale actual vegetation PNGs from their metadata pivot e[2]/e[3],
  // keeping the foot P(c,r) fixed in world coordinates.
  rep("const w = e[0] / PPU * k, h = e[1] / PPU * k, x = Math.round((p.x - e[2] / PPU * k) * PPU) / PPU, y = Math.round((p.y - e[3] / PPU * k) * PPU) / PPU;",
      "const officeLawn = vegZone(c,r)==='front' && c>=-12 && c<=37; const treeScale = officeLawn ? (kind==='tall'?1.85:kind==='wide'?2.1:2.15) : 1; const vk = k * treeScale; const w = e[0] / PPU * vk, h = e[1] / PPU * vk, x = Math.round((p.x - e[2] / PPU * vk) * PPU) / PPU, y = Math.round((p.y - e[3] / PPU * vk) * PPU) / PPU;");
  // Scale the ORIGINAL vector trees before pxBake / extCompose flattens them.
  // P(c,r) is unchanged, so the trunk base stays pinned to its ground tile.
  // Shrubs, potted plants and any Street2 building art are not rescaled.
  // Office-lawn trees (c 18.9 / 27.7, r ~29) need more height than
  // their stock squat canopy. A nested SVG transform stretches upwards around
  // P(c,r); the ground anchor and collision coordinates remain unchanged.
  // The distinct sprite cache key prevents office trees reusing smaller sprites
  // baked for elsewhere on the map.
  rep("g._k='t'+kind+(s||1); g._a=p; (kind==='tall'?tTall:kind==='wide'?tWide:tRound)(g,p,(s||1)*1.8);",
      "var officeTree=r>=28.6&&r<=29.6&&c>=15&&c<=30; g._k='t'+kind+(s||1)+(officeTree?'-office-v11':''); g._a=p; var treeG=officeTree?el('g',{transform:'translate('+p.x+' '+p.y+') scale(1.12 1.65) translate('+(-p.x)+' '+(-p.y)+')'},g):g; (kind==='tall'?tTall:kind==='wide'?tWide:tRound)(treeG,p,(s||1)*1.8*(kind==='tall'?1.85:kind==='wide'?1.95:2.05));");
  // Limit the expensive CANVAS raster compositor to 30fps on touch devices.
  // Physics, player input, collisions and the main game update loop still run
  // normally. On desktop we retain the original frequency.
  rep("function xcFrame(dt){ if(!XC.b) return; if(OUT_ON) XC.t=0.6;",
      "function xcFrame(dt){ if(!XC.b) return; if(OUT_ON&&navigator.maxTouchPoints>0){var tn=performance.now();if(XC._gptLastPaint&&tn-XC._gptLastPaint<32)return;XC._gptLastPaint=tn;} if(OUT_ON) XC.t=0.6;");
  // Outdoor character .me has z-index:7, so the front canvas must be 8.
  // The native XC.f canvas was also 7, causing screen-order ties where an
  // avatar could visually sit on top of benches, lamps and other occluders.
  // Keep world-footpoint depth selection intact; only correct canvas stacking.
  rep("XC.f=mk(EXT.RF,7); document.body.classList.add('xcv');",
      "XC.f=mk(EXT.RF,8); document.body.classList.add('xcv');");
  // Draw true foreground pixels above the HTML sprite, even if the native
  // world and foreground SVGs land in separate DOM stacking contexts.
  rep("xcDraw(XC.f,EXT.RF); }catch(e){",
      "xcDraw(XC.f,EXT.RF); if(window.__gptDepthDraw)window.__gptDepthDraw(); }catch(e){");
  // The level overlays are composite PNGs: some include the GATE PAVEMENT.
  // Remove just its grey/tan road-plane pixels from the front layer at load
  // time. The base street already contains the floor, while white/red pillars
  // and other upright structures stay in the native foreground painter.
  // One pre-processing pass per image; never per animation frame.
  rep("function xcImg(u){ let i=XC.imgs.get(u); if(!i){ i=new Image(); i.src=u; XC.imgs.set(u,i); } return i.complete&&i.naturalWidth?i:null; }",
      "function xcImg(u){ let i=XC.imgs.get(u); if(!i){ i=new Image(); i.src=u; XC.imgs.set(u,i); } if(!i.complete||!i.naturalWidth)return null; if(!/\\/lv_\\d+\\.png(?:[?#]|$)/.test(u))return i; if(!i._gptFloorDone){i._gptFloorDone=true;try{var w=i.naturalWidth,h=i.naturalHeight,cv=document.createElement('canvas');cv.width=w;cv.height=h;var ctx=cv.getContext('2d',{willReadFrequently:true});ctx.drawImage(i,0,0);var y0=Math.max(238,Math.floor(h*0.58)),ww=Math.min(75,w),a=ctx.getImageData(0,y0,ww,h-y0),d=a.data;for(var y=0;y<h-y0;y++)for(var x=0;x<ww;x++){var j=(y*ww+x)*4,r=d[j],g=d[j+1],b=d[j+2],alpha=d[j+3];var floor=(r===184&&g===178&&b===168)||(r===157&&g===154&&b===145)||(r===200&&g===188&&b===159)||(r===118&&g===107&&b===89)||(r===0&&g===0&&b===0&&alpha>0&&alpha<=90);if(floor)d[j+3]=0;}ctx.putImageData(a,0,y0);var cleaned=new Image();cleaned.src=cv.toDataURL('image/png');i._gptFloorImg=cleaned;}catch(e){console.warn('gpt level-floor',e);i._gptFloorImg=i;}}var clean=i._gptFloorImg;return clean&&clean.complete&&clean.naturalWidth?clean:null; }");
  // No global player alpha mask: use the original two-canvas compositor and per-node depth.
  // Prior patch enlarged only the aisle; the ORIGINAL far-region checker still
  // rejected positions beyond r=50. Add the baked rear-road rectangle to the
  // same checked region. No fake geometry, no unbounded/no-clip movement.
  rep("return inR(R.side) || inR(R.lane); }",
      "return inR(R.side) || inR(R.lane) || (R.terminal ? inR(R.terminal) : false); }");
  rep("function dmTick(dt){ if(!DM.built){","function dmTick(dt){ if(!DM.built && !DM.run && !/[?&]demo=(noon|eve)/.test(location.search)) return; if(!DM.built){");
  // Keep the HUD map ONLY if the in-phone map is absent.
  var phoneMap=s.indexOf("if (id === 'map')")>=0&&s.indexOf('vs-bigmap')>=0;
  var css="/* GPT Package A */html,body{height:100%;min-height:100%;overflow:hidden}body .app{height:100dvh;min-height:0;grid-template-rows:minmax(0,1fr)}body .app>header{display:none!important}body #stage{height:100%;min-height:0;overflow:hidden}#vs-notif,#vs-notifs,#vs-bell,.vs-bell,.vs-notif-drawer{display:none!important}.s2l-spark,[class*=sparkle]{opacity:.45!important}@media(max-width:600px){#vj-toast{top:clamp(192px,32dvh,285px)!important;bottom:auto!important;max-width:min(300px,calc(100vw - 28px))}}";
  if(phoneMap)css+="body.y2k .y2-map,#vs-hud .vs-mini{display:none!important}";
  rep("</head>","<style id=\"gpt-v16a-css\">"+css+"</style></head>");
  rep("window.__vsBuild = 'Virtual Life v15a';","window.__vsBuild = 'Virtual Life v16a · GPT beta';");
  rep("</body>","<div id=\"gpt-pkg-a\" style=\"position:fixed;top:4px;right:8px;z-index:2147483000;pointer-events:none;background:#183758d9;color:#fff;padding:3px 7px;font:bold 10px Tahoma\">GPT VERSION · v16a.17</div></body>");
  if(!phoneMap)console.warn('[gpt-a] Phone map absent; HUD minimap retained');
  return {html:s,applied:applied.length,phoneMap:phoneMap};
}
self.gptApplyA=gptApplyA;
