const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function fixture(){
 const ids=['lampu_taman_jakarta','tong_sampah_jakarta','hydrant_jakarta',
  'semak_kota_pagar','semak_kota_pendek','semak_kota_rimbun',
  'rumput_kota_rumpun','rumput_kota_hampar','aspal_patch_jakarta',
  'selokan_lurus','selokan_belok','selokan_simpang','selokan_grill',
  'sungai_lurus','sungai_tepi_kiri','sungai_tepi_kanan','sungai_belok'];
 const assets=ids.map(id=>({id,file:'pipeline:'+id,label:id,pack:'jakarta-urban-v1',
  published:true,source:'pipeline-street',group:id.startsWith('hydrant')?'prop':'taman',
  footprint:[1,1],size:[40,80],pivot:[20,72],width:1,height:2,
  variants:{sw:{file:(id.startsWith('hydrant')?'props':'taman')+'/'+id+'_sw.png',
             size:[40,80],pivot:[20,72]}}}));
 const root={VLAssetCatalog:Object.freeze([
   {id:'lampu_taman',file:'pipeline:lampu_taman',source:'pipeline-street',published:true},
   {id:'tong_sampah',file:'pipeline:tong_sampah',source:'pipeline-street',published:true},
   {id:'kantor_a',file:'pipeline:kantor_a',source:'pipeline-street',published:true}
 ]),VLPipelineAssets:Object.freeze({prefabs:[],building:(id)=>'legacy:'+id})};
 const ctx={window:root,console:{warn(){}},fetch:async()=>({
   ok:true,json:async()=>({projection:'isometric-2:1',assets,
     aliases:{lampu_taman:'lampu_taman_jakarta',tong_sampah:'tong_sampah_jakarta'}})
 })};
 vm.runInNewContext(fs.readFileSync('world-builder/jakarta-urban-assets.js','utf8'),ctx);
 return {root,assets};
}
test('17 Jakarta v6b sprites publish and alias legacy lamp/bin without changing saved IDs',async()=>{
 const {root}=fixture();
 const result=await root.VLJakartaUrban.load();
 assert.equal(result.loaded,true);
 assert.equal(result.count,17);
 const lamps=root.VLAssetCatalog.filter(x=>x.file==='pipeline:lampu_taman');
 assert.equal(lamps.length,1,'old saved sprite file ID remains compatible');
 assert.equal(lamps[0].variants.sw.file,'taman/lampu_taman_jakarta_sw.png');
 assert.match(root.VLPipelineAssets.building('lampu_taman','sw'),/taman\/lampu_taman_jakarta_sw\.png\?v=/);
 assert.match(root.VLPipelineAssets.building('tong_sampah','sw'),/taman\/tong_sampah_jakarta_sw\.png\?v=/);
 assert.equal(root.VLPipelineAssets.building('kantor_a'),'legacy:kantor_a');
 assert.equal(root.VLAssetCatalog.filter(e=>e.file==='pipeline:hydrant_jakarta').length,1);
 assert.equal((await root.VLJakartaUrban.load()).loaded,true);
 assert.equal(root.VLAssetCatalog.length,18);
});
test('malformed Jakarta catalog never overwrites previous published assets',async()=>{
 const {root}=fixture();
 const before=root.VLAssetCatalog;
 vm.runInNewContext(fs.readFileSync('world-builder/jakarta-urban-assets.js','utf8'),
  {window:root,console:{warn(){}},fetch:async()=>({ok:false,status:404})});
 const result=await root.VLJakartaUrban.load();
 assert.equal(result.loaded,false);assert.equal(root.VLAssetCatalog,before);
 assert.equal(root.VLPipelineAssets.building('lampu_taman'),'legacy:lampu_taman');
});
test('Semesta paint types include nonwalkable urban river and drain and use native pipeline textures',()=>{
 const root={};
 vm.runInNewContext(fs.readFileSync('world-builder/map-terrain.js','utf8'),{window:root});
 vm.runInNewContext(fs.readFileSync('world-builder/kebon-sirih-style.js','utf8'),{window:root});
 assert.ok(root.VLMapTerrain.types.includes('river'));
 assert.ok(root.VLMapTerrain.types.includes('drain'));
 assert.equal(root.VLMapTerrain.normalize({default:'grass',cells:[{c:1,r:2,type:'drain'},
   {c:2,r:2,type:'river'}]},null).cells.length,2);
 assert.match(root.VLKebonSirihStyle.tileUrl('river'),/terrain\/river\.png\?v=/);
 assert.match(root.VLKebonSirihStyle.tileUrl('drain'),/terrain\/drain\.png\?v=/);
 const js=fs.readFileSync('world-builder/builder.js','utf8');
 const html=fs.readFileSync('world-builder/index.html','utf8');
 const schema=fs.readFileSync('world-builder/map-schema.js','utf8');
 const phys=fs.readFileSync('world-builder/world-physics.js','utf8');
 assert.match(js,/tag:'terrain:river'/);
 assert.match(js,/tag:'terrain:drain'/);
 assert.ok(html.indexOf('jakarta-urban-assets.js')<html.indexOf('builder.js?v='));
 assert.ok(js.indexOf('await window.VLJakartaUrban?.load()')<js.indexOf('let assetCatalog=window.VLAssetCatalog||[]'));
 assert.match(schema,/water','river','drain','road/);
 assert.match(phys,/\['water','river','drain'\]/);
});
