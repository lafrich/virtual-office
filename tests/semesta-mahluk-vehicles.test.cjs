'use strict';
// Regression: Semesta uses canonical Mahluk Hidup street PNGs when deployed,
// keeps preview silhouettes for missing files, and preserves the 2-grid bus.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const dir=path.join(__dirname,'../world-builder');
const events=[],requested=[];
const g={dispatchEvent(ev){events.push(ev.type);}};
class FakeImage {
 constructor(){this.onload=null;this.onerror=null;this.naturalWidth=0;this.naturalHeight=0;}
 set src(url){
  requested.push(url);
  const bus=/bus_transjakarta/.test(url),gojek=/gojek/.test(url);
  if(bus||gojek){
   this.naturalWidth=bus?272:80;this.naturalHeight=bus?256:116;
   queueMicrotask(()=>this.onload?.());
  }else queueMicrotask(()=>this.onerror?.());
 }
}
class FakeMaterial {constructor(opts){Object.assign(this,opts)}dispose(){}}
const THREE={
 SRGBColorSpace:'sRGB',NearestFilter:1003,DoubleSide:2,
 CanvasTexture:class {dispose(){}},Texture:class {constructor(img){this.image=img;}dispose(){}},
 MeshBasicMaterial:FakeMaterial,PlaneGeometry:class {dispose(){}},
 Mesh:class {constructor(geo,mat){this.geometry=geo;this.material=mat;
  this.position={y:0};this.rotation={y:0};this.userData={};}}
};
const draw={fillRect(){},beginPath(){},ellipse(){},arc(){},fill(){},moveTo(){},lineTo(){},closePath(){},drawImage(){},translate(){},scale(){}};
const ctx=vm.createContext({
 window:g,location:{origin:'https://lafrich.github.io'},URL,Map,Set,Promise,
 Image:FakeImage,CustomEvent:class{constructor(type){this.type=type}},
 document:{createElement(){return {width:0,height:0,getContext(){return draw}}}}
});
for(const file of ['semesta-traffic-catalog.js','semesta-traffic-art.js'])
 vm.runInContext(fs.readFileSync(path.join(dir,file),'utf8'),ctx,{filename:file});
const art=g.VLSemestaArt;
(async()=>{
 const bus=art.vehicleGraphic(THREE,{vehicleId:'bus_transjakarta'});
 const motor=art.vehicleGraphic(THREE,{vehicleId:'gojek'});
 const missing=art.vehicleGraphic(THREE,{vehicleId:'sedan_red'});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(bus.mesh.userData.assetPublished,true);
 assert.equal(motor.mesh.userData.assetPublished,true);
 assert.equal(missing.mesh.userData.assetPublished,false);
 assert.equal(art.sourcePublished('bus_transjakarta'),true);
 assert.equal(art.sourcePublished('gojek'),true);
 assert.equal(art.sourcePublished('sedan_red'),false);
 assert.equal(art.originalCount(),2);
 assert.deepEqual(Array.from(g.VLSemestaCatalog.editorFootprint('bus_transjakarta')),[2,1]);
 assert.ok(requested.some(u=>u.endsWith('/assets/street_vehicles/cars/bus_transjakarta_se.png')));
 assert.ok(requested.some(u=>u.endsWith('/assets/street_vehicles/riders/gojek_se.png')));
 assert.ok(events.includes('semesta-vehicle-source-loaded'));
 bus.update('nw',{position:{x:5,z:6}},{position:{x:0,z:0},rotation:{y:0}});
 await new Promise(resolve=>setImmediate(resolve));
 assert.match(bus.mesh.material.map.image.src||requested.at(-1),/bus_transjakarta_nw\.png/);
 assert.equal(bus.mesh.material.transparent,false,'vehicle depth buffer uses alpha cutouts, not sorted transparent billboards');
 assert.equal(bus.mesh.material.depthWrite,true);
 for(const a of [bus,motor,missing])a.dispose();
 const builder=fs.readFileSync(path.join(dir,'builder.js'),'utf8');
 const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
 assert.match(builder,/semesta-vehicle-source-loaded/);
 assert.match(builder,/trafficArt\?\.retrySources\(\)/);
 assert.match(html,/semesta-traffic-art\.js\?v=wheel-contact-v2/);
 console.log('PASS Semesta Mahluk transport original PNG source, 4-view loading, preview fallback, 2-grid TransJakarta');
})().catch(e=>{console.error(e);process.exitCode=1});
