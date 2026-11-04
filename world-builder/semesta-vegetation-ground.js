/* Semesta · Native 2:1 vegetation: automatically seat the visible trunk /
 * grass-skirt contact on the 3D terrain, without moving the world object.
 *
 * Virtual Life Asset Pipeline tree "pivot" is the ground point at trunk centre.
 * A broad isometric grass skirt may contain OPAQUE pixels up to 30 px BELOW
 * that point; those pixels disappear in the ground depth buffer when a whole
 * image is incorrectly treated as a vertical 3D plane.
 *
 * Alpha 56 canopy shadow and alpha 90 contact shadow are intentionally
 * ignored by the shared native-pixel contact inspector. True opaque grass
 * and trunk pixels are preserved. This is not a depthTest=false overlay.
 */
(function(g){
'use strict';
const wheel=g.VLSemestaWheelGround;
const CLEARANCE=.055; // just above grass, sidewalk and road tile geometry
const isTree=spec=>spec?.source==='pipeline-vegetation'&&
 spec?.group==='Vegetation • trees'&&spec?.published===true;
function anchor(spec,image,height){
 if(!isTree(spec))return null;
 const size=spec.size||[],pivot=spec.pivot||[];
 const authored=Number(size[1])>0&&Number.isFinite(Number(pivot[1]))?
  Math.max(0,Math.min(1,Number(pivot[1])/Number(size[1]))):.88;
 // A tree PNG's pivot is under the trunk, not at the bottom of the
 // foreground grass skirt. Native pixels give the correct lowest opaque
 // row. Never lower the plant compared to the pipeline's ground anchor.
 const found=wheel?.contact(image,authored)||
  {ratio:authored,source:'authored-fallback',row:null};
 const ratio=Math.max(authored,Math.min(1,Number(found.ratio)||authored));
 const h=Number.isFinite(Number(height))?Math.max(0,Number(height)):0;
 return Object.freeze({
  ratio,author:authored,source:found.source,row:found.row,
  // The end of the visible opaque skirt meets the terrain. The source root
  // is unchanged; the painted pixels alone are adjusted.
  y:h*(ratio-.5)+CLEARANCE,
  clearance:CLEARANCE
 });
}
g.VLSemestaVegetationGround=Object.freeze({version:1,isTree,anchor,CLEARANCE});
})(window);
