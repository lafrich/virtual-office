const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../world-builder/semesta-elevation.js'),'utf8'),ctx);
const e=ctx.window.VLSemestaElevation;
const catalog=new Map([['shop',{height:6.4,footprint:[4,4]}]]);
const style={
 category(o){return o.type==='building'?'building':o.type==='sprite'?'building':o.type==='box'?'prop':'furniture';},
 footprint(o){return [o.w||1,o.d||1];}
};
test('Land, level, custom Y change physical coordinates without touching XZ',()=>{
 const o={id:'box',type:'box',x:2,z:8,y:0,scale:1};
 e.apply(o,'level:2',0,[],catalog,style);
 assert.equal(o.y,6.4);assert.equal(o.x,2);assert.equal(o.z,8);
 e.apply(o,'custom',7.7,[],catalog,style);assert.equal(o.y,7.7);
 e.apply(o,'land',0,[],catalog,style);assert.equal(o.y,0);
});
test('Surface snap uses top support, not the ground plane',()=>{
 const roof={id:'roof',type:'building',x:0,z:0,y:0,w:6,d:6,h:6.4,scale:1};
 const ray={origin:{x:0,y:20,z:0},direction:{x:0,y:-1,z:0}};
 const hit=e.surfaceAtRay(ray,[roof],catalog,style);
 assert.equal(hit.y,6.4);assert.equal(hit.supportId,'roof');
 const o={id:'crate',type:'box',x:0,z:0,y:0};
 e.apply(o,'surface',0,[roof],catalog,style,hit);
 assert.equal(o.y,6.4);
 const clear=e.surfaceAtRay({origin:{x:20,y:20,z:0},direction:{x:0,y:-1,z:0}},[roof],catalog,style);
 assert.equal(clear.y,0);
});
test('Surface snap chooses the closest upper supporting surface',()=>{
 const roof={id:'roof',type:'building',x:0,z:0,y:0,w:6,d:6,h:6.4};
 const rooftop={id:'upper',type:'building',x:0,z:0,y:6.4,w:2,d:2,h:3.2};
 const ray={origin:{x:0,y:30,z:0},direction:{x:0,y:-1,z:0}};
 assert.equal(e.surfaceAtRay(ray,[roof,rooftop],catalog,style).y,9.6);
 assert.equal(e.surfaceBelow(0,0,[roof,rooftop],catalog,style).supportId,'upper');
});
test('Vertical separation allows stacked props but same elevation collides',()=>{
 const a={type:'building',y:0,h:6.4};
 const b={type:'box',y:6.4};
 assert.equal(e.verticalOverlap(a,b,catalog,style),false);
 b.y=6.3;assert.equal(e.verticalOverlap(a,b,catalog,style),true);
 b.y=0;assert.equal(e.verticalOverlap(a,b,catalog,style),true);
});
test('Existing nonzero height without metadata stays custom; animated traffic stays ground',()=>{
 assert.equal(e.selection({y:7.8}),'custom');
 const bus={type:'vehicle',y:0};
 e.apply(bus,'level:2',0,[],catalog,style);
 assert.equal(bus.y,0);
});
