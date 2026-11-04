/* Bangun Ruang v8 — consistent CSS pixels per 64x32 world tile.
 * Both exterior PNG and isometric interior canvas use one preview scale.
 * The backing sprite coordinates and saved map footprints are unchanged.
 */
(function(g){
'use strict';
const $=id=>document.getElementById(id);
const stage=$('previewStage');
const exterior=$('preview'),inside=$('interiorCanvas'),guide=$('buildingGuideCanvas');
let exteriorSize=null,interiorSize=null,interiorMode='iso',lastScale=1,actionZoom=1;
function cssMaxHeight(){
 const w=Number(g.innerWidth)||640;
 return w<=370?252:w<=640?294:w<=1000?340:430;
}
function applySize(element,size,scale){
 if(!element||!size||!element.style?.setProperty)return;
 const w=Math.max(1,Math.round(size[0]*scale));
 const h=Math.max(1,Math.round(size[1]*scale));
 element.style.setProperty('width',w+'px','important');
 element.style.setProperty('height',h+'px','important');
 element.style.setProperty('max-width','100%','important');
 element.style.setProperty('max-height',cssMaxHeight()+'px','important');
}
function sync(){
 if(!stage||!exteriorSize)return;
 const rect=stage.getBoundingClientRect?.();
 const room=interiorMode==='iso'?interiorSize:null;
 const maxWidth=Math.max(exteriorSize[0],room?.[0]||0);
 const maxHeight=Math.max(exteriorSize[1],room?.[1]||0);
 if(!(maxWidth>0&&maxHeight>0))return;
 const availableWidth=Math.max(100,(rect?.width||stage.clientWidth||480)-18);
 const availableHeight=Math.max(100,Math.min((rect?.height||stage.clientHeight||310)-16,cssMaxHeight()));
 lastScale=Math.max(.2,Math.min(1.5,availableWidth/maxWidth,availableHeight/maxHeight));
 applySize(exterior,exteriorSize,lastScale);
 applySize(guide,exteriorSize,lastScale);
 if(interiorSize){
  if(interiorMode==='iso'){
   applySize(inside,interiorSize,lastScale*actionZoom);
   inside.style.setProperty('max-width','none','important');inside.style.setProperty('max-height','none','important');
  }
  else{
   // Plan / Edit is a tool-only zoomed grid, not the physical 1:1 preview.
   const planScale=Math.min(3.5,availableWidth/interiorSize[0],availableHeight/interiorSize[1]);
   applySize(inside,interiorSize,planScale*actionZoom);
   if(actionZoom!==1){inside.style.setProperty('max-width','none','important');inside.style.setProperty('max-height','none','important');}
  }
 }
}
g.addEventListener?.('resize',sync);
g.VLBuildingPreviewScale=Object.freeze({
 exterior(size){if(Array.isArray(size)&&size[0]>0&&size[1]>0){exteriorSize=size;sync();}},
 interior(size,mode='iso'){if(Array.isArray(size)&&size[0]>0&&size[1]>0){
  interiorSize=size;interiorMode=mode;sync();}},
 sync,
 setActionZoom(value){actionZoom=Math.max(.5,Math.min(4,Number(value)||1));sync();return actionZoom;},
 get actionZoom(){return actionZoom;},
 get worldPixelScale(){return lastScale;},
 get exteriorSize(){return exteriorSize?.slice()||null;},
 get interiorSize(){return interiorSize?.slice()||null;}
});
})(window);
