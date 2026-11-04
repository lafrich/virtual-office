'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'../world-builder'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const window={};for(const file of ['semesta-wheel-ground.js','semesta-vegetation-ground.js','vegetation-catalog.js'])
 vm.runInNewContext(read(file),{window},{filename:file});
const api=window.VLSemestaVegetationGround;
const trees=window.VLVegetation.entries.filter(api.isTree);
function canvas(w,h,pixels){
 return {width:w,height:h,getContext(){return {getImageData(){return {data:pixels};}};}};
}
function pixels(w,h,specs){
 const data=new Uint8ClampedArray(w*h*4);
 for(const {x0,x1,y0,y1,alpha} of specs)
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)
   data[(y*w+x)*4+3]=alpha;
 return data;
}
test('all 22 published tree species have native dimensions, trunk pivots and auto-ground eligibility',()=>{
 assert.equal(trees.length,22);
 for(const spec of trees){
  assert.equal(spec.published,true);
  assert.equal(spec.group,'Vegetation • trees');
  assert(spec.pivot[1]>0&&spec.pivot[1]<spec.size[1],spec.id);
  assert(spec.size[0]>0&&spec.size[1]>0,spec.id);
  assert.equal(api.isTree(spec),true);
  const p=api.anchor(spec,null,spec.height);
  assert(p.y>0&&p.ratio>0&&p.ratio<=1,spec.id);
  assert.equal(p.source,'authored-fallback');
 }
});
test('opaque tree root / grass skirt below pivot seats at above-ground terrain clearance, ignoring alpha 56/90 shadows',()=>{
 const w=120,h=150;
 const pix=pixels(w,h,[
  {x0:50,x1:70,y0:30,y1:134,alpha:255},
  {x0:38,x1:87,y0:128,y1:142,alpha:255},
  {x0:0,x1:119,y0:143,y1:148,alpha:56},
  {x0:15,x1:104,y0:143,y1:145,alpha:90}
 ]);
 const spec={source:'pipeline-vegetation',group:'Vegetation • trees',published:true,size:[w,h],pivot:[60,122]};
 const height=4;
 const p=api.anchor(spec,canvas(w,h,pix),height);
 assert.equal(p.source,'opaque-tyre');
 assert.equal(p.row,143);
 assert(p.ratio>spec.pivot[1]/spec.size[1]);
 // The opaque grass skirt is seated on the world tile (not at negative Y).
 assert(Math.abs((p.y-height*(p.ratio-.5))-api.CLEARANCE)<1e-9);
 assert(api.CLEARANCE>0&&api.CLEARANCE<.09);
});
test('canopy and shadow only do not move roots below authoritative source anchor',()=>{
 const w=100,h=140;
 const pix=pixels(w,h,[
  {x0:35,x1:60,y0:20,y1:110,alpha:255},
  {x0:5,x1:94,y0:117,y1:139,alpha:56}
 ]);
 const spec={source:'pipeline-vegetation',group:'Vegetation • trees',published:true,size:[w,h],pivot:[50,125]};
 const a=api.anchor(spec,canvas(w,h,pix),3.5);
 assert(a.ratio>=125/140);
 assert.equal(a.ratio,125/140);
});
test('ground overlays, building, old procedural trees and non-published vegetation unaffected',()=>{
 for(const spec of [
  {source:'pipeline-vegetation',group:'Vegetation • ground',published:true},
  {source:'pipeline-vegetation',group:'Vegetation • trees',published:false},
  {source:'custom-building',group:'Vegetation • trees',published:true}
 ]){assert.equal(api.isTree(spec),false);assert.equal(api.anchor(spec,null,4),null);}
 const builder=read('builder.js'),html=read('index.html');
 assert.match(html,/semesta-wheel-ground\.js\?v=wheel-contact-v1[\s\S]*?semesta-vegetation-ground\.js\?v=tree-ground-contact-v1/);
 assert.match(builder,/vegetationGround=window\.VLSemestaVegetationGround/);
 assert.match(builder,/if\(vegetationGround\?\.isTree\(spec\)\)/);
 assert.match(builder,/plane\.position\.y=contact\.y/);
 assert.match(builder,/plane\.userData\.nativeContactRatio=contact\.ratio/);
 assert.match(builder,/\{transparent:false,depthTest:true,depthWrite:true,alphaTest:\.5\}/);
 assert(!read('semesta-vegetation-ground.js').includes('depthTest:false'));
});
