(function(){
'use strict';
const $=id=>document.getElementById(id);
const screens=['splashScreen','loginScreen','characterScreen','gameScreen'];
const BASE=String(window.MAINKAN_CONFIG && window.MAINKAN_CONFIG.apiBase || '').replace(/\/$/,'');
const API_READY=/^https:\/\//i.test(BASE)||/^http:\/\/localhost(?::\d+)?$/i.test(BASE);
const keys=new Set(),held=new Set();
const allowed=['ichsan','noor','theodore'];
const worldState={doc:null,source:'',terrain:new Map(),player:{x:20,z:41.5,frame:0,facing:'sw'},cam:{x:20,z:41.5},target:null,zoom:1,images:new Map(),last:0,active:false,near:null};
let stage='splashScreen',loginMode='login',guest=true,session=null,selected='ichsan',profile=null,bootLoad=null;
const canvas=$('world'),ctx=canvas.getContext('2d',{alpha:false}),viewport=$('viewport');
const configMessage='Login akun online belum aktif. Backend autentikasi belum dikonfigurasi. Kamu bisa coba Mainkan Preview.';
function message(id,text,error){const el=$(id);el.textContent=text;el.classList.toggle('error',!!error);}
function screen(id){
 stage=id;
 screens.forEach(name=>{$(name).hidden=name!==id;});
 $('statusText').textContent=id==='gameScreen'?'PLAY PREVIEW':id==='loginScreen'?'ACCOUNT / GUEST':id==='characterScreen'?'NEW CHARACTER':'BOOTING';
 if(id==='gameScreen'){worldState.active=true;resize();requestAnimationFrame(tick);}
 else worldState.active=false;
}
function sleep(ms){return new Promise(done=>setTimeout(done,ms));}
async function request(path,opt){
 if(!API_READY)throw Error(configMessage);
 const res=await fetch(BASE+path,Object.assign({credentials:'include',headers:{'Content-Type':'application/json'}},opt||{}));
 let data=null;try{data=await res.json();}catch{}
 if(!res.ok)throw Error(data && data.message || 'Server menolak permintaan ('+res.status+').');
 return data||{};
}
async function loadWorld(){
 const params=new URLSearchParams(location.search);
 // Only relative, same-origin world snapshots; never let an arbitrary URL become executable content.
 const path='../world-builder/world.json';
 const response=await fetch(path,{cache:'no-store'});
 if(!response.ok)throw Error('Dunia Semesta belum tersedia: HTTP '+response.status);
 const doc=await response.json();
 if(!doc || !doc.map || !Array.isArray(doc.objects))throw Error('Format world.json tidak valid');
 const terrain=new Map();
 (doc.map.terrain && doc.map.terrain.cells || []).forEach(t=>{
   if(Number.isFinite(t.c)&&Number.isFinite(t.r))terrain.set(t.c+','+t.r,t.type);
 });
 worldState.doc=doc;worldState.terrain=terrain;worldState.source='SEMESTA / AUTHORING SNAPSHOT';
 return doc;
}
async function startup(){
 let pct=0;
 const bar=$('progressFill');
 const labels=['Menghubungkan pipeline aset...','Membaca peta Semesta...','Memeriksa layanan pemain...'];
 for(let i=0;i<labels.length;i++){
   $('bootText').textContent=labels[i];
   pct+=30;bar.style.width=pct+'%';
   if(i===1){try{bootLoad=await loadWorld();}catch(e){$('bootText').textContent='Peta belum terbaca; bisa dicoba lagi nanti.';}}
   await sleep(window.matchMedia('(prefers-reduced-motion:reduce)').matches?40:320);
 }
 bar.style.width='100%';
 await sleep(140);
 if(stage==='splashScreen')screen('loginScreen');
 message('authMessage',API_READY?'Login online siap dihubungkan.':configMessage,!API_READY);
}
$('skipSplash').addEventListener('click',()=>screen('loginScreen'));
function setLoginMode(mode){
 loginMode=mode;
 ['login','register'].forEach(x=>{const btn=$(x+'Tab');btn.classList.toggle('active',mode===x);btn.setAttribute('aria-selected',String(mode===x));});
 $('authSubmit').textContent=mode==='register'?'Daftar':'Login';
 $('password').autocomplete=mode==='register'?'new-password':'current-password';
 message('authMessage',API_READY?'':configMessage,!API_READY);
}
$('loginTab').addEventListener('click',()=>setLoginMode('login'));
$('registerTab').addEventListener('click',()=>setLoginMode('register'));
$('authForm').addEventListener('submit',async ev=>{
 ev.preventDefault();
 if(!API_READY){message('authMessage',configMessage,true);return;}
 const button=$('authSubmit');button.disabled=true;
 try{
   const data=await request(loginMode==='register'?'/auth/register':'/auth/login',{
     method:'POST',body:JSON.stringify({email:$('email').value.trim(),password:$('password').value})
   });
   $('password').value='';
   if(!data || data.authenticated!==true)throw Error('Server belum mengonfirmasi sesi login.');
   guest=false;session=data;profile=data.player||null;
   if(profile && profile.character && allowed.includes(profile.character.asset)){
     selected=profile.character.asset;await beginWorld();
   }else screen('characterScreen');
 }catch(e){message('authMessage',e.message||'Login gagal',true);}
 finally{button.disabled=false;}
});
$('guestButton').addEventListener('click',()=>{guest=true;session=null;profile=null;screen('characterScreen');});
$('backToLogin').addEventListener('click',()=>screen('loginScreen'));
function selectCharacter(id){
 if(!allowed.includes(id))return;
 selected=id;
 document.querySelectorAll('.choice').forEach(c=>{
   const yes=c.dataset.character===id;c.classList.toggle('selected',yes);c.setAttribute('aria-pressed',String(yes));
 });
}
document.querySelectorAll('.choice').forEach(c=>c.addEventListener('click',()=>selectCharacter(c.dataset.character)));
document.querySelectorAll('.choice img').forEach(el=>{
 const src=el.getAttribute('src'),im=new Image();
 im.onload=()=>{
   const c=document.createElement('canvas');c.width=64;c.height=112;c.style.width='54px';c.style.height='94px';c.style.imageRendering='pixelated';
   const gx=c.getContext('2d');gx.imageSmoothingEnabled=false;gx.drawImage(im,0,0,64,112,0,0,64,112);
   el.replaceWith(c);
 };
 im.onerror=()=>{el.style.display='none';};
 im.src=src;
});
$('characterForm').addEventListener('submit',async ev=>{
 ev.preventDefault();
 const name=$('playerName').value.trim(),zodiac=$('zodiac').value;
 if(name.length<2||!zodiac)return message('characterMessage','Nama dan zodiak wajib diisi.',true);
 const character={name,zodiac,asset:selected,gender:selected==='ichsan'?'male':selected==='noor'?'female':'astro'};
 if(!guest){
   try{
     const data=await request('/players/profile',{method:'PUT',body:JSON.stringify({character})});
     if(!data || data.saved!==true)throw Error('Server belum mengonfirmasi penyimpanan karakter.');
     profile=Object.assign({},profile||{},data.player||{},{character});
   }catch(e){return message('characterMessage','Karakter belum tersimpan: '+e.message,true);}
 }else{
   profile={character};message('characterMessage','Preview tamu: progress tidak disimpan online.');
 }
 await beginWorld();
});
async function beginWorld(){
 if(!worldState.doc){try{await loadWorld();}catch(e){message('characterMessage','Gagal memuat peta: '+e.message,true);return;}}
 const doc=worldState.doc;
 const markers=doc.objects.filter(x=>x.type==='marker'&&/spawn/i.test(x.markerKind||x.name||x.id));
 const world={
   map:doc.map,
   tileAt(x,z){return worldState.terrain.get(Math.floor(x)+','+Math.floor(z))||doc.map.terrain?.default||'grass';}
 };
 const spawn=window.VLSpawnRespawn;
 const result=spawn && spawn.resolve?spawn.resolve({},spawn.defaultModule(),world):null;
 const point=result && result.ok && result.point?result.point:markers[0]||{x:20,z:41.5};
 worldState.player.x=Number(point.x)||20;
 worldState.player.z=Number(point.z)||41.5;
 worldState.cam.x=worldState.player.x;worldState.cam.z=worldState.player.z;
 worldState.target=null;
 const chars=profile&&profile.character||{name:'Guest',asset:selected};
 $('hudName').textContent=chars.name;
 $('cityName').textContent=doc.map.name||'Semesta';
 $('worldLabel').textContent=guest?'GUEST PREVIEW • SNAPSHOT SEMESTA':'ONLINE SESSION • WORLD PREVIEW';
 worldState.last=0;screen('gameScreen');
}
$('exitGame').addEventListener('click',()=>{held.clear();keys.clear();worldState.target=null;screen('loginScreen');});
$('homeButton').addEventListener('click',()=>{held.clear();keys.clear();worldState.target=null;screen('loginScreen');});
$('zoomIn').addEventListener('click',()=>{worldState.zoom=Math.min(2,worldState.zoom*1.2);});
$('zoomOut').addEventListener('click',()=>{worldState.zoom=Math.max(.55,worldState.zoom/1.2);});
viewport.addEventListener('wheel',e=>{if(stage!=='gameScreen')return;e.preventDefault();worldState.zoom=Math.min(2,Math.max(.55,worldState.zoom*(e.deltaY<0?1.09:.91)));},{passive:false});
function mappedKey(key){
 if(['ArrowUp','w','W'].includes(key))return 'up';
 if(['ArrowDown','s','S'].includes(key))return 'down';
 if(['ArrowLeft','a','A'].includes(key))return 'left';
 if(['ArrowRight','d','D'].includes(key))return 'right';
 return '';
}
window.addEventListener('keydown',e=>{
 if(stage!=='gameScreen'||/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||''))return;
 const dir=mappedKey(e.key);
 if(dir){e.preventDefault();keys.add(dir);worldState.target=null;}
 if((e.key==='e'||e.key==='E')&&!e.repeat)action();
 if(e.key==='Escape')screen('loginScreen');
});
window.addEventListener('keyup',e=>{const dir=mappedKey(e.key);if(dir)keys.delete(dir);});
window.addEventListener('blur',()=>{held.clear();keys.clear();});
document.querySelectorAll('[data-move]').forEach(b=>{
 const dir=b.dataset.move;
 b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);held.add(dir);worldState.target=null;});
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>held.delete(dir));
});
let tapStart=null;
canvas.addEventListener('pointerdown',e=>{if(stage!=='gameScreen')return;tapStart={x:e.clientX,y:e.clientY};});
canvas.addEventListener('pointerup',e=>{
 if(!tapStart||Math.hypot(e.clientX-tapStart.x,e.clientY-tapStart.y)>12){tapStart=null;return;}
 tapStart=null;
 const rect=canvas.getBoundingClientRect();
 const dx=(e.clientX-rect.left-rect.width/2)/worldState.zoom;
 const dy=(e.clientY-rect.top-rect.height*.58)/worldState.zoom;
 const tx=worldState.cam.x+dx/48+dy/24;
 const tz=worldState.cam.z+dy/24-dx/48;
 worldState.target={x:tx,z:tz};
});
$('actionButton').addEventListener('click',action);
function action(){
 const near=worldState.near;
 if(!near){$('interaction').textContent='Tidak ada objek interaktif di dekatmu.';return;}
 const list=(near.interactions||[]).filter(x=>x!=='activate');
 $('interaction').textContent=list.length?
  'Interaksi '+list[0]+' dengan '+(near.name||near.id)+' belum terhubung ke Jiwa runtime.':
  'Objek '+(near.name||near.id)+' belum punya aksi player.';
}
function blocked(x,z){
 const doc=worldState.doc;if(!doc)return false;
 const bounds=doc.map.worldBounds||{};
 if(x<(bounds.minX??-100)-5||x>(bounds.maxX??100)+5||z<(bounds.minZ??-100)-5||z>(bounds.maxZ??100)+5)return true;
 const tile=worldState.terrain.get(Math.floor(x)+','+Math.floor(z))||doc.map.terrain?.default||'grass';
 if(['river','water','drain'].includes(tile))return true;
 return doc.objects.some(o=>{
   if(o.layer==='marker'||o.type==='npc'||o.type==='avatar'||o.collision===false||o.blocking==='no')return false;
   const dx=x-Number(o.x),dz=z-Number(o.z);
   const rad=o.layer==='structure'?Math.min(3.0,Math.max(1.1,Number(o.width||3)*.24)):.42;
   return Math.hypot(dx,dz)<rad;
 });
}
function resize(){
 const rect=viewport.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);
 if(rect.width<1||rect.height<1)return;
 canvas.width=Math.max(1,Math.round(rect.width*dpr));canvas.height=Math.max(1,Math.round(rect.height*dpr));
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;
}
window.addEventListener('resize',resize);
function point(x,z,w,h){
 const p=worldState.player,c=worldState.cam,t=worldState.zoom;
 return {x:w/2+((x-c.x)-(z-c.z))*24*t,y:h*.58+((x-c.x)+(z-c.z))*12*t};
}
function diamond(x,y,w,h,fill,stroke){
 ctx.beginPath();ctx.moveTo(x,y-h/2);ctx.lineTo(x+w/2,y);ctx.lineTo(x,y+h/2);ctx.lineTo(x-w/2,y);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.7;ctx.stroke();}
}
function drawTerrain(w,h){
 const doc=worldState.doc;if(!doc)return;
 const b=doc.map.worldBounds||{minX:-30,maxX:40,minZ:20,maxZ:55};
 const t=worldState.zoom;
 const colors={road:'#58676d',sidewalk:'#b6b2a3',grass:'#658c59',water:'#498eae',river:'#498eae',drain:'#486d7e',asphalt:'#58676d'};
 for(let c=b.minX||-30;c<(b.maxX||40);c++)for(let r=b.minZ||20;r<(b.maxZ||55);r++){
   const p=point(c+.5,r+.5,w,h);if(p.x< -70||p.y< -40||p.x>w+70||p.y>h+40)continue;
   const type=worldState.terrain.get(c+','+r)||doc.map.terrain?.default||'grass';
   diamond(p.x,p.y,48*t+1,24*t+1,colors[type]||colors.grass,'#223a3430');
 }
}
function imageFor(id){
 if(worldState.images.has(id))return worldState.images.get(id);
 let source=null;
 const pipe=window.VLPipelineAssets;
 if(id.startsWith('pipeline:')&&pipe && pipe.building)source=pipe.building(id.slice(9),'sw');
 if(!source){worldState.images.set(id,null);return null;}
 const img=new Image();img.crossOrigin='anonymous';img.decoding='async';
 const holder={img,loaded:false,meta:pipe.prefabs.find(e=>e.id===id.slice(9))};
 img.onload=()=>{holder.loaded=true;};img.onerror=()=>{holder.failed=true;};
 img.src=source;worldState.images.set(id,holder);return holder;
}
function primitive(o,p,t){
 const structure=o.layer==='structure'||/office|shop|warteg/i.test(o.id||'');
 const tree=o.layer==='vegetation'||/tree/i.test(o.id||'');
 const size=structure?Math.max(1.5,Math.min(5,+o.width||3)):1;
 if(tree){
   ctx.fillStyle='#5f4329';ctx.fillRect(p.x-3*t,p.y-32*t,6*t,33*t);
   diamond(p.x,p.y-34*t,35*t,33*t,'#2d7957','#164c35');
   diamond(p.x-4*t,p.y-50*t,28*t,28*t,'#46885b','#164c35');
 }else if(structure){
   const sx=size*10*t,sy=size*6*t,hh=Math.max(20,Math.min(105,(+o.height||5)*10))*t;
   ctx.fillStyle='#738e98';ctx.beginPath();ctx.moveTo(p.x-sx,p.y);ctx.lineTo(p.x,p.y+sy);ctx.lineTo(p.x,p.y+sy-hh);ctx.lineTo(p.x-sx,p.y-hh);ctx.closePath();ctx.fill();
   ctx.fillStyle='#b1b2a9';ctx.beginPath();ctx.moveTo(p.x,p.y+sy);ctx.lineTo(p.x+sx,p.y);ctx.lineTo(p.x+sx,p.y-hh);ctx.lineTo(p.x,p.y+sy-hh);ctx.closePath();ctx.fill();
   diamond(p.x,p.y-hh,sx*2,sy*2,'#aa7971','#725453');
 }else{
   ctx.fillStyle=o.type==='npc'?'#5a627a':'#c0a27d';
   ctx.fillRect(p.x-7*t,p.y-22*t,14*t,22*t);
   ctx.fillStyle='#eee4be';ctx.fillRect(p.x-5*t,p.y-30*t,10*t,10*t);
 }
}
function drawObject(o,w,h){
 if(o.type==='marker'||o.type==='avatar')return;
 const p=point(Number(o.x),Number(o.z),w,h),t=worldState.zoom;
 if(p.x< -400||p.x>w+400||p.y< -200||p.y>h+400)return;
 let imgdata=null;if(o.asset)imgdata=imageFor(String(o.asset));
 if(imgdata && imgdata.loaded && imgdata.meta){
   const v=imgdata.meta.variants.sw||imgdata.meta.variants.se;
   const scale=.47*t;
   const width=v.size[0]*scale,height=v.size[1]*scale;
   const x=p.x-v.pivot[0]*scale,y=p.y-v.pivot[1]*scale;
   const frontOfPlayer=Number(o.x)+Number(o.z)>worldState.player.x+worldState.player.z+1;
   const nearPlayer=Math.abs(p.x-point(worldState.player.x,worldState.player.z,w,h).x)<width*.45;
   ctx.globalAlpha=(frontOfPlayer && nearPlayer && o.layer==='vegetation')?.68:1;
   ctx.drawImage(imgdata.img,x,y,width,height);ctx.globalAlpha=1;
 }else primitive(o,p,t);
}
let avatarImage=null;
function avatar(){
 const url=window.VLPipelineAssets?.character(selected);
 if(!url)return null;
 if(avatarImage && avatarImage.url===url)return avatarImage;
 const img=new Image();img.crossOrigin='anonymous';img.decoding='async';
 avatarImage={url,img,loaded:false};
 const current=avatarImage;
 img.onload=()=>{current.loaded=true;};img.onerror=()=>{current.failed=true;};
 img.src=url;return current;
}
function drawPlayer(w,h){
 const p=point(worldState.player.x,worldState.player.z,w,h),t=worldState.zoom;
 diamond(p.x,p.y,25*t,11*t,'#00000035');
 const sprite=avatar();
 if(sprite&&sprite.loaded){
   const f=Math.floor(worldState.player.frame)%6;
   ctx.drawImage(sprite.img,f*64,0,64,112,p.x-20*t,p.y-66*t,40*t,70*t);
 }else{
   ctx.fillStyle='#374f68';ctx.fillRect(p.x-10*t,p.y-30*t,20*t,27*t);
   ctx.fillStyle='#e8c6a1';ctx.fillRect(p.x-8*t,p.y-48*t,16*t,18*t);
 }
}
function render(){
 if(!worldState.doc)return;
 const w=viewport.clientWidth,h=viewport.clientHeight;if(w<2||h<2)return;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#688d68';ctx.fillRect(0,0,w,h);
 drawTerrain(w,h);
 const objects=worldState.doc.objects.filter(o=>o.type!=='marker'&&o.type!=='avatar').slice().sort((a,b)=>(Number(a.x)+Number(a.z))-(Number(b.x)+Number(b.z)));
 let painted=false;
 for(const o of objects){
   if(!painted&&Number(o.x)+Number(o.z)>worldState.player.x+worldState.player.z){drawPlayer(w,h);painted=true;}
   drawObject(o,w,h);
 }
 if(!painted)drawPlayer(w,h);
}
function tick(ms){
 if(!worldState.active)return;
 const dt=Math.min(.065,worldState.last?(ms-worldState.last)/1000:.016);worldState.last=ms;
 const vectors={up:[-1,-1],down:[1,1],left:[-1,1],right:[1,-1]};
 let dx=0,dz=0;for(const direction of new Set([...keys,...held])){const v=vectors[direction];if(v){dx+=v[0];dz+=v[1];}}
 if(dx===0&&dz===0&&worldState.target){
   const a=worldState.target;dx=a.x-worldState.player.x;dz=a.z-worldState.player.z;
   if(Math.hypot(dx,dz)<.3){worldState.target=null;dx=0;dz=0;}
 }
 const distance=Math.hypot(dx,dz);
 if(distance>.001){
   const speed=5.5*dt;const x=worldState.player.x+dx/distance*speed,z=worldState.player.z+dz/distance*speed;
   if(!blocked(x,z)){worldState.player.x=x;worldState.player.z=z;}
   else if(worldState.target)worldState.target=null;
   worldState.player.frame+=dt*8;
 }else worldState.player.frame=0;
 worldState.cam.x+=(worldState.player.x-worldState.cam.x)*Math.min(1,dt*6);
 worldState.cam.z+=(worldState.player.z-worldState.cam.z)*Math.min(1,dt*6);
 const player=worldState.player,possible=worldState.doc.objects
   .filter(o=>Array.isArray(o.interactions)&&o.interactions.length&&o.type!=='marker')
   .map(o=>({o,d:Math.hypot(o.x-player.x,o.z-player.z)}))
   .filter(x=>x.d<3.7).sort((a,b)=>a.d-b.d);
 const nearest=possible[0]?.o||null;
 if(worldState.near!==nearest){
   worldState.near=nearest;
   $('interaction').textContent=nearest?('Dekat '+(nearest.name||nearest.id)+' • E / ACTION untuk mencoba interaksi'):'WASD / arah untuk berjalan. Tap peta untuk pindah.';
 }
 $('hudPosition').textContent='X '+player.x.toFixed(1)+' / Z '+player.z.toFixed(1);
 render();requestAnimationFrame(tick);
}
function clock(){
 const date=new Date();$('clock').textContent=date.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
}
clock();setInterval(clock,60000);
startup();
})();
