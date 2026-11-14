'use strict';
// NJH guide §11/§12 regression guard. Preview checks: no write to live map.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const city=JSON.parse(read('world-builder/njh-map-preview/city/njh-semesta-map-draft1.with-pending-assets.city.json')).record.document;
const window={VLAssetCatalog:[]};
for(const script of ['world-builder/vegetation-catalog.js','world-builder/style-rules.js','world-builder/map-terrain.js'])
 vm.runInNewContext(read(script),{window,Math,Map,Set},{filename:script});
const catalog=new Map(window.VLAssetCatalog.map(e=>[e.file,e]));
const PX=Math.SQRT2/64,PY=PX*2/Math.sqrt(3);
const terrain=new Map(city.map.terrain.cells.map(t=>[t.c+','+t.r,t.type]));
const trees=city.objects.filter(o=>/^vegetation:pohon_/.test(o.asset||''));
const allowed=new Set(['grass','plaza','soil','dirt','park']);

test('NJH-only city has 7 correctly oriented north-south grill covers',()=>{
 const gr=city.objects.filter(o=>o.asset==='pipeline:selokan_grill'&&o.id.startsWith('njh-grill--35-'));
 assert.equal(gr.length,7);
 for(const o of gr)assert.equal(o.rotation,90,o.id+' must follow r axis (se)');
});

test('every placed tree has solid ground trunk and a legal terrain footprint',()=>{
 assert.equal(trees.length,11);
 for(const o of trees){
  const spec=catalog.get(o.asset);
  assert.ok(spec,o.id+' has published source spec');
  assert.equal(o.collision,true,o.id+' trunk needs collision');
  assert.notEqual(o.blocking,'no',o.id+' trunk must block walk');
  assert.equal(o.rotation,0,o.id+' must remain billboard');
  assert.equal(o.y||0,0,o.id+' pivot must stay on ground');
  assert.equal(o.width,+(spec.size[0]*PX).toFixed(3),o.id+' width must obey iso lock');
  assert.equal(o.height,+(spec.size[1]*PY).toFixed(3),o.id+' height must obey iso lock');
  assert.ok(o.scale>=spec.minVisualScale,o.id+' must meet 2× LGR minimum visual scale');
  const [w,d]=window.VLWorldStyle.footprint(o,catalog);
  assert.equal(w,1.25,'tree physical trunk width cannot scale with canopy');
  assert.equal(d,1.25,'tree physical trunk depth cannot scale with canopy');
  for(let c=Math.floor(o.x-w/2);c<=Math.floor(o.x+w/2);c++)
   for(let r=Math.floor(o.z-d/2);r<=Math.floor(o.z+d/2);r++){
    const type=terrain.get(c+','+r)||city.map.terrain.default||'grass';
    assert.ok(allowed.has(type),o.id+' planted on forbidden '+type+' at '+c+','+r);
   }
 }
});

test('published tree catalog uses pixel-locked billboard dimensions, not multiplied size',()=>{
 for(const spec of catalog.values()){
  if(spec.group!=='Vegetation • trees')continue;
  assert.deepEqual([spec.width,spec.height],[+(spec.size[0]*PX).toFixed(3),+(spec.size[1]*PY).toFixed(3)]);
  assert.ok(spec.minVisualScale>=1,'catalog requires a minimum instance scale');
  const o={type:'sprite',asset:spec.file,rotation:0,scale:1};
  window.VLWorldStyle.normalize(o,catalog);
  assert.ok(o.scale>=spec.minVisualScale,'newly placed tree must be scaled to its minimum');
  assert.equal(window.VLWorldStyle.footprint(o,catalog)[0],1.25);
 }
});

test('terrain drains select a 90-degree in-plane rotation only along c',()=>{
 const t=city.map.terrain,idx=window.VLMapTerrain.dict(t);
 const drains=t.cells.filter(c=>c.type==='drain');
 const count={along_c:0,along_r:0,junction:0,isolated:0};
 for(const c of drains)count[window.VLMapTerrain.drainAxis(t,c.c,c.r,idx)]++;
 assert.equal(count.along_c,74,'74 horizontal drain tiles were baked vertically');
 assert.equal(count.along_r,72,'vertical channels retain their original UV axis');
 assert.equal(count.junction,1,'junctions must use future dedicated geometry');
 assert.equal(count.isolated,4,'isolated drain ends require inspection');
 const renderer=read('world-builder/builder.js');
 assert.match(renderer,/terrain\.drainAxis\?\.\(t,cell\.c,cell\.r,drainCells\)/);
 assert.match(renderer,/tmp\.rotateZ\(Math\.PI\/2\)/);
});

test('Pecel Lele and Sate Madura tents keep their sprite-proportional iso billboard',()=>{
 const w={VLAssetCatalog:[],location:{search:'?njhMap=1',href:'http://localhost/world-builder/index.html'},
  document:{getElementsByTagName:()=>[{src:'http://localhost/world-builder/njh-map-preview.js'}]}};
 vm.runInNewContext(read('world-builder/njh-map-preview.js'),{window:w,URLSearchParams,Math,Map,Set});
 w.VLNjhMapPreview.registerCatalog();
 for(const id of ['studio:br-warung-pecel-lele','studio:br-lapak-sate-madura']){
  const item=w.VLAssetCatalog.find(x=>x.file===id);
  assert.ok(item,'tent registered '+id);
  assert.equal(item.width,+(item.size[0]*PX).toFixed(3));
  assert.equal(item.height,+(item.size[1]*PY).toFixed(3));
 }
});
