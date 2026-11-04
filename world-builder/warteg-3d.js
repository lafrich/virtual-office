/* Warteg Kharisma Bahari | actual depth-tested 3D surface reconstruction.
 * The authored 1x sprite is a 2:1 orthographic projection of specific
 * wall, gable, awning and roof planes. Restore its physical source geometry
 * and project the saved source pixels back onto those surfaces.
 *
 * Unlike a vertically standing camera-facing card, each facade/roof has
 * independent world XYZ and proper WebGL occlusion against people/terrain.
 * No AI imagery, texture re-sampling, or bake of NPCs into building art.
 */
(function(g){
'use strict';
const PPU=Math.SQRT2/64, YPPU=PPU*2/Math.sqrt(3);
const W=8,D=6,views=['sw','se','ne','nw'];
function supported(spec){
 return spec?.source==='custom-building'&&(
  spec?.assetPipeline?.family==='warteg_kharisma'||
  /^Warteg Kharisma Bahari$/i.test(String(spec.label||'')));
}
function metadata(spec,direction){
 const data=spec.variants?.[direction]||spec.variants?.sw||spec.variants?.se;
 return data?.size?.length===2&&data?.pivot?.length===2?data:null;
}
function world(a,b,hpx){
 return [a-W/2,hpx*YPPU,D/2-b];
}
function pixelCoords(a,b,hpx,view,pivot){
 const turn=view==='se'||view==='nw';
 const c=turn?D-b:a,r=turn?W-a:D-b;
 const c0=turn?D/2:W/2,r0=turn?W/2:D/2;
 return [pivot[0]+(c-r-(c0-r0))*32,
         pivot[1]+(c+r-(c0+r0))*16-hpx];
}
function panels(){
 const roofFront=.62,roofRear=D+.54,e=145,peak=180;
 const facadeB=1.05;
 // The geometry mirrors EXACT coordinate parameters in pipeline v2.
 const results=[
  {id:'floor',pts:[[0,0,-2],[W,0,-2],[W,D,-2],[0,D,-2]],ground:true},
  {id:'front',pts:[[0,facadeB,0],[W,facadeB,0],[W,facadeB,128],[0,facadeB,128]]},
  {id:'side',pts:[[W,facadeB,0],[W,D,0],[W,D,128],[W,facadeB,128]]},
  {id:'back',pts:[[0,D,0],[W,D,0],[W,D,128],[0,D,128]]},
  {id:'gable',pts:[[0,facadeB,128],[W/2,facadeB,173],[W,facadeB,128]]},
  {id:'roof-left',pts:[[-.44,roofFront,e],[W/2,roofFront,peak],[W/2,roofRear,peak],[-.44,roofRear,e]]},
  {id:'roof-right',pts:[[W/2,roofFront,peak],[W+.52,roofFront,e],[W+.52,roofRear,e],[W/2,roofRear,peak]]},
  {id:'right-fascia',pts:[[W+.52,roofFront,e],[W+.52,roofRear,e],[W+.52,roofRear,e-10],[W+.52,roofFront,e-10]]},
  {id:'back-fascia',pts:[[W/2,roofRear,peak],[W+.52,roofRear,e],[W+.52,roofRear,e-4],[W/2,roofRear,peak-4]]},
  {id:'awning',pts:[[-.16,.40,135],[8.16,.40,135],[8.16,1.43,135],[-.16,1.43,135]]},
  {id:'awning-front',pts:[[-.16,.40,117],[8.16,.40,117],[8.16,.40,135],[-.16,.40,135]]}
 ];
 return results;
}
function makeFace(THREE,panel,spec,view,texture){
 const data=metadata(spec,view);if(!data)return null;
 const pts=panel.pts;
 // Each material pixel is sampled on its true 3D plane.
 const pos=[],uv=[],indices=[];
 for(const [a,b,h] of pts){
  const xyz=world(a,b,h);
  if(panel.ground)xyz[1]=.024; // ground/apron surfaces are above real terrain.
  pos.push(...xyz);
  const pixel=pixelCoords(a,b,h,view,data.pivot);
  uv.push(pixel[0]/data.size[0],1-pixel[1]/data.size[1]);
 }
 for(let i=1;i<pts.length-1;i++)indices.push(0,i,i+1);
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geo.setIndex(indices);geo.computeVertexNormals();
 // Alpha-tested, OPAQUE depth-writes allow characters in front of the
 // building and other real 3D structures to occlude and be occluded correctly.
 const mat=new THREE.MeshBasicMaterial({
  map:texture,transparent:false,alphaTest:.49,depthTest:true,
  depthWrite:true,side:THREE.DoubleSide
 });
 const mesh=new THREE.Mesh(geo,mat);
 mesh.name='WARTEG 3D / '+panel.id;
 mesh.userData.wartegDepthSurface=true;
 mesh.userData.billboardPart=false;
 return mesh;
}
function attach(THREE,root,spec,view,texture){
 if(!supported(spec)||!metadata(spec,view)||!texture)return false;
 const group=new THREE.Group();
 group.name='Warteg authored 3D surfaces';
 for(const panel of panels()){
  const mesh=makeFace(THREE,panel,spec,view,texture);
  if(mesh)group.add(mesh);
 }
 if(!group.children.length)return false;
 group.userData.wartegMesh=true;
 root.add(group);
 return true;
}
function doorPosition(item){
 const a=.62,b=.40;
 const x=a-W/2,z=D/2-b;
 const rot=((Number(item?.rotation)||0)%360+360)%360*Math.PI/180;
 // Three's Y rotation: +X maps toward -Z.
 const dx=Math.cos(rot)*x+Math.sin(rot)*z;
 const dz=-Math.sin(rot)*x+Math.cos(rot)*z;
 return {x:Number(item.x)+dx,z:Number(item.z)+dz};
}
function distanceToDoor(actor,item){
 if(!actor||!item)return Infinity;
 const door=doorPosition(item);
 return Math.hypot(Number(actor.x)-door.x,Number(actor.z)-door.z);
}
g.VLWarteg3D=Object.freeze({
 version:1,supported,metadata,world,pixelCoords,panels,attach,doorPosition,distanceToDoor,
});
})(window);
