"use strict";
// Test real Semesta rig with a minimal 3D/canvas host: the body really tilts,
// ground anchor and offset update, and the same actor's expression is composited.
const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const traced=[];
const ctx={imageSmoothingEnabled:false,clearRect(){},drawImage(){},
 fillRect(){},fillText(){},save(){},restore(){},beginPath(){},rect(){},clip(){}};
const document={createElement:()=>({width:64,height:112,getContext:()=>ctx})};
class ImageMock{
 constructor(){this.naturalWidth=64;this.naturalHeight=112;this.ready=false;}
 set src(value){
  this.url=value;
  if(String(value).includes("legacy_theodore-face")){this.naturalWidth=768;this.naturalHeight=448;}
  if(String(value).includes("legacy_theodore-sheet")){this.naturalWidth=384;this.naturalHeight=4928;}
  if(this.onload)this.onload();
 }
}
class CanvasTexture{constructor(){this.needsUpdate=false;}dispose(){}}
class MeshBasicMaterial{constructor(props){Object.assign(this,props)}dispose(){}}
class PlaneGeometry{constructor(w,h){this.width=w;this.height=h;}dispose(){}}
class Mesh{
 constructor(geometry,material){
  this.geometry=geometry;this.material=material;this.position={x:0,y:0,z:0};
  const rotation={x:0,y:0,z:0};
  rotation.set=(x,y,z)=>{rotation.x=x;rotation.y=y;rotation.z=z;};
  this.rotation=rotation;this.userData={};
 }
}
const THREE={CanvasTexture,MeshBasicMaterial,PlaneGeometry,Mesh,
 SRGBColorSpace:"srgb",NearestFilter:"nearest",DoubleSide:2};
const actor={id:"legacy_theodore",sheet:"media/legacy_theodore-sheet.png",
 motions:[{id:"idle",available:true,frames:4,row:4,frame_ms:[210,210,210,210]}],
 expressions:[{id:"sleepy",label:"Sleepy",sheet:"media/legacy_theodore-face-sleepy-4dir.png"}]};
const g={
 VLPipelineAssets:{characters:[],character:()=>null},
 VLMahlukHidup:{
  has:id=>id==="legacy_theodore",get:id=>id==="legacy_theodore"?actor:null,
  url:path=>"/virtual-life-asset-pipeline/"+path,
  equipmentFor:()=>({}),list:()=>[actor]
 },
 VLActionTemplates:{
  get:(id,action)=>id==="legacy_theodore"&&action==="lie_down"?
   {ready:true,rotation:90,expression:"sleepy",objectLayer:"behind",
    frames:4,frameMs:320,loop:false}:null,
  frame:(id,action,dir,i)=>"data:image/png;base64,frame"+i
 },
 VLActionFrames:{get:()=>null,offset:()=>({x:6,y:-3})},
 VLActionAppearance:{drawExpression:(...args)=>{traced.push([args[1].id,args[2],args[3]]);return true;}}
};
vm.runInNewContext(fs.readFileSync("world-builder/pipeline-character-rig.js","utf8"),{
 window:g,document,Image:ImageMock,console,Math
});
const rig=g.VLCharacterRig.createRig(THREE,{profile:"legacy_theodore",direction:"sw",pose:"lie_down"});
const camera={position:{x:0,z:10}};
rig.step(.05,camera,{x:0,z:0});
assert.equal(rig.state.rotation,90);
assert.equal(rig.state.expression,"sleepy");
assert.equal(rig.state.objectLayer,"behind");
assert.ok(Math.abs(rig.mesh.rotation.z-Math.PI/2)<1e-5,"Lying action should rotate actual game billboard");
assert.ok(Math.abs(rig.mesh.position.x)>0.1,"90-degree action should reanchor at feet");
assert.ok(rig.mesh.position.y>=0,"Lying sprite must not sink through floor");
assert.deepEqual(traced[0].slice(0,2),["sleepy","sw"]);
rig.setPose(null);
rig.step(.05,camera,{x:0,z:0});
assert.equal(rig.state.rotation,0,"Returning to idle must restore upright orientation");
assert.equal(rig.mesh.rotation.z,0,"Native avatar orientation should not inherit past rotation");
assert.equal(rig.state.expression,"neutral");
assert.ok(Math.abs(rig.mesh.position.x)<1e-7,"Native movement must not preserve horizontal sleep offset");
console.log("PASS real Semesta 3D character rig: 90-degree bed pose, native facial expression, ground offset and idle reset");
