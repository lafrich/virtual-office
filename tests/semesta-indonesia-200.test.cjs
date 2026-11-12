const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');

const file='world-builder/indonesia-assets.js';
const moduleSource=fs.readFileSync(file,'utf8');
function item(id='id200_warung_warteg_etalase_hijau',label='Warteg',category='warung'){
 return {id,file:'pipeline:'+id,label,category,group:'kampung',
  source:'pipeline-street',pack:'indonesia-200-v1',published:true,
  objectCategory:'building',footprint:[4.1,2],variants:{
   sw:{file:'kampung/'+id+'_sw.png',size:[208,206],pivot:[95,157]},
   se:{file:'kampung/'+id+'_se.png',size:[208,206],pivot:[94,157]},
   ne:{file:'kampung/'+id+'_ne.png',size:[208,206],pivot:[95,157]},
   nw:{file:'kampung/'+id+'_nw.png',size:[208,206],pivot:[94,157]}
  }};
}
function mock(legacy=[],expansion=[],failNew=false){
 const calls=[];
 const g={VLAssetCatalog:Object.freeze([]),VLPipelineAssets:Object.freeze({
  building:id=>id==='ruko_a'?'old-url':null,prefabs:[]
 })};
 const fetch=async url=>{
  calls.push(url);
  const isNew=url.endsWith('indonesia_200_catalog.json');
  const isCustom=url.endsWith('indonesia_custom_catalog.json');
  const isGameplay=url.endsWith('mainkan_gameplay_catalog.json');
  return {ok:!isCustom&&!isGameplay&&(!isNew||!failNew),status:isCustom||isGameplay||(isNew&&failNew)?404:200,
   json:async()=>({projection:'isometric-2:1',assets:isNew?expansion:legacy})};
 };
 vm.runInNewContext(moduleSource,{window:g,fetch,URL,console:{warn(){}}});
 return {g,calls};
}
test('180 retained Indonesian sprites load from secondary published manifest',async()=>{
 const all=Array.from({length:180},(_,i)=>
  item('id200_warung_unique_'+i,'Indonesia '+i));
 const {g,calls}=mock([],all);
 const out=await g.VLIndonesiaAssets.load();
 assert.equal(out.loaded,true);assert.equal(out.count,180);
 assert.equal(out.packs,2);
 assert.equal(g.VLAssetCatalog.length,180);
 assert.equal(g.VLPipelineAssets.prefabs.length,180);
 assert.equal(new Set(g.VLAssetCatalog.map(x=>x.file)).size,180);
 assert.equal(g.VLPipelineAssets.building(all[0].id,'ne'),
  'https://raw.githubusercontent.com/lafrich/virtual-life-asset-pipeline/main/assets/street_buildings/'+all[0].variants.ne.file+'?v='+g.VLIndonesiaAssets.IMAGE_REV);
 assert.equal(g.VLPipelineAssets.building('ruko_a'),'old-url');
 assert.equal(g.VLIndonesiaAssets.cacheBust(all[0],'https://example.com/png.png'),
  'https://example.com/png.png?v='+g.VLIndonesiaAssets.IMAGE_REV);
 assert.equal(g.VLIndonesiaAssets.cacheBust({pack:'indonesia-v1'},'https://example.com/old.png'),
  'https://example.com/old.png');
 assert.equal(calls.length,4);
 assert.ok(calls.some(x=>x.endsWith('mainkan_gameplay_catalog.json')));
 assert.ok(calls.some(x=>x.endsWith('indonesia_200_catalog.json')));
 assert.equal((await g.VLIndonesiaAssets.load()).count,180);
 assert.equal(g.VLAssetCatalog.length,180,'no duplicate on second call');
});
test('legacy pack loads safely when new 200 PNG manifest has not been published',async()=>{
 const old=item('id_warteg_sederhana','Warteg','warung');
 old.pack='indonesia-v1';
 const {g}=mock([old],[],true);
 assert.equal((await g.VLIndonesiaAssets.load()).count,1);
 assert.equal(g.VLPipelineAssets.building(old.id).endsWith('id_warteg_sederhana_sw.png'),true);
});
test('invalid/unsafe metadata and false published flags never reach placement',async()=>{
 const valid=item();
 const escape={...item('id200_warung_bad'),variants:{sw:{
  file:'../../bad.png',size:[88,88],pivot:[44,64]
 }}};
 const badGeo={...item('id200_warung_badpivot'),variants:{sw:{
  file:'kampung/id200_warung_badpivot_sw.png',size:[88,88],pivot:[222,64]
 }}};
 const notPublished={...item('id200_warung_draft'),published:false};
 const {g}=mock([],[escape,badGeo,notPublished,valid]);
 assert.equal((await g.VLIndonesiaAssets.load()).count,1);
 assert.equal(g.VLAssetCatalog[0].id,valid.id);
});
test('Semesta gallery and quick Assets panel expose Indonesia 200 without breaking editing',()=>{
 const gallery=fs.readFileSync('world-builder/asset-library.js','utf8');
 const builder=fs.readFileSync('world-builder/builder.js','utf8');
 assert.ok(gallery.includes("indo200:'INDONESIA / WORLD PACK'"));
 assert.ok(gallery.includes("filter==='indo200'&&s.pack==='indonesia-200-v1'"));
 assert.ok(gallery.includes("spec?.objectCategory==='vehicle'"));
 assert.ok(builder.includes("spec.pack==='indonesia-200-v1'"));
 assert.ok(builder.includes("await window.VLIndonesiaAssets?.load()"));
});

test('retired Indonesia 200 vehicles never reload, even from stale manifests',async()=>{
 const valid=item();
 const retired={...item('id200_transport_angkot_kota','Angkot','transport'),
  group:'prop',objectCategory:'vehicle'};
 const {g}=mock([],[retired,valid]);
 const result=await g.VLIndonesiaAssets.load();
 assert.equal(result.count,1);
 assert.equal(g.VLAssetCatalog.length,1);
 assert.equal(g.VLAssetCatalog[0].id,valid.id);
 assert.equal(g.VLPipelineAssets.building(retired.id,'se'),null);
});
