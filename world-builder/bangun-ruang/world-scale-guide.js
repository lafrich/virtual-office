/* Pixel Creator world-size guide. Display only; actual size lives in
 * VLBangunObjects.worldHeight and Semesta object.width/object.height. */
(function(g){
'use strict';
const bridge=g.VLBangunObjects,dlg=document.getElementById('objectPixelDialog');
if(!bridge||!dlg||g.VLPixelCreatorScale)return;
const $=id=>document.getElementById(id);
const INSPECTOR=dlg.querySelector('.opc-inspector');
const reference=$('opcReferencePanel');
if(!INSPECTOR||!reference)return;
const css=document.createElement('style');
css.textContent=`
#objectPixelDialog .opc-world-field{margin-top:9px;border-top:2px solid #f3f2ef;padding-top:4px}
#objectPixelDialog #opcWorldHeight{width:100%;font:700 13px "Courier New",monospace}
#objectPixelDialog #opcWorldRatio{padding:7px 6px;margin:6px 0 11px;border:2px inset #a6a39d;background:#e7eefc;color:#12336b;font:700 10px/1.6 "Courier New",monospace}
#objectPixelDialog #opcCharacterCanvas{display:none!important}
#objectPixelDialog #opcWorldScaleCanvas{display:block;width:100%;height:auto;image-rendering:pixelated;max-height:450px;touch-action:none}
#objectPixelDialog #opcReferenceInfo{display:none}
#objectPixelDialog #opcWorldScaleInfo{margin-top:6px;padding:4px;background:#d7d4ce;border:1px solid #9a978f;text-align:center;color:#34312c;font:10px/1.5 "Courier New",monospace}
#objectPixelDialog .opc-world-field small{display:block;font:10px/1.55 Tahoma;color:#44433e;margin-top:4px}
`;
document.head.append(css);
const field=document.createElement('div');
field.className='opc-world-field';
field.innerHTML='<label for="opcWorldHeight">TINGGI DI SEMESTA / WORLD UNIT</label>'+
 '<input id="opcWorldHeight" type="number" min="0.3" max="24" step="0.1" value="1.6" inputmode="decimal">'+
 '<div id="opcWorldRatio" aria-live="polite"></div>'+
 '<small>Ini ukuran saat placement, bukan resolusi PNG. Footprint tetap menentukan luas alas dan collision.</small>';
INSPECTOR.insertBefore(field, $('opcCollision')?.previousElementSibling||$('opcColor')?.previousElementSibling||INSPECTOR.firstChild);
const preview=document.createElement('canvas');
preview.id='opcWorldScaleCanvas';preview.width=300;preview.height=336;
preview.setAttribute('aria-label','Real Semesta scale comparison of your placed object and Mahluk Hidup character');
reference.querySelector('.opc-character-frame')?.append(preview);
const sub=document.createElement('div');
sub.id='opcWorldScaleInfo';reference.append(sub);
const nativeHeight=Number(bridge.characterWorldHeight)||72*Math.SQRT2/64*2/Math.sqrt(3);
const verticalComp=2/Math.sqrt(3);
const cache=new Map();
let lastSource='',lastState='';
function defaults(category){return Number(bridge.defaultWorldHeight?.[category])||1.6;}
function height(){return Number($('opcWorldHeight').value);}
function number(n){return Math.round(n*100)/100;}
function reset(category){
 const h=defaults(category);
 $('opcWorldHeight').value=String(h);render();
}
function load(row,isBuiltIn){
 const spec=(g.VLAssetCatalog||[]).find(x=>x.source==='bangun-object'&&x.id===row.id);
 const source=Number(row.worldHeight??spec?.worldHeight);
 $('opcWorldHeight').value=String(Number.isFinite(source)&&source>=.3&&source<=24?number(source):defaults(row.category));
 render();
}
function imageForCharacter(){
 const profile=$('opcReferenceProfile')?.value||'ichsan';
 const direction=$('opcViews')?.querySelector('button.active')?.dataset?.view||'sw';
 const rig=g.VLCharacterRig;
 let motion=null;
 try{motion=rig?.resolve?.(profile,'idle',false);}catch{}
 const url=motion?.url||g.VLPipelineAssets?.character?.(profile)||null;
 const dirIndex=(rig?.DIR||['se','sw','ne','nw']).indexOf(direction);
 const baseRow=Number.isFinite(Number(motion?.row))?Number(motion.row):4;
 return {profile,direction,url,row:baseRow+Math.max(0,dirIndex),rig};
}
function placeholder(ctx,x,floor,ppu){
 const h=nativeHeight*ppu;
 ctx.fillStyle='#283e78';ctx.fillRect(x-10,floor-h+26,20,h-40);
 ctx.fillStyle='#1c3060';ctx.fillRect(x-9,floor-16,8,16);ctx.fillRect(x+2,floor-16,8,16);
 ctx.fillStyle='#e0b69a';ctx.fillRect(x-9,floor-h+7,18,23);
 ctx.fillStyle='#28303b';ctx.fillRect(x-11,floor-h,22,9);
}
function drawCharacter(ctx,ppu,floor){
 const x=69,motion=imageForCharacter(),info=$('opcWorldScaleInfo');
 if(!motion.url){placeholder(ctx,x,floor,ppu);info.textContent='Karakter: preview fallback · tinggi tetap akurat';return;}
 let entry=cache.get(motion.url);
 if(!entry){
  const img=new Image();
  if(!motion.url.startsWith('data:'))img.crossOrigin='anonymous';
  entry={img,ready:false,failed:false};
  cache.set(motion.url,entry);
  img.onload=()=>{entry.ready=true;render();};
  img.onerror=()=>{entry.failed=true;render();};
  img.src=motion.url;
 }
 if(entry.ready&&entry.img.naturalWidth>=64&&entry.img.naturalHeight>=(motion.row+1)*112){
  const ratioY=nativeHeight/72*ppu,ratioX=ratioY/verticalComp;
  ctx.drawImage(entry.img,0,motion.row*112,64,112,x-32*ratioX,floor-100*ratioY,64*ratioX,112*ratioY);
  info.textContent='Karakter: '+motion.profile+' · arah '+motion.direction.toUpperCase()+' · tinggi '+nativeHeight.toFixed(2)+'u';
 }else{placeholder(ctx,x,floor,ppu);info.textContent=entry.failed?'Karakter offline · skala tetap akurat':'Memuat sprite karakter…';}
}
function render(){
 if(!preview.isConnected)return;
 const ctx=preview.getContext('2d');if(!ctx)return;
 const w=preview.width,h=preview.height,floor=306;
 const value=height(),valid=Number.isFinite(value)&&value>=.3&&value<=24;
 const objectHeight=valid?value:1.6,ratio=objectHeight/nativeHeight;
 $('opcWorldRatio').textContent=valid?
  objectHeight.toFixed(2)+'u objek ÷ '+nativeHeight.toFixed(2)+'u karakter = '+ratio.toFixed(2)+'×':
  'Masukkan tinggi 0.3–24 world unit sebelum Save.';
 const ppu=Math.min(46,280/Math.max(objectHeight,nativeHeight));
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#f6f4ee';ctx.fillRect(0,0,w,h);
 ctx.font='10px "Courier New",monospace';ctx.textAlign='left';ctx.lineWidth=1;
 for(let u=0;u<=Math.ceil(Math.max(objectHeight,nativeHeight));u++){
  const y=floor-u*ppu;if(y<12)break;
  ctx.beginPath();ctx.strokeStyle=u?'#d2cec4':'#9e6621';ctx.moveTo(16,Math.round(y)+.5);ctx.lineTo(w,Math.round(y)+.5);ctx.stroke();
  ctx.fillStyle='#5b5b56';ctx.fillText(String(u),3,y-3);
 }
 ctx.fillStyle='#3b3932';ctx.font='bold 10px "Courier New",monospace';ctx.textAlign='center';
 ctx.fillText('CHARACTER',69,326);ctx.fillText('OBJECT',218,326);
 const art=$('opcCanvas');if(art){
  const data=art.getContext('2d').getImageData(0,0,96,144).data;
  let top=144;
  for(let y=0;y<144;y++)for(let x=0;x<96;x++)if(data[(y*96+x)*4+3]){top=y;break;}
  if(top<136){
   const sy=objectHeight*ppu/(136-top),sx=sy/verticalComp;
   ctx.imageSmoothingEnabled=false;
   ctx.drawImage(art,218-48*sx,floor-136*sy,96*sx,144*sy);
  }else{
   ctx.fillStyle='#aaaaa4';ctx.font='9px "Courier New",monospace';ctx.fillText('GAMBAR OBJEK',218,floor-35);
  }
 }
 if($('opcRefToggle')?.getAttribute('aria-pressed')==='false')return;
 drawCharacter(ctx,ppu,floor);
}
$('opcWorldHeight').addEventListener('input',render);
$('opcReferenceProfile')?.addEventListener('change',()=>{cache.clear();render();});
$('opcRefToggle')?.addEventListener('click',()=>requestAnimationFrame(render));
g.VLPixelCreatorScale=Object.freeze({height,reset,load,render});
reset($('opcCategory')?.value||'decor');
})(window);
