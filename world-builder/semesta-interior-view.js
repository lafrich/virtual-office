/* Shared interior camera, wall cutaway and sprite-scale helpers for Semesta
 * 3D interiors (play rooms, Bangun Ruang walk-in, future rooms). Preview only.
 * Iso math matches builder.js: direction (1, √(2/3), 1), ortho 2:1.
 */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.VLSemestaInteriorView=api;
})(typeof window!=='undefined'?window:typeof globalThis!=='undefined'?globalThis:null,function(root){
'use strict';
const PIXEL_WORLD=Math.SQRT2/64, VERTICAL_COMP=2/Math.sqrt(3);
const TILE_PX=64, WALL_PX=128;
const WALL_HEIGHT=WALL_PX*PIXEL_WORLD*VERTICAL_COMP;
const ISO_DIRECTION={x:1,y:Math.sqrt(2/3),z:1};
const MIN_VIEW=8, DEFAULT_PAD=1.22;
const ART_ALIAS=Object.freeze({
 table:'dining_table',counter:'food_vitrine',shelf:'dish_rack'
});
const EAT_SPOTS=Object.freeze(['dining_table','food_vitrine','cashier','table','counter']);

function num(v,d){const n=Number(v);return Number.isFinite(n)?n:(d??0);}
function spriteSize(pixelW,pixelH){
 const w=num(pixelW,0)*PIXEL_WORLD,h=num(pixelH,0)*PIXEL_WORLD*VERTICAL_COMP;
 return {w,h};
}
function normalizeDir(d){
 const x=num(d?.x,ISO_DIRECTION.x),y=num(d?.y,ISO_DIRECTION.y),z=num(d?.z,ISO_DIRECTION.z);
 const len=Math.hypot(x,y,z)||1;return {x:x/len,y:y/len,z:z/len};
}
function isoAxes(dir){
 const d=normalizeDir(dir);
 const z={x:d.x,y:d.y,z:d.z};
 const xr=d.z,xz=-d.x,xlen=Math.hypot(xr,xz)||1;
 const x={x:xr/xlen,y:0,z:xz/xlen};
 const y={x:z.y*x.z-z.z*x.y,y:z.z*x.x-z.x*x.z,z:z.x*x.y-z.y*x.x};
 const yl=Math.hypot(y.x,y.y,y.z)||1;
 y.x/=yl;y.y/=yl;y.z/=yl;
 return {x,y,z};
}
function project(point,focus,axes){
 const ax=axes||isoAxes();
 const rx=num(point.x,0)-num(focus.x,0);
 const ry=num(point.y,0)-num(focus.y,0);
 const rz=num(point.z,0)-num(focus.z,0);
 return {x:rx*ax.x.x+ry*ax.x.y+rz*ax.x.z,y:rx*ax.y.x+ry*ax.y.y+rz*ax.y.z};
}
function unprojectGround(dCamX,dCamY,axes){
 const ax=axes||isoAxes();
 const xx=ax.x.x,xz=ax.x.z,yx=ax.y.x,yz=ax.y.z;
 const det=xx*yz-xz*yx;
 if(Math.abs(det)<1e-9)return {x:0,z:0};
 // cam = (-dot(F,x_hat), -dot(F,y_hat)) for F=(fx,0,fz)
 // -xx fx - xz fz = dCamX
 // -yx fx - yz fz = dCamY
 const fx=-(dCamX*yz-dCamY*xz)/det;
 const fz=-(-dCamX*yx+dCamY*xx)/det;
 return {x:fx,z:fz};
}
function farWalls(dir){
 const d=normalizeDir(dir);
 // Camera sits at focus+dir and looks toward -dir, so far walls are the
 // minimum faces along the look axis. Never draw the near (camera-side) walls.
 return {
  back:d.z>=0,  // min Z is far when camera looks toward -Z
  front:d.z<0,
  left:d.x>=0,  // min X is far when camera looks toward -X
  right:d.x<0
 };
}
function roomPoints(origin,width,depth,props,wallHeight){
 const x0=num(origin?.x,0),z0=num(origin?.z,0);
 const w=num(width,8),d=num(depth,6),wh=num(wallHeight,WALL_HEIGHT);
 const pts=[
  {x:x0,y:0,z:z0},{x:x0+w,y:0,z:z0},{x:x0,y:0,z:z0+d},{x:x0+w,y:0,z:z0+d},
  {x:x0,y:wh,z:z0},{x:x0+w,y:wh,z:z0},{x:x0,y:wh,z:z0+d},{x:x0+w,y:wh,z:z0+d}
 ];
 for(const p of props||[]){
  const h=num(p.h,p.height,0);
  pts.push({x:num(p.x,0),y:0,z:num(p.z,0)});
  pts.push({x:num(p.x,0),y:h,z:num(p.z,0)});
 }
 return pts;
}
function frustum(viewSize,aspect){
 const vs=Math.max(MIN_VIEW,num(viewSize,MIN_VIEW)),asp=Math.max(.3,num(aspect,16/9));
 return {viewSize:vs,aspect:asp,halfW:vs*asp/2,halfH:vs/2};
}
function inFrustum(cam,fr,eps){
 const e=num(eps,0.02);
 return Math.abs(cam.x)<=fr.halfW+e&&Math.abs(cam.y)<=fr.halfH+e;
}
function clippedProps(props,focus,viewSize,aspect,dir){
 const ax=isoAxes(dir),fr=frustum(viewSize,aspect),out=[];
 for(const p of props||[]){
  const top=project({x:p.x,y:num(p.h,p.height,0),z:p.z},focus,ax);
  const foot=project({x:p.x,y:0,z:p.z},focus,ax);
  if(!inFrustum(top,fr)||!inFrustum(foot,fr))
   out.push({id:p.id||p.assetId||p.name||'prop',top,foot,reason:!inFrustum(top,fr)&&(top.y>fr.halfH?'frustum-top':'frustum')});
 }
 return out;
}
function fitInteriorCamera(opts){
 opts=opts||{};
 const origin=opts.origin||{x:0,z:0},width=num(opts.width,8),depth=num(opts.depth,6);
 const aspect=Math.max(.3,num(opts.aspect,16/9)),pad=num(opts.pad,DEFAULT_PAD);
 const inset={left:num(opts.inset?.left,0),right:num(opts.inset?.right,0),
  top:num(opts.inset?.top,0),bottom:num(opts.inset?.bottom,0)};
 const dir=opts.direction,ax=isoAxes(dir);
 const focus={x:num(origin.x,0)+width/2,y:0,z:num(origin.z,0)+depth/2};
 const pts=roomPoints(origin,width,depth,opts.props,opts.wallHeight);
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 for(const p of pts){
  const c=project(p,focus,ax);
  if(c.x<minX)minX=c.x;if(c.x>maxX)maxX=c.x;
  if(c.y<minY)minY=c.y;if(c.y>maxY)maxY=c.y;
 }
 const visW=Math.max(.35,1-inset.left-inset.right);
 const visH=Math.max(.35,1-inset.top-inset.bottom);
 const bw=Math.max(.01,maxX-minX),bh=Math.max(.01,maxY-minY);
 let viewSize=Math.max(MIN_VIEW,pad*Math.max(bh/visH,bw/(aspect*visW)));
 // Moving focus by F changes cam' = cam - F·axes. To place the bbox
 // center on the visible (non-HUD) center, pass (vis - cur) into
 // unprojectGround — the opposite sign used to shove the room under the HUD.
 const visCx=viewSize*aspect*(inset.left-inset.right)/2;
 const visCy=viewSize*(inset.bottom-inset.top)/2;
 const curCx=(minX+maxX)/2,curCy=(minY+maxY)/2;
 const shift=unprojectGround(visCx-curCx,visCy-curCy,ax);
 focus.x+=shift.x;focus.z+=shift.z;
 const props=opts.props||[];
 const insetBox=vs=>{
  const fr=frustum(vs,aspect);
  return {minX:-fr.halfW+vs*aspect*inset.left,maxX:fr.halfW-vs*aspect*inset.right,
          minY:-fr.halfH+vs*inset.bottom,maxY:fr.halfH-vs*inset.top};
 };
 const overflow=(vs)=>{
  const box=insetBox(vs);
  const pts=roomPoints(origin,width,depth,props,opts.wallHeight);
  for(const p of pts){
   const c=project(p,focus,ax);
   if(c.x<box.minX-0.02||c.x>box.maxX+0.02||c.y<box.minY-0.02||c.y>box.maxY+0.02)return true;
  }
  return false;
 };
 let guard=0;
 while(overflow(viewSize)&&guard++<8)viewSize*=1.12;
 const clipped=clippedProps(props,focus,viewSize,aspect,dir);
 return {focus,viewSize,clipped,wallHeight:WALL_HEIGHT,aspect};
}
function playInset(aspect){
 // Desktop play HUD is a left column (~34% of 1280). On a tall phone the
 // same HUD is a top overlay, not a side column — using the desktop left
 // inset would shrink the room into a postage stamp in the lower-right gap.
 if(num(aspect,16/9)<0.85)return {left:.06,right:.05,top:.16,bottom:.20};
 return {left:.34,right:.04,top:.05,bottom:.14};
}

function isoBillboardYaw(){return Math.PI/4;}
function artId(assetId){return ART_ALIAS[assetId]||assetId;}
function eatSpot(assetId){return EAT_SPOTS.includes(assetId)||EAT_SPOTS.includes(artId(assetId));}

function bakeWallTexture(side,geo,paint){
 if(typeof document==='undefined'||!paint?.walls)return null;
 const tiles=side==='back'?num(geo.width,8):num(geo.depth,6);
 const texW=Math.max(64,Math.round(tiles*TILE_PX)),texH=WALL_PX;
 const can=document.createElement('canvas');can.width=texW;can.height=texH;
 const ctx=can.getContext('2d');ctx.imageSmoothingEnabled=false;
 ctx.fillStyle=side==='back'?'#d4c8ae':'#c3ad8d';ctx.fillRect(0,0,texW,texH);
 const WALL=WALL_PX,w=num(geo.width,8),d=num(geo.depth,6);
 const point=(g,c,r,z=0)=>{
  const u=num(c,0),v=num(r,0),zz=num(z,0);
  // Paint draws both walls in one iso pass. Keep only the face we are baking
  // so mid-room props (fan, etc.) do not collapse into a smear on the UV.
  if(side==='back'){
   if(Math.abs(v)>0.25)return [-20,-20];
   return [(u/Math.max(.01,w))*texW,(1-zz/WALL)*texH];
  }
  if(Math.abs(u)>0.25)return [-20,-20];
  return [(v/Math.max(.01,d))*texW,(1-zz/WALL)*texH];
 };
 const polygon=(c,verts,color)=>{
  if(!verts.length)return;
  let minY=Math.floor(Math.min(...verts.map(v=>v[1])));
  let maxY=Math.ceil(Math.max(...verts.map(v=>v[1])));
  minY=Math.max(0,minY);maxY=Math.min(texH,maxY);
  c.fillStyle=color;
  for(let y=minY;y<maxY;y++){
   const crosses=[];
   for(let i=0;i<verts.length;i++){
    const a=verts[i],b=verts[(i+1)%verts.length],yy=y+.5;
    if((a[1]<=yy&&b[1]>yy)||(b[1]<=yy&&a[1]>yy))
     crosses.push(a[0]+(yy-a[1])*(b[0]-a[0])/(b[1]-a[1]));
   }
   crosses.sort((a,b)=>a-b);
   for(let n=0;n+1<crosses.length;n+=2){
    const x0=Math.ceil(crosses[n]-.5),x1=Math.ceil(crosses[n+1]-.5);
    if(x1>x0)c.fillRect(x0,y,x1-x0,1);
   }
  }
 };
 const line=(c,x0,y0,x1,y1,color)=>{
  x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
  const dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;
  let err=dx+dy;c.fillStyle=color;
  for(let i=0;i<4096;i++){
   if(x0>=0&&y0>=0&&x0<texW&&y0<texH)c.fillRect(x0,y0,1,1);
   if(x0===x1&&y0===y1)break;
   const twice=2*err;
   if(twice>=dy){err+=dy;x0+=sx;}
   if(twice<=dx){err+=dx;y0+=sy;}
  }
 };
 const box=()=>{};
 try{paint.walls(ctx,{w,d,width:w,depth:d},{point,polygon,line,box});}catch(_e){return null;}
 return can;
}
function warnIfClipped(clipped,tag){
 if(!clipped?.length||typeof console==='undefined')return;
 const names=clipped.map(c=>c.id+(c.reason?(' '+c.reason):'')).join(', ');
 console.warn('[NJH interior] MUST: no prop may be clipped ('+(tag||'view')+'): '+names+
  '. Floor/walls/ground must not write depth over sprites; camera must frame every prop; footprints stay inside the room.');
}

/* MUST: floor, far walls and the unbounded ground never depth-occlude a prop
 * sprite. Iso billboards are vertical; the PNG's ground diamond hangs below
 * the foot, so a depth-writing floor cuts them on a diagonal. */
const FLOOR_Y=0.045, GROUND_Y=0.002, SPRITE_LIFT=0.04;
const DRAW_POLICY=Object.freeze({
 floor:{depthWrite:false,depthTest:true,renderOrder:0,y:FLOOR_Y},
 walls:{depthWrite:false,depthTest:true,renderOrder:0},
 ground:{depthWrite:false,depthTest:true,y:GROUND_Y},
 sprites:{depthWrite:true,depthTest:true,renderOrder:1,alphaTest:.05,yaw:Math.PI/4}
});

function snapFootprint(c,r,fw,fd,width,depth){
 const w=Math.max(1,num(width,8)),d=Math.max(1,num(depth,6));
 let tw=Math.max(.01,num(fw,1)),td=Math.max(.01,num(fd,1));
 if(tw>w)tw=w;if(td>d)td=d;
 let nc=num(c,0),nr=num(r,0);
 if(nc<0)nc=0;if(nr<0)nr=0;
 if(nc+tw>w)nc=w-tw;if(nr+td>d)nr=d-td;
 return {c:nc,r:nr,fw:tw,fd:td,inside:nc>=-1e-9&&nr>=-1e-9&&nc+tw<=w+1e-9&&nr+td<=d+1e-9};
}
function footprintInside(c,r,fw,fd,width,depth){
 return snapFootprint(c,r,fw,fd,width,depth).inside&&
  Math.abs(snapFootprint(c,r,fw,fd,width,depth).c-num(c,0))<1e-6&&
  Math.abs(snapFootprint(c,r,fw,fd,width,depth).r-num(r,0))<1e-6;
}
function rotY(x,z,yaw){
 const c=Math.cos(yaw),s=Math.sin(yaw);
 return {x:x*c+z*s,z:-x*s+z*c};
}
function catalogView(catalog,assetId,rotation){
 const items=catalog?.items||catalog||{};
 const typ=items[artId(assetId)]||items[assetId]||{};
 const dir=['sw','se','ne','nw'][(Math.round((((Number(rotation)||0)%360+360)%360)/90)%4)]||'sw';
 return typ[dir]||typ.sw||typ.se||null;
}
function spriteQuad(opts){
 opts=opts||{};
 const size=opts.size||[64,64];
 const pivot=opts.pivot||[size[0]/2,size[1]*0.8];
 const width=size[0]*PIXEL_WORLD,height=size[1]*PIXEL_WORLD*VERTICAL_COMP;
 const py=num(pivot[1],size[1]*0.8)/Math.max(1,size[1]);
 const px=(size[0]/2-num(pivot[0],size[0]/2))/Math.max(1,size[0])*width;
 const yaw=num(opts.yaw,DRAW_POLICY.sprites.yaw);
 const planeY=height*(py-.5)+SPRITE_LIFT;
 const rootX=num(opts.x,0),rootZ=num(opts.z,0);
 const corners=[];
 for(const lx of [-width/2,width/2])for(const ly of [-height/2,height/2]){
  const r=rotY(lx+px,0,yaw);
  corners.push({x:rootX+r.x,y:planeY+ly,z:rootZ+r.z});
 }
 return {x:rootX,z:rootZ,width,height,px,planeY,yaw,corners,bottomY:planeY-height/2,topY:planeY+height/2};
}
function occludersFromPolicy(policy,room){
 policy=policy||DRAW_POLICY;
 const origin=room?.origin||{x:0,z:0},w=num(room?.width,8),d=num(room?.depth,6);
 const list=[];
 if(policy.floor?.depthWrite)list.push({id:'floor',kind:'floor',y:num(policy.floor.y,FLOOR_Y),
  x0:origin.x,x1:origin.x+w,z0:origin.z,z1:origin.z+d});
 if(policy.ground?.depthWrite)list.push({id:'ground',kind:'ground',y:num(policy.ground.y,GROUND_Y)});
 if(policy.walls?.depthWrite){
  const far=farWalls(room?.direction);
  if(far.back)list.push({id:'wall-back',kind:'wall-z',z:origin.z-0.04});
  if(far.front)list.push({id:'wall-front',kind:'wall-z',z:origin.z+d+0.04});
  if(far.left)list.push({id:'wall-left',kind:'wall-x',x:origin.x-0.04});
  if(far.right)list.push({id:'wall-right',kind:'wall-x',x:origin.x+w+0.04});
 }
 return list;
}
function pointHiddenBy(p,occ,dir){
 const d=normalizeDir(dir);
 if(occ.kind==='floor'||occ.kind==='ground'){
  if(p.y>=occ.y-1e-4)return false;
  if(occ.x0!=null&&(p.x<occ.x0-0.02||p.x>occ.x1+0.02||p.z<occ.z0-0.02||p.z>occ.z1+0.02))return false;
  return true;
 }
 // Wall hides a point on the far side (away from the camera).
 if(occ.kind==='wall-z'){
  const wallIsFar=d.z>=0?occ.z<=(occ._originZ??occ.z):occ.z>=(occ._originZ??occ.z);
  if(!wallIsFar&&d.z>=0&&p.z<=occ.z)return true;
  if(!wallIsFar&&d.z<0&&p.z>=occ.z)return true;
  if(d.z>=0&&p.z<=occ.z)return true;
  if(d.z<0&&p.z>=occ.z)return true;
  return false;
 }
 if(occ.kind==='wall-x'){
  if(d.x>=0&&p.x<=occ.x)return true;
  if(d.x<0&&p.x>=occ.x)return true;
  return false;
 }
 return false;
}
function sampleQuad(quad,n){
 const pts=[],c=quad.corners;
 if(!c||c.length<4)return pts;
 // corners pushed in order (-w,-h), (-w,+h), (+w,-h), (+w,+h)
 const a=c[0],b=c[1],d=c[2],e=c[3];
 const N=Math.max(3,num(n,7));
 for(let i=0;i<N;i++)for(let j=0;j<N;j++){
  const u=i/(N-1),v=j/(N-1);
  // lerp from bottom-left a to top-left b to bottom-right d to top-right e
  const x=(1-u)*(1-v)*a.x+(1-u)*v*b.x+u*(1-v)*d.x+u*v*e.x;
  const y=(1-u)*(1-v)*a.y+(1-u)*v*b.y+u*(1-v)*d.y+u*v*e.y;
  const z=(1-u)*(1-v)*a.z+(1-u)*v*b.z+u*(1-v)*d.z+u*v*e.z;
  pts.push({x,y,z,u,v});
 }
 return pts;
}
function inspectPropClips(opts){
 opts=opts||{};
 const policy=opts.policy||DRAW_POLICY;
 const origin=opts.origin||{x:0,z:0};
 const width=num(opts.width,8),depth=num(opts.depth,6);
 const dir=opts.direction,aspect=num(opts.aspect,16/9);
 const focus=opts.focus,viewSize=opts.viewSize;
 const occluders=occludersFromPolicy(policy,{origin,width,depth,direction:dir});
 const out=[];
 for(const prop of opts.props||[]){
  const reasons=new Set();
  if(prop.footprint&&!footprintInside(prop.c,prop.r,prop.fw||prop.footprint[0],prop.fd||prop.footprint[1],width,depth))
   reasons.add('footprint-outside');
  const quad=prop.quad||spriteQuad(prop);
  if(Number.isFinite(viewSize)&&focus){
   const fr=frustum(viewSize,aspect);
   const ax=isoAxes(dir);
   for(const p of quad.corners){
    if(!inFrustum(project(p,focus,ax),fr)){reasons.add('frustum');break;}
   }
  }
  const samples=sampleQuad(quad,7);
  for(const p of samples){
   for(const occ of occluders){
    if(pointHiddenBy(p,occ,dir)){
     reasons.add(occ.kind==='ground'?'ground-depth':occ.kind==='floor'?'floor-depth':'wall-depth');
    }
   }
  }
  if(reasons.size)out.push({id:prop.id||prop.assetId||'prop',reasons:[...reasons],reason:[...reasons].join(',')});
 }
 return out;
}

return Object.freeze({
 PIXEL_WORLD,VERTICAL_COMP,WALL_PX,WALL_HEIGHT,TILE_PX,ISO_DIRECTION,MIN_VIEW,ART_ALIAS,EAT_SPOTS,
 FLOOR_Y,GROUND_Y,SPRITE_LIFT,DRAW_POLICY,
 spriteSize,isoAxes,project,unprojectGround,farWalls,roomPoints,frustum,inFrustum,
 clippedProps,fitInteriorCamera,playInset,isoBillboardYaw,artId,eatSpot,
 bakeWallTexture,warnIfClipped,
 snapFootprint,footprintInside,rotY,catalogView,spriteQuad,occludersFromPolicy,
 sampleQuad,inspectPropClips,pointHiddenBy
});
});
