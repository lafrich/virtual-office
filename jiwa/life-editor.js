/* Jiwa V1 LIFE editor + city preview; canvas preview reads Semesta City Draft.
   Interactive sandbox / placeholders only, not the original 3D renderer. */
(function(){
 'use strict';
 const E=window.JiwaLifeEconomy,B=window.JiwaContextBridge;
 const editor=document.getElementById('lifeEditor'),game=document.getElementById('gamePreview');
 if(!E||!B||!editor||!game)return;
 const $=(id)=>document.getElementById(id);
 const esc=x=>String(x??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]));
 let player={x:0,z:0},anchor={x:0,z:0},focusId='fishing',sceneCityId='',sequence=0,viewZoom=1;
 function config(){return E.normalize(B.project()?.lifeEconomy);}
 function cash(n){return 'Rp'+Number(n||0).toLocaleString('id-ID');}
 function dispatch(action,payload={}){
  const result=B.lifeRun(action,{...payload,eventId:'life-'+Date.now()+'-'+(++sequence)});
  renderGame();
  return result;
 }
 function setConfig(modify){
  const p=B.project();if(!p)return;
  p.lifeEconomy=E.normalize(p.lifeEconomy);
  modify(p.lifeEconomy);
  p.lifeEconomy=E.normalize(p.lifeEconomy);
  B.changed();renderEditor();renderGame();
 }
 function renderEditor(){
  const p=B.project();if(!p){editor.innerHTML='<div class="card">Pilih City Draft Semesta atau GLOBAL FOUNDATION untuk edit aturan.</div>';return;}
  const c=config(),s=c.settings;
  editor.innerHTML='<div class="card"><h3>GAMEPLAY V1 / LIFE ECONOMY</h3>'+
   '<p class="subtle">Harga & peluang adalah balancing awal yang dapat diedit. Simulasi bersifat lokal; bukan transaksi multiplayer. Semesta menyimpan posisi, Mahluk Hidup menyimpan animasi.</p>'+
   '<div class="context-grid"><label>Agama / keyakinan<select data-identity="religion">'+
   E.RELIGIONS.map(x=>'<option value="'+x+'" '+(c.identity.religion===x?'selected':'')+' '+(x==='satanis'?'disabled':'')+'>'+esc(x.toUpperCase())+(x==='satanis'?' (V2 LOCK)':'')+'</option>').join('')+
   '</select></label><label>Zodiak<select data-identity="zodiac">'+E.ZODIACS.map(x=>'<option value="'+x+'" '+(c.identity.zodiac===x?'selected':'')+'>'+esc(x.toUpperCase())+'</option>').join('')+'</select></label></div>'+
   '<p class="subtle">Friends, social referral, dan jalur antagonis fiksi “Satanis” tetap terkunci sampai V2. Karakter jalur antagonis dirancang punya strategi risiko/reward tersendiri; agama lain tidak ditautkan ke perilaku jahat.</p></div>'+
   '<div class="card"><h3>FISHING / WEIGHTED LOOT</h3><p class="subtle">Bobot adalah peluang relatif, tidak harus total 100. Semakin besar, semakin sering tertangkap.</p>'+
   '<div class="life-table-scroll"><table class="life-table"><thead><tr><th>Ikan</th><th>Bobot</th><th>Busuk (menit)</th><th>Siomay/Batagor (Rp)</th><th>Pasar ikan (Rp)</th></tr></thead><tbody>'+
   c.fish.map((f,i)=>'<tr><td><b>'+esc(f.label)+'</b></td><td><input type="number" min="0" max="10000" data-fish="'+i+'" data-key="weight" value="'+f.weight+'"></td>'+
   '<td><input type="number" min="1" max="100000" data-fish="'+i+'" data-key="spoilMinutes" value="'+f.spoilMinutes+'"></td>'+
   Object.keys(E.BUYERS).map(b=>'<td><label style="display:flex;gap:3px;align-items:center"><input type="checkbox" data-fish="'+i+'" data-buyer="'+b+'" '+(f.buyers[b]!==null?'checked':'')+' title="Buyer accepts this fish"><input type="number" min="0" max="1000000" data-fish="'+i+'" data-price="'+b+'" value="'+(f.buyers[b]??0)+'" '+(f.buyers[b]===null?'disabled':'')+'></label></td>').join('')+'</tr>').join('')+
   '</tbody></table></div><p class="subtle">Ikan Sapu-sapu → Bang Siomay menerima, Pasar Ikan menolak. Ikan konsumsi → keduanya menerima. Semua harga editable.</p></div>'+
   '<div class="card"><h3>DATABASE PEKERJAAN · EDITABLE</h3><p class="subtle">Manusia Silver, Pak Ogah, Kang Parkir dan kerja premium punya aturan berbeda. EXP mengurangi waktu kerja. Semua nilai ini disimpan bersama City Rules.</p>'+
   '<div class="life-table-scroll"><table class="life-table"><thead><tr><th>Jenis kerja</th><th>Upah</th><th>Waktu (m)</th><th>Energi -</th><th>Kebersihan -</th><th>EXP +</th><th>Min kebersihan</th></tr></thead><tbody>'+
   c.jobs.map((j,i)=>'<tr><td><b>'+esc(j.label)+'</b></td>'+
    ['wage','minutes','energyCost','hygieneCost','exp','minHygiene'].map(k=>
    '<td><input type="number" min="0" max="1000000" data-job="'+i+'" data-job-key="'+k+'" value="'+j[k]+'"></td>').join('')+
   '</tr>').join('')+'</tbody></table></div></div>'+
   '<div class="card"><h3>PARAMETER CORE SURVIVAL</h3><div class="context-grid">'+
   Object.entries({fishEnergy:'Energi / mancing',fishMinutes:'Durasi mancing (menit)',coffeePrice:'Harga kopi (Rp)',roomPrice:'Beli akses kost sekali (Rp)',
    fridgePrice:'Harga kulkas (Rp)',tokenPrice:'Token listrik (Rp)',tokenUnits:'Unit listrik / token',
    fridgeCoolingMultiplier:'Efektivitas pendinginan kulkas (x)',tokenDurationMinutes:'Durasi 1 unit token (menit)',
    faintRestMinutes:'Bed rest pingsan (menit)',faintRecoveryEnergy:'Energi setelah bed rest',arrestMoralThreshold:'Ambang moral hansip',
    passiveEnergyMinutes:'Interval turun energi (menit)',passiveBladderMinutes:'Interval naik keinginan pipis (menit)',
    passiveHygieneMinutes:'Interval turun kebersihan (menit)',passiveFullnessMinutes:'Interval lapar (menit)',
    realSecondsPerGameMinute:'Detik nyata untuk 1 menit simulasi',seatRestEnergy:'Energi dari duduk sebentar',
    publicShowerFee:'Biaya mandi umum (Rp)',publicShowerRecovery:'Pulih mandi umum',homeShowerRecovery:'Pulih mandi kost',
    publicToiletPenalty:'Penalti kebersihan WC umum',hoboSleepRecovery:'Energi tidur tenda',homeSleepRecovery:'Energi tidur kost'}).map(([key,label])=>
     '<label>'+label+'<input type="number" min="0" max="100000" data-setting="'+key+'" value="'+s[key]+'"></label>').join('')+
   '</div></div>';
 }
 editor.addEventListener('change',ev=>{
  const el=ev.target;
  if(el.dataset.identity){setConfig(c=>c.identity[el.dataset.identity]=el.value);return;}
  if(el.dataset.setting){setConfig(c=>c.settings[el.dataset.setting]=Number(el.value));return;}
  if(el.dataset.job!==undefined){setConfig(c=>c.jobs[Number(el.dataset.job)][el.dataset.jobKey]=Number(el.value));return;}
  if(el.dataset.fish===undefined)return;
  const idx=Number(el.dataset.fish);
  if(el.dataset.key){setConfig(c=>c.fish[idx][el.dataset.key]=Number(el.value));return;}
  if(el.dataset.buyer){setConfig(c=>c.fish[idx].buyers[el.dataset.buyer]=el.checked?Number(el.parentElement.querySelector('input[type=number]').value):null);return;}
  if(el.dataset.price){setConfig(c=>c.fish[idx].buyers[el.dataset.price]=Number(el.value));}
 });
 const spots=[
  {id:'fishing',name:'🎣 Titik Mancing',emoji:'🎣',dx:3,dz:-3,kind:'fish',placeholder:true},
  {id:'siomay_batagor',name:'🥟 Bang Siomay / Batagor',emoji:'🥟',dx:6,dz:1,kind:'sell',placeholder:true},
  {id:'pasar_ikan',name:'🐟 Pasar Ikan',emoji:'🐟',dx:-6,dz:4,kind:'sell',placeholder:true},
  {id:'tree',name:'🌳 Pohon Buah',emoji:'🌳',dx:-4,dz:-2,kind:'fruit',placeholder:true},
  {id:'public_wc',name:'🚾 WC Umum',emoji:'🚾',dx:8,dz:6,kind:'toilet',placeholder:true},
  {id:'public_bath',name:'🧼 Mandi Umum',emoji:'🧼',dx:-8,dz:7,kind:'shower',placeholder:true},
  {id:'kost',name:'🏠 Kost',emoji:'🏠',dx:9,dz:-7,kind:'home',placeholder:true},
  {id:'tenda',name:'⛺ Tenda Hobo',emoji:'⛺',dx:-9,dz:-7,kind:'camp',placeholder:true}
 ];
 function cityData(){return B.city()?.document||{objects:[],map:{}};}
 function entities(){return B.entities()||[];}
 function syncScene(){
  const city=B.city();
  if(!city)return;
  if(sceneCityId===city.id)return;
  sceneCityId=city.id;
  const a=entities().slice(0,150);
  if(a.length){player.x=Math.round(a.reduce((n,o)=>n+(Number(o.x)||0),0)/a.length);
   player.z=Math.round(a.reduce((n,o)=>n+(Number(o.z)||0),0)/a.length);}
  else {player={x:0,z:0};}
  anchor={x:player.x,z:player.z};
  for(const sp of spots){sp.x=anchor.x+sp.dx;sp.z=anchor.z+sp.dz;sp.placeholder=true;}
  const terrain=cityData().map?.terrain?.cells||[];
  const water=terrain.filter(t=>['river','water'].includes(t.type))
    .sort((a,b)=>Math.hypot((Number(a.c)||0)-anchor.x,(Number(a.r)||0)-anchor.z)-Math.hypot((Number(b.c)||0)-anchor.x,(Number(b.r)||0)-anchor.z))[0];
  if(water){spots[0].x=Number(water.c)||0;spots[0].z=Number(water.r)||0;spots[0].placeholder=false;}
  const all=entities();
  for(const [spotId,pattern] of [['siomay_batagor',/siomay|batagor/i],['pasar_ikan',/pasar.*ikan|fish.*market/i],['tree',/pohon|tree/i],
    ['public_wc',/wc.umum|toilet.umum|public.?toilet/i],['public_bath',/mandi.umum|public.?bath|shower.umum/i],
    ['kost',/kost|kos_|cove|kamar|boarding.?room/i],['tenda',/tenda|tent|hobo.camp|camping/i]]){
   const match=all.find(o=>pattern.test([o.name,o.asset,o.subtype].join(' ')));
   if(match){const sp=spots.find(v=>v.id===spotId);sp.x=Number(match.x)||0;sp.z=Number(match.z)||0;sp.placeholder=false;}
  }
  const current=B.sandbox()?.spawnPosition;
  if(current&&Number.isFinite(Number(current.x))&&Number.isFinite(Number(current.z))){
   player.x=Number(current.x);player.z=Number(current.z);
   if(B.sandbox()?.spawn==='hobo'){
    const tent=spots.find(v=>v.id==='tenda');tent.x=player.x;tent.z=player.z;tent.placeholder=current.placeholder===true;
   }
  }
  focusId='fishing';viewZoom=1;
 }
 function actorSprite(){return window.JiwaActorLink&&window.JiwaActorLink.record;}
 function renderGame(){
  const p=B.project();if(!p){game.innerHTML='<div class="card">Pilih kota dahulu di menu CITY.</div>';return;}
  syncScene();const s=B.sandbox()||{},c=config();
  const slots=(s.inventory||[]).map(id=>{
   const meta=s.itemMeta&&s.itemMeta[id];
   const fish=meta&&c.fish.find(f=>f.id===meta.species);
   const spoiled=fish&&E.activeItem(c,s,id).spoiled;
   return '<option value="'+esc(id)+'">'+esc(meta?.label||id)+(spoiled?' (BUSUK)':'')+'</option>';
  }).join('');
  const selected=$('lifeItem')?.value;
  const previousBuyer=$('lifeBuyer')?.value;
  game.innerHTML='<div class="card"><h3>▶ GAME PREVIEW — '+esc(B.city()?.name||'GLOBAL FOUNDATION')+'</h3>'+
    '<p class="subtle">Memakai koordinat objek dan tile City Draft asli dari Semesta. Tampilan 2D isometric sementara; bukan renderer 3D Semesta. Pin berlabel PLACEHOLDER hanya titik interaksi virtual, belum menyunting kota atau membuat aset.</p>'+
    '<div class="life-preview-toolbar"><button data-move="up">↑</button><button data-move="left">←</button><button data-move="down">↓</button><button data-move="right">→</button><button data-zoom="-1">－ Zoom</button><button data-zoom="1">＋ Zoom</button></div>'+
    '<canvas id="lifeCanvas" width="860" height="410" tabindex="0" aria-label="Playable city schematic"></canvas>'+
    '<div class="life-preview-toolbar">'+spots.map(v=>'<button data-focus="'+v.id+'" '+(focusId===v.id?'class="primary"':'')+'>'+v.name+'</button>').join('')+'</div>'+
    '<div class="life-preview-toolbar"><button class="primary" id="lifeRespawn">↻ RESPAWN</button><button id="lifeBuyRoom" '+(s.housing?.room?'disabled':'')+'>🏠 AKSES KOST</button><button id="lifeSleep">💤 TIDUR</button><button id="lifePublicWC">🚾 WC UMUM</button><button id="lifePublicBath">🧼 MANDI UMUM</button><button id="lifeHomeWC" '+(!s.housing?.room?'disabled':'')+'>🚽 WC KOST</button><button id="lifeHomeBath" '+(!s.housing?.room?'disabled':'')+'>🚿 MANDI KOST</button></div>'+ 
    '<div class="life-preview-toolbar"><button class="primary" id="lifeCatch">🎣 MANCING</button><button id="lifeFruit">🌳 PANJAT POHON</button><button id="lifeCoffee">☕ KOPI</button><button id="lifeEat">🍚 MAKAN</button><button id="lifeRest">💤 ISTIRAHAT</button><button id="lifeAdvance">＋30 MENIT</button></div>'+
    '<div class="life-preview-toolbar"><label>Isi Tas<select id="lifeItem">'+slots+'</select></label><label>Pembeli<select id="lifeBuyer">'+Object.entries(E.BUYERS).map(([id,name])=>'<option value="'+id+'">'+esc(name)+'</option>').join('')+'</select></label><button class="primary" id="lifeSell">💰 JUAL IKAN</button></div>'+
    '<div class="life-status">'+['wallet','energy','hygiene','bladder','moral','experience'].map(k=>'<span><b>'+k.toUpperCase()+'</b> '+(k==='wallet'?cash(s[k]):(s[k]??0)+'/100')+'</span>').join('')+
    '<span><b>BAG</b> '+(s.inventory||[]).length+'/8</span><span><b>WAKTU BERLALU</b> '+(s.elapsedMinutes||0)+'m</span><span><b>HOUSING</b> '+(s.housing?.room?'KOST':'HOBO')+'</span><span><b>SPAWN</b> '+esc(s.spawnPosition?.id||'-')+'</span></div>'+ 
    '<div id="lifeFeedback" role="status" class="subtle">Pilih pin/titik interaksi, lalu lakukan aksi. WASD / arrow untuk bergerak ketika canvas aktif.</div></div>';
  if(selected&&Array.from($('lifeItem').options).some(o=>o.value===selected))$('lifeItem').value=selected;
  if(previousBuyer)$('lifeBuyer').value=previousBuyer;
  $('lifeRespawn').onclick=()=>act('respawn',{});
  $('lifeBuyRoom').onclick=()=>{const sp=spots.find(v=>v.id==='kost');act('buy_room',{roomSpawn:{id:sp.placeholder?'kost_preview_placeholder':sp.id,x:sp.x,z:sp.z,placeholder:sp.placeholder}});};
  $('lifeSleep').onclick=()=>act('sleep',{});
  $('lifePublicWC').onclick=()=>act('public_toilet',{facilityId:'preview_wc_umum'});
  $('lifePublicBath').onclick=()=>act('public_shower',{facilityId:'preview_mandi_umum'});
  $('lifeHomeWC').onclick=()=>act('home_toilet',{});
  $('lifeHomeBath').onclick=()=>act('home_shower',{});
  $('lifeCatch').onclick=()=>act('fish',{spotId:'preview_water'});
  $('lifeFruit').onclick=()=>act('catch_fruit',{});
  $('lifeSell').onclick=()=>act('sell_fish',{itemId:$('lifeItem').value,buyerId:$('lifeBuyer').value});
  $('lifeCoffee').onclick=()=>act('coffee',{});
  $('lifeEat').onclick=()=>act('eat',{});
  $('lifeRest').onclick=()=>act('rest',{minutes:15});
  $('lifeAdvance').onclick=()=>act('advance_time',{minutes:30});
  game.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>move(b.dataset.move));
  game.querySelectorAll('[data-focus]').forEach(b=>b.onclick=()=>{focusId=b.dataset.focus;const sp=spots.find(v=>v.id===focusId);if(sp){player.x=sp.x;player.z=sp.z;}renderGame();});
  game.querySelectorAll('[data-zoom]').forEach(b=>b.onclick=()=>{viewZoom=Math.max(.55,Math.min(2.3,viewZoom+(Number(b.dataset.zoom)*.2)));renderGame();});
  draw();
 }
 function act(action,args){
  const required=action==='fish'?'fishing':action==='catch_fruit'?'tree':action==='sell_fish'?args.buyerId:
    action==='public_toilet'?'public_wc':action==='public_shower'?'public_bath':
    action==='home_toilet'||action==='home_shower'||action==='buy_room'?'kost':
    action==='sleep'?(B.sandbox()?.housing?.room?'kost':'tenda'):null;
  const point=spots.find(v=>v.id===required);
  if(point&&Math.hypot(player.x-point.x,player.z-point.z)>1.8){
   if($('lifeFeedback'))$('lifeFeedback').textContent='DEKATI LOKASI: '+point.name+' dahulu (atau pilih pin untuk teleport sandbox).';return;
  }
  const result=dispatch(action,args);
  if(result.ok&&action==='respawn'&&result.state.spawnPosition){
   player.x=result.state.spawnPosition.x;player.z=result.state.spawnPosition.z;
   if(result.state.spawn==='hobo'){
    const tent=spots.find(v=>v.id==='tenda');tent.x=player.x;tent.z=player.z;tent.placeholder=result.state.spawnPosition.placeholder===true;
   }
   draw();
  }
  const text=(result.ok?'BERHASIL: '+result.changes.join(' · '):'DITOLAK: '+result.reason);
  if($('lifeFeedback'))$('lifeFeedback').textContent=text;
 }
 function move(dir){
  const d={up:[-1,-1],down:[1,1],left:[-1,1],right:[1,-1]}[dir];
  if(!d)return;
  player.x+=d[0];player.z+=d[1];draw();
 }
 function draw(){
  const canvas=$('lifeCanvas');if(!canvas)return;
  const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#dce4e7';ctx.fillRect(0,0,w,h);
  const sx=29*viewZoom,sy=14.5*viewZoom;
  const iso=(x,z)=>({x:w/2+((x-player.x)-(z-player.z))*sx,y:h/2+((x-player.x)+(z-player.z))*sy});
  const tiles=cityData().map?.terrain?.cells||[];
  function tile(x,z,kind){
   const p=iso(x,z);if(p.x<-40||p.x>w+40||p.y<-35||p.y>h+35)return;
   const colors={road:'#a4a9af',sidewalk:'#d8c8a9',grass:'#c4d7b7',water:'#7eb8d9',river:'#6cb0cd',drain:'#85a8b1',plaza:'#ddcfad',soil:'#cbb99c'};
   ctx.fillStyle=colors[kind]||'#bcd0b4';ctx.beginPath();ctx.moveTo(p.x,p.y-sy);ctx.lineTo(p.x+sx,p.y);ctx.lineTo(p.x,p.y+sy);ctx.lineTo(p.x-sx,p.y);ctx.closePath();ctx.fill();ctx.strokeStyle='#76909b33';ctx.stroke();
  }
  if(tiles.length){
   const visible=tiles.filter(t=>Math.abs(Number(t.c)-player.x)<20&&Math.abs(Number(t.r)-player.z)<20).slice(0,1900);
   for(const t of visible)tile(Number(t.c)||0,Number(t.r)||0,t.type);
  }else for(let x=Math.floor(player.x)-14;x<=player.x+14;x++)for(let z=Math.floor(player.z)-14;z<=player.z+14;z++)tile(x,z,'grass');
  const objs=entities().filter(o=>Math.abs((Number(o.x)||0)-player.x)<19&&Math.abs((Number(o.z)||0)-player.z)<19).slice(0,400);
  const all=objs.map(o=>({x:Number(o.x)||0,z:Number(o.z)||0,o})).concat(spots.map(sp=>({x:sp.x,z:sp.z,sp})));
  all.sort((a,b)=>(a.x+a.z)-(b.x+b.z));
  for(const item of all){
   const p=iso(item.x,item.z);if(p.x<0||p.x>w||p.y<-25||p.y>h+25)continue;
   if(item.sp){
    ctx.font='25px sans-serif';ctx.textAlign='center';ctx.fillText(item.sp.emoji,p.x,p.y-13);
    ctx.fillStyle=item.sp.id===focusId?'#fff5c4':'#ffffffd9';ctx.fillRect(p.x-58,p.y-10,116,18);
    ctx.font='11px Tahoma';ctx.fillStyle='#1d394e';ctx.fillText(item.sp.name.replace(/^.. /,''),p.x,p.y+2);
    if(item.sp.placeholder){ctx.font='9px Tahoma';ctx.fillText('PLACEHOLDER',p.x,p.y+12);}
   }else{
    const o=item.o,building=o.layer==='structure'||['building','shop'].includes(o.type);
    ctx.fillStyle=building?'#b77b56':o.type==='vehicle'?'#e2a147':o.layer==='vegetation'?'#57906f':'#6686a6';
    ctx.fillRect(p.x-7,p.y-(building?27:13),14,building?27:13);
   }
  }
  const p=iso(player.x,player.z);
  ctx.fillStyle='#eafaff';ctx.strokeStyle='#154d83';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y-21,10,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#203e4e';ctx.font='bold 11px Tahoma';ctx.fillText('PLAYER',p.x-20,p.y-39);
  ctx.fillStyle='#123a60';ctx.font='11px Tahoma';ctx.textAlign='left';ctx.fillText('City Draft: '+objs.length+' visible assets · '+tiles.length+' tiles total · schematic game preview',13,20);
 }
 window.addEventListener('keydown',ev=>{
  if($('playView')?.hidden||/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||''))return;
  const moves={w:'up',ArrowUp:'up',a:'left',ArrowLeft:'left',s:'down',ArrowDown:'down',d:'right',ArrowRight:'right'};
  if(moves[ev.key]){ev.preventDefault();move(moves[ev.key]);}
 });
 window.addEventListener('jiwa:life:render',()=>{renderEditor();renderGame();});
 window.addEventListener('jiwa:world-sync',()=>{sceneCityId='';renderGame();});
 renderEditor();renderGame();
})();
