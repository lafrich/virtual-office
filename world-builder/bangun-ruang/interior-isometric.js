/* Bangun Ruang / Semesta shared interior isometric renderer.
 * Native 2:1 tile projection, 64x32 px. No gradients, smoothing, mesh or
 * regenerated source art. The scene still saves in original c/r coordinates.
 *
 * Rendered pixel shapes are cutaway room / furniture authoring previews only.
 * Individual furniture uses the same V6B-inspired 5-tone material ramps.
 */
(function(g){
'use strict';
// Virtual Life's canonical 64x32 tile is ALREADY the 2x art coordinate
// version of its 32x16 world projection (PPU=2). Never halve a 64x112 sprite
// a second time. Dimensions match the user's original Cove 40-high wall,
// 30-high door and 4.6-high toilet seat (all times HS=1.6, PPU=2).
const GAME=g.VLGameProportions;
const ACTOR_SCALE=GAME?.character.scale??1;
const ACTION_ADJUST=g.VLInteractionAdjust;
const TILE_W=64,TILE_H=32,HALF_W=32,HALF_H=16,
 WALL=GAME?.building.wallHeight||128,SLAB=8,PAD=35;
const WC_SEAT_Z=GAME?.toilet.seatHeight||15;
const WC_TANK_Z=GAME?.toilet.tankHeight||38;
const TYPES=g.VLBuildingInterior?.types||{};
const PALETTES={
 cream:{floor:['#E8DEC6','#D4C8AE','#C3AD8D'],wall:['#F4EBDA','#E8DEC6','#C3AD8D'],skirt:'#9B866F'},
 warm:{floor:['#D4C8AE','#C3AD8D','#B48455'],wall:['#F4EBDA','#E8DEC6','#C3AD8D'],skirt:'#94704F'},
 aqua:{floor:['#BFD8E4','#A7B2C4','#8D97A8'],wall:['#E7EBF2','#C7CFDC','#A7B2C4'],skirt:'#535969'},
 blue:{floor:['#C7CFDC','#A7B2C4','#8D97A8'],wall:['#E7EBF2','#D2D5D9','#788197'],skirt:'#535969'}
};
const MAT={
 wood:['#D49A5E','#B48455','#94704F','#6B4F3A'],
 cream:['#F4EBDA','#E8DEC6','#C3AD8D','#9B866F'],
 white:['#FFFFFF','#E7EBF2','#C7CFDC','#8D97A8'],
 steel:['#C7CFDC','#A7B2C4','#788197','#535969'],
 blue:['#86CCFF','#3F7FE0','#2457B8','#1A3F87'],
 teal:['#B2EEE7','#6FA9A9','#3D7A80','#2A5266'],
 pink:['#FFDDBE','#FFC2B8','#EE4D72','#BE2F56'],
 glass:['#BFD8E4','#7A9FB2','#4F6A86','#1C2330'],
 dark:['#788197','#535969','#2A3242','#15151F'],
 green:['#86E59A','#4FB36B','#22894A','#1A6A3A']
};
const C=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const fmt=v=>Math.round(v*1000)/1000;
const finite=(v,fallback)=>Number.isFinite(Number(v))?Number(v):fallback;
function bounds(scene){
 const w=C(Math.round(finite(scene?.width,6)),2,48),d=C(Math.round(finite(scene?.depth,6)),2,48);
 const width=(w+d)*HALF_W+PAD*2;
 const height=(w+d)*HALF_H+WALL+SLAB+PAD*2;
 const ox=d*HALF_W+PAD,oy=WALL+PAD;
 return {w,d,width,height,ox,oy,halfWidth:HALF_W,halfHeight:HALF_H,tiles:[TILE_W,TILE_H]};
}
function point(geometry,c,r,z=0){
 return [fmt(geometry.ox+(c-r)*HALF_W),fmt(geometry.oy+(c+r)*HALF_H-z)];
}
function polygon(ctx,vertices,color){
 if(!vertices.length)return;
 let minY=Math.floor(Math.min(...vertices.map(v=>v[1])));
 let maxY=Math.ceil(Math.max(...vertices.map(v=>v[1])));
 ctx.fillStyle=color;
 for(let y=minY;y<maxY;y++){
  const crosses=[];
  for(let i=0;i<vertices.length;i++){
   const a=vertices[i],b=vertices[(i+1)%vertices.length],yy=y+.5;
   if((a[1]<=yy&&b[1]>yy)||(b[1]<=yy&&a[1]>yy))
    crosses.push(a[0]+(yy-a[1])*(b[0]-a[0])/(b[1]-a[1]));
  }
  crosses.sort((a,b)=>a-b);
  for(let n=0;n+1<crosses.length;n+=2){
   const x0=Math.ceil(crosses[n]-.5),x1=Math.ceil(crosses[n+1]-.5);
   if(x1>x0)ctx.fillRect(x0,y,x1-x0,1);
  }
 }
}
function line(ctx,x0,y0,x1,y1,color){
 x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
 const dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;
 let err=dx+dy;
 ctx.fillStyle=color;
 for(let i=0;i<4096;i++){
  ctx.fillRect(x0,y0,1,1);
  if(x0===x1&&y0===y1)break;
  const twice=2*err;
  if(twice>=dy){err+=dy;x0+=sx;}
  if(twice<=dx){err+=dx;y0+=sy;}
 }
}
function polyPoint(geometry,vertices){return vertices.map(v=>point(geometry,...v));}
function fillTile(ctx,geo,c,r,z,color){
 const a=polyPoint(geo,[[c,r,z],[c+1,r,z],[c+1,r+1,z],[c,r+1,z]]);
 polygon(ctx,a,color);
}
function box(ctx,geo,c,r,w,d,low,top,material,outline=false){
 const tone=MAT[material]||MAT.wood;
 const t=polyPoint(geo,[[c,r,top],[c+w,r,top],[c+w,r+d,top],[c,r+d,top]]);
 const sw=polyPoint(geo,[[c,r+d,top],[c+w,r+d,top],[c+w,r+d,low],[c,r+d,low]]);
 const se=polyPoint(geo,[[c+w,r,top],[c+w,r+d,top],[c+w,r+d,low],[c+w,r,low]]);
 polygon(ctx,sw,tone[1]);
 polygon(ctx,se,tone[2]);
 polygon(ctx,t,tone[0]);
 if(outline){
  for(const ring of [t]){
   for(let i=0;i<ring.length;i++)
    line(ctx,...ring[i],...ring[(i+1)%ring.length],tone[3]);
  }
 }
 return {top:t,sw,se};
}
function tileOutline(ctx,geo,c,r,color){
 const pts=polyPoint(geo,[[c,r,1],[c+1,r,1],[c+1,r+1,1],[c,r+1,1]]);
 for(let i=0;i<pts.length;i++)line(ctx,...pts[i],...pts[(i+1)%pts.length],color);
}
function itemFootprint(item){
 const m=TYPES[item.assetId];
 if(!m)return [1,1];
 const rotated=(Number(item.rotation)||0)%180===90;
 return rotated?[m.d,m.w]:[m.w,m.d];
}
/* Rotation is in 90-degree grid steps. Translate LOCAL fixture geometry and
 * interaction anchors using the SAME mapping to prevent mirrored seating.
 */
function fixtureRotation(item){
 const v=((Number(item?.rotation)||0)%360+360)%360;
 return Math.round(v/90)%4;
}
function fixturePoint(item,x,y){
 const c=Number(item.c),r=Number(item.r);
 const [w,d]=itemFootprint(item);
 switch(fixtureRotation(item)){
  case 1:return {c:c+w-y,r:r+x};
  case 2:return {c:c+w-x,r:r+d-y};
  case 3:return {c:c+y,r:r+d-x};
  default:return {c:c+x,r:r+y};
 }
}
// All furniture parts and actor docking anchors share exactly the same
// local-to-world rotation, including 2x2 beds and rotated rectangular sofas.
function fixtureBox(item,x,y,w,d){
 const p=fixturePoint(item,x,y),q=fixturePoint(item,x+w,y+d);
 return {c:Math.min(p.c,q.c),r:Math.min(p.r,q.r),
  w:Math.abs(q.c-p.c),d:Math.abs(q.r-p.r)};
}
function actionAnchor(item,opts={}){
 if(!item||!TYPES[item.assetId])return null;
 let seat=null,z=0,offset=0;
 switch(item.assetId){
  case 'wc':
   // Preserve the source-grounded V6B toilet docking calibration.
   seat=GAME?.toilet.seatedPoint||[.61,.69];
   offset=GAME?.toilet.footOffsetY??0;break;
  case 'chair':
  case 'office_chair':
   // The seat, rather than the adjacent floor tile, is the sit target.
   seat=[.50,.55];break;
  case 'sofa':
   seat=[TYPES.sofa.w/2,.60];break;
  case 'bed':
   // Feet toward the duvet, head toward the pillow/headboard.
   // Lift the sprite foot pivot onto the 21px-high mattress.
   seat=[TYPES.bed.w/2,TYPES.bed.d*.69];z=21;break;
  case 'shower':
   // Stand under the fixture, not at the doorway.
   seat=[.5,.56];break;
  case 'bathtub':
   // Reuse the bath body override and the tub's centre; the near rim
   // occludes lower-body detail in both the editor and Semesta.
   seat=[TYPES.bathtub.w/2,.50];z=6;break;
  default:
   if(!opts.generic)return null;
   seat=[TYPES[item.assetId].w/2,TYPES[item.assetId].d/2];break;
 }
 const p=fixturePoint(item,...seat);
 // A zero-rotation chair/bed faces out from its backrest at local r=0.
 // The original WC pose is deliberately always SW regardless of rotation.
 const direction=item.assetId==='wc'?(GAME?.toilet.sitFacing||'sw'):
  ['sw','se','ne','nw'][fixtureRotation(item)];
 const anchor={c:p.c,r:p.r,z,pixelOffsetY:offset,direction,
  itemId:item.id,kind:item.assetId,localSeat:seat};
 return opts.raw?anchor:ACTION_ADJUST?.apply(anchor,item,item.actionId)||anchor;
}
function furniture(ctx,geo,item,selected=false){
 const c=Number(item.c),r=Number(item.r),type=item.assetId;
 const [fw,fd]=itemFootprint(item);
 const {w,d}=TYPES[type]; // unrotated local dimensions for art geometry
 if(!Number.isFinite(c)||!Number.isFinite(r))return null;
 const inset=.08;
 // Physical shadow is pixel geometry projected at ground level.
 polygon(ctx,polyPoint(geo,[[c+.1,r+.08,1],[c+fw+.1,r+.08,1],
  [c+fw+.1,r+fd+.08,1],[c+.1,r+fd+.08,1]]),'#9B866F');
 const hitPolygons=[];
 const B=(x,y,cw,rd,low,top,material,outline=false)=>{
  const p=fixtureBox(item,x,y,cw,rd);
  const part=box(ctx,geo,p.c,p.r,p.w,p.d,low,top,material,outline);
  hitPolygons.push(part.top,part.sw,part.se);
  return part;
 };
 const place=()=>{
 switch(type){
 case 'wc':
  // User-supplied original game source: indoor p_indoor.py / Cove p_cove.py.
  // Tank sits against the back wall (c.18-.82, r.03-.30).
  // Bowl is narrower and lower (c.25-.75, r.28-.92); seat top=15 px.
  B(.17,.03,w-.34,.27,0,WC_TANK_Z,'white');
  B(.15,.03,w-.30,.27,WC_TANK_Z,WC_TANK_Z+2,'cream');
  B(.25,.28,w-.50,d-.36,0,WC_SEAT_Z,'white');
  // Like the original game, the ring/opening sits on the top of the bowl.
  // Three nested flattened iso ellipses avoid an oversized white podium.
  for(const [rx,ry,z,material] of [
   [.21,.26,WC_SEAT_Z+.25,'dark'],
   [.145,.19,WC_SEAT_Z+.5,'white'],
   [.09,.12,WC_SEAT_Z+.75,'glass']
  ]){
   const points=[];
   for(let n=0;n<24;n++){
    const angle=n/24*Math.PI*2;
    const uv=fixturePoint(item,.5+Math.cos(angle)*rx,.61+Math.sin(angle)*ry);
    points.push(point(geo,uv.c,uv.r,z));
   }
   polygon(ctx,points,(MAT[material]||MAT.white)[0]);
  }
  break;
 case 'shower':
  B(.07,.07,w-.14,d-.14,1,5,'white');
  B(.13,.13,w-.26,d-.26,5,6,'blue');
  B(.07,.07,.1,d-.14,6,46,'glass');
  B(.18,.08,w-.25,.10,40,45,'steel');
  break;
 case 'bathtub':
  B(.05,.05,w-.1,d-.1,0,20,'white');
  B(.23,.22,w-.46,d-.44,20,21,'teal');
  B(.10,.07,.20,.14,20,25,'steel');
  break;
 case 'bed':
  B(.05,.05,w-.1,d-.1,0,14,'wood');
  B(.13,.09,w-.26,d-.18,14,21,'cream');
  B(.13,d*.49,w-.26,d*.42,21,22,'pink');
  B(.09,.04,w-.18,.18,14,33,'wood');
  B(.25,.28,Math.max(.4,w-.5),.28,21,24,'white');
  break;
 case 'chair':
 case 'office_chair':
  B(.24,.22,w-.48,d-.43,0,14,type==='chair'?'wood':'steel');
  B(.13,.10,w-.26,.24,8,40,type==='chair'?'wood':'blue');
  B(.18,.25,w-.36,d-.40,14,19,type==='chair'?'cream':'dark');
  break;
 case 'sofa':
  B(.04,.06,w-.08,d-.12,0,22,'wood');
  B(.08,.08,w-.16,.22,18,40,'blue');
  B(.16,.35,w-.32,d-.49,22,25,'cream');
  break;
 case 'desk':
 case 'table':
 case 'counter':
 case 'cashier':
  B(.09,.12,w-.18,d-.24,0,24,type==='desk'||type==='table'?'wood':'cream');
  B(.04,.05,w-.08,d-.1,24,29,type==='desk'||type==='table'?'wood':'steel');
  if(type==='desk'){
   B(.24,.20,.44,.24,29,43,'dark');
   B(.27,.23,.38,.17,43,46,'glass');
  }
  if(type==='cashier')B(w-.72,.22,.45,.38,29,42,'dark');
  if(type==='counter')B(.30,.22,Math.max(.6,w-.6),.34,29,37,'glass');
  break;
 case 'computer':
  B(.14,.16,w-.28,d-.3,0,16,'steel');
  B(.16,.09,w-.32,.18,17,43,'dark');
  B(.20,.05,w-.40,.15,21,40,'glass');
  break;
 case 'stove':
  B(.05,.05,w-.1,d-.1,0,29,'steel');
  B(.13,.12,w-.26,d-.24,29,30,'dark');
  for(const [x,y] of [[.21,.18],[.60,.18],[.21,.56],[.60,.56]])
   B(x,y,.17,.17,30,31,'steel');
  break;
 case 'fridge':
  B(.05,.08,w-.10,d-.16,0,55,'white');
  B(.05,d*.47,w-.10,.025,12,14,'steel');
  B(w-.21,d*.55,.07,.19,28,34,'steel');
  break;
 case 'wardrobe':
  B(.06,.08,w-.12,d-.16,0,53,'wood');
  B(.06,d-.25,w-.12,.06,3,51,'wood');
  B(w*.49,d-.29,.045,.07,5,50,'dark');
  break;
 case 'shelf':
  B(.05,.06,w-.10,d-.12,0,48,'wood');
  for(const z of [16,31,46]) B(.04,d-.16,w-.08,.12,z,z+3,'cream');
  break;
 case 'sink':
 case 'kitchen_sink':
  B(.06,.06,w-.12,d-.12,0,25,type==='sink'?'white':'wood');
  B(.12,.13,w-.24,d-.27,25,28,'steel');
  B(.22,.23,w-.44,d-.45,28,29,'glass');
  B(.39,.12,.18,.12,29,37,'steel');
  break;
 default:
  B(.10,.10,w-.20,d-.20,0,30,'wood');
 }
 };
 place();
 // Selected footprint is a native pixel outline, drawn after the object.
 if(selected){
  const corners=polyPoint(geo,[[c,r,2],[c+fw,r,2],[c+fw,r+fd,2],[c,r+fd,2]]);
  for(let i=0;i<corners.length;i++)line(ctx,...corners[i],...corners[(i+1)%corners.length],'#F2B530');
 }
 const ground=polyPoint(geo,[[c,r,0],[c+fw,r,0],[c+fw,r+fd,0],[c,r+fd,0]]);
 const top=polyPoint(geo,[[c,r,58],[c+fw,r,58],[c+fw,r+fd,58],[c,r+fd,58]]);
 const all=[...ground,...top];
 return {id:item.id, c:item.c,r:item.r,
  minX:Math.min(...all.map(p=>p[0]))-2,maxX:Math.max(...all.map(p=>p[0]))+2,
  minY:Math.min(...all.map(p=>p[1]))-2,maxY:Math.max(...all.map(p=>p[1]))+2,
  depth:c+r+fw+fd,polygons:hitPolygons};
}
// Final near-side furniture fragments are drawn AFTER the actor sprite.
// This gives occlusion: knees tuck behind a chair cushion, and a lying
// character's lower body goes under the duvet instead of floating above it.
function drawSeatForeground(ctx,geometry,item){
 if(!item)return;
 const part=(x,y,w,d,low,top,material)=>{
  const p=fixtureBox(item,x,y,w,d);
  box(ctx,geometry,p.c,p.r,p.w,p.d,low,top,material);
 };
 switch(item.assetId){
  case 'wc':
   part(.30,.77,.40,.11,2,WC_SEAT_Z-2,'white');break;
  case 'chair':
  case 'office_chair':
   part(.18,.63,.64,.11,10,18,item.assetId==='chair'?'cream':'dark');break;
  case 'sofa':
   part(.12,.70,TYPES.sofa.w-.24,.12,14,24,'cream');break;
  case 'bed':
   part(.13,1.05,TYPES.bed.w-.26,.77,21,23,'pink');break;
 }
}
function draw(canvas,scene,opts={}){
 const ctx=canvas.getContext('2d');
 if(!ctx)return null;
 const geo=bounds(scene);
 if(canvas.width!==geo.width)canvas.width=geo.width;
 if(canvas.height!==geo.height)canvas.height=geo.height;
 ctx.imageSmoothingEnabled=false;
 ctx.clearRect(0,0,geo.width,geo.height);
 const color=PALETTES[scene?.theme]||PALETTES.cream;
 // Painted rear wall planes, left and right, without enclosing the foreground.
 const left=polyPoint(geo,[[0,0,0],[0,geo.d,0],[0,geo.d,WALL],[0,0,WALL]]);
 const right=polyPoint(geo,[[0,0,0],[geo.w,0,0],[geo.w,0,WALL],[0,0,WALL]]);
 polygon(ctx,right,color.wall[0]);polygon(ctx,left,color.wall[1]);
 // Back-wall tile seams and base trim, using only exact pixels.
 for(let c=1;c<geo.w;c++)line(ctx,...point(geo,c,0,0),...point(geo,c,0,WALL),'#D4C8AE');
 for(let r=1;r<geo.d;r++)line(ctx,...point(geo,0,r,0),...point(geo,0,r,WALL),'#C3AD8D');
 const sw=polyPoint(geo,[[0,geo.d,0],[geo.w,geo.d,0],[geo.w,geo.d,-SLAB],[0,geo.d,-SLAB]]);
 const se=polyPoint(geo,[[geo.w,0,0],[geo.w,geo.d,0],[geo.w,geo.d,-SLAB],[geo.w,0,-SLAB]]);
 polygon(ctx,sw,color.skirt);polygon(ctx,se,color.floor[2]);
 for(let diag=0;diag<geo.w+geo.d;diag++){
  for(let c=0;c<geo.w;c++){
   const r=diag-c;if(r<0||r>=geo.d)continue;
   fillTile(ctx,geo,c,r,0,color.floor[(c+r)%2===0?0:1]);
   if(opts.grid!==false)tileOutline(ctx,geo,c,r,'#A7B2C4');
  }
 }
 // Front-floor EXIT is an unobstructed threshold tile at r == depth.
 const en=scene?.entrance||{c:Math.floor(geo.w/2),r:geo.d-1};
 if(Number.isInteger(en.c)&&en.c>=0&&en.c<geo.w){
  const r=C(finite(en.r,geo.d-1),0,geo.d-1);
  polygon(ctx,polyPoint(geo,[[en.c,r+.86,2],[en.c+1,r+.86,2],
    [en.c+1,r+1,2],[en.c,r+1,2]]),'#22894A');
 }
 const hits=[];
 const items=(Array.isArray(scene?.items)?scene.items:[]).filter(x=>TYPES[x.assetId])
  .slice(0,250).sort((a,b)=>(a.c+a.r)-(b.c+b.r)||a.id.localeCompare(b.id));
 for(const item of items){
  const info=furniture(ctx,geo,item,item.id===opts.selectedId);
  if(info)hits.push(info);
 }
 return {...geo,hits,view:'isometric',floor:scene?.floor||1};
}
function tileAt(geo,x,y){
 const u=(x-geo.ox)/HALF_W,v=(y-geo.oy)/HALF_H;
 const c=Math.floor((u+v)/2),r=Math.floor((v-u)/2);
 return c>=0&&r>=0&&c<geo.w&&r<geo.d?{c,r}:null;
}
function insidePolygon(points,x,y){
 let inside=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const a=points[i],b=points[j];
  if((a[1]>y)!==(b[1]>y)&&x<((b[0]-a[0])*(y-a[1]))/(b[1]-a[1])+a[0])
   inside=!inside;
 }
 return inside;
}
function pick(geometry,x,y,{preferFloor=false}={}){
 if(!geometry)return null;
 if(!preferFloor){
  // Bounding boxes of a 112px actor and 70px WC overlap several tiles.
  // Hit-test the actual drawn furniture polygons, not their giant bounds.
  for(let i=geometry.hits.length-1;i>=0;i--){
   const h=geometry.hits[i];
   if(x<h.minX||x>h.maxX||y<h.minY||y>h.maxY)continue;
   if(h.polygons?.some(poly=>insidePolygon(poly,x,y)))
    return {c:h.c,r:h.r,itemId:h.id};
  }
 }
 const t=tileAt(geometry,x,y);
 return t?{...t,itemId:null}:null;
}
function pointer(canvas,event,geometry,opts={}){
 const box=canvas.getBoundingClientRect();
 if(!box.width||!box.height)return null;
 const x=(event.clientX-box.left)*canvas.width/box.width;
 const y=(event.clientY-box.top)*canvas.height/box.height;
 return pick(geometry,x,y,opts);
}
g.VLInteriorIso=Object.freeze({version:'v10-furniture-docking',tilePixels:Object.freeze([64,32]),
 bounds,point,pick,pointer,draw,drawFurniture:furniture,tileAt,itemFootprint,
 fixtureRotation,fixturePoint,actionAnchor,drawSeatForeground,insidePolygon,
 ACTOR_SCALE,WC_SEAT_Z,WC_TANK_Z,WALL});
})(window);
