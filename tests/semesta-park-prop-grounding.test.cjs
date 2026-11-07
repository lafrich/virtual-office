'use strict';
// Run: node tests/semesta-park-prop-grounding.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'../world-builder');
const win={};
vm.runInNewContext(fs.readFileSync(path.join(root,'semesta-pipeline-ground.js'),'utf8'),
 {window:win,globalThis:win},{filename:'semesta-pipeline-ground.js'});
const ground=win.VLSemestaPipelineGround;
function spec(group,footprint=[2,1],pivotY=57,height=74){
 return {source:'pipeline-street',published:true,group,footprint,
  variants:{sw:{file:'test.png',size:[72,height],pivot:[34,pivotY]}}};
}
const bench=ground.metrics(spec('taman'));
assert.ok(bench.furnitureApronLift>0.4,'bench legs/front apron must clear the terrain');
const bottom=bench.centerY+bench.furnitureApronLift-bench.height/2;
assert.ok(bottom>=0.054,'bench bottom should sit just above terrain');
const building=ground.metrics(spec('kampung',[6,4],57,74));
assert.equal(building.furnitureApronLift,0,'building native depth is not raised');
const tree=ground.metrics(spec('taman',[6,6],57,74));
assert.equal(tree.furnitureApronLift,0,'large footprints are not treated as furniture');
const builder=fs.readFileSync(path.join(root,'builder.js'),'utf8');
assert.match(builder,/VLSemestaWheelGround\?\.contact\(img,authoredPivot\)/);
assert.match(builder,/!plane\.userData\.studioGroundComposite/);
assert.match(builder,/plane\.position\.y=realH\*\(ratio-\.5\)\+\.055/);
console.log('Semesta park props and non-depth sprite ground contact: PASS');
