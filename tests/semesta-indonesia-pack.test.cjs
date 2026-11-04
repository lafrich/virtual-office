const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

function environment(assets,ok=true){
 const root={VLAssetCatalog:Object.freeze([{id:'ruko_a',file:'pipeline:ruko_a',source:'pipeline-street'}]),
  VLPipelineAssets:Object.freeze({prefabs:[],building:(id)=>id==='ruko_a'?'old-ruko-url':null})};
 const responses=[];
 const fetch=async(url,opts)=>{responses.push({url,opts});return {
  ok,status:ok?200:404,json:async()=>({version:1,projection:'isometric-2:1',assets})
 }};
 const ctx={window:root,fetch,console:{warn(){}}};
 vm.runInNewContext(fs.readFileSync('world-builder/indonesia-assets.js','utf8'),ctx);
 return {root,responses};
}
const entry=()=>({id:'id_warteg_sederhana',file:'pipeline:id_warteg_sederhana',
 label:'Warteg',group:'kampung',source:'pipeline-street',published:true,
 pack:'indonesia-v1',footprint:[3,3],variants:{
  sw:{file:'kampung/id_warteg_sederhana_sw.png',size:[214,216],pivot:[90,175]},
  se:{file:'kampung/id_warteg_sederhana_se.png',size:[192,216],pivot:[90,175]}
 }});

test('published Indonesia manifest becomes actual playable catalog, with exact upstream PNG URL',async()=>{
 const {root,responses}=environment([entry()]);
 const s=await root.VLIndonesiaAssets.load();
 assert.equal(s.loaded,true);assert.equal(s.count,1);
 assert.equal(root.VLAssetCatalog.length,2);
 assert.equal(root.VLAssetCatalog[1].pack,'indonesia-v1');
 assert.equal(root.VLPipelineAssets.building('id_warteg_sederhana','se'),
 'https://raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/main/assets/street_buildings/kampung/id_warteg_sederhana_se.png');
 assert.equal(root.VLPipelineAssets.building('ruko_a'),'old-ruko-url');
 assert.match(responses[0].url,/indonesia_catalog\.json$/);
 assert.equal(responses[0].opts.cache,'no-store');
 assert.equal((await root.VLIndonesiaAssets.load()).count,1,'avoid duplicate insert');
 assert.equal(root.VLAssetCatalog.length,2);
});

test('missing catalog fails safely, leaving existing asset browser untouched',async()=>{
 const {root}=environment([],false);
 assert.equal((await root.VLIndonesiaAssets.load()).loaded,false);
 assert.equal(root.VLAssetCatalog.length,1);
 assert.equal(root.VLPipelineAssets.building('ruko_a'),'old-ruko-url');
});

test('malformed file paths in manifest are rejected',async()=>{
 const bad=entry();bad.variants.sw.file='../../secrets/unknown.png';
 const {root}=environment([bad]);
 assert.equal((await root.VLIndonesiaAssets.load()).loaded,false);
 assert.equal(root.VLAssetCatalog.length,1);
});

test('Semesta loads the Indonesia pack before caching catalog, exposes placement and thumbnails',()=>{
 const html=fs.readFileSync('world-builder/index.html','utf8');
 const builder=fs.readFileSync('world-builder/builder.js','utf8');
 const thumbs=fs.readFileSync('world-builder/asset-thumbnails.js','utf8');
 assert.ok(html.indexOf('indonesia-assets.js')>html.indexOf('pipeline-catalog.js'));
 assert.ok(html.indexOf('indonesia-assets.js')<html.indexOf('builder.js?v='));
 assert.match(html,/<option value="indonesia">INDONESIA \/ CITY PACK<\/option>/);
 assert.match(builder,/await window\.VLIndonesiaAssets\?\.load\(\)/);
 assert.ok(builder.indexOf('await window.VLIndonesiaAssets?.load()')<
   builder.indexOf('let assetCatalog=window.VLAssetCatalog||[]'));
 assert.match(builder,/if\(spec\.pack==='indonesia-v1'\)return 'indonesia'/);
 assert.match(thumbs,/source==='pipeline-street'/);
 assert.match(builder,/pipelineGround\.attach\(THREE,root,spec,view/);
});
