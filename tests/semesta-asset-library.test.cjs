const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path='world-builder/';

const g={};
vm.runInNewContext(fs.readFileSync(path+'asset-library.js','utf8'),{window:g});
const library=g.VLSemestaAssetLibrary;
const pipeline=(id,group='kampung',published=true)=>({
 id,file:'pipeline:'+id,label:'Asset '+id,source:'pipeline-street',
 group,published,footprint:[3,3],variants:{sw:{file:'kampung/'+id+'_sw.png',size:[100,140],pivot:[50,125]}}
});
test('native urban building routes to Bangun Ruang editable new copy',()=>{
 const s=pipeline('id_warteg_sederhana');
 assert.equal(library.category(s),'building');
 assert.equal(library.canEdit(s),true);
 assert.equal(library.route(s),'./bangun-ruang/?sourceAsset=pipeline%3Aid_warteg_sederhana');
});
test('published props, vegetation, custom objects and studio assets have proper edit routes',()=>{
 for(const s of [
  pipeline('id_portal_gang','prop'),
  {id:'pohon_angsana',file:'vegetation:pohon_angsana',source:'pipeline-vegetation',published:true},
  {id:'obj-demo-123',file:'object:obj-demo-123',source:'bangun-object',published:true},
  {id:'br-rumah-123',file:'studio:br-rumah-123',source:'custom-building',published:true}
 ]){
  assert.ok(library.route(s),s.file);
  assert.match(library.route(s),/^\.\/bangun-ruang\/\?sourceAsset=/);
 }
 assert.equal(library.category(pipeline('id_portal_gang','prop')),'street');
 assert.equal(library.category({source:'pipeline-vegetation'}),'vegetation');
 assert.equal(library.category({source:'custom-building'}),'custom');
});
test('locked originals, metadata-only assets and non-authoring types are not editable',()=>{
 assert.equal(library.canEdit({source:'gpt-original',published:true}),false);
 assert.equal(library.canEdit(pipeline('id_waiting','prop',false)),false);
 assert.equal(library.route({file:'pipeline:../../x',source:'pipeline-street',published:true}),null);
 assert.equal(library.route({file:'vehicle:bus',source:'vehicle',published:true}),null);
 const cars=library.entries([pipeline('id_warteg_sederhana')],[{id:'angkot',label:'Angkot'}],[{id:'ichsan',name:'Ichsan'}]);
 assert.equal(cars.length,3);
 assert.equal(cars[1].category,'vehicle');assert.equal(cars[1].editTarget,null);
 assert.equal(cars[2].category,'character');assert.equal(cars[2].editTarget,null);
});
test('Asset Library is linked to placement UI and refreshes when Bangun Ruang writes storage',()=>{
 const html=fs.readFileSync(path+'index.html','utf8');
 const builder=fs.readFileSync(path+'builder.js','utf8');
 const css=fs.readFileSync(path+'asset-library.css','utf8');
 assert.match(html,/id="openAssetLibrary"/);
 assert.ok(html.indexOf('asset-library.js')<html.indexOf('builder.js?v='));
 assert.match(html,/asset-library\.css/);
 assert.match(builder,/VLSemestaAssetLibrary\?\.mount/);
 assert.match(builder,/assetLibrary\?\.refresh\(\)/);
 assert.match(builder,/placementType='sprite:'\+spec\.file/);
 assert.match(css,/#semestaAssetLibrary \.sal-gallery/);
});
test('Bangun Ruang has Save-as-new intake for real sprites and pixel objects',()=>{
 const html=fs.readFileSync(path+'bangun-ruang/index.html','utf8');
 const creator=fs.readFileSync(path+'bangun-ruang/pixel-object-creator.js','utf8');
 const loader=fs.readFileSync(path+'bangun-ruang/asset-library-intake.js','utf8');
 const objectBridge=fs.readFileSync(path+'bangun-ruang/object-bridge.js','utf8');
 const buildingBridge=fs.readFileSync(path+'bangun-ruang/semesta-bridge.js','utf8');
 assert.match(html,/window\.VLBangunEditorIntake=Object\.freeze/);
 assert.match(html,/current=null;importSourceAsset=spec\.file/);
 assert.match(html,/importSourceAsset='studio:'\+asset\.id/);
 assert.match(html,/manualOverrides\[d\]=\{url:c\.toDataURL\('image\/png'\)/);
 assert.match(html,/id="assetDescription"/);
 assert.match(html,/originSource:importSourceAsset/);
 assert.match(creator,/function openSource\(spec\)/);
 assert.match(creator,/objectId=null/);
 assert.match(creator,/g\.VLPixelCreator=Object\.freeze\(\{open,openSource\}\)/);
 assert.match(creator,/id="opcDescription"/);
 assert.match(loader,/VLBangunEditorIntake\.custom/);
 assert.match(loader,/VLBangunEditorIntake\.building/);
 assert.match(objectBridge,/description:String\(row\.description/);
 assert.match(buildingBridge,/description:String\(a\.description/);
});
test('all updated standalone scripts and Bangun Ruang inline scripts compile',()=>{
 const files=[
  'asset-library.js','bangun-ruang/asset-library-intake.js',
  'bangun-ruang/pixel-object-creator.js','bangun-ruang/object-bridge.js',
  'bangun-ruang/semesta-bridge.js'
 ];
 for(const file of files)assert.doesNotThrow(()=>new vm.Script(fs.readFileSync(path+file,'utf8'),{filename:file}));
 const html=fs.readFileSync(path+'bangun-ruang/index.html','utf8');
 const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map(m=>m[1]).filter(x=>x.trim());
 assert.ok(scripts.length>=2);
 for(const [i,script] of scripts.entries())assert.doesNotThrow(
  ()=>new vm.Script(script,{filename:'bangun-inline-'+i+'.js'}));
});
test('incoming route accepts only known source IDs and does not auto-edit without a URL',async()=>{
 const win={location:{search:''},VLAssetCatalog:[]};
 const document={readyState:'complete'};
 vm.runInNewContext(fs.readFileSync(path+'bangun-ruang/asset-library-intake.js','utf8'),
  {window:win,document,console,URLSearchParams});
 await assert.rejects(win.VLAssetLibraryIntake.open('pipeline:../../file'),/ID aset/);
 await assert.rejects(win.VLAssetLibraryIntake.open('vehicle:angkot'),/ID aset/);
});
