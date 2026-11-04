const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const w={},ctx={window:w,console};
const run=file=>vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
run('world-builder/pipeline-catalog.js');
run('world-builder/vegetation-catalog.js');
run('world-builder/map-terrain.js');
run('world-builder/kebon-sirih-style.js');
const theme=w.VLKebonSirihStyle,terrain=w.VLMapTerrain,catalog=w.VLAssetCatalog;
const buildings=catalog.filter(x=>x.source==='pipeline-street'&&x.published===true);
const trees=catalog.filter(x=>x.source==='pipeline-vegetation'&&x.group==='Vegetation • trees'&&x.published===true);
test('all terrain types have pipeline-native tile URLs and source metadata',()=>{
 assert.equal(Object.keys(theme.TILES).length,11);
 for(const kind of terrain.types)assert.match(theme.tileUrl(kind==='road'?'road_asphalt':kind),/^https:\/\/raw\.githubusercontent\.com\/lafrich\/virtual-life-asset-pipeline\/main\/assets\/kebon_sirih\/terrain\/[^/]+\.png$/);
 assert.equal(theme.tile('road',{surface:'concrete'}),'road_concrete');
 assert.equal(theme.tile('road',{}),'road_asphalt');
 const index=new Map([['3,2','sidewalk'],['3,1','road']]);
 assert.equal(theme.tile('sidewalk',{c:3,r:2},index),'sidewalk_edge_n');
 assert.equal(theme.tile('sidewalk',{c:5,r:7},index),'sidewalk');
});
test('concrete road material survives map normalize',()=>{
 const doc=terrain.normalize({default:'grass',cells:[{c:7,r:8,type:'road',roadClass:'two_lane',surface:'concrete'},{c:8,r:8,type:'road'}]},null);
 assert.equal(doc.cells[0].surface,'concrete');
 assert.equal(doc.cells[0].roadClass,'two_lane');
 assert.equal(doc.cells[1].surface,undefined);
});
test('published building and infrastructure classes are available',()=>{
 const ids=new Set(buildings.map(x=>x.id));
 for(const name of ['kantor_a','mall','masjid','ruko_a','rumah_kampung_d','tiang_listrik','tiang_trafo','lampu_taman','bangku_taman','gazebo'])
  assert.ok(ids.has(name),'Expected native pipeline asset '+name);
 assert.equal(trees.length,22);
 for(const s of [...buildings,...trees]){
  assert.ok(s.size?.length===2&&s.pivot?.length===2,s.id);
 }
});
const specimen=[
 {id:'ref-building',type:'building',name:'Small Office',subtype:'office',w:4,d:4,h:6,x:10,z:20,y:0,scale:1,tags:['reference-city'],replaceable:true},
 {id:'ref-utility',type:'lamp',name:'Street Light',x:20,z:30,y:0,scale:1,tags:['reference-city']},
 {id:'ref-forest',type:'tree',name:'Forest Tree',x:40,z:30,y:0,scale:1,tags:['reference-city','forest']},
 {id:'ref-bench',type:'bench',name:'Park Bench',x:50,z:30,y:0,scale:1,tags:['reference-city']},
 {id:'user-warteg',type:'sprite',name:'Warteg Custom',asset:'bangun:some-studio-file',x:60,z:30,y:0,scale:1,tags:['bangun-ruang']},
 {id:'player',type:'avatar',name:'Player',x:60,z:32,y:0,scale:1}
];
test('upgrade converts default templates, retains original positions, metadata and custom sprites',()=>{
 const src={map:{name:'Reference City · Isometric Town',preset:'reference-city-v1',terrain:{default:'grass',cells:[]}},objects:specimen};
 const result=theme.upgrade(src,catalog);
 assert.equal(result.changed,4);
 assert.equal(result.skipped,0);
 assert.deepEqual(Array.from(result.map.objects,x=>[x.id,x.x,x.z]),specimen.map(x=>[x.id,x.x,x.z]));
 assert.equal(result.map.objects[0].type,'sprite');
 assert.equal(result.map.objects[1].type,'sprite');
 assert.equal(result.map.objects[2].type,'sprite');
 assert.equal(result.map.objects[3].asset,'pipeline:bangku_taman');
 assert.equal(result.map.objects[4],specimen[4]);
 assert.equal(result.map.objects[5],specimen[5]);
 assert.equal(result.map.map.visualStyle,theme.VERSION);
 assert.notEqual(result.map,src);
 assert.equal(result.map.objects[0].w,undefined);
 assert.equal(result.map.objects[0].name,'Small Office');
 const second=theme.upgrade(result.map,catalog);
 assert.equal(second.changed,0);
});
test('user-made non-placeholder building is protected',()=>{
 const custom={id:'custom-1',type:'building',w:8,d:7,x:1,z:3,tags:['custom']};
 const result=theme.upgrade({map:{name:'My City'},objects:[custom]},catalog);
 assert.equal(result.changed,0);assert.equal(result.map.objects[0],custom);
});
test('the authored reference map can be fully converted',()=>{
 run('world-builder/reference-city.js');
 const initial=JSON.parse(fs.readFileSync('world-builder/world.json','utf8'));
 const dummyStyle={reason:()=>'',footprint:()=>[1,1],normalize:x=>x};
 const dummySchema={normalize:x=>x};
 const city=w.VLReferenceCity.create(initial,new Map(catalog.map(x=>[x.file,x])),dummyStyle,dummySchema);
 const eligible=city.objects.filter(o=>theme.eligible(o,true));
 assert.ok(eligible.length>80,'Reference City should contain many replaceable objects');
 const upgraded=theme.upgrade(city,catalog);
 assert.equal(upgraded.changed,eligible.length,'All authored placeholder classes have published native replacements');
 assert.equal(upgraded.skipped,0);
 assert.deepEqual(Array.from(upgraded.map.objects,x=>x.id),Array.from(city.objects,x=>x.id));
 assert.equal(upgraded.map.objects.length,city.objects.length);
});
test('renderer uses texture with pixel filtering, batches and retains full world geometry',()=>{
 const script=fs.readFileSync('world-builder/builder.js','utf8');
 const page=fs.readFileSync('world-builder/index.html','utf8');
 assert.ok(script.includes("cityStyle?.tile(cell.type,cell,tileIndex)"));
 assert.ok(script.includes('THREE.NearestFilter'));
 assert.ok(script.includes('new THREE.InstancedMesh'));
 assert.ok(script.includes('window.VLKebonSirihStyle?.upgrade(defaultSeed,assetCatalog)'));
 assert.ok(page.indexOf('kebon-sirih-style.js')<page.indexOf('builder.js?v='));
});
