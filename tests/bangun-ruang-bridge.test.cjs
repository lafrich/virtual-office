const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'../world-builder/bangun-ruang/semesta-bridge.js'),'utf8');

function run(value){
 const window={VLAssetCatalog:[Object.freeze({file:'pipeline:existing',source:'pipeline-street'})]};
 const storage={getItem(key){assert.equal(key,'virtual-life-bangun-ruang-v1');return JSON.stringify(value);}};
 vm.runInNewContext(source,{window,localStorage:storage,console});
 return window;
}

test('local four-view building becomes published Semesta sprite with metadata',()=>{
 const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';
 const views=Object.fromEntries(['sw','se','ne','nw'].map(dir=>[dir,{url:png,size:[288,270],pivot:[144,220]}]));
 const w=run([{id:'br-warung-123',name:'Warung Madura',config:{w:3,d:4,collision:'yes'},views,
   footprint:[3,4],entranceFacing:'se',interactions:['enter','buy']}]);
 assert.equal(w.VLBuildingBridge.count,1);
 assert.equal(w.VLAssetCatalog.length,2);
 const asset=w.VLAssetCatalog[1];
 assert.equal(asset.source,'custom-building');
 assert.equal(asset.file,'studio:br-warung-123');
 assert.equal(asset.collision,true);
 assert.equal(asset.published,true);
 assert.equal(asset.entranceFacing,'se');
 assert.equal(asset.interactions[1],'buy');
 assert.deepEqual(Array.from(asset.footprint),[3,4]);
 assert.equal(Object.keys(asset.variants).length,4);
 assert.equal(w.VLBuildingBridge.image('br-warung-123','nw'),png);
});

test('malformed, oversized or missing-image assets are not registered',()=>{
 const w=run([
  {id:'../bad',config:{w:3,d:3},views:{sw:{url:'data:image/png;base64,AA',size:[64,64],pivot:[32,60]}}},
  {id:'br-too-big',config:{w:999,d:3},views:{sw:{url:'data:image/png;base64,AA',size:[64,64],pivot:[32,60]}}},
  {id:'br-no-images',config:{w:3,d:3},views:{}}
 ]);
 assert.equal(w.VLBuildingBridge.count,0);
 assert.equal(w.VLAssetCatalog.length,1);
});
