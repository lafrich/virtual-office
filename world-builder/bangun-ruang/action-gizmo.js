/* Bangun Ruang — on-canvas Cinema4D-style action transform gizmo.
 * This is a 2D isometric PIXEL editor, not a 3D mesh manipulator:
 * X/Y arrows translate the actor in screen pixels; the ring selects one
 * of the four native V6B facings, so it never distorts pixel artwork.
 */
(function(root,factory){"use strict";
 const api=factory();
 if(typeof module==="object"&&module.exports)module.exports=api;
 if(root)root.VLActionGizmo=api;
})(typeof window!=="undefined"?window:null,function(){"use strict";
 const ORDER=Object.freeze(["se","sw","nw","ne"]);
 const LENGTH=72,RADIUS=54,GRAB=17;
 const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const point=(x,y)=>({x,y});
 const normalizeSnap=n=>[1,4,8].includes(Number(n))?Number(n):1;
 const snap=(n,step=1)=>Math.round(Number(n||0)/normalizeSnap(step))*normalizeSnap(step);
 const facing=(direction,base="sw")=>ORDER.includes(direction)?direction:
  ORDER.includes(base)?base:"sw";
 const rotate=(direction,base,steps=1)=>{
  const i=ORDER.indexOf(facing(direction,base));
  const delta=((Math.round(steps)||0)%4+4)%4;
  return ORDER[(i+delta)%4];
 };
 const degrees=(direction,base)=>((ORDER.indexOf(facing(direction,base))-
  ORDER.indexOf(facing(base,"sw"))+4)%4)*90;
 function center(foot,pose){
  const horizontal=["sleep","lie","sleep_bed_right","sleep_bed_left"].includes(pose);
  return point(foot.x,foot.y-(horizontal?18:44));
 }
 function hit(center,p,mode="move"){
  if(!center||!p)return null;
  const d=dist(center,p);
  if(mode==="rotate"){
   if(Math.abs(d-RADIUS)<GRAB+6||d<GRAB+7)return "rotate";
   return null;
  }
  // Axis handles must win against the ring at their intersections.
  // Otherwise attempting to move X/Y accidentally rotates the actor.
  if(p.x>=center.x+13&&p.x<=center.x+LENGTH+20&&
      Math.abs(p.y-center.y)<GRAB)return "x";
  if(p.y<=center.y-13&&p.y>=center.y-LENGTH-20&&
      Math.abs(p.x-center.x)<GRAB)return "y";
  if(Math.abs(d-RADIUS)<GRAB&&d>RADIUS-GRAB)return "rotate";
  if(d<=GRAB+7)return "xy";
  // Dragging anywhere on the actor's body also moves it, on touch.
  if(p.x>=center.x-38&&p.x<=center.x+40&&
     p.y>=center.y-48&&p.y<=center.y+33)return "xy";
  return null;
 }
 function dragged(base,handle,dx,dy,step=1){
  return {...base,
   x:handle==="y"?base.x:snap(base.x+dx,step),
   y:handle==="x"?base.y:snap(base.y+dy,step)};
 }
 function rotateGesture(base,start,current,baseDirection){
  const a=Math.atan2(start.y-base.center.y,start.x-base.center.x);
  const b=Math.atan2(current.y-base.center.y,current.x-base.center.x);
  let delta=b-a;
  if(delta>Math.PI)delta-=Math.PI*2;
  if(delta< -Math.PI)delta+=Math.PI*2;
  return rotate(base.direction,baseDirection,Math.round(delta/(Math.PI/2)));
 }
 function draw(ctx,origin,options={}){
  if(!origin||typeof ctx?.beginPath!=="function")return;
  const active=options.mode==="rotate"?"rotate":"move",selected=options.hot||"";
  const x=origin.x,y=origin.y;
  const line=(ax,ay,bx,by,color,width=3)=>{
   ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;
   ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
  };
  ctx.save();
  ctx.shadowColor="rgba(0,0,0,.45)";ctx.shadowBlur=2;
  ctx.fillStyle="rgba(8,20,39,.55)";
  ctx.beginPath();ctx.arc(x,y,21,0,Math.PI*2);ctx.fill();
  // Move arrows — red X, green Y; enlarged grab targets for phones.
  line(x,y,x+LENGTH,y,"#e44f51",selected==="x"?6:4);
  line(x+LENGTH,y,x+LENGTH-12,y-7,"#e44f51",4);
  line(x+LENGTH,y,x+LENGTH-12,y+7,"#e44f51",4);
  line(x,y,x,y-LENGTH,"#55c68a",selected==="y"?6:4);
  line(x,y-LENGTH,x-7,y-LENGTH+12,"#55c68a",4);
  line(x,y-LENGTH,x+7,y-LENGTH+12,"#55c68a",4);
  ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);
  ctx.fillStyle=selected==="xy"?"#fff4b8":"#e9f1ff";ctx.fill();
  ctx.lineWidth=2;ctx.strokeStyle="#26476e";ctx.stroke();
  // Rotate ring is a non-destructive sprite-facing control (4 × 90°).
  ctx.beginPath();ctx.arc(x,y,RADIUS,0,Math.PI*2);
  ctx.lineWidth=selected==="rotate"?6:active==="rotate"?4:2.4;
  ctx.strokeStyle=active==="rotate"?"#f0be54":"rgba(119,173,255,.8)";
  ctx.stroke();
  const angle=(degrees(options.direction,options.baseDirection)||0)*Math.PI/180;
  const px=x+Math.cos(angle)*RADIUS,py=y+Math.sin(angle)*RADIUS;
  ctx.beginPath();ctx.arc(px,py,8,0,Math.PI*2);
  ctx.fillStyle="#f0be54";ctx.fill();ctx.lineWidth=2;
  ctx.strokeStyle="#294666";ctx.stroke();
  ctx.font="bold 11px monospace";ctx.textAlign="center";
  ctx.fillStyle="#fff";
  ctx.fillText("X",x+LENGTH+13,y+4);
  ctx.fillText("Y",x,y-LENGTH-8);
  ctx.fillText("↻",x-RADIUS-13,y+4);
  ctx.restore();
 }
 // Furniture uses its own gizmo: Move X/Y/XY plus discrete mirror handles.
 // No rotation ring. Flip handles are intentionally generous for touch input.
 const O_LEN=55,O_GRAB=17;
 function objectHandles(origin){
  return {x:{x:origin.x+O_LEN,y:origin.y},
   y:{x:origin.x,y:origin.y-O_LEN},
   flipX:{x:origin.x-O_LEN,y:origin.y},
   flipY:{x:origin.x,y:origin.y+O_LEN}};
 }
 function hitObject(origin,p){
  if(!origin||!p)return null;
  const h=objectHandles(origin);
  if(dist(p,h.flipX)<=O_GRAB+3)return 'flipX';
  if(dist(p,h.flipY)<=O_GRAB+3)return 'flipY';
  if(p.x>=origin.x+12&&p.x<=h.x.x+O_GRAB&&Math.abs(p.y-origin.y)<=O_GRAB)return 'x';
  if(p.y<=origin.y-12&&p.y>=h.y.y-O_GRAB&&Math.abs(p.x-origin.x)<=O_GRAB)return 'y';
  if(dist(p,origin)<=O_GRAB+6)return 'xy';
  return null;
 }
 function drawObject(ctx,origin,options={}){
  if(!origin||!ctx?.beginPath)return;
  const h=objectHandles(origin),hot=options.hot||'';
  const axis=(end,color,label)=>{
   ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=4;
   ctx.moveTo(origin.x,origin.y);ctx.lineTo(end.x,end.y);ctx.stroke();
   ctx.beginPath();ctx.arc(end.x,end.y,9,0,Math.PI*2);
   ctx.fillStyle=color;ctx.fill();
   ctx.font='bold 11px monospace';ctx.textAlign='center';
   ctx.fillStyle='#fff';ctx.fillText(label,end.x,end.y+4);
  };
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=2;
  axis(h.x,'#cf464c','X');
  axis(h.y,'#289e65','Y');
  ctx.beginPath();ctx.arc(origin.x,origin.y,12,0,Math.PI*2);
  ctx.fillStyle=hot==='xy'?'#fff1a2':'#f8fbff';ctx.fill();
  ctx.strokeStyle='#1a3b60';ctx.lineWidth=2;ctx.stroke();
  for(const [key,label] of [['flipX','H'],['flipY','V']]){
   const p=h[key],on=options[key]===true;
   ctx.beginPath();ctx.roundRect(p.x-15,p.y-15,30,30,5);
   ctx.fillStyle=on?'#e3ad43':'#385b85';ctx.fill();
   ctx.lineWidth=2;ctx.strokeStyle='#e9f2ff';ctx.stroke();
   ctx.fillStyle='#fff';ctx.font='bold 13px monospace';
   ctx.textAlign='center';ctx.fillText(label,p.x,p.y+5);
  }
  ctx.restore();
 }
 return Object.freeze({ORDER,LENGTH,RADIUS,GRAB,center,hit,snap,
  dragged,rotate,rotateGesture,facing,degrees,draw,normalizeSnap,drawObject,hitObject,objectHandles});
});