'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'../world-builder');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const window={};
vm.runInNewContext(read('semesta-wheel-ground.js'),{window});
vm.runInNewContext(read('semesta-vehicle-placement.js'),{window});
const ground=window.VLSemestaWheelGround,placement=window.VLSemestaVehiclePlacement;
function pixels(w,h,shapes=[]){
 const data=new Uint8ClampedArray(w*h*4);
 for(const {x0,x1,y0,y1,alpha=255} of shapes)
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)
   data[(y*w+x)*4+3]=alpha;
 return data;
}
function canvas(w,h,data){
 return {width:w,height:h,getContext(){return {getImageData(){return {data};}};}};
}
test('opaque tyre row, not lower alpha-56 shadow or source centre pivot, sets road contact',()=>{
 const w=160,h=108,im=canvas(w,h,pixels(w,h,[
  {x0:25,x1:133,y0:48,y1:83},
  {x0:38,x1:60,y0:83,y1:100},
  {x0:99,x1:120,y0:87,y1:100},
  {x0:12,x1:150,y0:104,y1:105,alpha:56}
 ]));
 const found=ground.contact(im,100/138);
 assert.equal(found.source,'opaque-tyre');
 assert.equal(found.row,101);
 assert.equal(found.ratio,101/108);
 // Contact line in pixel art becomes ground clearance, exactly.
 const width=2.75,height=width*(h/w)*(2/Math.sqrt(3));
 const y=ground.pivotHeight(height,found.ratio);
 const rowY=y-height*(found.ratio-.5);
 assert(Math.abs(rowY-ground.GROUND_CLEARANCE)<1e-12);
 assert(ground.GROUND_CLEARANCE>0&&ground.GROUND_CLEARANCE<.06);
});
test('actual HTMLImageElement image readback uses a scratch canvas, not source pivot guess',()=>{
 const w=146,h=138;
 const data=pixels(w,h,[
  {x0:20,x1:125,y0:32,y1:95},
  {x0:28,x1:48,y0:91,y1:129},
  {x0:97,x1:118,y0:91,y1:129},
  {x0:0,x1:145,y0:136,y1:137,alpha:56}
 ]);
 let draws=0;
 const frame={naturalWidth:w,naturalHeight:h};
 const factory=()=>({
  width:0,height:0,
  getContext(){return {
   clearRect(){},drawImage(image){assert.equal(image,frame);draws++;},
   getImageData(){return {data};}
  };}
 });
 const contact=ground.contact(frame,100/138,factory);
 assert.equal(contact.source,'opaque-tyre');
 assert.equal(contact.row,130);
 assert(contact.ratio>100/138);
 const cache=ground.contact(frame,100/138,()=>{throw Error('should be cached');});
 assert.equal(cache.row,130);
 assert.equal(draws,1);
});
test('unreadable or tainted historical images safely fall back to source pivot',()=>{
 const bad={naturalWidth:146,naturalHeight:138};
 const val=ground.contact(bad,100/138,()=>({getContext(){throw Error('CORS');}}));
 assert.equal(val.source,'authored-fallback');
 assert.equal(val.ratio,100/138);
 assert.equal(ground.contact(null,.85).ratio,.85);
});
test('all saved vehicles use AUTO ground by default, with Y override explicitly opt-in',()=>{
 const v={type:'vehicle',vehicleId:'sedan_red',scale:1.6,
  visualOffset:{x:.2,y:.54,z:-.3}};
 assert.equal(placement.autoGround(v),true);
 placement.normalize(v);
 assert.equal(v.autoGround,true);
 const group={position:{set(x,y,z){this.x=x;this.y=y;this.z=z;}}};
 placement.apply(group,v);
 assert.equal(group.position.y,0);
 assert(Math.abs(group.position.x-.125)<1e-10);
 assert(Math.abs(group.position.z+.1875)<1e-10);
 assert.equal(v.visualOffset.y,.54,'old tuning preserved, though ignored while auto');
 v.autoGround=false;
 placement.apply(group,v);
 assert(Math.abs(group.position.y-.54/1.6)<1e-10,'manual override still possible');
 v.autoGround=true;placement.apply(group,v);assert.equal(group.position.y,0);
});
test('vehicle art uses wheel-contact helper for preview, PNG, rider and user-linked image',()=>{
 const js=read('semesta-traffic-art.js'),builder=read('builder.js'),html=read('index.html');
 assert.match(js,/wheelGround\?\.contact\(image,fallback\)/);
 assert.match(js,/wheelGround\?\.pivotHeight\(height,contact\.ratio\)/);
 assert.match(js,/alphaTest:\.55,depthTest:true,depthWrite:true/);
 assert.match(js,/setGroundPivot\(!!ready\)/);
 assert.match(builder,/gfx\.setGroundPivot\?\.\('fitted'\)/);
 assert.match(html,/semesta-wheel-ground\.js\?v=wheel-contact-v1/);
 assert.match(html,/id="vehicleAutoGround"/);
 assert.match(builder,/e\.autoGround=vehiclePlacement\.autoGround\(p\)/);
 assert.match(builder,/\$\('vehicleOffsetY'\)\.disabled=vehiclePlacement\.autoGround\(cur\)/);
 assert.match(builder,/o\.autoGround=true;/);
});
test('twelve vehicle variants have valid persisted ground pivot metadata',()=>{
 const cat={};vm.runInNewContext(read('semesta-traffic-catalog.js'),{window:cat});
 assert.equal(cat.VLSemestaCatalog.vehicles.length,12);
 for(const spec of cat.VLSemestaCatalog.vehicles){
  assert(spec.size[0]>0&&spec.size[1]>0,spec.id);
  assert(spec.pivot[1]>0&&spec.pivot[1]<spec.size[1],spec.id);
  assert(['car','motor'].includes(spec.group),spec.id);
 }
});
