/* VIRTUAL OFFICE / PIXEL ASSET KIT 01
   Detail-driven, consistent isometric furniture artwork for modular Cove.
   It consumes the same VISUAL SYSTEM tokens and world-space anchors as Edit Mode.
   All shapes are deliberately nearest-neighbour/flat-color pixel art primitives.
   Sprite PNGs (when present) retain priority in modular-engine.js. */
(function(global){
'use strict';
const V=global.VOVisualSystem;
const P=V.palette, R=V.material;
function drawAsset(api,a,part){
 const {box,iso,line,poly,shadow,ctx:g,zoom}=api;
 const x=a.at.x,y=a.at.y,sc=a.scale,z=a.elevation;
 const w=a.size.w,d=a.size.d,h=a.size.h;
 // Dimensions and offsets are in local tile/world units; elevation in iso pixels.
 function B(dx,dy,bw,bd,bh,top,left,right,up=0){
  return box(x+dx*sc,y+dy*sc,bw*sc,bd*sc,bh*sc,top,left,right,z+up*sc)
 }
 function L(x1,y1,z1,x2,y2,z2,c,width=1){
  line(iso(x+x1*sc,y+y1*sc,z+z1*sc),
       iso(x+x2*sc,y+y2*sc,z+z2*sc),c,width*zoom);
 }
 function mark(dx,dy,up,color,sz=2){
  const p=iso(x+dx*sc,y+dy*sc,z+up*sc);
  g.fillStyle=color;
  g.fillRect(Math.round(p.x-sz*zoom/2),Math.round(p.y-sz*zoom/2),
    Math.max(1,Math.round(sz*zoom)),Math.max(1,Math.round(sz*zoom)));
 }
 function highlights(sizeX,sizeY,height,light=P.cream){
  L(-sizeX/2,-sizeY/2,height,sizeX/2,-sizeY/2,height,light,.75);
  L(sizeX/2,-sizeY/2,height,sizeX/2,sizeY/2,height,light,.5);
 }
 const handled=new Set(['bed','bathtub','toilet','desk','chair','bookshelf',
  'dresser','nightstand','lamp','sink','mirror','shower','partition',
  'plant','rug','door']);
 if(!handled.has(a.type))return false;
 if(part==='front'){
  if(a.type==='bed'){
   // Front blanket hides the sleeping avatar; same pivot as base.
   B(0,.55,w*.96,.83,3,P.blue,P.blueDark,P.blueDark,15);
   B(0,.93,w*.98,.22,12,P.blueDark,P.blueDark,P.woodDark,4);
   L(-w*.45,.80,19,w*.45,.80,19,P.blueLight,.9);
   B(0,1.04,w,.14,14,P.woodLight,P.wood,P.woodDark,0);
  }else if(a.type==='bathtub'){
   // Sage ceramic bath rim covers seated torso without hiding the whole scene.
   B(0,d*.42,w*.97,.28,19,P.greenLight,P.greenDark,P.greenDark,.3);
   B(0,d*.50,w*.85,.12,20,'#9CCBA5',P.green,P.greenDark,.4);
   highlights(w*.83,.16,20.5,P.cream);
  }else if(a.type==='toilet'){
   B(0,.31,w*.74,.50,12,P.white,P.grey,P.shadow,2);
   B(0,.49,w*.62,.18,15,P.white,P.grey,P.shadow,0);
   L(-.32,.46,15,.32,.46,15,P.cream,.8);
  }else if(a.type==='chair'){
   B(0,.42,w*.89,.20,9,P.woodLight,P.wood,P.woodDark,7);
  }
  return true;
 }
 switch(a.type){
  case 'rug': {
   B(0,0,w,d,.13,P.cream,P.creamShade,P.wallSide);
   B(0,0,w-.28,d-.27,.1,P.wallLight,P.creamShade,P.wallSide,.15);
   // Woven outline motif: no pattern noise or tiny unscalable texture.
   L(-w*.4,-d*.32,.32,w*.40,-d*.32,.32,P.creamShade,.7);
   L(-w*.4,d*.32,.32,w*.40,d*.32,.32,P.creamShade,.7);
   break;
  }
  case 'bed': {
   shadow(x,y,24*sc,7*sc);
   // Wooden frame + feet, mattress, headboard, two different pillows.
   for(const sx of [-w*.42,w*.42])for(const sy of [-d*.40,d*.40])
    B(sx,sy,.16,.19,7,P.woodDark,P.woodDark,P.woodDark);
   B(0,0,w,d,8,P.woodLight,P.wood,P.woodDark,4);
   B(0,-d*.43,w*.99,.19,24,P.woodLight,P.wood,P.woodDark,4);
   B(0,-.02,w*.94,d*.86,9,P.cream,P.grey,P.shadow,11);
   // Blue blanket covers lower portion in the base layer.
   B(0,.36,w*.92,d*.50,2,P.blueLight,P.blue,P.blueDark,19.6);
   B(-w*.22,-d*.26,w*.32,d*.30,2,P.white,P.creamShade,P.grey,20);
   B(w*.19,-d*.26,w*.34,d*.30,2,P.white,P.creamShade,P.grey,20);
   B(-.01,-d*.05,w*.30,d*.23,3,P.blueDark,P.blueDark,P.blueDark,21);
   L(-w*.45,.01,22,w*.45,.01,22,P.cream,.9);
   // Tiny quilting seam and two clean folds.
   L(-w*.33,.54,22,w*.33,.54,22,P.blue,.75);
   L(-w*.26,.72,22,w*.26,.72,22,P.blueLight,.6);
   highlights(w,d,12,P.cream);
   break;
  }
  case 'bathtub':{
   shadow(x,y,18*sc,5*sc);
   // Soft sage porcelain tub, top water plane and golden bath tray.
   B(0,0,w,d,16,P.greenLight,P.green,P.greenDark,1.5);
   B(0,0,w*.96,d*.92,2,P.greenLight,P.green,P.greenDark,17);
   B(0,-.04,w*.84,d*.69,1.0,'#8DCAD1','#5FA7BD','#5799A9',19);
   // Water highlights are sparse and directional.
   L(-w*.30,-.02,20.5,w*.20,-.02,20.5,'#C8F0EC',1.2);
   L(-w*.14,.21,20.5,w*.34,.21,20.5,'#B6E6E7',1);
   // Bath tray and toiletry bottles.
   B(-.59,-.05,.50,d*.72,1,P.woodLight,P.wood,P.woodDark,21);
   B(-.59,-.23,.14,.13,7,P.ink,P.softInk,P.shadowDark,22.2);
   B(-.39,-.10,.13,.12,4,P.cream,P.grey,P.shadow,22.2);
   B(-.63,.18,.23,.25,1,P.white,P.grey,P.shadow,22.2);
   // High thin rim visible before body enters.
   B(0,-d*.42,w*.92,.17,20,P.greenLight,P.green,P.greenDark,.6);
   highlights(w*.90,d*.85,20.5,P.cream);
   break;
  }
  case 'desk':{
   shadow(x,y,19*sc,5*sc);
   const rw=w*.92;
   for(const sx of [-rw*.43,rw*.43])for(const sy of [-d*.37,d*.37])
    B(sx,sy,.13,.15,13,P.wood,P.woodDark,P.woodDark);
   B(0,0,w,d,12,P.woodLight,P.wood,P.woodDark,11);
   B(w*.31,.18,.64,.40,11,P.wood,P.woodDark,P.woodDark,0);
   // Desk drawer face with pixel metal handle.
   B(w*.32,d*.42,.51,.08,4,P.woodLight,P.wood,P.woodDark,8);
   B(w*.32,d*.48,.16,.055,.20,P.grey,P.shadow,P.shadowDark,10);
   // Laptop keyboard and raised screen.
   B(-w*.20,.03,.88,.57,.55,P.grey,P.shadow,P.shadowDark,23.3);
   B(-w*.20,-.18,.73,.14,16,P.ink,P.softInk,P.shadowDark,23.7);
   B(-w*.20,-.26,.59,.09,11,P.glass,P.blue,P.blueDark,40.5);
   B(-w*.20,.22,.47,.23,.17,P.ink,P.softInk,P.shadowDark,24);
   // Lamp with small warm shade, notebook and coffee mug.
   B(w*.31,-d*.33,.14,.15,17,P.ink,P.softInk,P.shadowDark,23);
   B(w*.30,-d*.31,.44,.36,4,P.cream,P.uiGold,P.woodLight,41);
   B(w*.33,.05,.29,.40,.35,P.cream,P.grey,P.shadow,23);
   B(-w*.40,.27,.16,.15,3,P.cream,P.grey,P.shadow,23);
   highlights(w,d,23,P.cream);
   break;
  }
  case 'chair':{
   shadow(x,y,8*sc,4*sc);
   for(const dx of [-w*.36,w*.36])for(const dy of [-d*.34,d*.34])
    B(dx,dy,.10,.11,8,P.woodDark,P.woodDark,P.woodDark);
   B(0,0,w,d,8,P.woodLight,P.wood,P.woodDark,7);
   B(0,-d*.44,w,.16,23,P.woodLight,P.wood,P.woodDark,5);
   B(0,-d*.42,w*.73,.12,14,P.cream,P.creamShade,P.wood,12);
   highlights(w*.85,d*.82,15,P.cream);
   break;
  }
  case 'toilet':{
   shadow(x,y,10*sc,4*sc);
   // Tank, cistern button, stepped ceramic basin and visible toilet rim.
   B(0,-.44,w*.79,.48,27,P.white,P.grey,P.shadow);
   B(0,-.46,w*.82,.50,2,P.cream,P.grey,P.shadow,27);
   B(.25,-.54,.15,.08,.32,P.grey,P.shadow,P.shadowDark,29);
   B(0,.16,w*.91,d*.73,9,P.white,P.grey,P.shadow,2);
   B(0,.19,w*.82,d*.66,2,P.white,P.grey,P.shadow,12);
   B(0,.19,w*.50,d*.41,1,P.glass,P.grey,P.grey,14);
   B(0,.19,w*.39,d*.29,.40,P.white,P.grey,P.shadow,15);
   highlights(w*.75,d*.6,13.5,P.cream);
   break;
  }
  case 'bookshelf': {
   shadow(x,y,10*sc,3*sc);
   B(0,0,w,d,h,P.woodLight,P.wood,P.woodDark);
   for(let k=0;k<3;k++){
    const up=5+k*9;
    B(0,d*.32,w*.86,.11,.7,P.woodLight,P.wood,P.woodDark,up);
    for(let b=0;b<4;b++){
     const col=[P.blueDark,P.cream,P.bath,P.green][(k+b)%4];
     B(-w*.31+b*w*.2,-d*.02,.16,.20,4+(b%2)*3,
       col,P.woodDark,P.wood,up+.7);
    }
   }
   B(w*.30,d*.38,.13,.06,.55,P.grey,P.shadow,P.shadowDark,h*.55);
   break;
  }
  case 'dresser': {
   shadow(x,y,10*sc,3*sc);
   B(0,0,w,d,h,P.woodLight,P.wood,P.woodDark);
   B(0,0,w*.96,d*.91,.6,P.woodLight,P.wood,P.woodDark,h);
   for(let k=0;k<3;k++){
    const up=2+k*h/3;
    B(0,d*.48,w*.82,.06,.25,P.wood,P.woodDark,P.woodDark,up);
    for(const xx of [-.25,.25])
     B(xx,d*.51,.12,.05,.35,P.uiGold,P.woodLight,P.wood,up+.35);
   }
   B(-w*.24,-d*.16,.19,.20,6,P.cream,P.grey,P.shadow,h+.5);
   B(w*.25,-d*.15,.20,.20,8,P.ink,P.shadowDark,P.shadowDark,h+.5);
   break;
  }
  case 'nightstand': {
   shadow(x,y,8*sc,3*sc);
   B(0,0,w,d,9,P.woodLight,P.wood,P.woodDark);
   B(0,0,w*.99,d*.96,.75,P.woodLight,P.wood,P.woodDark,9);
   B(0,d*.46,w*.72,.055,.30,P.wood,P.woodDark,P.woodDark,6);
   B(0,d*.49,.16,.06,.3,P.uiGold,P.wood,P.woodDark,7);
   break;
  }
  case 'lamp':{
   B(0,0,.26,.25,1.2,P.woodDark,P.wood,P.woodDark,8);
   B(0,0,.10,.11,10,P.grey,P.shadow,P.shadowDark,9.2);
   B(0,0,.57,.52,5,P.cream,P.uiGold,P.woodLight,20);
   B(0,-.03,.35,.30,.30,P.white,P.cream,P.uiGold,25);
   break;
  }
  case 'plant':{
   // Tall broad-leaf tropical plant, shared greens and same bottom-center pivot.
   shadow(x,y,8*sc,3*sc);
   B(0,0,.66,.66,7,P.white,P.grey,P.shadow);
   B(0,0,.30,.30,.7,P.woodDark,P.woodDark,P.woodDark,7);
   B(0,0,.09,.09,22,P.greenDark,P.greenDark,P.greenDark,8);
   for(let i=0;i<8;i++){
    const ang=i*Math.PI*2/8;
    const dx=Math.cos(ang)*.31,dy=Math.sin(ang)*.25,up=18+(i%3)*8;
    B(dx,dy,.25,.32,2,
      i%2?P.green:P.greenLight,P.greenDark,P.greenDark,up);
    L(0,0,9,dx,dy,up+1,P.greenDark,1);
   }
   break;
  }
  case 'sink':{
   shadow(x,y,8*sc,3*sc);
   B(0,0,w,d,20,P.woodLight,P.wood,P.woodDark);
   for(let k=0;k<2;k++){
    B(0,d*.44,w*.74,.05,.30,P.wood,P.woodDark,P.woodDark,6+k*8);
    B(0,d*.46,.17,.05,.31,P.uiGold,P.wood,P.woodDark,7+k*8);
   }
   B(0,-.04,w*.77,d*.73,3,P.greenLight,P.green,P.greenDark,20);
   B(0,-.01,w*.52,d*.45,1,'#CEE5CC',P.green,P.greenDark,23);
   B(0,-d*.29,.11,.13,6,P.uiGold,P.woodLight,P.wood,23.5);
   break;
  }
  case 'mirror':{
   B(0,0,w,d,36,P.woodLight,P.wood,P.woodDark);
   B(0,0,w*.82,d*.74,27,P.glass,P.blueDark,P.shadow,39);
   // Clean highlight stripe without gradient.
   L(-w*.25,-d*.14,48,-w*.05,-d*.14,54,P.white,1.3);
   break;
  }
  case 'shower':{
   B(0,0,.11,.15,44,P.uiGold,P.woodLight,P.wood,0);
   B(.27,.16,.62,.11,3,P.uiGold,P.woodLight,P.wood,44);
   B(.34,.18,.28,.28,1.2,P.cream,P.uiGold,P.woodLight,47);
   // Three faint water jets in the red tiled alcove.
   for(let i=-1;i<=1;i++){
    L(.33+i*.12,.18,44,.33+i*.12,.2,28,'rgba(199,235,244,.55)',.7);
   }
   break;
  }
  case 'partition':{
   // Translucent glass and repeated 2:1 isometric pixel panes.
   B(0,0,w,d,39,'rgba(201,234,239,.23)',
     'rgba(164,201,212,.4)','rgba(162,200,212,.42)');
   for(let i=0;i<5;i++){
    const up=5+i*7;
    B(0,0,w*.98,d,.35,P.white,P.grey,P.shadow,up);
   }
   for(let j=-1;j<=1;j++){
    B(0,j*d*.34,.14,.12,39,P.white,P.grey,P.grey);
   }
   break;
  }
  case 'door':{
   shadow(x,y,6*sc,2*sc);
   B(0,0,w,d,43,P.woodLight,P.wood,P.woodDark);
   B(.03,0,.10,d*.77,34,P.wood,P.woodDark,P.woodDark,5);
   B(.055,0,.07,d*.56,24,P.woodLight,P.wood,P.woodDark,9);
   B(.10,d*.25,.09,.12,.8,P.uiGold,P.woodLight,P.wood,23);
   break;
  }
 }
 return true;
}
global.VOPixelKit=Object.freeze({version:'1.0',drawAsset});
})(window);
