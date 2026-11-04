const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ctx={};
vm.runInNewContext(fs.readFileSync('world-builder/semesta-pipeline-ground.js','utf8'),ctx);
const ground=ctx.VLSemestaPipelineGround;
const makespec=(id,size,pivot,foot=[4,3])=>({
 id,source:'pipeline-street',published:true,footprint:foot,
 variants:{sw:{size,pivot},se:{size:[size[0]-8,size[1]],pivot:[pivot[0]-4,pivot[1]]}}
});
const s=makespec('rumah_kampung_a',[232,312],[99,262]);
const near=(a,b)=>Math.abs(a-b)<1e-7;
test('complete bitmap retained: facade and balcony below footprint pivot must not be cropped',()=>{
 assert.equal(ground.version,2);
 assert.equal(ground.supports(s),true);
 const m=ground.metrics(s,'sw');
 assert.equal(m.imageWidth,232);
 assert.equal(m.imageHeight,312);
 assert.equal(m.pivotY,262);
 assert.equal(m.hasFrontPixels,true);
 assert.ok(m.height>m.pivotY*(Math.SQRT2/64)*(2/Math.sqrt(3)));
 assert.ok(m.centerY-m.height/2<0,'image extends below ground as real isometric projection');
});
test('invert native 2:1 projection plus per-pixel depth to actual ground, facade and roof height',()=>{
 const center=(4+3)/2;
 for(const [c,r,z] of [[1,2,0],[-1,-.5,0],[0.7,1.5,100],[-.3,-1,222]]){
  const v=16*(c+r)-z;
  const d=center+c+r+z/32;
  const reconstructed=ground.projectedSurface(v,d,center);
  assert.ok(near(reconstructed.cr,c+r));
  assert.ok(near(reconstructed.z,z));
  assert.ok(Number.isFinite(ground.depthDelta(v,d,center)));
 }
});
test('source RGB and pixel-depth textures are full dimensions for each rotated view',()=>{
 const win={};
 vm.runInNewContext(fs.readFileSync('world-builder/pipeline-catalog.js','utf8'),{window:win});
 const published=win.VLAssetCatalog.filter(e=>e.source==='pipeline-street'&&e.published);
 assert.ok(published.length>=34);
 for(const spec of published){
  assert.equal(ground.supports(spec),true,spec.id);
  for(const view of Object.keys(spec.variants||{})){
   const m=ground.metrics(spec,view);
   assert.ok(m&&m.width>0&&m.height>0,spec.id+':'+view);
   assert.ok(m.centerDepth>0,spec.id+':'+view);
  }
 }
});
test('Three source material gets per-texel WebGL depth, alpha cutoff, and proper shadowing',()=>{
 class Material{
  constructor(props){Object.assign(this,props);this.userData={};}
  dispose(){}
 }
 class Geometry{
  constructor(w,h){this.width=w;this.height=h;}
  dispose(){}
 }
 class Mesh{
  constructor(geom,material){this.geometry=geom;this.material=material;this.userData={};this.position={set(...p){this.coords=p}};this.rotation={y:0};}
 }
 const THREE={MeshBasicMaterial:Material,BufferGeometry:Geometry,PlaneGeometry:Geometry,Mesh,DoubleSide:2};
 const root={children:[],scale:{x:1},rotation:{y:0},position:{x:0,z:0},add(x){this.children.push(x)}};
 const rgb={name:'color'},depth={name:'depthmap'};
 const b=ground.attach(THREE,root,s,'sw',rgb,depth);
 assert.ok(b&&b.facade);
 assert.equal(root.children.length,1,'single full native PNG, NOT a row-split billboard');
 assert.equal(b.facade.material.depthTest,true);
 assert.equal(b.facade.material.depthWrite,true);
 assert.equal(b.facade.material.transparent,false);
 assert.equal(b.facade.material.alphaTest,.49);
 assert.equal(b.facade.material.map,rgb);
 assert.equal(b.facade.material.userData.nativeDepthUniforms.uNativeDepth.value,depth);
 const shader={uniforms:{},vertexShader:'#include <uv_vertex>',fragmentShader:'#include <dithering_fragment>'};
 b.facade.material.onBeforeCompile(shader);
 assert.match(shader.fragmentShader,/gl_FragDepth/);
 assert.match(shader.fragmentShader,/texture2D\(uNativeDepth,vNativeUv\)/);
 assert.match(shader.fragmentShader,/uNativeDepthCenter/);
 assert.match(shader.fragmentShader,/trueDepthAdvance/);
 assert.match(shader.vertexShader,/vNativeUv = uv/);
 assert.equal(shader.uniforms.uNativeDepth.value,depth);
 const depth2={name:'depthmap-se'};
 assert.ok(ground.configure(THREE,b,s,'se',{name:'color-se'},depth2));
 assert.equal(b.facade.material.userData.nativeDepthUniforms.uNativeDepth.value,depth2);
 assert.equal(b.view,'se');
 root.scale.x=2.5;
 ground.faceCamera(b,root,{position:{x:10,z:10}});
 assert.equal(b.facade.material.userData.nativeDepthUniforms.uNativeScale.value,2.5);
});
test('builder fetches matching published PNG depth by source variant and uses depth shader path',()=>{
 const js=fs.readFileSync('world-builder/builder.js','utf8');
 const html=fs.readFileSync('world-builder/index.html','utf8');
 assert.ok(js.includes('function pixelDepthTexture(name,dir='));
 assert.ok(js.includes("data.file.slice(0,-4)+'__depth.png'"));
 assert.ok(js.includes('t.colorSpace=THREE.NoColorSpace'));
 assert.ok(js.includes('pipelineGround.attach(THREE,root,spec,view,pixelTexture(item.asset,view),pixelDepthTexture(item.asset,view))'));
 assert.ok(js.includes('pixelDepthTexture(key,dir)'));
 assert.ok(html.indexOf('semesta-pipeline-ground.js')<html.indexOf('builder.js?v='));
});
test('trees, studio buildings and unpublished pipeline shapes retain separate rendering',()=>{
 assert.equal(ground.supports({source:'pipeline-vegetation',published:true,variants:{sw:{size:[20,30],pivot:[10,20]}}}),false);
 assert.equal(ground.supports({source:'custom-building',published:true,variants:{sw:{size:[20,30],pivot:[10,20]}}}),false);
 assert.equal(ground.supports({source:'pipeline-street',published:false,variants:{sw:{size:[20,30],pivot:[10,20]}}}),false);
});
