'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const BASE=path.join(__dirname,'../world-builder');
const read=name=>fs.readFileSync(path.join(BASE,name),'utf8');
const ctx={window:{}};
vm.runInNewContext(read('warteg-3d.js'),ctx);
const api=ctx.window.VLWarteg3D;
const H=Math.SQRT2/64*2/Math.sqrt(3);
const spec={source:'custom-building',label:'Warteg Kharisma Bahari',
 assetPipeline:{family:'warteg_kharisma',version:2},footprint:[8,6],
 variants:Object.fromEntries(['sw','se','ne','nw'].map(dir=>[dir,{size:[440,320],pivot:[220,216]}]))};
class BufferGeometry {
 setAttribute(n,v){this[n]=v;}
 setIndex(v){this.indices=v;}
 computeVertexNormals(){}
}
class Float32BufferAttribute {constructor(array,n){this.array=array;this.itemSize=n;}}
class MeshBasicMaterial {constructor(v){Object.assign(this,v);}}
class Mesh {constructor(geometry,material){this.geometry=geometry;this.material=material;this.userData={};this.name='';}}
class Group {constructor(){this.children=[];this.userData={};this.name='';}add(x){this.children.push(x);}}
const T={BufferGeometry,Float32BufferAttribute,MeshBasicMaterial,Mesh,Group,DoubleSide:2};
test('native depth geometry reconstructs wall + roof surfaces in world coordinates',()=>{
 assert.equal(api.supported(spec),true);
 assert.equal(api.supported({...spec,source:'pipeline-street'}),false);
 assert.equal(api.supported({...spec,label:'Other',assetPipeline:null}),false);
 const panels=api.panels();
 assert(panels.some(p=>p.id==='front'));
 assert(panels.some(p=>p.id==='side'));
 assert(panels.some(p=>p.id==='awning'));
 assert(panels.some(p=>p.id==='roof-right'));
 assert(panels.some(p=>p.id==='right-fascia'));
 assert.deepEqual(Array.from(api.world(4,3,0)),[0,0,0]);
 assert(Math.abs(api.world(4,3,128)[1]-128*H)<1e-9);
 const roof=panels.find(p=>p.id==='roof-right');
 assert(roof.pts.some(p=>p[0]>8.4));
});
test('studio UV maps source pixel grid to real SW + SE 3D world projection',()=>{
 const pivot=[220,216];
 for(const [a,b,z] of [[.6,1.05,45],[8,4,0],[6.4,5.6,145],[4,3,180]]){
  const xyz=api.world(a,b,z);
  const [us,vs]=api.pixelCoords(a,b,z,'sw',pivot);
  assert(Math.abs(us-pivot[0]-(xyz[0]-xyz[2])*32)<1e-9);
  assert(Math.abs(vs-pivot[1]-(xyz[0]+xyz[2])*16+z)<1e-9);
  const x90=xyz[2],z90=-xyz[0];
  const [ue,ve]=api.pixelCoords(a,b,z,'se',pivot);
  assert(Math.abs(ue-pivot[0]-(x90-z90)*32)<1e-9);
  assert(Math.abs(ve-pivot[1]-(x90+z90)*16+z)<1e-9);
 }
});
test('mesh uses alpha-tested real WebGL depth, never forced overlay above people',()=>{
 const root=new Group();
 const texture={source:'native-sprite'};
 assert.equal(api.attach(T,root,spec,'sw',texture),true);
 assert.equal(root.children[0].children.length,api.panels().length);
 const parts=root.children[0].children;
 for(const m of parts){
  assert.equal(m.material.transparent,false,m.name);
  assert.equal(m.material.depthTest,true,m.name);
  assert.equal(m.material.depthWrite,true,m.name);
  assert.equal(m.material.alphaTest,.49,m.name);
  assert.equal(m.userData.billboardPart,false,m.name);
  assert.equal(m.material.map,texture,m.name);
  assert(m.geometry.position.array.length>=9);
  assert.equal(m.geometry.uv.array.length*3,m.geometry.position.array.length*2);
 }
});
test('exterior door world position rotates with object and can enter from outside',()=>{
 const o={x:5,z:9,rotation:0};
 const p=api.doorPosition(o);
 assert.equal(api.distanceToDoor({x:p.x,z:p.z},o),0);
 assert(api.distanceToDoor({x:p.x+3,z:p.z},o)>2.1);
 const after=api.doorPosition({...o,rotation:90});
 assert(Math.hypot(p.x-after.x,p.z-after.z)>1);
});
test('Semesta integrates four native variant meshes, visible Enter and Walk Test E key',()=>{
 const html=read('index.html'),js=read('builder.js'),interior=read('bangun-ruang/semesta-interior-preview.js');
 assert.match(html,/warteg-3d\.js\?v=/);
 assert.match(html,/id="quickEnterBuilding"/);
 assert.match(html,/\/virtual-life-asset-pipeline\/warteg-interior-paint\.js/);
 assert.match(html,/\.\/bangun-ruang\/warteg-interior-paint\.js\?v=semesta-warteg-v2/);
 assert.match(js,/VLWarteg3D\.attach\(THREE,layer,spec,dir,pixelTexture/);
 assert.match(js,/root\.userData\.wartegTrueDepth=true/);
 assert.match(js,/root\.userData\.warteg3DVariants=views/);
 assert.match(js,/const display=spriteDirection\(o.rotation\)/);
 assert.match(js,/interiorPreview\.openFor\(nearest\.o\)/);
 assert.match(js,/mode==='walk'\)\{e\.preventDefault\(\);/);
 assert.match(js,/if\(!window\.SemestaLifePlay\?\.handleAction\?\.\(\)\)enterNearbyBuilding\(\)/);
 assert.match(interior,/openFor\(item\)\{[^}]*return open\(item\);\}/);
});
