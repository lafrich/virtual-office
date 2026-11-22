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


const CHAIR_IDS=new Set(['chair']);
const TABLE_IDS=new Set(['table','dining_table','counter','food_vitrine','cashier','desk','study_desk','workbench','registration_desk','checkout','laundry_counter']);
const FACE_VECS=[
 {dir:'sw',dc:-1,dr:1,rotation:0},
 {dir:'se',dc:1,dr:1,rotation:90},
 {dir:'ne',dc:1,dr:-1,rotation:180},
 {dir:'nw',dc:-1,dr:-1,rotation:270}
];
const DEFAULT_FOOT={
 chair:[1,1],table:[2,1],dining_table:[2,1],counter:[2,1],food_vitrine:[2,1],
 cashier:[2,1],desk:[2,1],study_desk:[2,1],workbench:[2,1],registration_desk:[2,1],
 checkout:[2,1],laundry_counter:[2,1]
};
function isChair(id){return CHAIR_IDS.has(id)||CHAIR_IDS.has(artId(id));}
function isTable(id){return TABLE_IDS.has(id)||TABLE_IDS.has(artId(id));}
function itemFootprint(item,catalog,types){
 const id=item.assetId||item.id||'';
 const typ=(catalog&&((catalog.items||catalog)[artId(id)]||(catalog.items||catalog)[id]))||(types&&(types[id]||types[artId(id)]))||{};
 const view=typ.sw||typ.se||typ;
 let fw=num(item.fw,num(item.w,num((view.footprint||DEFAULT_FOOT[artId(id)]||DEFAULT_FOOT[id]||[1,1])[0],1)));
 let fd=num(item.fd,num(item.d,num((view.footprint||DEFAULT_FOOT[artId(id)]||DEFAULT_FOOT[id]||[1,1])[1],1)));
 if((num(item.rotation,0)%180)===90){const t=fw;fw=fd;fd=t;}
 return [Math.max(.01,fw),Math.max(.01,fd)];
}
function coveredTiles(c,r,fw,fd){
 const out=[];
 for(let cc=Math.floor(c);cc<Math.ceil(c+fw-1e-9);cc++)
  for(let rr=Math.floor(r);rr<Math.ceil(r+fd-1e-9);rr++)out.push({c:cc,r:rr,key:cc+','+rr});
 return out;
}
function faceToward(fromC,fromR,toC,toR){
 const vx=toC-fromC,vz=toR-fromR;
 let best=FACE_VECS[0],dot=-1e9;
 for(const v of FACE_VECS){
  const d=v.dc*vx+v.dr*vz;
  if(d>dot+1e-9){dot=d;best=v;}
 }
 return best;
}
function sceneSize(scene){return {width:num(scene.width,num(scene.w,8)),depth:num(scene.depth,num(scene.d,6))};}
function entranceOf(scene){
 const {width,depth}=sceneSize(scene);
 const e=scene.entrance||{};
 return {c:Math.floor(num(e.c,width/2)),r:Math.floor(num(e.r,depth-1))};
}
function reservedPathTiles(scene){
  const {width,depth}=sceneSize(scene);
  const e=entranceOf(scene);
  const set=new Set([e.c+','+e.r]);
  const inwardR=e.r>=depth/2?e.r-1:e.r+1;
  if(inwardR>=0&&inwardR<depth)set.add(e.c+','+inwardR);
  return set;
}
function inspectChairTables(scene,opts){
 opts=opts||{};
 const catalog=opts.catalog||null,types=opts.types||null;
 const {width,depth}=sceneSize(scene);
 const items=scene.items||[];
 const issues=[];
 const tables=[];
 for(const it of items){
  if(!isTable(it.assetId))continue;
  const [fw,fd]=itemFootprint(it,catalog,types);
  const tiles=coveredTiles(num(it.c,0),num(it.r,0),fw,fd);
  tables.push({item:it,fw,fd,tiles,cx:num(it.c,0)+fw/2,cz:num(it.r,0)+fd/2});
 }
 const reserved=reservedPathTiles(scene);
 const occupied=new Set();
 for(const it of items){
  if(it.blocking===false||it.kind==='npc'||isChair(it.assetId))continue;
  const [fw,fd]=itemFootprint(it,catalog,types);
  for(const t of coveredTiles(num(it.c,0),num(it.r,0),fw,fd))occupied.add(t.key);
 }
 for(const it of items){
  if(!isChair(it.assetId))continue;
  const [fw,fd]=itemFootprint(it,catalog,types);
  const tiles=coveredTiles(num(it.c,0),num(it.r,0),fw,fd);
  const cx=num(it.c,0)+fw/2,cz=num(it.r,0)+fd/2;
  const id=it.id||(it.assetId+'@'+it.c+','+it.r);
  let paired=null,minEdge=1e9;
  for(const tb of tables){
   for(const a of tiles)for(const b of tb.tiles){
    const edge=Math.abs(a.c-b.c)+Math.abs(a.r-b.r);
    if(edge===1&&edge<minEdge){minEdge=edge;paired=tb;}
   }
  }
  if(!paired){
   issues.push({id,reason:'orphan',c:it.c,r:it.r,rotation:it.rotation,assetId:it.assetId});
   continue;
  }
  const face=faceToward(cx,cz,paired.cx,paired.cz);
  const rot=((num(it.rotation,0)%360)+360)%360;
  const matches=FACE_VECS.filter(v=>{
   const vx=paired.cx-cx,vz=paired.cz-cz;
   return Math.abs((v.dc*vx+v.dr*vz)-(face.dc*(paired.cx-cx)+face.dr*(paired.cz-cz)))<1e-9;
  }).map(v=>((v.rotation%360)+360)%360);
  if(!matches.includes(rot)&&rot!==face.rotation){
   issues.push({id,reason:'wrong-facing',c:it.c,r:it.r,rotation:it.rotation,expected:face.rotation,assetId:it.assetId,dir:face.dir});
  }
  for(const t of tiles){
   if(reserved.has(t.key))
    issues.push({id,reason:'blocked-path',c:it.c,r:it.r,rotation:it.rotation,assetId:it.assetId,tile:t.key});
  }
 }
 // Path: chairs must not sit on the door aisle, and must not cut off every
 // approach to a table. Other furniture already on a guessed entrance is not
 // a chair-layout failure. Standing next to a seated chair counts as reaching
 // that table.
 const chairs=items.filter(it=>isChair(it.assetId));
 if(tables.length&&chairs.length){
  const chairTiles=new Set();
  for(const it of chairs){
   const [fw,fd]=itemFootprint(it,catalog,types);
   for(const t of coveredTiles(num(it.c,0),num(it.r,0),fw,fd))chairTiles.add(t.key);
  }
  const blocked=new Set([...occupied,...chairTiles]);
  const e=entranceOf(scene);
  const inBounds=(c,r)=>c>=0&&r>=0&&c<width&&r<depth;
  const walkable=(c,r)=>inBounds(c,r)&&!blocked.has(c+','+r);
  // Only flag the door tile when a chair is what occupies it.
  if(chairTiles.has(e.c+','+e.r))
   issues.push({id:'entrance',reason:'blocked-path',c:e.c,r:e.r});
  else if(walkable(e.c,e.r)){
   const q=[e.c+','+e.r],seen=new Set([e.c+','+e.r]);
   while(q.length){
    const [c,r]=q.shift().split(',').map(Number);
    for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){
     const nc=c+dc,nr=r+dr,k=nc+','+nr;
     if(!walkable(nc,nr)||seen.has(k))continue;
     seen.add(k);q.push(k);
    }
   }
   const approach=new Set();
   for(const tb of tables){
    for(const t of tb.tiles){
     for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const k=(t.c+dc)+','+(t.r+dr);
      if(inBounds(t.c+dc,t.r+dr))approach.add(k);
     }
    }
   }
   for(const key of chairTiles){
    const [c,r]=key.split(',').map(Number);
    for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){
     const k=(c+dc)+','+(r+dr);
     if(inBounds(c+dc,r+dr))approach.add(k);
    }
   }
   const reachable=[...approach].some(k=>seen.has(k));
   if(!reachable)issues.push({id:'path',reason:'blocked-path',c:e.c,r:e.r,detail:'no walkable path from entrance to a table'});
  }
 }
 return {ok:issues.length===0,issues};
}
function pairChairs(scene,opts){
 opts=opts||{};
 const catalog=opts.catalog||null,types=opts.types||null;
 const {width,depth}=sceneSize(scene);
 const next={...scene,items:(scene.items||[]).map(it=>({...it}))};
 const items=next.items;
 const reserved=reservedPathTiles(next);
 const occupied=new Set();
 const tables=[];
 for(const it of items){
  const [fw,fd]=itemFootprint(it,catalog,types);
  if(isTable(it.assetId)){
   const tiles=coveredTiles(num(it.c,0),num(it.r,0),fw,fd);
   tables.push({item:it,fw,fd,tiles,cx:num(it.c,0)+fw/2,cz:num(it.r,0)+fd/2});
  }
  if(isChair(it.assetId)||it.kind==='npc'||it.blocking===false)continue;
  for(const t of coveredTiles(num(it.c,0),num(it.r,0),fw,fd))occupied.add(t.key);
 }
 const seats=[];
 const seenSeat=new Set();
 for(const tb of tables){
  for(const t of tb.tiles){
   for(const [dc,dr] of [[0,1],[0,-1],[1,0],[-1,0]]){
    const c=t.c+dc,r=t.r+dr,k=c+','+r;
    if(c<0||r<0||c>=width||r>=depth||occupied.has(k)||reserved.has(k)||seenSeat.has(k))continue;
    seenSeat.add(k);
    seats.push({c,r,cx:c+0.5,cz:r+0.5,table:tb});
   }
  }
 }
 const used=new Set();
 for(const ch of items.filter(it=>isChair(it.assetId))){
  const [fw,fd]=itemFootprint(ch,catalog,types);
  const tiles=coveredTiles(num(ch.c,0),num(ch.r,0),fw,fd);
  let paired=null;
  for(const tb of tables){
   for(const a of tiles)for(const b of tb.tiles){
    if(Math.abs(a.c-b.c)+Math.abs(a.r-b.r)===1){paired=tb;break;}
   }
   if(paired)break;
  }
  if(!paired){
   let best=null,bestD=1e9;
   for(const s of seats){
    if(used.has(s.c+','+s.r))continue;
    const dist=Math.hypot(s.c-num(ch.c,0),s.r-num(ch.r,0));
    if(dist<bestD){bestD=dist;best=s;}
   }
   if(best){
    ch.c=best.c;ch.r=best.r;paired=best.table;used.add(best.c+','+best.r);
   }
  }else{
   for(const t of tiles)used.add(t.key);
  }
  if(!paired)continue;
  const face=faceToward(num(ch.c,0)+fw/2,num(ch.r,0)+fd/2,paired.cx,paired.cz);
  ch.rotation=face.rotation;
 }
 return next;
}

return Object.freeze({
 PIXEL_WORLD,VERTICAL_COMP,WALL_PX,WALL_HEIGHT,TILE_PX,ISO_DIRECTION,MIN_VIEW,ART_ALIAS,EAT_SPOTS,
 FLOOR_Y,GROUND_Y,SPRITE_LIFT,DRAW_POLICY,
 spriteSize,isoAxes,project,unprojectGround,farWalls,roomPoints,frustum,inFrustum,
 clippedProps,fitInteriorCamera,playInset,isoBillboardYaw,artId,eatSpot,
 bakeWallTexture,warnIfClipped,
 snapFootprint,footprintInside,rotY,catalogView,spriteQuad,occludersFromPolicy,
 sampleQuad,inspectPropClips,pointHiddenBy,
 CHAIR_IDS,TABLE_IDS,itemFootprint,coveredTiles,faceToward,inspectChairTables,pairChairs
});
});
