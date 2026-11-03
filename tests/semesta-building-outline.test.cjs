'use strict';
// node tests/semesta-building-outline.test.cjs
// Regression for the schematic building view without requiring WebGL.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..','world-builder');
const source=fs.readFileSync(path.join(root,'building-outline.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const editor=fs.readFileSync(path.join(root,'builder.js'),'utf8');
const w={},mock={};
class Matrix4{
 copy(){return this;}invert(){return this;}multiplyMatrices(){return this;}
}
class Vector3{
 fromBufferAttribute(a,i){this.x=a.data[3*i];this.y=a.data[3*i+1];this.z=a.data[3*i+2];return this;}
 applyMatrix4(){return this;}
}
class EdgesGeometry{
 getAttribute(){return {count:2,data:[0,0,0,1,0,1]};}
 dispose(){this.disposed=true;}
}
class BufferGeometry{setAttribute(name,value){this[name]=value;}dispose(){this.disposed=true;}}
class Float32BufferAttribute{constructor(data,size){this.data=data;this.itemSize=size;}}
class Color{constructor(){this.r=.3;this.g=.5;this.b=.7;}}
class Material{constructor(options){Object.assign(this,options);}dispose(){this.disposed=true;}}
class Mesh{constructor(geom,material){this.geometry=geom;this.material=material;this.userData={};this.position={};}}
class LineSegments{constructor(geom,material){this.geometry=geom;this.material=material;this.userData={};}}
class Group{
 constructor(){this.children=[];this.userData={};}
 add(...children){for(const c of children){this.children.push(c);c.parent=this;}}
}
class BoxGeometry{constructor(w,h,d){this.width=w;this.height=h;this.depth=d;}dispose(){this.disposed=true;}}
Object.assign(mock,{Matrix4,Vector3,EdgesGeometry,BufferGeometry,Float32BufferAttribute,
 Color,LineBasicMaterial:Material,MeshBasicMaterial:Material,Mesh,LineSegments,
 Group,BoxGeometry,DoubleSide:2});
vm.runInNewContext(source,{window:w});
const sceneRoot={matrixWorld:new Matrix4(),updateWorldMatrix(){},
 traverse(callback){callback({isMesh:true,geometry:{},matrixWorld:new Matrix4(),userData:{}});}};
const model=w.VLSemestaBuildingOutline.build(mock,sceneRoot,{type:'building',w:9,d:6,h:10},new Map());
assert.ok(model.segmentCount>=18);
assert.equal(model.group.children.length,2);
const line=model.group.children.find(x=>x.userData.buildingOutlineLine);
const picker=model.group.children.find(x=>x.userData.buildingOutlinePick);
assert.ok(line);
assert.ok(picker);
assert.equal(picker.geometry.width,9);
assert.equal(picker.geometry.height,10);
assert.equal(picker.geometry.depth,6);
assert.equal(picker.material.colorWrite,false);
assert.equal(picker.material.depthWrite,false);
assert.equal(line.geometry.position.data.length,line.geometry.color.data.length);
assert.match(html,/id="buildingViewMode"/);
assert.match(html,/id="buildingOutlineTool"/);
assert.match(html,/building-outline\.js\?v=/);
assert.match(editor,/function applyBuildingGuide/);
assert.match(editor,/applyBuildingGuide\(root,o\);/);
assert.match(editor,/applyBuildingGuide\(root,item\);/);
assert.match(editor,/function removeBuildingGuide/);
assert.match(editor,/function setBuildingView/);
assert.match(editor,/localStorage\.setItem\(BUILDING_VIEW_KEY/);
const count=model.segmentCount;
model.dispose();
assert.equal(line.geometry.disposed,true);
assert.equal(picker.geometry.disposed,true);
console.log('Semesta outline / selection proxy / reversible renderer PASS: '+count+' segments');
