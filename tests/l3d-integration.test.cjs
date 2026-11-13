'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
function sandbox(){
 const store=new Map();
 const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
 const window={VLAssetCatalog:[{file:'pipeline:bangku_taman',source:'pipeline-street'}]};
 const context=vm.createContext({window,localStorage,console});
 vm.runInContext(read('shared/l3d-library.js'),context,{filename:'shared/l3d-library.js'});
 return {window,localStorage,context,store};
}
const model={metadata:{type:'Object',version:4.7},object:{uuid:'test-geometry-root',type:'Group',children:[]}};
const create=()=>({format:'semesta-l3d-asset-v1',version:1,id:'bus_tj_3d',name:'TransJakarta 3D',
 kind:'vehicle',footprint:[7.5,2.3],height:3.1,collision:true,
 coordinateSystem:'semesta-xz-yup',pivot:'ground-center',model});
test('3D asset contract accepts true Object3D JSON and rejects invalid footprint',()=>{
 const lib=sandbox().window.VLL3DLibrary;
 assert.equal(lib.validate(create()),true);
 assert.throws(()=>lib.validate({...create(),footprint:[0,3]}),/Footprint/);
 assert.throws(()=>lib.validate({...create(),kind:'script'}),/category/);
 assert.throws(()=>lib.validate({...create(),model:{}}),/Object3D/);
});
test('L3D save and Semesta intake preserve source PNGs and 3D mesh metadata',()=>{
 const {window,context}=sandbox();
 const lib=window.VLL3DLibrary;lib.save(create());
 assert.deepEqual(Array.from(lib.get('bus_tj_3d').footprint),[7.5,2.3]);
 assert.equal(lib.catalogEntries()[0].file,'l3d:bus_tj_3d');
 vm.runInContext(read('world-builder/l3d-intake.js'),context,{filename:'world-builder/l3d-intake.js'});
 assert.equal(window.VLAssetCatalog.length,2);
 assert.equal(window.VLAssetCatalog[0].file,'pipeline:bangku_taman');
 assert.equal(window.VLAssetCatalog[1].source,'l3d-3d');
 assert.equal(window.VLAssetCatalog[1].collision,true);
 assert.equal(window.VLSemestaL3DIntake.count,1);
});
test('Semesta attaches native Object3D scene, never converts it into a billboard',()=>{
 const lib=sandbox().window.VLL3DLibrary;lib.save(create());
 const placed=[];
 const root={add:node=>placed.push(node),userData:{}};
 class ObjectLoader{parse(payload){assert.equal(payload.metadata.type,'Object');
  return {name:'',traverse:handler=>handler({isMesh:true})};}}
 assert.equal(lib.attach({ObjectLoader},root,{l3dId:'bus_tj_3d'}),true);
 assert.equal(placed.length,1);
 assert.match(placed[0].name,/L3D \/ TransJakarta 3D/);
 assert.equal(root.userData.l3dType,'vehicle');
});
test('L3D editor and Semesta share a pipeline with no change to legacy sprite internals',()=>{
 const html=read('l3d/index.html'),js=read('l3d/app.js'),world=read('world-builder/index.html');
 const builder=read('world-builder/builder.js'),style=read('world-builder/style-rules.js');
 const launch=read('membangun/index.html'),mobile=read('membangun/laptop.html');
 for(const id of ['view','modelInput','jsonInput','jsonTree','jsonRaw','saveAsset','downloadAsset','sizeW','sizeD','sizeH','assetKind'])assert.ok(html.includes('id="'+id+'"'),id);
 for(const text of ['GLTFLoader','OBJLoader','FBXLoader','ObjectLoader','OrbitControls','fitToFootprint','assignFace','JSON.parse','JSON.stringify'])assert.ok(js.includes(text),text);
 assert.ok(world.includes('<option value="l3d">'));
 assert.ok(world.includes('shared/l3d-library.js'));
 assert.ok(world.includes('./l3d-intake.js'));
 assert.ok(world.indexOf('l3d-intake.js')<world.indexOf('builder.js?v='));
 assert.ok(builder.includes("if(spec.source==='l3d-3d')"));
 assert.ok(builder.includes('window.VLL3DLibrary?.attach(THREE,root,spec)'));
 assert.ok(style.includes("s?.source!=='l3d-3d'"),'3D objects should rotate 90 degrees');
 assert.ok(launch.includes('data-app="l3d"'));
 assert.ok(launch.includes('data-art="l3d"'));
 assert.ok(launch.includes("const ids=['mahluk','bangun','semesta','jiwa','mainkan','l3d'];"));
 assert.ok(mobile.includes("{id:'l3d',label:'L3D'"));
});
