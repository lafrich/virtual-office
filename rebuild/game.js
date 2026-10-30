/* VIRTUAL OFFICE / REBUILD 01
 * Standalone, editable HTML Canvas simulation; NO encrypted assets.
 * Source is intentionally modular by functions, data-driven scene entities.
 * No server/account or multiplayer is implied. */
(() => {
'use strict';
const $=id=>document.getElementById(id), C=$('world'), g=C.getContext('2d',{alpha:false});
const view=$('viewport'), action=$('actionBtn'), toastEl=$('toast');
const DPR=.82, TX=23, TY=11.5, TAU=Math.PI*2;
const V=window.VOVisualSystem, PAL=V.palette;
let W=420,H=650,zoom=.77,ox=0,oy=0,now=performance.now(),toastTimer=0,manualZoom=false;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const iso=(x,y,z=0)=>({x:ox+(x-y)*TX*zoom,y:oy+(x+y)*TY*zoom-z*zoom});
const point=(x,y)=>({x:Math.round(x),y:Math.round(y)});
const ink='#25283a',dim='#182431',highlight='#f8e8c4';
function poly(ps,color,stroke='#21283a',lw=1){
 g.beginPath();g.moveTo(Math.round(ps[0].x),Math.round(ps[0].y));
 for(let i=1;i<ps.length;i++)g.lineTo(Math.round(ps[i].x),Math.round(ps[i].y));
 g.closePath();g.fillStyle=color;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke();}
}
function fill(x,y,w,h,color){g.fillStyle=color;g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));}
function line(a,b,color=ink,width=1){g.strokeStyle=color;g.lineWidth=width;g.beginPath();g.moveTo(Math.round(a.x),Math.round(a.y));g.lineTo(Math.round(b.x),Math.round(b.y));g.stroke();}
function box(x,y,w,d,height,top,left,right,z=0){
 const A=iso(x-w/2,y-d/2,z),B=iso(x+w/2,y-d/2,z),Q=iso(x+w/2,y+d/2,z),D=iso(x-w/2,y+d/2,z),
 a=iso(x-w/2,y-d/2,z+height),b=iso(x+w/2,y-d/2,z+height),c=iso(x+w/2,y+d/2,z+height),d0=iso(x-w/2,y+d/2,z+height);
 poly([d0,c,Q,D],left);poly([b,c,Q,B],right);poly([a,b,c,d0],top);
 return {a,b,c,d:d0};
}
function diamond(x,y,color,stroke='#8fa0b1'){
 const a=iso(x,y),b=iso(x+1,y),c=iso(x+1,y+1),d=iso(x,y+1);poly([a,b,c,d],color,stroke,.45);
}
function pixelText(text,x,y,color='#fff',size=9){
 g.font='bold '+Math.round(size*zoom)+'px monospace';g.textAlign='center';g.lineWidth=3;
 g.strokeStyle='#141621';g.strokeText(text,Math.round(x),Math.round(y));
 g.fillStyle=color;g.fillText(text,Math.round(x),Math.round(y));
}
function shadow(x,y,w=13,h=5){
 const p=iso(x,y);g.fillStyle='rgba(30,40,54,.30)';g.beginPath();g.ellipse(p.x,p.y,w*zoom,h*zoom,0,0,TAU);g.fill();
}
function faceDir(d){return d==='se'||d==='sw'?'front':'back'}
function drawHuman(x,y,{sitting=false,lying=false,dir='sw',
 shirt=PAL.ink,hair='#171b24',skin=PAL.skin,label=null,npc=false,walk=0}={}){
 const p=iso(x,y),k=zoom;
 shadow(x,y,8.5,3.4);
 g.save();g.translate(Math.round(p.x),Math.round(p.y));g.scale(k,k);
 // The avatar uses one consistent pixel scale and the same top-left lighting
 // in idle, walk, sit, sleep and bath. Nothing is a new floating canvas object.
 const P=(xx,yy,ww,hh,c)=>fill(xx,yy,ww,hh,c);
 const trousers='#303747',trousersLight='#526078',boots='#2B3038',
       shirtLight=shirt===PAL.ink?'#44536B':PAL.grey;
 const rear=faceDir(dir)!=='front';
 const glasses=hair==='#171b24'||hair==='#161c25';
 if(lying){
  // Lateral 2:1 sleeping silhouette, with glasses & hair at left.
  P(-18,-14,11,11,hair);P(-17,-10,9,8,skin);
  P(-13,-15,11,4,hair);P(-15,-8,8,2,hair);
  P(-6,-13,23,12,shirt);P(-5,-12,9,3,shirtLight);
  P(14,-12,15,5,trousers);P(15,-6,15,4,trousers);
  P(25,-12,8,3,boots);P(27,-3,8,3,boots);
  if(glasses){P(-14,-9,6,3,PAL.ink);P(-12,-8,3,1,PAL.glass)}
 }else{
  const stride=sitting?0:Math.sin(walk*9),swing=Math.round(stride*2);
  const torso=sitting?-23:-34,head=sitting?-43:-54;
  if(sitting){
   // Bent thighs and short dangling lower legs sit behind front occlusion.
   P(-9,-9,8,10,trousers);
   P(2,-9,8,10,trousersLight);
   P(-10,-1,8,3,boots);P(3,-1,8,3,boots);
   P(-9,-12,18,5,trousers);
  }else{
   P(-9,-15+swing,7,15,trousers);
   P(2,-15-swing,7,15,trousersLight);
   P(-10,-2+swing,8,3,boots);P(2,-2-swing,9,3,boots);
   P(-8,-17,16,4,trousers);
  }
  // Shirt silhouette: separate shoulders, seam, sleeves and tiny collar.
  P(-11,torso,22,19,shirt);P(-9,torso+2,6,3,shirtLight);
  P(-13,torso+2,5,12,shirt);
  P(8,torso+2,6,12,shirt);
  P(-13,torso+13,4,5,skin);
  P(10,torso+13,4,5,skin);
  P(-7,torso+18,14,2,PAL.ink);
  P(-3,torso+1,6,3,skin);
  // Rounded pixel-cut jaw and ears, framed by two-tone hair.
  P(-12,head+5,24,16,skin);
  P(-10,head+19,20,4,PAL.skinShadow);
  P(-12,head+15,4,6,PAL.skinShadow);
  P(8,head+15,4,6,PAL.skinShadow);
  P(-12,head-1,24,12,hair);
  P(-10,head-4,8,7,hair);
  P(0,head-5,10,7,hair);
  P(10,head+5,3,14,hair);
  P(-13,head+4,4,14,hair);
  // Asymmetric pixel bangs and small side tuft; no smooth gradients.
  P(-8,head+8,5,5,hair);
  P(-1,head+7,6,4,hair);
  P(6,head+9,4,4,hair);
  P(-8,head+1,7,3,'#303746');
  if(!rear){
   if(glasses){
    // Glasses as two open lenses, exact same size for every pose.
    P(-10,head+12,9,7,PAL.ink);P(1,head+12,9,7,PAL.ink);
    P(-8,head+14,5,3,PAL.glass);P(3,head+14,5,3,PAL.glass);
    P(-2,head+14,5,2,PAL.ink);
    P(-8,head+15,2,2,PAL.ink);P(3,head+15,2,2,PAL.ink);
    P(-12,head+13,3,2,PAL.ink);P(9,head+13,3,2,PAL.ink);
   }else{
    P(-7,head+15,2,2,PAL.ink);
    P(5,head+15,2,2,PAL.ink);
   }
   P(-3,head+21,6,1,'#935A4F');
  }else{
   // Back-facing hair covers facial features with a simple side highlight.
   P(-9,head+10,18,11,hair);
   P(-6,head+3,7,14,'#2A303A');
  }
 }
 g.restore();
 if(label){const q=iso(x,y,(lying?20:sitting?51:63));pixelText(label,q.x,q.y,PAL.cream,9)}
}
function drawCat(x,y,t=0){
 const p=iso(x,y,4);g.save();g.translate(Math.round(p.x),Math.round(p.y+Math.sin(t*2)*1.1));g.scale(zoom,zoom);
 fill(-9,-7,16,8,'#f2f3f1');fill(-8,-10,5,5,'#242c36');fill(2,-10,5,5,'#252d39');
 fill(-8,-13,5,5,'#252d39');fill(3,-13,5,5,'#252d39');fill(4,-7,2,2,'#a3d179');
 fill(8,-5,6,2,'#252d39');g.restore();
}
// Consistent visual primitives shared across all scenes.
function artProps(){return V.props({ctx:g,zoom,box,iso,poly,line,fill,shadow});}
// Shared detailed prop renderer used by all rooms, not just Cove.
function pixelPiece(type,x,y,w,d,h,scale=1){
 return window.VOPixelKit.drawAsset({ctx:g,box,iso,line,poly,shadow,zoom},
   {id:'shared-'+type,type,at:{x,y},size:{w,d,h},scale,elevation:0},'base');
}
function drawPlant(x,y,size=1){pixelPiece('plant',x,y,.66,.66,27,size);}
function drawWindow(x,y,orient='horizontal'){artProps().window(x,y,orient,34,2.45);}
function drawWalls(zone){
 let w=zone==='office'?18:zone==='warteg'?12:16,d=zone==='office'?13:zone==='warteg'?11:13;
 const wall=zone==='warteg'?PAL.cream:PAL.wall,trim=zone==='warteg'?PAL.greenDark:PAL.wallLight;
 const bl=iso(0,0),br=iso(w,0),fl=iso(0,d);
 const h=zone==='warteg'?80:70;
 poly([{x:bl.x,y:bl.y-h*zoom},{x:br.x,y:br.y-h*zoom},br,bl],wall,'#7d817f',1);
 poly([{x:bl.x,y:bl.y-h*zoom},{x:fl.x,y:fl.y-h*zoom},fl,bl],wall,'#7b837a',1);
 line({x:bl.x,y:bl.y-h*zoom},{x:br.x,y:br.y-h*zoom},trim,7*zoom);
 line({x:bl.x,y:bl.y-h*zoom},{x:fl.x,y:fl.y-h*zoom},trim,7*zoom);
 if(zone==='warteg'){
   line(iso(0,0,36),iso(w,0,36),PAL.greenDark,3);
   line(iso(0,0,36),iso(0,d,36),PAL.greenDark,3);
   drawWindow(2,0,'horizontal');drawWindow(0,4,'vertical');
 }else if(zone==='office'){
   for(let j=3;j<16;j+=4)drawWindow(j,0,'horizontal');
   for(let j=3;j<12;j+=3)drawWindow(0,j,'vertical');
   artProps().wallArt(5.1,0,40,1.30,0,'blue');
   artProps().wallArt(7.7,0,38,1.10,0,'bath');
 }else{for(let j=3;j<13;j+=4)drawWindow(j,0,'horizontal');}
}
function drawFloor(zone){
 const dims=zone==='office'?[18,13]:zone==='street'?[16,13]:[12,11];
 for(let y=0;y<dims[1];y++)for(let x=0;x<dims[0];x++){
  const alternating=(x+y)%2===0;
  let color,stroke;
  if(zone==='office'){color=alternating?PAL.floor:PAL.floorAlt;stroke=PAL.floorEdge;}
  else if(zone==='warteg'){color=alternating?PAL.cream:PAL.wallLight;stroke=PAL.wallSide;}
  else{color=alternating?'#D5E7D4':'#C6DECC';stroke=PAL.greenLight;}
  diamond(x,y,color,stroke);
 }
 if(zone==='office'){
  box(7.1,6.5,5.0,3.8,.12,PAL.blueDark,PAL.shadowDark,PAL.shadowDark);
  artProps().rug(7.1,6.5,4.65,3.4);
 }
}
function drawDesk(x,y){pixelPiece('desk',x,y,2.7,1.55,43);}
function drawChair(x,y,mode='office'){pixelPiece('chair',x,y,.72,.72,25);}
function drawSofa(occupied,frame){
 // Fixed painter order: back + cushions -> sitters -> armrests/front trim.
 const x=7.4,y=6.1;
 shadow(x,y,23,7);
 for(const xx of [5.45,9.3])
  box(xx,6.65,.19,.28,4,PAL.wood,PAL.woodDark,PAL.woodDark);
 box(x,y,4.25,1.76,7,PAL.creamShade,PAL.wallSide,PAL.shadow);
 box(x,y-.63,4.22,.38,22,PAL.cream,PAL.creamShade,PAL.wallSide);
 line(iso(5.42,5.47,22),iso(9.38,5.47,22),PAL.white,1.4);
 for(let i=0;i<3;i++){
  const seatX=6.15+i*1.24;
  box(seatX,6.37,1.16,1.00,8,PAL.cream,PAL.creamShade,PAL.shadow,7);
  line(iso(seatX-.45,6.7,15.1),iso(seatX+.39,6.7,15.1),PAL.white,.7);
 }
 box(8.55,5.92,.67,.50,5,PAL.blue,PAL.blueDark,PAL.blueDark,16);
 if(occupied)drawHuman(occupied.x,occupied.y,{
  sitting:true,dir:'sw',shirt:PAL.ink,hair:'#171b24'
 });
 drawHuman(6.05,6.34,{
  sitting:true,dir:'sw',hair:'#949ca7',skin:'#efd0b1',shirt:PAL.grey
 });
 box(5.20,6.10,.42,1.57,18,PAL.cream,PAL.creamShade,PAL.wallSide);
 box(9.57,6.10,.38,1.57,18,PAL.cream,PAL.creamShade,PAL.wallSide);
 box(x,6.93,4.30,.20,10,PAL.cream,PAL.creamShade,PAL.shadow);
 drawCat(8.15,6.5,frame);
 const n=iso(6.05,6.34,53);pixelText('BAYMAX',n.x,n.y,PAL.cream,8);
}
function drawOffice(x,y,sceneActor,frame){
 drawWalls('office');drawFloor('office');
 // Each physical furnishing retains its original artwork but receives
 // an independent editable world transform and depth.
 const entries=[
  ['office-plant-a',4,()=>drawPlant(2.1,2.7)],
  ['office-storage',5.5,()=>box(4.2,2.2,1.3,1.4,9,'#475de0','#2f47aa','#304eac')],
  ['office-lowtable',9,()=>box(8.6,3.8,2.5,1.15,10,'#dfb575','#a87f51','#a0794c')],
  ['office-desk-a',10,()=>drawDesk(12.0,3.7)],
  ['office-desk-b',13,()=>drawDesk(13.3,5.9)],
  ['office-plant-b',15,()=>drawPlant(12.2,8.7)],
  ['office-sofa',15.5,(dx,dy)=>drawSofa(
    sceneActor?.seatId==='sofa'?{...sceneActor,x:sceneActor.x-dx,y:sceneActor.y-dy}:null,frame)],
  ['office-coffee-a',18,()=>artProps().coffee(10.25,7.9)],
  ['office-coffee-b',19,()=>{box(11.2,10.1,1.05,.72,10,'#bd955f','#866744','#8e6c43');
    box(11.2,10.1,.84,.56,.15,'#e9dbb7','#ac986f','#aa916f',10);}],
  ['office-desk-c',22,()=>drawDesk(14.5,8.1)],
  ['office-chair',23,()=>drawChair(14.4,9.1)],
  ['office-toilet',25,()=>{box(16.1,10.8,.9,.9,6,'#f9fbf9','#c8e1e5','#bad5d7');
    box(16.1,10.8,.48,.58,2,'#b7e6f2','#71aabb','#73a6b5',6);}],
  ['office-shower',24.8,()=>{box(16.2,8.8,1.0,.9,27,'#a9dcf1','#7099ba','#658eb6');
    box(16.2,8.8,.8,.8,1,'#e2f6f8','#bfd6d7','#b2d3d5',27);}]
 ];
 const w=sceneWorlds.office;
 for(const [id,depth,fn] of entries){
   const item=w.get(id),base=w.defaultAssets.find(a=>a.id===id);
   if(!item?.visible||!base)continue;
   const dx=item.at.x-base.at.x,dy=item.at.y-base.at.y;
   objects.push({d:depth+dx+dy+item.depthBias,
     fn:()=>paintFurniture('office',id,base.at.x,base.at.y,fn)});
 }
}
function drawBar(occupied){
 const x=6.3,y=4.1;
 // Storage and buffet in front of the green warteg wall.
 box(x,y,7.7,1.45,21,PAL.cream,PAL.wallSide,PAL.grey);
 box(x,y-.08,7.9,1.5,23,PAL.greenLight,PAL.green,PAL.greenDark,21);
 const foods=['#d39a42','#f7c94b','#b86c3c','#94bd65','#dd6e52','#a77d4e'];
 for(let i=0;i<6;i++)box(3.2+i*1.2,4.0,.70,.48,.65,foods[i],'#c4aa89','#a3885e',44);
 for(let s of [-2.6,-.7,1.2,3.1]){const q=iso(x+s,y+.2,55);const r=iso(x+s,y+.2,31);line(q,r,'#c2eaf2',1.5)}
 const stools=[4.8,6.3,7.8];
 for(let i=0;i<stools.length;i++){
  box(stools[i],6.3,.72,.8,6,PAL.green,PAL.greenDark,PAL.greenDark);
 }
 if(occupied)drawHuman(occupied.x,occupied.y,{sitting:true,dir:'nw'});
 // Foreground bar edge is ALWAYS rendered above the seated avatar.
 box(6.3,4.95,7.7,.20,30,PAL.green,PAL.greenDark,PAL.greenDark);
}
function drawWarteg(occupied){
 drawWalls('warteg');drawFloor('warteg');
 paintFurniture('warteg','warteg-plant',1.4,2.4,()=>drawPlant(1.4,2.4,.8));
 paintFurniture('warteg','warteg-sign',3,3,()=>box(3,3,1.35,.7,29,PAL.cream,PAL.wallSide,PAL.grey));
 for(let i=0;i<2;i++){
   const cx=3.6+i*4.9;
   paintFurniture('warteg','warteg-table-'+(i===0?'a':'b'),cx,8.1,()=>{
     box(cx,8.1,2.5,1.4,9,PAL.green,PAL.greenDark,PAL.greenDark);
     // The attached small benches remain decorative and move with their table.
     for(const sign of [-1,1])box(cx,8.1+sign*.85,1.8,.43,5,PAL.green,PAL.greenDark,PAL.greenDark);
   });
 }
 paintFurniture('warteg','warteg-bar',6.3,4.1,(dx,dy)=>{
   const sitter=occupied&&/^bar[012]$/.test(occupied.seatId||'')
    ?{...occupied,x:occupied.x-dx,y:occupied.y-dy}:null;
   drawBar(sitter);
 });
}
function drawPark(occupied,frame){
 drawWalls('street');drawFloor('street');
 for(let i=0;i<4;i++){
   const c=2+i*3.4;
   paintFurniture('street','street-plant-'+i,c,1.7,()=>drawPlant(c,1.7,i===1?1.1:.7));
 }
 for(let i=0;i<2;i++){
   const bx=5+i*5;
   paintFurniture('street','street-bench-'+i,bx,6.4,(dx,dy)=>{
     box(bx,6.4,3.4,.82,8,PAL.woodLight,PAL.wood,PAL.woodDark);
     box(bx,5.95,3.4,.20,21,PAL.woodLight,PAL.wood,PAL.woodDark);
     if(occupied&&occupied.seatId==='bench'+i)
       drawHuman(occupied.x-dx,occupied.y-dy,{sitting:true,dir:'sw'});
     box(bx,6.78,3.4,.12,9,PAL.woodLight,PAL.wood,PAL.woodDark);
   });
 }
 paintFurniture('street','street-warteg',11.4,3.9,()=>{
   box(11.4,3.9,2.8,2.0,22,PAL.wallLight,PAL.wall,PAL.wallSide);
   box(11.4,3.9,3.5,2.6,1,PAL.green,PAL.greenDark,PAL.greenDark,22);
   const p=iso(11.4,3.2,39);
   pixelText('WARTEG',p.x,p.y,'#ffe4a1',12);
 });
 paintFurniture('street','street-props-a',8.15,9.4,()=>{
   box(8,9.5,1.4,.8,7,'#c4d4d0','#608cba','#5796c6');
   box(8.3,9.4,.6,.8,12,'#4d6ea0','#42689b','#3b658f',7);
 });
 paintFurniture('street','street-lounger',13.2,8.8,(dx,dy)=>{
   box(13.2,8.8,2.4,1,7,'#f4e8d5','#b3a68b','#b8a689');
   box(13.2,8.35,2.4,.28,14,'#f3e7d1','#baa992','#a89d87');
   if(occupied&&occupied.seatId==='lounger')
     drawHuman(occupied.x-dx,occupied.y-dy,{lying:true,dir:'se'});
   box(13.2,9.28,2.4,.12,8,'#f6eddc','#c0b39b','#b9ac95');
 });
}
function resize(){
 const box=view.getBoundingClientRect();
 W=Math.max(180,Math.floor(box.width*DPR));H=Math.max(180,Math.floor(box.height*DPR));
 C.width=W;C.height=H;g.imageSmoothingEnabled=false;
 if(!manualZoom)zoom=clamp(box.width/480,.70,.94);
}
window.addEventListener('resize',resize,{passive:true});resize();

const STORAGE='vo-editable-rebuild-v1';
const defaults={fullness:87,energy:86,hygiene:91,bladder:15};
const player={x:7.25,y:9.25,zone:'office',dir:'sw',seatId:null,sitX:null,moveTarget:null,walk:0,run:false};
const coveWorld=new window.VOModular.ModularWorld();
const sceneWorlds=window.VOBuildScenes.makeWorlds();
const getEditWorld=zone=>zone==='cove'?coveWorld:sceneWorlds[zone];
let coveEditor=null;
let needs={...defaults},wallet=125000,events=[],timeMinutes=8*60+15;
try{
 const o=JSON.parse(localStorage.getItem(STORAGE)||'null');
 if(o&&o.version===1){if(o.needs)for(const k in defaults)needs[k]=clamp(+o.needs[k]||0,0,100);
  if(Number.isFinite(o.wallet))wallet=o.wallet;
  if(Number.isFinite(o.timeMinutes))timeMinutes=o.timeMinutes;
  if(Array.isArray(o.events))events=o.events.slice(0,25);
  if(['office','street','warteg','cove'].includes(o.zone))player.zone=o.zone;
 }
}catch(e){}
function save(){try{localStorage.setItem(STORAGE,JSON.stringify({version:1,needs,wallet,timeMinutes,zone:player.zone,events:events.slice(0,25)}))}catch(e){}}
window.addEventListener('pagehide',save);window.setInterval(save,5000);
function addLog(msg){
 events.unshift({t:new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}),text:msg});
 events=events.slice(0,35);renderFeed();save();
}
function notice(msg){
 toastEl.textContent=msg;toastEl.classList.add('on');
 clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastEl.classList.remove('on'),2500);
}
function renderFeed(){
 $('feed').innerHTML=events.length?events.slice(0,18).map(e=>'<div class="feed-entry"><time>'+e.t+'</time>'+String(e.text).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))+'</div>').join(''):
 '<div class="feed-entry">Selamat datang! Eksplor office, taman, dan warteg. Dekati objek lalu tekan ACTION.</div>';
}
function setZone(zone){
 if(!['office','street','warteg','cove'].includes(zone))return;
 stand();player.zone=zone;player.moveTarget=null;
 Object.assign(player,zone==='office'?{x:7.25,y:9.25}:zone==='street'?{x:8.2,y:8.5}:zone==='warteg'?{x:7.1,y:8.8}:{x:4.5,y:9.15});
 $('locationChip').textContent=zone==='office'?'🏢 OFFICE':zone==='street'?'🌳 TAMAN':zone==='warteg'?'🍛 WARTEG':'🛏️ COVE ROOM';
 $('playerPlace').textContent=zone==='office'?'Pegawai kantor · Local test':zone==='street'?'Taman kota · Local test':zone==='warteg'?'Warteg · Local test':'Cove Bedroom + Bathroom';
 $('zoneSwitch').hidden=true;if(coveEditor)coveEditor.changeZone(getEditWorld(zone));addLog('📍 Berpindah ke '+(zone==='office'?'Office':zone==='street'?'Taman':zone==='warteg'?'Warteg':'Cove Room'));
 notice('AREA: '+zone.toUpperCase());
}
function stand(){
 // Exit the occupied module at its walkable approach anchor.
 // Without this, the character would stand inside a bed/bathtub collider.
 const id=player.seatId;
 if(id&&player.zone==='cove'){
   const a=coveWorld.get(id),approach=a?.action?.approach;
   if(a&&approach){
     const x=a.at.x+approach.x,y=a.at.y+approach.y;
     if(!coveWorld.blocked(x,y)){
       player.x=x;player.y=y;
     }else{
       // Prefer an open adjacent tile if another moved object blocks approach.
       const offsets=[[0,.6],[.6,0],[-.6,0],[0,-.6],[1,1],[-1,1],[1,-1],[-1,-1]];
       const free=offsets.map(([dx,dy])=>({x:x+dx,y:y+dy})).find(v=>!coveWorld.blocked(v.x,v.y));
       if(free){player.x=free.x;player.y=free.y}
     }
   }
 }
 player.seatId=null;player.sitX=null;
}
function near(p,x,y,range=1.7){return Math.hypot(p.x-x,p.y-y)<=range;}
const spots={
 office:[
  {x:7.5,y:7.5,r:1.9,id:'sofa',label:'DUDUK',type:'sit',seatX:7.45,seatY:6.35},
  {x:8.8,y:7.55,r:1.9,id:'sofa',label:'DUDUK',type:'sit',seatX:8.68,seatY:6.35},
  {x:12,y:5.5,r:2.0,id:'desk',label:'KERJA',type:'work'},
  {x:14.5,y:8.8,r:1.8,id:'officechair',label:'DUDUK',type:'sit',seatX:14.4,seatY:9.1},
  {x:8.1,y:6.4,r:1.5,id:'migi',label:'PET',type:'pet'},
  {x:16.1,y:10.8,r:1.5,id:'toilet',label:'PIPIS',type:'pee'},
  {x:16.2,y:8.8,r:1.4,id:'shower',label:'MANDI',type:'shower'},
  {x:16.7,y:12.0,r:1.6,id:'door',label:'KELUAR',type:'zone',to:'street'}
 ],
 street:[
  {x:5.1,y:7.6,r:2.0,id:'bench0',label:'DUDUK',type:'sit',seatX:5.0,seatY:6.4},
  {x:10.2,y:7.6,r:2.0,id:'bench1',label:'DUDUK',type:'sit',seatX:10,seatY:6.4},
  {x:13.2,y:9.6,r:1.5,id:'lounger',label:'REBAH',type:'lie',seatX:13.2,seatY:8.8},
  {x:11.8,y:5.5,r:2.7,id:'warteg-door',label:'MASUK',type:'zone',to:'warteg'},
  {x:3.2,y:10,r:2.0,id:'office-door',label:'OFFICE',type:'zone',to:'office'}
 ],
 warteg:[
  {x:4.8,y:6.9,r:1.9,id:'bar0',label:'DUDUK',type:'sit',seatX:4.8,seatY:6.25},
  {x:6.3,y:6.9,r:1.9,id:'bar1',label:'DUDUK',type:'sit',seatX:6.3,seatY:6.25},
  {x:7.8,y:6.9,r:1.9,id:'bar2',label:'DUDUK',type:'sit',seatX:7.8,seatY:6.25},
  {x:6.7,y:5.15,r:2.3,id:'food',label:'PESAN',type:'eat'},
  {x:9.25,y:5.8,r:1.5,id:'drink',label:'MINUM',type:'drink'},
  {x:10,y:9.8,r:1.9,id:'exit',label:'KELUAR',type:'zone',to:'street'}
 ]
};
// Reuse the existing Action spots while furniture moves in Build Mode.
// The action point and occupied seat are shifted with the corresponding object.
const actionOwner={
 office:{sofa:'office-sofa',desk:'office-desk-a',officechair:'office-chair',
   migi:'office-sofa',toilet:'office-toilet',shower:'office-shower'},
 street:{bench0:'street-bench-0',bench1:'street-bench-1',lounger:'street-lounger',
   'warteg-door':'street-warteg'},
 warteg:{bar0:'warteg-bar',bar1:'warteg-bar',bar2:'warteg-bar',
   food:'warteg-bar',drink:'warteg-bar'}
};
function adjustedActionSpot(zone,spot){
 const id=actionOwner[zone]?.[spot.id];
 if(!id)return spot;
 const world=sceneWorlds[zone],asset=world.get(id);
 const base=world.defaultAssets.find(a=>a.id===id);
 if(!asset||!asset.visible||!base)return {...spot,r:0};
 const dx=asset.at.x-base.at.x,dy=asset.at.y-base.at.y;
 return {...spot,x:spot.x+dx,y:spot.y+dy,
   seatX:Number.isFinite(spot.seatX)?spot.seatX+dx:undefined,
   seatY:Number.isFinite(spot.seatY)?spot.seatY+dy:undefined};
}
function paintFurniture(zone,id,baseX,baseY,fn){
 const world=sceneWorlds[zone],item=world?.get(id),base=world?.defaultAssets.find(a=>a.id===id);
 if(!item||!item.visible)return;
 const deltaX=item.at.x-(base?.at.x??baseX),deltaY=item.at.y-(base?.at.y??baseY);
 g.save();
 g.translate(Math.round((deltaX-deltaY)*TX*zoom+item.offset.x*zoom),
   Math.round((deltaX+deltaY)*TY*zoom+item.offset.y*zoom));
 fn(deltaX,deltaY);g.restore();
}
function currentAction(){
 if(player.seatId)return {type:'stand',label:'BANGUN'};
 if(player.zone==='cove')return coveWorld.nearestAction(player)||{type:'fart',label:'KENTUT'};
 let nearest=null,dmin=Infinity;
 for(const spot of spots[player.zone]){
  const dSpot=adjustedActionSpot(player.zone,spot);
  if(dSpot.r<=0)continue;
  const d=Math.hypot(player.x-dSpot.x,player.y-dSpot.y);
  if(d<=spot.r&&d<dmin){nearest=dSpot;dmin=d}
 }
 if(nearest)return nearest;
 return {type:'fart',label:'KENTUT'};
}
function pressAction(){
 if(coveEditor?.active)return;
 const a=currentAction();
 if(a.type==='stand'){stand();notice('Berdiri');return}
 if(['sit','lie','sleep','bathe'].includes(a.type)){
    player.seatId=a.id;player.sitX={x:a.seatX,y:a.seatY};player.x=a.seatX;player.y=a.seatY;
    player.moveTarget=null;player.dir=player.zone==='warteg'?'nw':'sw';
    if(a.type==='bathe'){needs.hygiene=100;addLog('🛁 Mandi di bathtub · Kebersihan 100');notice('🛁 BERSIH')}
    else if(a.type==='sleep'){addLog('🛏️ Tidur di kasur · energi pulih selama tidur');notice('💤 TIDUR')}
    else addLog(a.type==='lie'?'💤 Rebahan di kursi taman.':'🪑 Duduk di '+(player.zone==='cove'?'Cove Room':player.zone==='warteg'?'bangku depan etalase':player.zone==='office'?'sofa / kursi kantor':'bangku taman'));
    return
 }
 if(a.type==='eat'){if(wallet<12000)return notice('Uang tidak cukup');wallet-=12000;needs.fullness=clamp(needs.fullness+40,0,100);needs.bladder=clamp(needs.bladder+4,0,100);addLog('🍛 Makan nasi kuning · -Rp12.000 · Kenyang +40');notice('🍛 MAKAN +40');return}
 if(a.type==='drink'){needs.bladder=clamp(needs.bladder+15,0,100);addLog('🥤 Minum es teh · Kebelet +15');notice('🥤 MINUM');return}
 if(a.type==='pee'){
    if(player.zone==='cove'){
      player.seatId=a.id;player.sitX={x:a.seatX,y:a.seatY};
      player.x=a.seatX;player.y=a.seatY;player.moveTarget=null
    }
    needs.bladder=0;needs.hygiene=clamp(needs.hygiene-3,0,100);
    addLog('🚽 Pipis di toilet · Kebelet kembali nol');notice('🚽 LEGA');return
 }
 if(a.type==='shower'){needs.hygiene=100;addLog('🚿 Mandi · Kebersihan pulih ke 100');notice('🚿 BERSIH');return}
 if(a.type==='pet'){addLog('🐈 Kamu mengelus Migi.');notice('MIGI: PURRR 🐈');return}
 if(a.type==='work'){wallet+=45000;needs.energy=clamp(needs.energy-4,0,100);needs.hygiene=clamp(needs.hygiene-2,0,100);addLog('💻 Selesai satu tugas kantor · +Rp45.000');notice('GAJI +45.000');return}
 if(a.type==='zone')return setZone(a.to);
 if(a.type==='fart'){needs.hygiene=clamp(needs.hygiene-2,0,100);notice('💨 PFFT!');addLog('💨 Kentut sembarangan.')}
}
action.addEventListener('click',pressAction);
const NEEDS=[
 {kind:'fullness',label:'🍚 Kenyang',hint:'Makan nasi kuning di warteg.'},
 {kind:'energy',label:'💤 Energi',hint:'Duduk atau rebahan di kursi taman untuk istirahat.'},
 {kind:'hygiene',label:'🧼 Kebersihan',hint:'Mandi di sudut kamar mandi office.'},
 {kind:'bladder',label:'🚽 Kebelet',hint:'Semakin tinggi berarti ingin pipis. Cari toilet office.'}
];
$('needs').innerHTML=NEEDS.map(n=>'<div class="need-row" data-kind="'+n.kind+'"><div class="need-head"><span>'+n.label+'</span><output>—</output></div><div class="need-track"><div class="need-fill"></div></div><div class="need-hint">'+n.hint+'</div></div>').join('');
function renderNeeds(){
 for(const item of NEEDS){
  const val=clamp(Math.round(needs[item.kind]),0,100),row=document.querySelector('.need-row[data-kind="'+item.kind+'"]');
  row.querySelector('output').textContent=val+' / 100';row.querySelector('.need-fill').style.width=val+'%';
  row.classList.toggle('crit',item.kind==='bladder'?val>=90:val<=10);
  row.classList.toggle('warn',item.kind==='bladder'?val>=70&&val<90:val<=30&&val>10);
 }
 let status='Status stabil. Eksplor map untuk mencoba interaksi.';
 if(needs.bladder>=90)status='⚠️ Kebelet sekali! Cari toilet di Office.';
 else if(needs.energy<20)status='⚠️ Energi rendah. Coba duduk sebentar.';
 else if(needs.fullness<25)status='⚠️ Lapar! Pesan makanan di warteg.';
 $('statusMessage').textContent=status;
}
function switchTab(tab){
 const status=tab==='status';
 $('tabStatus').classList.toggle('active',status);$('tabNotifications').classList.toggle('active',!status);
 $('tabStatus').setAttribute('aria-selected',String(status));
 $('tabNotifications').setAttribute('aria-selected',String(!status));
 $('statusContent').hidden=!status;$('notifContent').hidden=status;
 if(status)renderNeeds();
}
$('btnNotif').addEventListener('click',()=>{$('drawer').hidden=!$('drawer').hidden;$('zoneSwitch').hidden=true;});
$('closeDrawer').addEventListener('click',()=>{$('drawer').hidden=true});
$('tabNotifications').addEventListener('click',()=>switchTab('notif'));
$('tabStatus').addEventListener('click',()=>switchTab('status'));
$('btnMap').addEventListener('click',()=>{if(coveEditor?.active)return;$('zoneSwitch').hidden=!$('zoneSwitch').hidden;$('drawer').hidden=true});
document.querySelectorAll('[data-zone]').forEach(b=>b.addEventListener('click',()=>setZone(b.dataset.zone)));
$('btnZoomIn').addEventListener('click',()=>{manualZoom=true;zoom=clamp(zoom+.12,.55,1.50)});
$('btnZoomOut').addEventListener('click',()=>{manualZoom=true;zoom=clamp(zoom-.12,.55,1.50)});
$('btnFit').addEventListener('click',()=>{manualZoom=false;zoom=clamp(view.getBoundingClientRect().width/480,.70,.94);notice('Kamera dipusatkan')});
const keys=new Set();let joy={x:0,y:0,pointer:null};const joystick=$('joystick'),knob=$('joyKnob');
const resetJoy=()=>{joy.x=0;joy.y=0;joy.pointer=null;knob.style.left='50%';knob.style.top='50%'};
function adjustJoy(e){
 const r=joystick.getBoundingClientRect(),x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2);
 let mag=Math.hypot(x,y),max=r.width*.31,v=mag>max?max/mag:1;joy.x=clamp(x*v/max,-1,1);joy.y=clamp(y*v/max,-1,1);
 knob.style.left=(50+joy.x*30)+'%';knob.style.top=(50+joy.y*30)+'%';
}
joystick.addEventListener('pointerdown',e=>{e.preventDefault();joy.pointer=e.pointerId;joystick.setPointerCapture(e.pointerId);adjustJoy(e)});
joystick.addEventListener('pointermove',e=>{if(joy.pointer===e.pointerId)adjustJoy(e)});
for(const n of ['pointerup','pointercancel','lostpointercapture'])joystick.addEventListener(n,e=>{if(joy.pointer===e.pointerId)resetJoy()});
window.addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();
 if(coveEditor?.active){if(k==='escape'){e.preventDefault();coveEditor.close(false)}return;}if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','shift',' ','enter'].includes(k)){e.preventDefault();keys.add(k)}
 if((k===' '||k==='enter')&&!e.repeat&&$('drawer').hidden&&$('zoneSwitch').hidden)pressAction();
 if(k==='escape'){$('drawer').hidden=true;$('zoneSwitch').hidden=true}
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
const covePointer=e=>{
 const r=C.getBoundingClientRect();
 return {x:(e.clientX-r.left)*DPR,y:(e.clientY-r.top)*DPR};
};
C.addEventListener('pointerdown',e=>{
 if(coveEditor?.active){
   coveEditor.pointerDown(e);
   if(C.setPointerCapture)C.setPointerCapture(e.pointerId);
 }
});
C.addEventListener('pointermove',e=>{
 if(coveEditor?.active)coveEditor.pointerMove(e);
});
C.addEventListener('pointercancel',e=>{
 if(coveEditor?.active)coveEditor.pointerUp(e);
});
C.addEventListener('pointerup',e=>{
 if(coveEditor?.active){coveEditor.pointerUp(e);e.preventDefault();return}
 if(e.pointerType==='mouse'&&e.button!==0)return;
 const rect=C.getBoundingClientRect(),cx=(e.clientX-rect.left)*DPR,cy=(e.clientY-rect.top)*DPR;
 const a=(cx-ox)/(TX*zoom),b=(cy-oy)/(TY*zoom);
 const x=(a+b)/2,y=(b-a)/2;
 const limit=player.zone==='office'?[18,13]:player.zone==='warteg'?[12,11]:player.zone==='cove'?[16,11]:[16,13];
 if(x>=.3&&x<limit[0]-.3&&y>=.3&&y<limit[1]-.3){player.moveTarget={x,y};if(player.seatId)stand();}
});
function update(dt){
 if(coveEditor?.active){action.textContent='EDIT';return}
 const v={x:joy.x,y:joy.y};
 if(keys.has('w')||keys.has('arrowup'))v.y-=1;
 if(keys.has('s')||keys.has('arrowdown'))v.y+=1;
 if(keys.has('a')||keys.has('arrowleft'))v.x-=1;
 if(keys.has('d')||keys.has('arrowright'))v.x+=1;
 let dx=0,dy=0;
 if(Math.hypot(v.x,v.y)>.15){
  dx=v.x/(TX*zoom)+v.y/(TY*zoom);dy=v.y/(TY*zoom)-v.x/(TX*zoom);
  let m=Math.hypot(dx,dy);dx/=m;dy/=m;player.moveTarget=null;
 }else if(player.moveTarget){
  dx=player.moveTarget.x-player.x;dy=player.moveTarget.y-player.y;
  const m=Math.hypot(dx,dy);if(m<.07){dx=dy=0;player.moveTarget=null}else{dx/=m;dy/=m}
 }
 if(dx||dy){
  if(player.seatId)stand();
  let speed=(keys.has('shift')?4.5:2.5);
  const limit=player.zone==='office'?[18,13]:player.zone==='warteg'?[12,11]:player.zone==='cove'?[16,11]:[16,13];
  const nx=clamp(player.x+dx*speed*dt,.35,limit[0]-.35);
  const ny=clamp(player.y+dy*speed*dt,.35,limit[1]-.35);
  if(player.zone!=='cove'||!coveWorld.blocked(nx,player.y))player.x=nx;
  if(player.zone!=='cove'||!coveWorld.blocked(player.x,ny))player.y=ny;
  player.dir=(dx-dy)>=0?'se':'sw';player.walk+=dt*speed;
 }
 const gameMinutes=dt*0.6; timeMinutes+=gameMinutes;
 needs.fullness=clamp(needs.fullness-gameMinutes*(10/15),0,100);
 needs.hygiene=clamp(needs.hygiene-gameMinutes*(5/15)-(dx||dy?dt*.06:0),0,100);
 needs.bladder=clamp(needs.bladder+gameMinutes*(20/15),0,100);
 const seated=!!player.seatId;
 needs.energy=clamp(needs.energy+dt*(seated?(['lounger','cove-bed'].includes(player.seatId)?9:.8):-.26)-(dx||dy?dt*.14:0),0,100);
 if(needs.bladder>=100){needs.bladder=5;needs.hygiene=clamp(needs.hygiene-30,0,100);addLog('⚠️ Terlalu kebelet! Karakter ngompol. Kebersihan -30');notice('⚠️ NGOMPOL')}
 const a=currentAction();action.textContent=a.label;
 if(Math.floor(now/1000)!==Math.floor((now-dt*1000)/1000))renderNeeds();
}
const objects=[];
function draw(frame){
 g.fillStyle='#B6DDF3';g.fillRect(0,0,W,H);
 // Composite camera: keep the character visible while showing more of the room.
 const limits=player.zone==='office'?[18,13]:player.zone==='warteg'?[12,11]:player.zone==='cove'?[16,11]:[16,13];
 const cameraX=player.x*.62+(limits[0]/2)*.38;
 const cameraY=player.y*.62+(limits[1]/2)*.38;
 ox=W*.51-(cameraX-cameraY)*TX*zoom;
 oy=H*.54-(cameraX+cameraY)*TY*zoom;
 objects.length=0;
 const seated=player.seatId?{x:player.x,y:player.y,seatId:player.seatId}:null;
 if(player.zone==='cove'){
   const api={ctx:g,iso,box,line,diamond,poly,drawPlant,shadow,drawHuman,pixelText,zoom,
     drawPlaceholder:(a,part)=>window.VOCoveScene.drawAsset(api,a,part),
     drawPlayer:()=>drawHuman(player.x,player.y,{
       lying:player.seatId==='cove-bed',
       sitting:!!player.seatId&&player.seatId!=='cove-bed',
       shirt:player.seatId==='cove-bath'?'#dcb492':'#242a3a',
       hair:'#171b24',dir:player.dir,walk:player.walk
     })};
   window.VOCoveScene.drawFloor(api);
   coveWorld.render(api,player);
   if(coveEditor)coveEditor.overlay(api);
   return;
 }
 if(player.zone==='office')drawOffice(player.x,player.y,seated,frame);
 else if(player.zone==='warteg')drawWarteg(seated);
 else drawPark(seated,frame);
 objects.sort((a,b)=>a.d-b.d);
 const actorDepth=player.x+player.y;
 let drewActor=false;
 const drawNormalActor=()=>{
  if(!player.seatId){
   drawHuman(player.x,player.y,{dir:player.dir,walk:player.walk,shirt:'#242a3a',hair:'#171b24'});
   drewActor=true;
  } else if(player.seatId==='officechair'){
   drawHuman(player.x,player.y,{sitting:true,dir:'sw',shirt:'#242a3a',hair:'#171b24'});drewActor=true;
  }
 };
 for(const o of objects){if(!drewActor&&!player.seatId&&actorDepth<o.d)drawNormalActor();o.fn();}
 if(!drewActor)drawNormalActor();
 // Avoid floating name labels overlapping furniture in tight mobile framing.
 // draw zone indicator as world label
 if(player.zone==='warteg'){const p=iso(5,0,75);pixelText('BU WARTEG',p.x,p.y,'#ffe4a4',12)}
 // Clock moved out of the canvas to prevent overlap with the location label.
 if(coveEditor?.active)coveEditor.overlay({ctx:g,iso,zoom});
}
function frame(t){
 const dt=clamp((t-now)/1000,0,.06);now=t;
 update(dt);draw(t*.001);requestAnimationFrame(frame);
}
// Initialize the editor once after all gameplay hooks are set up.
coveEditor=window.VOModularEditor.createEditor(getEditWorld(player.zone),{
 getZone:()=>player.zone,
 getProject:()=>Object.assign((x,y,z=0)=>iso(x,y,z),{zoom}),
 pointerPosition:covePointer,
 onState:on=>{player.moveTarget=null;keys.clear();resetJoy();
   $('drawer').hidden=true;$('zoneSwitch').hidden=true;}
});
renderFeed();renderNeeds();$('playerName').textContent='PLAYER';$('locationChip').textContent=player.zone==='office'?'🏢 OFFICE':player.zone==='street'?'🌳 TAMAN':player.zone==='warteg'?'🍛 WARTEG':'🛏️ COVE ROOM';
$('playerPlace').textContent=player.zone==='office'?'Pegawai kantor · Local test':player.zone==='street'?'Taman kota · Local test':player.zone==='warteg'?'Warteg · Local test':'Cove Bedroom + Bathroom';
addLog('✨ Editable Rebuild 01 siap dimainkan. Source mandiri, tanpa aset terenkripsi.');
requestAnimationFrame(frame);
})();