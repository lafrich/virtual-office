/* V6B-style animated launcher previews. Canvas uses fixed low-res pixels and no smoothing. */
(function(){
'use strict';
const ROOT='https://lafrich.github.io/virtual-life-asset-pipeline/emotion-studio/preview-stock/';
const EMOTION=ROOT+'emotion-mw4xixfu-kqnhg6.emotion.json';
const ids=['semesta','jiwa','mahluk','emotion'];
const nodes=new Map();
const emotionImg=new Image();let emotionReady=false;
fetch(EMOTION).then(r=>{if(!r.ok)throw Error('not found');return r.json()}).then(data=>{
 const src=data.entries&&data.entries[0]&&data.entries[0].png;
 if(src&&src.startsWith('data:image/png;base64,')){emotionImg.onload=()=>emotionReady=true;emotionImg.src=src}
}).catch(()=>{});
function rect(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h))}
function ellipse(c,color,x,y,rx,ry){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()}
function globe(c,t){
 const cx=48,cy=47,r=35; ellipse(c,'#c1c9c8',48,86,35,5);
 ellipse(c,'#18354f',cx+2,cy+3,r+2,r+2);ellipse(c,'#2189c5',cx,cy,r,r);
 c.save();c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.clip();
 ellipse(c,'#69c9ee',34,28,12,21);
 const drift=t*10;
 const lands=[[[0,0],[17,-10],[24,-3],[21,9],[12,10],[8,22],[-3,13]],[[32,-23],[44,-19],[49,-5],[44,10],[35,8],[28,-6]],[[64,-18],[76,-8],[74,12],[64,26],[55,10]],[[93,-12],[103,-3],[102,20],[87,29],[80,6]]];
 for(const poly of lands){for(let copy=-1;copy<=1;copy++){c.beginPath();poly.forEach(([x,y],i)=>{const xx=((x-drift+160)%128)-16+copy*128,yy=cy+y;if(i===0)c.moveTo(xx,yy);else c.lineTo(xx,yy)});c.closePath();c.fillStyle='#5fbc77';c.fill();}}
 c.strokeStyle='#b0eeed';c.lineWidth=1;c.globalAlpha=.32;for(let i=-2;i<=2;i++){c.beginPath();c.ellipse(cx,cy,Math.abs((i+3)*6),r,0,0,Math.PI*2);c.stroke()}c.globalAlpha=1;
 ellipse(c,'#e2faff',36,23,10,3);ellipse(c,'#e2faff',59,61,13,3);c.restore();
}
function ghost(c,t){
 const y=42+Math.sin(t*2.6)*5,lean=Math.sin(t*1.5)*2;ellipse(c,'#cdd2d5',47,87,25,5);
 c.save();c.translate(lean,y-44);c.fillStyle='#effbff';c.beginPath();c.moveTo(24,71);c.lineTo(24,38);c.quadraticCurveTo(22,9,49,9);c.quadraticCurveTo(73,9,73,37);c.lineTo(73,70);c.quadraticCurveTo(64,60,58,72);c.quadraticCurveTo(48,60,40,73);c.quadraticCurveTo(30,62,24,71);c.fill();
 ellipse(c,'#b7dceb',39,39,3,5);ellipse(c,'#b7dceb',60,39,3,5);
 rect(c,'#263e5c',38,36,4,8);rect(c,'#263e5c',58,36,4,8);ellipse(c,'#6482a7',50,54,5,7);
 c.fillStyle='#e5f7ff';c.beginPath();c.moveTo(25,44);c.lineTo(12,52+Math.sin(t*3)*5);c.lineTo(13,59);c.lineTo(29,54);c.fill();c.beginPath();c.moveTo(72,45);c.lineTo(87,38+Math.cos(t*3)*5);c.lineTo(86,48);c.lineTo(71,57);c.fill();
 c.restore();rect(c,'#a9d5ef',15,17,5,2);rect(c,'#a9d5ef',80,69,4,2);
}
function person(c,t,emotion){
 const q=t*7,step=Math.sin(q)*6,bob=Math.abs(Math.sin(q))*2;
 ellipse(c,'#afb8bc',48,89,21,4);
 c.save();c.translate(0,-bob);const x=48,y=25;
 rect(c,'#303b50',x-12,55,9,24+step);rect(c,'#303b50',x+3,55,9,24-step);
 rect(c,'#192c40',x-14,78+step,13,6);rect(c,'#192c40',x+2,78-step,13,6);
 rect(c,'#e0ae88',x-24,39+step*.5,7,23);rect(c,'#e0ae88',x+17,39-step*.5,7,23);
 rect(c,'#284ec2',x-17,36,34,25);rect(c,'#5077dc',x-12,38,22,17);
 rect(c,'#d59b7e',x-13,y-1,26,24);rect(c,'#f0c6a3',x-11,y,22,21);
 rect(c,'#35343c',x-14,y-8,28,9);rect(c,'#35343c',x-15,y-3,6,15);
 if(!emotion){rect(c,'#2d3449',x-8,y+8,4,4);rect(c,'#2d3449',x+5,y+8,4,4);rect(c,'#9c6866',x-3,y+17,7,2);}
 c.restore();
 if(emotion){
   if(emotionReady){
     const frame=Math.floor(t*6)%4;
     c.drawImage(emotionImg,frame*64,0,64,112,21,6,54,83);
   }else{
     rect(c,'#fff4f3',32,39,8,6);rect(c,'#fff4f3',55,39,8,6);
     rect(c,'#313b52',35,39,3,6);rect(c,'#313b52',57,39,3,6);
     ellipse(c,'#ad6272',49,54,5,5);
   }
 }
}
function create(){
 for(const id of ids){
   const contexts=[];
   const targets=[document.querySelector('.file[data-app="'+id+'"] .file-thumb'),document.querySelector('.art[data-art="'+id+'"]')].filter(Boolean);
   targets.forEach(el=>{
     const canvas=document.createElement('canvas');canvas.width=96;canvas.height=96;canvas.className='v6b-animated-preview';canvas.setAttribute('role','img');
     canvas.setAttribute('aria-label',{semesta:'Pixel Earth rotating',jiwa:'Friendly floating ghost',mahluk:'V6B walking character',emotion:'Character displaying authored emotion sprite'}[id]);
     el.replaceChildren(canvas);
     contexts.push(canvas.getContext('2d',{alpha:true}));
   });
   nodes.set(id,contexts);
 }
}
function render(time){
 const t=time/1000;
 for(const [id,contexts] of nodes){
  for(const c of contexts){c.clearRect(0,0,96,96);c.imageSmoothingEnabled=false;
    if(id==='semesta')globe(c,t);else if(id==='jiwa')ghost(c,t);else person(c,t,id==='emotion');
  }
 }
 if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)requestAnimationFrame(render);
}
function start(){create();requestAnimationFrame(render)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
