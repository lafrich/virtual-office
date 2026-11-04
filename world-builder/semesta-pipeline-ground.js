/* Semesta — correct native 2:1 pixel-isometric street sprite grounding.
 *
 * The upstream street_buildings atlas has an anchor in the MIDDLE of the
 * ground footprint, not at its lowest painted pixel. A vertical billboard
 * with its pivot at y=0 puts the floor/terrace pixels below world y=0, where
 * WebGL terrain depth clips them. Raising the entire object is incorrect.
 *
 * Rebuild the source PNG into TWO world surfaces, using the SAME native PNG:
 *   1. Vertical facade: UV rows [0,pivotY] rise above its ground pivot.
 *   2. Horizontal apron: UV rows [pivotY,imageBottom] lie on world y=0.
 * Projection of the apron is exactly the fixed 2:1 camera basis, so the two
 * pieces join without changing their original image/pivot coordinates.
 *
 * Both surfaces have genuine depth testing. Other 3D objects still occlude
 * the artwork; unlike a depthTest:false overlay, this is not always-on-top.
 * Warteg authored mesh and vegetation have separate native rendering paths.
 */
(function(g){
'use strict';
const PIXEL_WORLD=Math.SQRT2/64;
const VERTICAL_COMP=2/Math.sqrt(3);
const SQRT2=Math.SQRT2;
const GROUND_Y=.072; // above terrain .036 and grid guide .060, no sinking
const VIEWS=['sw','se','ne','nw'];
function view(spec,dir='sw'){
 const v=spec?.variants?.[dir]||spec?.variants?.sw||spec?.variants?.se;
 return v&&Array.isArray(v.size)&&Array.isArray(v.pivot)&&
  v.size.length===2&&v.pivot.length===2?v:null;
}
function supports(spec){
 return spec?.source==='pipeline-street'&&spec?.published===true&&!!view(spec);
}
function metrics(spec,dir='sw'){
 const v=view(spec,dir);
 if(!v)return null;
 const [w,h]=v.size.map(Number),[px,py]=v.pivot.map(Number);
 if(!(w>0&&h>0&&px>=0&&px<=w&&py>0&&py<=h))return null;
 const upperHeight=py*PIXEL_WORLD*VERTICAL_COMP;
 const apronDepth=(h-py)*PIXEL_WORLD;
 return Object.freeze({
  imageWidth:w,imageHeight:h,pivotX:px,pivotY:py,
  width:w*PIXEL_WORLD,upperHeight,apronDepth,
  facadeCenterX:(w/2-px)*PIXEL_WORLD,
  facadeCenterY:GROUND_Y+upperHeight/2,
  seamUV:1-py/h,groundY:GROUND_Y,
  hasApron:h-py>.01
 });
}
// A camera looking down towards +X/+Z has world-right=(+X,-Z)/sqrt(2)
// and ground-facing-towards-camera=(+X,+Z)/sqrt(2).
// Its elevation is 30 deg, so a ground pixel falling below the pivot
// needs exactly 2x that screen-distance along the ground-plane forward axis.
function groundPoint(px,py,m){
 const sx=(px-m.pivotX)*PIXEL_WORLD;
 const down=(py-m.pivotY)*PIXEL_WORLD;
 return [(sx+2*down)/SQRT2, GROUND_Y,(-sx+2*down)/SQRT2];
}
function layout(spec,dir='sw'){
 const m=metrics(spec,dir);
 if(!m)return null;
 const w=m.imageWidth,h=m.imageHeight,p=m.pivotY;
 const corners=[
  groundPoint(0,p,m),groundPoint(w,p,m),
  groundPoint(w,h,m),groundPoint(0,h,m)
 ];
 return {metrics:m,corners,
  apronUV:[0,m.seamUV,1,m.seamUV,1,0,0,0],
  apronIndices:[0,1,2,0,2,3],
  upperUV:[0,m.seamUV,1,m.seamUV,0,1,1,1]
 };
}
function geometry(THREE,l){
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(l.corners.flat(),3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(l.apronUV,2));
 geo.setIndex(l.apronIndices);
 geo.computeVertexNormals();
 return geo;
}
function facadeGeometry(THREE,m){
 const geo=new THREE.PlaneGeometry(m.width,m.upperHeight);
 const uv=geo.getAttribute('uv');
 // PlaneGeometry is ordered top left, top right, bottom left, bottom right.
 for(let i=0;i<uv.count;i++)uv.setY(i,m.seamUV+uv.getY(i)*(1-m.seamUV));
 uv.needsUpdate=true;
 return geo;
}
function material(THREE,tex){
 return new THREE.MeshBasicMaterial({
  map:tex,transparent:false,alphaTest:.49,depthTest:true,
  depthWrite:true,side:THREE.DoubleSide
 });
}
function configure(THREE,bundle,spec,dir,tex){
 const l=layout(spec,dir);
 if(!l)return false;
 const {metrics:m}=l;
 if(bundle.facade.geometry)bundle.facade.geometry.dispose();
 bundle.facade.geometry=facadeGeometry(THREE,m);
 bundle.facade.position.set(m.facadeCenterX,m.facadeCenterY,0);
 bundle.facade.material.map=tex;
 bundle.facade.material.needsUpdate=true;
 const old=bundle.apron.geometry;
 bundle.apron.geometry=m.hasApron?geometry(THREE,l):new THREE.BufferGeometry();
 if(old)old.dispose();
 bundle.apron.visible=m.hasApron;
 bundle.apron.material.map=tex;
 bundle.apron.material.needsUpdate=true;
 bundle.view=dir;
 bundle.facade.userData.nativeGroundSplit=true;
 bundle.facade.userData.displayFacing=dir;
 bundle.facade.userData.nativeWidth=m.width;
 bundle.facade.userData.nativeUpperHeight=m.upperHeight;
 bundle.facade.userData.nativeApronDepth=m.apronDepth;
 bundle.apron.userData.nativeGroundApron=true;
 bundle.apron.userData.imageGroundPivot=[m.pivotX,m.pivotY];
 return true;
}
function attach(THREE,root,spec,dir,tex){
 if(!supports(spec))return null;
 const facade=new THREE.Mesh(new THREE.BufferGeometry(),material(THREE,tex));
 facade.name='NATIVE STREET / vertical facade';
 facade.userData.billboardPart=true;
 const apron=new THREE.Mesh(new THREE.BufferGeometry(),material(THREE,tex));
 apron.name='NATIVE STREET / 2:1 ground apron';
 apron.userData.billboardPart=false;
 const bundle={facade,apron,view:null};
 if(!configure(THREE,bundle,spec,dir,tex)){
  facade.geometry.dispose();apron.geometry.dispose();
  facade.material.dispose();apron.material.dispose();
  return null;
 }
 root.add(facade,apron);
 return bundle;
}
function faceCamera(bundle,root,camera){
 // The facade is a genuine vertical, depth-tested plane; keep it facing
 // the camera exactly as other native sprites. The ground apron must stay
 // aligned to world XZ even if the instance has an authored 90deg rotation.
 const yaw=Math.atan2(camera.position.x-root.position.x,
                      camera.position.z-root.position.z);
 bundle.facade.rotation.y=yaw-root.rotation.y;
 bundle.apron.rotation.y=-root.rotation.y;
}
g.VLSemestaPipelineGround=Object.freeze({
 version:1,supports,view,metrics,layout,groundPoint,attach,configure,faceCamera
});
})(typeof window!=='undefined'?window:globalThis);
