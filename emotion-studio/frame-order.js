/* Emotion Studio timeline / native four-view atlas order.
 * A frame is one 64x448 vertical slice: SE, SW, NE, NW stay together.
 * Pure order helpers can be unit tested without DOM or changing the format.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.EmotionFrameOrder=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const WIDTH=64,HEIGHT=448,MAX=48;
 const valid=(n,i)=>Number.isInteger(i)&&i>=0&&i<n;
 function move(count,from,to){
  if(!Number.isInteger(count)||count<1||count>MAX||!valid(count,from)||!valid(count,to))
   throw Error('Invalid emotion frame move');
  const order=Array.from({length:count},(_,i)=>i);
  order.splice(to,0,order.splice(from,1)[0]);
  return order;
 }
 function fromSlot(count,from,slot){
  if(!Number.isInteger(slot)||slot<0||slot>count||!valid(count,from))
   throw Error('Invalid timeline insertion slot');
  return move(count,from,Math.min(count-1,slot>from?slot-1:slot));
 }
 function duplicateAfter(count,source){
  if(!Number.isInteger(count)||count<1||count>=MAX||!valid(count,source))
   throw Error('Cannot duplicate this frame (maximum '+MAX+')');
  const order=Array.from({length:count},(_,i)=>i);
  order.splice(source+1,0,source);
  return order;
 }
 function compose(atlas,order,createCanvas){
  if(!atlas||typeof createCanvas!=='function'||!Array.isArray(order)||
     !Number.isInteger(atlas.width)||atlas.height!==HEIGHT||
     atlas.width%WIDTH!==0||order.length<1||order.length>MAX||
     !order.every(i=>valid(atlas.width/WIDTH,i)))
    throw Error('Invalid 4-view emotion atlas reorder');
  const out=createCanvas();out.width=WIDTH*order.length;out.height=HEIGHT;
  const ctx=out.getContext('2d',{alpha:true});
  if(!ctx)throw Error('Unable to create timeline atlas canvas');
  ctx.imageSmoothingEnabled=false;
  order.forEach((source,index)=>{
   // Copy all 4 x 112px views, including transparent pixels, pixel-perfect.
   ctx.drawImage(atlas,source*WIDTH,0,WIDTH,HEIGHT,index*WIDTH,0,WIDTH,HEIGHT);
  });
  return out;
 }
 return Object.freeze({WIDTH,HEIGHT,MAX,move,fromSlot,duplicateAfter,compose});
});
