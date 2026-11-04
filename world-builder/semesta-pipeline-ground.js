/* Semesta · True 2:1 native-pipeline, per-pixel depth sprites.
 *
 * The source renderer emits a full RGBA sprite plus a depth value for EVERY
 * visible pixel. A sprite's pivot is at the *center* of its ground footprint;
 * foreground walls, steps, balconies and paving can extend below that row.
 * Splitting at pivotY (the old workaround) incorrectly flattened a portion
 * of the FRONT FACADE onto the ground. Do NOT separate/crop the source PNG.
 *
 * A single pixel-perfect billboard preserves every source texel; an RG
 * depth-map reprojects its actual per-pixel z depth into the WebGL depth
 * buffer via gl_FragDepth, using the exact source projection:
 *
 * X = 32(c-r);  Y = 16(c+r)-z;  D=c+r+z/32.
 *
 * The viewport remains 3D: actors, terrain, vehicles and buildings perform
 * normal depth testing against the reconstructed pixel surfaces. No manual
 * Y-axis adjustment and no always-on-top sprite layer.
 */
(function(g){
'use strict';
const PX=Math.SQRT2/64;
const PY=PX*2/Math.sqrt(3);
const DEPTH_MIN=-24,DEPTH_MAX=80;
const FACE_EPSILON=.065;
function view(spec,dir='sw'){
 const v=spec?.variants?.[dir]||spec?.variants?.sw||spec?.variants?.se;
 return v&&Array.isArray(v.size)&&v.size.length===2&&
  Array.isArray(v.pivot)&&v.pivot.length===2?v:null;
}
function supports(spec){
 return spec?.source==='pipeline-street'&&spec?.published===true&&!!view(spec);
}
function metrics(spec,dir='sw'){
 const data=view(spec,dir);if(!data)return null;
 const [w,h]=data.size.map(Number),[px,py]=data.pivot.map(Number);
 if(!(w>0&&h>0&&px>=0&&px<=w&&py>0&&py<=h))return null;
 const [fw,fd]=spec.footprint||[1,1];
 return Object.freeze({
  imageWidth:w,imageHeight:h,pivotX:px,pivotY:py,
  width:w*PX,height:h*PY,centerX:(w/2-px)*PX,
  centerY:(py-h/2)*PY,
  centerDepth:(fw+fd)/2,
  groundPixel:py,hasFrontPixels:h>py
 });
}
function projectedSurface(relativePxY,sourceDepth,centerDepth){
 // Source depth s.d is c+r+z/32. The exact visible pixel Y is
 // 16(c+r)-z. Solve back to world (c+r,z) without losing facade depth.
 const v=Number(relativePxY)||0;
 const d=(Number(sourceDepth)||0)-(Number(centerDepth)||0);
 const cr=(2/3)*(d+v/32);
 const z=16*cr-v; // native source height in pixels
 return {cr,z};
}
function depthDelta(relativePxY,sourceDepth,centerDepth){
 const v=Number(relativePxY)||0;
 const {cr,z}=projectedSurface(v,sourceDepth,centerDepth);
 // Camera direction=(sqrt(3/8), 1/2, sqrt(3/8)).
 // A full vertical card starts at height=-v*PY; its correct *real*
 // pixel is at (c,r,z*PY), so restore its forward camera depth.
 const trueDot=Math.sqrt(3/8)*cr+.5*z*PY;
 const cardDot=-.5*v*PY;
 return trueDot-cardDot;
}
function nativeMaterial(THREE,colorTex,depthTex,metrics){
 const uniforms={
  uNativeDepth:{value:depthTex},
  uNativeImageHeight:{value:metrics.imageHeight},
  uNativePivotY:{value:metrics.pivotY},
  uNativeDepthCenter:{value:metrics.centerDepth},
  uNativeScale:{value:1},
  uNativeDepthSpan:{value:349.9}
 };
 const material=new THREE.MeshBasicMaterial({
  map:colorTex,transparent:false,alphaTest:.49,
  depthTest:true,depthWrite:true,side:THREE.DoubleSide
 });
 material.userData.nativeDepthUniforms=uniforms;
 material.customProgramCacheKey=()=> 'semesta-native-pipeline-depth-v2';
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.vertexShader='varying vec2 vNativeUv;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace(
   '#include <uv_vertex>',
   '#include <uv_vertex>\n vNativeUv = uv;'
  );
  shader.fragmentShader=`
uniform sampler2D uNativeDepth;
uniform float uNativeImageHeight;
uniform float uNativePivotY;
uniform float uNativeDepthCenter;
uniform float uNativeScale;
uniform float uNativeDepthSpan;
varying vec2 vNativeUv;
`+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace(
   '#include <dithering_fragment>',
   `#include <dithering_fragment>
   // The color texture already passed alphaTest above; ground shadows with
   // source alpha=56 are intentionally not physical collision surfaces.
   vec4 encodedDepth = texture2D(uNativeDepth,vNativeUv);
   if(encodedDepth.b > 0.5){
     float hi=floor(encodedDepth.r*255.0+0.5);
     float lo=floor(encodedDepth.g*255.0+0.5);
     float depthSource=(hi*256.0+lo)/65535.0*104.0-24.0;
     float deltaPixelY=(1.0-vNativeUv.y)*uNativeImageHeight-uNativePivotY;
     float relativeD=depthSource-uNativeDepthCenter;
     float cr=(2.0/3.0)*(relativeD+deltaPixelY/32.0);
     float nativeZ=16.0*cr-deltaPixelY;
     float ppu=1.4142135623730951/64.0;
     float nativeWorldY=nativeZ*ppu*2.0/sqrt(3.0);
     float actualForward=sqrt(3.0/8.0)*cr+0.5*nativeWorldY;
     float cardForward=-0.5*deltaPixelY*ppu*2.0/sqrt(3.0);
     float trueDepthAdvance=(actualForward-cardForward)*uNativeScale;
     gl_FragDepth=clamp(gl_FragCoord.z-(trueDepthAdvance+0.065)/uNativeDepthSpan,0.0,1.0);
   }`
  );
 };
 return material;
}
function configure(THREE,bundle,spec,dir,color,depth){
 const m=metrics(spec,dir);if(!m)return false;
 const old=bundle.facade.geometry;
 bundle.facade.geometry=new THREE.PlaneGeometry(m.width,m.height);
 if(old)old.dispose();
 // Screen-right is world (+X,-Z) for Semesta's locked ortho yaw=45deg.
 // Do not shift the pivot purely along world X: it changes its screen depth.
 bundle.facade.position.set(m.centerX/Math.SQRT2,m.centerY,-m.centerX/Math.SQRT2);
 bundle.facade.material.map=color;
 bundle.facade.material.needsUpdate=true;
 const u=bundle.facade.material.userData.nativeDepthUniforms;
 u.uNativeDepth.value=depth;
 u.uNativeImageHeight.value=m.imageHeight;
 u.uNativePivotY.value=m.pivotY;
 u.uNativeDepthCenter.value=m.centerDepth;
 bundle.facade.userData.nativePixelDepth=true;
 bundle.facade.userData.displayFacing=dir;
 bundle.facade.userData.groundPivot=[m.pivotX,m.pivotY];
 bundle.view=dir;bundle.metrics=m;
 return true;
}
function attach(THREE,root,spec,dir,color,depth){
 if(!supports(spec))return null;
 const m=metrics(spec,dir);
 const facade=new THREE.Mesh(new THREE.BufferGeometry(),nativeMaterial(THREE,color,depth,m));
 facade.name='NATIVE PIPELINE / physical pixel-depth facade';
 facade.userData.billboardPart=true;
 const bundle={facade,view:null,metrics:null};
 if(!configure(THREE,bundle,spec,dir,color,depth)){
  facade.geometry.dispose();facade.material.dispose();return null;
 }
 root.add(facade);
 return bundle;
}
function faceCamera(bundle,root,camera){
 // Orthographic rays are parallel: yaw must be constant throughout the map.
 // Looking at the camera's position relative to each object introduces
 // different yaw and wrong depth for distant city-block objects.
 const yaw=Math.PI/4;
 const rot=root.rotation.y||0;
 bundle.facade.rotation.y=yaw-rot;
 // Rotate screen-right pivot offset into the object's local coordinates.
 const dx=Math.cos(yaw)*bundle.metrics.centerX;
 const dz=-Math.sin(yaw)*bundle.metrics.centerX;
 bundle.facade.position.x=Math.cos(rot)*dx-Math.sin(rot)*dz;
 bundle.facade.position.z=Math.sin(rot)*dx+Math.cos(rot)*dz;
 bundle.facade.material.userData.nativeDepthUniforms.uNativeScale.value=root.scale.x;
}
g.VLSemestaPipelineGround=Object.freeze({
 version:2,DEPTH_MIN,DEPTH_MAX,FACE_EPSILON,
 supports,view,metrics,projectedSurface,depthDelta,
 nativeMaterial,configure,attach,faceCamera
});
})(typeof window!=='undefined'?window:globalThis);
