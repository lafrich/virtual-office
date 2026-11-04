/* Semesta · wheel-ground alignment for authored vehicle PNGs.
 * A source pivot is often the CENTRE of an isometric ground footprint,
 * not the lowest tyre pixel. Using that pivot for a vertical 3D sprite
 * puts the foreground wheel/body beneath the asphalt depth plane.
 *
 * Find the last OPAQUE tyre/body contact row; ignore the pipeline's
 * optional flat alpha-56 shadow. Works on Canvas and HTMLImageElement,
 * caches per image (animation frames do not cause repeated readbacks).
 * If pixel readback is blocked, preserve the authored pivot as fallback.
 */
(function(g){
'use strict';
const cache=new WeakMap();
const finite=(v,fallback)=>Number.isFinite(Number(v))?Number(v):fallback;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const GROUND_CLEARANCE=.027; // world tiles above the asphalt, not a manual Y offset
function readPixels(image,factory){
 if(!image||typeof image!=='object')return null;
 const w=Math.round(finite(image.naturalWidth||image.width,0));
 const h=Math.round(finite(image.naturalHeight||image.height,0));
 if(w<2||h<2||w>4096||h>4096)return null;
 let ctx=null;
 if(typeof image.getContext==='function'){
  ctx=image.getContext('2d',{willReadFrequently:true});
 }else{
  const create=factory||(()=>typeof document!=='undefined'?document.createElement('canvas'):null);
  const canvas=create();
  if(!canvas)return null;
  canvas.width=w;canvas.height=h;
  ctx=canvas.getContext?.('2d',{willReadFrequently:true});
  if(!ctx)return null;
  ctx.clearRect(0,0,w,h);
  ctx.drawImage(image,0,0,w,h);
 }
 if(!ctx||typeof ctx.getImageData!=='function')return null;
 return {w,h,data:ctx.getImageData(0,0,w,h).data};
}
function inspect(image,factory){
 if(image&&cache.has(image))return cache.get(image);
 let result=null;
 try{
  const pix=readPixels(image,factory);
  if(pix){
   const {w,h,data}=pix;
   const minX=Math.floor(w*.03),maxX=Math.ceil(w*.97);
   // Source assets have 0 / 56 / 255 alpha; 56 is a floor shadow,
   // NEVER a tyre. Require multiple opaque pixels to reject noise.
   const minSolid=Math.max(2,Math.min(8,Math.round(w*.018)));
   outer:for(let y=h-1;y>=Math.floor(h*.38);y--){
    let solid=0;
    for(let x=minX;x<maxX;x++){
     if(data[(y*w+x)*4+3]>=180&&++solid>=minSolid){
      result={row:y+1,ratio:(y+1)/h,source:'opaque-tyre'};
      break outer;
     }
    }
   }
  }
 }catch(e){/* Tainted or unreadable historical image: use authored pivot. */}
 if(image&&typeof image==='object')cache.set(image,result);
 return result;
}
function contact(image,authoredRatio=.9,factory){
 const measured=inspect(image,factory);
 const author=clamp(finite(authoredRatio,.9),.3,1);
 return measured?{...measured,ratio:clamp(measured.ratio,.3,1)}:
  {ratio:author,row:null,source:'authored-fallback'};
}
function pivotHeight(height,ratio){
 return finite(height,0)*(clamp(finite(ratio,.9),0,1)-.5)+GROUND_CLEARANCE;
}
g.VLSemestaWheelGround=Object.freeze({
 version:1,GROUND_CLEARANCE,readPixels,inspect,contact,pivotHeight
});
})(window);
