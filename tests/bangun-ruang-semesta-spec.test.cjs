const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'../world-builder');
const load=(name,w)=>vm.runInNewContext(fs.readFileSync(path.join(root,name),'utf8'),{window:w});

test('Bangun Ruang builds from Semesta catalog footprints instead of invented templates',()=>{
 const w={VLAssetCatalog:[]};load('pipeline-catalog.js',w);load('semesta-building-spec.js',w);
 const specs=w.VLSemestaBuildingSpecs;
 assert.equal(specs.all.length,18);
 assert.equal(specs.byId('semesta:small').footprint.join(','),'3,3');
 assert.equal(specs.byId('semesta:medium').footprint.join(','),'5,4');
 assert.equal(specs.byId('semesta:large').footprint.join(','),'8,6');
 assert.equal(specs.byId('pipeline:ruko_a').footprint.join(','),'3,6');
 assert.equal(specs.byId('pipeline:warung_madura').footprint.join(','),'3,3');
 assert.equal(specs.byId('pipeline:kantor_a').footprint.join(','),'7,6');
 assert.equal(specs.byId('pipeline:mall').footprint.join(','),'12,7');
 assert.equal(specs.byId('pipeline:rumah_kampung_a').footprint.join(','),'3,3.2');
 assert.equal(specs.byId('pipeline:ruko_a').variants.sw.pivot.join(','),'144,370');
 assert.equal(specs.tilePixels.join(','),'64,32');
 assert.equal(specs.directions.join(','),'sw,se,ne,nw');
 for(const k of ['small','medium','large']){
  assert.equal(specs.nativeDefaults[k].w,specs.byId('semesta:'+k).footprint[0]);
  assert.equal(specs.nativeDefaults[k].d,specs.byId('semesta:'+k).footprint[1]);
 }
});

test('Semesta Sprite Renderer handles custom-building rotations',()=>{
 const src=fs.readFileSync(path.join(root,'builder.js'),'utf8');
 assert.ok(src.includes("['pipeline-street','custom-building'].includes(spec.source)"));
 assert.ok(src.includes("plane.userData.pivotY=native.pivot[1]/native.size[1]"));
 assert.ok(src.includes("spec.source==='custom-building'?window.VLBuildingBridge?.image(spec.id,view)"));
});

test('Building Studio references shared Semesta specs and edits pixels without game writes',()=>{
 const studio=fs.readFileSync(path.join(root,'bangun-ruang/index.html'),'utf8');
 assert.ok(studio.includes('../semesta-building-spec.js'));
 assert.ok(studio.includes("spec.footprint[0],d:spec.footprint[1]"));
 assert.ok(studio.includes("pixelCanvas.toDataURL('image/png')"));
 assert.ok(studio.includes('studio:')===false);
});
