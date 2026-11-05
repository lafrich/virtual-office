/* Bangun Ruang procedural flat-pixel furniture previews.
 * No emoji/Unicode font dependencies inside the floor plan.
 * The art is preview only; room metadata and action IDs are exported separately.
 */
(function(g){
'use strict';
const PAL={
 edge:'#344657',rim:'#5b7389',white:'#f4f1ea',whiteShadow:'#c7cfdc',
 glass:'#9dd0e0',water:'#559fb9',wood:'#b48455',woodDark:'#6b4f3a',
 slate:'#535969',blue:'#2c6bd8',steel:'#8d97a8',seat:'#a7b2c4',
 pink:'#eabed1',mint:'#86e59a',light:'#f4ebda',warm:'#e8dec6',ink:'#2a3242'
};
function draw(ctx,assetId,x,y,W,H){
 const type=g.VLBuildingInterior?.types?.[assetId]?.visualAs||assetId;
 const ox=Math.round(x),oy=Math.round(y);
 const width=Math.max(10,Math.round(W)),height=Math.max(10,Math.round(H));
 const q=(color,l,t,w,h)=>{
  ctx.fillStyle=color;
  ctx.fillRect(ox+Math.round(l*width/24),oy+Math.round(t*height/24),
   Math.max(1,Math.round(w*width/24)),Math.max(1,Math.round(h*height/24)));
 };
 const box=(base='#c7cfdc',edge='#344657')=>{
  q(edge,1,2,22,20);q(base,2,2,20,19);q('#788197',2,20,20,2);
 };
 if(type==='prayer_mat'){
  box(PAL.woodDark);q(PAL.mint,3,4,18,16);q('#f2b530',5,6,14,4);
 }else if(type==='floor_mattress'){
  box(PAL.wood);q(PAL.white,3,3,18,18);q(PAL.pink,3,13,18,7);
 }else if(type==='squat_toilet'){
  box(PAL.whiteShadow);q(PAL.white,3,3,18,17);q(PAL.slate,9,7,6,10);q(PAL.water,10,8,4,7);
  q(PAL.white,5,8,3,10);q(PAL.white,16,8,3,10);
 }else if(type==='water_tub'){
  box(PAL.white);q(PAL.water,4,4,16,15);q(PAL.glass,12,10,6,4);
 }else if(type==='food_cart'){
  box(PAL.woodDark);q(PAL.wood,2,15,20,6);q('#f2b530',2,3,20,5);
  q(PAL.glass,3,9,18,6);
 }else if(type==='tv'){
  box(PAL.woodDark);q(PAL.ink,3,5,18,13);q(PAL.glass,5,7,14,9);
 }else if(type==='fan'){
  box(PAL.whiteShadow);q(PAL.steel,11,12,3,9);
  q(PAL.glass,5,4,14,11);q(PAL.blue,10,6,4,8);q(PAL.blue,7,10,10,3);
 }else if(type==='aisle_rack'){
  box(PAL.steel);for(const h of [6,13]){q(PAL.blue,3,h,18,2);
   for(const xx of [5,11,17])q(PAL.mint,xx,h-4,3,4);}
 }else if(type==='atm'){
  box(PAL.blue);q(PAL.ink,5,5,14,9);q(PAL.glass,6,6,12,7);
  q(PAL.white,7,17,10,2);
 }else if(type==='food_vitrine'){
  box(PAL.wood);q(PAL.glass,3,3,18,13);q(PAL.warm,5,12,14,3);
 }else if(type==='rice_cooker'){
  box(PAL.wood);q(PAL.white,5,5,14,14);q(PAL.slate,6,4,12,2);
 }else if(type==='wc'){
  box(PAL.whiteShadow);
  q(PAL.steel,7,1,10,6);q(PAL.white,8,1,8,5);
  q(PAL.white,4,9,16,13);q(PAL.slate,7,12,10,7);
  q(PAL.water,8,13,8,5);q(PAL.whiteShadow,9,17,6,3);
 }else if(type==='bed'){
  box(PAL.woodDark);q(PAL.wood,2,3,20,19);
  q(PAL.white,4,4,16,15);q(PAL.pink,4,13,16,6);
  q(PAL.whiteShadow,5,4,14,4);q(PAL.white,6,4,12,4);
  q(PAL.woodDark,3,2,18,2);
 }else if(['chair','office_chair'].includes(type)){
  q(PAL.edge,6,2,12,20);q(type==='chair'?PAL.woodDark:PAL.blue,7,3,10,8);
  q(PAL.seat,5,11,14,8);q(PAL.whiteShadow,7,12,10,4);
  q(PAL.slate,8,19,2,4);q(PAL.slate,15,19,2,4);
 }else if(type==='sofa'){
  q(PAL.woodDark,1,2,22,20);q(PAL.seat,3,4,18,16);
  q(PAL.whiteShadow,4,9,16,9);q(PAL.slate,11,8,2,10);
  q(PAL.woodDark,2,3,3,19);q(PAL.woodDark,19,3,3,19);
 }else if(['shower','bathtub'].includes(type)){
  box(PAL.water);q(PAL.white,3,4,18,15);q(PAL.glass,5,6,14,11);
  q(PAL.water,8,7,8,7);
  if(type==='shower'){q(PAL.slate,15,4,3,5);q(PAL.whiteShadow,7,3,9,3);}
  else{q(PAL.white,5,17,14,3);q(PAL.rim,7,19,10,2);}
 }else if(['sink','kitchen_sink'].includes(type)){
  box(type==='sink'?PAL.white:PAL.wood);
  q(PAL.steel,5,6,14,13);q(PAL.white,7,8,10,9);
  q(PAL.water,8,10,8,6);q(PAL.rim,11,4,2,6);
 }else if(['table','desk','counter','cashier'].includes(type)){
  box(PAL.woodDark);q(PAL.wood,2,3,20,15);q(PAL.warm,4,4,16,3);
  if(type==='desk'){q(PAL.slate,8,8,10,7);q(PAL.blue,9,9,8,5);q(PAL.white,5,16,14,2);}
  if(type==='cashier'){q(PAL.ink,14,6,7,9);q(PAL.blue,15,7,5,5);q(PAL.white,4,9,8,4);}
  if(type==='counter')q(PAL.glass,3,8,18,7);
 }else if(type==='computer'){
  q(PAL.slate,2,4,20,17);q(PAL.glass,4,6,16,12);
  q(PAL.blue,5,7,14,8);q(PAL.white,10,19,4,3);
 }else if(type==='stove'){
  box(PAL.steel);q(PAL.slate,3,4,18,16);
  for(const [xx,yy] of [[5,6],[14,6],[5,14],[14,14]]){
   q(PAL.ink,xx,yy,5,5);q(PAL.whiteShadow,xx+1,yy+1,3,3);
  }
 }else if(type==='fridge'){
  box(PAL.whiteShadow);q(PAL.white,4,4,16,16);
  q(PAL.slate,3,11,18,2);q(PAL.rim,18,5,2,5);q(PAL.rim,18,14,2,4);
 }else if(['shelf','wardrobe'].includes(type)){
  box(PAL.woodDark);q(PAL.wood,3,3,18,18);
  if(type==='wardrobe'){q(PAL.woodDark,11,3,2,18);q(PAL.whiteShadow,8,10,2,4);q(PAL.whiteShadow,14,10,2,4);}
  else for(const y0 of [8,14]){q(PAL.woodDark,4,y0,16,2);q(PAL.pink,6,y0-4,4,4);q(PAL.mint,12,y0-4,5,4);}
 }else{
  box(PAL.whiteShadow);q(PAL.wood,6,7,12,11);
 }
 // Bottom and right depth accents: 1x sharp pixels, no smoothing.
}
g.VLInteriorPixels=Object.freeze({draw});
})(window);
