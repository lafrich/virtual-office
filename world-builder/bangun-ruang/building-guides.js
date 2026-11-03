/* Bangun Ruang v5 — non-destructive exterior line / guideline preview.
 * Read only: edge trace is derived from the CURRENT PNG sprite (including
 * hand-painted pixel edits), never included in Save, PNG or Semesta exports.
 */
(function(g){
'use strict';
const $=id=>document.getElementById(id);
const directions=['sw','se','ne','nw'];
const ink=[36,85,136,255],detail=[76,141,172,255];
const TAU=4;
function trace(input,w,h,threshold=65){
 const out=new Uint8ClampedArray(w*h*4);
 if(!input||input.length!==out.length)return out;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const p=(y*w+x)*4,alpha=input[p+3];
  if(alpha<90)continue;
  let outside=false,seam=false;
  for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){
   const xx=x+dx,yy=y+dy;
   if(xx<0||xx>=w||yy<0||yy>=h){outside=true;continue;}
   const np=(yy*w+xx)*4,na=input[np+3];
   if(na<90){outside=true;continue;}
   const diff=Math.abs(input[p]-input[np])+
    Math.abs(input[p+1]-input[np+1])+
    Math.abs(input[p+2]-input[np+2]);
   if(diff>threshold)seam=true;
  }
  if(!outside&&!seam)continue;
  const color=outside?ink:detail;
  out[p]=color[0];out[p+1]=color[1];out[p+2]=color[2];out[p+3]=color[3];
 }
 return out;
}
function pixelLine(ctx,x0,y0,x1,y1,color){
 x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1);
 const dx=Math.abs(x1-x0),sx=x0<x1?1:-1;
 const dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;
 let error=dx+dy;ctx.fillStyle=color;
 for(let i=0;i<8192;i++){
  ctx.fillRect(x0,y0,1,1);
  if(x0===x1&&y0===y1)break;
  const twice=2*error;if(twice>=dy){error+=dy;x0+=sx;}if(twice<=dx){error+=dx;y0+=sy;}
 }
}
function footprint(ctx,pivot,c,d,dir){
 if(!Array.isArray(pivot))return;
 const turned=dir==='se'||dir==='nw',W=turned?d:c,D=turned?c:d;
 if(!(Number.isFinite(W)&&Number.isFinite(D)&&W>0&&D>0))return;
 const ox=pivot[0],oy=pivot[1];
 const p=(x,z)=>[ox+Math.round((x-z)*32),oy+Math.round((x+z)*16)];
 // C/R tile edges are independent of the building raster and help inspect
 // doors, footprint and structural clearances in the authoring preview.
 const corners=[p(-W/2,-D/2),p(W/2,-D/2),p(W/2,D/2),p(-W/2,D/2)];
 for(let i=0;i<4;i++)pixelLine(ctx,...corners[i],...corners[(i+1)%4],'#d58a35');
 for(let x=-W/2+1;x<W/2;x+=1)
  pixelLine(ctx,...p(x,-D/2),...p(x,D/2),'#a9c3d7');
 for(let z=-D/2+1;z<D/2;z+=1)
  pixelLine(ctx,...p(-W/2,z),...p(W/2,z),'#a9c3d7');
 // Floor center crosshair / placement pivot.
 pixelLine(ctx,ox-5,oy,ox+5,oy,'#c04752');
 pixelLine(ctx,ox,oy-4,ox,oy+4,'#c04752');
}
function mount(){
 const img=$('preview'),canvas=$('buildingGuideCanvas'),tools=$('exteriorViewTools');
 const pixel=$('exteriorViewPixel'),guide=$('exteriorViewGuide');
 if(!img||!canvas||!pixel||!guide||!tools)return null;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 let mode='pixel',visible=true,active=null,serial=0;
 function sync(){
  tools.hidden=!visible;img.hidden=!visible||mode!=='pixel';
  canvas.hidden=!visible||mode!=='guide';
  pixel.classList.toggle('active',mode==='pixel');
  guide.classList.toggle('active',mode==='guide');
  pixel.setAttribute('aria-pressed',String(mode==='pixel'));
  guide.setAttribute('aria-pressed',String(mode==='guide'));
  if(visible&&mode==='guide'&&active)void draw();
 }
 async function draw(){
  const mine=++serial,item=active;
  if(!item)return;
  const preview=new Image();preview.decoding='async';
  await new Promise((resolve,reject)=>{
   preview.onload=resolve;preview.onerror=()=>reject(Error('Image did not load'));
   preview.src=item.url;
  }).catch(()=>{});
  if(mine!==serial||mode!=='guide'||!visible||!preview.naturalWidth)return;
  const w=preview.naturalWidth,h=preview.naturalHeight;
  const off=document.createElement('canvas');off.width=w;off.height=h;
  const source=off.getContext('2d',{willReadFrequently:true});
  source.imageSmoothingEnabled=false;source.drawImage(preview,0,0);
  let pixels;
  try{pixels=source.getImageData(0,0,w,h).data;}
  catch{ return; }
  const lines=trace(pixels,w,h);
  canvas.width=w;canvas.height=h;
  ctx.imageSmoothingEnabled=false;
  const result=ctx.createImageData(w,h);result.data.set(lines);
  ctx.clearRect(0,0,w,h);ctx.putImageData(result,0,0);
  footprint(ctx,item.pivot,item.w,item.d,item.direction);
  $('guideStatus').textContent='OUTLINE · '+item.direction.toUpperCase()+' · '+item.w+'×'+item.d+' TILES';
 }
 pixel.onclick=()=>{mode='pixel';serial++;sync();};
 guide.onclick=()=>{mode='guide';sync();};
 sync();
 return Object.freeze({
  setVisible(on){visible=!!on;serial++;sync();},
  update(sprite,config,direction){
   if(!sprite||!directions.includes(direction))return;
   active={url:sprite.url,pivot:sprite.pivot,w:Number(config.w),d:Number(config.d),direction};
   serial++;if(visible&&mode==='guide')void draw();
  },
  getMode:()=>mode
 });
}
g.VLBuildingGuides=Object.freeze({mount,trace,footprint});
})(window);
