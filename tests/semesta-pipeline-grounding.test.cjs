const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ctx={};
vm.runInNewContext(fs.readFileSync('world-builder/semesta-pipeline-ground.js','utf8'),ctx,{
 filename:'world-builder/semesta-pipeline-ground.js'
});
const ground=ctx.VLSemestaPipelineGround;
const makespec=(id,size,pivot)=>({
 id,source:'pipeline-street',published:true,
 variants:{sw:{size,pivot},se:{size:[size[0]-8,size[1]],pivot:[pivot[0]-4,pivot[1]]}}
});
const camera={position:{x:50,z:50}};
function round(v){return Math.round(v*1000000)/1000000;}
test('splits facade at the native ground pivot instead of burying the floor apron',()=>{
 const s=makespec('rumah_kampung_a',[232,312],[99,262]);
 assert.equal(ground.supports(s),true);
 const L=ground.layout(s,'sw');
 assert.equal(L.metrics.pivotY,262);
 assert.ok(L.metrics.apronDepth>0);
 assert.ok(L.metrics.upperHeight>0);
 assert.ok(L.metrics.facadeCenterY-L.metrics.upperHeight/2>=.07);
 assert.ok(Math.abs((L.metrics.facadeCenterY-L.metrics.upperHeight/2)-L.metrics.groundY)<1e-9);
 assert.ok(L.metrics.seamUV>0&&L.metrics.seamUV<1);
 assert.equal(L.corners.length,4);
 assert.ok(L.corners.every(p=>p[1]===L.metrics.groundY));
 // The UV ranges meet exactly along the anchor row, no missing strip/overlap.
 assert.equal(L.upperUV[1],L.apronUV[1]);
});
test('the 2:1 ground plane projects back to the exact source-pixel x/y positions',()=>{
 const s=makespec('kantor_a',[474,692],[208,588]);
 const m=ground.metrics(s),p=Math.SQRT2/64;
 for(const px of [0,m.pivotX,m.imageWidth]){
  for(const py of [m.pivotY,m.imageHeight]){
   const [x,y,z]=ground.groundPoint(px,py,m);
   const screenX=(x-z)/Math.SQRT2;
   const down=(x+z)/(2*Math.SQRT2); // 30deg iso elevation
   assert.equal(round(screenX),round((px-m.pivotX)*p));
   assert.equal(round(down),round((py-m.pivotY)*p));
   assert.equal(y,m.groundY);
  }
 }
});
test('all published pipeline-street assets have grounded geometry, even on alternate views',()=>{
 const body=fs.readFileSync('world-builder/pipeline-catalog.js','utf8');
 const window={};
 vm.runInNewContext(body,{window});
 const native=window.VLAssetCatalog.filter(s=>s.source==='pipeline-street'&&s.published);
 assert.ok(native.length>=25,native.length);
 for(const s of native){
  assert.equal(ground.supports(s),true,s.id);
  for(const direction of Object.keys(s.variants||{})){
   const m=ground.metrics(s,direction);
   assert.ok(m&&m.upperHeight>0,s.id+':'+direction);
   assert.ok(m.facadeCenterY-m.upperHeight/2>=m.groundY-1e-12,s.id+':'+direction);
   assert.ok(m.apronDepth>=0);
  }
 }
});
test('native 3D mesh renderer depth-tests instead of drawing over actors and buildings',()=>{
 const s=fs.readFileSync('world-builder/semesta-pipeline-ground.js','utf8');
 assert.match(s,/depthTest:true/);
 assert.match(s,/depthWrite:true/);
 assert.match(s,/alphaTest:\.49/);
 assert.doesNotMatch(s,/depthTest:\\s*false\\s*,\\s*depthWrite/);
 assert.ok(!s.includes('position.y=realH*(py-.5)'));
});
test('runtime connects grounded native architecture to billboard facing and rotation',()=>{
 const code=fs.readFileSync('world-builder/builder.js','utf8');
 const page=fs.readFileSync('world-builder/index.html','utf8');
 assert.ok(code.includes('pipelineGround?.supports(spec)'));
 assert.ok(code.includes('pipelineGround.attach(THREE,root,spec,view,pixelTexture(item.asset,view))'));
 assert.ok(code.includes('pipelineGround.configure(THREE,groundBundle,spec,dir,pixelTexture(key,dir))'));
 assert.ok(code.includes('pipelineGround.faceCamera(groundBundle,root,camera)'));
 assert.ok(page.includes('semesta-pipeline-ground.js'));
 assert.ok(page.indexOf('semesta-pipeline-ground.js')<page.indexOf('builder.js?v='));
});
test('forest sprites, studio buildings and unpublished metadata stay on their own paths',()=>{
 assert.equal(ground.supports({source:'pipeline-vegetation',published:true,variants:{sw:{size:[10,20],pivot:[5,18]}}}),false);
 assert.equal(ground.supports({source:'custom-building',published:true,variants:{sw:{size:[10,20],pivot:[5,18]}}}),false);
 assert.equal(ground.supports({source:'pipeline-street',published:false,variants:{sw:{size:[10,20],pivot:[5,18]}}}),false);
});
