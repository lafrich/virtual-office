'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'../world-builder',p),'utf8');

// Execute the real effect code against a minimal Three.js contract: this
// catches live JavaScript runtime exceptions that node --check cannot catch.
const draws={clear:0,lamps:[],gradient:0,matrices:[]};
class Quaternion{
 setFromAxisAngle(){return this;}
 copy(){return this;}
}
class Object3D{
 constructor(){
  const v=(prop)=>({set(...coords){this.values=coords;}});
  this.position=v();this.scale=v();this.quaternion=new Quaternion();
 }
 updateMatrix(){this.matrix={position:[...(this.position.values||[])],scale:[...(this.scale.values||[])]};}
}
class Vector3{
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}
 project(){this.x/=32;this.y/=32;this.z=0;return this;}
}
class CircleGeometry{
 constructor(radius,segments){assert.equal(radius,1);assert.equal(segments,24);}
 dispose(){}
}
class MeshBasicMaterial{constructor(opts){Object.assign(this,opts);}dispose(){}}
class InstancedMesh{
 constructor(geo,mat,capacity){
  this.geometry=geo;this.material=mat;this.capacity=capacity;this.count=0;
  this.instanceMatrix={setUsage(){},needsUpdate:false};
  this.matrices=[];
 }
 setMatrixAt(i,m){this.matrices[i]=structuredClone(m);}
}
const THREE={CircleGeometry,MeshBasicMaterial,InstancedMesh,Quaternion,Object3D,Vector3,
 DoubleSide:2,DynamicDrawUsage:5};
const ctx={
 setTransform(){},clearRect(){draws.clear++;},
 fillRect(...args){draws.lamps.push(args);},
 createRadialGradient(){draws.gradient++;throw Error('blur is forbidden');},
 globalAlpha:1,fillStyle:''
};
const glows={width:0,height:0,getContext:()=>ctx};
const canvas={getBoundingClientRect:()=>({width:640,height:480})};
const tint={style:{}},scene={
 items:[],background:{set(c){scene.sky=c;}},
 add(m){this.items.push(m);},remove(m){this.items=this.items.filter(x=>x!==m);}
};
const camera={position:{x:0,y:12,z:0},zoom:1};
const window={devicePixelRatio:1};
vm.runInNewContext(read('semesta-world-effects.js'),{window,THREE,document:{},Math});
const objects=[
 {id:'avatar',type:'avatar',x:1,z:2},
 {id:'crowd',type:'crowd'},
 {id:'npc',type:'quest_npc'},
 {id:'car',type:'vehicle',scale:2.5,visualOffset:{x:.3,z:.2}},
 {id:'house',type:'building'},
 {id:'lamp',type:'lamp',name:'Lampu Taman'}
];
const positions={avatar:{x:1,z:2},crowd:{x:0,z:0},npc:{x:4,z:5},
 car:{x:8,z:1},house:{x:2,z:6},lamp:{x:1,z:1}};
const roots=Object.fromEntries(Object.entries(positions).map(([id,position])=>
 [id,{visible:true,position:{y:0,...position}}]));
const effects=window.VLSemestaWorldEffects.makeWorldEffects({
 THREE,scene,camera,canvas,tint,glows,getObjects:()=>objects,
 getRoot:id=>roots[id],
 getAgent:id=>id==='crowd'?{parts:[
  {child:{position:{x:-.3,z:0}}},
  {child:{position:{x:.3,z:0}}}
 ]}:null,
 getCategory:o=>['avatar','crowd','npc'].includes(o.id)?'actor':o.type,
 getSpec:()=>({height:4.4})
});
const noon={night:0,glow:0,sky:'#b9d5e2',sun:{x:1,z:0,height:1},cast:.35,contact:.28};
const midnight={night:.78,glow:1,sky:'#71869b',sun:{x:-1,z:1,height:0},cast:.01,contact:.02};
effects.update(.2,noon,true);
const shadows=scene.items.find(x=>x.name==='Semesta Character Contact Shadows');
assert.ok(shadows,'character contact shadow mesh exists');
assert.equal(shadows.count,4,'one shadow per avatar, NPC and two crowd members; not vehicles or buildings');
assert.equal(shadows.material.opacity,.23);
assert.equal(shadows.material.depthWrite,false);
assert.equal(draws.lamps.length,0,'no lamps lit in daytime');
const before=structuredClone(shadows.matrices);
effects.update(.2,midnight,true);
assert.deepEqual(shadows.matrices,before,'position and size of every character shadow must be independent of sun/day-night');
assert.equal(shadows.count,4);
assert.ok(Number(tint.style.opacity)>0&&Number(tint.style.opacity)<=.22,'night tint subtle');
assert.equal(draws.lamps.length,1,'only lamp asset lights up, not vehicle/building');
assert.ok(ctx.globalAlpha===1,'canvas opacity restored');
assert.equal(draws.gradient,0,'never use a blur or radial light');
roots.npc.position.x=12;
effects.update(.2,midnight,true);
assert.notDeepEqual(shadows.matrices,before,'shadows follow moving characters');
effects.dispose();
assert.equal(scene.items.length,0);
console.log('PASS: error-free runtime at noon/midnight, 4 persistent round shadows, sharp subtle lamp asset, no blurry light');
