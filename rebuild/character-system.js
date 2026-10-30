/* Virtual Office / Character System 01
 * Canonical 4-screen-direction flat character sprites.
 * 4 facing directions x [idle, stride A, passing, stride B].
 * Five independent interaction poses. Keeps a fallback to legacy canvas art.
 */
(function(global){
 'use strict';
 const DIRECTIONS=Object.freeze(['down','left','right','up']);
 const POSES=Object.freeze(['sit','sleep','bathe','toilet','work']);
 const FRAME={w:96,h:112,pivotX:48,pivotY:103,scale:.88};
 const sheetSrc='./assets/character_flat_sheet.svg';
 const posesSrc='./assets/character_flat_poses.svg';
 const sheets={walk:null,poses:null};
 const loaded={walk:false,poses:false};
 function load(which,src){
  if(typeof Image==='undefined')return;
  const pic=new Image();
  pic.onload=()=>{loaded[which]=pic.naturalWidth>0||pic.width>0};
  pic.onerror=()=>{loaded[which]=false};
  pic.src=src;
  sheets[which]=pic;
 }
 load('walk',sheetSrc);load('poses',posesSrc);
 function normalizeDirection(value){
  if(DIRECTIONS.includes(value))return value;
  return ({sw:'down',se:'right',nw:'up',ne:'left'})[value]||'down';
 }
 function screenDirection(x,y,last='down'){
  const old=normalizeDirection(last);
  if(!Number.isFinite(x)||!Number.isFinite(y))return old;
  const xx=Math.abs(x),yy=Math.abs(y);
  if(Math.max(xx,yy)<.15)return old;
  if(xx>yy*1.03)return x>0?'right':'left';
  if(yy>xx*1.03)return y>0?'down':'up';
  // Diagonal: maintain a direction instead of flickering on analog joystick noise.
  if(xx>yy)return x>0?'right':'left';
  return y>0?'down':'up';
 }
 function directionFromWorld(dx,dy,last='down'){
  // Current game projection: screenX=(worldX-worldY)*23,
  // screenY=(worldX+worldY)*11.5. Camera zoom cancels out for facing.
  return screenDirection((dx-dy)*23,(dx+dy)*11.5,last);
 }
 function frameIndex({moving=false,walk=0}={}){
  if(!moving)return 0;
  // Frame 0 is used exclusively for idle; walking cycles through 1/2/3.
  return 1+(Math.floor(Math.max(0,walk)*8)%3);
 }
 function animationKey({direction='down',moving=false,walk=0,pose=null}={}){
  if(POSES.includes(pose))return pose;
  return (moving?'walk_':'idle_')+normalizeDirection(direction);
 }
 function draw(ctx,point,zoom,opts={}){
  const pose=POSES.includes(opts.pose)?opts.pose:null;
  const kind=pose?'poses':'walk',img=sheets[kind];
  if(!loaded[kind]||!img||!ctx||!point)return false;
  const frame=pose?POSES.indexOf(pose):frameIndex(opts);
  const row=pose?0:DIRECTIONS.indexOf(normalizeDirection(opts.direction));
  const sx=frame*FRAME.w,sy=row*FRAME.h,sc=zoom*FRAME.scale;
  if(!Number.isFinite(sc)||sc<=0)return false;
  ctx.save();
  ctx.imageSmoothingEnabled=false;
  const bob=(opts.moving&&!pose&&frame===2)?1:0;
  const x=Math.round(point.x-FRAME.pivotX*sc);
  const y=Math.round(point.y-FRAME.pivotY*sc+bob*sc);
  ctx.drawImage(img,sx,sy,FRAME.w,FRAME.h,x,y,
    Math.round(FRAME.w*sc),Math.round(FRAME.h*sc));
  ctx.restore();
  return true;
 }
 global.VOCharacterSystem=Object.freeze({
  directions:DIRECTIONS,poses:POSES,frame:FRAME,
  normalizeDirection,screenDirection,directionFromWorld,frameIndex,animationKey,
  draw,ready:()=>({...loaded}),sheetPaths:Object.freeze({walk:sheetSrc,poses:posesSrc})
 });
})(window);
