/* Semesta: native isometric studio-building sprite placement.
 * A 2:1 isometric sprite has floor/apron pixels BELOW its central ground
 * pivot. Those pixels are still ABOVE the terrain in the authored image;
 * they must not be tested as if the entire PNG were a vertical 3D wall.
 * Scope this exception to Bangun Ruang custom-building sprites only.
 */
(function(g){
'use strict';
const PIXEL_WORLD=Math.SQRT2/64;
const VERTICAL_COMP=2/Math.sqrt(3);
const NATIVE_VERTICAL=PIXEL_WORLD*VERTICAL_COMP;
const dirs=['sw','se','ne','nw'];
function direction(rotation=0){
 const quarter=((Math.round(Number(rotation||0)/90)%4)+4)%4;
 return dirs[quarter];
}
function native(spec,rotation=0){
 const d=direction(rotation);
 return spec?.variants?.[d]||spec?.variants?.sw||
  spec?.variants?.se||{size:spec?.size,pivot:spec?.pivot};
}
function metrics(spec,rotation=0,scale=1){
 const view=native(spec,rotation);
 const size=view?.size,pivot=view?.pivot;
 const upper=Array.isArray(pivot)&&Number.isFinite(+pivot[1])?Math.max(1,+pivot[1]):Math.max(1,(+size?.[1]||200)*.8);
 const full=Array.isArray(size)&&Number.isFinite(+size[1])?Math.max(upper,+size[1]):upper;
 const factor=Math.max(.1,Number(scale)||1);
 return Object.freeze({
  height:upper*NATIVE_VERTICAL*factor,
  belowPivot:Math.max(0,full-upper)*NATIVE_VERTICAL*factor,
  nativeHeight:full*NATIVE_VERTICAL*factor,
  facing:direction(rotation)
 });
}
function isStudio(spec){return spec?.source==='custom-building';}
function spriteMaterial(){
 // Transparent pass composites over floor/road tiles only for studio
 // sprites; their floor pixels would otherwise fail the depth test.
 // Distinct Semesta real meshes keep their normal depth policy.
 return {transparent:true,depthTest:false,depthWrite:false,alphaTest:.5};
}
g.VLSemestaStudioSprite=Object.freeze({version:1,isStudio,metrics,native,direction,spriteMaterial});
})(window);
