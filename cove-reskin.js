(function coveModule(){
'use strict';
if(window.__coveAddon)return;
window.__coveAddon=true;
const SHEET='assets/chars/reference_man_sheet.png';
const sprite=new Image();sprite.src=SHEET;sprite.decoding='async';
const player={x:7.5,y:7.7,dir:'sw',step:0,mode:null,target:null};
const objects=[
 {id:'bed',x:4,y:5.65,range:2.1,label:'SLEEP'},
 {id:'tub',x:11.25,y:4.65,range:2.15,label:'BATHE'},
 {id:'toilet',x:13.55,y:8.1,range:1.65,label:'USE TOILET'},
 {id:'desk',x:6.4,y:2.7,range:1.65,label:'WORK'}
];
const overlay=document.createElement('section');overlay.id='cove-game-overlay';overlay.hidden=true;
overlay.innerHTML='<header><div><b>⌂ COVE ROOM</b><small>BEDROOM + BATHROOM · GROK SYSTEM</small></div><div><button id="cove-interact">ACTION</button><button id="cove-leave">← EXIT</button></div></header><canvas id="cove-canvas" aria-label="Playable isometric Cove Room"></canvas><div id="cove-status" role="status">Move close to furniture · press Action</div><div class="cove-touch"><div id="cove-dpad"><button data-d="up">▲</button><button data-d="left">◀</button><button data-d="down">▼</button><button data-d="right">▶</button></div><span>WASD / ARROW KEYS<br>TAP FLOOR TO WALK</span></div>';
const css=document.createElement('style');
css.textContent=`
#cove-launch{position:fixed;right:16px;bottom:92px;z-index:999;background:#e7c18b;color:#263746;border:2px solid #253747;box-shadow:3px 3px #253747;padding:12px 14px;font:bold 12px monospace;cursor:pointer}
#cove-launch[hidden],#cove-game-overlay[hidden]{display:none!important}
#cove-game-overlay{position:fixed;inset:0;z-index:2147483000;background:#b1ddf5;display:flex;flex-direction:column;font:12px monospace;color:#28384b;touch-action:none}
#cove-game-overlay *{box-sizing:border-box}#cove-game-overlay header{height:63px;flex:none;display:flex;align-items:center;justify-content:space-between;gap:10px;background:#f1e6d0;border-bottom:3px solid #c0ae8c;padding:7px 13px}
#cove-game-overlay header b{display:block;font-size:16px;letter-spacing:1px}#cove-game-overlay header small{display:block;font-size:9px;letter-spacing:1px;margin-top:3px}
#cove-game-overlay button{border:2px solid #283a50;background:#fff4df;padding:8px;color:#263747;font:bold 11px monospace;cursor:pointer;box-shadow:2px 2px #283a50}
#cove-game-overlay #cove-interact{background:#e8c283}#cove-game-overlay canvas{display:block;width:100%;height:100%;flex:1;min-height:0;touch-action:none}
#cove-game-overlay #cove-status{position:absolute;left:50%;top:77px;transform:translateX(-50%);background:#fff8e7d9;padding:7px 12px;text-align:center;max-width:80%;border:1px solid #b9c5c4}
#cove-game-overlay .cove-touch{position:absolute;left:17px;right:17px;bottom:16px;display:flex;justify-content:space-between;align-items:flex-end;pointer-events:none}
#cove-game-overlay .cove-touch>*{pointer-events:auto}#cove-game-overlay .cove-touch span{background:#d7e7eac9;font-size:9px;padding:6px;text-align:right;line-height:1.5}
#cove-game-overlay #cove-dpad{display:grid;grid-template-columns:repeat(3,39px);grid-template-rows:repeat(3,34px);gap:2px}
#cove-game-overlay #cove-dpad button{padding:0;touch-action:none;user-select:none;font-size:14px}
#cove-game-overlay #cove-dpad [data-d=up]{grid-area:1/2}#cove-game-overlay #cove-dpad [data-d=left]{grid-area:2/1}#cove-game-overlay #cove-dpad [data-d=down]{grid-area:3/2}#cove-game-overlay #cove-dpad [data-d=right]{grid-area:2/3}
@media(max-width:570px){#cove-game-overlay header{height:52px}#cove-game-overlay header b{font-size:13px}#cove-game-overlay header small{font-size:8px}#cove-game-overlay header button{font-size:9px;padding:5px}}
`;
document.head.appendChild(css);document.body.appendChild(overlay);
const launch=document.createElement('button');launch.id='cove-launch';launch.hidden=true;launch.textContent='⌂ COVE ROOM';document.body.appendChild(launch);
const canvas=overlay.querySelector('#cove-canvas'),ctx=canvas.getContext('2d'),status=overlay.querySelector('#cove-status'),action=overlay.querySelector('#cove-interact');
let open=false,raf=0,last=0,moving=false,joy={dx:0,dy:0};const keys=new Set();
const loggedIn=()=>!!(window.__mp&&window.__mp.status==='live'&&window.__mp.me);
const showEntry=()=>{launch.hidden=open||!loggedIn()};
setInterval(showEntry,1250);showEntry();
function projection(x,y,z=0){return {x:32*(x-y),y:16*(x+y)-z}}
function polygon(vertices,color,outline=null,width=1){
 ctx.beginPath();vertices.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=color;ctx.fill();
 if(outline){ctx.strokeStyle=outline;ctx.lineWidth=width;ctx.stroke()}
}
function cube(x,y,w,d,h,top,left,right,z=0){
 const a=projection(x-w/2,y-d/2,z),b=projection(x+w/2,y-d/2,z),c=projection(x+w/2,y+d/2,z),e=projection(x-w/2,y+d/2,z);
 const A=projection(x-w/2,y-d/2,z+h),B=projection(x+w/2,y-d/2,z+h),C=projection(x+w/2,y+d/2,z+h),E=projection(x-w/2,y+d/2,z+h);
 polygon([E,C,c,e],left);polygon([B,C,c,b],right);polygon([A,B,C,E],top);
}
function ellipse(x,y,rx,ry,color){const p=projection(x,y);ctx.beginPath();ctx.ellipse(p.x,p.y,rx,ry,0,0,7);ctx.fillStyle=color;ctx.fill()}
function plant(x,y){
 cube(x,y,.6,.5,18,'#e7dec8','#c7ac8b','#bca588');
 const p=projection(x,y,36);ctx.strokeStyle='#547963';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x,p.y+12);ctx.lineTo(p.x,p.y-12);ctx.stroke();
 for(let i=0;i<6;i++){const xx=p.x+Math.sin(i*2.1)*13,yy=p.y+Math.cos(i*2.1)*12-5;ctx.fillStyle=i%2?'#6b9981':'#92b496';ctx.beginPath();ctx.ellipse(xx,yy,11,5,i*.5,0,7);ctx.fill()}
}
function floor(){
 for(let y=0;y<11;y++)for(let x=0;x<16;x++){
 const bath=x>=9,a=projection(x,y),b=projection(x+1,y),c=projection(x+1,y+1),d=projection(x,y+1);
 polygon([a,b,c,d],bath?(x+y)%2?'#ce8e73':'#d89a80':(x+y)%2?'#c3daf6':'#d6e6fa',bath?'#e6b69b':'#e9f1fb',.7);
 }
 polygon([projection(0,11),projection(16,11),projection(16,11,-14),projection(0,11,-14)],'#e8ddc8');
 polygon([projection(16,0),projection(16,11),projection(16,11,-14),projection(16,0,-14)],'#cdbda7');
}
function walls(){
 polygon([projection(0,0,96),projection(16,0,96),projection(16,0),projection(0,0)],'#e9dcc8');
 polygon([projection(0,0,96),projection(0,11,96),projection(0,11),projection(0,0)],'#f5ead9');
 polygon([projection(9,0),projection(9,0,96),projection(9,2.15,96),projection(9,2.15)],'#ddcdb6');
 polygon([projection(10,0,2),projection(13.5,0,2),projection(13.5,0,74),projection(10,0,74)],'#c28067');
 for(let z=10;z<75;z+=11){const a=projection(10,0,z),b=projection(13.5,0,z);ctx.strokeStyle='#dca18b';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
 polygon([projection(0,2,40),projection(0,5.25,40),projection(0,5.25,80),projection(0,2,80)],'#9cc9e0','#fff7dd',4);
 for(let i=0;i<6;i++){const a=projection(0,2.25+i*.5,42),b=projection(0,2.25+i*.5,79);ctx.strokeStyle='#fff2d9';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
 const p=projection(0,0,96),q=projection(16,0,96),r=projection(0,11,96);
 ctx.strokeStyle='#fff2d9';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.moveTo(p.x,p.y);ctx.lineTo(r.x,r.y);ctx.stroke();
}
function furniture(){
 cube(4.2,5.75,5.15,3.7,2,'#f1e3c8','#dfcead','#dac6a4');
 cube(3.95,5.45,3.65,2.6,13,'#b68153','#865735','#805334');
 cube(3.95,4.15,3.7,.22,29,'#c99361','#97643f','#905c35');
 cube(3.95,5.2,3.3,2.25,9,'#f7f7f1','#dbdfe2','#d3dce0',13);
 cube(3.95,5.85,3.25,1.5,3,'#6184bf','#456baa','#4b71ac',22);
 cube(3.1,4.65,.75,.66,4,'#f8f8ee','#d9e5eb','#dae1e8',24);
 cube(4.8,4.65,.75,.66,4,'#f6f7ee','#d3dfe4','#d4dce3',24);
 cube(4,5.12,.8,.55,4,'#365283','#2b3c65','#344c78',25);
 cube(1.4,6.1,1.25,.9,20,'#bc8656','#875a3b','#926443');
 cube(1.4,6.1,.56,.51,10,'#fff0c9','#edce98','#dabb88',22);
 cube(5.75,1.9,2.8,1.1,24,'#ba8b5b','#936741','#946943');
 cube(5.25,1.55,1.0,.68,3,'#313846','#202836','#283241',26);
 cube(5.25,1.38,1,.12,15,'#39404d','#1e2833','#273039',29);
 cube(6.85,2.8,.7,.7,12,'#c79a68','#ac7c50','#ab7749');
 cube(8.2,1.75,1.35,.9,32,'#bd8e62','#966842','#90603b');
 for(let i=0;i<3;i++)cube(8.2,1.8,1.18,.06,2,'#dec094','#b48d65','#b08a63',9+i*9);
 plant(8.95,3);
 cube(9.25,7.8,.25,1.6,56,'#c28d5a','#8d603d','#936541');
 // Shower hardware, teal tub and filled water.
 cube(11.25,4.2,3.25,1.9,26,'#88a28a','#63806c','#5b7864');
 cube(11.25,4.2,2.8,1.4,1,'#7ebdc8','#5e9bab','#6ea9b5',26);
 cube(11.25,3.64,1.9,.23,3,'#cda173','#aa7f53','#a57850',27);
 for(let y=5.8;y<7.2;y+=.3)for(let z=0;z<3;z++)cube(12.7,y,.15,.27,11,'#d3e7e6b9','#a9c9cdad','#b4d0d2ad',9+z*12);
 cube(14.35,3,2.0,1.2,28,'#b58458','#946841','#8e5e3b');
 cube(14.35,3,1.12,.78,3,'#a8c3aa','#729986','#68917e',29);
 polygon([projection(16,1.8,42),projection(16,3.7,42),projection(16,3.7,84),projection(16,1.8,84)],'#97bbc4','#947455',3);
 cube(13.6,8.0,1.25,1.1,17,'#ffffff','#d7e0e0','#cbdadb');
 cube(13.6,7.5,.98,.65,30,'#fafefb','#d9e1df','#d4e3e2');
 cube(13.6,8.4,.94,.6,3,'#f9fbfa','#e4ecea','#d4e3e0',17);
 plant(15,6.25);
}
function near(){return objects.map(a=>({...a,d:Math.hypot(a.x-player.x,a.y-player.y)})).filter(a=>a.d<a.range).sort((a,b)=>a.d-b.d)[0]}
function act(){if(player.mode){player.mode=null;return}const a=near();if(!a){status.textContent='Approach a bed, bathtub, toilet, or desk';return}player.mode=a.id;player.target=null;keys.clear();joy.dx=joy.dy=0;}
function blocked(x,y){return x<.5||y<.5||x>15.4||y>10.4||
 (x>2.1&&x<5.8&&y>4.15&&y<6.85)||(x>4.2&&x<7.7&&y<2.2)||
 (x>10&&x<12.9&&y>3.2&&y<5.1)||(x>13.3&&y>7.6&&y<8.9)}
function avatar(){
 let x=player.x,y=player.y,z=0;
 if(player.mode==='bed'){x=4;y=5.4;z=24}
 if(player.mode==='tub'){x=11.25;y=4.4;z=18}
 if(player.mode==='toilet'){x=13.55;y=8;z=18}
 if(player.mode==='desk'){x=6.6;y=2.45;z=8}
 const p=projection(x,y,z);ellipse(x,y,13,4,'#334b552a');
 if(sprite.complete&&sprite.naturalWidth===384){
 const row={se:0,sw:1,ne:2,nw:3}[player.dir]||0,col=moving?Math.floor(player.step*10)%6:0,s=.73;
 ctx.save();ctx.imageSmoothingEnabled=false;
 ctx.drawImage(sprite,col*64,row*112,64,112,p.x-32*s,p.y-100*s,64*s,112*s);
 ctx.restore();
 }else cube(x,y,.5,.5,35,'#303a48','#1d2735','#263448');
 if(player.mode==='bed')cube(4,5.82,2.8,1.1,3,'#6888c5','#496fae','#4b72b1',28);
 if(player.mode==='tub')cube(11.25,4.91,3.16,.35,25,'#89a991','#5d836e','#668870');
 if(player.mode==='toilet')cube(13.6,8.45,.98,.4,12,'#f4f8f7','#dce6e3','#dbe7e2');
}
function render(t){
 if(!open)return;
 const dt=Math.min(.05,(t-last)/1000||0);last=t;moving=false;
 let dx=joy.dx,dy=joy.dy;
 if(keys.has('d')||keys.has('ArrowRight'))dx+=1;
 if(keys.has('a')||keys.has('ArrowLeft'))dx-=1;
 if(keys.has('s')||keys.has('ArrowDown'))dy+=1;
 if(keys.has('w')||keys.has('ArrowUp'))dy-=1;
 if(Math.hypot(dx,dy)>.15){player.mode=null;player.target=null;if(Math.abs(dx)>=Math.abs(dy)){dx=Math.sign(dx);dy=0}else{dy=Math.sign(dy);dx=0}}
 else if(player.target){let dx0=player.target.x-player.x,dy0=player.target.y-player.y;if(Math.hypot(dx0,dy0)<.14)player.target=null;else if(Math.abs(dx0)>Math.abs(dy0)){dx=Math.sign(dx0);dy=0}else{dx=0;dy=Math.sign(dy0)}}
 if(dx||dy){const ox=player.x,oy=player.y,s=3*dt,xx=player.x+dx*s,yy=player.y+dy*s;
 if(!blocked(xx,player.y))player.x=xx;if(!blocked(player.x,yy))player.y=yy;
 moving=(ox!==player.x||oy!==player.y);if(moving){player.dir=dx>0?'se':dx<0?'nw':dy>0?'sw':'ne';player.step+=dt}else if(player.target)player.target=null;}
 const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,devicePixelRatio||1),w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#afd9f5';ctx.fillRect(0,0,w,h);
 const mobile=rect.width<750,scale=mobile?Math.max(.85,rect.width/440):Math.min(rect.width/1000,rect.height/670);
 const anchor=mobile?projection(player.x,player.y):{x:80,y:225};
 const offX=rect.width/2-anchor.x*scale,offY=(mobile?rect.height*.51:rect.height*.52)-anchor.y*scale;
 ctx.setTransform(dpr*scale,0,0,dpr*scale,offX*dpr,offY*dpr);
 floor();walls();furniture();avatar();
 const a=near();action.textContent=player.mode?'STAND':a?.label||'ACTION';
 status.textContent=player.mode?'Activity: '+player.mode.toUpperCase()+' · Press STAND':a?'Press ACTION: '+a.label:'Tap floor · approach bed / bathtub / toilet / desk';
 frameId=requestAnimationFrame(render);
}
let frameId=0;
function enter(){if(!loggedIn())return;open=true;overlay.hidden=false;last=performance.now();showEntry();frameId=requestAnimationFrame(render)}
function exit(){open=false;overlay.hidden=true;cancelAnimationFrame(frameId);keys.clear();joy.dx=joy.dy=0;showEntry()}
launch.addEventListener('click',enter);
overlay.querySelector('#cove-leave').addEventListener('click',exit);
action.addEventListener('click',act);
window.addEventListener('keydown',e=>{if(!open)return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','a','s','d','w',' '].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();if(e.key===' ')act();else keys.add(e.key)}if(e.key==='Escape')exit()},true);
window.addEventListener('keyup',e=>{if(open){keys.delete(e.key);e.stopImmediatePropagation();e.preventDefault()}},true);
for(const b of overlay.querySelectorAll('#cove-dpad button')){
 const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[b.dataset.d];
 b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);joy.dx=d[0];joy.dy=d[1]});
 for(const event of ['pointerup','pointercancel'])b.addEventListener(event,()=>{joy.dx=joy.dy=0});
}
canvas.addEventListener('pointerdown',e=>{
 const rect=canvas.getBoundingClientRect(),mobile=rect.width<750,scale=mobile?Math.max(.85,rect.width/440):Math.min(rect.width/1000,rect.height/670);
 const anchor=mobile?projection(player.x,player.y):{x:80,y:225},xOff=rect.width/2-anchor.x*scale,yOff=(mobile?rect.height*.51:rect.height*.52)-anchor.y*scale;
 const px=((e.clientX-rect.left)-xOff)/scale,py=((e.clientY-rect.top)-yOff)/scale;
 const x=(px/32+py/16)/2,y=(py/16-px/32)/2;
 if(x>.5&&x<15.4&&y>.5&&y<10.4){player.target={x,y};player.mode=null}
});
})();